import { useEffect, useMemo } from 'react';
import { Tooltip } from '@/components/AntDComponent';
import CustomInput from '@/components/forms/formInput/CustomInput';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

export const MAX_ITEM_UNIT_CONVERSIONS = 2;
const ITEM_UNIT_CONVERSION_NOTE =
  'Note: The selected Item Unit is the base unit for conversion and stock out is based on this unit. Please define the conversion ratios of other units with respect to the Item Unit. For example: 1 Box = 100 Pcs (where Pcs is the Item Unit).';
const DECIMAL_UP_TO_6_REGEX = /^\d*\.?\d{0,6}$/;

const resolveUnitId = unit => unit?._id || unit?.id || (typeof unit === 'string' ? unit : null);

export const resolveItemUnitSelectId = (itemData, options = []) => {
  const explicitId = itemData?.itemUnitId?._id || itemData?.itemUnitId?.id || (typeof itemData?.itemUnitId === 'string' ? itemData.itemUnitId : null);
  const name = itemData?.itemUnitId?.name || (typeof itemData?.itemUnit === 'string' ? itemData.itemUnit : null);
  const matched = options.find(option => (explicitId && option.value === explicitId) || (name && option.name === name));
  if (matched) return matched.value;
  return explicitId;
};

export const resolveConversionUnitId = (unitValue, options = []) => options.find(option => option.value === unitValue || option.name === unitValue)?.value || unitValue;

export const resolveStockUnitId = (unit, options = []) => {
  if (!unit) return null;
  const id = unit?._id || unit?.id || (typeof unit === 'string' ? unit : null);
  if (!id) return null;
  return options.find(option => option.value === id || option.name === id)?.value || id;
};

export const buildAllowedStockUnitOptions = (itemUnit, conversions = [], options = []) => {
  const allowed = [];
  const addOption = unitValue => {
    if (!unitValue) return;
    const option = options.find(item => item.value === unitValue || item.name === unitValue);
    if (!option || allowed.some(item => item.value === option.value)) return;
    allowed.push(option);
  };

  addOption(itemUnit);
  conversions.forEach(row => addOption(row?.unit));
  return allowed;
};

export const mapItemUnitConversions = unitConversions =>
  (Array.isArray(unitConversions) ? unitConversions : []).slice(0, MAX_ITEM_UNIT_CONVERSIONS).map(row => ({
    unit: resolveUnitId(row?.itemUnitId || row?.unit),
    qty: 1,
    baseQty: row?.baseQty ?? '',
    salesPrice: row?.salesPrice ?? '',
    purchasePrice: row?.purchasePrice ?? '',
  }));

