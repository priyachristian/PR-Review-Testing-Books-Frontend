import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';

import { Button, Checkbox, Progress, Skeleton, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import UnlimitedCheckIcon from '@/components/ui/common/UnlimitedCheckIcon';
import { colorPalette } from '@/utils/theme';
import { INTERVAL_LABEL, SHARED_APP_LABEL, USAGE_STATUS } from '@/utils/constants';
import { getBillingPlansUrl } from '@/utils/util';
import { useProfile } from '@/features/setting/profile/useProfile';

const PRIMARY = colorPalette.primary[500];

const formatCount = value => {
  const amount = Number(value);
  if (value == null || Number.isNaN(amount)) return '0';
  return amount.toLocaleString('en-IN');
};

const formatPlanDate = value => (value && dayjs(value).isValid() ? dayjs(value).format('DD MMM YYYY') : '-');

// Backend enums are snake_case (e.g. pending_mandate, one_time)
const titleWord = value => {
  if (!value) return '-';
  const text = String(value).replace(/_/g, ' ').toLowerCase();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

const isUnlimitedItem = item => item?.isUnlimited || item?.status === USAGE_STATUS.UNLIMITED;

const usagePercent = item => {
  if (isUnlimitedItem(item) || !item?.limit) return 0;
  if (item.percentUsed != null && item.percentUsed !== '') return Number(item.percentUsed);
  return (Number(item.used) / Number(item.limit)) * 100;
};

const ringColor = item => {
  if (item?.status === USAGE_STATUS.EXCEEDED) return colorPalette.error[500];
  if (item?.status === USAGE_STATUS.WARNING) return colorPalette.warning[500];
  return colorPalette.primary[400];
};

const sharedLimitInfo = item => {
  const breakdown = item?.sharedBreakdown;
  if (!item?.isShared || !breakdown?.siblingSubscriptionExists) return '';
  const sibling = SHARED_APP_LABEL[breakdown.siblingApp] || breakdown.siblingApp || 'CRM';
  if (breakdown.siblingIsPaymentIncomplete) return `Your ${sibling} subscription payment is pending, so this shared limit is reduced.`;
  return `Shared with your ${sibling} subscription.`;
};

const priceLabel = plan => {
  if (plan?.price == null) return '';
  const symbol = !plan.currency || plan.currency === 'INR' ? 'Rs' : plan.currency;
  // No suffix for one-time or unknown intervals
  const period = INTERVAL_LABEL[plan.billingInterval] || '';
  return `${symbol} ${formatCount(plan.price)}${period ? ` / ${period}` : ''}`;
};

const resetCaption = highlights => {
  const row = (highlights || []).find(item => item?.resetsOn);
  if (!row) return '';
  const interval = row.interval ? titleWord(row.interval) : 'Plan';
  return `${interval} limits reset on ${formatPlanDate(row.resetsOn)}`;
};

const openBillingPlans = () => window.open(getBillingPlansUrl(), '_blank', 'noopener,noreferrer');

// Trial and non-renewing plans end on currentEnd instead of renewing
const renewalLabel = plan => {
  if (plan.autoRenew) return 'Next renewal';
  return plan.isFree ? 'Trial ends' : 'Plan ends';
};

const SectionLabel = ({ children, className = '' }) => <h2 className={`text-sm font-medium text-[#030711] leading-none ${className}`}>{children}</h2>;

const MetaField = ({ label, children }) => (
  <div>
    <div className="text-xs font-medium text-[#6b7280] mb-1">{label}</div>
    <div className="text-sm font-medium text-[#030711]">{children}</div>
  </div>
);

const UsageRing = ({ item }) => {
  const unlimited = isUnlimitedItem(item);
  const percent = Math.min(Math.max(usagePercent(item), 0), 100);
  const info = sharedLimitInfo(item);

  return (
    <div className="flex min-w-0 items-center gap-3 py-1">
      <div className="shrink-0">
        {unlimited ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colorPalette.primary[50], color: colorPalette.primary[500] }}>
            <UnlimitedCheckIcon className="h-5 w-5" />
          </div>
        ) : (
          <Progress type="circle" percent={percent} size={44} strokeWidth={8} showInfo={false} strokeColor={ringColor(item)} trailColor={colorPalette.primary[100]} />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-sm text-[#030711]">
          <span className="leading-tight">{item.label}</span>
          {info ? (
            <Tooltip title={info}>
              <Icons.InfoCircleOutlined className="shrink-0 text-xs text-[#9ca3af]" />
            </Tooltip>
          ) : null}
        </div>
        <div className="mt-0.5 text-sm font-medium leading-tight text-[#030711]">
          <span>{formatCount(item.used)}</span>
          <span>{unlimited ? ' used · Unlimited' : ` / ${formatCount(item.limit)} used`}</span>
        </div>
      </div>
    </div>
  );
};

const OtherModule = ({ item }) => (
  <div>
    <div className="text-xs font-medium text-[#6b7280] mb-0.5">{item.label}</div>
    <div className="text-sm text-[#6b7280]">
      <span className="font-medium text-[#030711]">{formatCount(item.used)}</span>
      <span> / {isUnlimitedItem(item) ? 'Unlimited' : formatCount(item.limit)}</span>
    </div>
  </div>
);

const FeatureRow = ({ item, onUpgrade }) => {
  if (!item.enabled) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300" />
        <span className="flex-1 text-sm text-[#6b7280]">{item.label}</span>
        <button type="button" className="text-xs font-medium hover:underline" style={{ color: PRIMARY }} onClick={onUpgrade}>
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: PRIMARY }}>
        <Icons.CheckOutlined style={{ fontSize: 9 }} />
      </span>
      <span className="text-sm text-[#030711]">{item.label}</span>
    </div>
  );
};

