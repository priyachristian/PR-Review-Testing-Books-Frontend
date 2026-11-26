import * as Yup from 'yup';
import { TEMPLATE_META } from './whatsappTemplates';

export const WEEK_DAY_OPTIONS = [
  { label: 'Sunday', value: 'SUNDAY' },
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
];

export const MONTH_DATE_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

export const SCHEDULE_TYPES = ['daily', 'weekly', 'monthly'];

export const TEMPLATE_KEYS = TEMPLATE_META.map(t => t.key);

const DEFAULT_TIME = '10:30';
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export const WHATSAPP_FEATURE_KEY = 'WHATSAPP_CONFIG';

/** Coerce to a non-negative phone limit, preserving an explicit 0. No hardcoded ceiling — Infinity means unlimited. */
const clampMaxPhones = (maxPhones, fallback = 0) => {
  const numeric = Number(maxPhones);
  if (numeric === Infinity) return Infinity;
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : fallback;
};

/**
 * Resolve WHATSAPP_CONFIG plan flags.
 * isEnabled comes from the settings-feature-plan map; maxPhones comes entirely from the admin-summary-setting
 * response's whatsappRecipientsLimit (the account-specific entitlement) — no hardcoded plan number.
 */
export const getWhatsappPlanLimits = (featureInPlanMap, recipientsLimit) => {
  const whatsappPlan = featureInPlanMap?.[WHATSAPP_FEATURE_KEY];
  // Missing entry: stay enabled until settings-feature-plan hydrates (avoids upgrade CTA flash).
  const isEnabled = whatsappPlan == null ? true : Boolean(whatsappPlan.isEnabled);

  const maxPhones = recipientsLimit == null ? 0 : recipientsLimit.isUnlimited ? Infinity : clampMaxPhones(recipientsLimit.limit, 0);

  return {
    isEnabled,
    maxPhones,
  };
};

/** Normalize API / form phone values into a string array (legacy string supported). */
export const normalizeAdminPhoneNumbers = (value, maxPhones = Infinity) => {
  const limit = clampMaxPhones(maxPhones);

  if (Array.isArray(value)) {
    return value
      .map(p => String(p || '').trim())
      .filter(Boolean)
      .slice(0, limit);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()].slice(0, limit);
  return [];
};

const toFormPhoneNumbers = (value, maxPhones) => {
  const phones = normalizeAdminPhoneNumbers(value, maxPhones);
  return phones.length ? phones : [''];
};

/** Trim every template's adminPhoneNumber to the plan limit (used on load). */
export const trimWhatsappConfigPhones = (config, maxPhones = 0) => {
  if (!config || typeof config !== 'object') return config;
  const templates = Array.isArray(config.templates)
    ? config.templates.map(template => {
        if (!template || typeof template !== 'object') return template;
        return {
          ...template,
          adminPhoneNumber: normalizeAdminPhoneNumbers(template.adminPhoneNumber, maxPhones),
        };
      })
    : [];
  return { ...config, templates };
};

/* ---------- Per-template config (enabled + phones + schedules) ---------- */

export const buildTemplateFormValues = (config, key, maxPhones = 0) => {
  const t = (config?.templates || []).find(x => x.key === key) || {};
  const legacyIncremental = Boolean(t.incremental);
  return {
    enabled: Boolean(t.enabled),
    adminPhoneNumber: toFormPhoneNumbers(t.adminPhoneNumber, maxPhones),
    dailyEnabled: Boolean(t.daily?.enabled),
    dailyTime: t.daily?.time || DEFAULT_TIME,
    dailyIncremental: t.daily?.incremental !== undefined ? Boolean(t.daily.incremental) : legacyIncremental,
    weeklyEnabled: Boolean(t.weekly?.enabled),
    weeklyDay: t.weekly?.day || 'MONDAY',
    weeklyTime: t.weekly?.time || DEFAULT_TIME,
    weeklyIncremental: t.weekly?.incremental !== undefined ? Boolean(t.weekly.incremental) : legacyIncremental,
    monthlyEnabled: Boolean(t.monthly?.enabled),
    monthlyDate: t.monthly?.date || 1,
    monthlyTime: t.monthly?.time || DEFAULT_TIME,
  };
};

