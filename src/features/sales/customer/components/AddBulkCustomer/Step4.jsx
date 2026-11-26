import { useMemo, useState } from 'react';
import { Button, Card } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatImportPreviewCell } from 'utils/util';
import { flattenVerifyRecordForPreview } from '@/features/sales/customer/customer.utils';
import { getPartnerMappingFields } from './data';

const Step4 = ({ verifyRecords, isVendorPage = false }) => {
  const [showValidDetails, setShowValidDetails] = useState(true);

  const partnerLabel = isVendorPage ? 'vendors' : 'customers';
  const validRecordsCount = verifyRecords?.validRecordsCount ?? 0;
  const validRecords = verifyRecords?.validRecords ?? [];
  const mappingFields = useMemo(() => getPartnerMappingFields(isVendorPage), [isVendorPage]);

  const validColumns = useMemo(
    () => [
      { title: 'S.No.', dataIndex: 'rowNumber', key: 'rowNumber', width: 70, fixed: 'left', render: (_, __, index) => index + 1 },
      ...mappingFields.map(field => ({
        title: field.label,
        dataIndex: field.id,
        key: field.id,
        render: formatImportPreviewCell,
      })),
    ],
    [mappingFields]
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
                  Ready to import - {validRecordsCount} {partnerLabel.slice(0, -1)}
                  {validRecordsCount === 1 ? '' : 's'}
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{isVendorPage ? 'Vendors' : 'Customers'} that will be imported</p>
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

            {validRecordsCount === 0 && <p className="mt-2 text-sm text-gray-600">No valid records available to import. Go back to review verification results.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Step4;
