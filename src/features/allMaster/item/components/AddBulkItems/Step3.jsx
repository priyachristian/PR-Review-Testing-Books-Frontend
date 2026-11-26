import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Select } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatImportPreviewCell } from 'utils/util';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import { useItemUnit } from '@/features/setting/itemUnit';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { BULK_ITEM_VERIFY_ERROR } from '@/utils/constants';
import {
  isItemGroupMissingError,
  isItemUnitMissingError,
  isSubItemGroupMissingError,
  BULK_ITEM_ACCOUNT_FIX_CONFIG,
  getAccountFixConfigsForErrors,
  formatVerifyErrors,
  getEffectiveVerifyRecords,
  getResolvedSelectValue,
} from '@/features/allMaster/item/item.utils';
import { itemVerifyDisplayFields } from './data';

const Step3 = ({ verifyRecords, localRecords, onItemGroupFix, onSubItemGroupFix, onItemUnitFix, onAccountFix }) => {
  const [showValidDetails, setShowValidDetails] = useState(false);
  const [showInvalidDetails, setShowInvalidDetails] = useState(true);
  const [showLocalInvalidDetails, setShowLocalInvalidDetails] = useState(true);

  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const { subItemGroupDrop, subItemGroupDropLoading, getSubItemGroupDropdown } = useSubItemGroup();
  const { itemUnitsDrop, dropLoading: itemUnitsDropLoading, getItemUnitsDrop } = useItemUnit();
  const { accountDrop, droploading: accountDropLoading, getAccounts } = useChartOfAccounts();

  const invalidRecords = verifyRecords?.invalidRecords ?? [];
  const effectiveVerifyRecords = useMemo(() => getEffectiveVerifyRecords(verifyRecords), [verifyRecords]);
  const totalRecords = verifyRecords?.totalRecords ?? 0;
  const validRecordsCount = effectiveVerifyRecords.validRecordsCount;
  const invalidRecordsCount = effectiveVerifyRecords.invalidRecordsCount;
  const validRecords = effectiveVerifyRecords.validRecords;
  const displayInvalidRecords = effectiveVerifyRecords.invalidRecords;

  const localInvalidRecords = localRecords?.invalidRecords ?? [];
  const localInvalidRecordsCount = localRecords?.invalidRecordsCount ?? 0;

  const fixableItemGroupRecords = useMemo(
    () => invalidRecords.map((record, index) => ({ record, index })).filter(({ record }) => (record.errors || []).some(isItemGroupMissingError)),
    [invalidRecords]
  );

  const fixableSubItemGroupRecords = useMemo(
    () => invalidRecords.map((record, index) => ({ record, index })).filter(({ record }) => (record.errors || []).some(isSubItemGroupMissingError)),
    [invalidRecords]
  );

  const fixableItemUnitRecords = useMemo(() => invalidRecords.map((record, index) => ({ record, index })).filter(({ record }) => (record.errors || []).some(isItemUnitMissingError)), [invalidRecords]);

  const fixableAccountRecords = useMemo(
    () =>
      invalidRecords
        .map((record, index) => ({
          record,
          index,
          accountFixes: getAccountFixConfigsForErrors(record.errors),
        }))
        .filter(({ accountFixes }) => accountFixes.length > 0),
    [invalidRecords]
  );

  useEffect(() => {
    if (!fixableItemGroupRecords.length || itemGroupDrop != null) return undefined;

    const controller = new AbortController();
    getItemGroupDropdown({ signal: controller.signal });

    return () => controller.abort();
  }, [fixableItemGroupRecords.length, getItemGroupDropdown, itemGroupDrop]);

  useEffect(() => {
    if (!fixableSubItemGroupRecords.length || subItemGroupDrop != null) return undefined;

    const controller = new AbortController();
    getSubItemGroupDropdown({ signal: controller.signal });

    return () => controller.abort();
  }, [fixableSubItemGroupRecords.length, getSubItemGroupDropdown, subItemGroupDrop]);

  useEffect(() => {
    if (!fixableItemUnitRecords.length) return undefined;

    const controller = new AbortController();
    getItemUnitsDrop({ signal: controller.signal });

    return () => controller.abort();
  }, [fixableItemUnitRecords.length, getItemUnitsDrop]);

  useEffect(() => {
    if (!fixableAccountRecords.length) return undefined;

    const controller = new AbortController();
    BULK_ITEM_ACCOUNT_FIX_CONFIG.forEach(config => getAccounts({ signal: controller.signal, type: config.accountDropType }));

    return () => controller.abort();
  }, [fixableAccountRecords.length, getAccounts]);

  const itemGroupOptions = useMemo(
    () =>
      (itemGroupDrop || []).map(option => ({
        label: option.name,
        value: option.name,
      })),
    [itemGroupDrop]
  );

  const subItemGroupOptions = useMemo(
    () =>
      (subItemGroupDrop || []).map(option => ({
        label: option.name,
        value: option.name,
      })),
    [subItemGroupDrop]
  );

  const itemUnitOptions = useMemo(
    () =>
      (itemUnitsDrop || []).map(option => ({
        label: option.name,
        value: option.name,
      })),
    [itemUnitsDrop]
  );

  const accountOptionsByKey = useMemo(() => {
    const options = {};
    fixableAccountRecords.forEach(({ accountFixes }) => {
      accountFixes.forEach(config => {
        if (options[config.key]) return;
        options[config.key] = (accountDrop[config.accountDropType] || []).map(group => ({
          ...group,
          options: group.options.map(option => ({ ...option, value: option.accountName })),
        }));
      });
    });
    return options;
  }, [accountDrop, fixableAccountRecords]);

  const validColumns = useMemo(
    () =>
      itemVerifyDisplayFields.map(field => ({
        title: field.label,
        dataIndex: field.dataIndex ?? field.id,
        key: field.id,
        render: formatImportPreviewCell,
      })),
    []
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Items that passed server verification</p>
                <CustomTable
                  data={validRecords.map((record, index) => ({
                    key: index,
                    ...record,
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
                    <div key={`${record.itemName}-${index}`} className="grid grid-cols-[1fr_2fr] gap-3 text-sm">
                      <span className="text-gray-900 truncate">{record.itemName || record.itemModelNo || '-'}</span>
                      <span className="text-red-600">{formatVerifyErrors(record.errors)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {fixableItemGroupRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Item Group - {fixableItemGroupRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select a valid item group for records where the group does not exist.</p>
              <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
                {fixableItemGroupRecords.map(({ record, index }) => (
                  <div key={`fix-group-${record.itemName}-${index}`} className="grid grid-cols-[1fr_2fr] items-center gap-3 text-sm">
                    <span className="text-gray-900 truncate">{record.itemName || record.itemModelNo || '-'}</span>
                    <Select
                      placeholder="Select item group"
                      className="w-full"
                      options={itemGroupOptions}
                      loading={itemGroupDropLoading}
                      showSearch
                      optionFilterProp="label"
                      value={getResolvedSelectValue(record, BULK_ITEM_VERIFY_ERROR.ITEM_GROUP_NOT_FOUND, record.itemGroup)}
                      onChange={groupName => onItemGroupFix?.(index, groupName)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixableSubItemGroupRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Sub Item Group - {fixableSubItemGroupRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select a valid sub item group for records where the group does not exist.</p>
              <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
                {fixableSubItemGroupRecords.map(({ record, index }) => (
                  <div key={`fix-subgroup-${record.itemName}-${index}`} className="grid grid-cols-[1fr_2fr] items-center gap-3 text-sm">
                    <span className="text-gray-900 truncate">{record.itemName || record.itemModelNo || '-'}</span>
                    <Select
                      placeholder="Select sub item group"
                      className="w-full"
                      options={subItemGroupOptions}
                      loading={subItemGroupDropLoading}
                      showSearch
                      optionFilterProp="label"
                      value={getResolvedSelectValue(record, BULK_ITEM_VERIFY_ERROR.SUB_ITEM_GROUP_NOT_FOUND, record.subItemGroup)}
                      onChange={groupName => onSubItemGroupFix?.(index, groupName)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixableItemUnitRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Item Unit - {fixableItemUnitRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select an active item unit for records where the unit does not exist.</p>
              <div className="mt-3 space-y-2 border-t border-amber-100 pt-3">
                {fixableItemUnitRecords.map(({ record, index }) => (
                  <div key={`fix-unit-${record.itemName}-${index}`} className="grid grid-cols-[1fr_2fr] items-center gap-3 text-sm">
                    <span className="text-gray-900 truncate">{record.itemName || record.itemModelNo || '-'}</span>
                    <Select
                      placeholder="Select item unit"
                      className="w-full"
                      options={itemUnitOptions}
                      loading={itemUnitsDropLoading}
                      showSearch
                      optionFilterProp="label"
                      value={getResolvedSelectValue(record, BULK_ITEM_VERIFY_ERROR.ITEM_UNIT_NOT_FOUND, record.itemUnit)}
                      onChange={unitName => onItemUnitFix?.(index, unitName)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {fixableAccountRecords.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Icons.ExclamationCircleOutlined className="text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Assign Accounts - {fixableAccountRecords.length}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">Select valid accounts for records where Sales, Purchase, or Inventory account does not exist.</p>
              <div className="mt-3 space-y-3 border-t border-amber-100 pt-3">
                {fixableAccountRecords.map(({ record, index, accountFixes }) => (
                  <div key={`fix-account-${record.itemName}-${index}`} className="space-y-2 rounded-md border border-amber-100 bg-white/60 p-3">
                    <span className="text-sm font-medium text-gray-900 truncate block">{record.itemName || record.itemModelNo || '-'}</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {accountFixes.map(config => (
                        <div key={`${config.key}-${index}`}>
                          <p className="mb-1 text-xs font-medium text-gray-600">{config.label}</p>
                          <Select
                            placeholder={config.placeholder}
                            className="w-full"
                            options={accountOptionsByKey[config.key] || []}
                            loading={accountDropLoading}
                            showSearch
                            optionFilterProp="label"
                            value={getResolvedSelectValue(record, config.errorName, config.getValue(record))}
                            onChange={accountName => onAccountFix?.(index, config.errorName, accountName)}
                          />
                        </div>
                      ))}
                    </div>
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
