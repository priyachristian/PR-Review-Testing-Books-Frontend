// Third Party
import { Fragment, useMemo } from 'react';
import { FieldArray } from 'formik';

// Components
import { Select, Spin } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { buildItemSelectOptions, itemSelectFilterOption, renderItemSelectOption, renderItemSelectDropdown } from '@/components/dataDisplay/appTable/ItemTable';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { colorPalette } from '@/utils/theme';
import { SAMPLE_CATALOG_UNIT_HINT } from '@/utils/constants';
import { buildUnitRows, byLineOrder, emptySampleCatalogItem } from '@/features/sales/sampleCatalog/sampleCatalog.utils';

// Same cell styles as ItemTable so the catalog lines read like any other document line table.
const TH = 'border-0 border-b border-gray-100 px-2 pb-2 whitespace-nowrap';
const TD = 'border-0 border-b border-gray-100 px-2 py-2 align-top';
// Extra unit lines of one item skip the divider, so only items are separated.
const TD_IN_GROUP = 'border-0 px-2 py-2 align-top';
const INPUT =
  'w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-sm font-normal text-gray-800 outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-500';
// Text input + pattern (as in ItemTable) so the mouse wheel cannot change values.
const DECIMAL_INPUT = /^\d*\.?\d{0,3}$/;
const ERROR = 'text-red-500 text-[11px] leading-tight mt-1 text-left';
const HINT = 'text-[11px] leading-tight text-gray-500 mt-1.5';
const NUMBER_FIELDS = ['samplePrice', 'minQty', 'maxQty'];

// One line per offered unit; `unitIndex` points back into item.units for Formik paths.
const offeredLines = item =>
  (item.units || [])
    .map((unit, unitIndex) => ({ unit, unitIndex }))
    .filter(line => line.unit.selected)
    .sort((a, b) => byLineOrder(a.unit, b.unit));