export const createTemplateValidateSchema = (maxPhones = 0) => {
  const limit = clampMaxPhones(maxPhones);
  const phoneLabel = limit === 1 ? 'phone number' : 'phone numbers';

  return Yup.object({
    enabled: Yup.boolean(),
    adminPhoneNumber: Yup.array().when('enabled', {
      is: true,
      then: schema =>
        schema
          .of(Yup.string().trim().required('Phone number is required').matches(PHONE_PATTERN, 'Admin phone number must be a valid phone number (10–15 digits)'))
          .min(1, 'At least one admin phone number is required')
          .max(limit, `You can add up to ${limit} ${phoneLabel}`)
          .test('unique-phones', 'Phone numbers must be unique', phones => {
            const normalized = (phones || []).map(p => String(p || '').trim()).filter(Boolean);
            return normalized.length === new Set(normalized).size;
          }),
      otherwise: schema => schema.notRequired(),
    }),
  }).test('template-needs-schedule', 'Enable at least one schedule (daily, weekly, or monthly)', value => !value?.enabled || value.dailyEnabled || value.weeklyEnabled || value.monthlyEnabled);
};

const buildTemplateEntry = (key, tv, maxPhones = Infinity) => {
  const entry = {
    key,
    enabled: true,
    adminPhoneNumber: normalizeAdminPhoneNumbers(tv.adminPhoneNumber, maxPhones),
  };
  const supportsIncremental = key === 'financialSummary' || key === 'salesPipeline' || key === 'quotationsSummary' || key === 'topPerformers' || key === 'inventoryMovement';
  if (tv.dailyEnabled) {
    entry.daily = {
      enabled: true,
      time: tv.dailyTime,
      ...(supportsIncremental ? { incremental: Boolean(tv.dailyIncremental) } : {}),
    };
  }
  if (tv.weeklyEnabled) {
    entry.weekly = {
      enabled: true,
      day: tv.weeklyDay,
      time: tv.weeklyTime,
      ...(supportsIncremental ? { incremental: Boolean(tv.weeklyIncremental) } : {}),
    };
  }
  if (tv.monthlyEnabled) {
    entry.monthly = { enabled: true, date: Number(tv.monthlyDate), time: tv.monthlyTime };
  }
  return entry;
};

// Merge one template's edits into the full array — upsert when enabled, drop when off.
export const upsertTemplate = (templates, key, tv, maxPhones = 0) => {
  const rest = (templates || []).filter(t => t.key !== key);
  return tv?.enabled ? [...rest, buildTemplateEntry(key, tv, maxPhones)] : rest;
};

export const isTemplateEnabled = (config, key) => Boolean((config?.templates || []).find(t => t.key === key)?.enabled);

export const getTemplateAdminPhones = (config, key, maxPhones = 0) => {
  const t = (config?.templates || []).find(x => x.key === key);
  return normalizeAdminPhoneNumbers(t?.adminPhoneNumber, maxPhones);
};

export const getTemplateScheduleSummary = (config, key) => {
  const t = (config?.templates || []).find(x => x.key === key);
  if (!t?.enabled) return [];
  const parts = [];
  if (t.daily?.enabled) parts.push(`Daily · ${t.daily.time}`);
  if (t.weekly?.enabled) {
    const day = WEEK_DAY_OPTIONS.find(o => o.value === t.weekly.day)?.label?.slice(0, 3) || t.weekly.day;
    parts.push(`Weekly · ${day} ${t.weekly.time}`);
  }
  if (t.monthly?.enabled) parts.push(`Monthly · ${t.monthly.date} ${t.monthly.time}`);
  return parts;
};

export const composeWhatsappPayload = ({ templates }) => ({
  templates: Array.isArray(templates) ? templates : [],
});

/* ---------- Active-schedule chips for the page display ---------- */

const TEMPLATE_NAME_BY_KEY = new Map(TEMPLATE_META.map(t => [t.key, t.name]));

export const getScheduleDetails = config => {
  const details = [];
  (config?.templates || []).forEach(t => {
    if (!t?.enabled) return;
    const name = TEMPLATE_NAME_BY_KEY.get(t.key) || t.key;

    if (t.daily?.enabled) {
      details.push({ key: `${t.key}-daily`, title: name, detail: `Daily at ${t.daily.time}` });
    }
    if (t.weekly?.enabled) {
      const dayLabel = WEEK_DAY_OPTIONS.find(o => o.value === t.weekly.day)?.label || t.weekly.day;
      details.push({ key: `${t.key}-weekly`, title: name, detail: `Weekly · ${dayLabel} at ${t.weekly.time}` });
    }
    if (t.monthly?.enabled) {
      details.push({ key: `${t.key}-monthly`, title: name, detail: `Monthly · day ${t.monthly.date} at ${t.monthly.time}` });
    }
  });

  return details;
};

export const hasAnyEnabledTemplate = config => (config?.templates || []).some(t => t?.enabled);
