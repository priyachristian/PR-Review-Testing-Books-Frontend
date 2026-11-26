import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Input, Radio, Select, Switch, Space } from 'antd';

// Extras
import { formatAmount } from '@/utils/currency';
import { amountField } from '@/utils/util';
import { buildTaxContext, calculatediscountedValue, isIGSTExists } from 'utils/services';
import { useDirectTax } from '@/features/setting/directTax/useDirectTax';
const { Option } = Select;

export const getGrandTotalForDisplay = (values, currency) => {
  const shouldRoundOff = values?.isRoundOff;
  const rawTotal = values?.isSplit ? values?.subTotal : values?.total;
  const roundedTotal = shouldRoundOff ? Math.round(parseFloat(rawTotal || 0)) : parseFloat(rawTotal || 0);

  return formatAmount(roundedTotal, false, currency);
};

export const GrandTotalBar = ({ values, className = '', currency }) => {
  return (
    <div className={`flex items-center gap-4 shrink-0 ${className}`}>
      <div>
        <div className="text-sm font-semibold text-gray-900">Grand Total ({currency?.symbol})</div>
        <div className="text-xs text-gray-500 mt-1">Inclusive of taxes (as applicable)</div>
      </div>
      <div className="text-xl font-bold tabular-nums text-gray-900 pl-4 border-l border-gray-200">{getGrandTotalForDisplay(values, currency)}</div>
    </div>
  );
};

