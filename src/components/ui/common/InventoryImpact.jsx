import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// Extras
import { pageTypes } from 'utils/constants';

/**
 * Compact Inventory Impact Component
 * Shows inventory configuration status
 */
const InventoryBadge = ({ enabled, label }) => (
  <div className="flex items-center justify-between gap-2 text-xs">
    <span className="text-gray-600">{label}</span>
    <span
      className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full font-semibold ring-1 ring-inset ${
        enabled ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-gray-50 text-gray-500 ring-gray-500/20'
      }`}
    >
      {enabled ? <CheckCircleOutlined className="text-[11px]" /> : <CloseCircleOutlined className="text-[11px]" />}
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  </div>
);

const InventoryImpact = ({ data, pageType }) => {
  const isPurchaseFlow = pageType === pageTypes?.PURCHASE_ORDER || pageType === pageTypes?.GRPO || pageType === pageTypes?.BILLS;
  const isBill = pageType === pageTypes?.BILLS;
  const stockAddEnabled = Boolean(data?.inventoryConfig?.stockAddEnabled ?? data?.isInventoryEnabled);

  const inventoryItems = isPurchaseFlow
    ? [{ enabled: stockAddEnabled, label: isBill ? 'Add stock from this bill' : 'Stock Add' }]
    : [
        { enabled: Boolean(data?.inventoryConfig?.stockCheckEnabled), label: 'Stock Check' },
        { enabled: Boolean(data?.inventoryConfig?.stockDeductEnabled ?? data?.isInventoryEnabled), label: 'Stock Deduct' },
      ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700">Inventory Impact</h3>
      </div>

      <div className="p-3 space-y-2">
        {inventoryItems.map((item, index) => (
          <InventoryBadge key={index} enabled={item.enabled} label={item.label} />
        ))}
      </div>
    </div>
  );
};

export default InventoryImpact;
