import { Tooltip } from '@/components/AntDComponent';
import { toDecimalString } from '@/utils/currency';
import { resolveLineAvailableStock, resolveLineUnitSelection } from '@/utils/itemLineUnit';

/** Same amber as StatusBadge PENDING */
const PENDING_DOT = 'inline-block w-2 h-2 shrink-0 rounded-full bg-amber-500';

const BatchStockAvailabilityIndicator = ({ item, line, quantity }) => {
  if (!item) return null;

  if (item.itemCategory?.isService === true) {
    return (
      <Tooltip title="Service item, stock is not managed">
        <span className={PENDING_DOT} aria-label="Service" />
      </Tooltip>
    );
  }

  if (item.trackInventory === false) {
    return (
      <Tooltip title="Inventory tracking is off, this item will not affect stock">
        <span className={PENDING_DOT} aria-label="Not tracked" />
      </Tooltip>
    );
  }

  const unitSelection = resolveLineUnitSelection(line || {}, item);
  const availableStock = resolveLineAvailableStock(item, unitSelection);
  if (availableStock == null) return null;

  const available = Number(availableStock);
  const needed = parseFloat(quantity) || 0;
  const isShort = available < needed;
  const unitName = unitSelection.itemUnit;
  const withUnit = value => (unitName ? `${toDecimalString(value)} ${unitName}` : toDecimalString(value));

  return (
    <Tooltip title={isShort ? `Available ${withUnit(available)} · needed ${withUnit(needed)}` : `Available ${withUnit(available)}`}>
      <span className={`w-2 h-2 shrink-0 rounded-full ${isShort ? 'bg-red-500' : 'bg-green-500'}`} aria-label={isShort ? 'Stock short' : 'Stock available'} />
    </Tooltip>
  );
};

export default BatchStockAvailabilityIndicator;
