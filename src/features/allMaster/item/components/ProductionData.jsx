import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { FieldArray, Formik, yupToFormErrors } from 'formik';
import { Modal } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import ShowErrorsOnParentSubmit from '@/components/forms/ShowErrorsOnParentSubmit';

// Extras
import Icons from 'assets/icons/icon';
import { useItemMaster, addProductionData, productionDataValidateSchema, productionDataDrawerValidateSchema } from '@/features/allMaster/item';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import { buildRecipeSelectOptions, recipeSelectColumnHeader } from '@/utils/tableSelectDropdown/recipeSelectDropdown';
import { PRODUCTION_MODULE_METHOD } from '@/utils/constants';
import { resolveLineUnitSelection, resolveUnitRefId } from '@/utils/itemLineUnit';

const findDropItem = (items, itemId) => (items || []).find(option => String(option?._id || option?.id) === String(itemId || ''));

const defaultItemUnitId = (items, itemId) => resolveLineUnitSelection({}, findDropItem(items, itemId)).itemUnitId || null;

const refId = value => {
  if (!value) return null;
  if (typeof value === 'object') return value._id || value.id || null;
  return value;
};

const emptyRawMaterial = () => ({
  itemGroup: null,
  item: null,
  itemUnitId: null,
  qtyPerItem: '',
  reject: false,
  return: false,
});

const mapRawMaterial = row => ({
  itemGroup: refId(row?.itemGroup),
  item: refId(row?.item),
  itemUnitId: resolveUnitRefId(row?.itemUnitId),
  qtyPerItem: row?.qtyPerItem ?? '',
  reject: Boolean(row?.reject),
  return: Boolean(row?.return),
});

const mapSavedProcessBased = processBased =>
  (processBased || []).map(entry => ({
    processId: refId(entry?.processId),
    processName: entry?.processName || entry?.processId?.name || '',
    processCode: entry?.processCode || (typeof entry?.processId === 'object' ? entry.processId?.processId : '') || '',
    rawMaterials: (entry?.rawMaterials || []).map(mapRawMaterial),
  }));

const buildProcessBasedFromRecipe = (recipe, savedProcessBased = []) => {
  const savedById = new Map((savedProcessBased || []).map(entry => [String(refId(entry?.processId) || ''), entry]).filter(([id]) => id));

  return (recipe?.processes || []).map(process => {
    const saved = savedById.get(String(process._id));
    return {
      processId: process._id,
      processName: process.name || '',
      processCode: process.processId || '',
      rawMaterials: (saved?.rawMaterials || []).map(mapRawMaterial),
    };
  });
};

const isStartedRawMaterial = row => Boolean(row?.itemGroup || row?.item || (row?.qtyPerItem !== '' && row?.qtyPerItem != null));

const validateProductionData = schema => values => {
  try {
    schema.validateSync(values, {
      abortEarly: false,
      context: { productionManageMethod: values.productionManageMethod },
    });
  } catch (error) {
    return yupToFormErrors(error);
  }
};

const FillMissingItemUnits = ({ bomBased, scrapRows, processBased, allItemDrop, setFieldValue }) => {
  useEffect(() => {
    (bomBased || []).forEach((row, index) => {
      if (!row?.item || resolveUnitRefId(row.itemUnitId)) return;
      const unitId = defaultItemUnitId(allItemDrop, row.item);
      if (unitId) setFieldValue(`bomBased[${index}].itemUnitId`, unitId, false);
    });

    (scrapRows || []).forEach((row, index) => {
      const itemId = row?.scrapItemName?._id || row?.scrapItemName;
      if (!itemId || resolveUnitRefId(row.itemUnitId)) return;
      const unitId = defaultItemUnitId(allItemDrop, itemId);
      if (unitId) setFieldValue(`productionScrapOutInventory[${index}].itemUnitId`, unitId, false);
    });

    (processBased || []).forEach((process, processIndex) => {
      (process?.rawMaterials || []).forEach((row, index) => {
        if (!row?.item || resolveUnitRefId(row.itemUnitId)) return;
        const unitId = defaultItemUnitId(allItemDrop, row.item);
        if (unitId) setFieldValue(`processBased[${processIndex}].rawMaterials[${index}].itemUnitId`, unitId, false);
      });
    });
  }, [allItemDrop, bomBased, scrapRows, processBased, setFieldValue]);

  return null;
};