const SampleCatalogItemTable = ({ values, errors, touched, setFieldValue, handleBlur, itemsDrop, itemsDropLoading, findMaster }) => {
  const itemOptions = useMemo(() => buildItemSelectOptions(itemsDrop, false), [itemsDrop]);
  const items = values.items || [];

  const setUnitSelected = (index, unitIndex, selected) => setFieldValue(`items.${index}.units.${unitIndex}.selected`, selected);

  // Turn a unit on at a given line position; new lines go to the end of the item's group.
  const offerUnit = (item, index, unitIndex, lineOrder) => {
    const nextOrder = lineOrder ?? Math.max(-1, ...offeredLines(item).map(line => line.unit.lineOrder ?? 0)) + 1;
    setFieldValue(`items.${index}.units.${unitIndex}`, { ...item.units[unitIndex], selected: true, lineOrder: nextOrder });
  };

  const removeLine = (index, unitIndex, lineCount, remove) => {
    if (lineCount > 1) return setUnitSelected(index, unitIndex, false);
    if (items.length > 1) return remove(index);
    return setFieldValue(`items.${index}`, emptySampleCatalogItem());
  };

  const renderItemSelect = (item, index, push) => (
    <>
      <div className="rounded-md border border-gray-200 bg-white px-2">
        <Select
          showSearch
          allowClear
          variant="borderless"
          placeholder="Type or click to select an item."
          className="item-details-select item-details-select--wrap w-full cursor-pointer"
          popupClassName="item-select-dropdown-popup item-select-dropdown-popup--item-table"
          dropdownStyle={{ minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 }}
          popupMatchSelectWidth={false}
          filterOption={itemSelectFilterOption}
          optionRender={option => renderItemSelectOption(option, false)}
          dropdownRender={menu => renderItemSelectDropdown(menu, false)}
          name={`items.${index}.itemId`}
          value={item.itemId}
          onChange={value => {
            setFieldValue(`items.${index}`, { itemId: value || null, units: value ? buildUnitRows(findMaster(value)) : [] });
            // Same as ItemTable: picking in the last row opens a fresh blank row.
            if (value && index === items.length - 1) push(emptySampleCatalogItem());
          }}
          onBlur={handleBlur}
          options={itemOptions.filter(option => !items.some((row, i) => i !== index && String(row.itemId) === String(option.value)))}
          loading={itemsDropLoading}
          aria-label={`Item ${index + 1}`}
          notFoundContent={
            itemsDropLoading ? (
              <div className="flex justify-center items-center">
                <Spin size="small" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">No Item Available</div>
            )
          }
        />
      </div>
      {errors.items?.[index]?.itemId && touched.items?.[index]?.itemId && <div className={ERROR}>{errors.items[index].itemId}</div>}
    </>
  );

  // Under the item's last line: always shown, disabled with the reason when no unit is left to add.
  const renderGroupFooter = (item, index) => {
    const units = item.units || [];
    const unused = units.map((unit, unitIndex) => ({ unit, unitIndex })).filter(line => !line.unit.selected);
    const blockedReason = !unused.length ? (units.length === 1 ? SAMPLE_CATALOG_UNIT_HINT.SINGLE_UNIT(units[0].unitName) : SAMPLE_CATALOG_UNIT_HINT.ALL_UNITS_ADDED) : undefined;
    return (
      <div className="mt-1.5">
        <PermissionButton
          type="link"
          className="!h-auto !p-0"
          style={blockedReason ? undefined : { color: colorPalette.primary[500] }}
          disabled={Boolean(blockedReason)}
          tooltipTitle={blockedReason}
          onClick={() => offerUnit(item, index, unused[0].unitIndex)}
          text={
            <span className="inline-flex items-center gap-1 text-xs">
              <Icons.PlusCircleOutlined className="text-xs" />
              {SAMPLE_CATALOG_UNIT_HINT.ADD_UNIT}
            </span>
          }
        />
      </div>
    );
  };

  const renderDeleteCell = (className, onDelete, label) => (
    <td className={`${className} px-1 text-end`}>
      {onDelete ? (
        <div className="flex h-[36px] items-center justify-end">
          <Icons.DeleteOutlined style={{ fontSize: 15, color: colorPalette.error[500], cursor: 'pointer' }} onClick={onDelete} aria-label={label} />
        </div>
      ) : (
        <div className="h-[36px]" />
      )}
    </td>
  );

  const renderNumberCell = (index, line, className) => {
    const base = `items.${index}.units.${line.unitIndex}`;
    const unitErrors = errors.items?.[index]?.units?.[line.unitIndex];
    const unitTouched = touched.items?.[index]?.units?.[line.unitIndex];
    return NUMBER_FIELDS.map(field => (
      <td key={field} className={className}>
        <input
          type="text"
          inputMode="decimal"
          className={`${INPUT} ${field === 'samplePrice' ? 'text-right' : 'text-center'}`}
          name={`${base}.${field}`}
          placeholder="0"
          value={line.unit[field] ?? ''}
          onChange={e => {
            if (e.target.value === '' || DECIMAL_INPUT.test(e.target.value)) setFieldValue(`${base}.${field}`, e.target.value);
          }}
          onBlur={e => {
            const num = parseFloat(e.target.value);
            if (!Number.isNaN(num)) setFieldValue(`${base}.${field}`, num.toString());
            handleBlur(e);
          }}
        />
        {unitErrors?.[field] && unitTouched?.[field] && <div className={ERROR}>{unitErrors[field]}</div>}
      </td>
    ));
  };

  const renderUnitCell = (item, index, line, className) => {
    // This line's unit plus any unit not already on another line of the same item.
    const options = (item.units || [])
      .map((unit, unitIndex) => ({ unit, unitIndex }))
      .filter(option => option.unitIndex === line.unitIndex || !option.unit.selected)
      .map(option => ({ label: option.unit.unitName, value: option.unitIndex }));
    return (
      <td className={className}>
        <Select
          placeholder="Unit"
          className="item-unit-select w-full"
          popupMatchSelectWidth={false}
          value={line.unitIndex}
          options={options}
          disabled={options.length <= 1}
          onChange={unitIndex => {
            // The new unit takes over this line's position.
            setUnitSelected(index, line.unitIndex, false);
            offerUnit(item, index, unitIndex, line.unit.lineOrder);
          }}
          aria-label={`Unit for item ${index + 1}`}
        />
        {line.unit.conversion && <div className={HINT}>{line.unit.conversion}</div>}
      </td>
    );
  };

  return (
    <div className="pt-2">
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white pr-4 pl-1 pt-4 shadow-sm">
        <div className="ml-4 mb-3">
          <div className="text-sm font-semibold text-gray-900">Item Table</div>
          <div className="text-xs text-gray-500 mt-0.5">Pick an item, then add a line for each extra unit you offer.</div>
        </div>
        <FieldArray name="items">
          {({ push, remove }) => (
            <>
              <table className="w-full min-w-full max-md:min-w-[900px] table-fixed" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                <thead>
                  <tr className="w-full text-[10px] uppercase tracking-wide text-gray-500">
                    <th className={`${TH} px-3 text-start w-[340px]`}>Item Details</th>
                    <th className={`${TH} text-start w-[150px]`}>Unit</th>
                    <th className={`${TH} text-end w-[150px]`}>Sample Price</th>
                    <th className={`${TH} text-center w-[130px]`}>Min Qty</th>
                    <th className={`${TH} text-center w-[130px]`}>Max Qty</th>
                    <th className={`${TH} px-1 w-[28px]`}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lines = offeredLines(item);
                    if (!item.itemId || !lines.length) {
                      return (
                        <tr key={index}>
                          <td className={`${TD} px-3 text-start`}>
                            {renderItemSelect(item, index, push)}
                            {item.itemId && renderGroupFooter(item, index)}
                          </td>
                          <td className={TD} colSpan={4} />
                          {renderDeleteCell(TD, items.length > 1 ? () => remove(index) : null, `Remove item ${index + 1}`)}
                        </tr>
                      );
                    }
                    return (
                      <Fragment key={index}>
                        {lines.map((line, lineIndex) => {
                          const isLast = lineIndex === lines.length - 1;
                          const cell = isLast ? TD : TD_IN_GROUP;
                          const canDelete = lines.length > 1 || items.length > 1;
                          return (
                            <tr key={line.unit.itemUnitId}>
                              <td className={`${cell} px-3 text-start`}>
                                {lineIndex === 0 ? (
                                  renderItemSelect(item, index, push)
                                ) : (
                                  <div className="ml-1.5 flex h-[36px] items-center border-0 border-l-2 border-solid border-gray-200 pl-3 text-xs text-gray-500">
                                    {SAMPLE_CATALOG_UNIT_HINT.SAME_ITEM}
                                  </div>
                                )}
                                {isLast && renderGroupFooter(item, index)}
                              </td>
                              {renderUnitCell(item, index, line, cell)}
                              {renderNumberCell(index, line, cell)}
                              {renderDeleteCell(cell, canDelete ? () => removeLine(index, line.unitIndex, lines.length, remove) : null, `Remove ${line.unit.unitName} line`)}
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mt-3 ms-1 mb-3">
                <CustomButton
                  type="primary"
                  onClick={() => push(emptySampleCatalogItem())}
                  text={
                    <div className="flex gap-1 text-xs items-center">
                      <Icons.PlusCircleOutlined className="text-xs" />
                      <div>Add Item</div>
                    </div>
                  }
                />
              </div>
            </>
          )}
        </FieldArray>
      </div>
    </div>
  );
};

export default SampleCatalogItemTable;
