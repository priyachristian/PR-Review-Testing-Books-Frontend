import { Tooltip } from '@/components/AntDComponent';

const MIXED_UNITS_LABEL = 'Mixed Units';

const formatUnitQuantity = (quantity, unit) => {
  if (quantity == null || quantity === '') return '';
  const unitLabel = unit ? String(unit).trim() : '';
  return unitLabel ? `${quantity} ${unitLabel}` : String(quantity);
};

const formatQuantityBreakdown = summary =>
  (summary?.breakdown || [])
    .map(row => formatUnitQuantity(row?.quantity, row?.unit))
    .filter(Boolean)
    .join(', ');

const getQuantityDisplay = summary => {
  if (!summary) return '';
  if (summary.isMixedUnits) return summary.label || MIXED_UNITS_LABEL;
  if (summary.totalQuantity != null && summary.totalQuantity !== '') {
    return formatUnitQuantity(summary.totalQuantity, summary.unit);
  }
  return summary.label || '';
};

const QuantitySummaryCell = ({ summary }) => {
  const label = getQuantityDisplay(summary);
  if (!label) return null;

  if (!summary?.isMixedUnits) return label;

  const breakdown = formatQuantityBreakdown(summary);
  if (!breakdown) return label;

  return (
    <Tooltip title={breakdown} getPopupContainer={() => document.body}>
      <span>{label}</span>
    </Tooltip>
  );
};

export default QuantitySummaryCell;
