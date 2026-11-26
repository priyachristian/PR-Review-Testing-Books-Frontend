import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { PRODUCTION_MODULE_STATUS, PRODUCTION_MODULE_METHOD, PROCESS_STATUS, PRODUCTION_ORDER_INVENTORY_EVENT_TYPE } from 'utils/constants';
import { dateFormateForUi, roundQty } from 'utils/services';
import { formatAmount, toDecimalString } from '@/utils/currency';
import { formatQtyWithUnit } from '@/utils/itemLineUnit';

export const submitProductionColumns = () => {
  return [
    {
      title: 'Production Order No',
      dataIndex: 'productionOrderCode',
      key: 'productionOrderCode',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      width: 170,
    },
    {
      title: 'Date',
      dataIndex: 'productionDate',
      key: 'productionDate',
      render: productionDate => dateFormateForUi(productionDate) || '-',
      visible: true,
      width: 110,
    },
    {
      title: 'Sales Order',
      dataIndex: 'salesOrderId',
      key: 'salesOrderId',
      render: salesOrderId => (salesOrderId?.orderId ? <Tag className="font-semibold">{salesOrderId.orderId}</Tag> : null),
      visible: true,
      required: true,
      width: 110,
    },
    {
      title: 'Item Number',
      dataIndex: 'itemId',
      key: 'itemNo',
      render: itemId => (itemId?.itemNo ? <Tag className="font-semibold">{itemId.itemNo}</Tag> : '-'),
      visible: true,
      required: true,
      width: 140,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemId',
      key: 'itemName',
      render: itemId => (
        <Tooltip title={itemId?.itemName || ''}>
          <span>{itemId?.itemName || '-'}</span>
        </Tooltip>
      ),
      visible: true,
      required: true,
    },
    {
      title: 'Method',
      dataIndex: 'productionManageMethod',
      key: 'productionManageMethod',
      render: productionManageMethod => (
        <StatusBadge
          status={productionManageMethod}
          value={productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE ? 'Process' : productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED ? 'BOM' : productionManageMethod}
        />
      ),
      visible: true,
      width: 110,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: quantity => `${quantity} pc` || '',
      visible: true,
      width: 100,
    },
    {
      title: 'Planned Qty',
      dataIndex: 'plannedQty',
      key: 'plannedQty',
      render: v => v ?? 0,
      visible: true,
      width: 110,
    },
    {
      title: 'Produced Qty',
      dataIndex: 'producedQty',
      key: 'producedQty',
      render: v => v ?? 0,
      visible: true,
      width: 120,
    },
    {
      title: 'Pending Qty',
      dataIndex: 'pendingQty',
      key: 'pendingQty',
      render: v => v ?? 0,
      visible: true,
      width: 110,
    },
    {
      title: 'FG Submitted',
      dataIndex: 'totalFgSubmittedQty',
      key: 'totalFgSubmittedQty',
      render: v => v ?? 0,
      visible: true,
      width: 120,
    },
    {
      title: 'FG Rejected',
      dataIndex: 'totalFgRejectedQty',
      key: 'totalFgRejectedQty',
      render: v => <span className={v > 0 ? 'text-red-500 font-semibold' : ''}>{v ?? 0}</span>,
      visible: true,
      width: 120,
    },
    {
      title: 'FG Rejection %',
      key: 'fgRejectionRate',
      render: (_, record) => {
        const rate = record.quantity > 0 ? +toDecimalString(((record.totalFgRejectedQty || 0) / record.quantity) * 100) : 0;
        return <span className={rate > 0 ? 'text-red-500 font-semibold' : ''}>{rate}%</span>;
      },
      visible: true,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      visible: true,
      required: true,
      render: status => {
        return <StatusBadge status={status} value={PRODUCTION_MODULE_STATUS[status] || status} />;
      },
    },
    {
      title: 'Production WH',
      dataIndex: 'productionWarehouseId',
      key: 'productionWarehouseId',
      render: productionWarehouseId => productionWarehouseId?.name || '',
      visible: true,
      width: 150,
    },
  ];
};