const SyncProcessBasedFromRecipe = ({ recipeDrop, productionManageMethod, selectProcessRecipe, processBased, setFieldValue }) => {
  useEffect(() => {
    if (productionManageMethod !== PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) return;
    const recipeId = selectProcessRecipe?._id || selectProcessRecipe;
    if (!recipeId) return;
    const recipe = (recipeDrop || []).find(item => String(item._id) === String(recipeId));
    if (!recipe?.processes) return;

    const next = buildProcessBasedFromRecipe(recipe, processBased);
    const currentKey = (processBased || []).map(row => `${row.processId || ''}:${row.processName || ''}:${row.processCode || ''}`).join('|');
    const nextKey = next.map(row => `${row.processId || ''}:${row.processName || ''}:${row.processCode || ''}`).join('|');
    if (currentKey !== nextKey) {
      setFieldValue('processBased', next, false);
    }
  }, [recipeDrop, productionManageMethod, selectProcessRecipe, processBased, setFieldValue]);

  return null;
};

const handleQtyChange = (setFieldValue, name, rawValue) => {
  if (rawValue !== '' && !/^\d*\.?\d{0,3}$/.test(rawValue)) return;
  setFieldValue(name, rawValue);
};

const RawMaterialRows = ({ name, rows, rowErrors, rowTouched, setFieldValue, handleBlur, handleChange, itemGroupDrop, allItemDrop, getItemOptions }) => (
  <FieldArray name={name}>
    {({ push, remove }) => (
      <>
        <div className="grid grid-cols-12 gap-x-7 pt-2">
          <div className="col-span-2">Item Group</div>
          <div className="col-span-3">Item</div>
          <div className="col-span-2">Item Unit</div>
          <div className="col-span-2">Qty / Item</div>
          <div className="text-center">Reject</div>
          <div className="text-center">Return</div>
          <div></div>
        </div>
        {(rows || []).map((row, index) => (
          <div key={index} className="grid grid-cols-12 gap-x-7 pt-4 items-start">
            <div className="col-span-2">
              <CustomInput
                type="select"
                name={`${name}[${index}].itemGroup`}
                placeholder="Select Item Group"
                value={row.itemGroup}
                onChange={selectedGroupId => {
                  setFieldValue(`${name}[${index}].itemGroup`, selectedGroupId);
                  setFieldValue(`${name}[${index}].item`, null);
                  setFieldValue(`${name}[${index}].itemUnitId`, null);
                }}
                onBlur={handleBlur}
                errorMessage={rowErrors?.[index]?.itemGroup}
                touched={rowTouched?.[index]?.itemGroup}
                setFieldValue={setFieldValue}
                popupMatchSelectWidth={false}
                dropdownStyle={{ minWidth: 520, width: 'min(520px, 70vw)' }}
                selectVariant="twoColumn"
                columnSelectHeader={itemGroupSelectColumnHeader}
                selectOptions={buildItemGroupSelectOptions(itemGroupDrop)}
              />
            </div>
            <div className="col-span-3">
              <CustomInput
                type="select"
                name={`${name}[${index}].item`}
                placeholder="Select Item"
                value={row.item}
                onChange={selectedItemId => {
                  setFieldValue(`${name}[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(allItemDrop, selectedItemId) : null);
                }}
                onBlur={handleBlur}
                errorMessage={rowErrors?.[index]?.item}
                touched={rowTouched?.[index]?.item}
                setFieldValue={setFieldValue}
                popupMatchSelectWidth={false}
                dropdownStyle={{ minWidth: 520, width: 'min(520px, 70vw)' }}
                selectOptions={getItemOptions(row.itemGroup, index, rows)}
                selectVariant="twoColumn"
                columnSelectHeader={itemSelectColumnHeader}
              />
            </div>
            <div className="col-span-2">
              <ItemUnitSelect
                name={`${name}[${index}].itemUnitId`}
                itemId={row.item}
                itemUnitId={row.itemUnitId}
                itemsDrop={allItemDrop}
                errorMessage={rowErrors?.[index]?.itemUnitId}
                touched={rowTouched?.[index]?.itemUnitId}
                setFieldValue={setFieldValue}
                handleBlur={handleBlur}
              />
            </div>
            <div className="col-span-2">
              <CustomInput
                type="text"
                name={`${name}[${index}].qtyPerItem`}
                placeholder="Enter Qty / Item"
                value={row.qtyPerItem}
                onChange={event => handleQtyChange(setFieldValue, `${name}[${index}].qtyPerItem`, event.target.value)}
                onBlur={handleBlur}
                errorMessage={rowErrors?.[index]?.qtyPerItem}
                touched={rowTouched?.[index]?.qtyPerItem}
              />
            </div>
            <div className="text-center">
              <CustomInput
                type="checkbox"
                name={`${name}[${index}].reject`}
                value={row.reject ?? false}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={rowErrors?.[index]?.reject}
                touched={rowTouched?.[index]?.reject}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="text-center">
              <CustomInput
                type="checkbox"
                name={`${name}[${index}].return`}
                value={row.return ?? false}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={rowErrors?.[index]?.return}
                touched={rowTouched?.[index]?.return}
                setFieldValue={setFieldValue}
              />
            </div>
            <div>
              <Icons.DeleteOutlined className="text-red-500 text-xl cursor-pointer w-max py-1.5" onClick={() => remove(index)} />
            </div>
          </div>
        ))}
        <div className="mt-4">
          <CustomButton type="primary" className="!px-4 !py-1.5 flex items-center gap-1" onClick={() => push(emptyRawMaterial())}>
            <Icons.PlusOutlined className="text-sm" />
            Add Raw Material
          </CustomButton>
        </div>
      </>
    )}
  </FieldArray>
);

const ItemUnitSelect = ({ name, label, itemId, itemUnitId, itemsDrop, errorMessage, touched, setFieldValue, handleBlur }) => {
  const unitSelection = resolveLineUnitSelection({ itemUnitId }, findDropItem(itemsDrop, itemId));
  const selectOptions = unitSelection.options.map(option => ({ label: option.label, value: option.value }));

  return (
    <CustomInput
      type="select"
      name={name}
      label={label}
      placeholder="Select Item Unit"
      value={unitSelection.option?.value ?? null}
      selectOptions={selectOptions}
      setFieldValue={setFieldValue}
      onChange={selectedValue => {
        const option = unitSelection.options.find(unitOption => String(unitOption.value) === String(selectedValue));
        setFieldValue(name, option?.itemUnitId || null);
      }}
      onBlur={handleBlur}
      errorMessage={errorMessage}
      touched={touched}
      disabled={!itemId || selectOptions.length <= 1}
    />
  );
};

const ProductionData = ({ item, syncToStore = true, onSave, innerRef, inDrawer = false, parentSubmitCount = 0 }) => {
  const dispatch = useDispatch();
  const productionData = item?.productionData;
  const { recipeDrop, allItemDrop, allItemDropLoading, itemDropWithBom, getAllItemDrop, getRecipeDrop, getItemDropWithBom } = useItemMaster();
  const { itemGroupDrop, getItemGroupDropdown } = useItemGroup();
  const prevFormValuesRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getRecipeDrop(payload);
    getAllItemDrop({ ...payload, isService: false, trackInventory: true });
    getItemDropWithBom(payload);

    if (inDrawer) {
      getItemGroupDropdown(payload);
    }
    return () => controller.abort();
  }, [dispatch, getRecipeDrop, getAllItemDrop, getItemDropWithBom, getItemGroupDropdown, inDrawer]);

  const getItemsForRow = (rowItemGroupId, rowIndex, bomBasedValues) => {
    let filteredItems = allItemDrop || [];
    const currentRowItemId = bomBasedValues[rowIndex]?.item;

    if (rowItemGroupId) {
      filteredItems = filteredItems.filter(item => item?.itemGroup === rowItemGroupId || item?.itemGroup?._id === rowItemGroupId || item?._id === currentRowItemId);
    }

    filteredItems = filteredItems.filter(option => option._id === currentRowItemId || !bomBasedValues.some((item, i) => item.item === option._id && i !== rowIndex));

    return filteredItems;
  };

  const initialValues = {
    productionManageMethod: productionData?.productionManageMethod ?? null,
    selectProcessRecipe: productionData?.selectProcessRecipe ?? null,
    productionScrapOutInventory:
      productionData?.productionScrapOutInventory?.length > 0
        ? productionData.productionScrapOutInventory.map(item => ({
            ...item,
            scrapItemName: item?.scrapItemName?._id || null,
            itemUnitId: resolveUnitRefId(item?.itemUnitId),
          }))
        : [],
    bomBased:
      productionData?.bomBased?.length > 0
        ? productionData.bomBased.map(item => ({
            ...item,
            itemGroup: item.itemGroup?._id || item.itemGroup || null,
            item: item.item?._id || item.item || null,
            itemUnitId: resolveUnitRefId(item?.itemUnitId),
            originalItemId: item.item?._id || item.item || null,
            applyBomChange: false,
          }))
        : [],
    copyBom: null,
    processBased: mapSavedProcessBased(productionData?.processBased),
  };

  const buildBomBasedPayload = bomBased =>
    (bomBased || [])
      .filter(row => row?.item)
      .map(({ originalItemId, applyBomChange, ...rest }) => {
        const row = {
          ...rest,
          itemUnitId: resolveUnitRefId(rest.itemUnitId),
        };
        if (applyBomChange && originalItemId && originalItemId !== rest.item) {
          return { ...row, oldItemId: originalItemId };
        }
        return row;
      });

  const buildSelectProcessRecipePayload = recipe => recipe?._id || recipe || null;

  const buildProductionScrapOutInventoryPayload = scrapRows =>
    (scrapRows || [])
      .filter(row => row?.scrapItemName?._id || row?.scrapItemName)
      .map(row => ({
        scrapItemName: row.scrapItemName?._id || row.scrapItemName,
        itemUnitId: resolveUnitRefId(row.itemUnitId),
        qtyPerItem: Number(row.qtyPerItem),
      }));

  const buildRawMaterialPayload = (rows, { forSave = false } = {}) =>
    (rows || [])
      .filter(row => (forSave ? row?.item : isStartedRawMaterial(row)))
      .map(row => ({
        itemGroup: refId(row.itemGroup),
        item: refId(row.item),
        itemUnitId: resolveUnitRefId(row.itemUnitId),
        qtyPerItem: row.qtyPerItem,
        reject: row.reject ?? false,
        return: row.return ?? false,
      }));

  const buildProcessBasedPayload = (processBased, options) =>
    (processBased || [])
      .map(entry => ({
        processId: refId(entry?.processId),
        rawMaterials: buildRawMaterialPayload(entry?.rawMaterials, options),
      }))
      .filter(entry => entry.processId);

  const buildProductionDataPayload = (values, { forSave = false } = {}) => {
    const payload = {};

    if (values.productionManageMethod) payload.productionManageMethod = values.productionManageMethod;

    if (values.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) {
      payload.selectProcessRecipe = forSave ? buildSelectProcessRecipePayload(values.selectProcessRecipe) : values.selectProcessRecipe;
      const processBased = buildProcessBasedPayload(values.processBased, { forSave });
      if (processBased.length > 0) payload.processBased = processBased;
    } else if (values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED) {
      const bomBased = buildBomBasedPayload(values.bomBased);
      if (bomBased.length > 0) payload.bomBased = bomBased;

      const scrapRows = forSave ? buildProductionScrapOutInventoryPayload(values.productionScrapOutInventory) : values.productionScrapOutInventory;
      if (scrapRows?.length > 0) payload.productionScrapOutInventory = scrapRows;
    }

    return payload;
  };

  const submitProductionData = async values => {
    const productionData = buildProductionDataPayload(values, { forSave: Boolean(onSave) });

    if (onSave) {
      await onSave(productionData);
    } else {
      await dispatch(addProductionData(productionData));
    }
  };

  const onFinish = values => {
    const hasGlobalBomChange = values.bomBased?.some(b => b.applyBomChange && b.originalItemId && b.originalItemId !== b.item);

    if (hasGlobalBomChange) {
      Modal.confirm({
        title: 'Apply BOM change to all items?',
        content: 'This will replace the old component with the new one in every other item that shares this BOM component. This action cannot be undone.',
        okText: 'Yes, Apply to All',
        cancelText: 'Cancel',
        okButtonProps: { danger: true },
        onOk: () => submitProductionData(values),
      });
      return;
    }

    submitProductionData(values);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const findUserRecipeId = (selectedRecipeId, recipeDrop) => {
    const selectedUser = (recipeDrop || []).find(item => String(item._id) === String(selectedRecipeId || ''));
    return selectedUser?.recipeId || '';
  };

  const dispatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        dispatch(addProductionData(buildProductionDataPayload(values)));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, []);

  return (
    <div className={inDrawer ? 'pb-4 relative' : 'pb-28 relative'}>
      <Formik
        innerRef={innerRef}
        initialValues={initialValues}
        validate={validateProductionData(onSave ? productionDataDrawerValidateSchema : productionDataValidateSchema)}
        onSubmit={onFinish}
        enableReinitialize
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, validateForm, setTouched }) => {
          if (syncToStore) {
            dispatchOnFormChanges(values);
          }
          const selectedRecipeId = values.selectProcessRecipe?._id || (typeof values.selectProcessRecipe === 'string' ? values.selectProcessRecipe : null);
          const selectedRecipe = (recipeDrop || []).find(item => String(item._id) === String(selectedRecipeId || ''));
          const recipeHasNoProcesses = Boolean(selectedRecipe) && !(selectedRecipe.processes || []).length;
          return (
            <CustomForm name="customer-address" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <ShowErrorsOnParentSubmit parentSubmitCount={parentSubmitCount} validateForm={validateForm} setTouched={setTouched} />
              <FillMissingItemUnits
                bomBased={values.bomBased}
                scrapRows={values.productionScrapOutInventory}
                processBased={values.processBased}
                allItemDrop={allItemDrop}
                setFieldValue={setFieldValue}
              />
              <SyncProcessBasedFromRecipe
                recipeDrop={recipeDrop}
                productionManageMethod={values.productionManageMethod}
                selectProcessRecipe={values.selectProcessRecipe}
                processBased={values.processBased}
                setFieldValue={setFieldValue}
              />
              <div className={inDrawer ? '' : ''}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="select"
                    name="productionManageMethod"
                    label="Production Manage Method"
                    placeholder="Select Method"
                    value={values.productionManageMethod}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    allowClear
                    errorMessage={errors.productionManageMethod}
                    touched={touched.productionManageMethod}
                    setFieldValue={setFieldValue}
                    selectOptions={[
                      { value: PRODUCTION_MODULE_METHOD.PROCESS_ROUTE, label: 'PROCESS ROUTE' },
                      { value: PRODUCTION_MODULE_METHOD.BOM_BASED, label: 'CREATE BOM' },
                    ]}
                    required
                  />
                  {values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
                    <CustomInput
                      type="select"
                      name="copyBom"
                      label="Copy BOM From Item"
                      placeholder="Select Item"
                      value={values.copyBom}
                      onChange={e => {
                        if (e) {
                          const findSelectedItem = itemDropWithBom?.filter(x => x?._id === e);

                          if (findSelectedItem?.[0]?.productionData?.bomBased) {
                            setFieldValue(
                              'bomBased',
                              findSelectedItem[0].productionData.bomBased.map(row => {
                                const itemId = row.item?._id || row.item || null;
                                return {
                                  ...row,
                                  item: itemId,
                                  itemGroup: row.itemGroup?._id || row.itemGroup || null,
                                  itemUnitId: resolveUnitRefId(row.itemUnitId) || defaultItemUnitId(allItemDrop, itemId),
                                  originalItemId: itemId,
                                  applyBomChange: false,
                                };
                              })
                            );
                          }
                        }
                      }}
                      onBlur={handleBlur}
                      allowClear
                      errorMessage={errors.copyBom}
                      touched={touched.copyBom}
                      setFieldValue={setFieldValue}
                      popupMatchSelectWidth={false}
                      dropdownStyle={{ minWidth: 420, width: 'min(420px, 70vw)' }}
                      selectVariant="twoColumn"
                      columnSelectHeader={itemSelectColumnHeader}
                      selectOptions={buildItemFilterSelectOptions(itemDropWithBom)}
                    />
                  )}
                </div>
                {values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
                  <div className="border rounded p-5 mt-7">
                    <div className="pb-4 text-base font-medium">Create BOM</div>
                    {typeof errors.bomBased === 'string' && touched.bomBased && <p className="text-red-500 text-sm pb-2">{errors.bomBased}</p>}
                    <div className="grid grid-cols-12 gap-x-7 pt-2">
                      <div className="col-span-2">Item Group</div>
                      <div className="col-span-3">Item</div>
                      <div className="col-span-2">Item Unit</div>
                      <div className="col-span-2">Qty / Item</div>
                      <div className="text-center">Reject</div>
                      <div className="text-center">Return</div>
                      <div></div>
                    </div>

                    <FieldArray name="bomBased">
                      {({ push, remove }) => (
                        <>
                          {values?.bomBased.map((_, index) => (
                            <div key={index} className="grid grid-cols-12 gap-x-7 pt-4 items-start">
                              <div className="col-span-2">
                                <CustomInput
                                  type="select"
                                  name={`bomBased[${index}].itemGroup`}
                                  placeholder="Select Item Group"
                                  value={values.bomBased[index].itemGroup}
                                  onChange={e => {
                                    setFieldValue(`bomBased[${index}].itemGroup`, e);
                                    setFieldValue(`bomBased[${index}].item`, null);
                                    setFieldValue(`bomBased[${index}].itemUnitId`, null);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.bomBased?.[index]?.itemGroup}
                                  touched={touched.bomBased?.[index]?.itemGroup}
                                  setFieldValue={setFieldValue}
                                  popupMatchSelectWidth={false}
                                  dropdownStyle={{ minWidth: 520, width: 'min(520px, 70vw)' }}
                                  selectVariant="twoColumn"
                                  columnSelectHeader={itemGroupSelectColumnHeader}
                                  selectOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                                />
                              </div>

                              <div className="col-span-3">
                                <CustomInput
                                  type="select"
                                  name={`bomBased[${index}].item`}
                                  placeholder="Select Item"
                                  value={values.bomBased[index].item}
                                  onChange={selectedItemId => {
                                    setFieldValue(`bomBased[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(allItemDrop, selectedItemId) : null);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.bomBased?.[index]?.item}
                                  touched={touched.bomBased?.[index]?.item}
                                  setFieldValue={setFieldValue}
                                  popupMatchSelectWidth={false}
                                  dropdownStyle={{ minWidth: 520, width: 'min(520px, 70vw)' }}
                                  selectOptions={buildItemFilterSelectOptions(getItemsForRow(values.bomBased[index].itemGroup, index, values.bomBased))}
                                  selectVariant="twoColumn"
                                  columnSelectHeader={itemSelectColumnHeader}
                                />
                                {values.bomBased[index].originalItemId && values.bomBased[index].item && values.bomBased[index].originalItemId !== values.bomBased[index].item && (
                                  <div className="mt-2">
                                    <CustomInput
                                      type="checkbox"
                                      name={`bomBased[${index}].applyBomChange`}
                                      CheckboxName="Replace this item wherever it appears in the BOM"
                                      value={values.bomBased[index].applyBomChange}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      setFieldValue={setFieldValue}
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="col-span-2">
                                <ItemUnitSelect
                                  name={`bomBased[${index}].itemUnitId`}
                                  itemId={values.bomBased[index].item}
                                  itemUnitId={values.bomBased[index].itemUnitId}
                                  itemsDrop={allItemDrop}
                                  errorMessage={errors.bomBased?.[index]?.itemUnitId}
                                  touched={touched.bomBased?.[index]?.itemUnitId}
                                  setFieldValue={setFieldValue}
                                  handleBlur={handleBlur}
                                />
                              </div>

                              <div className="col-span-2 text-center">
                                <CustomInput
                                  type="text"
                                  name={`bomBased[${index}].qtyPerItem`}
                                  placeholder="Enter Qty / Item"
                                  value={values.bomBased[index].qtyPerItem}
                                  onChange={e => {
                                    const newValue = e.target.value;
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`bomBased[${index}].qtyPerItem`, newValue);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.bomBased?.[index]?.qtyPerItem}
                                  touched={touched.bomBased?.[index]?.qtyPerItem}
                                />
                              </div>

                              <div className="text-center">
                                <CustomInput
                                  type="checkbox"
                                  name={`bomBased[${index}].reject`}
                                  value={values.bomBased[index].reject ?? false}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  errorMessage={errors.bomBased?.[index]?.reject}
                                  touched={touched.bomBased?.[index]?.reject}
                                  setFieldValue={setFieldValue}
                                />
                              </div>

                              <div className="text-center">
                                <CustomInput
                                  type="checkbox"
                                  name={`bomBased[${index}].return`}
                                  value={values.bomBased[index].return ?? false}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  errorMessage={errors.bomBased?.[index]?.return}
                                  touched={touched.bomBased?.[index]?.return}
                                  setFieldValue={setFieldValue}
                                />
                              </div>

                              <div>
                                <Icons.DeleteOutlined className="text-red-500 text-xl cursor-pointer w-max py-1.5" onClick={() => remove(index)} />
                              </div>
                            </div>
                          ))}
                          <div className="mt-4">
                            <CustomButton
                              type="primary"
                              className="!px-4 !py-1.5 flex items-center gap-1"
                              onClick={() => push({ itemGroup: null, item: null, itemUnitId: null, qtyPerItem: '', reject: false, return: false })}
                            >
                              <Icons.PlusOutlined className="text-sm" />
                              Add
                            </CustomButton>
                          </div>
                        </>
                      )}
                    </FieldArray>
                  </div>
                )}
                {values.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE && (
                  <>
                    <div className="border rounded p-5 mt-7">
                      <div className="pb-4 text-base font-medium">Process Route Based</div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="select"
                          name="selectProcessRecipe"
                          label="Select Process Recipe"
                          placeholder="Select Recipe"
                          value={selectedRecipeId}
                          onChange={selectedRecipeId => {
                            const recipe = (recipeDrop || []).find(item => String(item._id) === String(selectedRecipeId || ''));
                            if (!recipe) {
                              setFieldValue('selectProcessRecipe', null);
                              setFieldValue('recipeId', '');
                              setFieldValue('processBased', []);
                              return;
                            }
                            setFieldValue('selectProcessRecipe', { _id: recipe._id, name: recipe.name });
                            setFieldValue('recipeId', recipe.recipeId || '');
                            setFieldValue('processBased', buildProcessBasedFromRecipe(recipe, values.processBased));
                          }}
                          onBlur={handleBlur}
                          errorMessage={errors.selectProcessRecipe}
                          touched={touched.selectProcessRecipe}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={recipeSelectColumnHeader}
                          selectOptions={buildRecipeSelectOptions(recipeDrop)}
                          required
                        />
                        <CustomInput
                          type="text"
                          name="recipeId"
                          label="Recipe No"
                          placeholder="Enter Recipe No"
                          value={values.recipeId || findUserRecipeId(selectedRecipeId, recipeDrop)}
                          readOnly
                          disabled
                        />
                      </div>
                    </div>
                    {(values.processBased || []).map((process, processIndex) => (
                      <div key={process.processId || processIndex} className="border rounded p-5 mt-4">
                        <div className="pb-1 text-base font-medium">
                          {process.processName || 'Process'}
                          {process.processCode ? <span className="ml-2 text-sm font-normal text-gray-500">{process.processCode}</span> : null}
                        </div>
                        <div className="pb-2 text-sm text-gray-600">Raw Materials</div>
                        <RawMaterialRows
                          name={`processBased[${processIndex}].rawMaterials`}
                          rows={process.rawMaterials || []}
                          rowErrors={errors.processBased?.[processIndex]?.rawMaterials}
                          rowTouched={touched.processBased?.[processIndex]?.rawMaterials}
                          setFieldValue={setFieldValue}
                          handleBlur={handleBlur}
                          handleChange={handleChange}
                          itemGroupDrop={itemGroupDrop}
                          allItemDrop={allItemDrop}
                          getItemOptions={(itemGroupId, rowIndex, materialRows) => buildItemFilterSelectOptions(getItemsForRow(itemGroupId, rowIndex, materialRows))}
                        />
                      </div>
                    ))}
                    {recipeHasNoProcesses ? <p className="text-sm text-gray-500 mt-4">This recipe has no processes.</p> : null}
                  </>
                )}
                {values.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED && (
                  <div className="mt-7">
                    <FieldArray name="productionScrapOutInventory">
                      {({ push, remove }) => (
                        <div>
                          <div className="pb-2 text-base font-medium">Production Scrap Out Inventory</div>

                          {values.productionScrapOutInventory.map((_, index) => (
                            <div key={index} className="grid md:grid-cols-2 lg:grid-cols-4 items-end gap-x-7 mt-2">
                              <div>
                                <CustomInput
                                  type="select"
                                  name={`productionScrapOutInventory[${index}].scrapItemName`}
                                  label="Scrap Item Name"
                                  placeholder="Select Scrap"
                                  value={values.productionScrapOutInventory[index].scrapItemName}
                                  onChange={selectedItemId => {
                                    setFieldValue(`productionScrapOutInventory[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(allItemDrop, selectedItemId) : null);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.productionScrapOutInventory?.[index]?.scrapItemName}
                                  touched={touched.productionScrapOutInventory?.[index]?.scrapItemName}
                                  setFieldValue={setFieldValue}
                                  popupMatchSelectWidth={false}
                                  dropdownStyle={{ minWidth: 520, width: 'min(520px, 70vw)' }}
                                  selectVariant="twoColumn"
                                  columnSelectHeader={itemSelectColumnHeader}
                                  selectOptions={buildItemFilterSelectOptions(
                                    (allItemDrop || []).filter(option => !values.productionScrapOutInventory.some((item, i) => item.scrapItemName === option._id && i !== index))
                                  )}
                                  loading={allItemDropLoading}
                                  allowClear
                                />
                              </div>
                              <ItemUnitSelect
                                name={`productionScrapOutInventory[${index}].itemUnitId`}
                                label="Item Unit"
                                itemId={values.productionScrapOutInventory[index].scrapItemName?._id || values.productionScrapOutInventory[index].scrapItemName}
                                itemUnitId={values.productionScrapOutInventory[index].itemUnitId}
                                itemsDrop={allItemDrop}
                                errorMessage={errors.productionScrapOutInventory?.[index]?.itemUnitId}
                                touched={touched.productionScrapOutInventory?.[index]?.itemUnitId}
                                setFieldValue={setFieldValue}
                                handleBlur={handleBlur}
                              />
                              <div>
                                <CustomInput
                                  type="text"
                                  name={`productionScrapOutInventory[${index}].qtyPerItem`}
                                  label="Qty / Item"
                                  placeholder="Enter Qty / Item"
                                  value={values.productionScrapOutInventory[index].qtyPerItem}
                                  onChange={e => {
                                    const newValue = e.target.value;
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`productionScrapOutInventory[${index}].qtyPerItem`, newValue);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.productionScrapOutInventory?.[index]?.qtyPerItem}
                                  touched={touched.productionScrapOutInventory?.[index]?.qtyPerItem}
                                />
                              </div>

                              <div className="flex gap-2">
                                {values?.productionScrapOutInventory?.length > 1 && <Icons.DeleteOutlined className="text-red-500 text-xl cursor-pointer w-max py-1.5" onClick={() => remove(index)} />}
                              </div>
                            </div>
                          ))}
                          <div className="mt-3">
                            <CustomButton type="primary" className="!px-4 !py-1.5 flex items-center gap-1" onClick={() => push({ scrapItemName: '', itemUnitId: null, qtyPerItem: '' })}>
                              <Icons.PlusOutlined className="text-sm" />
                              Add Scrap
                            </CustomButton>
                          </div>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                )}
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </div>
  );
};

export default ProductionData;
