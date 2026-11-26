import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FieldArray, Formik } from 'formik';

// Components
import { AddGroupDropDown } from '../components/AddDropDown';
import AddSubItemGroupModal from '../components/AddSubItemGroupModal';
import InventoryData from '../components/InventoryData';
import ItemAttechment from '../components/ItemAttechment';
import ItemUnitConversions, {
  DefaultStockUnitFields,
  MAX_ITEM_UNIT_CONVERSIONS,
  mapItemUnitConversions,
  resolveConversionUnitId,
  resolveItemUnitSelectId,
  resolveStockUnitId,
} from '../components/ItemUnitConversions';
import ProductionData from '../components/ProductionData';
import PurchasingData from '../components/PurchasingData';
import SalesData from '../components/SalesData';
import BackButton from '@/components/ui/button/BackButton';
import { Tabs, Tooltip } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useModuleConfig } from 'hooks/useModuleConfig';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { GST_RATE_OPTIONS, ITEM_TYPE_OPTIONS } from '@/utils/dropdownEnums';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { MODULE_NAMES, PRODUCTION_MODULE_METHOD } from 'utils/constants';
import {
  useItemMaster,
  addAttechmentFileData,
  addInventryData,
  addProductionData,
  addPurchasing,
  addSalesData,
  itemMasterValidateSchema,
  productionDataValidateSchema,
  inventoryDataValidateSchema,
} from '@/features/allMaster/item';
import { DEFAULT_ITEM_TAB, ITEM_TABS } from '@/utils/tabs';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useItemUnitsDropdown } from '@/features/setting/itemUnit';
import { colorPalette } from '@/utils/theme';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildSubItemGroupSelectOptions, subItemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/subItemGroupSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddItem = () => {
  const formikRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemId } = useParams();
  const [activeTab, setActiveTab] = useState(DEFAULT_ITEM_TAB);
  const [modalOpen, setModalOpen] = useState(false);
  const [subItemGroupModalOpen, setSubItemGroupModalOpen] = useState(false);
  const { submitLoading, loading, item, purchasing, saleData, inventryData, productData, attchFile, createItem, updateItemData, resetItem, getItemById, warehouseDrop, getWarehouseDrop, getIQCDrop } =
    useItemMaster();
  const { itemGroupDrop, getItemGroupDropdown, itemGroupDropLoading } = useItemGroup();
  const { subItemGroupDrop, getSubItemGroupDropdown, subItemGroupDropLoading } = useSubItemGroup();
  const { accountDrop, getAccounts } = useChartOfAccounts();
  const { itemUnitsOptions, itemUnitsDropLoading } = useItemUnitsDropdown();
  const itemData = item;
  const hasExistingStock = useMemo(() => Number(itemData?.inventoryData?.totalAvailableStock) > 0, [itemData]);
  const { moduleConfig, moduleName, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const { isViewOnly } = useModulePermissions(RESOURCES.ITEM_MASTER);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [itemConfig, setItemConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const scrollToError = useScrollToError();
  const { useItemGroupMaster } = useModulePermissions(RESOURCES.ITEM_GROUP_MASTER);

  if (isViewOnly) {
    navigate('/');
  }

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const handleSaveClick = useCallback(async () => {
    if (submitLoading || !formikRef.current) return;

    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      formikRef.current.setTouched(errorsToTouched(errors));
      const firstErrorField = Object.keys(errors)[0];
      scrollToError(firstErrorField, errors);
      return;
    }

    formikRef.current.handleSubmit();
  }, [submitLoading, scrollToError]);

  const initialValues = useMemo(() => {
    const isExistingService = Boolean(itemData?.itemCategory?.isService);
    return {
      itemNo: itemData ? itemData?.itemNo : '',
      description: itemData ? itemData?.description : '',
      itemName: itemData ? itemData?.itemName : '',
      itemType: itemData ? itemData?.itemType : null,
      itemModelNo: itemData ? itemData?.itemModelNo : '',
      itemUnit: resolveItemUnitSelectId(itemData, itemUnitsOptions),
      stockInUnit: isExistingService ? null : resolveStockUnitId(itemData?.stockInUnit, itemUnitsOptions),
      stockOutUnit: isExistingService ? null : resolveStockUnitId(itemData?.stockOutUnit, itemUnitsOptions),
      unitConversions: isExistingService
        ? []
        : mapItemUnitConversions(itemData?.unitConversions).map(row => ({
            ...row,
            unit: resolveConversionUnitId(row.unit, itemUnitsOptions),
          })),
      itemGroup: itemData?.itemGroup?.id || itemData?.itemGroup?._id || null,
      subItemGroup: itemData?.subItemGroup?.id || itemData?.subItemGroup?._id || null,
      itemStatus: itemData ? itemData?.itemStatus : true,
      isGoods: !itemData?.itemCategory?.isGoods && !itemData?.itemCategory?.isService ? true : itemData?.itemCategory?.isGoods,
      isService: itemData ? itemData?.itemCategory?.isService : false,
      itemCategory: itemData?.itemCategory?.isGoods ? 'Goods' : itemData?.itemCategory?.isService ? 'Service' : 'Goods',
      trackInventory: itemData ? itemData?.trackInventory : true,
      gst: itemData ? itemData?.gst : null,
      hsnCode: itemData ? itemData?.hsnCode : '',
      isSellable: itemData ? itemData?.salesInformation?.isSellable : true,
      isPurchasable: itemData ? itemData?.purchaseInformation?.isPurchasable : true,
      sellingPrice: itemData ? itemData?.salesInformation?.sellingPrice : '',
      costPrice: itemData ? itemData?.purchaseInformation?.costPrice : '',
      salesAccountId: itemData?.salesInformation?.salesAccountId?._id ?? null,
      purchaseAccountId: itemData?.purchaseInformation?.purchaseAccountId?._id ?? null,
      inventoryAccountId: itemData?.inventoryAccountId?._id ?? null,
      remarks: itemData?.remarks || '',
    };
  }, [itemData, itemUnitsOptions]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['itemNo'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (itemId) {
      dispatch(addPurchasing(itemData?.purchasingData));
      dispatch(addSalesData(itemData?.salesData));
      dispatch(addInventryData(itemData?.inventoryData));
      const pd = itemData?.productionData;
      if (pd) {
        const refId = value => value?._id || value?.id || value || null;
        dispatch(
          addProductionData({
            ...pd,
            ...(pd.bomBased && {
              bomBased: pd.bomBased.map(r => ({
                ...r,
                itemGroup: refId(r.itemGroup),
                item: refId(r.item),
                itemUnitId: refId(r.itemUnitId),
              })),
            }),
            productionScrapOutInventory: (pd.productionScrapOutInventory || []).map(row => ({
              ...row,
              scrapItemName: row.scrapItemName?._id || row.scrapItemName,
              itemUnitId: refId(row.itemUnitId),
            })),
            ...(pd.processBased && {
              processBased: pd.processBased.map(entry => ({
                processId: refId(entry.processId),
                rawMaterials: (entry.rawMaterials || []).map(row => ({
                  itemGroup: refId(row.itemGroup),
                  item: refId(row.item),
                  itemUnitId: refId(row.itemUnitId),
                  qtyPerItem: row.qtyPerItem,
                  reject: row.reject ?? false,
                  return: row.return ?? false,
                })),
              })),
            }),
          })
        );
      }
      dispatch(addAttechmentFileData(itemData?.attachments));
    }
  }, [dispatch, itemData, itemId]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getModuleConfig({ ...payload, moduleName: MODULE_NAMES.ITEM });
    getItemGroupDropdown(payload);
    getSubItemGroupDropdown(payload);
    getAccounts({ ...payload, type: 'SALES' });
    getAccounts({ ...payload, type: 'PURCHASE' });
    getAccounts({ ...payload, type: 'INVENTORY' });
    getIQCDrop(payload);
    if (!itemId) getWarehouseDrop(payload);

    return () => {
      controller.abort();
    };
  }, [dispatch, getModuleConfig, getItemGroupDropdown, getSubItemGroupDropdown, getWarehouseDrop, itemId, getAccounts, getIQCDrop]);

  useEffect(() => {
    if (moduleConfig && moduleName === MODULE_NAMES.ITEM) {
      setItemConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig, moduleName]);

  useEffect(() => {
    if (formikRef.current && !itemId && itemConfig) {
      const newQuoteId = itemConfig.autoGenerate ? `${itemConfig.prefix}${itemConfig.nextNumber}` : '';
      formikRef.current.setFieldValue('itemNo', newQuoteId);
    }
  }, [itemConfig, itemId]);

  useEffect(() => {
    if (!formikRef.current || !itemUnitsOptions.length) return;

    const currentUnit = formikRef.current.values.itemUnit;
    const resolvedUnit = resolveItemUnitSelectId({ itemUnitId: currentUnit }, itemUnitsOptions);
    if (resolvedUnit && resolvedUnit !== currentUnit) {
      formikRef.current.setFieldValue('itemUnit', resolvedUnit);
    }

    const conversions = formikRef.current.values.unitConversions || [];
    const nextConversions = conversions.map(row => ({
      ...row,
      unit: resolveConversionUnitId(row.unit, itemUnitsOptions),
    }));
    if (nextConversions.some((row, index) => row.unit !== conversions[index]?.unit)) {
      formikRef.current.setFieldValue('unitConversions', nextConversions);
    }
  }, [itemUnitsOptions]);

  useEffect(() => {
    if (!formikRef.current || itemId) return;
    const accountFor = (accountOptions, key) => accountOptions.flatMap(group => group.options).find(option => option.systemAccountKey === key)?.value ?? null;
    if (accountDrop.SALES) formikRef.current.setFieldValue('salesAccountId', accountFor(accountDrop.SALES, 'SALES'));
    if (accountDrop.PURCHASE) formikRef.current.setFieldValue('purchaseAccountId', accountFor(accountDrop.PURCHASE, 'COST_OF_GOODS_SOLD'));
    if (accountDrop.INVENTORY) formikRef.current.setFieldValue('inventoryAccountId', accountFor(accountDrop.INVENTORY, 'INVENTORY_ASSET'));
  }, [accountDrop, itemId]);

  useEffect(() => {
    const controller = new AbortController();
    if (itemId) {
      getItemById({ itemId, signal: controller.signal });
    } else {
      resetItem();
    }
    return () => controller.abort();
  }, [itemId]);

  const onFinish = async values => {
    if (submitLoading) return;
    if (itemId && hasExistingStock && !values.trackInventory) {
      Toast.error('Cannot turn off inventory tracking while this item holds stock. Adjust the stock to zero first.');
      return;
    }
    // dispatch(setLoading());
    const transformArray = array => (Array.isArray(array) ? array.map(item => item?.id || item?._id || item) : []);

    const purchasingDataTransformed = purchasing ?? {};

    const salesSafe = saleData ?? {};

    const salesDataTransformed = {
      ...salesSafe,
      ...(salesSafe?.beforeDispatchFromWarehouse && {
        fqlStander: transformArray(salesSafe.fqlStander),
      }),
    };

    if (!salesSafe?.beforeDispatchFromWarehouse) {
      delete salesDataTransformed?.fqlStander;
    }

    const productSafe = productData ?? {};
    const productionManageMethod = productSafe.productionManageMethod;
    const includeInventoryAndProduction = values.trackInventory && !values.isService;

    // Tab-level validation can be bypassed by switching tabs, so re-run the same Yup schema
    // here as the authoritative gate before submitting.
    if (includeInventoryAndProduction) {
      try {
        productionDataValidateSchema.validateSync(productSafe, { abortEarly: false, context: { productionManageMethod } });
      } catch (err) {
        setActiveTab(ITEM_TABS.PRODUCTION_DATA);
        setTimeout(() => {
          scrollToError(err?.inner?.[0]?.path || err?.path, { message: err?.errors?.[0] || 'Please complete the production data.' });
        }, 100);
        return;
      }

      try {
        inventoryDataValidateSchema.validateSync(inventryData ?? { warehouses: [] });
      } catch (err) {
        setActiveTab(ITEM_TABS.INVENTORY_DATA);
        setTimeout(() => {
          scrollToError(err?.path, { message: err?.errors?.[0] || 'Please correct the inventory data.' });
        }, 100);
        return;
      }
    }

    // Drop untouched rows so optional sections submit an empty array.
    const cleanedScrapInventory =
      productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED
        ? (productSafe.productionScrapOutInventory || [])
            .filter(row => row.scrapItemName?._id || row.scrapItemName)
            .map(row => ({
              scrapItemName: row.scrapItemName?._id || row.scrapItemName,
              itemUnitId: row.itemUnitId?._id || row.itemUnitId?.id || row.itemUnitId || null,
              qtyPerItem: Number(row.qtyPerItem),
            }))
        : [];

    const cleanedBomBased =
      productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED
        ? (productSafe.bomBased || [])
            .filter(row => row.item?.id || row.item?._id || row.item)
            .map(row => ({
              item: row.item?.id || row.item?._id || row.item,
              itemGroup: row.itemGroup?.id || row.itemGroup?._id || row.itemGroup,
              itemUnitId: row.itemUnitId?._id || row.itemUnitId?.id || row.itemUnitId || null,
              qtyPerItem: row.qtyPerItem,
              reject: row.reject ?? false,
              return: row.return ?? false,
              ...(row.oldItemId && { oldItemId: row.oldItemId }),
            }))
        : [];

    const cleanedProcessBased =
      productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE
        ? (productSafe.processBased || [])
            .map(entry => ({
              processId: entry.processId?._id || entry.processId?.id || entry.processId,
              rawMaterials: (entry.rawMaterials || [])
                .filter(row => row.item?.id || row.item?._id || row.item)
                .map(row => ({
                  itemGroup: row.itemGroup?.id || row.itemGroup?._id || row.itemGroup || null,
                  item: row.item?.id || row.item?._id || row.item,
                  itemUnitId: row.itemUnitId?._id || row.itemUnitId?.id || row.itemUnitId || null,
                  qtyPerItem: row.qtyPerItem,
                  reject: row.reject ?? false,
                  return: row.return ?? false,
                })),
            }))
            .filter(entry => entry.processId)
        : [];

    const productDataTransformed = {
      ...(productionManageMethod && { productionManageMethod }),
      ...(productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE && {
        selectProcessRecipe: productSafe.selectProcessRecipe?._id || productSafe.selectProcessRecipe || null,
        ...(cleanedProcessBased.length > 0 && { processBased: cleanedProcessBased }),
      }),
      ...(productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && cleanedBomBased.length > 0 && { bomBased: cleanedBomBased }),
      ...(productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && cleanedScrapInventory.length > 0 && { productionScrapOutInventory: cleanedScrapInventory }),
    };

    const warehouses =
      inventryData?.warehouses?.length > 0
        ? inventryData.warehouses
        : (warehouseDrop || []).map(warehouse => ({
            divisionId: warehouse.divisionId?.id || warehouse.divisionId,
            branchId: warehouse.branchId?.id || warehouse.branchId,
            warehouseId: warehouse.id || warehouse._id,
            isActive: true,
            openingStock: 0,
            openingStockRate: null,
          }));

    const updatedInventoryData = {
      totalOpeningStock: inventryData?.totalOpeningStock ?? 0,
      inventorySalesMethod: inventryData?.inventorySalesMethod ?? 'FIFO',
      minimumStockLevel: inventryData?.minimumStockLevel ?? null,
      maximumStockLevel: inventryData?.maximumStockLevel ?? null,
      warehouses: warehouses.map(warehouse => ({
        divisionId: warehouse.divisionId,
        branchId: warehouse.branchId,
        warehouseId: warehouse.warehouseId,
        isActive: warehouse.isActive ?? true,
        openingStock: Number(warehouse.openingStock) || 0,
        openingStockRate: Number(warehouse.openingStock) > 0 ? Number(warehouse.openingStockRate) : null,
      })),
    };

    const selectedItemUnit = itemUnitsOptions.find(option => option.value === values.itemUnit) || itemUnitsOptions.find(option => option.name === values.itemUnit);

    const currentConversionUnitIds = new Set(!values.isService ? (values.unitConversions || []).map(row => resolveConversionUnitId(row.unit, itemUnitsOptions)).filter(Boolean) : []);
    const removeItemUnitId = itemId
      ? [
          ...new Set(
            mapItemUnitConversions(itemData?.unitConversions)
              .map(row => resolveConversionUnitId(row.unit, itemUnitsOptions))
              .filter(unitId => unitId && !currentConversionUnitIds.has(unitId))
          ),
        ]
      : [];

    const itemDataa = {
      ...(!itemId && { itemNo: values.itemNo }),
      description: values.description,
      itemName: values.itemName,
      itemType: values.itemType,
      itemModelNo: values.itemModelNo,
      itemUnit: selectedItemUnit?.name || values.itemUnit,
      itemUnitId: selectedItemUnit?.value || null,
      stockInUnit: !values.isService && values.stockInUnit ? resolveConversionUnitId(values.stockInUnit, itemUnitsOptions) : null,
      stockOutUnit: !values.isService && values.stockOutUnit ? resolveConversionUnitId(values.stockOutUnit, itemUnitsOptions) : null,
      unitConversions: !values.isService
        ? (values.unitConversions || []).map(row => ({
            itemUnitId: resolveConversionUnitId(row.unit, itemUnitsOptions),
            qty: 1,
            baseQty: Number(row.baseQty),
            salesPrice: row.salesPrice === '' || row.salesPrice == null ? null : Number(row.salesPrice),
            purchasePrice: row.purchasePrice === '' || row.purchasePrice == null ? null : Number(row.purchasePrice),
          }))
        : [],
      ...(itemId && removeItemUnitId.length > 0 && { removeItemUnitId }),
      itemGroup: values.itemGroup,
      subItemGroup: values.subItemGroup || null,
      itemStatus: values.itemStatus,
      itemCategory: {
        isGoods: values.isGoods,
        isService: values.isService,
      },
      trackInventory: values.isService ? false : values.trackInventory,
      gst: values.gst,
      hsnCode: values.hsnCode,
      purchasingData: purchasingDataTransformed,
      salesData: salesDataTransformed,
      ...(includeInventoryAndProduction
        ? {
            inventoryData: updatedInventoryData,
            ...(Object.keys(productDataTransformed).length > 0 && { productionData: productDataTransformed }),
          }
        : {}),
      remarks: values.remarks,
      attachments: attchFile ?? [],
      salesInformation: {
        isSellable: values.isSellable,
        sellingPrice: values.sellingPrice !== '' ? values.sellingPrice : null,
        salesAccountId: values.isSellable ? values.salesAccountId || null : null,
      },
      purchaseInformation: {
        isPurchasable: values.isPurchasable,
        costPrice: values.costPrice !== '' ? values.costPrice : null,
        purchaseAccountId: values.isPurchasable ? values.purchaseAccountId || null : null,
      },
      inventoryAccountId: values.trackInventory && !values.isService ? values.inventoryAccountId || null : null,
    };

    const result = itemId ? await updateItemData({ itemId, itemData: itemDataa }) : await createItem(itemDataa);
    const targetId = itemId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/item-master/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  if (itemId && loading && !itemData) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-semibold text-gray-900">{itemId ? 'Edit Item' : 'Add Item'} </h1>
              {Boolean(itemId) && itemData?.itemCategory && (
                <span className="inline-flex items-center rounded-md bg-blue-50 text-primary border border-blue-200 px-2 py-1 text-xs font-medium">
                  Item Category: {itemData?.itemCategory?.isService ? 'Service' : 'Goods'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} validateOnChange initialValues={initialValues} validationSchema={itemMasterValidateSchema(itemConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, validateField, submitCount }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              const isServiceItem = values.itemCategory === 'Service';
              const canEnterUnitConversion = !isServiceItem;
              const resetUnitConversion = () => {
                setFieldValue('unitConversions', []);
                setFieldValue('stockInUnit', null);
                setFieldValue('stockOutUnit', null);
              };
              const tabItems = [
                {
                  key: ITEM_TABS.PURCHASING_DATA,
                  label: 'Purchasing Data',
                  children: <PurchasingData item={itemData} />,
                },
                {
                  key: ITEM_TABS.SALES_DATA,
                  label: 'Sales Data',
                  children: <SalesData values={values} item={itemData} />,
                },
                ...[
                  ...(!isServiceItem && values.trackInventory
                    ? [
                        {
                          key: ITEM_TABS.INVENTORY_DATA,
                          label: 'Inventory Data',
                          children: <InventoryData item={itemData} parentSubmitCount={submitCount} />,
                        },
                        {
                          key: ITEM_TABS.PRODUCTION_DATA,
                          label: 'Production Data',
                          children: <ProductionData item={itemData} parentSubmitCount={submitCount} />,
                        },
                      ]
                    : []),
                ],
                {
                  key: ITEM_TABS.ATTACHMENTS,
                  label: 'Attachments',
                  children: <ItemAttechment item={itemData} />,
                },
              ];
              return (
                <CustomForm name="add-item" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Item details</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                        <div>
                          <CustomInput
                            type="text"
                            name="itemName"
                            label="Item Name"
                            placeholder="Enter Name"
                            value={values.itemName}
                            setFieldValue={setFieldValue}
                            onChange={e => {
                              if (e.target.value.length > 200) {
                                setFieldTouched('itemName', true, false);
                                validateField('itemName');
                              }
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.itemName}
                            touched={touched.itemName}
                            required={true}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <div>
                          <CustomInput
                            type="text"
                            name="itemNo"
                            label="Item Number"
                            placeholder="Enter Item No"
                            value={values.itemNo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.itemNo}
                            touched={touched.itemNo}
                            setFieldValue={setFieldValue}
                            disabled={itemConfig?.autoGenerate || itemId}
                            suffix={
                              !itemId && (
                                <Tooltip title="Configure Item Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />
                        </div>
                        <CustomInput
                          type="select"
                          name="itemType"
                          label="Item Type"
                          placeholder="Select Item Type"
                          value={values.itemType}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.itemType}
                          touched={touched.itemType}
                          setFieldValue={setFieldValue}
                          selectOptions={ITEM_TYPE_OPTIONS}
                          required={true}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="text"
                          name="itemModelNo"
                          label="Item Model No"
                          placeholder="Enter Model No"
                          value={values.itemModelNo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.itemModelNo}
                          touched={touched.itemModelNo}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          type="select"
                          name="itemGroup"
                          label="Item Group"
                          placeholder="Select Item Group"
                          value={values.itemGroup}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.itemGroup}
                          touched={touched.itemGroup}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={itemGroupSelectColumnHeader}
                          selectOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                          loading={itemGroupDropLoading}
                          required={true}
                        />
                        {useItemGroupMaster?.create && (
                          <div>
                            <Icons.PlusCircleOutlined
                              style={{ color: colorPalette.primary[500] }}
                              onClick={() => {
                                setModalOpen(true);
                              }}
                              className="text-primary text-xl cursor-pointer w-max py-1.5 mt-7"
                            />
                          </div>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
                        <CustomInput
                          type="select"
                          name="subItemGroup"
                          label="Sub Item Group"
                          placeholder="Select Sub Item Group"
                          value={values.subItemGroup}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.subItemGroup}
                          touched={touched.subItemGroup}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={subItemGroupSelectColumnHeader}
                          selectOptions={buildSubItemGroupSelectOptions(subItemGroupDrop)}
                          loading={subItemGroupDropLoading}
                          allowClear={true}
                        />
                        {useItemGroupMaster?.create && (
                          <div>
                            <Icons.PlusCircleOutlined
                              style={{ color: colorPalette.primary[500] }}
                              onClick={() => {
                                setSubItemGroupModalOpen(true);
                              }}
                              className="text-primary text-xl cursor-pointer w-max py-1.5 mt-7"
                            />
                          </div>
                        )}
                      </div>
                      <FieldArray name="unitConversions">
                        {({ push, remove }) => (
                          <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
                              <CustomInput
                                type="select"
                                name="itemUnit"
                                label="Item Unit"
                                placeholder="Select Item Unit"
                                value={values.itemUnit}
                                onChange={selectedUnitId => {
                                  const nextConversions = (values.unitConversions || []).map(row => (row.unit === selectedUnitId ? { ...row, unit: null } : row));
                                  setFieldValue('unitConversions', nextConversions);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.itemUnit}
                                touched={touched.itemUnit}
                                setFieldValue={setFieldValue}
                                selectOptions={itemUnitsOptions}
                                loading={itemUnitsDropLoading}
                                disabled={Boolean(itemId)}
                                required={true}
                              />
                              {canEnterUnitConversion && (
                                <div>
                                  <Tooltip
                                    title={
                                      !values.itemUnit
                                        ? 'Select an item unit first'
                                        : (values.unitConversions || []).length >= MAX_ITEM_UNIT_CONVERSIONS
                                          ? `Max. ${MAX_ITEM_UNIT_CONVERSIONS} units can be added`
                                          : 'Add unit conversion'
                                    }
                                  >
                                    <Icons.PlusCircleOutlined
                                      style={{ color: colorPalette.primary[500] }}
                                      onClick={() => {
                                        const conversions = values.unitConversions || [];
                                        if (!values.itemUnit || conversions.length >= MAX_ITEM_UNIT_CONVERSIONS) return;
                                        push({ unit: null, qty: 1, baseQty: '', salesPrice: '', purchasePrice: '' });
                                      }}
                                      className={`text-primary text-xl w-max py-1.5 mt-7 ${
                                        values.itemUnit && (values.unitConversions || []).length < MAX_ITEM_UNIT_CONVERSIONS ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                                      }`}
                                    />
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                            {typeof errors.unitConversions === 'string' && !(canEnterUnitConversion && (values.unitConversions || []).length > 0) && (
                              <div id="unitConversions" className="text-xs text-red-500 pt-1">
                                {errors.unitConversions}
                              </div>
                            )}
                            {canEnterUnitConversion && (values.unitConversions || []).length > 0 && (
                              <ItemUnitConversions
                                conversions={values.unitConversions || []}
                                itemUnit={values.itemUnit}
                                itemUnitsOptions={itemUnitsOptions}
                                itemUnitsDropLoading={itemUnitsDropLoading}
                                errors={errors}
                                touched={touched}
                                setFieldValue={setFieldValue}
                                setFieldTouched={setFieldTouched}
                                onRemove={remove}
                              />
                            )}
                          </>
                        )}
                      </FieldArray>
                      {canEnterUnitConversion && (
                        <DefaultStockUnitFields
                          itemUnit={values.itemUnit}
                          conversions={values.unitConversions || []}
                          stockInUnit={values.stockInUnit}
                          stockOutUnit={values.stockOutUnit}
                          itemUnitsOptions={itemUnitsOptions}
                          itemUnitsDropLoading={itemUnitsDropLoading}
                          errors={errors}
                          touched={touched}
                          setFieldValue={setFieldValue}
                          handleBlur={handleBlur}
                        />
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="textarea"
                          name="description"
                          label="Description"
                          placeholder="Enter Description"
                          value={values.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.description}
                          touched={touched.description}
                          setFieldValue={setFieldValue}
                        />
                        <CustomInput
                          type="textarea"
                          name="remarks"
                          label="Remarks"
                          placeholder="Enter Remarks"
                          value={values.remarks}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.remarks}
                          touched={touched.remarks}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                      {/* Sales & Purchase Information */}
                      <div className="grid md:grid-cols-2 gap-10 mt-4 pt-2 w-2/3">
                        {/* Sales Information */}
                        <div>
                          <div className="flex items-center mb-1 justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Sales Information</h2>
                            <div className="ml-3 flex items-center">
                              <CustomInput
                                type="checkbox"
                                CheckboxName="Sellable"
                                name="isSellable"
                                value={values.isSellable}
                                errorMessage={errors.isSellable}
                                touched={touched.isSellable}
                                setFieldValue={setFieldValue}
                                onChange={e => {
                                  handleChange(e);
                                  setFieldValue('sellingPrice', e.target.checked ? values.sellingPrice : null);
                                  if (!e.target.checked) setFieldValue('salesAccountId', null);
                                }}
                                onBlur={handleBlur}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <CustomInput
                              type="text"
                              name="sellingPrice"
                              label="Selling Price"
                              placeholder="Enter Selling Price"
                              value={values.sellingPrice}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.sellingPrice}
                              touched={touched.sellingPrice}
                              setFieldValue={setFieldValue}
                              required={values.isSellable}
                              disabled={!values.isSellable}
                            />
                            <CustomInput
                              type="account"
                              name="salesAccountId"
                              label="Sales Account"
                              placeholder="Select Sales Account"
                              value={values.salesAccountId}
                              onChange={value => setFieldValue('salesAccountId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.salesAccountId}
                              touched={touched.salesAccountId}
                              setFieldValue={setFieldValue}
                              selectOptions={accountDrop.SALES}
                              allowClear
                              required={values.isSellable}
                              disabled={!values.isSellable}
                            />
                          </div>
                        </div>

                        {/* Purchase Information */}
                        <div>
                          <div className="flex items-center mb-1 justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Purchase Information</h2>
                            <div className="ml-3 flex items-center">
                              <CustomInput
                                type="checkbox"
                                CheckboxName="Purchasable"
                                name="isPurchasable"
                                value={values.isPurchasable}
                                errorMessage={errors.isPurchasable}
                                touched={touched.isPurchasable}
                                setFieldValue={setFieldValue}
                                onChange={e => {
                                  handleChange(e);
                                  setFieldValue('costPrice', e.target.checked ? values.costPrice : null);
                                  if (!e.target.checked) setFieldValue('purchaseAccountId', null);
                                }}
                                onBlur={handleBlur}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <CustomInput
                              type="text"
                              name="costPrice"
                              label="Cost Price"
                              placeholder="Enter Cost Price"
                              value={values.costPrice}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.costPrice}
                              touched={touched.costPrice}
                              setFieldValue={setFieldValue}
                              required={values.isPurchasable}
                              disabled={!values.isPurchasable}
                            />
                            <CustomInput
                              type="account"
                              name="purchaseAccountId"
                              label="Purchase Account"
                              placeholder="Select Purchase Account"
                              value={values.purchaseAccountId}
                              onChange={value => setFieldValue('purchaseAccountId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.purchaseAccountId}
                              touched={touched.purchaseAccountId}
                              setFieldValue={setFieldValue}
                              selectOptions={accountDrop.PURCHASE}
                              allowClear
                              required={values.isPurchasable}
                              disabled={!values.isPurchasable}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center gap-x-3">
                          <CustomInput
                            type="checkbox"
                            CheckboxName={
                              <span className="inline-flex items-center">
                                Track Inventory for this item
                                <div className="pointer-events-auto cursor-pointer ml-2 inline-block text-base">
                                  <Tooltip title="Enable this option to track this item's stock based on its sales and purchase transactions." placement="right">
                                    <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
                                  </Tooltip>
                                </div>
                              </span>
                            }
                            name="trackInventory"
                            value={values.trackInventory}
                            onChange={e => {
                              if (!e.target.checked) {
                                setFieldValue('inventoryAccountId', null);
                                if (activeTab === ITEM_TABS.INVENTORY_DATA || activeTab === ITEM_TABS.PRODUCTION_DATA) {
                                  setActiveTab(DEFAULT_ITEM_TAB);
                                }
                                return;
                              }
                              handleChange(e);
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.trackInventory}
                            touched={touched.trackInventory}
                            setFieldValue={setFieldValue}
                            disabled={values.itemCategory === 'Service' || (itemId && values.trackInventory && hasExistingStock)}
                          />
                        </div>
                        {values.trackInventory && values.itemCategory !== 'Service' && (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-4">
                            <CustomInput
                              type="account"
                              name="inventoryAccountId"
                              label="Inventory Account"
                              placeholder="Select Inventory Account"
                              value={values.inventoryAccountId}
                              onChange={value => setFieldValue('inventoryAccountId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.inventoryAccountId}
                              touched={touched.inventoryAccountId}
                              setFieldValue={setFieldValue}
                              selectOptions={accountDrop.INVENTORY}
                              allowClear
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 w-max">
                        {!itemId && (
                          <CustomInput
                            name="itemCategory"
                            label="Item Category"
                            type="radio"
                            value={values.itemCategory}
                            onChange={e => {
                              let newValue = e?.target?.value;

                              setFieldValue('isGoods', newValue === 'Goods' ? true : false);
                              setFieldValue('isService', newValue === 'Service' ? true : false);
                              setFieldValue('itemCategory', newValue);
                              if (newValue === 'Service') {
                                setFieldValue('trackInventory', false);
                                setFieldValue('inventoryAccountId', null);
                                resetUnitConversion();
                                dispatch(addInventryData(null));
                                if (activeTab === ITEM_TABS.INVENTORY_DATA || activeTab === ITEM_TABS.PRODUCTION_DATA) {
                                  setActiveTab(DEFAULT_ITEM_TAB);
                                }
                              }
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.itemCategory}
                            touched={touched.itemCategory}
                            setFieldValue={setFieldValue}
                            radioOptions={[
                              { value: 'Goods', label: 'Goods' },
                              { value: 'Service', label: 'Service' },
                            ]}
                            required={true}
                          />
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="text"
                          name="hsnCode"
                          label={values.itemCategory === 'Service' ? 'SAC' : 'HSN Code'}
                          placeholder={values.itemCategory === 'Service' ? 'Enter SAC' : 'Enter HSN Code'}
                          value={values.hsnCode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.hsnCode}
                          touched={touched.hsnCode}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          name="gst"
                          label="GST"
                          type="select"
                          placeholder="Select GST"
                          value={values.gst}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.gst}
                          touched={touched.gst}
                          setFieldValue={setFieldValue}
                          selectOptions={GST_RATE_OPTIONS}
                          required={true}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <Tabs defaultActiveKey={DEFAULT_ITEM_TAB} activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
                    </div>
                  </div>
                  {modalOpen && (
                    <AddGroupDropDown
                      modalOpen={modalOpen}
                      setModalOpen={setModalOpen}
                      getList={() => {
                        getItemGroupDropdown({});
                      }}
                    />
                  )}
                  {subItemGroupModalOpen && (
                    <AddSubItemGroupModal
                      modalOpen={subItemGroupModalOpen}
                      setModalOpen={setSubItemGroupModalOpen}
                      getList={() => {
                        getSubItemGroupDropdown({});
                      }}
                    />
                  )}
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" loading={submitLoading} onClick={handleSaveClick} />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
        </div>
      </div>
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={itemConfig}
        title="Configure Item Number Preferences"
        description="Auto-generating item numbers can save your time. Would you like to change your current setting?"
        setConfigDetail={setItemConfig}
        moduleName={MODULE_NAMES?.ITEM}
      />
    </>
  );
};

export default AddItem;
