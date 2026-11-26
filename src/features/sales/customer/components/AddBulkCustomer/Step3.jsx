import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Select } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatImportPreviewCell } from 'utils/util';
import { BULK_CUSTOMER_VERIFY_ERROR } from '@/utils/constants';
import { useCurrency } from '@/features/setting/currency/useCurrency';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import {
  ADDRESS_TYPES,
  isCurrencyMissingError,
  isPaymentTermsMissingError,
  getLocationFixLevel,
  formatVerifyErrors,
  flattenVerifyRecordForPreview,
  getEffectiveVerifyRecords,
  getResolvedSelectValue,
  isLocationFixResolved,
} from '@/features/sales/customer/customer.utils';
import { getPartnerMappingFields } from './data';
import LocationFixRow from './LocationFixRow';

const Step3 = ({ verifyRecords, localRecords, isVendorPage = false, onCurrencyFix, onPaymentTermsFix, onLocationFix }) => {
  const [showValidDetails, setShowValidDetails] = useState(false);
  const [showInvalidDetails, setShowInvalidDetails] = useState(true);
  const [showLocalInvalidDetails, setShowLocalInvalidDetails] = useState(true);

  const { currencies, loading: currencyLoading, getCurrencies } = useCurrency();
  const { paymentTermsDrop, paymentTermsDropLoading } = usePaymentTermsDropdown();

  const partnerLabel = isVendorPage ? 'Vendors' : 'Customers';
  const invalidRecords = verifyRecords?.invalidRecords ?? [];
  const effectiveVerifyRecords = useMemo(() => getEffectiveVerifyRecords(verifyRecords), [verifyRecords]);
  const totalRecords = verifyRecords?.totalRecords ?? 0;
  const validRecordsCount = effectiveVerifyRecords.validRecordsCount;
  const invalidRecordsCount = effectiveVerifyRecords.invalidRecordsCount;
  const validRecords = effectiveVerifyRecords.validRecords;
  const displayInvalidRecords = effectiveVerifyRecords.invalidRecords;

  const localInvalidRecords = localRecords?.invalidRecords ?? [];
  const localInvalidRecordsCount = localRecords?.invalidRecordsCount ?? 0;
  const displayFields = useMemo(() => getPartnerMappingFields(isVendorPage), [isVendorPage]);

  const fixableCurrencyRecords = useMemo(() => invalidRecords.map((record, index) => ({ record, index })).filter(({ record }) => (record.errors || []).some(isCurrencyMissingError)), [invalidRecords]);

  const fixablePaymentTermsRecords = useMemo(
    () => invalidRecords.map((record, index) => ({ record, index })).filter(({ record }) => (record.errors || []).some(isPaymentTermsMissingError)),
    [invalidRecords]
  );

  const fixableLocationRecords = useMemo(
    () =>
      invalidRecords
        .map((record, index) => {
          const locationFixes = ADDRESS_TYPES.map(addressType => ({
            addressType,
            level: getLocationFixLevel(record.errors, addressType),
          })).filter(item => item.level);

          return locationFixes.length ? { record, index, locationFixes } : null;
        })
        .filter(Boolean),
    [invalidRecords]
  );

  useEffect(() => {
    if (!fixableCurrencyRecords.length || currencies?.length) return undefined;

    const controller = new AbortController();
    getCurrencies({ pagination: false, signal: controller.signal });

    return () => controller.abort();
  }, [fixableCurrencyRecords.length, getCurrencies, currencies]);

  const currencyOptions = useMemo(
    () =>
      (currencies || []).map(currency => ({
        label: `${currency.code} - ${currency.name}`,
        value: currency.code,
      })),
    [currencies]
  );

  const paymentTermsOptions = useMemo(
    () =>
      (paymentTermsDrop || []).map(term => ({
        label: term.name,
        value: term.name,
      })),
    [paymentTermsDrop]
  );

  const validColumns = useMemo(
    () =>
      displayFields.map(field => ({
        title: field.label,
        dataIndex: field.id,
        key: field.id,
        render: formatImportPreviewCell,
      })),
    [displayFields]
  );

  return (
    <div className="space-y-4">
      <Card title="Verification Summary" bordered className="!border-gray-200" styles={{ header: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' } }}>
        <div className="space-y-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-medium text-gray-900">Total records verified:</span> {totalRecords}
          </div>

          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icons.CheckCircleOutlined style={{ color: colorPalette.primary[500] }} />
                <span className="text-sm font-medium text-gray-900">Valid Records - {validRecordsCount}</span>
              </div>
              {validRecordsCount > 0 && (
                <Button type="link" style={{ color: colorPalette.primary[500] }} className="!p-0 !h-auto" onClick={() => setShowValidDetails(prev => !prev)}>
                  {showValidDetails ? 'Hide Details' : 'View Details'}
                  {showValidDetails ? <Icons.UpOutlined className="ml-1 text-xs" /> : <Icons.DownOutlined className="ml-1 text-xs" />}
                </Button>
              )}
            </div>

            {showValidDetails && validRecordsCount > 0 && (
              <div className="mt-3 border-t border-blue-100 pt-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{partnerLabel} that passed server verification</p>
                <CustomTable
                  data={validRecords.map((record, index) => ({
                    key: index,
                    ...flattenVerifyRecordForPreview(record),
                  }))}
                  columns={validColumns}
                  pagination={{ pageSize: 5, total: validRecords.length }}
                  scroll={{ x: true }}
                  dynamicScrollY={false}
                  isPaginationFixed={false}
                />
              </div>
            )}
          </div>

          {invalidRecordsCount > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icons.ExclamationCircleOutlined className="text-orange-500" />
                  <span className="text-sm font-medium text-gray-900">Invalid Records - {invalidRecordsCount}</span>
                </div>
                <Button type="link" style={{ color: colorPalette.warning[500] }} className="!p-0 !h-auto" onClick={() => setShowInvalidDetails(prev => !prev)}>
                  {showInvalidDetails ? 'Hide Details' : 'View Details'}
                  {showInvalidDetails ? <Icons.UpOutlined className="ml-1 text-xs" /> : <Icons.DownOutlined className="ml-1 text-xs" />}
                </Button>
              </div>

              {showInvalidDetails && (
                <div className="mt-3 space-y-2 border-t border-orange-100 pt-3">
                  {displayInvalidRecords.map((record, index) => (
                    <div key={`${record.customerDisplayName}-${index}`} className="grid grid-cols-[1fr_2fr] gap-3 text-sm">
                      <span className="text-gray-900 truncate">{record.customerDisplayName || record.companyName || '-'}</span>
                      <span className="text-red-600">{formatVerifyErrors(record.errors)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {fixableCurrencyRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Currency - {fixableCurrencyRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select a valid currency for records where the currency is not available for this company.</p>
              <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
                {fixableCurrencyRecords.map(({ record, index }) => (
                  <div key={`fix-currency-${record.customerDisplayName}-${index}`} className="grid grid-cols-[1fr_2fr] items-center gap-3 text-sm">
                    <span className="text-gray-900 truncate">{record.customerDisplayName || record.companyName || '-'}</span>
                    <Select
                      placeholder="Select currency"
                      className="w-full"
                      options={currencyOptions}
                      loading={currencyLoading}
                      showSearch
                      optionFilterProp="label"
                      value={getResolvedSelectValue(record, BULK_CUSTOMER_VERIFY_ERROR.CURRENCY_NOT_AVAILABLE, record.otherDetails?.currency)}
                      onChange={currencyCode => onCurrencyFix?.(index, currencyCode)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixablePaymentTermsRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Payment Terms - {fixablePaymentTermsRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select a valid payment terms value for records where the imported payment terms are invalid.</p>
              <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
                {fixablePaymentTermsRecords.map(({ record, index }) => (
                  <div key={`fix-payment-terms-${record.customerDisplayName}-${index}`} className="grid grid-cols-[1fr_2fr] items-center gap-3 text-sm">
                    <span className="text-gray-900 truncate">{record.customerDisplayName || record.companyName || '-'}</span>
                    <Select
                      placeholder="Select payment terms"
                      className="w-full"
                      options={paymentTermsOptions}
                      loading={paymentTermsDropLoading}
                      showSearch
                      optionFilterProp="label"
                      value={getResolvedSelectValue(record, BULK_CUSTOMER_VERIFY_ERROR.INVALID_PAYMENT_TERMS, record.paymentTerms)}
                      onChange={paymentTerms => onPaymentTermsFix?.(index, paymentTerms)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixableLocationRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Location - {fixableLocationRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select a valid location for records with country, state, or city errors.</p>
              <div className="mt-3 space-y-4 border-t border-amber-100 pt-3">
                {fixableLocationRecords.map(({ record, index, locationFixes }) => (
                  <div key={`fix-location-${record.customerDisplayName}-${index}`} className="space-y-2">
                    <span className="text-sm font-medium text-gray-900">{record.customerDisplayName || record.companyName || '-'}</span>
                    {locationFixes.map(({ addressType, level }) => (
                      <LocationFixRow
                        key={`${index}-${addressType}-${level}`}
                        level={level}
                        addressType={addressType}
                        existingCountry={record.address?.[addressType]?.country}
                        existingState={record.address?.[addressType]?.state}
                        appliedLocation={
                          isLocationFixResolved(record, addressType, level)
                            ? {
                                country: record.address?.[addressType]?.country,
                                state: record.address?.[addressType]?.state,
                                city: record.address?.[addressType]?.city,
                              }
                            : null
                        }
                        onApply={location => onLocationFix?.(index, addressType, level, location)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {localInvalidRecordsCount > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icons.CloseCircleOutlined className="text-red-500" />
                  <span className="text-sm font-medium text-gray-900">Skipped due to file validation - {localInvalidRecordsCount}</span>
                </div>
                <Button type="link" className="!p-0 !h-auto text-red-500" onClick={() => setShowLocalInvalidDetails(prev => !prev)}>
                  {showLocalInvalidDetails ? 'Hide Details' : 'View Details'}
                  {showLocalInvalidDetails ? <Icons.UpOutlined className="ml-1 text-xs" /> : <Icons.DownOutlined className="ml-1 text-xs" />}
                </Button>
              </div>

              {showLocalInvalidDetails && (
                <div className="mt-3 space-y-2 border-t border-red-100 pt-3">
                  {localInvalidRecords.map(record => (
                    <div key={`${record.rowNumber}-${record.label}`} className="grid grid-cols-[48px_1fr_2fr] gap-3 text-sm">
                      <span className="font-medium text-gray-700">{record.rowNumber}</span>
                      <span className="text-gray-900 truncate">{record.label}</span>
                      <span className="text-red-600">{record.errors.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Step3;
