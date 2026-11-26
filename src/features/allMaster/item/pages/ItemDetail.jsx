import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Checkbox from 'antd/es/checkbox/Checkbox';
import { InboxOutlined } from '@ant-design/icons';

// Components
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { Button, Dropdown, Tabs, Popconfirm } from '@/components/AntDComponent';
import { ActionButtons, DetailField, DETAIL_VALUE_CLASS, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '@/components/ui';
import { ItemDetailPageSkeleton, ItemDetailUsedInTabSkeleton } from '@/features/allMaster/item/components/ItemDetailSkeleton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import HistoryCommon from '@/components/dataDisplay/statCard/HistoryCommon';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from 'assets/icons/icon';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { formatGstForDisplay } from '@/utils/gstDisplay';
import { formatAmount } from '@/utils/currency';
import { RESOURCES } from '@/utils/jsonFile';
import { useItemMaster, ITEMS_USED_IN_COLUMNS } from '@/features/allMaster/item';
import ItemTransactionsTab from '@/features/allMaster/item/components/ItemTransactionsTab';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES, PRODUCTION_MODULE_METHOD, PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';
import { ITEM_TABS } from '@/utils/tabs';
import { readNavigationState, stripNavigationStateParam } from '@/utils/navigationHistory';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const formatBooleanDetail = value => (value === true ? 'Yes' : value === false ? 'No' : '-');

const unitDisplayName = unit => unit?.name || (typeof unit === 'string' ? unit : '');

const DETAIL_TABS = {
  OVERVIEW: 'overview',
  ...ITEM_TABS,
  TRANSACTIONS: 'transactions',
  USED_IN: 'used-in',
  HISTORY: 'history',
};

const ItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(DETAIL_TABS.OVERVIEW);
  const didRestoreNavigationState = useRef(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { loading, item, getItemById, resetItem, getItemsUsedIn, itemsUsedIn, itemsUsedInLoading, toggleItemStatus, deleteItem, submitLoading, deleteLoading } = useItemMaster();
  const { warehouseDrop, getWarehouseDrop, isViewOnly, useModuleItem } = useModulePermissions(RESOURCES.ITEM_MASTER);
  const { useModuleProduction } = useModulePermissions(RESOURCES.PRODUCTION);
  const { useModuleItemLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER);
  const inventoryData = item?.inventoryData;

  const columns = [
    { title: 'Division Name', dataIndex: 'divisionName', key: 'divisionName' },
    { title: 'Division Code', dataIndex: 'dCode', key: 'dCode' },
    { title: 'Branch Name', dataIndex: 'branchName', key: 'branchName' },
    { title: 'B. Code', dataIndex: 'bcode', key: 'bcode' },
    { title: 'W/H Name', dataIndex: 'whName', key: 'whName' },
    { title: 'W/H Code', dataIndex: 'whCode', key: 'whCode' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: isActive => <Checkbox checked={isActive} />,
    },
    { title: 'Opening Stock', dataIndex: 'openingStock', key: 'openingStock' },
    {
      title: 'Rate',
      dataIndex: 'openingStockRate',
      key: 'openingStockRate',
      render: val => (val === '' || val == null ? '' : formatAmount(val)),
    },
  ];

  const data1 =
    warehouseDrop && warehouseDrop.length > 0
      ? warehouseDrop.map(warehouse => {
          const existingBranch = inventoryData?.warehouses?.find(b => b.warehouseId === warehouse?.id);

          return existingBranch
            ? {
                ...existingBranch,
                divisionName: warehouse?.divisionId?.name,
                dCode: warehouse?.divisionId?.divisionCode,
                branchName: warehouse?.branchId?.name,
                bcode: warehouse?.branchId?.branchCode,
                whName: warehouse?.name,
                openingStock: existingBranch?.openingStock || 0,
                openingStockRate: existingBranch?.openingStockRate,
                availableStock: existingBranch?.availableStock,
                whCode: warehouse?.warehouseId,
              }
            : {
                divisionName: warehouse?.divisionId?.name,
                dCode: warehouse?.divisionId?.divisionCode,
                branchName: warehouse?.branchId?.name,
                bcode: warehouse?.branchId?.branchCode,
                branchId: warehouse?.branchId?.id,
                whName: warehouse?.name,
                whCode: warehouse?.warehouseId,
                warehouseId: warehouse?.id,
                isActive: false,
                openingStock: '',
                openingStockRate: '',
                availableStock: '',
              };
        })
      : [];

  useEffect(() => {
    if (didRestoreNavigationState.current) return;
    const navigationState = readNavigationState(location.search);
    if (!navigationState) return;

    didRestoreNavigationState.current = true;
    navigate(stripNavigationStateParam(location), {
      replace: true,
      state: {
        ...location.state,
        ...navigationState,
      },
    });
  }, [location, navigate]);

  useEffect(() => {
    const controller = new AbortController();
    getWarehouseDrop({ signal: controller.signal });
    return () => controller.abort();
  }, [getWarehouseDrop]);

  useEffect(() => {
    const controller = new AbortController();
    if (itemId) {
      getItemById({ itemId, signal: controller.signal });
    } else {
      resetItem();
    }
    return () => controller.abort();
  }, [itemId]);

  const handleRefresh = async () => {
    await getItemById({ itemId });
  };

  const handleViewInventoryClick = () => {
    navigate(`/${ADMIN_ROUTE_PATHS.viewInventory.build.detail(itemId)}`);
  };

  const handleViewLedgerClick = () => {
    navigate(`/${ADMIN_ROUTE_PATHS.reports.itemLedger}?page=${DEFAULT_PAGE}&limit=${DEFAULT_PAGE_SIZE}&item=${itemId}`);
  };

  const canEdit = useModuleItem?.edit;
  const canDelete = useModuleItem?.delete && !isViewOnly;
  const isActive = item?.itemStatus;

  const handleEditClick = () => {
    navigate(`/item-master/${itemId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = async () => {
    try {
      await deleteItem({ itemId });
      navigate('/item-master');
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleMarkAsStatus = async () => {
    await toggleItemStatus({
      itemId,
      isActive: !isActive,
    });
    await getItemById({ itemId });
  };

  const isRmItem = item?.itemType === 'RM';
  const isServiceItem = Boolean(item?.itemCategory?.isService);
  const showInventoryTabs = !isServiceItem && Boolean(item?.trackInventory);
  const showProductionData = showInventoryTabs && Boolean(item?.productionData);

  useEffect(() => {
    setActiveKey(DETAIL_TABS.OVERVIEW);
  }, [itemId]);

  useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!item || !sectionId) return;

    if (sectionId === DETAIL_TABS.INVENTORY_DATA && showInventoryTabs) {
      setActiveKey(DETAIL_TABS.INVENTORY_DATA);
    }

    const timer = setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => clearTimeout(timer);
  }, [item, location.hash, showInventoryTabs]);

  useEffect(() => {
    const controller = new AbortController();
    if (itemId && isRmItem) {
      getItemsUsedIn({ itemId, signal: controller.signal });
    }
    return () => controller.abort();
  }, [itemId, isRmItem, getItemsUsedIn]);

  const UsedInTab = () => {
    if (itemsUsedInLoading) {
      return <ItemDetailUsedInTabSkeleton />;
    }

    if (itemsUsedIn.length === 0) {
      return (
        <div className="my-container container-spacing">
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-3">
              <InboxOutlined className="text-[20px] text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-800">No usage found</p>
            <p className="text-sm text-gray-500 mt-1">No items are using this raw material yet.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg mb-3">Used In</p>
        <CustomTable
          columns={ITEMS_USED_IN_COLUMNS}
          data={itemsUsedIn || []}
          pagination={false}
          scroll={{ x: 'max-content' }}
          dynamicScrollY={true}
          tableId="_id"
          onRowClick={record => {
            const targetId = String(record._id || record.id || '');
            const currentId = String(itemId || '');
            if (targetId && targetId === currentId) {
              setActiveKey(DETAIL_TABS.OVERVIEW);
              return;
            }
            navigate(`/item-master/${record._id || record.id}`);
          }}
        />
      </div>
    );
  };

  const OverviewTab = () => {
    const itemStatus = item?.itemStatus === true ? 'Active' : item?.itemStatus === false ? 'Inactive' : undefined;

    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Item Name" value={item?.itemName} truncate={false} valueClassName="break-words" />
              <DetailField label="Item Number" value={item?.itemNo} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Item Type" value={item?.itemType} />
              <DetailField label="Item Model No" value={item?.itemModelNo} />
              <DetailField label="Item Group" value={item?.itemGroup?.name} />
              <DetailField label="Sub Item Group" value={item?.subItemGroup?.name || '-'} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Description" value={item?.description} />
              <DetailField label="Item Status" value={itemStatus} />
              <DetailField label="Remarks" value={item?.remarks} truncate={false} valueClassName="whitespace-pre-wrap break-words" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Item Unit" value={unitDisplayName(item?.itemUnitId) || item?.itemUnit} />
              <DetailField label="Default Unit For Stock In" value={unitDisplayName(item?.stockInUnit)} />
              <DetailField label="Default Unit For Stock Out" value={unitDisplayName(item?.stockOutUnit)} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Sales Account" value={item?.salesInformation?.salesAccountId?.accountName} />
              <DetailField label="Purchase Account" value={item?.purchaseInformation?.purchaseAccountId?.accountName} />
              {item?.trackInventory && <DetailField label="Inventory Account" value={item?.inventoryAccountId?.accountName} />}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Track Inventory" value={item?.trackInventory ? 'Yes' : 'No'} />
              <DetailField label="Item Category">
                <>
                  Goods: {item?.itemCategory?.isGoods ? 'Yes' : 'No'}
                  <br />
                  Service: {item?.itemCategory?.isService ? 'Yes' : 'No'}
                </>
              </DetailField>
              <DetailField label="HSN Code" value={item?.hsnCode} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="GST" value={item?.gst != null ? formatGstForDisplay(item.gst) : undefined} />
              <DetailField label="Created From" value={item?.appName} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-x-3 mb-3">
                <p className="font-bold text-lg">Sales Information</p>
                {item?.salesInformation?.isSellable ? (
                  <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Sellable</span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Not Sellable</span>
                )}
              </div>

              <DetailField label="Selling Price" value={item?.salesInformation?.sellingPrice && item?.salesInformation?.isSellable ? formatAmount(item?.salesInformation?.sellingPrice) : undefined} />
            </div>

            <div>
              <div className="flex items-center gap-x-3 mb-3">
                <p className="font-bold text-lg">Purchase Information</p>
                {item?.purchaseInformation?.isPurchasable ? (
                  <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Purchasable</span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Not Purchasable</span>
                )}
              </div>

              <DetailField
                label="Cost Price"
                value={item?.purchaseInformation?.costPrice && item?.purchaseInformation?.isPurchasable ? formatAmount(item?.purchaseInformation?.costPrice) : undefined}
              />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
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
      </div>
    );
  };

  const PurchasingDataTab = () => (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">Purchasing Data</p>

      <div className="mt-2 space-y-3">
        <div className="">
          <div className="grid grid-cols-5">
            <div className="col-span-3"></div>
            <div className="text-center">Active / Inactive</div>
            <div className="text-center">Print On Document</div>
          </div>
          <div className="grid grid-cols-5 items-center py-1">
            <div className="col-span-3 flex items-center gap-x-3">
              <ul className="list-disc list-inside">
                <li>GRPO / AP Invoice Time Batch Number Mandatory Self & MFG</li>
              </ul>
            </div>
            <div className="text-center">{item?.purchasingData?.timeBatchNumberMandatory?.activeInactive ? 'Yes' : 'No'}</div>
            <div className="text-center">{item?.purchasingData?.timeBatchNumberMandatory?.printOnDocument ? 'Yes' : 'No'}</div>
          </div>
          <div className="grid grid-cols-5 items-center py-1">
            <div className="col-span-3 flex items-center gap-x-3">
              <ul className="list-disc list-inside">
                <li>GRPO / AP Invoice Punching Time Batch Expiry Mandatory Self & MFG</li>
              </ul>
            </div>
            <div className="text-center">{item?.purchasingData?.punchingTimeBatchNumberMandatory?.activeInactive ? 'Yes' : 'No'}</div>
            <div className="text-center">{item?.purchasingData?.punchingTimeBatchNumberMandatory?.printOnDocument ? 'Yes' : 'No'}</div>
          </div>
        </div>
        <DetailField label="Vendor Side MFG & Document">
          {item?.purchasingData?.vendorSideMFGAndQCDocument && item?.purchasingData?.vendorSideMFGAndQCDocument.length > 0 ? (
            <DisplayUploadedDocuments fileArray={item?.purchasingData?.vendorSideMFGAndQCDocument} />
          ) : (
            '-'
          )}
        </DetailField>
      </div>
    </div>
  );

  const SalesDataTab = () => (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">Sales Data</p>

      <div className="mt-2 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Before Dispatch From Warehouse (FQC)" value={item?.salesData?.beforeDispatchFromWarehouse ? 'Yes' : 'No'} />
          <div className="lg:col-span-2">
            <DetailField label="Select FQC Standard" value={item?.salesData?.fqlStander?.map(qc => qc.qcReportName).join(', ')} />
          </div>
        </div>

        <DetailField label="Vendor Side MFG & Document">
          {item?.salesData?.vendorSideMFGAndQCDocument && item?.salesData?.vendorSideMFGAndQCDocument.length > 0 ? (
            <DisplayUploadedDocuments fileArray={item?.salesData?.vendorSideMFGAndQCDocument} />
          ) : (
            '-'
          )}
        </DetailField>
      </div>
    </div>
  );

  const InventoryDataTab = () => (
    <div id="inventory-data" className="my-container container-spacing scroll-mt-20">
      <p className="font-bold text-lg">Inventory Data</p>

      <div className="mt-2 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Total Opening Stock" value={item?.inventoryData?.totalOpeningStock ?? 0} />
          <DetailField label="Inventory Sales Method" value={item?.inventoryData?.inventorySalesMethod} />
        </div>
        <CustomTable columns={columns} data={data1} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
      </div>
    </div>
  );

  const ProductionDataTab = () => (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">Production Data</p>

      <div className="mt-2 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Production Manage Method" value={PRODUCTION_MODULE_METHOD_LABEL[item.productionData.productionManageMethod]} />
        </div>
        {item?.productionData?.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Select Process Recipe" value={item?.productionData?.selectProcessRecipe?.name} />
          </div>
        )}
        {item?.productionData?.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE &&
          (item?.productionData?.processBased || []).map((process, processIndex) => {
            const processRef = process?.processId;
            const processName = typeof processRef === 'object' ? processRef?.name : '';
            const processCode = typeof processRef === 'object' ? processRef?.processId : '';
            return (
              <div key={processRef?._id || processRef || processIndex}>
                <div className="text-[--orange] font-semibold pb-1">
                  {processName || 'Process'}
                  {processCode ? ` (${processCode})` : ''}
                </div>
                <div className="grid grid-cols-10 pb-3">
                  <div className="col-span-2">Item Group</div>
                  <div className="col-span-2">Item</div>
                  <div className="col-span-2">Item Unit</div>
                  <div className="text-center col-span-2">Qty / Item</div>
                  <div className="text-center ">Reject</div>
                  <div className="text-center ">Return</div>
                </div>
                {(process?.rawMaterials || []).map((data, index) => (
                  <div key={index} className="grid grid-cols-10 pb-1.5">
                    <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.itemGroup?.name || '-'}</div>
                    <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.item?.itemName || '-'}</div>
                    <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{unitDisplayName(data?.itemUnitId) || '-'}</div>
                    <div className={`text-center col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.qtyPerItem || 0}</div>
                    <div className={`text-center ${DETAIL_VALUE_CLASS}`}>{formatBooleanDetail(data?.reject)}</div>
                    <div className={`text-center ${DETAIL_VALUE_CLASS}`}>{formatBooleanDetail(data?.return)}</div>
                  </div>
                ))}
              </div>
            );
          })}
        {item?.productionData?.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
          <div>
            <div className="text-[--orange] font-semibold pb-1">BOM BASED</div>
            <div>
              <div className="grid grid-cols-10 pb-3">
                <div className="col-span-2">Item Group</div>
                <div className="col-span-2">Item</div>
                <div className="col-span-2">Item Unit</div>
                <div className="text-center col-span-2">Qty / Item</div>
                <div className="text-center ">Reject</div>
                <div className="text-center ">Return</div>
              </div>
              {item?.productionData?.bomBased?.map((data, index) => (
                <div key={index} className="grid grid-cols-10 pb-1.5">
                  <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.itemGroup?.name || '-'}</div>
                  <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.item?.itemName || '-'}</div>
                  <div className={`col-span-2 ${DETAIL_VALUE_CLASS}`}>{unitDisplayName(data?.itemUnitId) || '-'}</div>
                  <div className={`text-center col-span-2 ${DETAIL_VALUE_CLASS}`}>{data?.qtyPerItem || 0}</div>
                  <div className={`text-center ${DETAIL_VALUE_CLASS}`}>{formatBooleanDetail(data?.reject)}</div>
                  <div className={`text-center ${DETAIL_VALUE_CLASS}`}>{formatBooleanDetail(data?.return)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {item?.productionData?.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
          <div>
            <div className="text-[--orange] font-semibold pb-1">Production Scrap Out Inventory</div>

            {item &&
              item?.productionData?.productionScrapOutInventory &&
              item?.productionData?.productionScrapOutInventory.length > 0 &&
              item?.productionData?.productionScrapOutInventory.map((scrapItem, index) => (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3" key={scrapItem?.id || scrapItem?._id || scrapItem?.scrapItemName?.id || index}>
                  <DetailField label="Scrap Item Name" value={scrapItem?.scrapItemName?.itemName} />
                  <DetailField label="Item Unit" value={unitDisplayName(scrapItem?.itemUnitId) || '-'} />
                  <DetailField label="Qty / Item" value={scrapItem?.qtyPerItem ?? 0} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  const AttachmentsTab = () => (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">Attachment</p>

      <div className="mt-2 space-y-3">
        <DetailField label="Product Document">{item?.attachments && item?.attachments.length > 0 ? <DisplayUploadedDocuments fileArray={item?.attachments} /> : '-'}</DetailField>
      </div>
    </div>
  );

  const items = [
    {
      key: DETAIL_TABS.OVERVIEW,
      label: 'Overview',
      children: <OverviewTab />,
    },
    {
      key: DETAIL_TABS.PURCHASING_DATA,
      label: 'Purchasing Data',
      children: <PurchasingDataTab />,
    },
    {
      key: DETAIL_TABS.SALES_DATA,
      label: 'Sales Data',
      children: <SalesDataTab />,
    },
    ...(showInventoryTabs
      ? [
          {
            key: DETAIL_TABS.INVENTORY_DATA,
            label: 'Inventory Data',
            children: <InventoryDataTab />,
          },
        ]
      : []),
    ...(showProductionData
      ? [
          {
            key: DETAIL_TABS.PRODUCTION_DATA,
            label: 'Production Data',
            children: <ProductionDataTab />,
          },
        ]
      : []),
    {
      key: DETAIL_TABS.ATTACHMENTS,
      label: 'Attachments',
      children: <AttachmentsTab />,
    },
    ...(isRmItem
      ? [
          {
            key: DETAIL_TABS.USED_IN,
            label: 'Used In',
            children: <UsedInTab />,
          },
        ]
      : []),
    {
      key: DETAIL_TABS.TRANSACTIONS,
      label: 'Transactions',
      children: activeKey === DETAIL_TABS.TRANSACTIONS ? <ItemTransactionsTab itemId={itemId} defaultType="Quote" /> : null,
    },
    {
      key: DETAIL_TABS.HISTORY,
      label: 'History',
      children: <HistoryCommon data={item?.commentHistory} />,
    },
  ];

  if (loading) {
    return <ItemDetailPageSkeleton />;
  }

  if (!item) {
    return <NoFoundPage docType={MODULE_NAMES?.ITEM} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col min-w-0">
              <h1 className="text-[18px] font-semibold text-gray-900 break-words">{item?.itemName || ''}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{item?.itemNo}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={item?.itemStatus} value={item?.itemStatus ? 'Active' : 'Inactive'} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {showInventoryTabs && (
              <PermissionButton canAccess={!!useModuleItemLedger?.view} type="primary" icon={<Icons.FileSearchOutlined />} onClick={handleViewLedgerClick}>
                View Ledger
              </PermissionButton>
            )}
            {showInventoryTabs && (
              <PermissionButton canAccess={!!useModuleProduction?.view} type="primary" icon={<Icons.FileSearchOutlined />} onClick={handleViewInventoryClick}>
                View Inventory
              </PermissionButton>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            {isViewOnly || !canEdit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!canEdit} type="primary" className="px-4 py-2 w-full" tooltipProps={{ placement: 'left' }} wrapperClassName="block w-full" block>
                Mark Item As
              </PermissionButton>
            ) : (
              <Dropdown
                placement="bottom"
                trigger={['click']}
                open={statusDropdownOpen}
                onOpenChange={setStatusDropdownOpen}
                dropdownRender={() => (
                  <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                    <div className="px-2 py-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                    </div>
                    <StatusConfirmPopover
                      isActive={isActive}
                      onConfirm={handleMarkAsStatus}
                      onCloseDropdown={() => setStatusDropdownOpen(false)}
                      label={`Mark as ${isActive ? 'Inactive' : 'Active'}`}
                      icon={
                        isActive ? <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} /> : <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />
                      }
                      placement="left"
                      confirmMessage={
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">
                          Are you sure you want to mark this item as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Item As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton
              canAccess={!!canEdit}
              isViewOnly={isViewOnly}
              type="default"
              icon={<Icons.EditOutlined />}
              className="px-4 py-2 w-full"
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              block
              onClick={!isViewOnly ? handleEditClick : undefined}
            >
              Edit
            </PermissionButton>
            <Popconfirm title="Delete Item" description="Are you sure you want to delete this item?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={handleDeleteClick}>
              <PermissionButton
                canAccess={!!useModuleItem?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteLoading}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                className="px-4 py-2 w-full"
                block
              >
                Delete
              </PermissionButton>
            </Popconfirm>
          </ActionButtons>
        </div>
      </div>
    </>
  );
};

export default ItemDetail;