export const productionProcessColumns = actionButton => [
  { title: 'Seq', dataIndex: 'seq', key: 'seq', width: 64 },
  {
    title: 'Name',
    dataIndex: 'processName',
    key: 'processName',
    width: 180,
  },
  {
    title: 'No',
    dataIndex: 'processNo',
    key: 'processNo',
    width: 120,
    render: processNo => (processNo ? <Tag className="font-semibold m-0">{processNo}</Tag> : '-'),
  },
  {
    title: 'Status',
    dataIndex: 'processStatus',
    key: 'processStatus',
    width: 140,
    render: processStatus => <StatusBadge status={processStatus} value={PROCESS_STATUS[processStatus]} />,
  },
  { title: 'Planned', dataIndex: 'plannedQty', key: 'plannedQty', width: 90 },
  { title: 'Input', dataIndex: 'processIN', key: 'processIN', width: 80 },
  { title: 'Good output', dataIndex: 'processOUT', key: 'processOUT', width: 110 },
  { title: 'Scrap', dataIndex: 'scrapTotal', key: 'scrapTotal', width: 80 },
  { title: 'Rejected', dataIndex: 'processRejection', key: 'processRejection', width: 90 },
  { title: 'Remaining', dataIndex: 'pendingQty', key: 'pendingQty', width: 100 },
  { title: 'Started by', dataIndex: 'startedBy', key: 'startedBy', width: 140 },
  { title: 'Started', dataIndex: 'startDatetime', key: 'startDatetime', width: 140, render: date => dateFormateForUi(date, { withTime: true }) || '-' },
  { title: 'Completed', dataIndex: 'endDatetime', key: 'endDatetime', width: 140, render: date => dateFormateForUi(date, { withTime: true }) || '-' },
  { title: 'Completed by', dataIndex: 'completedBy', key: 'completedBy', width: 140 },
  { title: 'Materials', dataIndex: 'materialsLabel', key: 'materialsLabel', width: 140 },
  {
    title: 'Action',
    key: 'action',
    width: 80,
    ellipsis: false,
    onCell: () => ({ style: { overflow: 'visible' } }),
    render: (_, record) => actionButton(record, true),
  },
];

const renderBatchTags = batches => {
  if (!batches?.length) return '-';
  return <div className="flex flex-wrap gap-1">{batches.map((batch, index) => renderBatchNumber(batch.batchNo, batch.itemBatchId, 'Batch ', batch.itemBatchId || index))}</div>;
};