const UsagePage = () => {
  const { getSubscriptionDetail, subscriptionDetail, subscriptionDetailLoading } = useProfile();
  const subscription = subscriptionDetail || {};
  const plan = subscription.plan || {};
  const usage = subscription.usage || {};
  const highlights = usage.highlights || [];
  const others = usage.others || [];
  const isInitialLoading = subscriptionDetailLoading && !subscriptionDetail;

  const [onlyIncluded, setOnlyIncluded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getSubscriptionDetail({ signal: controller.signal });
    return () => controller.abort();
  }, [getSubscriptionDetail]);

  const visibleSections = (subscription.features || []).filter(section => (onlyIncluded ? section.items?.some(item => item.enabled) : section.items?.length));

  const daysText = plan.daysRemaining == null ? '' : `(${plan.daysRemaining} ${Number(plan.daysRemaining) === 1 ? 'day' : 'days'})`;
  const statusTone = String(plan.status || '').toLowerCase() === 'active' ? colorPalette.success : colorPalette.neutral;
  const renewalText = `${formatPlanDate(plan.nextRenewalDate || plan.currentEnd)}${daysText ? ` ${daysText}` : ''}`;

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    getSubscriptionDetail({ signal: controller.signal });
  }, [getSubscriptionDetail]);

  return (
    <div className="min-h-full bg-gray-50 pb-6">
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7c3bed1a] rounded-lg flex items-center justify-center shrink-0">
            <Icons.CrownOutlined className="text-[#7c3bed] text-lg" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Manage Subscription</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Usage and subscription insights</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<Icons.SyncOutlined />} loading={subscriptionDetailLoading} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button onClick={openBillingPlans}>View Plans</Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isInitialLoading ? (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-white shadow-sm p-5">
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
            <div className="rounded-md border border-gray-200 bg-white shadow-sm p-5">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
            <div className="rounded-md border border-gray-200 bg-white shadow-sm p-5">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </div>
        ) : !subscriptionDetail ? (
          <div className="rounded-md border border-gray-200 bg-white shadow-sm px-4 py-10 text-center text-sm text-[#6b7280]">Could not load subscription details.</div>
        ) : (
          <>
            <section>
              <SectionLabel className="mb-2">Plan details</SectionLabel>
              <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
                <div className="flex items-center rounded-md border border-gray-200 px-5 py-5 shadow-sm" style={{ backgroundColor: colorPalette.primary[50] }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-semibold text-white" style={{ backgroundColor: PRIMARY }}>
                      {(plan.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-[#6b7280]">Plan name</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold uppercase leading-none text-[#030711]">{plan.name || '-'}</span>
                        {plan.status ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              color: statusTone[700],
                              backgroundColor: statusTone[100] || statusTone[50],
                            }}
                          >
                            {titleWord(plan.status)}
                          </span>
                        ) : null}
                      </div>
                      {priceLabel(plan) ? <div className="mt-1.5 text-sm text-[#6b7280]">{priceLabel(plan)}</div> : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 bg-white px-5 py-5 shadow-sm">
                  <div className="grid h-full grid-cols-2 content-center gap-x-6 gap-y-6 sm:grid-cols-3">
                    <MetaField label="Billing cycle">{titleWord(plan.billingInterval)}</MetaField>
                    <MetaField label={renewalLabel(plan)}>{renewalText}</MetaField>
                    <MetaField label="Plan started">{formatPlanDate(plan.startAt)}</MetaField>
                    <MetaField label="Auto-renew">{plan.autoRenew ? 'On' : 'Off'}</MetaField>
                    <MetaField label="Autopay">{titleWord(plan.autopayStatus)}</MetaField>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Usage stats</SectionLabel>
                {resetCaption(highlights) ? <p className="text-xs font-medium text-[#6b7280]">{resetCaption(highlights)}</p> : null}
              </div>
              <div className="rounded-md border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  {highlights.map(item => (
                    <UsageRing key={item.key} item={item} />
                  ))}
                </div>

                {others.length > 0 && (
                  <div className="mt-2 border-t border-gray-100 pt-4">
                    <h3 className="mb-3 text-xs font-semibold text-[#6b7280]">Other modules</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                      {others.map(item => (
                        <OtherModule key={item.key} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <SectionLabel className="mb-2">Features</SectionLabel>
              <div className="rounded-md border border-gray-200 bg-white shadow-sm px-4 py-4 sm:px-5">
                <div className="-mx-4 mb-4 flex items-center justify-between gap-3 border-b border-gray-200 px-4 pb-4 sm:-mx-5 sm:px-5">
                  <h3 className="text-sm font-medium text-[#030711]">Core features</h3>
                  <Checkbox checked={onlyIncluded} onChange={event => setOnlyIncluded(event.target.checked)}>
                    <span className="text-sm text-[#030711]">Show only included</span>
                  </Checkbox>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
                  {visibleSections.map(section => {
                    const items = onlyIncluded ? section.items.filter(item => item.enabled) : section.items;
                    return (
                      <div key={section.section}>
                        <h4 className="mb-2 text-xs font-semibold text-[#6b7280]">{section.label}</h4>
                        <div>
                          {items.map(item => (
                            <FeatureRow key={item.key} item={item} onUpgrade={openBillingPlans} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default UsagePage;
