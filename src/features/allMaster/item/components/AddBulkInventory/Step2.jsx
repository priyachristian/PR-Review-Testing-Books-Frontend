import { useMemo, useState } from 'react';
import { Button, Card } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatImportPreviewCell } from 'utils/util';
import { formatVerifyErrors } from '@/features/allMaster/item/item.utils';
import { buildInventoryPreviewColumns, flattenInventoryRecordForPreview } from './data';

const Step2 = ({ verifyRecords, warehouseNames }) => {
  const [showValidDetails, setShowValidDetails] = useState(false);
  const [showInvalidDetails, setShowInvalidDetails] = useState(true);

  const totalRecords = verifyRecords?.totalRecords ?? 0;
  const validRecordsCount = verifyRecords?.validRecordsCount ?? 0;
  const invalidRecordsCount = verifyRecords?.invalidRecordsCount ?? 0;
  const validRecords = verifyRecords?.validRecords ?? [];
  const invalidRecords = verifyRecords?.invalidRecords ?? [];

  const previewColumns = useMemo(() => buildInventoryPreviewColumns(warehouseNames), [warehouseNames]);

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
                    ...flattenInventoryRecordForPreview(record, warehouseNames),
                  }))}
                  columns={previewColumns.map(col => ({
                    ...col,
                    render: col.render || formatImportPreviewCell,
                  }))}
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
                  {invalidRecords.map((record, index) => (
                    <div key={`${record.itemNo}-${index}`} className="grid grid-cols-[1fr_2fr] gap-3 text-sm">
                      <span className="text-gray-900 truncate">{record.itemNo || '-'}</span>
                      <span className="text-red-600">{formatVerifyErrors(record.errors)}</span>
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

export default Step2;