export const materialConsumptionColumns = (onItemClick, onProcessClick) => [
  {
    title: 'Process No',
    dataIndex: 'processNo',
    key: 'processNo',
    width: 120,
    render: (processNo, record) =>
      processNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onProcessClick(record.processId)}>
          {processNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Process Name',
    dataIndex: 'processName',
    key: 'processName',
    width: 180,
    render: processName => (
      <Tooltip title={processName || ''}>
        <span>{processName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Item Number',
    dataIndex: 'itemNo',
    key: 'itemNo',
    width: 140,
    render: (itemNo, record) =>
      itemNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(record.itemId)}>
          {itemNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    render: itemName => (
      <Tooltip title={itemName || ''}>
        <span>{itemName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Batch',
    dataIndex: 'batches',
    key: 'batchNo',
    width: 140,
    render: (batches, record) => (batches?.length ? renderBatchTags(batches) : renderBatchNumber(record.batchNo)),
  },
  { title: 'Warehouse', dataIndex: 'warehouseName', key: 'warehouseName', width: 170, render: warehouseName => warehouseName || '-' },
  { title: 'Consumed', key: 'consumed', width: 120, render: (_, record) => `${record.consumed} ${record.itemUnit || ''}`.trim() },
  { title: 'In stock', key: 'availableStock', width: 120, render: (_, record) => `${record.availableStock} ${record.itemUnit || ''}`.trim() },
];

export const bomMaterialConsumptionColumns = onItemClick => [
  {
    title: 'Item Number',
    dataIndex: 'rawMaterialId',
    key: 'itemNo',
    width: 140,
    render: rawMaterialId =>
      rawMaterialId?.itemNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(rawMaterialId)}>
          {rawMaterialId.itemNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'rawMaterialId',
    key: 'itemName',
    render: rawMaterialId => (
      <Tooltip title={rawMaterialId?.itemName || ''}>
        <span>{rawMaterialId?.itemName || '-'}</span>
      </Tooltip>
    ),
  },
  { title: 'Per item', dataIndex: 'perItemRequiredUnit', key: 'perItemRequiredUnit', width: 100, render: value => roundQty(value) },
  {
    title: 'Required Qty',
    dataIndex: 'productionOrderRequiredUnit',
    key: 'productionOrderRequiredUnit',
    width: 140,
    render: (value, record) => formatQtyWithUnit(roundQty(value), record),
  },
  {
    title: 'Remaining Qty',
    dataIndex: 'remainingQty',
    key: 'remainingQty',
    width: 150,
    render: (value, record) => formatQtyWithUnit(roundQty(value), record),
  },
  { title: 'Consumed', dataIndex: 'productionOrderSubmittedUnit', key: 'productionOrderSubmittedUnit', width: 110, render: value => roundQty(value) },
  { title: 'BOM RR', dataIndex: 'bomRRQty', key: 'bomRRQty', width: 100, render: value => roundQty(value) },
  { title: 'Rejected', dataIndex: 'rejectQty', key: 'rejectQty', width: 100, render: value => roundQty(value) },
  { title: 'Returned', dataIndex: 'returnQty', key: 'returnQty', width: 100, render: value => roundQty(value) },
  {
    title: 'In stock',
    dataIndex: 'availableStock',
    key: 'availableStock',
    width: 110,
    render: (availableStock, record) => <span className={record.hasMaterialIssue ? 'text-red-600 font-medium' : undefined}>{roundQty(availableStock)}</span>,
  },
  {
    title: 'STATUS',
    key: 'status',
    width: 160,
    render: (_, record) => <StatusBadge status={record.hasMaterialIssue ? 'UNAVAILABLE' : 'AVAILABLE'} value={record.hasMaterialIssue ? 'Unavailable' : 'Available'} />,
  },
  { title: 'Stock Warehouse', dataIndex: 'availableStockWarehouse', key: 'availableStockWarehouse', width: 170, render: availableStockWarehouse => availableStockWarehouse?.name || '-' },
];

export const scrapRejectionColumns = (hideProcess, onBatchClick, onItemClick, onProcessClick) => [
  ...(!hideProcess
    ? [
        {
          title: 'Process No',
          dataIndex: 'processNo',
          key: 'processNo',
          width: 120,
          render: (processNo, record) =>
            processNo ? (
              <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onProcessClick(record.processId)}>
                {processNo}
              </Tag>
            ) : (
              '-'
            ),
        },
        {
          title: 'Process Name',
          dataIndex: 'processName',
          key: 'processName',
          width: 180,
          render: processName => (
            <Tooltip title={processName || ''}>
              <span>{processName || '-'}</span>
            </Tooltip>
          ),
        },
      ]
    : []),
  {
    title: 'Item Number',
    dataIndex: 'itemNo',
    key: 'itemNo',
    width: 140,
    render: (itemNo, record) =>
      itemNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(record.itemId)}>
          {itemNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    render: itemName => (
      <Tooltip title={itemName || ''}>
        <span>{itemName || '-'}</span>
      </Tooltip>
    ),
  },
  { title: 'Quantity', key: 'quantity', width: 120, render: (_, record) => `${record.quantity} ${record.itemUnit || ''}`.trim() },
  {
    title: 'Batch',
    dataIndex: 'batchNo',
    key: 'batchNo',
    width: 140,
    render: (_, record) => (
      <div className="flex flex-wrap gap-1">
        {record.batches?.map(batch => (
          <Tag key={batch.itemBatchId} className="font-semibold m-0 cursor-pointer" onClick={() => onBatchClick(batch.itemBatchId, record.itemId)}>
            {batch.batchNo ? `Batch - ${batch.batchNo}` : '-'}
          </Tag>
        ))}
      </div>
    ),
  },
  { title: 'Warehouse', dataIndex: 'warehouseName', key: 'warehouseName', width: 170, render: warehouseName => warehouseName || '-' },
  { title: 'Value', dataIndex: 'value', key: 'value', width: 120, render: value => formatAmount(value) },
];

const formatInventoryStock = (value, record, { signed = false } = {}) => {
  const unit = record?.item?.itemUnit;
  const amount = `${signed && value > 0 ? '+' : ''}${toDecimalString(value)}`;
  return unit ? `${amount} ${unit}` : amount;
};

export const inventoryImpactColumns = (onBatchClick, onItemClick) => [
  {
    title: 'Date / Time',
    dataIndex: 'eventDatetime',
    key: 'eventDatetime',
    width: 140,
    ellipsis: false,
    render: eventDatetime => dateFormateForUi(eventDatetime, { withTime: true }) || '-',
  },
  { title: 'Event', dataIndex: 'event', key: 'event', width: 220, render: event => PRODUCTION_ORDER_INVENTORY_EVENT_TYPE[event] || event },
  {
    title: 'Item Number',
    dataIndex: 'item',
    key: 'itemNo',
    width: 140,
    render: item =>
      item?.itemNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(item)}>
          {item.itemNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'item',
    key: 'itemName',
    render: item => (
      <Tooltip title={item?.itemName || ''}>
        <span>{item?.itemName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Batch',
    dataIndex: 'itemBatchId',
    key: 'batchNo',
    width: 140,
    render: (itemBatchId, record) => {
      const batchId = itemBatchId?._id || itemBatchId?.id;
      return (
        <Tag className="font-semibold cursor-pointer" onClick={() => onBatchClick(batchId, record.item)}>
          {itemBatchId?.batchNo ? `Batch ${itemBatchId.batchNo}` : ''}
        </Tag>
      );
    },
  },
  { title: 'Warehouse', dataIndex: 'warehouseId', key: 'warehouseName', width: 160, render: warehouseId => warehouseId?.name || '-' },
  {
    title: 'Stock before',
    dataIndex: 'stockBefore',
    key: 'stockBefore',
    width: 140,
    render: (value, record) => formatInventoryStock(value, record),
  },
  {
    title: 'Change',
    dataIndex: 'change',
    key: 'change',
    width: 140,
    ellipsis: false,
    render: (value, record) => (
      <span className={value < 0 ? 'text-red-600 font-medium' : value > 0 ? 'text-emerald-600 font-medium' : undefined}>{formatInventoryStock(value, record, { signed: true })}</span>
    ),
  },
  {
    title: 'Stock after',
    dataIndex: 'stockAfter',
    key: 'stockAfter',
    width: 140,
    render: (value, record) => formatInventoryStock(value, record),
  },
  { title: 'User', dataIndex: 'performedBy', key: 'userName', width: 120, render: performedBy => performedBy?.name || '-' },
  {
    title: 'Reference',
    dataIndex: 'referenceCode',
    key: 'referenceCode',
    width: 130,
    ellipsis: false,
    render: value => <span className="text-emerald-700 font-medium">{value}</span>,
  },
];

export const processItemQtyColumns = () => [
  {
    title: 'Item Name',
    dataIndex: 'item',
    key: 'itemName',
    render: item => (
      <Tooltip title={item?.itemName || ''}>
        <span>{item?.itemName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Quantity',
    dataIndex: 'value',
    key: 'value',
    width: 140,
    render: (value, record) => {
      if (value == null) return '-';
      const unit = record?.itemUnitId?.name || record?.item?.itemUnit || '';
      return unit ? `${value} ${unit}` : value;
    },
  },
];

export const processManpowerColumns = () => [
  { title: 'Worker', dataIndex: 'workerId', key: 'workerId', render: workerId => workerId?.workerName || '-' },
  { title: 'Hours', dataIndex: 'workerHours', key: 'workerHours', width: 90, render: value => value ?? '-' },
  { title: 'Rate/hr', dataIndex: 'salaryPerHour', key: 'salaryPerHour', width: 110, render: value => formatAmount(value) },
  { title: 'Cost', dataIndex: 'workerCost', key: 'workerCost', width: 110, render: value => formatAmount(value) },
];

export const processAdditionalCostColumns = () => [
  { title: 'Notes', dataIndex: 'notes', key: 'notes', render: notes => notes || '-' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 140, render: amount => formatAmount(amount) },
];

export const bomSubmissionMaterialColumns = () => [
  {
    title: 'Item Number',
    dataIndex: 'rawMaterialId',
    key: 'itemNo',
    width: 140,
    render: rawMaterialId => (rawMaterialId?.itemNo ? <Tag className="font-semibold">{rawMaterialId.itemNo}</Tag> : '-'),
  },
  {
    title: 'Item Name',
    dataIndex: 'rawMaterialId',
    key: 'itemName',
    render: rawMaterialId => (
      <Tooltip title={rawMaterialId?.itemName || ''}>
        <span>{rawMaterialId?.itemName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Item Unit',
    key: 'itemUnit',
    width: 120,
    render: (_, record) => record?.itemUnitId?.name || record?.rawMaterialId?.itemUnit || '',
  },
  { title: 'Submitted Qty', dataIndex: 'productionOrderSubmittedUnit', key: 'productionOrderSubmittedUnit' },
  { title: 'BOM RR Qty', dataIndex: 'bomRRQty', key: 'bomRRQty' },
  { title: 'Reject Qty', dataIndex: 'rejectQty', key: 'rejectQty' },
  { title: 'Return Qty', dataIndex: 'returnQty', key: 'returnQty' },
];

export const bomSubmissionManpowerColumns = () => [
  { title: 'Worker Name', dataIndex: 'manpowerId', key: 'manpowerId', render: manpowerId => manpowerId?.workerName || '-' },
  { title: 'Worker Hours', dataIndex: 'workerHours', key: 'workerHours' },
  { title: 'Worker Cost', dataIndex: 'workerCost', key: 'workerCost', render: workerCost => formatAmount(workerCost) },
];

export const bomSubmissionListColumns = (fgUnit, actionButton) => [
  { title: '#', key: 'seq', width: 64, render: (_, __, index) => index + 1 },
  {
    title: 'Date',
    dataIndex: 'submissionDate',
    key: 'submissionDate',
    width: 160,
    render: date => dateFormateForUi(date, { withTime: true }) || '-',
  },
  {
    title: 'Submitted by',
    key: 'submittedBy',
    width: 160,
    render: (_, record) => record.submittedBy?.name || '-',
  },
  {
    title: 'FG Submitted',
    dataIndex: 'fgSubmittedQty',
    key: 'fgSubmittedQty',
    width: 130,
    render: qty => `${qty} ${fgUnit}`,
  },
  {
    title: 'FG Rejected',
    dataIndex: 'fgRejectedQty',
    key: 'fgRejectedQty',
    width: 130,
    render: qty => `${qty} ${fgUnit}`,
  },
  {
    title: 'Scrap',
    key: 'scrap',
    width: 100,
    render: (_, record) => `${record.scrapOut.reduce((sum, row) => sum + row.value, 0)} ${fgUnit}`,
  },
  {
    title: 'FG Batch',
    dataIndex: 'batches',
    key: 'batches',
    width: 160,
    render: renderBatchTags,
  },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    ellipsis: false,
    onCell: () => ({ style: { overflow: 'visible' } }),
    render: (_, record) => actionButton(record),
  },
];

export const fgBatchColumns = (fgUnit, onBatchClick = null) => [
  {
    title: 'Batch No',
    dataIndex: 'batchNo',
    key: 'batchNo',
    width: 140,
    render: (batchNo, record) =>
      record?.itemBatchId && onBatchClick ? (
        <Tag className="font-semibold cursor-pointer" onClick={() => onBatchClick(record.itemBatchId)}>
          Batch {batchNo ?? '-'}
        </Tag>
      ) : (
        renderBatchNumber(batchNo, record?.itemBatchId, 'Batch ')
      ),
  },
  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 120, render: quantity => `${quantity} ${fgUnit}` },
  { title: 'Unit Cost', dataIndex: 'purchasePrice', key: 'purchasePrice', width: 140, render: purchasePrice => formatAmount(purchasePrice) },
];

export const transferMaterialColumns = (onItemClick, onBatchClick) => [
  {
    title: 'Item Number',
    dataIndex: 'itemNo',
    key: 'itemNo',
    width: 140,
    render: (_, record) =>
      record?.itemNo || record?.rawMaterialId?.itemNo ? (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick({ _id: record.rawMaterialId, itemNo: record.itemNo, itemName: record.rawMaterialName })}>
          {record.itemNo || record.rawMaterialId.itemNo}
        </Tag>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'rawMaterialName',
    key: 'itemName',
    render: (_, record) => (
      <Tooltip title={record?.rawMaterialName || record?.rawMaterialId?.itemName || ''}>
        <span>{record?.rawMaterialName || record?.rawMaterialId?.itemName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Batch',
    dataIndex: 'batches',
    key: 'batchNo',
    width: 160,
    render: (batches, record) => {
      if (!batches?.length) return '-';
      const item = { _id: record.rawMaterialId?._id || record.rawMaterialId, itemNo: record.itemNo, itemName: record.rawMaterialName };
      return (
        <div className="flex flex-wrap gap-1">
          {batches.map(batch =>
            batch?._id && onBatchClick ? (
              <Tag key={batch._id} className="font-semibold m-0 cursor-pointer" onClick={() => onBatchClick(batch._id, item)}>
                {batch.batchNo != null ? `Batch ${batch.batchNo}` : '-'}
              </Tag>
            ) : (
              renderBatchNumber(batch.batchNo, batch._id, 'Batch ', batch._id || batch.batchNo)
            )
          )}
        </div>
      );
    },
  },
  {
    title: 'Ref Batch',
    dataIndex: 'batches',
    key: 'refBatchNo',
    width: 160,
    render: (batches, record) => {
      const refBatches = (batches || []).flatMap(batch => batch.referenceBatches || []);
      if (!refBatches.length) return '-';
      const item = { _id: record.rawMaterialId?._id || record.rawMaterialId, itemNo: record.itemNo, itemName: record.rawMaterialName };
      return (
        <div className="flex flex-wrap gap-1">
          {refBatches.map(refBatch =>
            refBatch?.batchId && onBatchClick ? (
              <Tag key={refBatch.batchId} className="font-semibold m-0 cursor-pointer" onClick={() => onBatchClick(refBatch.batchId, item)}>
                {refBatch.batchNo != null ? `Batch ${refBatch.batchNo}` : '-'}
              </Tag>
            ) : (
              renderBatchNumber(refBatch.batchNo, refBatch.batchId, 'Batch ', refBatch.batchId || refBatch.batchNo)
            )
          )}
        </div>
      );
    },
  },
  { title: 'Per Item Qty', dataIndex: 'perItemRequiredUnit', key: 'perItemRequiredUnit', render: (value, record) => formatQtyWithUnit(roundQty(value), record) },
  { title: 'Transferred Qty', dataIndex: 'productionOrderRequiredUnit', key: 'productionOrderRequiredUnit', render: (value, record) => formatQtyWithUnit(roundQty(value), record) },
];