const ItemUnitConversions = ({ conversions = [], itemUnit, itemUnitsOptions = [], itemUnitsDropLoading, errors, touched, setFieldValue, setFieldTouched, onRemove, disabled }) => {
  if (!conversions.length) return null;

  const baseUnitLabel = itemUnitsOptions.find(option => option.value === itemUnit)?.label || itemUnitsOptions.find(option => option.name === itemUnit)?.label || '';
  const conversionErrors = errors?.unitConversions;
  const conversionTouched = touched?.unitConversions;
  const arrayError = typeof conversionErrors === 'string' ? conversionErrors : '';

  const unitOptionsForRow = index =>
    itemUnitsOptions.filter(option => {
      if (option.value === itemUnit || option.name === itemUnit) return false;
      return !conversions.some((row, rowIndex) => rowIndex !== index && row.unit === option.value);
    });

  const firstErrorIndex = Array.isArray(conversionErrors) ? conversionErrors.findIndex(rowError => rowError && typeof rowError === 'object' && Object.values(rowError).some(Boolean)) : -1;

  return (
    <div id={firstErrorIndex < 0 ? 'unitConversions' : undefined} className="pt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm font-medium text-gray-800">Unit Conversion</span>
        <Tooltip placement="right" overlayStyle={{ maxWidth: 380 }} title={<span className="block text-xs leading-5">{ITEM_UNIT_CONVERSION_NOTE}</span>}>
          <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
        </Tooltip>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded [&_.ant-form-item-explain-error]:!static [&_.ant-form-item-explain-error]:!right-auto [&_.ant-form-item-explain-error]:!block [&_.ant-form-item-explain-error]:whitespace-normal [&_.ant-form-item-explain-error]:text-left [&_.ant-form-item-explain-error]:mt-1">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[minmax(96px,0.8fr)_80px_28px_minmax(96px,0.8fr)_160px_160px_160px_40px] gap-3 items-center bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center">
              <span className="ant-form-item-required" />
              Unit
            </span>
            <span>Qty</span>
            <span />
            <span>Unit</span>
            <span className="inline-flex items-center">
              <span className="ant-form-item-required" />
              Qty
            </span>
            <span className="inline-flex items-center">
              <span className="ant-form-item-required" />
              Sales Price
            </span>
            <span className="inline-flex items-center">
              <span className="ant-form-item-required" />
              Purchase Price
            </span>
            <span />
          </div>
          {conversions.map((row, index) => {
            const rowError = Array.isArray(conversionErrors) ? conversionErrors[index] : undefined;
            const rowTouched = Array.isArray(conversionTouched) ? conversionTouched[index] : undefined;
            return (
              <div
                key={index}
                id={index === firstErrorIndex ? 'unitConversions' : undefined}
                className="grid grid-cols-[minmax(96px,0.8fr)_80px_28px_minmax(96px,0.8fr)_160px_160px_160px_40px] gap-3 items-start px-3 py-2 border-t border-gray-200 scroll-mt-24"
              >
                <CustomInput
                  type="select"
                  name={`unitConversions.${index}.unit`}
                  placeholder="Select Unit"
                  value={row.unit}
                  onBlur={() => setFieldTouched(`unitConversions.${index}.unit`, true)}
                  errorMessage={rowError?.unit}
                  touched={rowTouched?.unit}
                  setFieldValue={setFieldValue}
                  selectOptions={unitOptionsForRow(index)}
                  loading={itemUnitsDropLoading}
                  disabled={disabled || !itemUnit}
                  required
                />
                <CustomInput type="text" name={`unitConversions.${index}.qty`} value={1} setFieldValue={() => {}} disabled />
                <span className="text-gray-500 text-center leading-[34px]">=</span>
                <CustomInput type="text" name={`unitConversions.${index}.baseUnitLabel`} value={baseUnitLabel} setFieldValue={() => {}} disabled />
                <CustomInput
                  type="text"
                  name={`unitConversions.${index}.baseQty`}
                  placeholder="Qty"
                  value={row.baseQty}
                  onBlur={() => setFieldTouched(`unitConversions.${index}.baseQty`, true)}
                  errorMessage={rowError?.baseQty}
                  touched={rowTouched?.baseQty}
                  setFieldValue={(_, value) => {
                    if (value !== '' && value != null && !DECIMAL_UP_TO_6_REGEX.test(String(value))) return;
                    setFieldValue(`unitConversions.${index}.baseQty`, value);
                  }}
                  disabled={disabled}
                  required
                />
                <CustomInput
                  type="text"
                  name={`unitConversions.${index}.salesPrice`}
                  placeholder="Sales Price"
                  value={row.salesPrice}
                  onBlur={() => setFieldTouched(`unitConversions.${index}.salesPrice`, true)}
                  errorMessage={rowError?.salesPrice}
                  touched={rowTouched?.salesPrice}
                  setFieldValue={setFieldValue}
                  required
                />
                <CustomInput
                  type="text"
                  name={`unitConversions.${index}.purchasePrice`}
                  placeholder="Purchase Price"
                  value={row.purchasePrice}
                  onBlur={() => setFieldTouched(`unitConversions.${index}.purchasePrice`, true)}
                  errorMessage={rowError?.purchasePrice}
                  touched={rowTouched?.purchasePrice}
                  setFieldValue={setFieldValue}
                  required
                />
                <div className="flex justify-center pt-1.5">
                  {!disabled && (
                    <button type="button" className="bg-transparent border-0 p-0 cursor-pointer" onClick={() => onRemove(index)} aria-label="Remove unit conversion">
                      <Icons.DeleteOutlined style={{ color: colorPalette.error[500], fontSize: 16 }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {arrayError && <div className="text-xs text-red-500 mt-1">{arrayError}</div>}
    </div>
  );
};

export default ItemUnitConversions;

export const DefaultStockUnitFields = ({ itemUnit, conversions = [], stockInUnit, stockOutUnit, itemUnitsOptions = [], itemUnitsDropLoading, errors, touched, setFieldValue, handleBlur }) => {
  const stockUnitOptions = useMemo(() => buildAllowedStockUnitOptions(itemUnit, conversions, itemUnitsOptions), [itemUnit, conversions, itemUnitsOptions]);

  useEffect(() => {
    if (!itemUnit || !itemUnitsOptions.length) return;
    if (stockInUnit && !stockUnitOptions.some(option => option.value === stockInUnit)) {
      setFieldValue('stockInUnit', null);
    }
    if (stockOutUnit && !stockUnitOptions.some(option => option.value === stockOutUnit)) {
      setFieldValue('stockOutUnit', null);
    }
  }, [itemUnit, itemUnitsOptions.length, stockUnitOptions, stockInUnit, stockOutUnit, setFieldValue]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-4">
      <CustomInput
        type="select"
        name="stockInUnit"
        label="Default Unit For Stock In"
        placeholder="Select Unit"
        value={stockInUnit}
        onBlur={handleBlur}
        errorMessage={errors?.stockInUnit}
        touched={touched?.stockInUnit}
        setFieldValue={setFieldValue}
        selectOptions={stockUnitOptions}
        loading={itemUnitsDropLoading}
        disabled={!itemUnit}
        allowClear
      />
      <CustomInput
        type="select"
        name="stockOutUnit"
        label="Default Unit For Stock Out"
        placeholder="Select Unit"
        value={stockOutUnit}
        onBlur={handleBlur}
        errorMessage={errors?.stockOutUnit}
        touched={touched?.stockOutUnit}
        setFieldValue={setFieldValue}
        selectOptions={stockUnitOptions}
        loading={itemUnitsDropLoading}
        disabled={!itemUnit}
        allowClear
      />
    </div>
  );
};
