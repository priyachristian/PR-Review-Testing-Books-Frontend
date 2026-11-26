import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Components
import { Button, Drawer, Tabs, Tooltip } from '@/components/AntDComponent';
import ItemDrawerDetailsSkeleton from './ItemDrawerDetailsSkeleton';
import ItemTransactionsTab, { resolveDefaultTransactionType } from './ItemTransactionsTab';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import DetailField, { DETAIL_VALUE_CLASS, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/common/DetailField';

// Extras
import { useItemMaster } from '@/features/allMaster/item';
import { formatGstForDisplay } from '@/utils/gstDisplay';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { appendNavigationState, buildNavigationState } from '@/utils/navigationHistory';

// ─── Sub-components (module scope — stable identity across renders) ──────────

const Overview = ({ itemBriefDetail, itemData }) => {
  const itemStatus = itemBriefDetail?.itemStatus === true ? 'Active' : itemBriefDetail?.itemStatus === false ? 'Inactive' : undefined;

  return (
    <div className="space-y-3">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">General Information</p>
        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Item Name" value={itemBriefDetail?.itemName || itemData?.itemName} />
            <DetailField label="Item Code" value={itemBriefDetail?.itemNo || itemData?.itemNo} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Item Type" value={itemBriefDetail?.itemType} />
            <DetailField label="Item Model No" value={itemBriefDetail?.itemModelNo} />
            <DetailField label="Item Group" value={itemBriefDetail?.itemGroup?.name} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Item Unit" value={itemBriefDetail?.itemUnitId?.name || itemBriefDetail?.itemUnit || itemData?.itemUnitId?.name || itemData?.itemUnit} />
            <DetailField label="Description" value={itemBriefDetail?.description} />
            <DetailField label="Item Status" value={itemStatus} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Track Inventory" value={itemBriefDetail?.trackInventory ? 'Yes' : 'No'} />
            <DetailField label="Item Category">
              <>
                Goods: {itemBriefDetail?.itemCategory?.isGoods ? 'Yes' : 'No'}
                <br />
                Service: {itemBriefDetail?.itemCategory?.isService ? 'Yes' : 'No'}
              </>
            </DetailField>
            <DetailField label="HSN Code" value={itemBriefDetail?.hsnCode} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="GST" value={itemBriefDetail?.gst != null ? formatGstForDisplay(itemBriefDetail.gst) : undefined} />
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-x-3 mb-3">
              <p className="font-bold text-lg">Sales Information</p>
              {itemBriefDetail?.salesInformation?.isSellable ? (
                <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Sellable</span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Not Sellable</span>
              )}
            </div>
            <DetailField
              label="Selling Price"
              value={itemBriefDetail?.salesInformation?.sellingPrice && itemBriefDetail?.salesInformation?.isSellable ? formatAmount(itemBriefDetail?.salesInformation?.sellingPrice) : undefined}
            />
          </div>

          <div>
            <div className="flex items-center gap-x-3 mb-3">
              <p className="font-bold text-lg">Purchase Information</p>
              {itemBriefDetail?.purchaseInformation?.isPurchasable ? (
                <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Purchasable</span>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Not Purchasable</span>
              )}
            </div>
            <DetailField
              label="Cost Price"
              value={itemBriefDetail?.purchaseInformation?.costPrice && itemBriefDetail?.purchaseInformation?.isPurchasable ? formatAmount(itemBriefDetail?.purchaseInformation?.costPrice) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StockData = ({ itemBriefDetail }) => {
  const inventoryData = itemBriefDetail?.inventoryData;

  if (itemBriefDetail?.itemCategory?.isService || !itemBriefDetail?.trackInventory) {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Stock Data</p>
        <p className={`${DETAIL_VALUE_CLASS} text-[#64748b] mt-2`}>
          {itemBriefDetail?.itemCategory?.isService ? 'Stock data is not applicable for service items.' : 'Stock data is not available because Track Inventory is disabled for this item.'}
        </p>
      </div>
    );
  }

  return (
    <div className="my-container container-spacing space-y-3">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
        <DetailField label="Total Opening Stock" value={inventoryData?.totalOpeningStock ?? 0} />
        <DetailField label="Total Available Stock" value={inventoryData?.totalAvailableStock ?? 0} />
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Warehouse</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed text-sm bg-white border border-gray-200">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className={`${TABLE_HEAD_CLASS} w-[26%]`}>W/H No</th>
                <th className={`${TABLE_HEAD_CLASS} w-[22%]`}>W/H Name</th>
                <th className={`${TABLE_HEAD_CLASS} w-[14%] text-right px-1.5`}>Opening Stock</th>
                <th className={`${TABLE_HEAD_CLASS} w-[12%] text-right px-1.5`}>Rate</th>
                <th className={`${TABLE_HEAD_CLASS} w-[16%] text-right`}>Available Stock</th>
                <th className={`${TABLE_HEAD_CLASS} w-[10%] text-center`}>Active</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData?.warehouses?.length > 0 ? (
                inventoryData.warehouses.map((warehouse, index) => (
                  <tr key={warehouse.warehouseId || index} className="border-b border-gray-200">
                    <td className={`${TABLE_CELL_CLASS} overflow-hidden`}>
                      <span className="block truncate">{warehouse?.warehouseNo || '-'}</span>
                    </td>
                    <td className={`${TABLE_CELL_CLASS} overflow-hidden`}>
                      <Tooltip title={warehouse.warehouseName || '-'} placement="topLeft">
                        <span className="block truncate">{warehouse.warehouseName || '-'}</span>
                      </Tooltip>
                    </td>
                    <td className={`${TABLE_CELL_CLASS} text-right tabular-nums px-1.5`}>{warehouse.openingStock ?? 0}</td>
                    <td className={`${TABLE_CELL_CLASS} text-right tabular-nums px-1.5`}>{formatAmount(warehouse.openingStockRate ?? 0)}</td>
                    <td className={`${TABLE_CELL_CLASS} text-right tabular-nums`}>{warehouse.availableStock ?? 0}</td>
                    <td className={`${TABLE_CELL_CLASS} text-center`}>{warehouse.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 px-2 text-center text-[#64748b] text-[13px]" colSpan={6}>
                    No warehouse stock data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ItemDrawerDetails = ({
  viewItemDetail,
  setViewItemDetail,
  itemData,
  onBack,
  customerId,
  customerName,
  vendorId,
  vendorName,
  pageType,
  page,
  moduleType,
  defaultTransactionType,
  initialTab = '1',
}) => {
  const location = useLocation();
  const { getViewItem, itemBriefDetail, resetItemBriefDetail, viewItemLoading } = useItemMaster();
  const [activeTab, setActiveTab] = useState(initialTab || '1');

  const stableGetViewItem = useCallback(getViewItem, [getViewItem]);
  const stableResetItemBriefDetail = useCallback(resetItemBriefDetail, [resetItemBriefDetail]);
  const transactionType = resolveDefaultTransactionType({
    pageType,
    page,
    moduleType,
    defaultType: defaultTransactionType,
  });

  useEffect(() => {
    setActiveTab(initialTab || '1');
  }, [itemData?.id, initialTab]);

  useEffect(() => {
    const controller = new AbortController();

    if (itemData?.id) {
      stableGetViewItem({
        itemId: itemData?.id,
        signal: controller.signal,
      });
    }
    return () => {
      stableResetItemBriefDetail();
      controller.abort();
    };
  }, [itemData?.id, stableGetViewItem, stableResetItemBriefDetail]);

  const tabItems = [
    {
      key: '1',
      label: 'Overview',
      children: <Overview itemBriefDetail={itemBriefDetail} itemData={itemData} />,
    },
    {
      key: '2',
      label: 'Stock Data',
      children: <StockData itemBriefDetail={itemBriefDetail} />,
    },
    {
      key: '3',
      label: 'Transactions',
      children:
        activeTab === '3' ? (
          <ItemTransactionsTab
            itemId={itemData?.id}
            customerId={customerId}
            customerName={customerName}
            vendorId={vendorId}
            vendorName={vendorName}
            pageType={pageType}
            page={page}
            moduleType={moduleType}
            defaultType={transactionType}
          />
        ) : null,
    },
  ];

  return (
    <div className="font-sans">
      <Drawer
        closable={false}
        title={
          <div className="flex items-center justify-between gap-4 w-full py-2">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                <Icons.ShoppingOutlined style={{ color: colorPalette.primary[500] }} />
                <Tooltip title={itemData?.itemName || itemData?.itemNo}>
                  <span className="ml-2 text-base font-bold text-gray-900 truncate max-w-[250px] cursor-pointer">{itemData?.itemName || itemData?.itemNo || 'Item Details'}</span>
                </Tooltip>
              </div>
              <Button
                type="default"
                size="middle"
                icon={<Icons.ExportOutlined style={{ color: colorPalette.primary[500] }} />}
                onClick={() => {
                  if (itemData?.id) {
                    const detailPath = appendNavigationState(`/item-master/${itemData.id}`, buildNavigationState(location));
                    window.open(detailPath, '_blank', 'noopener,noreferrer');
                  }
                  setViewItemDetail(false);
                  if (onBack) {
                    onBack();
                  }
                }}
                className="flex items-center justify-center shrink-0"
              >
                View More Details
              </Button>
            </div>
            <CloseIconButton onClick={() => setViewItemDetail(false)} />
          </div>
        }
        onClose={() => setViewItemDetail(false)}
        open={viewItemDetail}
        maskClosable={true}
        width={800}
        styles={{
          body: { padding: '0px', background: '#f8fafc' },
          header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
        }}
      >
        {viewItemLoading ? (
          <ItemDrawerDetailsSkeleton />
        ) : (
          <div className="px-4 py-3">
            <Tabs key={itemData?.id} activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ItemDrawerDetails;
