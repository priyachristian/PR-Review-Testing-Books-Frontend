import { useEffect, useMemo } from 'react';
import { Alert, Card, Spin } from 'antd';

import Icons from '@/assets/icons/icon';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useModule } from '@/hooks/useModule';
import { useWhatsappConfig } from '../useWhatsappConfig';
import { getScheduleDetails, composeWhatsappPayload, getWhatsappPlanLimits, trimWhatsappConfigPhones } from '../whatsappConfig.schema';
import TemplatesConfigSection from '../components/TemplatesConfigSection';
import { dateFormateForUi } from '@/utils/services';
import { getBillingPlansUrl } from '@/utils/util';

const EMPTY_CONFIG = { templates: [] };

const WhatsappConfigPage = () => {
  const { signin } = useAuth();
  const { colorPalette } = useTheme();
  const { whatsappConfig, loading, saving, getWhatsappConfig, updateWhatsappConfig } = useWhatsappConfig();
  const { featureInPlanMap } = useModule();
  const { isEnabled: planEnabled, maxPhones } = useMemo(() => getWhatsappPlanLimits(featureInPlanMap, whatsappConfig?.recipientsLimit), [featureInPlanMap, whatsappConfig?.recipientsLimit]);
  const isCustomPlan = Boolean(signin?.subscription?.isCustomPlan);
  const primary = colorPalette.primary;

  useEffect(() => {
    const controller = new AbortController();
    getWhatsappConfig({ signal: controller.signal });
    return () => controller.abort();
  }, [getWhatsappConfig]);

  const rawConfig = whatsappConfig || EMPTY_CONFIG;
  const config = useMemo(() => trimWhatsappConfigPhones(rawConfig, maxPhones), [rawConfig, maxPhones]);

  const handleSaveTemplates = templates =>
    updateWhatsappConfig({
      whatsapp: composeWhatsappPayload({ templates: trimWhatsappConfigPhones({ templates }, maxPhones).templates }),
    });

  const scheduleDetails = getScheduleDetails(config);

  const handlePlanAction = () => {
    if (isCustomPlan) return;
    window.open(getBillingPlansUrl(), '_blank');
  };

  const planMessage = isCustomPlan
    ? "You can't purchase or switch to standard catalog plans while your company is on a custom plan. Ask your account administrator to contact support for any plan or billing change."
    : 'Upgrade your plan to configure admin WhatsApp summary notifications.';

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex items-center gap-3">
          <div className="bg-[#25d3661a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
            <Icons.MessageOutlined className="text-[#25d366] items-center text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">WhatsApp config</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure admin WhatsApp summary notifications</p>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 shadow-sm mt-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <div className="py-1">
            {!planEnabled ? (
              <Alert
                className="mb-5 items-center [&_.ant-alert-icon]:self-center"
                type="warning"
                showIcon
                icon={<Icons.LockOutlined />}
                message="WhatsApp config is not available on your plan"
                description={planMessage}
              />
            ) : null}

            <div>
              <p className="text-xs text-[#6b7280] font-medium mb-2">Active schedules</p>
              {scheduleDetails.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                  {scheduleDetails.map(s => (
                    <div key={s.key} className="border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: primary[50], color: primary[500] }}>
                        <Icons.CalendarOutlined />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#030711] leading-tight">{s.title}</p>
                        <p className="text-xs text-[#6b7280] leading-snug mt-0.5">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b7280]">No templates enabled yet. Configure one below to start sending.</p>
              )}

              {whatsappConfig?.lastSummary ? (
                <div className="mt-5 flex items-center gap-2 text-sm">
                  {whatsappConfig.lastSummary.status === 'sent' ? (
                    <>
                      <Icons.CheckCircleOutlined style={{ color: colorPalette.success[600] }} />
                      <span className="text-[#6b7280]">
                        Last summary sent <span className="font-medium text-[#030711]">{whatsappConfig.lastSummary.at ? dateFormateForUi(whatsappConfig.lastSummary.at) : ''}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Icons.WarningOutlined style={{ color: colorPalette.error[600] }} />
                      <span style={{ color: colorPalette.error[600] }}>
                        Last summary failed {whatsappConfig.lastSummary.at ? dateFormateForUi(whatsappConfig.lastSummary.at) : ''}
                        {whatsappConfig.lastSummary.error ? ` — ${whatsappConfig.lastSummary.error}` : ''}
                      </span>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <TemplatesConfigSection
              config={config}
              onSave={handleSaveTemplates}
              saving={saving}
              maxPhones={maxPhones}
              planEnabled={planEnabled}
              isCustomPlan={isCustomPlan}
              onPlanAction={handlePlanAction}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default WhatsappConfigPage;
