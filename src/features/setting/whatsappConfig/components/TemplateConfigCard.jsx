import { Tooltip } from 'antd';

import Icons from '@/assets/icons/icon';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import { isTemplateEnabled, getTemplateScheduleSummary, getTemplateAdminPhones } from '../whatsappConfig.schema';
import { CATEGORY_STYLES, MessageBubble, getTemplatePreview } from '../whatsappTemplates';

const DARK_TOOLTIP = {
  color: '#111827',
  overlayInnerStyle: {
    backgroundColor: '#111827',
    color: '#ffffff',
    padding: '10px 12px',
    borderRadius: 8,
    boxShadow: 'none',
  },
};

const TemplateConfigCard = ({ template, config, onConfigure, maxPhones, planEnabled = true, isCustomPlan = false }) => {
  const { colorPalette } = useTheme();
  const primary = colorPalette.primary;
  const cat = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.Sales;
  const preview = getTemplatePreview(template.key);
  const comingSoon = template.status !== 'active';
  const enabled = !comingSoon && isTemplateEnabled(config, template.key);
  const schedules = comingSoon ? [] : getTemplateScheduleSummary(config, template.key);
  const phones = comingSoon ? [] : getTemplateAdminPhones(config, template.key, maxPhones);
  const actionLabel = !planEnabled ? (isCustomPlan ? 'Contact support' : 'Upgrade plan') : enabled ? 'Edit schedule' : 'Configure';
  const showSubscriptionWarning = enabled && !planEnabled;
  const customPlanTooltip =
    isCustomPlan && !planEnabled ? (
      <div className="text-left">
        <p className="text-sm font-semibold text-white leading-tight">Custom plan</p>
        <p className="text-xs text-white/90 mt-1 leading-relaxed">Your company is on a custom plan. Standard catalog plans aren't available. Please contact support for any plan or billing changes.</p>
      </div>
    ) : null;
  const subscriptionOverTooltip = (
    <div className="text-left">
      <p className="text-sm font-semibold text-white leading-tight">Subscription over</p>
      <p className="text-xs text-white/90 mt-1 leading-relaxed">Your subscription has expired, so the daily message could not be sent.</p>
    </div>
  );

  return (
    <div className="mb-4 break-inside-avoid h-auto flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: cat.bg }}>
          {template.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#030711] leading-tight">{template.name}</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: cat.color, backgroundColor: cat.bg }}>
              {template.category}
            </span>
          </div>
          <p className="text-xs text-[#6b7280] leading-snug mt-0.5">{template.purpose}</p>
        </div>
        {comingSoon ? (
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: colorPalette.warning[100], color: colorPalette.warning[700] }}
          >
            Coming soon
          </span>
        ) : (
          <div className="shrink-0 inline-flex items-center gap-1.5">
            {showSubscriptionWarning ? (
              <Tooltip title={subscriptionOverTooltip} placement="top" {...DARK_TOOLTIP}>
                <Icons.InfoCircleOutlined className="" style={{ color: colorPalette.warning[700], fontSize: 14 }} />
              </Tooltip>
            ) : null}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={enabled ? { backgroundColor: colorPalette.success[100], color: colorPalette.success[600] } : { backgroundColor: colorPalette.neutral[100], color: colorPalette.neutral[500] }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: enabled ? colorPalette.success[600] : colorPalette.neutral[400] }} />
              {enabled ? 'On' : 'Off'}
            </span>
          </div>
        )}
      </div>

      {preview ? (
        <div className="px-4">
          <div className={comingSoon ? 'opacity-90' : ''}>
            <MessageBubble template={preview} />
          </div>
        </div>
      ) : null}

      <div className="px-4 pt-3 pb-4 mt-auto">
        {enabled && phones.length ? (
          <p className="text-xs text-[#6b7280] mb-2">
            Phone{phones.length > 1 ? 's' : ''}: <span className="font-medium text-[#030711]">{phones.join(', ')}</span>
          </p>
        ) : null}
        {schedules.length ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {schedules.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5"
                style={{ color: primary[500], backgroundColor: primary[50], border: `1px solid ${primary[200]}` }}
              >
                <Icons.CalendarOutlined className="text-[10px]" />
                {s}
              </span>
            ))}
          </div>
        ) : null}
        {comingSoon ? (
          <div className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-dashed border-gray-200 py-2.5 text-gray-400 bg-gray-50 cursor-not-allowed select-none">
            <Icons.ClockCircleOutlined />
            Coming soon
          </div>
        ) : (
          <Tooltip title={customPlanTooltip} placement="top" {...DARK_TOOLTIP}>
            <span className="block w-full">
              <button
                type="button"
                onClick={onConfigure}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg border py-2.5 transition-colors"
                style={{ color: primary[500], borderColor: primary[200], backgroundColor: primary[50] }}
              >
                <Icons.SettingOutlined />
                {actionLabel}
              </button>
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default TemplateConfigCard;
