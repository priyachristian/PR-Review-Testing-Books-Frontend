import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useScrollToError from '@/hooks/useScrollToError';
import { useItemMaster } from '@/features/allMaster/item';
import { useViewInventory } from '@/features/inventory/viewInventory';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { errorsToTouched } from '@/utils/util';
import { convertProductionValidateSchema } from '@/utils/validationsSchema';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const resolveUnitId = unit => {
  if (!unit) return null;
  if (typeof unit === 'string') return unit;
  return unit.id || unit._id || null;
};

const buildWarehouseItemUnitOptions = (item, warehouse) => {
  if (!warehouse) return [];

  const options = [];
  const push = option => {
    if (option?.value == null || option.value === '') return;
    if (options.some(existing => String(existing.value) === String(option.value))) return;
    options.push(option);
  };

  const baseId = resolveUnitId(item?.itemUnitId);
  const baseName = item?.itemUnitId?.name || item?.itemUnit || '';
  push({
    label: baseName || 'Base Unit',
    value: baseId,
    availableStock: Number(warehouse?.availableStock ?? 0) || 0,
  });

  (warehouse.convertedStockDetails || []).forEach(unit => {
    const unitId = resolveUnitId(unit?.itemUnitId);
    push({
      label: unit?.unitName || unit?.itemUnitId?.name || unitId,
      value: unitId,
      availableStock: Number(unit?.availableStock ?? 0) || 0,
    });
  });

  return options;
};

