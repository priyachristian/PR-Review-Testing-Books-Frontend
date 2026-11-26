import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import { Button, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import PageHeader from '@/components/ui/common/PageHeader';
import ViewInventoryDetailSkeleton from '@/features/inventory/viewInventory/components/ViewInventoryDetailSkeleton';
import InventoryPipeline from '@/features/inventory/viewInventory/components/InventoryPipeline';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DetailField, DETAIL_VALUE_CLASS, DocumentMetadata, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '@/components/ui';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useViewInventory } from '@/features/inventory/viewInventory';

// Extras
import { batchColumns, batchConvertedStockColumns, convertedStockColumns, warehouseColumns } from '@/features/inventory/viewInventory';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { SOURCE_TYPES, SOURCE_ROUTES, MODULE_NAMES } from '@/utils/constants';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import NoFoundPage from '@/components/ui/common/NoFoundPage';

const unitDisplayName = unit => unit?.name || (typeof unit === 'string' ? unit : '');

const renderSourceType = (sourceType, sourceNo) => {
  if (!sourceType) return '-';
  const label = sourceNo ? `${sourceType} (${sourceNo})` : sourceType;
  return <Tag className="font-semibold m-0">{label}</Tag>;
};

const getBatchRowKey = record => (record?._id != null ? String(record._id) : record?.id != null ? String(record.id) : `${record?.warehouseId?._id || record?.warehouseId}-${record?.batchNo}`);

const ViewInventoryDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const [batchPage, setBatchPage] = useState(DEFAULT_PAGE);
  const [batchLimit, setBatchLimit] = useState(DEFAULT_PAGE_SIZE);
  const [expandedWarehouseKeys, setExpandedWarehouseKeys] = useState([]);
  const [expandedBatchKeys, setExpandedBatchKeys] = useState([]);
  const {
    itemInventoryDetails,
    itemInventoryDetailsLoading: loading,
    getItemInventoryDetails,
    resetItemInventoryDetails,
    itemInventoryBatches,
    itemInventoryBatchesPagination,
    itemInventoryBatchesLoading,
    getItemInventoryBatches,
    resetItemInventoryBatches,
    inventoryPendingPurchaseOrderQty,
    inventoryPendingPurchaseOrderQtyLoading,
    getInventoryPendingPurchaseOrderQty,
    resetInventoryPendingPurchaseOrderQty,
  } = useViewInventory();

  useEffect(() => {
    const abortController = new AbortController();
    if (itemId) {
      getItemInventoryDetails({ itemId, signal: abortController.signal });
    }
    return () => abortController.abort();
  }, [itemId, getItemInventoryDetails]);

  useEffect(() => {
    const abortController = new AbortController();
    if (itemId) {
      getItemInventoryBatches({ itemId, page: batchPage, limit: batchLimit, signal: abortController.signal });
    }
    return () => abortController.abort();
  }, [itemId, batchPage, batchLimit, getItemInventoryBatches]);

  useEffect(() => {
    const abortController = new AbortController();
    if (itemId) {
      getInventoryPendingPurchaseOrderQty({ itemId, signal: abortController.signal });
    }
    return () => abortController.abort();
  }, [itemId, getInventoryPendingPurchaseOrderQty]);

  useEffect(() => {
    setActiveKey('1');
    setBatchPage(DEFAULT_PAGE);
    setBatchLimit(DEFAULT_PAGE_SIZE);
    setExpandedWarehouseKeys([]);
    setExpandedBatchKeys([]);
  }, [itemId]);

  useResetOnUnmount(resetItemInventoryDetails);
  useResetOnUnmount(resetItemInventoryBatches);
  useResetOnUnmount(resetInventoryPendingPurchaseOrderQty);

  const handleRefresh = async () => {
    await Promise.all([getItemInventoryDetails({ itemId }), getItemInventoryBatches({ itemId, page: batchPage, limit: batchLimit }), getInventoryPendingPurchaseOrderQty({ itemId })]);
  };

  const handleBatchPageChange = useCallback((page, pageSize) => {
    setBatchPage(page);
    if (pageSize) setBatchLimit(pageSize);
    setExpandedBatchKeys([]);
  }, []);

  const handleBack = () => {
    navigate('/view-inventory');
  };

  const handleLedgerClick = () => {
    navigate(`/reports/item-ledger?page=1&limit=${DEFAULT_PAGE_SIZE}&item=${itemId}`);
  };

  const handleViewBatchesClick = useCallback(() => {
    if (!itemId) return;
    navigate(`/item-batches?itemId=${itemId}&page=${DEFAULT_PAGE}&limit=${DEFAULT_PAGE_SIZE}`);
  }, [itemId, navigate]);

  const handleBatchClick = useCallback(
    record => {
      const batchId = record?._id ?? record?.id;
      if (!batchId) return;
      navigate(`/${ADMIN_ROUTE_PATHS.itemBatches.build.detail(batchId)}`);
    },
    [navigate]
  );

  const item = itemInventoryDetails?.item;
  const itemInventory = itemInventoryDetails?.itemInventory;

  // Use the same stored total the "Total Available Stock" field above renders, so the
  // pipeline can never contradict it. Falls back to the warehouse sum if it is absent.
  const availableStock = useMemo(() => {
    const storedTotal = Number(itemInventory?.totalAvailableStock);
    if (Number.isFinite(storedTotal)) return storedTotal;
    return (itemInventory?.warehouses || []).reduce((sum, warehouse) => sum + (Number(warehouse?.availableStock) || 0), 0);
  }, [itemInventory]);

  const handleDocumentClick = (sourceType, sourceId, allowedTypes, routes) => {
    if (!sourceType || !sourceId || !allowedTypes.includes(sourceType)) return;
    const getPath = routes[sourceType];
    if (!getPath) return;
    navigate(getPath(sourceId));
  };

  const renderDocumentNo = (sourceType, docNo, sourceId, allowedTypes, routes) => {
    if (!docNo) return '-';

    const canRedirect = !!sourceId && allowedTypes.includes(sourceType) && !!routes[sourceType];

    return (
      <Tag className={`font-semibold m-0 ${canRedirect ? 'cursor-pointer' : ''}`} onClick={canRedirect ? () => handleDocumentClick(sourceType, sourceId, allowedTypes, routes) : undefined}>
        {docNo}
      </Tag>
    );
  };

  const warehouseTableColumns = useMemo(() => {
    const itemUnitName = item?.itemUnitId?.name || '';
    const itemUnitColumn = {
      title: 'Item Unit',
      key: 'itemUnit',
      render: () => itemUnitName,
    };
    const openingStockIndex = warehouseColumns.findIndex(column => column.key === 'openingStock');
    if (openingStockIndex < 0) return [...warehouseColumns, itemUnitColumn];
    return [...warehouseColumns.slice(0, openingStockIndex + 1), itemUnitColumn, ...warehouseColumns.slice(openingStockIndex + 1)];
  }, [item]);

  const batchTableColumns = [
    ...batchColumns.map(column => {
      if (column.key !== 'batchNo') return column;
      return {
        ...column,
        render: (batchNo, record) =>
          batchNo != null ? (
            <Tag
              className="font-semibold m-0 cursor-pointer"
              onClick={e => {
                e.stopPropagation();
                handleBatchClick(record);
              }}
            >
              {batchNo}
            </Tag>
          ) : (
            '-'
          ),
      };
    }),
    {
      title: 'Document ID',
      dataIndex: 'docNo',
      key: 'docNo',
      render: (docNo, record) => renderDocumentNo(record?.sourceType, docNo, record?.sourceId, SOURCE_TYPES, SOURCE_ROUTES),
      width: 130,
    },
    {
      title: 'Source Type',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 280,
      render: (sourceType, record) => renderSourceType(sourceType, record?.sourceNo),
    },
  ];

  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: 'Overview',
        children: (
          <div className="space-y-5 pb-5">
            <div className="my-container container-spacing">
              <p className="font-bold text-lg">Item Summary</p>
              <div className="mt-2 space-y-3">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                  <DetailField label="Item No">
                    {item?.itemNo ? (
                      <Tag className={`font-semibold m-0 ${itemId ? 'cursor-pointer' : ''}`} onClick={itemId ? () => navigate(`/${ADMIN_ROUTE_PATHS.itemMaster.build.detail(itemId)}`) : undefined}>
                        {item.itemNo}
                      </Tag>
                    ) : (
                      '-'
                    )}
                  </DetailField>
                  <DetailField label="Item Name" value={item?.itemName} truncate={false} valueClassName="break-words" />
                  <DetailField label="Item Type" value={item?.itemType} />
                  <DetailField label="Model No" value={item?.itemModelNo} />
                  <DetailField label="Item Group" value={item?.itemGroup?.name} truncate={false} valueClassName="break-words" />
                  <DetailField label="Item Unit" value={unitDisplayName(item?.itemUnitId) || item?.itemUnit} />
                </div>
              </div>

              <div className="mt-6">
                <p className="font-bold text-lg">Inventory Summary</p>
                <div className="mt-2 space-y-3">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                    <DetailField label="Total Opening Stock" value={itemInventory?.totalOpeningStock} />
                    <DetailField label="Total Available Stock" value={itemInventory?.totalAvailableStock} />
                    <DetailField label="Inventory Sales Method" value={itemInventory?.inventorySalesMethod} />
                    <DetailField label="Total Inventory Value" value={itemInventory?.totalInventoryValue != null ? formatAmount(itemInventory.totalInventoryValue) : undefined} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="font-bold text-lg">Item Unit Conversion</p>
                {item?.unitConversions?.length > 0 ? (
                  <div className="overflow-x-auto mt-3 border border-gray-200 rounded">
                    <table className="w-full min-w-[720px]">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className={TABLE_HEAD_CLASS}>Unit</th>
                          <th className={TABLE_HEAD_CLASS}>Qty</th>
                          <th className={TABLE_HEAD_CLASS} />
                          <th className={TABLE_HEAD_CLASS}>Unit</th>
                          <th className={TABLE_HEAD_CLASS}>Qty</th>
                          <th className={TABLE_HEAD_CLASS}>Sales Price</th>
                          <th className={TABLE_HEAD_CLASS}>Purchase Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.unitConversions.map((row, index) => (
                          <tr key={row?.itemUnitId?._id || index} className="border-t border-gray-200">
                            <td className={TABLE_CELL_CLASS}>{unitDisplayName(row?.itemUnitId) || '-'}</td>
                            <td className={TABLE_CELL_CLASS}>{row?.qty ?? 1}</td>
                            <td className={TABLE_CELL_CLASS}>=</td>
                            <td className={TABLE_CELL_CLASS}>{unitDisplayName(item?.itemUnitId) || item?.itemUnit || '-'}</td>
                            <td className={TABLE_CELL_CLASS}>{row?.baseQty ?? '-'}</td>
                            <td className={TABLE_CELL_CLASS}>{row?.salesPrice != null && row?.salesPrice !== '' ? formatAmount(row.salesPrice) : '-'}</td>
                            <td className={TABLE_CELL_CLASS}>{row?.purchasePrice != null && row?.purchasePrice !== '' ? formatAmount(row.purchasePrice) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={`${DETAIL_VALUE_CLASS} mt-2`}>-</p>
                )}
              </div>

              <div className="mt-6">
                <InventoryPipeline data={inventoryPendingPurchaseOrderQty} loading={inventoryPendingPurchaseOrderQtyLoading} availableStock={availableStock} />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: '2',
        label: 'Warehouses',
        children: (
          <div className="my-container container-spacing">
            <p className="font-bold text-lg pb-2">Warehouses</p>
            <CustomTable
              columns={warehouseTableColumns}
              data={itemInventory?.warehouses || []}
              loading={loading}
              pagination={false}
              tableId="_id"
              scroll={{ x: 'max-content' }}
              dynamicScrollY={false}
              expandable={{
                expandedRowKeys: expandedWarehouseKeys,
                onExpand: (expanded, record) => {
                  setExpandedWarehouseKeys(keys => (expanded ? [...keys, record._id] : keys.filter(key => key !== record._id)));
                },
                rowExpandable: record => Array.isArray(record?.convertedStockDetails) && record.convertedStockDetails.length > 0,
                expandedRowRender: record => (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="mb-2 text-[13px] font-medium text-gray-600">Converted Stock</div>
                    <CustomTable
                      columns={convertedStockColumns}
                      data={record.convertedStockDetails}
                      pagination={false}
                      tableId="itemUnitId"
                      scroll={{ x: 'max-content' }}
                      dynamicScrollY={false}
                      showHeader
                    />
                  </div>
                ),
              }}
            />
          </div>
        ),
      },
      {
        key: '3',
        label: 'Batches',
        children: (
          <div className="my-container container-spacing">
            <div className="flex items-center justify-between gap-3 pb-2">
              <p className="font-bold text-lg m-0">Batches</p>
              <Button type="primary" icon={<Icons.InboxOutlined />} onClick={handleViewBatchesClick}>
                View Batch
              </Button>
            </div>
            <CustomTable
              columns={batchTableColumns}
              data={itemInventoryBatches}
              loading={itemInventoryBatchesLoading}
              tableId={getBatchRowKey}
              pagination={{
                current: batchPage,
                pageSize: batchLimit,
                total: itemInventoryBatchesPagination?.totalResults,
                onChange: handleBatchPageChange,
              }}
              scroll={{ x: 'max-content' }}
              dynamicScrollY={false}
              isPaginationFixed={false}
              showQuickJumper={false}
              onRowClick={handleBatchClick}
              expandable={{
                expandedRowKeys: expandedBatchKeys,
                onExpand: (expanded, record) => {
                  const rowKey = getBatchRowKey(record);
                  setExpandedBatchKeys(keys => (expanded ? [...keys, rowKey] : keys.filter(key => key !== rowKey)));
                },
                rowExpandable: record => Array.isArray(record?.convertedStockDetails) && record.convertedStockDetails.length > 0,
                expandedRowRender: record => (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="mb-2 text-[13px] font-medium text-gray-600">Converted Stock</div>
                    <CustomTable
                      columns={batchConvertedStockColumns}
                      data={record.convertedStockDetails}
                      pagination={false}
                      tableId="itemUnitId"
                      scroll={{ x: 'max-content' }}
                      dynamicScrollY={false}
                      showHeader
                    />
                  </div>
                ),
              }}
            />
          </div>
        ),
      },
    ],
    [
      item,
      itemInventory,
      loading,
      itemInventoryBatches,
      itemInventoryBatchesLoading,
      itemInventoryBatchesPagination,
      batchPage,
      batchLimit,
      handleBatchPageChange,
      expandedWarehouseKeys,
      warehouseTableColumns,
      expandedBatchKeys,
      availableStock,
      inventoryPendingPurchaseOrderQty,
      inventoryPendingPurchaseOrderQtyLoading,
      handleBatchClick,
      handleViewBatchesClick,
    ]
  );

  if (loading && !itemInventoryDetails) {
    return <ViewInventoryDetailSkeleton />;
  }

  if (!itemInventoryDetails && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.VIEW_INVENTORY} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <PageHeader
            title={
              <div className="flex items-center gap-3 min-w-0">
                <BackButton onClick={handleBack} />
                <div className="flex flex-col min-w-0">
                  <Tooltip title={item?.itemName || ''}>
                    <h1 className="text-[18px] font-semibold text-heading leading-6 truncate max-w-[400px]">{item?.itemName || ''}</h1>
                  </Tooltip>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{item?.itemNo}</span>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={item?.itemStatus} value={item?.itemStatus ? 'Active' : 'Inactive'} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Stock',
                value: itemInventory?.totalAvailableStock ?? 0,
              },
              {
                label: 'Inventory Value',
                value: itemInventory?.totalInventoryValue != null ? formatAmount(itemInventory.totalInventoryValue) : '-',
              },
            ]}
          />
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            <Button type="primary" icon={<Icons.FileSearchOutlined />} onClick={handleLedgerClick}>
              View Ledger
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className={activeKey === '1' ? 'w-full xl:w-3/4' : 'w-full'}>
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
        </div>
        {activeKey === '1' ? (
          <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
            <DocumentMetadata
              data={{
                addedBy: itemInventory?.addedBy,
                createdAt: itemInventory?.createdAt,
                updatedBy: itemInventory?.updatedBy || null,
                updatedAt: itemInventory?.updatedAt,
              }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};

export default ViewInventoryDetail;
