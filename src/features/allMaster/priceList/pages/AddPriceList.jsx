import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik, FieldArray } from 'formik';

// Components
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import { Tooltip } from '@/components/AntDComponent';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useItemMaster } from '@/features/allMaster/item';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useCurrency } from '@/features/setting/currency/useCurrency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

// Extras
import { usePriceList, priceListValidateSchema } from '@/features/allMaster/priceList';
import { buildFormItems, emptyPriceListItem, findItemMaster, itemGroupIdFromMaster, patchItemRow, toNetPrice, unitsFromMaster } from '@/features/allMaster/priceList/priceList.utils';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { errorsToTouched } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import { MODULE_NAMES } from '@/utils/constants';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const AddPriceList = () => {
  const { priceListId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, submitLoading, priceList, createPriceList, updatePriceList, getPriceListById, resetPriceList } = usePriceList();
  const { getItemDrop, itemDropLoading, allItemDropLoading } = useItemMaster();
  const { itemGroupDrop, getItemGroupDropdown, resetItemGroupDrop, itemGroupDropLoading } = useItemGroup();
  const { allItemDrop, getAllItemDrop } = useModulePermissions(RESOURCES.PRICE_LIST);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const { currencies, loading: currencyLoading, getCurrencies } = useCurrency();
  const { currencyId: baseCurrencyId } = useCompanyCurrency();
  const [itemsByGroup, setItemsByGroup] = useState({});
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [priceListConfig, setPriceListConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const formikRef = useRef();
  const scrollToError = useScrollToError();

  const currencyOptions = useMemo(
    () =>
      (currencies || []).map(currency => ({
        value: currency._id,
        label: `${currency.symbol} - ${currency.name}`,
      })),
    [currencies]
  );

  const initialValues = useMemo(
    () => ({
      priceListCode: priceList?.priceListCode || '',
      priceListName: priceList?.priceListName || '',
      items: buildFormItems(priceList?.items, itemsByGroup, allItemDrop),
      remarks: priceList?.remarks || '',
      currency: priceList?.currency?._id || baseCurrencyId || '',
    }),
    [allItemDrop, baseCurrencyId, itemsByGroup, priceList]
  );

  const fieldsToIgnore = ['priceListCode'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    getCurrencies({ pagination: false });
  }, [getCurrencies]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getItemGroupDropdown(payload);
    getAllItemDrop(payload);
    return () => {
      resetItemGroupDrop();
      controller.abort();
    };
  }, [dispatch, getItemGroupDropdown, getAllItemDrop, resetItemGroupDrop]);

  const fetchItemsForGroup = useCallback(
    async groupId => {
      if (!groupId) return;
      const capturedGroupId = groupId;
      const response = await getItemDrop({ itemGroup: capturedGroupId });
      const items = response?.payload?.data || [];
      setItemsByGroup(prev => ({ ...prev, [capturedGroupId]: items }));
    },
    [getItemDrop]
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadPriceList = async () => {
      if (!priceListId) {
        resetPriceList();
        return;
      }

      const result = await getPriceListById({ priceListId, signal: controller.signal });
      if (controller.signal.aborted || result.meta?.requestStatus !== 'fulfilled') return;

      const items = result.payload?.data?.items || [];
      const uniqueGroupIds = [...new Set(items.map(item => item.itemGroup?.id).filter(Boolean))];
      uniqueGroupIds.forEach(groupId => fetchItemsForGroup(groupId));
    };

    loadPriceList();

    return () => {
      resetPriceList();
      controller.abort();
    };
  }, [priceListId]);

  useEffect(() => {
    if (moduleConfig) {
      setPriceListConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (!priceListId && priceListConfig) {
      const newPriceListCode = priceListConfig.autoGenerate ? `${priceListConfig.prefix}${priceListConfig.nextNumber}` : '';
      formikRef.current?.setFieldValue('priceListCode', newPriceListCode);
    }
  }, [priceListConfig, priceListId]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getModuleConfig({ ...payload, moduleName: MODULE_NAMES.PRICE_LIST });
    return () => {
      controller.abort();
    };
  }, [priceListId, getModuleConfig]);

  const onFinish = async values => {
    if (submitLoading) return;
    const priceData = {
      priceListName: values.priceListName,
      ...(!priceListId && { priceListCode: values.priceListCode }),
      items: values.items.map(item => ({
        itemGroup: item.itemGroup,
        itemId: item.itemId,
        unitPrices: [
          { itemUnitId: item.itemUnitId, netPrice: toNetPrice(item.netPrice) },
          ...(item.conversions || []).map(conversion => ({
            itemUnitId: conversion.itemUnitId,
            netPrice: toNetPrice(conversion.netPrice),
          })),
        ].filter(unitPrice => unitPrice.itemUnitId),
      })),
      remarks: values.remarks,
      currency: values.currency,
    };

    const result = priceListId ? await updatePriceList({ priceData, priceListId }) : await createPriceList(priceData);

    const saved = result?.payload?.data ?? result?.data;
    const targetId = priceListId || saved?.id || saved?._id;

    if (targetId) {
      navigateAfterSave(`/price-list/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const handleItemChange = (setFieldValue, index, fieldName, value) => {
    setFieldValue(fieldName, value);
  };

  const handleNetPriceChange = (setFieldValue, fieldName, value) => {
    const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    const nextValue =
      dotIndex === -1
        ? cleaned
        : `${cleaned.slice(0, dotIndex)}.${cleaned
            .slice(dotIndex + 1)
            .replace(/\./g, '')
            .slice(0, 3)}`;
    setFieldValue(fieldName, nextValue);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  if (priceListId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{priceListId ? 'Edit Price List' : 'Add Price List'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} enableReinitialize={true} initialValues={initialValues} validationSchema={priceListValidateSchema(priceListConfig?.autoGenerate)} onSubmit={onFinish}>
            {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
              updateFormValues(values);
              return (
                <CustomForm name="price-list" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Price list details</h3>
                      <div className="grid md:grid-cols-2 gap-x-7">
                        <CustomInput
                          id="price-list-code"
                          type="text"
                          label="Price List Code"
                          name="priceListCode"
                          placeholder="Enter Price List Code"
                          value={values.priceListCode}
                          onChange={e => handleItemChange(setFieldValue, null, 'priceListCode', e.target.value)}
                          onBlur={handleBlur}
                          errorMessage={errors.priceListCode}
                          touched={touched.priceListCode}
                          className="w-full p-2 border rounded"
                          setFieldValue={setFieldValue}
                          disabled={priceListConfig?.autoGenerate || priceListId}
                          suffix={
                            !priceListId && (
                              <Tooltip title="Configure Price List Code">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            )
                          }
                          required
                        />
                        <CustomInput
                          id="price-list-name"
                          type="text"
                          label={'Price List Name'}
                          name="priceListName"
                          placeholder="Enter Price List Name"
                          value={values.priceListName}
                          onChange={e => handleItemChange(setFieldValue, null, 'priceListName', e.target.value)}
                          onBlur={handleBlur}
                          errorMessage={errors.priceListName}
                          touched={touched.priceListName}
                          className="w-full p-2 border rounded"
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 mt-2 gap-x-7">
                        <CustomInput
                          type="textarea"
                          name="remarks"
                          label="Remarks"
                          placeholder="Enter Remarks"
                          value={values.remarks}
                          onChange={e => handleItemChange(setFieldValue, null, 'remarks', e.target.value)}
                          onBlur={handleBlur}
                          errorMessage={errors.remarks}
                          touched={touched.remarks}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          id="price-list-currency"
                          type="select"
                          name="currency"
                          label="Currency"
                          placeholder="Select Currency"
                          value={values.currency}
                          onChange={value => handleItemChange(setFieldValue, null, 'currency', value)}
                          onBlur={handleBlur}
                          errorMessage={errors.currency}
                          touched={touched.currency}
                          setFieldValue={setFieldValue}
                          selectOptions={currencyOptions}
                          loading={currencyLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Items</h3>
                      <fieldset>
                        <FieldArray name="items">
                          {({ push, remove }) => (
                            <div>
                              <div className="overflow-hidden rounded-md border border-gray-200">
                                <div className="price-list-item-grid border-b border-gray-200 bg-gray-50 px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    <span className="ant-form-item-required" />
                                    Item Group
                                  </div>
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    <span className="ant-form-item-required" />
                                    Item Name
                                  </div>
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    <span className="ant-form-item-required" />
                                    Item Unit
                                  </div>
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                    <span className="ant-form-item-required" />
                                    Net Price
                                  </div>
                                  <div />
                                </div>
                                {values.items.map((item, index) => (
                                  <div key={index} className={index > 0 ? 'border-t border-gray-200' : ''}>
                                    <div className="price-list-item-grid px-3 py-3">
                                      <CustomInput
                                        id={`items.${index}.itemGroup`}
                                        type="select"
                                        name={`items.${index}.itemGroup`}
                                        placeholder="Select Item Group"
                                        value={item.itemGroup}
                                        onChange={value => {
                                          setFieldValue(
                                            'items',
                                            patchItemRow(values.items, index, {
                                              itemGroup: value || null,
                                              itemId: null,
                                              itemUnitId: null,
                                              itemUnitName: '',
                                              netPrice: 0,
                                              conversions: [],
                                              savedUnitPrices: null,
                                              needsUnitHydration: false,
                                            })
                                          );
                                          fetchItemsForGroup(value);
                                        }}
                                        setFieldValue={setFieldValue}
                                        onBlur={handleBlur}
                                        errorMessage={errors.items?.[index]?.itemGroup}
                                        touched={touched.items?.[index]?.itemGroup}
                                        selectVariant="twoColumn"
                                        columnSelectHeader={itemGroupSelectColumnHeader}
                                        selectOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                                        loading={itemGroupDropLoading}
                                        aria-label={`Item ${index + 1} group`}
                                        allowClear
                                        required={true}
                                      />
                                      <CustomInput
                                        id={`items.${index}.itemId`}
                                        type="select"
                                        name={`items.${index}.itemId`}
                                        placeholder="Select Item"
                                        value={item.itemId}
                                        popupMatchSelectWidth={false}
                                        dropdownStyle={{ width: '50%', borderRadius: 0 }}
                                        onChange={value => {
                                          const master = findItemMaster(value, item.itemGroup, itemsByGroup, allItemDrop);
                                          const units = value && master ? unitsFromMaster(master) : { itemUnitId: null, itemUnitName: '', netPrice: 0, conversions: [] };
                                          const itemGroupId = value && master ? itemGroupIdFromMaster(master) : item.itemGroup;
                                          setFieldValue(
                                            'items',
                                            patchItemRow(values.items, index, {
                                              itemGroup: itemGroupId || null,
                                              itemId: value || null,
                                              ...units,
                                              savedUnitPrices: null,
                                              needsUnitHydration: false,
                                            })
                                          );
                                          if (value && itemGroupId && !itemsByGroup[itemGroupId]?.length && master) {
                                            setItemsByGroup(prev => ({ ...prev, [itemGroupId]: prev[itemGroupId]?.length ? prev[itemGroupId] : [master] }));
                                            fetchItemsForGroup(itemGroupId);
                                          }
                                        }}
                                        setFieldValue={setFieldValue}
                                        onBlur={handleBlur}
                                        errorMessage={errors.items?.[index]?.itemId}
                                        touched={touched.items?.[index]?.itemId}
                                        selectVariant="twoColumn"
                                        columnSelectHeader={itemSelectColumnHeader}
                                        selectOptions={buildItemFilterSelectOptions(
                                          (item.itemGroup ? itemsByGroup[item.itemGroup] || [] : allItemDrop || []).filter(
                                            option => !values.items.some((row, i) => row.itemId === option._id && i !== index)
                                          )
                                        )}
                                        loading={itemDropLoading || allItemDropLoading}
                                        aria-label={`Item ${index + 1} name`}
                                        allowClear
                                        required={true}
                                      />
                                      <CustomInput
                                        id={`items.${index}.itemUnitName`}
                                        type="text"
                                        name={`items.${index}.itemUnitName`}
                                        placeholder="Item Unit"
                                        value={item.itemUnitName || ''}
                                        onBlur={handleBlur}
                                        errorMessage={errors.items?.[index]?.itemUnitId}
                                        touched={touched.items?.[index]?.itemUnitId}
                                        className="w-full p-2 border rounded"
                                        aria-label={`Item ${index + 1} unit`}
                                        disabled
                                        readOnly
                                      />
                                      <CustomInput
                                        id={`items.${index}.netPrice`}
                                        type="number"
                                        name={`items.${index}.netPrice`}
                                        placeholder="Enter Net Price"
                                        value={item.netPrice}
                                        onChange={e => handleNetPriceChange(setFieldValue, `items.${index}.netPrice`, e.target.value)}
                                        setFieldValue={setFieldValue}
                                        onBlur={handleBlur}
                                        errorMessage={errors.items?.[index]?.netPrice}
                                        touched={touched.items?.[index]?.netPrice}
                                        className="w-full p-2 border rounded"
                                        aria-label={`Item ${index + 1} net price`}
                                        required={true}
                                      />
                                      <div className="flex h-[34px] items-center justify-center">
                                        {values.items.length > 1 && (
                                          <button type="button" className="flex h-[34px] items-center text-xl cursor-pointer" onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`}>
                                            {<Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {item.conversions?.length > 0 && (
                                      <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                                        <div className="mb-1 text-[12px] font-medium text-gray-500">Conversion Units</div>
                                        <div className="flex flex-col">
                                          {item.conversions.map((conversion, conversionIndex) => (
                                            <div key={conversion.itemUnitId || conversionIndex} className="price-list-item-grid py-1.5">
                                              <div className="col-span-2 flex h-[34px] items-center text-[13px] text-gray-500">Conversion {conversionIndex + 1}</div>
                                              <CustomInput
                                                id={`items.${index}.conversions.${conversionIndex}.itemUnitName`}
                                                type="text"
                                                name={`items.${index}.conversions.${conversionIndex}.itemUnitName`}
                                                placeholder="Item Unit"
                                                value={conversion.itemUnitName || ''}
                                                className="w-full p-2 border rounded"
                                                aria-label={`Item ${index + 1} conversion unit ${conversionIndex + 1}`}
                                                disabled
                                                readOnly
                                              />
                                              <CustomInput
                                                id={`items.${index}.conversions.${conversionIndex}.netPrice`}
                                                type="number"
                                                name={`items.${index}.conversions.${conversionIndex}.netPrice`}
                                                placeholder="Enter Net Price"
                                                value={conversion.netPrice}
                                                onChange={e => handleNetPriceChange(setFieldValue, `items.${index}.conversions.${conversionIndex}.netPrice`, e.target.value)}
                                                setFieldValue={setFieldValue}
                                                onBlur={handleBlur}
                                                errorMessage={errors.items?.[index]?.conversions?.[conversionIndex]?.netPrice}
                                                touched={touched.items?.[index]?.conversions?.[conversionIndex]?.netPrice}
                                                className="w-full p-2 border rounded"
                                                aria-label={`Item ${index + 1} conversion unit ${conversionIndex + 1} net price`}
                                                required={true}
                                              />
                                              <div className="flex h-[34px] items-center justify-center">
                                                <button
                                                  type="button"
                                                  className="flex h-[34px] items-center text-xl cursor-pointer"
                                                  onClick={() =>
                                                    setFieldValue(
                                                      `items.${index}.conversions`,
                                                      item.conversions.filter((_, currentIndex) => currentIndex !== conversionIndex)
                                                    )
                                                  }
                                                  aria-label={`Remove conversion unit ${conversionIndex + 1}`}
                                                >
                                                  {<Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />}
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <CustomButton
                                type="primary"
                                className="mt-3"
                                onClick={() => push(emptyPriceListItem())}
                                text={
                                  <div className="flex gap-1 text-xs items-center">
                                    <Icons.PlusCircleOutlined className="text-xs" />
                                    <div>Add Item</div>
                                  </div>
                                }
                              />
                            </div>
                          )}
                        </FieldArray>
                      </fieldset>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <CustomButton
                      className="px-8 py-2 min-w-[50px]"
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

                        formikRef.current.handleSubmit();
                      }}
                    />

                    <CustomButton className="px-8 py-2" type="default" text="Cancel" disabled={submitLoading} onClick={() => handleNavigation(-1)} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
          <CodeConfigModal
            isVisible={isConfigModalVisible}
            onCancel={handleConfigModalVisibility}
            loading={moduleConfigLoading}
            initialConfig={priceListConfig}
            title="Configure Price List Code Preferences"
            description="Auto-generating price list codes can save your time. Would you like to change your current setting?"
            setConfigDetail={setPriceListConfig}
            moduleName={MODULE_NAMES.PRICE_LIST}
          />
        </div>
      </div>
    </>
  );
};

export default AddPriceList;
