import { useNavigate } from 'react-router-dom';

// Components
import { Tag } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DetailField } from '@/components/ui';

// Extras
import Icons from 'assets/icons/icon';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { formatQtyWithUnit } from '@/utils/itemLineUnit';
import { colorPalette } from '@/utils/theme';
import { SOURCE_TYPES, SOURCE_ROUTES, DEDUCTED_SOURCE_TYPES, DEDUCTED_SOURCE_ROUTES } from '@/utils/constants';
import { BATCH_SOURCE_TYPE_LABELS, renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const BatchStatCard = ({ label, value, icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 h-full">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: colorPalette.primary[50], color: colorPalette.primary[500] }}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
  </div>
);

const convertedStockColumns = [
  {
    title: 'Unit',
    dataIndex: 'unitName',
    key: 'unitName',
    render: val => val || '',
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    render: val => (val != null ? val : ''),
  },
  {
    title: 'Remaining Qty',
    dataIndex: 'remainingQty',
    key: 'remainingQty',
    render: val => (val != null ? val : ''),
  },
];

const renderSourceType = (sourceType, sourceNo) => {
  if (!sourceType) return '-';
  const label = BATCH_SOURCE_TYPE_LABELS[sourceType] || sourceType;
  const display = sourceNo ? `${label} (${sourceNo})` : label;
  return <Tag className="font-semibold m-0">{display}</Tag>;
};

const BatchDetailContent = ({ batch, variant = 'compact', className = '' }) => {
  const navigate = useNavigate();
  const isPage = variant === 'page';

  const sectionClass = isPage ? 'my-container container-spacing' : 'bg-white border border-gray-200 rounded-xl p-4';
  const titleClass = isPage ? 'font-bold text-lg' : 'font-bold text-base text-gray-900 mb-4';
  const sectionTitleClass = isPage ? 'font-bold text-lg' : 'font-bold text-base text-gray-900';
  const fieldGridClass = isPage ? 'grid md:grid-cols-2 lg:grid-cols-4 gap-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8';
  const titleWrapClass = isPage ? 'pb-2' : 'mb-4';

  const renderDocumentNo = (sourceType, docNo, sourceId, allowedTypes, routes) => {
    if (!docNo) return '-';

    const canRedirect = !!sourceId && allowedTypes.includes(sourceType) && !!routes[sourceType];

    return (
      <Tag className={`font-semibold m-0 ${canRedirect ? 'cursor-pointer' : ''}`} onClick={canRedirect ? () => navigate(routes[sourceType](sourceId)) : undefined}>
        {docNo}
      </Tag>
    );
  };

  const handleReferenceBatchClick = record => {
    const id = record?.batchId?._id || record?.batchId?.id || record?.batchId;
    if (!id) return;
    navigate(`/${ADMIN_ROUTE_PATHS.itemBatches.build.detail(id)}`);
  };

  const referenceBatchColumns = [
    {
      title: 'Batch No',
      dataIndex: 'batchNo',
      key: 'batchNo',
      render: (batchNo, record) => {
        const id = record?.batchId?._id || record?.batchId?.id || record?.batchId;
        if (batchNo == null) return '-';
        return (
          <Tag className={`font-semibold m-0 ${id ? 'cursor-pointer' : ''}`} onClick={id ? () => handleReferenceBatchClick(record) : undefined}>
            Batch {batchNo}
          </Tag>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: val => (val != null ? val : '-'),
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: val => (val != null ? formatAmount(val) : '-'),
    },
  ];

  const deductionColumns = [
    {
      title: 'Document No',
      dataIndex: 'docNo',
      key: 'docNo',
      render: (docNo, record) => renderDocumentNo(record?.deductedSourceType, docNo, record?.deductedSourceId, DEDUCTED_SOURCE_TYPES, DEDUCTED_SOURCE_ROUTES),
    },
    {
      title: 'Source Type',
      dataIndex: 'deductedSourceType',
      key: 'deductedSourceType',
      render: (sourceType, record) => renderSourceType(sourceType, record?.deductedSourceNo),
    },
    {
      title: 'Quantity Deducted',
      dataIndex: 'quantityDeducted',
      key: 'quantityDeducted',
      render: quantityDeducted => {
        const formatted = formatQtyWithUnit(quantityDeducted, batch?.itemUnitId?.name || batch?.itemUnitName);
        return formatted === '' ? '-' : formatted;
      },
      width: 150,
    },
    {
      title: 'Selling Qty',
      dataIndex: 'sellingQuantity',
      key: 'sellingQuantity',
      render: (sellingQuantity, record) => {
        const formatted = formatQtyWithUnit(sellingQuantity, record?.sellingUnitId?.name);
        return formatted === '' ? '-' : formatted;
      },
      width: 140,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: val => (val != null ? formatAmount(val) : '-'),
      width: 120,
    },
    {
      title: 'Deducted At',
      dataIndex: 'deductedAt',
      key: 'deductedAt',
      render: val => (val ? dateFormateForUi(val) : '-'),
      width: 120,
    },
  ];

  if (!batch) return null;

  const itemId = batch?.itemId?._id || batch?.itemId?.id || (typeof batch?.itemId === 'string' ? batch.itemId : null);
  const itemName = batch?.itemId?.itemName || batch?.itemName;
  const itemNo = batch?.itemId?.itemNo || batch?.itemNo;
  const unitName = batch?.itemUnitId?.name || batch?.itemUnitName || batch?.itemUnit;

  return (
    <div className={`${isPage ? 'space-y-10 pb-5' : 'space-y-5'} ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BatchStatCard label="Quantity" value={formatQtyWithUnit(batch?.quantity, unitName) || (batch?.quantity ?? '-')} icon={<Icons.InboxOutlined />} />
        <BatchStatCard label="Remaining Qty" value={formatQtyWithUnit(batch?.remainingQty, unitName) || (batch?.remainingQty ?? '-')} icon={<Icons.DatabaseOutlined />} />
        <BatchStatCard label="Document Unit Price" value={batch?.documentUnitRate != null ? formatAmount(batch.documentUnitRate) : '-'} icon={<Icons.DollarOutlined />} />
      </div>

      <div className={sectionClass}>
        <p className={titleClass}>Item Information</p>
        <div className={isPage ? 'mt-2 space-y-3' : ''}>
          <div className={fieldGridClass}>
            <DetailField label="Item Name" value={itemName} truncate={false} valueClassName="break-words" />
            <DetailField label="Item No">
              {itemNo ? (
                <Tag className={`font-semibold m-0 ${itemId ? 'cursor-pointer' : ''}`} onClick={itemId ? () => navigate(`/${ADMIN_ROUTE_PATHS.itemMaster.build.detail(itemId)}`) : undefined}>
                  {itemNo}
                </Tag>
              ) : (
                '-'
              )}
            </DetailField>
            <DetailField label="Main Unit" value={unitName} />
            <DetailField label="Purchase Unit" value={batch?.purchaseUnitId?.name} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={titleClass}>Batch Information</p>
        <div className={isPage ? 'mt-2 space-y-3' : ''}>
          <div className={fieldGridClass}>
            <DetailField label="Batch No" value={renderBatchNumber(batch?.batchNo, batch?._id || batch?.id, 'Batch ')} />
            <DetailField label="Division" value={batch?.divisionId?.name || batch?.divisionName} />
            <DetailField label="Branch" value={batch?.branchId?.name || batch?.branchName} />
            <DetailField label="Warehouse" value={batch?.warehouseId?.name || batch?.warehouseName} />
            <DetailField label="Purchase Price" value={batch?.purchasePrice != null ? formatAmount(batch.purchasePrice) : undefined} />
            <DetailField label="Purchase Quantity" value={formatQtyWithUnit(batch?.purchaseQuantity, batch?.purchaseUnitId?.name) || undefined} />
            <DetailField label="Conversion Factor" value={batch?.conversionFactor} />
            <DetailField label="Vendor Batch No" value={renderBatchNumber(batch?.vendorBatchNo, batch?._id || batch?.id)} />
            <DetailField label="User Batch No" value={renderBatchNumber(batch?.userBatchNo, batch?._id || batch?.id)} />
            <DetailField label="Vendor Expiry" value={batch?.vendorBatchExpiry ? dateFormateForUi(batch.vendorBatchExpiry) : undefined} />
            <DetailField
              label="Source Type"
              value={
                batch?.sourceType
                  ? batch?.sourceNo
                    ? `${BATCH_SOURCE_TYPE_LABELS[batch.sourceType] || batch.sourceType} (${batch.sourceNo})`
                    : BATCH_SOURCE_TYPE_LABELS[batch.sourceType] || batch.sourceType
                  : undefined
              }
            />
            <DetailField label="Document No">{renderDocumentNo(batch?.sourceType, batch?.docNo, batch?.sourceId, SOURCE_TYPES, SOURCE_ROUTES)}</DetailField>
          </div>
        </div>
      </div>

      {Array.isArray(batch?.convertedStockDetails) ? (
        <div className={sectionClass}>
          <div className={titleWrapClass}>
            <p className={sectionTitleClass}>Converted Stock</p>
          </div>
          {batch.convertedStockDetails.length > 0 ? (
            <CustomTable columns={convertedStockColumns} data={batch.convertedStockDetails} pagination={false} tableId="itemUnitId" size="small" scroll={{ x: 'max-content' }} dynamicScrollY={false} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50">
              <Icons.InboxOutlined className="text-3xl mb-2" />
              <p className="text-sm text-gray-500">No converted stock</p>
            </div>
          )}
        </div>
      ) : null}

      {Array.isArray(batch?.referenceBatches) && batch.referenceBatches.length > 0 ? (
        <div className={sectionClass}>
          <div className={titleWrapClass}>
            <p className={sectionTitleClass}>Reference Batches</p>
          </div>
          <CustomTable columns={referenceBatchColumns} data={batch.referenceBatches} pagination={false} size="small" scroll={{ x: 'max-content' }} dynamicScrollY={false} />
        </div>
      ) : null}

      <div className={sectionClass}>
        <div className={titleWrapClass}>
          <p className={sectionTitleClass}>Deductions</p>
        </div>
        {(batch?.deductions?.length ?? 0) > 0 ? (
          <CustomTable columns={deductionColumns} data={batch.deductions} pagination={false} size="small" scroll={{ x: 'max-content' }} dynamicScrollY={false} />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Icons.FileTextOutlined className="text-3xl mb-2" />
            <p className="text-sm text-gray-500">No deductions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchDetailContent;
