import { useMemo } from 'react';
import { FieldArray, Formik } from 'formik';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { TimePicker } from 'antd';

dayjs.extend(customParseFormat);

import { Switch, Form } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput, { CustomLabel } from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import Icons from '@/assets/icons/icon';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import { WEEK_DAY_OPTIONS, MONTH_DATE_OPTIONS, buildTemplateFormValues, createTemplateValidateSchema, upsertTemplate } from '../whatsappConfig.schema';
import { CATEGORY_STYLES } from '../whatsappTemplates';

const TimeField = ({ id, value, onChange }) => (
  <Form.Item label={<CustomLabel label="Time" name={id} required />}>
    <TimePicker
      id={id}
      className="w-full"
      format="HH:mm"
      value={value ? dayjs(value, 'HH:mm') : null}
      onChange={time => onChange(time ? time.format('HH:mm') : '')}
      allowClear={false}
      needConfirm={false}
    />
  </Form.Item>
);

const ScheduleSection = ({ icon, label, description, checked, onToggle, children, disabled = false, accent, accentBorder, accentBg }) => (
  <div className="rounded-lg border transition-colors mt-2.5" style={{ borderColor: checked ? accentBorder : '#e5e7eb', backgroundColor: checked ? accentBg : '#fff' }}>
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: checked ? '#fff' : '#f5f5f5', color: checked ? accent : '#9ca3af' }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#030711] leading-tight">{label}</p>
        <p className="text-xs text-[#6b7280] leading-tight mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onChange={onToggle} disabled={disabled} />
    </div>
    {checked ? (
      <div className="px-3 pb-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t" style={{ borderColor: accentBorder }}>
        {children}
      </div>
    ) : null}
  </div>
);

const phoneFieldError = (errors, index) => {
  const fieldErrors = errors?.adminPhoneNumber;
  if (Array.isArray(fieldErrors)) return fieldErrors[index];
  return typeof fieldErrors === 'string' ? fieldErrors : undefined;
};

const phoneFieldTouched = (touched, index, submitCount) => {
  if (submitCount > 0) return true;
  const fieldTouched = touched?.adminPhoneNumber;
  if (Array.isArray(fieldTouched)) return Boolean(fieldTouched[index]);
  return Boolean(fieldTouched);
};

const INCREMENTAL_TEMPLATE_HINTS = {
  financialSummary: {
    daily: 'Send daily_financial_summary_inc (includes month-to-date).',
    weekly: 'Send weekly_financial_summary_inc (includes month-to-date).',
  },
  salesPipeline: {
    daily: 'Send daily_sales_pipeline_snapshot_inc (includes month-to-date).',
    weekly: 'Send weekly_sales_pipeline_snapshot_inc (includes month-to-date).',
  },
  quotationsSummary: {
    daily: 'Send daily_quotation_summary_inc (includes month-to-date).',
    weekly: 'Send weekly_quotation_summary_inc (includes month-to-date).',
  },
  topPerformers: {
    daily: 'Send daily_top_performers_inc (includes month-to-date).',
    weekly: 'Send weekly_top_performers_inc (includes month-to-date).',
  },
  inventoryMovement: {
    daily: 'Send daily_inventory_movement_inc (includes month-to-date).',
    weekly: 'Send weekly_inventory_movement_inc (includes month-to-date).',
  },
};

