import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import ItemTable from '@/components/dataDisplay/appTable/ItemTable';
import Toast from '@/components/ui/common/Toast';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import { Button, Modal, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import DocumentActivationModal from '@/components/feedback/confirmModal/DocumentActivationModal';
import DiscountConfigChangeContent from '@/components/dataDisplay/statCard/DiscountConfigChangeContent';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import usePurchaseSaveActivation from '@/hooks/usePurchaseSaveActivation';

// Extras
import { useRecurringBills, recurringBillValidateSchema, recurringBillTransformer } from '@/features/purchase/recurringBills';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE } from 'utils/constants';
import { recurringBillInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddRecurringBill = () => {
  const formikRef = useRef(null);
  const { billsId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { submitLoading, recurringBill, getRecurringBillById, createRecurringBills, updateRecurringBills, resetRecurringBill, loading: recurringBillLoading } = useRecurringBills();
  const recurringBillData = recurringBill;
  const updatedRecurringBillDataRef = useRef(recurringBillData);
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, loading: vendorCustomerDropLoading, customerDropDownList, getCustomerDropList, resetCustomerDropDownList } = useCustomer();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    allItemDrop,
    allItemDropLoading,
    customerAddress,
    addressLoading,
    getCustomerAddress,
    resetCustomerAddress,
    selectedBranchId,
    selectedWarehouseId,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(recurringBillData, RESOURCES.RECURRING_BILLS, {
    skipLocationDropdowns: !!billsId,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { getCompanyProfileSettings, address, getProfileAddress, resetAddress, profile, loading: profileLoading } = useProfile();
  const [selectedVendor, setSelectedVendor] = useState(recurringBillData?.vendorId || '');
  const selectedCustomerData = billsId ? { ...recurringBillData?.vendor, id: recurringBillData?.vendor?._id } : vendorDropDownList?.find(cust => cust._id === selectedVendor) || {};
  const { pendingActivation, setPendingActivation, resolveActivation } = usePurchaseSaveActivation({
    vendor: selectedCustomerData,
    branchId: selectedBranchId,
    itemsDrop: allItemDrop,
    itemsDropLoading: allItemDropLoading,
    getVendorDropList: billsId ? getVendorDropList : undefined,
  });
  const { currency } = useCompanyCurrency();
  const documentCurrency = selectedCustomerData?.currency || recurringBillData?.currency || currency;
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [billConfig, setBillConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const [changeDiscountConfig, setChangeDiscountConfig] = useState(false);
  const [showCustomerError, setShowCustomerError] = useState(false);
  const scrollToError = useScrollToError();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const initialAddressId = useRef(null);
  const [selectedCustomer, setSelectedCustomer] = useState(recurringBillData?.customerId || '');

  // Document Configuration Sheet Hook
  const {
    isOpen: isRecurringBillConfigOpen,
    handleOpen: handleOpenRecurringBillConfig,
    handleClose: handleCloseRecurringBillConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.RECURRING_BILL,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveRecurringBillConfig,
    drawerSaveLoading: recurringBillConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isRecurringBillConfigOpen,
    moduleConfig: billConfig,
    setModuleConfig: setBillConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseRecurringBillConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.RECURRING_BILL,
        moduleConfig: {
          useCustomPrefix: number.autoGenerate,
          prefix: number.prefix,
          nextSequence: number.nextNumber,
          termsandConditions: terms,
        },
        signal,
      });
    },
    refreshModuleConfig: ({ signal }) =>
      getModuleConfig({
        moduleName: MODULE_NAMES.RECURRING_BILL,
        customerId: formikRef.current?.values?.vendorId || recurringBillData?.vendorId,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update recurring bill configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const fetchCustomerAddress = useCallback(
    customerId => {
      getCustomerAddress({ customerId });
    },
    [getCustomerAddress]
  );

  const fetchProfileAddress = useCallback(() => {
    getProfileAddress({});
  }, [getProfileAddress]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getCompanyProfileSettings(payload);

    return () => {
      Modal.destroyAll();
      resetCustomerDropDownList();
      resetCustomerAddress();
      resetAddress();
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (billsId) return;

    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.RECURRING_BILL,
    });
    fetchProfileAddress();

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [billsId, getModuleConfig, resetModuleConfig, fetchProfileAddress]);

  const fetchVendorDrop = useCallback(
    branchId => {
      getVendorDropList({ branchId });
    },
    [getVendorDropList]
  );

  useEffect(() => {
    if (moduleConfig) {
      setBillConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !billsId && billConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (billConfig.autoGenerate) {
        const newRecurringBillId = `${billConfig.prefix}${billConfig.nextNumber}`;
        formikRef.current.setFieldValue('recurringBillId', newRecurringBillId);
      }
      formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!recurringBillData?.divisionId && !hasSelectedValues && defaultConfig) {
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
  }, [billConfig, billsId, recurringBillData, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (billsId || !selectedBranchId) return;
    fetchVendorDrop(selectedBranchId);
  }, [billsId, selectedBranchId, fetchVendorDrop]);

  useEffect(() => {
    if (!selectedBranchId || !billsId) return;
    const controller = new AbortController();
    getCustomerDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [billsId, selectedBranchId, getCustomerDropList]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === recurringBillData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress?.[0] || null;

      if (billsId) {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      } else {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [customerAddress, recurringBillData]);

  useEffect(() => {
    if (address?.length > 0) {
      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === recurringBillData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (billsId) {
        if (recurringBillData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, recurringBillData]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues) return;
    const discountCfg = recurringBillData?.appliesTo && !changeDiscountConfig ? { appliesTo: recurringBillData?.appliesTo } : moduleConfig?.discountConfig;
    if (!selectedCustomerData?._id) return;
    const newTaxContext = buildTaxContext(profile, selectedCustomerData, selectedCustomerData?.address?.billing?.state || '');
    if (currentValues.taxContext?.customerState === newTaxContext.customerState) return;
    formikRef.current.setFieldValue('taxContext', newTaxContext);
    calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue, discountCfg);
  }, [selectedAddress, selectedCustomerData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();

    const loadRecurringBill = async () => {
      if (!billsId) {
        resetRecurringBill();
        return;
      }

      try {
        const result = await getRecurringBillById({ recurringBillId: billsId, signal: controller.signal });
        if (controller.signal.aborted) return;

        const data = result?.data;
        getModuleConfig({
          signal: controller.signal,
          moduleName: MODULE_NAMES.RECURRING_BILL,
          customerId: data?.vendorId,
        });

        if (data?.customerId) {
          fetchCustomerAddress(data.customerId);
        } else {
          fetchProfileAddress();
        }
      } catch {
        /* aborted or handled by slice */
      }
    };

    loadRecurringBill();

    return () => {
      resetRecurringBill();
      resetVendorDropDownList();
      resetModuleConfig();
      controller.abort();
    };
  }, [billsId]);

  useEffect(() => {
    if (recurringBill) {
      setSelectedVendor(recurringBillData?.vendorId || '');
      setDivisionBranchWarehouseFromEntity(recurringBill);
      setSelectedCustomer(recurringBillData?.customerId || '');
    }
  }, [recurringBill, recurringBillData, setDivisionBranchWarehouseFromEntity]);

  const initialValues = useMemo(() => {
    const currentValues = formikRef?.current?.values;
    const rawValues = recurringBillInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? { ...updatedRecurringBillDataRef.current, addressId: currentValues?.addressId || updatedRecurringBillDataRef.current?.addressId }
        : { ...recurringBillData, addressId: currentValues?.addressId || recurringBillData?.addressId },
      moduleConfig?.termsandConditions || '',
      'Due On Receipt',
      Boolean(billsId)
    );

    return {
      ...rawValues,
      startDate: rawValues.startDate ? dayjs(rawValues.startDate) : null,
      endDate: rawValues.endDate ? dayjs(rawValues.endDate) : null,
    };
  }, [recurringBillData, moduleConfig, changeDiscountConfig]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['recurringBillId', 'addressId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (billsId) return;
    if (vendorDropDownList?.length > 0 && recurringBillData?.vendor) {
      let findCustomerExists = vendorDropDownList?.find(customer => customer?._id === recurringBillData?.vendorId);
      if (!findCustomerExists) {
        formikRef.current?.setFieldValue('vendorId', null);
        setShowCustomerError(true);
      }
    }
  }, [vendorDropDownList, recurringBillData, billsId]);

  const findItem = (ItemId, allItemDrop) => {
    const item = (allItemDrop || []).find(item => item._id === ItemId);
    return item;
  };

  // Second arg is Formik helpers on submit; only the activation modal passes activationConfirmed.
  const onFinish = async (values, { activationConfirmed = false } = {}) => {
    if (!validateDocumentTotalBeforeSave(values)) {
      Toast.error(DOCUMENT_TOTAL_MIN_MESSAGE);
      return;
    }
    if (!values?.addressId) return;
    if (submitLoading) return;

    const activationFlags = resolveActivation(values, activationConfirmed);
    if (!activationFlags) return;

    const recurringBillsDataPayload = recurringBillTransformer(
      {
        ...values,
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedCustomerData?.address?.billing?.state || ''),
        appliesTo:
          recurringBillData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: recurringBillData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      billsId,
      [],
      recurringBillData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: recurringBillData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    Object.assign(recurringBillsDataPayload, activationFlags);
    const result = billsId ? await updateRecurringBills({ billsId, recurringBillData: recurringBillsDataPayload }) : await createRecurringBills(recurringBillsDataPayload);
    const targetId = billsId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/recurring-bills/${targetId}`, {
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

  const handleDiscountConfigChange = useCallback(() => {
    const previousConfig = {
      appliesTo: recurringBillData?.appliesTo,
      discountConfig: recurringBillData?.discountConfig,
    };
    const newConfig = {
      appliesTo: moduleConfig?.discountConfig?.appliesTo,
      discountConfig: moduleConfig?.discountConfig,
    };
    let data = {
      title: <span style={{ fontWeight: 'normal' }}>{DISCOUNT_CONFIG_CHANGE_MODAL.TITLE}</span>,
      content: <DiscountConfigChangeContent previousConfig={previousConfig} newConfig={newConfig} />,
      okText: DISCOUNT_CONFIG_CHANGE_MODAL.OK_TEXT,
      cancelText: DISCOUNT_CONFIG_CHANGE_MODAL.CANCEL_TEXT,
      variant: 'warning',
    };
    data.onOk = () => {
      setChangeDiscountConfig(true);
      updatedRecurringBillDataRef.current = {
        ...recurringBillData,
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  }, [recurringBillData, moduleConfig?.discountConfig?.appliesTo]);

  useEffect(() => {
    if (recurringBillData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== recurringBillData?.appliesTo) {
      handleDiscountConfigChange();
    }
  }, [moduleConfig, recurringBillData]);

  if (billsId && (recurringBillLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{billsId ? `Edit Recurring Bills / ${recurringBillData?.recurringBillId}` : 'Add Recurring Bills'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVendor && <CustomerBasicDetail customerData={selectedCustomerData} isVendor={true} wrapperClassName="flex items-center" />}
            {!billsId && (
              <Button type="default" onClick={handleOpenRecurringBillConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Recurring Bill Configuration
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="px-6">
          {showCustomerError && (
            <div className="container-spacing bg-red-100 mb-5">
              <div className="flex justify-between rounded-md">
                <div>
                  <p>{`${moduleConfig?.customer?.customerDisplayName} is not available in this branch`}</p>
                </div>
                <Icons.CloseOutlined
                  onClick={() => {
                    setShowCustomerError(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="relative pb-24">
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={recurringBillValidateSchema(billConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!billsId ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
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
                              setFieldValue('vendorId', null, false);
                              setSelectedVendor(null);
                              setFieldValue('customerId', null, false);
                              setSelectedCustomer(null);
                              dispatch(resetBranch());
                            }}
                            loading={divisionLoading}
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
                            onChange={e => {
                              applyBranchSelection(e, {
                                setFieldValue,
                                setFieldTouched,
                                values,
                              });
                              setFieldValue('vendorId', null, false);
                              setSelectedVendor(null);
                              setSelectedCustomer(null);
                            }}
                            disabled={warehouseRequiresCascade && !values.divisionId}
                            loading={branchLoading}
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
                              const selectedWarehouse = (warehouseDrop || []).find(w => (w.id ?? w._id) === (e || ''));
                              const { branchId } = getDivisionBranchFromWarehouseOption(selectedWarehouse);
                              if (branchId && branchId !== values.branchId) {
                                setFieldValue('vendorId', null, false);
                                setSelectedVendor(null);
                                setFieldValue('customerId', null, false);
                                setSelectedCustomer(null);
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
                            disabled={warehouseRequiresCascade && !values.branchId}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={recurringBillData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={recurringBillData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={recurringBillData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Header fields */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative">
                            {documentCurrency && selectedVendor && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!billsId ? (
                              <CustomInput
                                type="select"
                                selectVariant="twoColumn"
                                columnSelectHeader={{ id: 'Vendor ID', name: 'Vendor Name' }}
                                name="vendorId"
                                label="Vendor Name"
                                value={values.vendorId}
                                onChange={e => {
                                  setFieldValue('vendorId', e);
                                  setSelectedVendor(e);
                                  let findSelectedVendor = vendorDropDownList?.find(cust => cust._id === e) || {};
                                  const vendorPaymentTerms = findSelectedVendor?.paymentTermsId;
                                  setFieldValue('paymentTermsId', vendorPaymentTerms?._id || vendorPaymentTerms?.id || defaultPaymentTermsId, false);
                                  setFieldValue('exchangeRate', findSelectedVendor?.currency?.exchangeRate || 1, false);
                                  if (values.tax) {
                                    setFieldValue('tax', null, false);
                                    calculateAmounts(
                                      { ...values, tax: null },
                                      (field, value) => setFieldValue(field, value, false),
                                      recurringBillData?.appliesTo && !changeDiscountConfig ? { appliesTo: recurringBillData?.appliesTo } : moduleConfig?.discountConfig
                                    );
                                  }
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.vendorId}
                                touched={touched.vendorId}
                                setFieldValue={setFieldValue}
                                placeholder="Select Vendor Name"
                                selectOptions={buildCustomerSelectOptions(vendorDropDownList, values.branchId)}
                                required
                                disabled={!values.branchId}
                                loading={vendorCustomerDropLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Vendor Available</div>}
                              />
                            ) : (
                              <CustomInput type="text" name="vendorId" label="Vendor Name" value={recurringBillData?.vendor?.customerDisplayName} disabled />
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="recurringBillId"
                            label="Bill#"
                            placeholder="Enter Bill"
                            value={values.recurringBillId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.recurringBillId}
                            touched={touched.recurringBillId}
                            setFieldValue={setFieldValue}
                            disabled={billConfig?.autoGenerate || billsId}
                            suffix={
                              !billsId && (
                                <Tooltip title="Configure Bill Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required={true}
                          />

                          <CustomInput
                            type="date"
                            name="startDate"
                            label="Start On"
                            value={values.startDate ? values.startDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.startDate}
                            touched={touched.startDate}
                            placeholder="Select Start Date"
                            format="YYYY-MM-DD"
                            required={true}
                            onChange={() => setFieldValue('endDate', null)}
                            disabledDate={current => current && current < dayjs().startOf('day')}
                          />
                          <CustomInput
                            type="date"
                            name="endDate"
                            label="End On"
                            value={values.endDate ? values.endDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.endDate}
                            touched={touched.endDate}
                            placeholder="Select End Date"
                            format="YYYY-MM-DD"
                            required={true}
                            disabled={values.neverExpires === true}
                            disabledDate={current => {
                              if (!current) return false;
                              const today = dayjs().startOf('day');
                              if (current < today) return true;
                              if (values.startDate) {
                                const startDate = dayjs(values.startDate).startOf('day');
                                return current <= startDate;
                              }
                              return false;
                            }}
                          />

                          <div className="mt-7">
                            <CustomInput
                              type="checkbox"
                              name="neverExpires"
                              CheckboxName="Never Expires"
                              value={values.neverExpires}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.neverExpires}
                              touched={touched.neverExpires}
                              setFieldValue={setFieldValue}
                            />
                          </div>

                          <CustomInput
                            type="text"
                            name="profileName"
                            label="Profile Name"
                            placeholder="Enter Profile Name"
                            value={values.profileName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.profileName}
                            touched={touched.profileName}
                            setFieldValue={setFieldValue}
                            required
                          />

                          <CustomInput
                            type="select"
                            name="paymentTermsId"
                            label="Payment Terms"
                            placeholder="Select Payment Terms"
                            value={values.paymentTermsId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.paymentTermsId}
                            touched={touched.paymentTermsId}
                            setFieldValue={setFieldValue}
                            selectOptions={paymentTermsOptions}
                            loading={paymentTermsDropLoading}
                            required={true}
                          />

                          <CustomInput
                            type="select"
                            name="period"
                            label="Repeat Every"
                            value={values.period}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.period}
                            touched={touched.period}
                            setFieldValue={setFieldValue}
                            placeholder="Select Time"
                            selectOptions={[
                              { value: 'Day(s)', label: 'Day(s)' },
                              { value: 'Week(s)', label: 'Week(s)' },
                              { value: 'Month(s)', label: 'Month(s)' },
                              { value: 'Year(s)', label: 'Year(s)' },
                            ]}
                            required
                          />

                          <CustomInput
                            type="text"
                            name="frequency"
                            label="Frequency"
                            placeholder="Enter Frequency"
                            value={values.frequency}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.frequency}
                            touched={touched.frequency}
                            setFieldValue={setFieldValue}
                            required
                          />

                          <div className="md:col-start-1 lg:col-start-1">
                            <CustomInput
                              name="shippingAddressType"
                              label=""
                              type="radio"
                              value={values.shippingAddressType}
                              onChange={e => {
                                setFieldValue('customerId', null);
                                setFieldValue('addressId', null);
                                setSelectedAddress(null);
                                setSelectedCustomer(null);
                                if (e?.target?.value === 'Organization') {
                                  fetchProfileAddress();
                                }
                              }}
                              onBlur={handleBlur}
                              errorMessage={errors.shippingAddressType}
                              touched={touched.shippingAddressType}
                              setFieldValue={setFieldValue}
                              radioOptions={[
                                { value: 'Organization', label: 'Organization' },
                                { value: 'Customer', label: 'Customer' },
                              ]}
                              disabled={billsId}
                            />
                            {values?.shippingAddressType === 'Organization' && (
                              <AdditionalAddressContainer
                                customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
                                addressLoading={profileLoading}
                                fetchCustomerAddress={values?.shippingAddressType === 'Customer' ? fetchCustomerAddress : fetchProfileAddress}
                                selectedCustomer={values?.shippingAddressType === 'Customer' ? selectedCustomer : null}
                                setFieldValue={setFieldValue}
                                selectedAddress={selectedAddress}
                                setSelectedAddress={setSelectedAddress}
                                shippingAddressType={values?.shippingAddressType}
                              />
                            )}
                            {values?.shippingAddressType === 'Customer' && (
                              <div>
                                <CustomInput
                                  type="select"
                                  name="customerId"
                                  label="Customer Name"
                                  value={values.customerId}
                                  onChange={e => {
                                    setFieldValue('addressId', null);
                                    setSelectedAddress(null);
                                    setFieldValue('customerId', e);
                                    setSelectedCustomer(e);
                                    fetchCustomerAddress(e);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.customerId}
                                  touched={touched.customerId}
                                  setFieldValue={setFieldValue}
                                  placeholder="Select Customer Name"
                                  selectVariant="twoColumn"
                                  columnSelectHeader={customerSelectColumnHeader}
                                  selectOptions={buildCustomerSelectOptions(customerDropDownList)}
                                  loading={vendorCustomerDropLoading}
                                  notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                  required
                                />
                                {values?.customerId && (
                                  <AdditionalAddressContainer
                                    customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
                                    addressLoading={addressLoading}
                                    fetchCustomerAddress={values?.shippingAddressType === 'Customer' ? fetchCustomerAddress : fetchProfileAddress}
                                    selectedCustomer={values?.shippingAddressType === 'Customer' ? selectedCustomer : null}
                                    setFieldValue={setFieldValue}
                                    selectedAddress={selectedAddress}
                                    setSelectedAddress={setSelectedAddress}
                                    shippingAddressType={values?.shippingAddressType}
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {documentCurrency?.code && currency?.code && documentCurrency.code !== currency.code && (
                            <CustomInput
                              type="number"
                              name="exchangeRate"
                              label="Exchange Rate"
                              placeholder="Enter Exchange Rate"
                              value={values.exchangeRate}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.exchangeRate}
                              touched={touched.exchangeRate}
                              setFieldValue={setFieldValue}
                              required={true}
                              addonBefore={`1 ${documentCurrency.code} =`}
                              addonAfter={currency.code}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <ItemTable
                      values={values}
                      arr={values.items}
                      findItem={findItem}
                      itemsDrop={allItemDrop}
                      itemsDropLoading={allItemDropLoading}
                      setFieldValue={setFieldValue}
                      calculateAmounts={calculateAmounts}
                      errors={errors}
                      handleBlur={handleBlur}
                      handleChange={handleChange}
                      selectedCustomerData={selectedCustomerData}
                      touched={touched}
                      discountConfig={
                        recurringBillData?.appliesTo && !changeDiscountConfig
                          ? {
                              appliesTo: recurringBillData?.appliesTo,
                            }
                          : moduleConfig?.discountConfig
                      }
                      moduleType={MODULE_TYPE.PURCHASE}
                      currency={documentCurrency}
                    />
                    <div className="flex justify-end pt-2">
                      <TotalContainer
                        profile={profile}
                        selectedCustomer={selectedCustomerData}
                        values={values}
                        setFieldValue={setFieldValue}
                        calculateAmounts={calculateAmounts}
                        discountConfig={
                          recurringBillData?.appliesTo && !changeDiscountConfig
                            ? {
                                appliesTo: recurringBillData?.appliesTo,
                              }
                            : moduleConfig?.discountConfig
                        }
                        currency={documentCurrency}
                        directTaxTypes={['TDS', 'TCS']}
                        isDirectTaxApplicable={selectedCustomerData?.isVendorDirectTax}
                        documentDate={values.startDate}
                      />
                    </div>

                    {/* Notes & Terms card */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-3">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
                        <CustomInput
                          type="textarea"
                          name="notes"
                          label="Customer Notes"
                          placeholder="Enter Customer Note"
                          value={values.notes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.notes}
                          touched={touched.notes}
                          setFieldValue={setFieldValue}
                        />

                        <CustomInput
                          type="textarea"
                          name="termsAndConditions"
                          label="Terms & Conditions"
                          placeholder="Enter Terms & Conditions"
                          value={values.termsAndConditions}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.termsAndConditions}
                          touched={touched.termsAndConditions}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>
                  </div>
                  {values?.divisionId && values?.branchId && values?.warehouseId && (
                    <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-5 flex-wrap">
                        <CustomButton
                          className="px-8 py-4 min-w-[50px]"
                          type="primary"
                          text="Save"
                          loading={submitLoading}
                          onClick={async () => {
                            if (!values?.addressId) {
                              Toast.error('Address is required');
                              return;
                            }

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
                        <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                      </div>
                      <GrandTotalBar values={values} currency={documentCurrency} />
                    </div>
                  )}
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
        initialConfig={billConfig}
        resource={RESOURCES.RECURRING_BILLS}
        setConfigDetail={config => {
          setBillConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES.RECURRING_BILL}
      />
      {!billsId && (
        <DocumentConfigSheet
          resource={RESOURCES.RECURRING_BILLS}
          open={isRecurringBillConfigOpen}
          onClose={handleCloseRecurringBillConfig}
          onSave={handleSaveRecurringBillConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || recurringBillConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={recurringBillConfigSaving}
        />
      )}
      <DocumentActivationModal
        open={!!pendingActivation}
        documentLabel="recurring bill"
        partyLabel={confirmModalEnum.DOCUMENT_ACTIVATION.VENDOR_LABEL}
        partyName={pendingActivation?.needsVendor ? selectedCustomerData?.customerDisplayName : null}
        branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name || recurringBillData?.branchName}
        warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name || recurringBillData?.warehouseName}
        itemNames={pendingActivation?.itemNames}
        loading={submitLoading}
        onConfirm={async () => {
          await onFinish(pendingActivation.values, { activationConfirmed: true });
          setPendingActivation(null);
        }}
        onCancel={() => setPendingActivation(null)}
      />
    </>
  );
};

export default AddRecurringBill;