const AddTransferRequest = ({ modalOpen, setModalOpen, fetchInventoryTransferRequestData }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { divDrop, getDivDropDown, branchDrop, getBranchDropDown, divisionLoading, branchLoading } = useModulePermissions(RESOURCES.INVENTORY_TRANSFER_REQUEST);
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const { loading, warehouseDrop, allItemDrop, transferItem, getAllItemDrop, getWarehouseDrop, allItemDropLoading, droploading: itemWarehouseDropLoading } = useItemMaster();
  const { getItemInventoryStock, inventoryStock, inventoryStockLoading } = useViewInventory();

  const [fromWarehouseOptions, setFromWarehouseOptions] = useState([]);
  const [fromBranchOptions, setFromBranchOptions] = useState([]);
  const [fromDivisionOptions, setFromDivisionOptions] = useState([]);
  const [itemUnitOptions, setItemUnitOptions] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [itemId, setItemId] = useState(null);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
    divisionDropdown: false,
  });

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({ isService: false, trackInventory: true });
      obj.itemDropdown = true;
    }

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (itemId) {
      getItemInventoryStock({ page: 1, limit: DEFAULT_PAGE_SIZE, itemId });
    }
  }, [itemId]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedDivisionId) {
      getBranchDropDown({ divisionId: selectedDivisionId, signal: controller.signal });
    }
    return () => controller.abort();
  }, [dispatch, selectedDivisionId, getBranchDropDown]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedBranchId) {
      getWarehouseDrop({ branchId: selectedBranchId, signal: controller.signal });
    }
    return () => controller.abort();
  }, [selectedBranchId, getWarehouseDrop]);

  useEffect(() => {
    const divisions = inventoryStock?.[0]?.itemInventory?.warehouses?.reduce((acc, warehouse) => {
      const division = warehouse?.division;

      if (!acc.find(d => d.value === division?._id)) {
        acc.push({
          label: division?.name,
          value: division?._id,
          columnId: division?.divisionCode || '-',
          columnName: division?.name || '-',
          searchLabel: `${division?.divisionCode || ''} ${division?.name || ''}`.replace(/\s+/g, ' ').trim(),
        });
      }
      return acc;
    }, []);
    setFromDivisionOptions(divisions);
  }, [inventoryStock]);

  const updateFromBranchOptions = divisionId => {
    if (!inventoryStock || !divisionId) return;

    const branches = inventoryStock?.[0]?.itemInventory?.warehouses
      .filter(warehouse => warehouse?.division?._id === divisionId)
      .reduce((acc, warehouse) => {
        const branch = warehouse?.branch;
        if (!acc.find(b => b.value === branch._id)) {
          acc.push({
            label: branch?.name,
            value: branch?._id,
            columnId: branch?.branchCode || '-',
            columnName: branch?.name || '-',
            searchLabel: `${branch?.branchCode || ''} ${branch?.name || ''}`.replace(/\s+/g, ' ').trim(),
          });
        }
        return acc;
      }, []);

    setFromBranchOptions(branches);
  };

  const updateFromWarehouseOptions = branchId => {
    if (!inventoryStock || !branchId) return;

    const warehouses = inventoryStock?.[0]?.itemInventory?.warehouses
      .filter(warehouse => warehouse?.branch?._id === branchId)
      .map(warehouse => ({
        label: warehouse?.warehouse?.name,
        value: warehouse?.warehouse?._id,
        columnId: warehouse?.warehouse?.warehouseId || '-',
        columnName: warehouse?.warehouse?.name || '-',
        searchLabel: `${warehouse?.warehouse?.warehouseId || ''} ${warehouse?.warehouse?.name || ''}`.replace(/\s+/g, ' ').trim(),
        quantity: warehouse?.availableStock,
      }));

    setFromWarehouseOptions(warehouses);
  };

  const applyItemUnitStock = (unitId, options, setFieldValue) => {
    const selectedUnit = (options || []).find(option => String(option.value) === String(unitId));
    const stock = selectedUnit?.availableStock ?? 0;
    setAvailableQuantity(stock);
    setFieldValue('fromQuantity', stock, false);
    setFieldValue('quantity', '', false);
  };

  const updateAvailableQuantity = (warehouseId, setFieldValue) => {
    if (!inventoryStock || !warehouseId) {
      setItemUnitOptions([]);
      setFieldValue('itemUnitId', null, false);
      setAvailableQuantity(0);
      setFieldValue('fromQuantity', 0, false);
      return;
    }

    const selectedWarehouse = inventoryStock?.[0]?.itemInventory?.warehouses.find(warehouse => warehouse?.warehouse?._id === warehouseId);
    const options = buildWarehouseItemUnitOptions(inventoryStock?.[0], selectedWarehouse);
    setItemUnitOptions(options);

    const defaultUnit = options[0] || null;
    setFieldValue('itemUnitId', defaultUnit?.value ?? null, false);
    if (defaultUnit) {
      applyItemUnitStock(defaultUnit.value, options, setFieldValue);
    } else {
      setAvailableQuantity(0);
      setFieldValue('fromQuantity', 0, false);
      setFieldValue('quantity', '', false);
    }
  };

  const formikRef = useRef();
  const scrollToError = useScrollToError();

  const resetTransferLocalState = () => {
    setSelectedDivisionId('');
    setSelectedBranchId('');
    setAvailableQuantity(0);
    setItemId(null);
    setFromWarehouseOptions([]);
    setFromBranchOptions([]);
    setFromDivisionOptions([]);
    setItemUnitOptions([]);
  };

  const initialValues = useMemo(
    () => ({
      itemId: null,
      fromDivisionId: null,
      fromBranchId: null,
      fromWarehouseId: null,
      itemUnitId: null,
      date: dayjs(),
      toDivisionId: null,
      toBranchId: null,
      toWarehouseId: null,
      quantity: '',
      fromQuantity: 0,
      notes: '',
    }),
    []
  );

  const { navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const handleGet = () => {
    const controller = new AbortController();
    fetchInventoryTransferRequestData(controller.signal);
  };

  const onFinish = async (values, { resetForm }) => {
    const productionData = {
      itemId: values.itemId,
      fromWarehouseId: values.fromWarehouseId,
      toWarehouseId: values.toWarehouseId,
      itemUnitId: values.itemUnitId,
      quantity: Number(values.quantity),
      date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
      notes: values?.notes,
    };

    const result = await transferItem(productionData);
    const targetId = result?.data?.id || result?.data?._id;

    setModalOpen(false);
    resetForm();
    resetTransferLocalState();

    if (targetId) {
      navigateAfterSave(`/inventory-transfer-request/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      handleGet();
      navigateAfterSave(-1);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={convertProductionValidateSchema} onSubmit={onFinish} enableReinitialize={true}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, resetForm }) => {
          updateFormValues(values);
          const handleCloseModal = () => {
            resetForm();
            resetTransferLocalState();
            setModalOpen(false);
          };

          return (
            <CustomModal
              modalOpen={modalOpen}
              setModalOpen={open => {
                if (!open) handleCloseModal();
              }}
              destroyOnClose={true}
              width={800}
              title={`Transfer Inventory`}
            >
              <div className="">
                <CustomForm name="Convert Production" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="flex md:flex-row flex-col  gap-7 pt-3">
                    <div className="w-full space-y-2">
                      <CustomInput
                        type="select"
                        name="itemId"
                        label="Item"
                        placeholder="Select Item"
                        value={values.itemId}
                        onBlur={handleBlur}
                        errorMessage={errors.itemId}
                        touched={touched.itemId}
                        setFieldValue={setFieldValue}
                        required={true}
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ width: '40%', borderRadius: 0 }}
                        className="w-full sm:!w-[361px] md:!w-[295.2px] lg:!w-[326.4px]"
                        selectVariant="twoColumn"
                        columnSelectHeader={itemSelectColumnHeader}
                        selectOptions={buildItemFilterSelectOptions(allItemDrop)}
                        loading={allItemDropLoading}
                        onFocus={() => {
                          if (!isApicalledRefFilter.current.itemDropdown) {
                            handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                          }
                        }}
                        onChange={e => {
                          setFieldValue('fromDivisionId', null, false);
                          setFieldValue('fromBranchId', null, false);
                          setFieldValue('fromWarehouseId', null, false);
                          setFieldValue('itemUnitId', null, false);
                          setFieldValue('fromQuantity', 0, false);
                          setFieldValue('quantity', '', false);
                          setAvailableQuantity(0);
                          setItemUnitOptions([]);
                          setItemId(e);
                        }}
                      />
                      <CustomInput
                        type="select"
                        name="fromDivisionId"
                        label="From Division"
                        placeholder="Select Division"
                        value={values.fromDivisionId}
                        onBlur={handleBlur}
                        errorMessage={errors.fromDivisionId}
                        touched={touched.fromDivisionId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={divisionSelectColumnHeader}
                        selectOptions={fromDivisionOptions}
                        onChange={e => {
                          setFieldValue('fromBranchId', null, false);
                          setFieldValue('fromWarehouseId', null, false);
                          setFieldValue('itemUnitId', null, false);
                          setFieldValue('fromQuantity', 0, false);
                          setFieldValue('quantity', '', false);
                          setAvailableQuantity(0);
                          setItemUnitOptions([]);
                          updateFromBranchOptions(e);
                        }}
                        disabled={!values.itemId}
                      />
                      <CustomInput
                        type="select"
                        name="fromBranchId"
                        label="From Branch"
                        placeholder="Select Branch"
                        value={values.fromBranchId}
                        onBlur={handleBlur}
                        errorMessage={errors.fromBranchId}
                        touched={touched.fromBranchId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={branchSelectColumnHeader}
                        selectOptions={fromBranchOptions}
                        loading={!!values.itemId && inventoryStockLoading}
                        onChange={e => {
                          setFieldValue('fromWarehouseId', null, false);
                          setFieldValue('itemUnitId', null, false);
                          setFieldValue('fromQuantity', 0, false);
                          setFieldValue('quantity', '', false);
                          setAvailableQuantity(0);
                          setItemUnitOptions([]);
                          updateFromWarehouseOptions(e);
                        }}
                        disabled={!values.fromDivisionId}
                      />
                      <CustomInput
                        type="select"
                        name="fromWarehouseId"
                        label="From Warehouse"
                        placeholder="Select Warehouse"
                        value={values.fromWarehouseId}
                        onBlur={handleBlur}
                        errorMessage={errors.fromWarehouseId}
                        touched={touched.fromWarehouseId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={warehouseSelectColumnHeader}
                        selectOptions={fromWarehouseOptions}
                        loading={!!values.itemId && inventoryStockLoading}
                        onChange={e => {
                          updateAvailableQuantity(e, (field, value) => setFieldValue(field, value, false));
                        }}
                        disabled={!values.fromBranchId}
                      />
                      <CustomInput
                        type="select"
                        name="itemUnitId"
                        label="Item Unit"
                        placeholder="Select Item Unit"
                        value={values.itemUnitId}
                        onBlur={handleBlur}
                        errorMessage={errors.itemUnitId}
                        touched={touched.itemUnitId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectOptions={itemUnitOptions}
                        onChange={unitId => {
                          applyItemUnitStock(unitId, itemUnitOptions, setFieldValue);
                        }}
                        disabled={!values.fromWarehouseId}
                      />
                      <CustomInput
                        type="text"
                        name="fromQuantity"
                        label="Available Quantity"
                        placeholder="Available Quantity"
                        value={availableQuantity ? availableQuantity : 0}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        setFieldValue={setFieldValue}
                        disabled={true}
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="border rounded-full border-primary pt-2.5 pb-1.5 px-2.5">
                        <Icons.SwapOutlined className="text-xl text-primary" />
                      </div>
                    </div>
                    <div className="w-full space-y-2">
                      <CustomInput
                        type="date"
                        name="date"
                        label="Transfer Date"
                        placeholder="Select Date"
                        value={values.date ? values.date : null}
                        onBlur={handleBlur}
                        errorMessage={errors.date}
                        touched={touched.date}
                        setFieldValue={setFieldValue}
                        required={true}
                      />
                      <CustomInput
                        type="select"
                        name="toDivisionId"
                        label="To Division"
                        placeholder="Select Division"
                        value={values.toDivisionId}
                        onBlur={handleBlur}
                        errorMessage={errors.toDivisionId}
                        touched={touched.toDivisionId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={divisionSelectColumnHeader}
                        selectOptions={buildDivisionSelectOptions(divDrop)}
                        loading={divisionLoading}
                        onFocus={() => {
                          if (!isApicalledRefFilter.current.divisionDropdown) {
                            handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                          }
                        }}
                        onChange={e => {
                          setSelectedDivisionId(e || '');
                          setSelectedBranchId('');
                          setFieldValue('toBranchId', null, false);
                          setFieldValue('toWarehouseId', null, false);
                        }}
                      />
                      <CustomInput
                        type="select"
                        name="toBranchId"
                        label="To Branch"
                        placeholder="Select Branch"
                        value={values.toBranchId}
                        onBlur={handleBlur}
                        errorMessage={errors.toBranchId}
                        touched={touched.toBranchId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={branchSelectColumnHeader}
                        selectOptions={buildBranchSelectOptions(branchDrop)}
                        loading={branchLoading}
                        onChange={e => {
                          setSelectedBranchId(e || '');
                          setFieldValue('toWarehouseId', null, false);
                        }}
                        disabled={!values.toDivisionId}
                      />
                      <CustomInput
                        type="select"
                        name="toWarehouseId"
                        label="To Warehouse"
                        placeholder="Select Warehouse"
                        value={values.toWarehouseId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.toWarehouseId}
                        touched={touched.toWarehouseId}
                        setFieldValue={setFieldValue}
                        required={true}
                        selectVariant="twoColumn"
                        columnSelectHeader={warehouseSelectColumnHeader}
                        selectOptions={buildWarehouseSelectOptions((warehouseDrop || []).filter(warehouse => warehouse?.id !== values?.fromWarehouseId))}
                        loading={itemWarehouseDropLoading}
                        disabled={!values.toBranchId}
                      />
                      <CustomInput
                        type="number"
                        name="quantity"
                        label="Transfer Quantity"
                        placeholder="Enter Quantity"
                        value={values.quantity}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.quantity}
                        touched={touched.quantity}
                        setFieldValue={setFieldValue}
                        required={true}
                        disabled={!values.itemUnitId}
                      />
                      <CustomInput
                        type="textarea"
                        name="notes"
                        label="Transfer Notes"
                        placeholder="Enter Transfer Note"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.notes}
                        touched={touched.notes}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center space-x-4 pt-7">
                    <CustomButton className="px-7 py-3" text="Cancel" type="default" disabled={loading} onClick={handleCloseModal} />
                    <CustomButton
                      className="px-7 py-3"
                      text="Transfer"
                      type="primary"
                      loading={loading}
                      style={{ minWidth: 100 }}
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
                  </div>
                </CustomForm>
              </div>
            </CustomModal>
          );
        }}
      </Formik>
    </div>
  );
};

export default AddTransferRequest;
