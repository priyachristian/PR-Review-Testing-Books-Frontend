import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import AddBulkInventoryAdjusment from '../components/AddBulkInventoryAdjusment';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import ItemTable from '@/components/dataDisplay/appTable/ItemTable';
import { Tooltip } from '@/components/AntDComponent';

// Hooks
import useScrollToError from '@/hooks/useScrollToError';
import { useItemMaster } from '@/features/allMaster/item';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Extras
import { useInventoryAdjustment, inventoryAdjustmentValidateSchema } from '@/features/inventory/inventoryAdjustment';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { INVENTORY_ADJUSTMENT_REASONS, MODULE_NAMES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { errorsToTouched, toApiDate, trimItemRows } from '@/utils/util';
import { toDecimalString } from '@/utils/currency';
import { getItemUnitName, resolveLineUnitSelection, resolveUnitRefId, stockQuantityForUnit } from '@/utils/itemLineUnit';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const AddInventoryAdjustment = () => {
  const { inventoryId } = useParams();
  const location = useLocation();
  const currentItemsRef = useRef([]);
  const formikRef = useRef(null);
  const [isModel, setIsModel] = useState(false);
  const { allItemDrop, getAllItemDrop, getItemAvailableStock, itemAvailableStock, allItemDropLoading, getStockLoading } = useItemMaster();
  const { accountDrop, getAccounts, droploading: accountDropLoading } = useChartOfAccounts();
  const { createInventoryAdjustment, updateInventoryAdjustment, submitLoading, inventoryAdjustmentById, getInventoryAdjustmentById } = useInventoryAdjustment();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig } = useModuleConfig();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    selectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(inventoryAdjustmentById, RESOURCES.INVENTORY_ADJUSTMENT, {
    skipItemDropdown: true,
    skipAutoItemDrop: true,
    enableBranchFirst: !inventoryId,
    enableWarehouseFirst: !inventoryId,
    moduleConfig,
  });
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [inventoryAdjustmentConfig, setInventoryAdjustmentConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  const findItem = (itemId, allItemDrop) => {
    const item = (allItemDrop || []).find(item => item._id === itemId);
    return item;
  };

  const getItemPurchasePrice = (itemId, itemsDrop = allItemDrop) => {
    const costPrice = findItem(itemId, itemsDrop)?.purchaseInformation?.costPrice;
    return costPrice != null && costPrice !== '' ? toDecimalString(parseFloat(costPrice)) : null;
  };

  const getItemUnitDefaults = (itemId, line, itemsDrop = allItemDrop) => {
    const unit = resolveLineUnitSelection(line || {}, findItem(itemId, itemsDrop));
    const unitPrice = unit.option?.purchasePrice;
    return {
      itemUnitId: unit.itemUnitId,
      itemUnit: unit.itemUnit || '',
      purchasePrice: unitPrice != null && unitPrice !== '' ? toDecimalString(parseFloat(unitPrice)) : null,
    };
  };

  useEffect(() => {
    if (!itemAvailableStock?.items || !formikRef.current) return;

    const updatedItems = formikRef.current?.values?.items.map(itm => {
      if (itm?.itemId) {
        const stockItem = itemAvailableStock.items.find(i => i.itemId === itm.itemId);
        const baseStock = Number(stockItem?.availableStock || 0);
        const master = findItem(itm.itemId, allItemDrop);
        const currStock = toDecimalString(stockQuantityForUnit(baseStock, master, itm));
        return {
          ...itm,
          baseAvailableStock: baseStock,
          currentStock: currStock,
          adjustedStock: itm.updatedStock != null && itm.updatedStock !== '' ? toDecimalString(parseFloat(itm.updatedStock) - parseFloat(currStock)) : null,
        };
      }
      return itm;
    });

    formikRef.current.setFieldValue('items', updatedItems);
  }, [itemAvailableStock]);

  useEffect(() => {
    if (!formikRef.current || !allItemDrop?.length) return;

    const currentItems = formikRef.current.values?.items;
    if (!currentItems?.length) return;

    let hasChanges = false;
    const updatedItems = currentItems.map(itm => {
      if (!itm?.itemId) return itm;
      const needsUnit = !resolveUnitRefId(itm.itemUnitId);
      const needsPrice = itm.purchasePrice == null || itm.purchasePrice === '';
      const hasBaseStock = itm.baseAvailableStock != null && itm.baseAvailableStock !== '';
      if (!needsUnit && !needsPrice && !hasBaseStock) return itm;

      const defaults = getItemUnitDefaults(itm.itemId, itm, allItemDrop);
      const next = { ...itm };
      let changed = false;
      if (needsUnit && defaults.itemUnitId) {
        next.itemUnitId = defaults.itemUnitId;
        next.itemUnit = defaults.itemUnit;
        changed = true;
      }
      if (needsPrice && defaults.purchasePrice != null) {
        next.purchasePrice = defaults.purchasePrice;
        changed = true;
      }
      if (hasBaseStock) {
        const master = findItem(itm.itemId, allItemDrop);
        const currStock = toDecimalString(stockQuantityForUnit(itm.baseAvailableStock, master, next));
        if (String(currStock) !== String(itm.currentStock ?? '')) {
          next.currentStock = currStock;
          next.adjustedStock = itm.updatedStock != null && itm.updatedStock !== '' ? toDecimalString(parseFloat(itm.updatedStock) - parseFloat(currStock)) : null;
          changed = true;
        }
      }
      if (!changed) return itm;

      hasChanges = true;
      return next;
    });

    if (hasChanges) {
      formikRef.current.setFieldValue('items', updatedItems);
    }
  }, [allItemDrop, inventoryAdjustmentById]);

  useEffect(() => {
    const controller = new AbortController();
    getAccounts({ signal: controller.signal, type: 'INVENTORY_ADJUSTMENT' });
    return () => controller.abort();
  }, [getAccounts]);

  useEffect(() => {
    if (!selectedWarehouseId) return;

    const controller = new AbortController();
    getAllItemDrop({
      isService: false,
      trackInventory: true,
      warehouseId: selectedWarehouseId,
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [selectedWarehouseId, getAllItemDrop]);

  useEffect(() => {
    const controller = new AbortController();
    if (inventoryId) {
      getInventoryAdjustmentById({ inventoryId, signal: controller.signal });
    }
  }, [inventoryId, getInventoryAdjustmentById]);

  useEffect(() => {
    const controller = new AbortController();

    getModuleConfig({
      moduleName: MODULE_NAMES.INVENTORY_ADJUSTMENT,
      signal: controller.signal,
    });

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setInventoryAdjustmentConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !inventoryId && inventoryAdjustmentConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (inventoryAdjustmentConfig.autoGenerate) {
        formikRef.current.setFieldValue('inventoryAdjustmentNumber', `${inventoryAdjustmentConfig.prefix}${inventoryAdjustmentConfig.nextNumber}`);
      } else {
        formikRef.current.setFieldValue('inventoryAdjustmentNumber', '');
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!hasSelectedValues && defaultConfig) {
        formikRef.current.setFieldValue('divisionId', defaultConfig.divisionId);
        formikRef.current.setFieldValue('branchId', defaultConfig.branchId);
        formikRef.current.setFieldValue('warehouseId', defaultConfig.warehouseId);
        setDivisionBranchWarehouseFromEntity({
          divisionId: defaultConfig.divisionId,
          branchId: defaultConfig.branchId,
          warehouseId: defaultConfig.warehouseId,
        });
      }

      if (defaultConfig?.branchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [inventoryAdjustmentConfig, inventoryId, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (inventoryId && inventoryAdjustmentById) {
      setDivisionBranchWarehouseFromEntity(inventoryAdjustmentById);
    }
  }, [inventoryId, inventoryAdjustmentById, setDivisionBranchWarehouseFromEntity]);

  useEffect(() => {
    if (formikRef.current?.values?.items) {
      currentItemsRef.current = formikRef.current.values.items;
    }
  }, [formikRef.current?.values?.items]);

  const scrollToError = useScrollToError();

  const initialValues = useMemo(
    () => ({
      divisionId: inventoryAdjustmentById ? inventoryAdjustmentById?.divisionId?._id : null,
      branchId: inventoryAdjustmentById ? inventoryAdjustmentById?.branchId?._id : null,
      warehouseId: inventoryAdjustmentById ? inventoryAdjustmentById?.warehouseId?._id : null,
      inventoryAdjustmentNumber: inventoryAdjustmentById ? inventoryAdjustmentById?.inventoryAdjustmentNumber || inventoryAdjustmentById?.inventoryAdjustmentId || '' : '',
      referenceNumber: inventoryAdjustmentById ? inventoryAdjustmentById?.referenceNumber : '',
      adjustmentDate: inventoryAdjustmentById?.adjustmentDate ? dayjs(inventoryAdjustmentById.adjustmentDate) : dayjs(),
      reason: inventoryAdjustmentById ? inventoryAdjustmentById?.reason : null,
      accountId: inventoryAdjustmentById?.accountId?._id ?? null,
      description: inventoryAdjustmentById ? inventoryAdjustmentById?.description : '',
      items: inventoryAdjustmentById
        ? inventoryAdjustmentById?.items?.map(item => {
            const itemId = item?.itemId?._id || null;
            const savedPurchasePrice = item?.purchasePrice != null && item?.purchasePrice !== '' ? toDecimalString(parseFloat(item.purchasePrice)) : null;
            return {
              itemId,
              itemUnitId: resolveUnitRefId(item?.itemUnitId),
              itemUnit: getItemUnitName(item),
              currentStock: toDecimalString(parseFloat(item?.currentStock || 0)),
              updatedStock: toDecimalString(parseFloat(item?.updatedStock || 0)),
              adjustedStock: toDecimalString(parseFloat(item?.adjustedStock || 0)),
              purchasePrice: savedPurchasePrice ?? getItemPurchasePrice(itemId),
            };
          })
        : [
            {
              itemId: null,
              itemUnitId: null,
              itemUnit: '',
              currentStock: 0,
              updatedStock: null,
              adjustedStock: null,
              purchasePrice: null,
            },
          ],
    }),
    [inventoryAdjustmentById]
  );

  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const handleItemChange = (selectedItem, formikValues) => {
    if (selectedItem && formikValues.warehouseId) {
      const itemIds = currentItemsRef.current
        .filter(item => item.itemId)
        .map(item => item.itemId)
        .join(', ');

      if (itemIds) {
        getItemAvailableStock({
          itemId: itemIds,
          warehouseId: formikValues.warehouseId,
        });
      }
    }
  };

  const onFinish = async values => {
    if (submitLoading) return;
    const inventoryData = {
      divisionId: values.divisionId,
      branchId: values.branchId,
      warehouseId: values.warehouseId,
      inventoryAdjustmentNumber: values.inventoryAdjustmentNumber,
      referenceNumber: values.referenceNumber,
      adjustmentDate: toApiDate(values.adjustmentDate),
      reason: values.reason,
      accountId: values.accountId,
      description: values.description,
      items: trimItemRows(values.items)?.map(item => {
        const adjustedStock = toDecimalString(parseFloat(Number(item.adjustedStock) || 0));
        const row = {
          itemId: item.itemId,
          itemUnitId: item.itemUnitId,
          currentStock: toDecimalString(parseFloat(Number(item.currentStock) || 0)),
          updatedStock: toDecimalString(parseFloat(Number(item.updatedStock) || 0)),
          adjustedStock,
        };
        if (parseFloat(adjustedStock) > 0) {
          row.purchasePrice = toDecimalString(parseFloat(Number(item.purchasePrice) || 0));
        }
        return row;
      }),
    };

    const result = inventoryId ? await updateInventoryAdjustment({ inventoryId, inventoryData }) : await createInventoryAdjustment(inventoryData);
    const targetId = inventoryId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/inventory-adjustment/${targetId}`, {
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

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{inventoryId ? 'Edit Inventory Adjustment' : 'Add Inventory Adjustment'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3" />
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik
            innerRef={formikRef}
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={inventoryAdjustmentValidateSchema(inventoryAdjustmentConfig?.autoGenerate)}
            onSubmit={onFinish}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              updateFormValues(values);
              return (
                <CustomForm name="add-inventory" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Inventory context</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                        <CustomInput
                          type="select"
                          name="divisionId"
                          label="Division"
                          placeholder="Select Division"
                          value={values.divisionId}
                          onBlur={handleBlur}
                          errorMessage={errors.divisionId}
                          touched={touched.divisionId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={divisionSelectColumnHeader}
                          selectOptions={buildDivisionSelectOptions(divDrop)}
                          loading={divisionLoading}
                          onChange={e => {
                            setFieldTouched('divisionId', false, false);
                            setFieldTouched('branchId', false, false);
                            setFieldTouched('warehouseId', false, false);
                            setWarehouseRequiresCascade(true);
                            setSelectedDivisionId(e || '');
                            setSelectedBranchId('');
                            setFieldValue('branchId', null, false);
                            setFieldValue('warehouseId', null, false);
                            setSelectedWarehouseId('');
                          }}
                        />
                        <CustomInput
                          type="select"
                          name="branchId"
                          label="Branch"
                          placeholder={getBranchSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.branchId}
                          onBlur={handleBlur}
                          errorMessage={errors.branchId}
                          touched={touched.branchId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={branchSelectColumnHeader}
                          selectOptions={buildBranchSelectOptions(branchDrop)}
                          loading={branchLoading}
                          onChange={e =>
                            applyBranchSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              values,
                            })
                          }
                          disabled={warehouseRequiresCascade && !values.divisionId}
                        />
                        <CustomInput
                          type="select"
                          name="warehouseId"
                          label="Warehouse"
                          placeholder={getWarehouseSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.warehouseId}
                          onChange={e => {
                            applyWarehouseSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              currentBranchId: values.branchId,
                              values,
                            });
                            if (e) {
                              const itemIds = currentItemsRef.current
                                .filter(item => item.itemId)
                                .map(item => item.itemId)
                                .join(', ');

                              if (itemIds) {
                                getItemAvailableStock({
                                  itemId: itemIds,
                                  warehouseId: e,
                                });
                              }
                            }
                          }}
                          onBlur={handleBlur}
                          errorMessage={errors.warehouseId}
                          touched={touched.warehouseId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={warehouseSelectColumnHeader}
                          selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                          loading={warehouseLoading}
                          disabled={warehouseRequiresCascade && !values.branchId}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Document details</h3>
                      <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                          <CustomInput
                            type="text"
                            name="inventoryAdjustmentNumber"
                            label="Inventory Adjustment#"
                            placeholder="Enter Inventory Adjustment#"
                            value={values.inventoryAdjustmentNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.inventoryAdjustmentNumber}
                            touched={touched.inventoryAdjustmentNumber}
                            setFieldValue={setFieldValue}
                            required={true}
                            disabled={inventoryAdjustmentConfig?.autoGenerate || inventoryId}
                            suffix={
                              !inventoryId && (
                                <Tooltip title="Configure Inventory Adjustment Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                          />
                          <CustomInput
                            type="date"
                            name="adjustmentDate"
                            label="Date"
                            value={values.adjustmentDate ? values.adjustmentDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.adjustmentDate}
                            touched={touched.adjustmentDate}
                            placeholder="Select Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />
                          <CustomInput
                            type="text"
                            name="referenceNumber"
                            label="Reference Number"
                            placeholder="Enter Reference Number"
                            value={values.referenceNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.referenceNumber}
                            touched={touched.referenceNumber}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                          <CustomInput
                            type="select"
                            name="reason"
                            label="Reason"
                            placeholder="Select Reason"
                            value={values.reason}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.reason}
                            touched={touched.reason}
                            setFieldValue={setFieldValue}
                            required={true}
                            selectOptions={Object?.entries(INVENTORY_ADJUSTMENT_REASONS)?.map(([key, value]) => {
                              return { value: key, label: value };
                            })}
                          />
                          <CustomInput
                            type="account"
                            name="accountId"
                            label="Account"
                            placeholder="Select Account"
                            value={values.accountId}
                            onBlur={handleBlur}
                            errorMessage={errors.accountId}
                            touched={touched.accountId}
                            setFieldValue={setFieldValue}
                            onChange={value => setFieldValue('accountId', value)}
                            selectOptions={accountDrop.INVENTORY_ADJUSTMENT}
                            loading={accountDropLoading}
                            required={true}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
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
                        </div>
                        <ItemTable
                          page={MODULE_NAMES.INVENTORY_ADJUSTMENT}
                          values={values}
                          arr={values.items}
                          findItem={findItem}
                          itemsDrop={allItemDrop}
                          itemsDropLoading={allItemDropLoading || getStockLoading}
                          setFieldValue={setFieldValue}
                          errors={errors}
                          handleBlur={handleBlur}
                          handleChange={handleChange}
                          touched={touched}
                          itemchangeCb={(selectedItem, formikValues) => {
                            currentItemsRef.current = formikValues.items;
                            handleItemChange(selectedItem, formikValues);
                          }}
                          footerActions={
                            <CustomButton
                              type="primary"
                              onClick={() => setIsModel(true)}
                              text={
                                <div className="flex gap-1 text-xs items-center">
                                  <Icons.PlusCircleOutlined className="text-xs" />
                                  <div>Add Bulk Item</div>
                                </div>
                              }
                            />
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      loading={submitLoading}
                      onClick={async () => {
                        const errors = await formikRef.current.validateForm();
                        if (Object.keys(errors).length > 0) {
                          setTouched(errorsToTouched(errors));
                          const firstErrorField = Object.keys(errors)[0];
                          scrollToError(firstErrorField, errors);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                    {isModel && (
                      <AddBulkInventoryAdjusment
                        isModel={isModel}
                        setIsModel={setIsModel}
                        allItemDrop={allItemDrop}
                        onAddItems={ids => {
                          const existingIds = values.items.map(item => item.itemId);
                          const filteredIds = ids.filter(id => !existingIds.includes(id));
                          if (filteredIds.length === 0) return;
                          const newItems = filteredIds.map(id => {
                            const unitDefaults = getItemUnitDefaults(id, {}, allItemDrop);
                            return {
                              itemId: id,
                              itemUnitId: unitDefaults.itemUnitId,
                              itemUnit: unitDefaults.itemUnit,
                              currentStock: null,
                              updatedStock: null,
                              adjustedStock: null,
                              purchasePrice: unitDefaults.purchasePrice ?? getItemPurchasePrice(id, allItemDrop),
                            };
                          });
                          const cleanedExisting = values.items.filter(item => item.itemId);
                          const updatedItems = [...cleanedExisting, ...newItems];
                          setFieldValue('items', updatedItems);
                          const allItemIds = updatedItems.map(item => item.itemId);
                          getItemAvailableStock({
                            itemId: allItemIds,
                            warehouseId: values.warehouseId,
                          });
                        }}
                      />
                    )}
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
        initialConfig={inventoryAdjustmentConfig}
        title="Configure Inventory Adjustment Number Preferences"
        description="Auto-generating inventory adjustment numbers can save your time. Would you like to change your current setting?"
        setConfigDetail={setInventoryAdjustmentConfig}
        moduleName={MODULE_NAMES.INVENTORY_ADJUSTMENT}
      />
    </>
  );
};

export default AddInventoryAdjustment;