const TotalContainer = ({
  profile,
  selectedCustomer,
  values,
  calculateAmounts,
  setFieldValue,
  discountConfig,
  disabled,
  currency,
  className = '',
  directTaxTypes,
  isDirectTaxApplicable,
  documentDate,
}) => {
  const { taxesDrop, droploading, getTaxesDropdown } = useDirectTax();
  const [pickedType, setPickedType] = useState(directTaxTypes?.[0]);
  const showDirectTax = !values?.isSplit && (isDirectTaxApplicable || !!values?.tax?.taxId);
  const directTaxType = values?.tax?.type || pickedType;

  useEffect(() => {
    if (!showDirectTax || !documentDate) return;
    const controller = new AbortController();
    getTaxesDropdown({ type: directTaxType, date: dayjs(documentDate).format('YYYY-MM-DD'), signal: controller.signal });
    return () => controller.abort();
  }, [showDirectTax, directTaxType, documentDate]);

  const taxContext =
    values?.taxContext || buildTaxContext(profile, selectedCustomer, values?.vendorId || values?.vendor ? selectedCustomer?.address?.billing?.state || '' : selectedCustomer?.address?.shipping?.state);
  let isIGST = values?.taxSplit ? values.taxSplit === 'IGST' : isIGSTExists(taxContext);

  const roundOffAmount = parseFloat(values?.roundOffAmount || 0);
  const totalForDisplay = getGrandTotalForDisplay(values, currency);

  const applyDirectTax = (tax, isTaxAmountManual) => {
    setFieldValue('tax', tax);
    setFieldValue('isTaxAmountManual', isTaxAmountManual);
    calculateAmounts({ ...values, tax, isTaxAmountManual, taxContext }, setFieldValue, discountConfig);
  };

  const handleDirectTaxTypeChange = event => {
    setPickedType(event.target.value);
    if (values?.tax) applyDirectTax(null);
  };

  // A saved tax that has since expired is still shown on its own document.
  const directTaxes = [...taxesDrop];
  const savedTax = values?.tax;
  if (savedTax?.taxId && !directTaxes.some(tax => tax.taxId === savedTax.taxId)) {
    directTaxes.unshift(savedTax);
  }

  const directTaxOptions = directTaxes.map(tax => ({
    value: tax.taxId,
    label: tax.taxName,
    search: `${tax.paymentCode} ${tax.taxName} ${tax.rate}`,
    optionText: `${tax.paymentCode} - ${tax.taxName} (${tax.rate}%)`,
  }));

  const handleDirectTaxChange = taxId => {
    if (!taxId) {
      applyDirectTax(null);
      return;
    }

    const tax = directTaxes.find(item => item.taxId === taxId);
    applyDirectTax({ ...tax, amount: null }, false);
  };
  return (
    <div className={`w-full sm:w-[440px] ml-auto bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 py-1.5">
        {!values?.isSplit && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-600">Sub Total</div>
            <div className="text-xs font-semibold text-gray-900 tabular-nums mr-3.5">{formatAmount(values?.subTotal || 0, false, currency)}</div>
          </div>
        )}

        {discountConfig?.appliesTo === 'TRANSACTION' && !values?.isSplit && (
          <div className="py-2 border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
            <div className="text-xs font-medium text-gray-600 truncate">Discount</div>
            <div className="flex items-center justify-end gap-2.5 shrink-0">
              {values?.discountValue && !isNaN(values?.discountValue) && values?.discountValue > 0 ? (
                <div className="text-xs font-semibold text-gray-900 tabular-nums text-end min-w-[55px] mr-3.5 shrink-0">
                  {calculatediscountedValue(values?.items, values?.discountType, values?.discountValue)}
                </div>
              ) : null}
              <div className="w-[160px] relative z-0 shrink-0">
                <Space.Compact className="w-full flex [&_.ant-select-selector]:!rounded-l-md [&_.ant-input]:!rounded-r-md [&_.ant-select]:!z-0">
                  <Select
                    value={values.discountType || 'PERCENTAGE'}
                    styles={{ popup: { root: { zIndex: 1 } } }}
                    onChange={val => {
                      setFieldValue('discountType', val);
                      calculateAmounts({ ...values, discountType: val, taxContext }, setFieldValue, discountConfig);
                    }}
                    style={{ width: 65, height: 30 }}
                    size="small"
                    disabled={disabled}
                  >
                    <Option value="PERCENTAGE">%</Option>
                    <Option value="AMOUNT">{currency?.symbol}</Option>
                  </Select>

                  <Input
                    value={values?.discountValue}
                    onChange={e => {
                      const newAmount = e.target.value;
                      setFieldValue('discountValue', newAmount);
                      calculateAmounts(
                        {
                          ...values,
                          discountValue: newAmount,
                          discountType: values.discountType || 'PERCENTAGE',
                          taxContext,
                        },
                        setFieldValue,
                        discountConfig
                      );
                    }}
                    placeholder="Enter Amount"
                    className="!text-xs text-end"
                    style={{ width: 'calc(100% - 65px)', height: 30 }}
                    size="small"
                    disabled={disabled}
                  />
                </Space.Compact>
              </div>
            </div>
          </div>
        )}

        {!values?.isSplit && (
          <>
            {values?.additionalcharge?.map(item => {
              return (
                <div className="py-2 border-b border-gray-100 flex items-center justify-between gap-3" key={item?.name}>
                  <div className="text-xs font-medium text-gray-600 truncate">{`${item?.name} ${item?.taxRate ? `@${item?.taxRate}%` : ''}`}</div>
                  <Input
                    placeholder="Enter Amount"
                    className="w-[160px] text-end !h-[30px] !text-xs rounded-md"
                    value={item.amount}
                    onChange={e => {
                      const newAmount = e.target.value;
                      const updatedChargeArr = values?.additionalcharge?.map(charge => {
                        if (charge?.name === item?.name) {
                          charge.amount = newAmount;
                        }
                        return charge;
                      });
                      calculateAmounts({ ...values, additionalcharge: updatedChargeArr, taxContext }, setFieldValue, discountConfig);
                    }}
                    size="small"
                  />
                </div>
              );
            })}
          </>
        )}

        {!values?.isSplit ? (
          isIGST ? (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-600">IGST</div>
              <div className="text-xs font-semibold text-gray-900 tabular-nums mr-3.5">{formatAmount(values?.totalTax || 0, false, currency)}</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-600">CGST</div>
                <div className="text-xs font-semibold text-gray-900 tabular-nums  mr-3.5">{formatAmount(values?.totalTax / 2 || 0, false, currency)}</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-600">SGST</div>
                <div className="text-xs font-semibold text-gray-900 tabular-nums  mr-3.5">{formatAmount(values?.totalTax / 2 || 0, false, currency)}</div>
              </div>
            </>
          )
        ) : (
          ''
        )}

        {!values?.isSplit && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="text-xs text-gray-500">Total Tax Amount</div>
            <div className="text-xs font-semibold text-gray-900 tabular-nums  mr-3.5">{formatAmount(values?.totalTax || 0, false, currency)}</div>
          </div>
        )}

        {showDirectTax && (
          <div className="py-2 border-b border-gray-100 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
            {directTaxTypes?.length > 1 ? (
              <Radio.Group size="small" value={directTaxType} onChange={handleDirectTaxTypeChange} options={directTaxTypes.map(item => ({ value: item, label: item }))} />
            ) : (
              <div className="text-xs font-medium text-gray-600">{directTaxType}</div>
            )}
            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <Select
                className="w-[160px] [&_.ant-select-selection-item]:truncate"
                size="small"
                showSearch
                allowClear
                placeholder={`Select ${directTaxType}`}
                value={values?.tax?.taxId}
                options={directTaxOptions}
                loading={droploading}
                optionFilterProp="search"
                popupMatchSelectWidth={false}
                optionRender={option => <span className="text-xs">{option.data.optionText}</span>}
                onChange={handleDirectTaxChange}
              />
              {values?.tax?.taxId && (
                <Input
                  size="small"
                  className="w-[90px] !h-[30px] !text-xs text-end"
                  prefix={values.tax.type === 'TDS' ? '-' : '+'}
                  value={values.tax.amount}
                  onChange={e => applyDirectTax({ ...values.tax, amount: e.target.value }, true)}
                  onBlur={e => {
                    const amount = Number(amountField.blur(e.target.value));
                    applyDirectTax({ ...values.tax, amount: amount > 0 ? amount : 0 }, true);
                  }}
                  disabled={disabled}
                />
              )}
            </div>
          </div>
        )}

        {!values?.importBill && !values?.importGrpo && !values?.importPurchaseOrder && (
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-gray-600">Round Off</div>
              <Switch
                checked={!!values?.isRoundOff}
                onChange={checked => {
                  setFieldValue('isRoundOff', checked);
                  calculateAmounts({ ...values, isRoundOff: checked, taxContext }, setFieldValue, discountConfig);
                }}
                size="small"
              />
            </div>
            {values?.isRoundOff && roundOffAmount !== 0 && <div className="text-xs font-semibold text-gray-900 tabular-nums mr-3.5">{formatAmount(roundOffAmount || 0, false, currency)}</div>}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Grand Total ({currency?.symbol})</div>
          <div className="text-[11px] text-gray-500 leading-tight">Inclusive of taxes (as applicable)</div>
        </div>
        <div className="text-lg font-bold tabular-nums text-gray-900 mr-3.5">{totalForDisplay}</div>
      </div>
    </div>
  );
};

export default TotalContainer;
