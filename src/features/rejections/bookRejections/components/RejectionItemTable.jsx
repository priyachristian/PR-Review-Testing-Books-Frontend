import { useMemo, useCallback } from 'react';
import { FieldArray } from 'formik';
import dayjs from 'dayjs';

// Components
import { Select, Spin, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { ProductionDataDot, buildProductionItemSelectOptions, productionItemColumnSelectHeader } from '@/utils/tableSelectDropdown/productionItemSelectDropdown';

const EMPTY_ITEM_TEMPLATE = {
  itemId: null,
  itemName: '',
  itemNo: '',
  watt: '',
  booked: '',
  mfgDate: null,
};

const itemSelectFilterOption = (input, option) => {
  const query = (input ?? '').toLowerCase();
  const text = String(option?.searchLabel ?? option?.label ?? '').toLowerCase();
  return text.includes(query);
};

const renderItemSelectOption = option => {
  const data = option?.data ?? option;
  const itemNo = data?.columnId ?? '-';
  const itemName = data?.columnName ?? '-';

  return (
    <div className="item-select-dropdown-row item-select-dropdown-row--with-production-data">
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">
        <Tag className="font-semibold max-w-full truncate" title={itemNo}>
          {itemNo}
        </Tag>
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name" title={itemName}>
        {itemName}
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--production-data">
        <ProductionDataDot isAdded={Boolean(data?.isProductionDataAdded)} />
      </span>
    </div>
  );
};

const renderItemSelectDropdown = menu => (
  <div className="item-select-dropdown-panel">
    <div className="item-select-dropdown-header item-select-dropdown-header--with-production-data">
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">{productionItemColumnSelectHeader.id}</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name">{productionItemColumnSelectHeader.name}</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--production-data">{productionItemColumnSelectHeader.productionData}</span>
    </div>
    {menu}
  </div>
);

const RejectionItemTable = ({ values, arr, itemsDrop, itemsDropLoading = false, setFieldValue, errors, handleBlur, handleChange, touched, disabled }) => {
  const itemSelectOptions = useMemo(() => buildProductionItemSelectOptions(itemsDrop, null, itemsDrop), [itemsDrop]);
  const renderOption = useCallback(option => renderItemSelectOption(option), []);
  const renderDropdown = useCallback(menu => renderItemSelectDropdown(menu), []);

  const findItem = (itemId, list) => (list || []).find(item => String(item._id || item.id) === String(itemId));

  return (
    <div id="items" className={`pt-6 ${disabled ? 'mb-5' : ''}`}>
      <div className="w-full max-w-full overflow-x-auto lg:overflow-x-visible overflow-y-hidden">
        <table className="border-collapse w-full min-w-full max-md:min-w-[800px] table-fixed">
          <thead>
            <tr className="w-full text-sm">
              <th className="border px-2 py-3 bg-gray-50 text-start w-[350px]">Item Details</th>
              <th className="border px-2 py-3 bg-gray-50 text-start whitespace-nowrap w-[150px]">Item Code</th>
              <th className="border px-2 py-3 bg-gray-50 text-start whitespace-nowrap w-[150px]">Wattage</th>
              <th className="border px-2 py-3 bg-gray-50 text-start whitespace-nowrap w-[120px]">Booked Qty</th>
              <th className="border px-2 py-3 bg-gray-50 text-start whitespace-nowrap w-[170px]">Mfg Date</th>
              <th className="px-2 py-3 w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            <FieldArray name="items">
              {({ push }) => (
                <>
                  {arr?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="border text-start align-top relative w-[350px]">
                        <Select
                          showSearch
                          placeholder="Type or click to select an item."
                          filterOption={itemSelectFilterOption}
                          id=""
                          bordered={false}
                          style={{ width: '100%' }}
                          className="item-details-select item-details-select--wrap w-full cursor-pointer"
                          popupClassName="item-select-dropdown-popup item-select-dropdown-popup--item-table"
                          dropdownStyle={{ minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 }}
                          popupMatchSelectWidth={false}
                          optionRender={renderOption}
                          dropdownRender={renderDropdown}
                          name={`items[${index}].itemId`}
                          value={item.itemId}
                          onChange={value => {
                            const selectedItemId = value;
                            const selectedItem = findItem(selectedItemId, itemsDrop);

                            const updatedItems = arr.map((itm, idx) => {
                              if (idx === index) {
                                return {
                                  ...itm,
                                  itemId: selectedItemId,
                                  itemName: selectedItem?.itemName || '',
                                  itemNo: selectedItem?.itemNo || selectedItem?.itemCode || '',
                                };
                              }
                              return itm;
                            });

                            setFieldValue('items', updatedItems);

                            const isLastRow = index === values.items.length - 1;
                            if (!disabled && isLastRow) {
                              push({ ...EMPTY_ITEM_TEMPLATE, id: 'x' + Date.now() });
                            }
                          }}
                          onBlur={handleBlur}
                          options={itemSelectOptions}
                          disabled={disabled}
                          loading={itemsDropLoading}
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
                        {errors.items?.[index]?.itemId && touched.items?.[index]?.itemId && <div className="text-red-500 mt-1 px-2 text-xs">{errors.items[index].itemId}</div>}
                      </td>
                      <td className="w-full border text-center align-top relative">
                        <input
                          type="text"
                          className="focus:outline-none p-2 w-full bg-transparent"
                          name={`items[${index}].itemNo`}
                          value={item.itemNo || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          readOnly
                        />
                      </td>
                      <td className="w-full border text-center align-top relative px-2">
                        <input
                          type="text"
                          className="border-b item-input p-2 w-full"
                          name={`items[${index}].watt`}
                          value={item.watt || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Wattage"
                          disabled={disabled}
                        />
                        {errors.items?.[index]?.watt && touched.items?.[index]?.watt && <div className="text-red-500 text-xs absolute bottom-0 right-2">{errors.items[index].watt}</div>}
                      </td>
                      <td className="w-full border text-center align-top relative px-2">
                        <input
                          type="number"
                          className="border-b item-input p-2 w-full"
                          name={`items[${index}].booked`}
                          value={item.booked || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Booked qty"
                          disabled={disabled}
                        />
                        {errors.items?.[index]?.booked && touched.items?.[index]?.booked && <div className="text-red-500 text-xs mt-1 leading-tight">{errors.items[index].booked}</div>}
                      </td>
                      <td className="w-full border align-top relative px-2 py-1">
                        <CustomInput
                          type="date"
                          name={`items[${index}].mfgDate`}
                          value={item.mfgDate || null}
                          onBlur={handleBlur}
                          setFieldValue={setFieldValue}
                          format="DD/MM/YYYY"
                          disabledDate={d => d.isAfter(dayjs(), 'day')}
                          disabled={disabled}
                        />
                      </td>
                      {!disabled && (
                        <td className="text-center">
                          {arr?.length > 1 ? (
                            <Icons.DeleteOutlined
                              style={{ fontSize: 17, color: colorPalette.error[500] }}
                              className="cursor-pointer hover:opacity-80"
                              onClick={() => {
                                const updatedItems = arr.filter((_, i) => i !== index);
                                setFieldValue('items', updatedItems);
                              }}
                            />
                          ) : null}
                        </td>
                      )}
                    </tr>
                  ))}
                  {!disabled && (
                    <CustomButton
                      type="primary"
                      className="mt-3 ms-1 mb-2"
                      onClick={() => push(EMPTY_ITEM_TEMPLATE)}
                      text={
                        <div className="flex gap-1 text-xs items-center">
                          <Icons.PlusCircleOutlined className="text-xs" />
                          <div>Add Item</div>
                        </div>
                      }
                    />
                  )}
                </>
              )}
            </FieldArray>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RejectionItemTable;
