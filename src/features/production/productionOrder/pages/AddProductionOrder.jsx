import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import ProcessBased from '../components/ProcessBased';
import RawMaterialTables from '../components/RawMaterialTables';
import AddProductionDataDrawer from '../components/AddProductionDataDrawer';
import BackButton from '@/components/ui/button/BackButton';
import { Select, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';

// Hooks
import { useManPowerConfig } from '@/features/allMaster/manPower/useManPowerConfig';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useItemMaster } from '@/features/allMaster/item';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useProductionWarehouseConfig } from '@/features/setting/productionWarehouseConfig/useProductionWarehouseConfig';

// Extras
import { useProductionOrder, addProductionValidateSchema } from '@/features/production/productionOrder';
import Icons from '@/assets/icons/icon';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { colorPalette } from 'utils/theme';
import { buildDepartmentSelectOptions, filterWorkersByDepartment, getWorkerId } from '@/utils/manPowerDepartment';
import { MODULE_NAMES, PRODUCTION_MODULE_METHOD, PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';
import { buildProductionItemSelectOptions, productionItemColumnSelectHeader, productionItemSelectDropdownProps } from '@/utils/tableSelectDropdown/productionItemSelectDropdown';
import { buildWarehouseSelectOptions, warehouseSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { resolveLineUnitSelection, resolveUnitRefId } from '@/utils/itemLineUnit';

// Observes Formik values via useEffect so state updates never fire during render
const FormValuesWatcher = ({ values, onUpdate }) => {
  useEffect(() => {
    onUpdate(values);
  }, [values, onUpdate]);
  return null;
};

const salesOrderItemExtra = item => ({
  quantity: item.quantity,
  type: item.productionManageMethod,
  itemUnitId: resolveUnitRefId(item?.itemUnitId),
  itemUnit: item?.itemUnit || item?.itemUnitId?.name || '',
});

const getReferenceId = value => (typeof value === 'object' && value ? value._id || value.id || null : value || null);

const AddProduction = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { loading, createProductionOrder, fetchProductionItem, productionItem, getProductionSalesOrderDropdown, salesOrderDrop, dropLoading, fetchLoading } = useProductionOrder();
  const { getWorkerDropdown, dropdownLoading, workerDropdown } = useManPowerConfig();
  const { getItemDrop, itemDrop, itemDropLoading } = useItemMaster();
  const { dropdownConfigs: productionWarehouseConfigDropdown, dropdownLoading: productionWarehouseConfigDropdownLoading, getProductionWarehouseConfigDropdown } = useProductionWarehouseConfig();
  const [productionDataDrawerOpen, setProductionDataDrawerOpen] = useState(false);
  const [productionDataItem, setProductionDataItem] = useState(null);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const [salesOrderOptions, setSalesOrderOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [productionOrderConfig, setProductionOrderConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const { warehouseDrop, getWarehouseDrop, warehouseLoading } = useModulePermissions();
  const formikRef = useRef();
  const scrollToError = useScrollToError();
  const [productionOwnerDepartment, setProductionOwnerDepartment] = useState('');

  const departmentOptions = useMemo(() => buildDepartmentSelectOptions(workerDropdown), [workerDropdown]);
  const productionWarehouseConfigOptions = useMemo(
    () => (productionWarehouseConfigDropdown || []).map(config => ({ value: config._id || config.id, label: config.departmentName })),
    [productionWarehouseConfigDropdown]
  );

  const filteredWorkersForOwner = useMemo(() => filterWorkersByDepartment(workerDropdown, productionOwnerDepartment), [workerDropdown, productionOwnerDepartment]);

  const productionItemDropOptions = useMemo(() => buildProductionItemSelectOptions(itemDrop, null, itemDrop), [itemDrop]);

  const getSelectedItemDetails = useCallback(
    (itemId, isSalesOrderBased) => {
      const options = isSalesOrderBased ? itemOptions : productionItemDropOptions;
      return options.find(item => item.value === itemId) || null;
    },
    [itemOptions, productionItemDropOptions]
  );

  const handleProductionDataSaved = useCallback(async () => {
    const savedItemId = productionDataItem?.itemId;
    setProductionDataItem(null);

    if (!savedItemId) return;

    const controller = new AbortController();
    await getItemDrop({ signal: controller.signal, isService: false, trackInventory: true });

    const data = await fetchProductionItem({ itemId: savedItemId });
    const productionData = data?.payload?.data?.productionData;
    if (productionData?.productionManageMethod) {
      formikRef.current?.setFieldValue('productionManageMethod', productionData.productionManageMethod);
    }
    formikRef.current?.setFieldValue(
      'processes',
      (productionData?.selectProcessRecipe?.processes || []).map(process => ({ _id: process._id, processName: process.name, processNo: process.processId }))
    );
  }, [getItemDrop, fetchProductionItem, productionDataItem?.itemId]);

  const fetchItems = salesOrderId => {
    const selectedOrder = salesOrderDrop.find(order => order._id === salesOrderId);
    if (!selectedOrder?.items) return [];

    return buildProductionItemSelectOptions(selectedOrder.items, salesOrderItemExtra, itemDrop);
  };

  const handleProductionItemSelect = useCallback(
    async (selectedItemValue, setFieldValue, values, fieldName = 'item') => {
      const options = fieldName === 'item' ? itemOptions : productionItemDropOptions;
      const selectedItem = options.find(item => item.value === selectedItemValue);

      setFieldValue(fieldName, selectedItemValue);
      const selectedMaster = (itemDrop || []).find(item => String(item?._id || item?.id) === String(selectedItemValue || ''));
      const isSalesOrderItem = fieldName === 'item';
      const unitLine = isSalesOrderItem ? { itemUnitId: selectedItem?.itemUnitId || null, itemUnit: selectedItem?.itemUnit || '' } : {};
      const defaultUnit = resolveLineUnitSelection(unitLine, selectedMaster);
      setFieldValue('itemUnitId', selectedItemValue ? defaultUnit.itemUnitId || null : null);
      if (fieldName === 'item') {
        setFieldValue('quantity', selectedItem?.quantity || '');
      } else {
        setFieldValue('quantity', '');
        setFieldValue('itemGroup', '');
        setFieldValue('qtyPerItem', '');
        setFieldValue('selectProcessRecipe', '');
      }

      if (selectedItemValue) {
        const isSalesOrderBased = fieldName === 'item';
        const selectedOption = getSelectedItemDetails(selectedItemValue, isSalesOrderBased);

        if (!selectedOption?.isProductionDataAdded) {
          setFieldValue('productionManageMethod', null);
          setProductionDataItem({
            itemId: selectedItemValue,
            itemName: selectedOption?.columnName || selectedOption?.label || '',
          });
          return;
        }

        setProductionDataItem(null);

        const data = await fetchProductionItem({
          itemId: selectedItemValue,
        });

        const productionData = data?.payload?.data?.productionData;
        setFieldValue('productionManageMethod', productionData?.productionManageMethod || null);
        setFieldValue(
          'processes',
          (productionData?.selectProcessRecipe?.processes || []).map(process => ({ _id: process._id, processName: process.name, processNo: process.processId }))
        );
      } else {
        setProductionDataItem(null);
      }
    },
    [itemOptions, productionItemDropOptions, fetchProductionItem, getSelectedItemDetails, itemDrop]
  );

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getWorkerDropdown(payload);
    getProductionSalesOrderDropdown(payload);

    return () => controller.abort();
  }, [dispatch, getWorkerDropdown, getProductionSalesOrderDropdown]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal, isService: false, trackInventory: true };
    getItemDrop(payload);

    return () => controller.abort();
  }, [dispatch, getItemDrop]);

  useEffect(() => {
    if (salesOrderDrop && salesOrderDrop.length) {
      const formattedOptions = salesOrderDrop.map(order => {
        const orderNo = order?.orderId || '-';
        const customerName = order?.customerName || '-';
        return {
          value: order._id,
          label: `${orderNo} - ${customerName}`,
          columnId: orderNo,
          columnName: customerName,
          searchLabel: `${orderNo} ${customerName}`.replace(/\s+/g, ' ').trim(),
        };
      });
      setSalesOrderOptions(formattedOptions);
    }
  }, [salesOrderDrop]);

  useEffect(() => {
    const salesOrderId = formikRef.current?.values?.salesOrder;
    if (!salesOrderId || !itemDrop?.length || !salesOrderDrop?.length) return;
    const items = buildProductionItemSelectOptions(salesOrderDrop.find(order => order._id === salesOrderId)?.items, salesOrderItemExtra, itemDrop);
    if (items.length) setItemOptions(items);
  }, [itemDrop, salesOrderDrop]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getWarehouseDrop(payload);
    return () => controller.abort();
  }, [dispatch, getWarehouseDrop]);

  useEffect(() => {
    if (moduleConfig) {
      setProductionOrderConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.PRODUCTION_ORDER,
    });
    return () => controller.abort();
  }, [getModuleConfig]);

  const initialValues = useMemo(
    () => ({
      productionOrderCode: '',
      production: true,
      salesOrder: null,
      item: null,
      quantity: '',
      itemUnitId: null,
      nonProdItem: null,
      itemGroup: null,
      qtyPerItem: null,
      selectProcessRecipe: null,
      dispatchDivisionId: null,
      dispatchBranchId: null,
      productionDepartmentWarehouseConfigId: null,
      productionWarehouseId: null,
      inStockWarehouseId: null,
      inventoryInwarehouseId: null,
      productionOwner: [],
      scrapItems: [],
      processes: [],
    }),
    [] // Empty dependency array since these are always the same initial values
  );

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['productionOrderCode'];
  const { handleNavigation, navigateAfterSave, updateFormValues: _updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);
  const updateFormValues = useCallback(_updateFormValues, [_updateFormValues]);

  useEffect(() => {
    if (productionOrderConfig) {
      const newProductionOrderCode = productionOrderConfig.autoGenerate ? `${productionOrderConfig.prefix}${productionOrderConfig.nextNumber}` : '';
      formikRef.current?.setFieldValue('productionOrderCode', newProductionOrderCode);
    }
  }, [productionOrderConfig]);

  const onFinish = async values => {
    if (loading) return;
    const isSalesOrderBased = !!values.production;
    const itemId = isSalesOrderBased ? values.item : values.nonProdItem;

    const productionModule = {
      productionOrderCode: values.productionOrderCode,
      isSalesOrderBased,
      salesOrderId: isSalesOrderBased ? values.salesOrder : null,
      // divisionId: values.divisionId,
      // branchId: values.branchId,
      productionDepartmentWarehouseConfigId: values.productionDepartmentWarehouseConfigId || null,
      inStockWarehouseId: values.inStockWarehouseId,
      productionWarehouseId: values.productionWarehouseId,
      inventoryInwarehouseId: values.inventoryInwarehouseId,
      itemId,
      itemUnitId: values.itemUnitId || null,
      quantity: Number(values.quantity),
      productionOwner: values.productionOwner || [],
      productionManageMethod: values.productionManageMethod,
      ...(values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && {
        rawMaterials: (productionItem?.productionData?.bomBased || []).map(item => ({
          rawMaterialId: item.item,
          perItemRequiredUnit: Number(item.qtyPerItem),
          productionOrderRequiredUnit: parseFloat((Number(values.quantity) * Number(item.qtyPerItem)).toFixed(3)),
        })),
      }),
      ...(values.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE && {
        processBased: {
          recipeId: productionItem?.productionData?.selectProcessRecipe?._id,
          recipeName: productionItem?.productionData?.selectProcessRecipe?.recipeId,
          processes: values.processes.map(({ processNo, processName }) => ({ processNo, processName })),
        },
      }),
    };

    const result = await createProductionOrder(productionModule);
    if (shouldPreventNavigation(result)) {
      return;
    }

    const createdOrder = result?.payload?.data?.productionOrder || result?.payload?.data;
    const targetId = createdOrder?.id || createdOrder?._id;

    if (targetId) {
      navigateAfterSave(`/production-orders/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">Add Production </h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} enableReinitialize initialValues={initialValues} validationSchema={addProductionValidateSchema(productionOrderConfig?.autoGenerate)} onSubmit={onFinish}>
            {({ values, setFieldValue, handleChange, handleBlur, handleSubmit, errors, touched, setTouched }) => {
              const selectedItemId = values.production ? values.item : values.nonProdItem;
              const selectedMaster = (itemDrop || []).find(item => String(item?._id || item?.id) === String(selectedItemId || ''));
              const unitSelection = resolveLineUnitSelection({ itemUnitId: values.itemUnitId }, selectedMaster);
              const itemUnitOptions = unitSelection.options.map(option => ({ label: option.label, value: option.value }));
              const handleItemUnitChange = selectedValue => {
                const option = unitSelection.options.find(unitOption => String(unitOption.value) === String(selectedValue));
                setFieldValue('itemUnitId', option?.itemUnitId || null);
              };
              return (
                <CustomForm onFinish={handleSubmit}>
                  <FormValuesWatcher values={values} onUpdate={updateFormValues} />
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Document details</h3>
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="text"
                            name="productionOrderCode"
                            label="Production Order Code"
                            placeholder="Enter Production Order Code"
                            value={values.productionOrderCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.productionOrderCode}
                            touched={touched.productionOrderCode}
                            setFieldValue={setFieldValue}
                            disabled={productionOrderConfig?.autoGenerate}
                            suffix={
                              <Tooltip title="Configure Production Order Code">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            }
                            required
                          />
                        </div>
                        <CustomInput
                          type="checkbox"
                          name="production"
                          CheckboxName="Production By Sales order"
                          value={!!values.production}
                          onChange={e => {
                            handleChange(e);

                            setFieldValue('salesOrder', null);
                            setFieldValue('item', null);
                            setFieldValue('quantity', '');
                            setFieldValue('itemUnitId', null);
                            setFieldValue('nonProdItem', null);
                            setFieldValue('itemGroup', null);
                            setFieldValue('qtyPerItem', null);
                            setFieldValue('selectProcessRecipe', null);
                            setFieldValue('scrapItems', []);
                            setFieldValue('divisionId', null);
                            setFieldValue('branchId', null);
                            setFieldValue('warehouseId', null);
                            setFieldValue('productionManageMethod', null);
                            setFieldValue('dispatchDivisionId', null);
                            setFieldValue('dispatchBranchId', null);
                            setFieldValue('inventoryWarehouseId', null);
                            setFieldValue('productionWarehouseId', null);
                            setFieldValue('inStockWarehouseId', null);
                            setFieldValue('productionDepartmentWarehouseConfigId', null);

                            setItemOptions([]);
                            setProductionDataItem(null);
                            setProductionDataDrawerOpen(false);
                          }}
                          onBlur={handleBlur}
                          errorMessage={errors.production}
                          touched={touched.production}
                          setFieldValue={setFieldValue}
                        />

                        {values.production && (
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-7">
                            <CustomInput
                              type="select"
                              name="salesOrder"
                              label="Sales Order"
                              placeholder="Select Sales Order"
                              value={values.salesOrder}
                              selectVariant="twoColumn"
                              columnSelectHeader={{ id: 'Sales Order#', name: 'Customer Name' }}
                              selectOptions={salesOrderOptions}
                              setFieldValue={setFieldValue}
                              onBlur={handleBlur}
                              errorMessage={errors.salesOrder}
                              touched={touched.salesOrder}
                              onChange={e => {
                                const selected = e;
                                setFieldValue('item', null, false);
                                setFieldValue('itemUnitId', null, false);
                                setFieldValue('quantity', '', false);
                                setFieldValue('productionManageMethod', null, false);
                                setProductionDataItem(null);
                                setProductionDataDrawerOpen(false);
                                const items = fetchItems(selected);
                                setItemOptions(items);
                              }}
                              disabled={!values.production}
                              loading={dropLoading}
                              required={true}
                            />

                            <CustomInput
                              type="select"
                              name="item"
                              label="Item"
                              placeholder="Select Item"
                              setFieldValue={setFieldValue}
                              value={values.item}
                              onBlur={handleBlur}
                              errorMessage={errors.item}
                              touched={touched.item}
                              selectVariant="productionItem"
                              selectOptions={itemOptions}
                              columnSelectHeader={productionItemColumnSelectHeader}
                              popupMatchSelectWidth={productionItemSelectDropdownProps.popupMatchSelectWidth}
                              dropdownStyle={productionItemSelectDropdownProps.dropdownStyle}
                              onChange={selectedItemValue => handleProductionItemSelect(selectedItemValue, setFieldValue, values, 'item')}
                              disabled={!values.production || !values.salesOrder}
                              loading={fetchLoading}
                              required={true}
                            />
                            <CustomInput
                              type="select"
                              name="itemUnitId"
                              label="Item Unit"
                              placeholder="Select Item Unit"
                              value={unitSelection.option?.value}
                              selectOptions={itemUnitOptions}
                              setFieldValue={setFieldValue}
                              onChange={handleItemUnitChange}
                              onBlur={handleBlur}
                              errorMessage={errors.itemUnitId}
                              touched={touched.itemUnitId}
                              disabled
                              required
                            />
                            <CustomInput
                              type="text"
                              name="quantity"
                              label="Quantity Info"
                              placeholder="Enter Quantity Info"
                              value={values.quantity}
                              onChange={e => {
                                const newValue = e.target.value;
                                if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                  return;
                                }
                                setFieldValue('quantity', newValue);
                              }}
                              disabled={!values.production || !values.item}
                              onBlur={handleBlur}
                              errorMessage={errors.quantity}
                              touched={touched.quantity}
                              required={true}
                            />
                          </div>
                        )}
                        {!values.production && (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                            <CustomInput
                              type="select"
                              name="nonProdItem"
                              label="Item"
                              placeholder="Select Item"
                              setFieldValue={setFieldValue}
                              onBlur={handleBlur}
                              errorMessage={errors.nonProdItem}
                              touched={touched.nonProdItem}
                              value={values.nonProdItem}
                              selectVariant="productionItem"
                              selectOptions={productionItemDropOptions}
                              columnSelectHeader={productionItemColumnSelectHeader}
                              popupMatchSelectWidth={productionItemSelectDropdownProps.popupMatchSelectWidth}
                              dropdownStyle={productionItemSelectDropdownProps.dropdownStyle}
                              onChange={selectedItemValue => handleProductionItemSelect(selectedItemValue, setFieldValue, values, 'nonProdItem')}
                              loading={itemDropLoading}
                              required={true}
                            />
                            <CustomInput
                              type="select"
                              name="itemUnitId"
                              label="Item Unit"
                              placeholder="Select Item Unit"
                              value={unitSelection.option?.value}
                              selectOptions={itemUnitOptions}
                              setFieldValue={setFieldValue}
                              onChange={handleItemUnitChange}
                              onBlur={handleBlur}
                              errorMessage={errors.itemUnitId}
                              touched={touched.itemUnitId}
                              disabled={!values.nonProdItem || unitSelection.options.length <= 1}
                              required
                            />
                            <CustomInput
                              type="text"
                              name="quantity"
                              label="Quantity Info"
                              placeholder="Enter Quantity Info"
                              value={values.quantity}
                              onChange={e => {
                                const newValue = e.target.value;
                                if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                  return;
                                }
                                setFieldValue('quantity', newValue);
                              }}
                              onBlur={handleBlur}
                              errorMessage={errors.quantity}
                              touched={touched.quantity}
                              disabled={!values.nonProdItem}
                              required={true}
                            />
                          </div>
                        )}
                        {productionDataItem?.itemId && (
                          <div className="flex items-center">
                            <CustomButton type="primary" className="!px-4 !py-2" text="Add Production Item" onClick={() => setProductionDataDrawerOpen(true)} />
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-7">
                          <CustomInput
                            type="select"
                            name="productionDepartmentWarehouseConfigId"
                            label="Production Department"
                            placeholder="Select Department"
                            value={values.productionDepartmentWarehouseConfigId}
                            onFocus={() => getProductionWarehouseConfigDropdown({})}
                            onChange={selectedConfigId => {
                              const selectedConfig = productionWarehouseConfigDropdown.find(config => String(config._id || config.id) === String(selectedConfigId || ''));
                              setFieldValue('productionDepartmentWarehouseConfigId', selectedConfigId || null);
                              setFieldValue('inStockWarehouseId', getReferenceId(selectedConfig?.rawMaterialWarehouse));
                              setFieldValue('productionWarehouseId', getReferenceId(selectedConfig?.productionWarehouse));
                              setFieldValue('inventoryInwarehouseId', getReferenceId(selectedConfig?.finishedGoodsWarehouse));
                            }}
                            onBlur={handleBlur}
                            setFieldValue={setFieldValue}
                            selectOptions={productionWarehouseConfigOptions}
                            loading={productionWarehouseConfigDropdownLoading}
                            allowClear
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="select"
                            name="inStockWarehouseId"
                            label="Raw Material Warehouse"
                            placeholder="Select Warehouse"
                            value={values.inStockWarehouseId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.inStockWarehouseId}
                            touched={touched.inStockWarehouseId}
                            setFieldValue={setFieldValue}
                            required={true}
                            selectVariant="twoColumn"
                            columnSelectHeader={warehouseSelectColumnHeader}
                            selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                            loading={warehouseLoading}
                          />
                          <CustomInput
                            type="select"
                            name="productionWarehouseId"
                            label="Production Warehouse"
                            placeholder="Select Warehouse"
                            value={values.productionWarehouseId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.productionWarehouseId}
                            touched={touched.productionWarehouseId}
                            setFieldValue={setFieldValue}
                            required={true}
                            selectVariant="twoColumn"
                            columnSelectHeader={warehouseSelectColumnHeader}
                            selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                            loading={warehouseLoading}
                          />
                          <CustomInput
                            type="select"
                            name="inventoryInwarehouseId"
                            label="Finished Goods Warehouse"
                            placeholder="Select Warehouse"
                            value={values.inventoryInwarehouseId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.inventoryInwarehouseId}
                            touched={touched.inventoryInwarehouseId}
                            setFieldValue={setFieldValue}
                            required={true}
                            selectVariant="twoColumn"
                            columnSelectHeader={warehouseSelectColumnHeader}
                            selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                            loading={warehouseLoading}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="text"
                            name="productionManageMethod"
                            label="Production Manage Method"
                            placeholder="Select Method"
                            value={PRODUCTION_MODULE_METHOD_LABEL[values.productionManageMethod]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.productionManageMethod}
                            touched={touched.productionManageMethod}
                            setFieldValue={setFieldValue}
                            selectOptions={[
                              { value: PRODUCTION_MODULE_METHOD.BOM_BASED, label: PRODUCTION_MODULE_METHOD_LABEL.BOM_BASED },
                              { value: PRODUCTION_MODULE_METHOD.PROCESS_ROUTE, label: PRODUCTION_MODULE_METHOD_LABEL.PROCESS_ROUTE },
                            ]}
                            disabled
                            required={true}
                          />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800">Department (Production Owner)</span>
                            <Select
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              placeholder="Filter by department, then select owners"
                              className="w-full"
                              value={productionOwnerDepartment || undefined}
                              onChange={val => {
                                const next = val ?? '';
                                setProductionOwnerDepartment(next);
                                const allowed = new Set(filterWorkersByDepartment(workerDropdown, next).map(w => getWorkerId(w)));
                                const pruned = (values.productionOwner || []).filter(id => allowed.has(id));
                                setFieldValue('productionOwner', pruned.length ? pruned : []);
                              }}
                              options={departmentOptions}
                              loading={dropdownLoading}
                            />
                          </div>
                          <CustomInput
                            type="select"
                            name="productionOwner"
                            label="Production Owner"
                            placeholder="Select Owner"
                            value={values.productionOwner}
                            mode="multiple"
                            onBlur={handleBlur}
                            errorMessage={errors.productionOwner}
                            touched={touched.productionOwner}
                            setFieldValue={setFieldValue}
                            selectOptions={(filteredWorkersForOwner || []).map(w => ({
                              value: getWorkerId(w),
                              label: w?.workerName,
                            }))}
                            loading={dropdownLoading}
                            // required={true}
                          />
                        </div>
                        {values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
                          <RawMaterialTables
                            productionItem={productionItem?.productionData?.bomBased || []}
                            values={values}
                            setFieldValue={setFieldValue}
                            handleChange={handleChange}
                            handleBlur={handleBlur}
                            errors={errors}
                            touched={touched}
                            itemUnitId={values.itemUnitId}
                            selectedUnitName={unitSelection.itemUnit}
                          />
                        )}
                        {values.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE && (
                          <ProcessBased
                            productionItem={productionItem?.productionData?.selectProcessRecipe || {}}
                            values={values}
                            setFieldValue={setFieldValue}
                            // handleChange={handleChange}
                            // handleBlur={handleBlur}
                            // errors={errors}
                            // touched={touched}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      loading={loading}
                      onClick={async () => {
                        let errors = await formikRef.current.validateForm();

                        if (Object.keys(errors).length > 0) {
                          setTouched(errorsToTouched(errors));
                          const firstErrorField = Object.keys(errors)[0];
                          scrollToError(firstErrorField, errors);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={loading} onClick={goBack} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
          <CodeConfigModal
            isVisible={isConfigModalVisible}
            onCancel={handleConfigModalVisibility}
            loading={moduleConfigLoading}
            initialConfig={productionOrderConfig}
            title="Configure Production Order Code Preferences"
            description="Auto-generating production order codes can save your time. Would you like to change your current setting?"
            setConfigDetail={setProductionOrderConfig}
            moduleName={MODULE_NAMES.PRODUCTION_ORDER}
          />
          <AddProductionDataDrawer
            open={productionDataDrawerOpen}
            onClose={() => setProductionDataDrawerOpen(false)}
            itemId={productionDataItem?.itemId}
            itemName={productionDataItem?.itemName}
            onSuccess={handleProductionDataSaved}
          />
        </div>
      </div>
    </>
  );
};

export default AddProduction;
