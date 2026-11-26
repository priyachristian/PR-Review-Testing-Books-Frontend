import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CreditLimitAlert from '@/components/feedback/formModal/CreditLimitAlert';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
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
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useItemMaster } from '@/features/allMaster/item';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import usePurchaseSaveActivation from '@/hooks/usePurchaseSaveActivation';

// Extras
import { usePurchaseOrder, purchaseOrderValidateSchema, purchaseOrderTransformer, stripPurchaseOrderForDuplicate } from '@/features/purchase/purchaseOrder';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { purchaseOrderInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts } from 'utils/services';
import { defaultDocumentLineUnit } from '@/utils/itemLineUnit';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { errorsToTouched, shouldPreventNavigation } from '@/utils/util';
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
import { buildItemFilterSelectOptions, itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const AddPurchaseOrder = () => {
  const formikRef = useRef(null);
  const { purchaseId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    submitLoading,
    submitWithStatusLoading,
    purchaseOrder,
    resetPurchaseOrder,
    getPurchaseOrderById,
    createPurchaseOrders,
    updatePurchaseOrders,
    loading: purchaseOrderLoading,
  } = usePurchaseOrder();
  const { FGLoading, fgBomItemDrop, getFGBOMItemDrop } = useItemMaster();
  const duplicateFromId = !purchaseId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const purchaseOrderData = useMemo(() => {
    const rawData = purchaseId || isDuplicate ? purchaseOrder : location.state?.purchaseOrderData;
    if (!rawData || !isDuplicate) return rawData;
    return stripPurchaseOrderForDuplicate(rawData);
  }, [purchaseOrder, purchaseId, isDuplicate, location.state?.purchaseOrderData]);
  const updatedPurchaseOrderDataRef = useRef(purchaseOrderData);
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, getCustomerDropList, loading: vendorLoading } = useCustomer();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    allItemDrop,
    allItemDropLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    selectedBranchId,
    selectedWarehouseId,
    setSelectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    selectedCustomerId,
    setSelectedCustomerId,
    customerDropDownList,
    resetCustomerDropDownList,
    customerLoading,
    customerAddress,
    addressLoading,
    getCustomerAddress,
    resetCustomerAddress,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(purchaseOrderData, RESOURCES.PURCHASE_ORDER, {
    skipLocationDropdowns: !!purchaseId,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });
  const [selectedVendor, setSelectedVendor] = useState(purchaseOrderData?.vendor?.id || purchaseOrderData?.vendor?._id || '');
  const { profile, address, getProfileAddress, resetAddress, loading: profileLoading } = useProfile();
  const vendorFromDocument = purchaseOrderData?.vendor ? { ...purchaseOrderData.vendor, id: purchaseOrderData.vendor._id || purchaseOrderData.vendor.id } : {};
  const selectedVendorData = purchaseId ? vendorFromDocument : vendorDropDownList?.find(cust => cust._id === selectedVendor) || vendorFromDocument;
  const { pendingActivation, setPendingActivation, resolveActivation } = usePurchaseSaveActivation({
    vendor: selectedVendorData,
    branchId: selectedBranchId,
    itemsDrop: allItemDrop,
    itemsDropLoading: allItemDropLoading,
    getVendorDropList: purchaseId ? getVendorDropList : undefined,
  });
  const { currency } = useCompanyCurrency();
  const documentCurrency = selectedVendorData?.currency || purchaseOrderData?.currency || currency;
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [purchaseOrderConfig, setPurchaseOrderConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const [changeDiscountConfig, setChangeDiscountConfig] = useState(false);
  const [showCustomerError, setShowCustomerError] = useState(false);
  const scrollToError = useScrollToError();
  const [creditLimitAlertOpen, setCreditLimitAlertOpen] = useState(false);
  const [creditLimitAlertData, setCreditLimitAlertData] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Document Configuration Sheet Hook
  const {
    isOpen: isPurchaseOrderConfigOpen,
    handleOpen: handleOpenPurchaseOrderConfig,
    handleClose: handleClosePurchaseOrderConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.PURCHASE_ORDER,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSavePurchaseOrderConfig,
    drawerSaveLoading: purchaseOrderConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isPurchaseOrderConfigOpen,
    moduleConfig: purchaseOrderConfig,
    setModuleConfig: setPurchaseOrderConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleClosePurchaseOrderConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.PURCHASE_ORDER,
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
        moduleName: MODULE_NAMES.PURCHASE_ORDER,
        customerId: formikRef.current?.values?.vendor || purchaseOrderData?.vendor?._id || purchaseOrderData?.vendor?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update purchase order configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const fetchVendorDrop = branchId => {
    getVendorDropList({ branchId });
  };

  const lastFetchedAddressCustomerIdRef = useRef(null);

  const fetchCustomerAddress = customerId => {
    lastFetchedAddressCustomerIdRef.current = customerId || null;
    getCustomerAddress({ customerId });
  };

  const fetchProfileAddress = () => {
    lastFetchedAddressCustomerIdRef.current = 'PROFILE';
    getProfileAddress({});
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getFGBOMItemDrop(payload);
    if (!purchaseId && !isDuplicate) {
      fetchProfileAddress();
    }

    return () => {
      Modal.destroyAll();
      resetCustomerAddress();
      resetAddress();
      controller.abort();
    };
  }, [purchaseId, isDuplicate]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (purchaseId || isDuplicate) {
      if (purchaseOrderData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.PURCHASE_ORDER,
          customerId: purchaseOrderData?.vendor?._id || purchaseOrderData?.vendor?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.PURCHASE_ORDER,
        customerId: purchaseOrderData?.vendor?._id || purchaseOrderData?.vendor?.id,
      });
    }

    const resolveCustomerId = customer => customer?._id || customer?.id || customer;

    if ((purchaseId || isDuplicate) && purchaseOrderData) {
      if (purchaseOrderData?.customer) {
        const customerId = resolveCustomerId(purchaseOrderData.customer);
        if (customerId && lastFetchedAddressCustomerIdRef.current !== customerId) {
          fetchCustomerAddress(customerId);
        }
      } else if (lastFetchedAddressCustomerIdRef.current !== 'PROFILE') {
        fetchProfileAddress();
      }
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [purchaseId, isDuplicate, purchaseOrderData, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (purchaseId) return;
    if (vendorDropDownList?.length > 0 && purchaseOrderData?.vendor) {
      let findCustomerExists = vendorDropDownList?.find(customer => customer?._id === purchaseOrderData?.vendor?.id || customer?._id === purchaseOrderData?.vendor?._id);

      if (!findCustomerExists) {
        formikRef.current?.setFieldValue('vendor', null);
        setShowCustomerError(true);
      }
    }
  }, [vendorDropDownList, purchaseOrderData, purchaseId]);

  useEffect(() => {
    if (purchaseId || !selectedBranchId) return;
    fetchVendorDrop(selectedBranchId);
  }, [selectedBranchId, purchaseId]);

  useEffect(() => {
    if (!purchaseId || !selectedBranchId) return;
    const controller = new AbortController();
    getCustomerDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [purchaseId, selectedBranchId, getCustomerDropList]);

  useEffect(() => {
    if (moduleConfig) {
      setPurchaseOrderConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !purchaseId && purchaseOrderConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (purchaseOrderConfig.autoGenerate) {
        const newPurchaseOrderId = `${purchaseOrderConfig.prefix}${purchaseOrderConfig.nextNumber}`;
        formikRef.current.setFieldValue('purchaseOrderId', newPurchaseOrderId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!purchaseOrderData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [purchaseOrderConfig, purchaseId, purchaseOrderData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (purchaseId) {
      getPurchaseOrderById({ purchaseOrderId: purchaseId, signal: controller.signal });
    } else if (duplicateFromId) {
      getPurchaseOrderById({ purchaseOrderId: duplicateFromId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetVendorDropDownList();
      resetCustomerDropDownList();
    };
  }, [purchaseId, duplicateFromId, getPurchaseOrderById, resetVendorDropDownList, resetCustomerDropDownList]);

  useEffect(() => {
    if (!purchaseId && !duplicateFromId) {
      resetPurchaseOrder();
    }

    return () => {
      resetPurchaseOrder();
    };
  }, [purchaseId, duplicateFromId, resetPurchaseOrder]);

  useEffect(() => {
    if (purchaseOrder) {
      setSelectedVendor(purchaseOrderData?.vendor?.id || purchaseOrderData?.vendor?._id || '');
      setDivisionBranchWarehouseFromEntity(purchaseOrderData);
      setSelectedCustomerId(purchaseOrderData?.customer?._id || purchaseOrderData?.customer?.id || '');
    }
  }, [purchaseOrder, purchaseOrderData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      if ((purchaseId || isDuplicate) && purchaseOrderLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === purchaseOrderData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress?.[0] || null;

      if (purchaseId || isDuplicate) {
        if (purchaseOrderData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [customerAddress, purchaseOrderData, purchaseOrderLoading, moduleConfigLoading, purchaseId, isDuplicate]);

  useEffect(() => {
    if (address?.length > 0) {
      if ((purchaseId || isDuplicate) && purchaseOrderLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === purchaseOrderData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (purchaseId || isDuplicate) {
        if (purchaseOrderData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, purchaseOrderData, purchaseOrderLoading, moduleConfigLoading, purchaseId, isDuplicate]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedVendorData?._id) return;
    const discountCfg = purchaseOrderData?.appliesTo && !changeDiscountConfig ? { appliesTo: purchaseOrderData?.appliesTo } : moduleConfig?.discountConfig;
    const newTaxContext = buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || '');
    const prev = currentValues.taxContext;
    if (
      prev &&
      prev.customerState === newTaxContext.customerState &&
      prev.customerGSTNo === newTaxContext.customerGSTNo &&
      prev.myState === newTaxContext.myState &&
      prev.myGSTNo === newTaxContext.myGSTNo
    ) {
      return;
    }
    formikRef.current.setFieldValue('taxContext', newTaxContext);
    calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue, discountCfg);
  }, [selectedAddress, selectedVendorData]); // eslint-disable-line react-hooks/exhaustive-deps

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(() => {
    const rawValues = purchaseOrderInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? {
            ...updatedPurchaseOrderDataRef.current,
            addressId: formikRef?.current?.values?.addressId,
          }
        : { ...purchaseOrderData, addressId: formikRef?.current?.values?.addressId },
      moduleConfig?.termsandConditions || '',
      defaultPaymentTermsId,
      Boolean(purchaseId)
    );

    return {
      ...rawValues,
      attachments: purchaseOrderData?.attachments || purchaseOrderData?.purchaseFile || [],
      date: rawValues.date ? dayjs(rawValues.date) : dayjs(),
      deliveryDate: rawValues.deliveryDate ? dayjs(rawValues.deliveryDate) : null,
    };
  }, [purchaseOrderData, additionalChargesConfig, changeDiscountConfig, defaultPaymentTermsId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['purchaseOrderId', 'termsAndConditions', 'addressId'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const findItem = (ItemId, creditNoteItemsDrop) => {
    const item = (creditNoteItemsDrop || []).find(item => item._id === ItemId);
    return item;
  };

  // Second arg is Formik helpers on submit; only the activation modal passes activationConfirmed.
  const onFinish = async (values, { activationConfirmed = false } = {}) => {
    if (!validateDocumentTotalBeforeSave(values)) {
      Toast.error(DOCUMENT_TOTAL_MIN_MESSAGE);
      return;
    }
    if (!values?.addressId) return;

    if (submitLoading || submitWithStatusLoading) return;

    const activationFlags = resolveActivation(values, activationConfirmed);
    if (!activationFlags) return;

    const targetStatus = values?.status || null;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const purchaseOrderDataPayload = purchaseOrderTransformer(
      {
        ...values,
        taxContext: buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || ''),
        appliesTo:
          purchaseOrderData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: purchaseOrderData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      purchaseId,
      attachments,
      purchaseOrderData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: purchaseOrderData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    Object.assign(purchaseOrderDataPayload, activationFlags);
    // Save & Sent creates with SENT; PDF email/WhatsApp is handled on create (no updateStatus).
    const createArg = !purchaseId && targetStatus ? { ...purchaseOrderDataPayload, status: targetStatus } : purchaseOrderDataPayload;
    let result = purchaseId ? await updatePurchaseOrders({ purchaseId, purchaseOrderData: purchaseOrderDataPayload }) : await createPurchaseOrders(createArg);

    if (result?.payload?.code === 0 && result?.payload?.data?.isCreditLimitError) {
      setCreditLimitAlertOpen(true);
      setCreditLimitAlertData(result?.payload);
      return;
    }

    if (shouldPreventNavigation(result)) {
      return;
    }

    const targetId = purchaseId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (targetId) {
      navigateAfterSave(`/purchase-orders/${targetId}`, {
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

  const handleDiscountConfigChange = () => {
    const previousConfig = {
      appliesTo: purchaseOrderData?.appliesTo,
      discountConfig: purchaseOrderData?.discountConfig,
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
      updatedPurchaseOrderDataRef.current = {
        ...purchaseOrderData,
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (purchaseOrderData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== purchaseOrderData?.appliesTo) {
      handleDiscountConfigChange();
    }
  }, [moduleConfig, purchaseOrderData]);

  if ((purchaseId || isDuplicate) && (purchaseOrderLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{purchaseId ? `Edit Purchase Order / ${purchaseOrderData?.purchaseOrderId}` : 'Add Purchase Order'} </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVendor && <CustomerBasicDetail customerData={selectedVendorData} isVendor={true} wrapperClassName="flex items-center" />}
            {!purchaseId && (
              <Button type="default" onClick={handleOpenPurchaseOrderConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Purchase Order Configuration
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={purchaseOrderValidateSchema(purchaseOrderConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!purchaseId ? (
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
                              setFieldValue('vendor', null, false);
                              setSelectedVendor(null);
                              setFieldValue('customer', null, false);
                              setSelectedCustomerId(null);
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
                              setFieldValue('vendor', null, false);
                              setSelectedVendor(null);
                              setFieldValue('customer', null, false);
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
                                setFieldValue('vendor', null, false);
                                setSelectedVendor(null);
                                setFieldValue('customer', null, false);
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
                          <CustomInput type="text" name="divisionId" label="Division" value={purchaseOrderData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={purchaseOrderData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={purchaseOrderData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative pt-2">
                          <div className="relative">
                            {documentCurrency && values?.vendor && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!purchaseId ? (
                              <CustomInput
                                type="select"
                                selectVariant="twoColumn"
                                columnSelectHeader={{ id: 'Vendor ID', name: 'Vendor Name' }}
                                name="vendor"
                                label="Vendor Name"
                                value={values.vendor}
                                onChange={e => {
                                  setFieldValue('vendor', e);
                                  setSelectedVendor(e);
                                  let findSelectedVendor = vendorDropDownList?.find(cust => cust._id === e) || {};
                                  const taxContext = buildTaxContext(profile, findSelectedVendor, findSelectedVendor?.address?.billing?.state || '');
                                  setFieldValue('taxContext', taxContext, false);
                                  const setFieldValueWithoutValidation = (field, value) => setFieldValue(field, value, false);
                                  calculateAmounts(
                                    { ...values, taxContext },
                                    setFieldValueWithoutValidation,
                                    purchaseOrderData?.appliesTo && !changeDiscountConfig
                                      ? {
                                          appliesTo: purchaseOrderData?.appliesTo,
                                        }
                                      : moduleConfig?.discountConfig
                                  );
                                  const vendorPaymentTerms = findSelectedVendor?.paymentTermsId;
                                  setFieldValue('paymentTermsId', vendorPaymentTerms?._id || vendorPaymentTerms?.id || defaultPaymentTermsId, false);
                                  setFieldValue('exchangeRate', findSelectedVendor?.currency?.exchangeRate || 1, false);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.vendor}
                                touched={touched.vendor}
                                setFieldValue={setFieldValue}
                                placeholder="Select Vendor Name"
                                selectOptions={buildCustomerSelectOptions(vendorDropDownList, values.branchId)}
                                loading={vendorLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Vendor Available</div>}
                                required
                              />
                            ) : (
                              <CustomInput type="text" name="vendor" label="Vendor Name" value={purchaseOrderData?.vendor?.customerDisplayName} disabled />
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="purchaseOrderId"
                            label="Purchase Order#"
                            placeholder="Enter Purchase Order"
                            value={values.purchaseOrderId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.purchaseOrderId}
                            touched={touched.purchaseOrderId}
                            setFieldValue={setFieldValue}
                            disabled={purchaseOrderConfig?.autoGenerate || purchaseId}
                            suffix={
                              !purchaseId && (
                                <Tooltip title="Configure Payment Received Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="date"
                            label="Date"
                            value={values.date ? values.date : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.date}
                            touched={touched.date}
                            placeholder="Select Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />
                          <CustomInput
                            type="date"
                            name="deliveryDate"
                            label="Delivery Date"
                            value={values.deliveryDate ? values.deliveryDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.deliveryDate}
                            touched={touched.deliveryDate}
                            placeholder="Select Delievery Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />

                          <CustomInput
                            type="text"
                            name="reference"
                            label="Reference"
                            value={values.reference}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.reference}
                            touched={touched.reference}
                            setFieldValue={setFieldValue}
                            placeholder="Enter Reference"
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
                            name="fgBOMItem"
                            label="FG BOM Item"
                            placeholder="Select FG BOM Item"
                            mode="multiple"
                            dropdownStyle={{ width: '50%', borderRadius: 0 }}
                            dropdownMatchSelectWidth={false}
                            value={values.fgBOMItem}
                            onChange={e => {
                              setFieldValue('fgBOMItem', e);

                              const selectedFGs = fgBomItemDrop.filter(fg => e.includes(fg._id));

                              const selectedBOMItems = selectedFGs.flatMap(fg =>
                                (fg.bomBased || []).map(b => ({
                                  fgId: fg._id,
                                  itemId: b.item._id,
                                }))
                              );

                              const currentItems = [...(values.items || [])];

                              const previouslySelected = values.fgBOMItem || [];
                              const deselectedFGs = previouslySelected.filter(id => !e.includes(id));

                              const deselectedItemIds = fgBomItemDrop.filter(fg => deselectedFGs.includes(fg._id)).flatMap(fg => (fg.bomBased || []).map(b => b.item._id));

                              let filteredItems = currentItems.filter(itm => !deselectedItemIds.includes(itm.itemId));

                              const newItemIds = selectedBOMItems.map(i => i.itemId);
                              const existingIds = filteredItems.map(i => i.itemId);

                              const itemsToAdd = newItemIds
                                .filter(id => !existingIds.includes(id))
                                .map(itemId => {
                                  const selectedItem = findItem(itemId, allItemDrop) || {};
                                  const selectedUnit = defaultDocumentLineUnit(selectedItem, MODULE_TYPE.PURCHASE);
                                  return {
                                    itemId,
                                    itemName: selectedItem?.itemName || '',
                                    itemNo: selectedItem?.itemNo || '',
                                    hsnCode: selectedItem?.hsnCode || '',
                                    gst: selectedItem?.gst || 0,
                                    rate: selectedUnit.option?.purchasePrice ?? selectedItem?.purchaseInformation?.costPrice ?? 0,
                                    quantity: 1.0,
                                    itemUnit: selectedUnit.itemUnit || selectedItem?.itemUnitId?.name || selectedItem?.itemUnit || '',
                                    itemUnitId: selectedUnit.itemUnitId || null,
                                  };
                                });

                              const firstRow = filteredItems[0];
                              if (firstRow && !firstRow.itemId && itemsToAdd.length > 0) {
                                const firstItemToFill = itemsToAdd.shift();
                                filteredItems[0] = {
                                  ...filteredItems[0],
                                  ...firstItemToFill,
                                };
                              }

                              const finalItems = [...filteredItems, ...itemsToAdd];

                              const safeItems =
                                finalItems.length > 0
                                  ? finalItems
                                  : [
                                      {
                                        itemId: null,
                                        itemName: '',
                                        itemNo: '',
                                        description: '',
                                        hsnCode: '',
                                        gst: '0',
                                        taxAmount: '0.00',
                                        quantity: '1.00',
                                        rate: '0.00',
                                        amount: '0.00',
                                      },
                                    ];

                              setFieldValue('items', safeItems);

                              calculateAmounts(
                                { ...values, items: safeItems },
                                setFieldValue,
                                purchaseOrderData?.appliesTo && !changeDiscountConfig ? { appliesTo: purchaseOrderData?.appliesTo } : moduleConfig?.discountConfig
                              );
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.fgBOMItem}
                            touched={touched.fgBOMItem}
                            setFieldValue={setFieldValue}
                            loading={FGLoading}
                            selectVariant="twoColumn"
                            columnSelectHeader={itemSelectColumnHeader}
                            selectOptions={buildItemFilterSelectOptions(fgBomItemDrop)}
                          />

                          <div className="md:col-start-1 lg:col-start-1">
                            <CustomInput
                              name="shippingAddressType"
                              label=""
                              type="radio"
                              value={values.shippingAddressType}
                              onChange={e => {
                                setFieldValue('customer', null);
                                setFieldValue('addressId', null);
                                setSelectedAddress(null);
                                setSelectedCustomerId(null);
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
                              disabled={purchaseId}
                            />
                            {values?.shippingAddressType === 'Organization' && (
                              <AdditionalAddressContainer
                                customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
                                addressLoading={profileLoading}
                                fetchCustomerAddress={values?.shippingAddressType === 'Customer' ? fetchCustomerAddress : fetchProfileAddress}
                                selectedCustomer={values?.shippingAddressType === 'Customer' ? selectedCustomerId : null}
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
                                  name="customer"
                                  label="Customer Name"
                                  value={values.customer}
                                  onChange={e => {
                                    setFieldValue('addressId', null);
                                    setSelectedAddress(null);
                                    setFieldValue('customer', e);
                                    setSelectedCustomerId(e);
                                    fetchCustomerAddress(e);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.customer}
                                  touched={touched.customer}
                                  setFieldValue={setFieldValue}
                                  placeholder="Select Customer Name"
                                  selectVariant="twoColumn"
                                  columnSelectHeader={customerSelectColumnHeader}
                                  selectOptions={buildCustomerSelectOptions(customerDropDownList)}
                                  loading={customerLoading}
                                  notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                  required
                                />
                                {values?.customer && (
                                  <AdditionalAddressContainer
                                    customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
                                    addressLoading={addressLoading}
                                    fetchCustomerAddress={values?.shippingAddressType === 'Customer' ? fetchCustomerAddress : fetchProfileAddress}
                                    selectedCustomer={values?.shippingAddressType === 'Customer' ? selectedCustomerId : null}
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
                      selectedCustomerData={selectedVendorData}
                      touched={touched}
                      preserveDocumentTaxRate={isDuplicate}
                      discountConfig={
                        purchaseOrderData?.appliesTo && !changeDiscountConfig
                          ? {
                              appliesTo: purchaseOrderData?.appliesTo,
                            }
                          : moduleConfig?.discountConfig
                      }
                      moduleType={MODULE_TYPE.PURCHASE}
                      page={MODULE_NAMES.PURCHASE_ORDER}
                      pageType={pageTypes.PURCHASE_ORDER}
                      currency={documentCurrency}
                      excludeDocumentId={purchaseId || undefined}
                    />
                    {/* Attach File(s) & TotalContainer section */}
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                      {/* Left side: Attach File(s) */}
                      <div className="flex-1 w-full lg:max-w-[480px]">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <CustomFileUpload
                            name="attachments"
                            label="Attach Files(s) to Purchase Order"
                            value={values.attachments}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            errorMessage={errors.attachments}
                            touched={touched.attachments}
                            fileType="all"
                            multiple={true}
                            maxSize={5}
                            maxFiles={3}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Right side: TotalContainer */}
                      <div className="w-full lg:w-auto shrink-0">
                        <TotalContainer
                          profile={profile}
                          selectedCustomer={selectedVendorData}
                          values={values}
                          setFieldValue={setFieldValue}
                          calculateAmounts={calculateAmounts}
                          discountConfig={
                            purchaseOrderData?.appliesTo && !changeDiscountConfig
                              ? {
                                  appliesTo: purchaseOrderData?.appliesTo,
                                }
                              : moduleConfig?.discountConfig
                          }
                          currency={documentCurrency}
                        />
                      </div>
                    </div>

                    {/* Customer Notes & Terms & Conditions (grid col 2) */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        <CustomInput
                          type="textarea"
                          name="customerNotes"
                          label="Customer Notes"
                          placeholder="Enter Customer Note"
                          value={values.customerNotes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.customerNotes}
                          touched={touched.customerNotes}
                          setFieldValue={setFieldValue}
                          rows={3}
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
                          rows={3}
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

                            formikRef.current.setFieldValue('status', '');
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
                        {!purchaseId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Sent"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              if (!values?.addressId) {
                                Toast.error('Address is required');
                                return;
                              }

                              formikRef.current.setFieldValue('status', BACKEND_ENUM?.SENT);
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
                        )}
                        <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading || submitWithStatusLoading} onClick={goBack} />
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
        initialConfig={purchaseOrderConfig}
        resource={RESOURCES.PURCHASE_ORDER}
        setConfigDetail={config => {
          setPurchaseOrderConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES?.PURCHASE_ORDER}
      />
      {!purchaseId && (
        <DocumentConfigSheet
          resource={RESOURCES.PURCHASE_ORDER}
          open={isPurchaseOrderConfigOpen}
          onClose={handleClosePurchaseOrderConfig}
          onSave={handleSavePurchaseOrderConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || purchaseOrderConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={purchaseOrderConfigSaving}
        />
      )}
      <DocumentActivationModal
        open={!!pendingActivation}
        documentLabel="purchase order"
        partyLabel={confirmModalEnum.DOCUMENT_ACTIVATION.VENDOR_LABEL}
        partyName={pendingActivation?.needsVendor ? selectedVendorData?.customerDisplayName : null}
        branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name || purchaseOrderData?.branchName}
        warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name || purchaseOrderData?.warehouseName}
        itemNames={pendingActivation?.itemNames}
        loading={submitLoading || submitWithStatusLoading}
        onConfirm={async () => {
          await onFinish(pendingActivation.values, { activationConfirmed: true });
          setPendingActivation(null);
        }}
        onCancel={() => setPendingActivation(null)}
      />
      {creditLimitAlertOpen && <CreditLimitAlert open={creditLimitAlertOpen} onClose={() => setCreditLimitAlertOpen(false)} alertData={creditLimitAlertData} />}
    </>
  );
};

export default AddPurchaseOrder;
