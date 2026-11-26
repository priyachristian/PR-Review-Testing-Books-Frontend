import { useMemo, useState } from 'react';
import { Button, Card } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatImportPreviewCell } from 'utils/util';
import { buildOpeningBalancePreviewColumns, flattenOpeningBalanceRecordForPreview } from './data';

const Step3 = ({ verifyRecords, branchNames, isVendorPage = false }) => {
  const [showValidDetails, setShowValidDetails] = useState(true);

  const validRecordsCount = verifyRecords?.validRecordsCount ?? 0;
  const validRecords = verifyRecords?.validRecords ?? [];
  const entityLabel = isVendorPage ? 'vendor' : 'customer';

  const previewColumns = useMemo(
    () =>
      buildOpeningBalancePreviewColumns(branchNames).map(col => ({
        ...col,
        render: col.render || formatImportPreviewCell,
      })),
    [branchNames]
  );

  return (
    <div className="space-y-4">
      <Card title="Import Preview" bordered className="!border-gray-200" styles={{ header: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' } }}>
        <div className="space-y-3">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icons.CheckCircleOutlined style={{ color: colorPalette.primary[500] }} />
                <span className="text-sm font-medium text-gray-900">
                  Ready to import - {validRecordsCount} {entityLabel}(s)
                </span>
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Opening balances that will be imported</p>
                <CustomTable
                  data={validRecords.map((record, index) => ({
                    key: index,
                    ...flattenOpeningBalanceRecordForPreview(record, branchNames),
                  }))}
                  columns={previewColumns}
                  pagination={{ pageSize: 5, total: validRecords.length }}
                  scroll={{ x: true }}
                  dynamicScrollY={false}
                  isPaginationFixed={false}
                />
              </div>
            )}

            {validRecordsCount === 0 && <p className="mt-2 text-sm text-gray-600">No valid records available to import. Go back to review verification results.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Step3;