const TemplateConfigModal = ({ open, setOpen, template, config, onSave, saving = false, maxPhones = 0, planEnabled = true }) => {
  const { colorPalette } = useTheme();
  const primary = colorPalette.primary;
  const numericMaxPhones = Number(maxPhones);
  const phoneLimit = numericMaxPhones === Infinity ? Infinity : Number.isFinite(numericMaxPhones) ? Math.max(numericMaxPhones, 0) : 0;
  const initialValues = useMemo(() => buildTemplateFormValues(config, template.key, phoneLimit), [config, template.key, open, phoneLimit]);
  const validationSchema = useMemo(() => createTemplateValidateSchema(phoneLimit), [phoneLimit]);
  const cat = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.Sales;
  const readOnly = !planEnabled;
  const scheduleAccent = { accent: primary[500], accentBorder: primary[200], accentBg: primary[50] };

  const handleSubmit = async values => {
    if (readOnly) return;
    const phones = Array.isArray(values.adminPhoneNumber) ? values.adminPhoneNumber.filter(p => String(p || '').trim()) : [];
    if (values.enabled && phones.length > phoneLimit) return;

    const result = await onSave(upsertTemplate(config?.templates || [], template.key, values, phoneLimit));
    if (result?.meta?.requestStatus === 'fulfilled') setOpen(false);
  };

  const phoneHelper = !Number.isFinite(phoneLimit)
    ? 'You can add unlimited phone numbers on your plan'
    : phoneLimit === 1
      ? `You can add up to ${phoneLimit} phone number on your plan`
      : `You can add up to ${phoneLimit} phone numbers on your plan`;

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={next => {
        if (!next) setOpen(false);
      }}
      destroyOnClose
      width={560}
      title={
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.bg }}>
            {template.emoji}
          </span>
          <div>
            <p className="text-base font-semibold text-[#030711] leading-tight">{template.name}</p>
            <p className="text-xs text-[#6b7280] leading-tight">{template.purpose}</p>
          </div>
        </div>
      }
    >
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, errors, touched, submitCount, setFieldValue, resetForm, handleSubmit: submit }) => {
          const setField = (field, val) => setFieldValue(field, val);
          const noSchedule = values.enabled && !values.dailyEnabled && !values.weeklyEnabled && !values.monthlyEnabled;
          const phones = Array.isArray(values.adminPhoneNumber) ? values.adminPhoneNumber : [''];
          const canAddPhone = !readOnly && phones.length < phoneLimit;

          const handleEnabledChange = checked => {
            if (readOnly) return;
            if (checked) {
              setField('enabled', true);
              return;
            }
            resetForm({ values: { ...initialValues, enabled: false } });
          };

          return (
            <CustomForm name="TemplateConfigModal" onFinish={submit}>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-3.5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#030711] leading-tight">Send this report</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">Turn this template on and set when it goes out.</p>
                </div>
                <Switch checked={Boolean(values.enabled)} onChange={handleEnabledChange} disabled={readOnly} />
              </div>

              {values.enabled ? (
                <div className="mt-3">
                  <div className="mb-5">
                    <CustomLabel label="Admin phone numbers" name="adminPhoneNumber" required />
                    <p className="text-xs text-[#6b7280] mb-2">{phoneHelper}</p>
                    <FieldArray name="adminPhoneNumber">
                      {({ push, remove }) => (
                        <div className="space-y-5">
                          {phones.map((phone, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <CustomInput
                                  type="text"
                                  name={`adminPhoneNumber.${index}`}
                                  placeholder="Enter admin phone number"
                                  value={phone}
                                  onChange={e => setFieldValue(`adminPhoneNumber.${index}`, e.target.value)}
                                  onBlur={() => {}}
                                  errorMessage={phoneFieldError(errors, index)}
                                  touched={phoneFieldTouched(touched, index, submitCount)}
                                  setFieldValue={setFieldValue}
                                  required={index === 0}
                                  disabled={readOnly}
                                />
                              </div>
                              {!readOnly && phones.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="p-2 rounded-md border border-gray-200 text-gray-500 hover:text-[#dc2626] hover:border-[#fecaca] hover:bg-[#fef2f2] flex items-center justify-center shrink-0"
                                  aria-label={`Remove phone number ${index + 1}`}
                                >
                                  <Icons.MinusCircleOutlined />
                                </button>
                              ) : null}
                            </div>
                          ))}

                          {typeof errors.adminPhoneNumber === 'string' && submitCount > 0 ? <p className="text-red-500 text-xs">{errors.adminPhoneNumber}</p> : null}

                          {canAddPhone ? (
                            <button type="button" onClick={() => push('')} className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: primary[500] }}>
                              <Icons.PlusOutlined />
                              Add phone number
                            </button>
                          ) : (
                            <p className="text-xs text-[#6b7280]">
                              Maximum of {phoneLimit} phone number{phoneLimit === 1 ? '' : 's'} reached.
                            </p>
                          )}
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <ScheduleSection
                    icon={<Icons.CalendarOutlined />}
                    label="Daily"
                    description="Every day"
                    checked={Boolean(values.dailyEnabled)}
                    onToggle={c => setField('dailyEnabled', c)}
                    disabled={readOnly}
                    {...scheduleAccent}
                  >
                    <div className="sm:col-span-2">
                      <TimeField id="dailyTime" value={values.dailyTime} onChange={v => setField('dailyTime', v)} />
                    </div>
                    {INCREMENTAL_TEMPLATE_HINTS[template.key] ? (
                      <div className="sm:col-span-2 flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-[#030711] leading-tight">Incremental</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{INCREMENTAL_TEMPLATE_HINTS[template.key].daily}</p>
                        </div>
                        <Switch checked={Boolean(values.dailyIncremental)} onChange={c => setField('dailyIncremental', c)} disabled={readOnly} />
                      </div>
                    ) : null}
                  </ScheduleSection>

                  <ScheduleSection
                    icon={<Icons.CalendarOutlined />}
                    label="Weekly"
                    description="Once a week"
                    checked={Boolean(values.weeklyEnabled)}
                    onToggle={c => setField('weeklyEnabled', c)}
                    disabled={readOnly}
                    {...scheduleAccent}
                  >
                    <CustomInput
                      type="select"
                      name="weeklyDay"
                      label="Day of week"
                      placeholder="Select day"
                      value={values.weeklyDay}
                      onChange={v => setField('weeklyDay', v)}
                      setFieldValue={setFieldValue}
                      selectOptions={WEEK_DAY_OPTIONS}
                      required
                      disabled={readOnly}
                    />
                    <TimeField id="weeklyTime" value={values.weeklyTime} onChange={v => setField('weeklyTime', v)} />
                    {INCREMENTAL_TEMPLATE_HINTS[template.key] ? (
                      <div className="sm:col-span-2 flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-[#030711] leading-tight">Incremental</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{INCREMENTAL_TEMPLATE_HINTS[template.key].weekly}</p>
                        </div>
                        <Switch checked={Boolean(values.weeklyIncremental)} onChange={c => setField('weeklyIncremental', c)} disabled={readOnly} />
                      </div>
                    ) : null}
                  </ScheduleSection>

                  <ScheduleSection
                    icon={<Icons.CalendarOutlined />}
                    label="Monthly"
                    description="Once a month"
                    checked={Boolean(values.monthlyEnabled)}
                    onToggle={c => setField('monthlyEnabled', c)}
                    disabled={readOnly}
                    {...scheduleAccent}
                  >
                    <CustomInput
                      type="select"
                      name="monthlyDate"
                      label="Day of month"
                      placeholder="Select date"
                      value={values.monthlyDate}
                      onChange={v => setField('monthlyDate', v)}
                      setFieldValue={setFieldValue}
                      selectOptions={MONTH_DATE_OPTIONS}
                      required
                      disabled={readOnly}
                    />
                    <TimeField id="monthlyTime" value={values.monthlyTime} onChange={v => setField('monthlyTime', v)} />
                    {Number(values.monthlyDate) >= 29 ? (
                      <div className="sm:col-span-2 flex items-start gap-1.5 text-xs text-[#6b7280]">
                        <Icons.InfoCircleOutlined className="mt-0.5 shrink-0 text-gray-400" />
                        <span>In shorter months the summary is sent on the last day (e.g. day {values.monthlyDate} → 28 Feb).</span>
                      </div>
                    ) : null}
                  </ScheduleSection>

                  {noSchedule ? <div className="text-red-500 text-xs mt-2">Enable at least one of daily, weekly, or monthly.</div> : null}
                </div>
              ) : (
                <p className="text-xs text-[#6b7280] mt-3">This template is off. Turn it on to choose phone numbers and when the report is sent.</p>
              )}

              <div className="flex gap-4 justify-end items-center pt-6">
                <CustomButton text="Cancel" type="default" disabled={saving} onClick={() => setOpen(false)} />
                {!readOnly ? <CustomButton text="Save" type="primary" onClick={submit} loading={saving} disabled={noSchedule} /> : null}
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default TemplateConfigModal;
