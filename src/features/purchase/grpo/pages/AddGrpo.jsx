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
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import {
  buildConversionItemsDrop,
  getBranchSelectPlaceholder,
  getDivisionBranchFromWarehouseOption,
  getWarehouseSelectPlaceholder,
  useDivisionBranchWarehouseWithResource,
} from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import usePurchaseSaveActivation from '@/hooks/usePurchaseSaveActivation';

// Extras
import { useGRPO, grpoValidateSchema, GRPOTransformer, stripGrpoForDuplicate } from '@/features/purchase/grpo';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { applyBatchMandatoryFlags, grpoInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculateDueDate } from 'utils/services';
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

const AddGrpo = () => {
  const formikRef = useRef(null);
  const { grpoId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { submitLoading, grpoOrder, resetGrpo, getGrpoById, createGrpos, updateGrpos, loading: grpoLoading } = useGRPO();
  const duplicateFromId = !grpoId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const grpoData = useMemo(() => {
    const rawData = grpoId || isDuplicate ? grpoOrder : location.state?.grpoData;
    if (!rawData || !isDuplicate) return rawData;
    return stripGrpoForDuplicate(rawData);
  }, [grpoOrder, grpoId, isDuplicate, location.state?.grpoData]);
  const isConverted = !!(grpoData?.purchaseOrders?.length > 0);
  const updatedGrpoDataRef = useRef(grpoData);
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, getCustomerDropList, loading: vendorLoading } = useCustomer();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const { paymentTermsDrop, paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTerm, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { profile, companyProfileSettings, getCompanyProfileSettings, address, getProfileAddress, resetAddress, loading: profileLoading } = useProfile();
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
  } = useDivisionBranchWarehouseWithResource(grpoData, RESOURCES.GRPO, {
    skipLocationDropdowns: !!grpoId || isConverted,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });
  const [selectedVendor, setSelectedVendor] = useState(grpoData?.vendor?.id || grpoData?.vendor?._id || '');
  const vendorFromDocument = grpoData?.vendor ? { ...grpoData.vendor, id: grpoData.vendor._id || grpoData.vendor.id } : {};
  const selectedVendorData = grpoId || isConverted ? vendorFromDocument : vendorDropDownList?.find(cust => cust._id === selectedVendor) || vendorFromDocument;
  const conversionItemsDrop = useMemo(() => (isConverted ? buildConversionItemsDrop(grpoData?.items, allItemDrop) : []), [isConverted, grpoData?.items, allItemDrop]);
  const itemsDropForTable = isConverted ? conversionItemsDrop : allItemDrop;
  const { pendingActivation, setPendingActivation, resolveActivation } = usePurchaseSaveActivation({
    vendor: selectedVendorData,
    branchId: selectedBranchId,
    itemsDrop: allItemDrop,
    itemsDropLoading: allItemDropLoading,
    getVendorDropList: grpoId || isConverted ? getVendorDropList : undefined,
  });
  const { currency } = useCompanyCurrency();
  const documentCurrency = selectedVendorData?.currency || grpoData?.currency || currency;
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [grpoConfig, setGrpoConfig] = useState({
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
  const discountConfigHandledRef = useRef(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [inventoryChoiceModalVisible, setInventoryChoiceModalVisible] = useState(false);
  const inventoryModalShownRef = useRef(false);

  // Document Configuration Sheet Hook
  const {
    isOpen: isGrpoConfigOpen,
    handleOpen: handleOpenGrpoConfig,
    handleClose: handleCloseGrpoConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.GRPO,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveGrpoConfig,
    drawerSaveLoading: grpoConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isGrpoConfigOpen,
    moduleConfig: grpoConfig,
    setModuleConfig: setGrpoConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseGrpoConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.GRPO,
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
        moduleName: MODULE_NAMES.GRPO,
        customerId: formikRef.current?.values?.vendor || grpoData?.vendor?._id || grpoData?.vendor?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update GRPO configuration',
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
    getCompanyProfileSettings({ signal: controller.signal });

    return () => {
      Modal.destroyAll();
      resetCustomerDropDownList();
      resetCustomerAddress();
      resetAddress();
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (grpoId || isDuplicate) {
      if (grpoData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.GRPO,
          customerId: grpoData?.vendor?._id || grpoData?.vendor?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.GRPO,
        customerId: grpoData?.vendor?._id || grpoData?.vendor?.id,
      });
    }

    const resolveCustomerId = customer => customer?._id || customer?.id || customer;

    if ((grpoId || isDuplicate) && grpoData) {
      if (grpoData?.customer) {
        const customerId = resolveCustomerId(grpoData.customer);
        if (customerId && lastFetchedAddressCustomerIdRef.current !== customerId) {
          fetchCustomerAddress(customerId);
        }
      } else if (lastFetchedAddressCustomerIdRef.current !== 'PROFILE') {
        fetchProfileAddress();
      }
    } else if (!grpoId && !isDuplicate) {
      if (grpoData?.customer) {
        const customerId = resolveCustomerId(grpoData.customer);
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
  }, [grpoId, isDuplicate, grpoData, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (isConverted || grpoId) return;
    if (vendorDropDownList?.length > 0 && grpoData?.vendor) {
      let findCustomerExists = vendorDropDownList?.find(customer => customer?._id === grpoData?.vendor?.id || customer?._id === grpoData?.vendor?._id);
      if (!findCustomerExists) {
        formikRef.current?.setFieldValue('vendor', null);
        setShowCustomerError(true);
      }
    }
  }, [vendorDropDownList, grpoData, isConverted, grpoId]);

  useEffect(() => {
    if (grpoId || isConverted || !selectedBranchId) return;
    fetchVendorDrop(selectedBranchId);
  }, [selectedBranchId, grpoId, isConverted]);

  useEffect(() => {
    if (!grpoId || !selectedBranchId) return;
    const controller = new AbortController();
    getCustomerDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [grpoId, selectedBranchId, getCustomerDropList]);

  useEffect(() => {
    if (moduleConfig) {
      setGrpoConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !grpoId && grpoConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (grpoConfig.autoGenerate) {
        const newGrpoOrderId = `${grpoConfig.prefix}${grpoConfig.nextNumber}`;
        formikRef.current.setFieldValue('grpoOrderId', newGrpoOrderId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!grpoData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [grpoConfig, grpoId, grpoData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (grpoId) {
      getGrpoById({ grpoId, signal: controller.signal });
    } else if (duplicateFromId) {
      getGrpoById({ grpoId: duplicateFromId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetVendorDropDownList();
      resetCustomerDropDownList();
    };
  }, [grpoId, duplicateFromId, getGrpoById, resetVendorDropDownList, resetCustomerDropDownList]);

  useEffect(() => {
    if (!grpoId && !duplicateFromId) {
      resetGrpo();
    }

    return () => {
      resetGrpo();
    };
  }, [grpoId, duplicateFromId, resetGrpo]);

  useEffect(() => {
    if (grpoOrder) {
      setSelectedVendor(grpoData?.vendor?.id || grpoData?.vendor?._id || '');
      setDivisionBranchWarehouseFromEntity(grpoData);
      setSelectedCustomerId(grpoData?.customer?._id || grpoData?.customer?.id || '');
      discountConfigHandledRef.current = false;
    }
  }, [grpoOrder, grpoData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (!grpoId && isConverted && grpoData) {
      setDivisionBranchWarehouseFromEntity(grpoData);
      setSelectedVendor(grpoData?.vendor?.id || grpoData?.vendor?._id || '');
    }
  }, [grpoId, isConverted, grpoData, setDivisionBranchWarehouseFromEntity]);

  // PO → GRPO: item select is disabled, so set batch mandatory flags from item master once loaded.
  useEffect(() => {
    const showBatchNo = companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO';
    if (!showBatchNo || !isConverted || !allItemDrop?.length || !formikRef.current) return;

    const currentItems = formikRef.current.values?.items || [];
    const updatedItems = applyBatchMandatoryFlags(currentItems, allItemDrop, grpoData?.items);
    const flagsChanged = updatedItems.some(
      (item, index) => item.batchNumberMandatory !== currentItems[index]?.batchNumberMandatory || item.batchExpiryDateMandatory !== currentItems[index]?.batchExpiryDateMandatory
    );
    if (flagsChanged) {
      formikRef.current.setFieldValue('items', updatedItems);
    }
  }, [allItemDrop, isConverted, grpoData?.items, companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource]);

  useEffect(() => {
    const inventoryConfig = companyProfileSettings?.inventoryConfig;
    if (!inventoryConfig) return;
    const isGrpoSource = inventoryConfig?.purchaseFlowStockAddSource === 'GRPO';
    const isCustomerShipping = formikRef.current?.values?.shippingAddressType === 'Customer' || !!grpoData?.customer;
    const shouldShow = !grpoId && !isDuplicate && isGrpoSource && isCustomerShipping && !inventoryModalShownRef.current;
    if (shouldShow) {
      inventoryModalShownRef.current = true;
      setInventoryChoiceModalVisible(true);
    }
  }, [companyProfileSettings?.inventoryConfig, grpoId, isDuplicate, grpoData?.customer]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      if ((grpoId || isDuplicate) && grpoLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === grpoData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress?.[0] || null;

      if (grpoId || isDuplicate) {
        if (grpoData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [customerAddress, grpoData, grpoLoading, moduleConfigLoading, grpoId, isDuplicate]);

  useEffect(() => {
    if (address?.length > 0) {
      if ((grpoId || isDuplicate) && grpoLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === grpoData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (grpoId || isDuplicate) {
        if (grpoData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, grpoData, grpoLoading, moduleConfigLoading, grpoId, isDuplicate]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedVendorData?._id) return;
    const discountCfg = grpoData?.appliesTo && !changeDiscountConfig ? { appliesTo: grpoData?.appliesTo } : moduleConfig?.discountConfig;
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
    const currentValues = formikRef?.current?.values;
    const rawValues = grpoInitialValues(
      moduleConfig,
      changeDiscountConfig ? { ...updatedGrpoDataRef.current, addressId: currentValues?.addressId } : { ...grpoData, addressId: currentValues?.addressId },
      moduleConfig?.termsandConditions || '',
      defaultPaymentTermsId,
      allItemDrop,
      companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO' ? true : false,
      Boolean(grpoId)
    );
    // A duplicate keeps the source's payment terms but drops its dueDate, so derive
    // the dueDate from those terms rather than leaving it blank.
    const duplicateDueDate = isDuplicate ? calculateDueDate(grpoData?.paymentTermsId || defaultPaymentTerm) : null;

    return {
      ...rawValues,
      isInventoryEnabled: currentValues?.isInventoryEnabled ?? grpoData?.inventoryConfig?.stockAddEnabled ?? grpoData?.isInventoryEnabled ?? false,
      date: rawValues.date ? dayjs(rawValues.date) : dayjs(),
      dueDate: duplicateDueDate ? dayjs(duplicateDueDate) : rawValues.dueDate ? dayjs(rawValues.dueDate) : null,
    };
  }, [
    grpoData,
    additionalChargesConfig,
    changeDiscountConfig,
    isDuplicate,
    defaultPaymentTermsId,
    defaultPaymentTerm,
    // allItemDrop,
  ]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['grpoOrderId', 'addressId'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const findItem = (itemId, itemsDrop) => {
    return (itemsDrop || []).find(item => String(item._id || item.id) === String(itemId));
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

    const data = GRPOTransformer(
      {
        ...values,
        taxContext: buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || ''),
        appliesTo:
          grpoData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: grpoData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      grpoData,
      grpoId,
      // Extract attachments from Formik values (can be File objects or URL strings)
      Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [],
      grpoData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: grpoData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    Object.assign(data, activationFlags);
    const result = grpoId ? await updateGrpos({ grpoId, grpoData: data }) : await createGrpos(data);

    // Check for credit limit error first (special handling - show alert)
    if (result?.payload?.code === 0 && result?.payload?.data?.isCreditLimitError) {
      setCreditLimitAlertOpen(true);
      setCreditLimitAlertData(result?.payload);
      return; // Don't navigate if credit limit error
    }

    if (shouldPreventNavigation(result)) {
      return;
    }

    // For successful updates/creates, always navigate
    // When editing, use grpoId from route; when creating, use ID from result
    const targetId = grpoId || result?.payload?.data?.id;

    if (targetId) {
      // Navigate to detail page after successful save
      navigateAfterSave(`/grpo/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      // Fallback: navigate back if no ID available
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
      appliesTo: grpoData?.appliesTo,
      discountConfig: grpoData?.discountConfig,
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
      updatedGrpoDataRef.current = {
        // ...grpoData,
        ...(formikRef?.current?.values || {}),
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (grpoData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== grpoData?.appliesTo && !discountConfigHandledRef.current) {
      handleDiscountConfigChange();
      discountConfigHandledRef.current = true;
    }
  }, [moduleConfig, grpoData]);

  useEffect(() => {
    if (grpoId || !grpoData || !isConverted) return;
    if (!formikRef.current) return;
    const paymentTerms = grpoData?.paymentTermsId || defaultPaymentTerm;
    formikRef.current?.setFieldValue('paymentTermsId', paymentTerms?._id || paymentTerms?.id || defaultPaymentTermsId);
    formikRef.current?.setFieldValue('dueDate', dayjs(calculateDueDate(paymentTerms)));
  }, [grpoData, grpoId, isConverted, defaultPaymentTerm, defaultPaymentTermsId]);

  if ((grpoId || isDuplicate) && (grpoLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{grpoId ? `Edit GRPO / ${grpoData?.grpoOrderId}` : 'Add GRPO'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVendor && <CustomerBasicDetail customerData={selectedVendorData} isVendor={true} wrapperClassName="flex items-center" />}
            {!grpoId && (
              <Button type="default" onClick={handleOpenGrpoConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                GRPO Configuration
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={grpoValidateSchema(grpoConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!grpoId && !isConverted ? (
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
                              setSelectedCustomerId(null);
                              dispatch(resetBranch());
                            }}
                            disabled={isConverted}
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
                            }}
                            disabled={isConverted || (warehouseRequiresCascade && !values.divisionId)}
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
                            disabled={isConverted || (warehouseRequiresCascade && !values.branchId)}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={grpoData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={grpoData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={grpoData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Header fields */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 pt-2 items-start relative">
                          <div className="relative">
                            {documentCurrency && selectedVendor && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!grpoId && !isConverted ? (
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
                                    grpoData?.appliesTo && !changeDiscountConfig
                                      ? {
                                          appliesTo: grpoData?.appliesTo,
                                        }
                                      : moduleConfig?.discountConfig
                                  );
                                  const vendorPaymentTerms = findSelectedVendor?.paymentTermsId || defaultPaymentTerm;
                                  setFieldValue('paymentTermsId', vendorPaymentTerms?._id || vendorPaymentTerms?.id || defaultPaymentTermsId, false);
                                  setFieldValue('dueDate', dayjs(calculateDueDate(vendorPaymentTerms)), false);
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
                                disabled={isConverted}
                                required
                              />
                            ) : (
                              <CustomInput type="text" name="vendor" label="Vendor Name" value={grpoData?.vendor?.customerDisplayName} disabled />
                            )}
                          </div>

                          {grpoData?.purchaseOrders?.length > 0 && (
                            <CustomInput
                              type="text"
                              name="purchaseOrderNo"
                              label="Purchase Order#"
                              placeholder="Enter Purchase Order"
                              value={grpoData?.purchaseOrders?.map(order => order?.purchaseOrderNo).join(', ') || ''}
                              disabled
                            />
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="grpoOrderId"
                            label="GRPO Order#"
                            placeholder="Enter GRPO Order"
                            value={values.grpoOrderId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.grpoOrderId}
                            touched={touched.grpoOrderId}
                            setFieldValue={setFieldValue}
                            disabled={grpoConfig?.autoGenerate || grpoId}
                            suffix={
                              !grpoId && (
                                <Tooltip title="Configure GRPO Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="date"
                            label="Delivery Date"
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
                            name="dueDate"
                            label="Due Date"
                            value={values.dueDate ? values.dueDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.dueDate}
                            touched={touched.dueDate}
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
                            onChange={e => {
                              const selectedPaymentTerm = paymentTermsDrop?.find(term => term.id === e);
                              setFieldValue('dueDate', dayjs(calculateDueDate(selectedPaymentTerm)));
                              setFieldValue('paymentTermsId', e);
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.paymentTermsId}
                            touched={touched.paymentTermsId}
                            setFieldValue={setFieldValue}
                            selectOptions={paymentTermsOptions}
                            loading={paymentTermsDropLoading}
                            required={true}
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
                                if (e?.target?.value === 'Customer') {
                                  const isGrpoSource = companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO';
                                  if (!grpoId && isGrpoSource && !inventoryModalShownRef.current) {
                                    inventoryModalShownRef.current = true;
                                    setInventoryChoiceModalVisible(true);
                                  }
                                }
                                if (e?.target?.value === 'Organization') {
                                  setFieldValue('isInventoryEnabled', false);
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
                              disabled={grpoId}
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

                          {values?.shippingAddressType === 'Customer' && companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO' && (
                            <div className="pt-2">
                              <Tooltip
                                title={grpoId ? 'The inventory effect cannot be changed after the GRPO is created.' : 'Enable this if the goods should be added to your inventory from this GRPO.'}
                                placement="top"
                              >
                                <span className="inline-block">
                                  <CustomInput
                                    type="checkbox"
                                    name="isInventoryEnabled"
                                    CheckboxName="Manage inventory effect (add stock from this GRPO)"
                                    value={values.isInventoryEnabled}
                                    onBlur={handleBlur}
                                    setFieldValue={setFieldValue}
                                    errorMessage={errors.isInventoryEnabled}
                                    touched={touched.isInventoryEnabled}
                                    disabled={!!grpoId}
                                  />
                                </span>
                              </Tooltip>
                            </div>
                          )}

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
                      showInventoryWarning={companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO'}
                      values={values}
                      arr={values.items}
                      findItem={findItem}
                      itemsDrop={itemsDropForTable}
                      itemsDropLoading={allItemDropLoading}
                      setFieldValue={setFieldValue}
                      calculateAmounts={calculateAmounts}
                      errors={errors}
                      handleBlur={handleBlur}
                      handleChange={handleChange}
                      selectedCustomerData={selectedVendorData}
                      touched={touched}
                      disabled={isConverted}
                      preserveDocumentTaxRate={isDuplicate}
                      discountConfig={
                        grpoData?.appliesTo && !changeDiscountConfig
                          ? {
                              appliesTo: grpoData?.appliesTo,
                            }
                          : moduleConfig?.discountConfig
                      }
                      isShowBatchNo={companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource === 'GRPO' ? true : false}
                      moduleType={MODULE_TYPE.PURCHASE}
                      page={MODULE_NAMES.GRPO}
                      pageType={pageTypes.GRPO}
                      currency={documentCurrency}
                      excludeDocumentId={grpoId || undefined}
                    />
                    {/* Attach File(s) & TotalContainer section */}
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                      {/* Left side: Attach File(s) */}
                      <div className="flex-1 w-full lg:max-w-[480px]">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <CustomFileUpload
                            name="attachments"
                            label="Attach Files(s) to GRPO"
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
                            grpoData?.appliesTo && !changeDiscountConfig
                              ? {
                                  appliesTo: grpoData?.appliesTo,
                                }
                              : moduleConfig?.discountConfig
                          }
                          currency={documentCurrency}
                          disabled={isConverted}
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
        initialConfig={grpoConfig}
        resource={RESOURCES.GRPO}
        setConfigDetail={config => {
          setGrpoConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES?.GRPO}
      />
      {!grpoId && (
        <DocumentConfigSheet
          resource={RESOURCES.GRPO}
          open={isGrpoConfigOpen}
          onClose={handleCloseGrpoConfig}
          onSave={handleSaveGrpoConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || grpoConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={grpoConfigSaving}
        />
      )}
      <DocumentActivationModal
        open={!!pendingActivation}
        documentLabel="GRPO"
        partyLabel={confirmModalEnum.DOCUMENT_ACTIVATION.VENDOR_LABEL}
        partyName={pendingActivation?.needsVendor ? selectedVendorData?.customerDisplayName : null}
        branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name || grpoData?.branchName}
        warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name || grpoData?.warehouseName}
        itemNames={pendingActivation?.itemNames}
        loading={submitLoading}
        onConfirm={async () => {
          await onFinish(pendingActivation.values, { activationConfirmed: true });
          setPendingActivation(null);
        }}
        onCancel={() => setPendingActivation(null)}
      />
      {creditLimitAlertOpen && <CreditLimitAlert open={creditLimitAlertOpen} onClose={() => setCreditLimitAlertOpen(false)} alertData={creditLimitAlertData} />}
      <CustomModal
        modalOpen={inventoryChoiceModalVisible}
        setModalOpen={open => {
          if (!open) {
            formikRef.current?.setFieldValue('isInventoryEnabled', false);
            setInventoryChoiceModalVisible(false);
          }
        }}
        title="Manage inventory"
        width={440}
      >
        <p className="text-gray-700">Do you want to manage inventory effect here (add stock from this GRPO)?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            key="no"
            onClick={() => {
              formikRef.current?.setFieldValue('isInventoryEnabled', false);
              setInventoryChoiceModalVisible(false);
            }}
          >
            No
          </Button>
          <Button
            key="yes"
            type="primary"
            onClick={() => {
              formikRef.current?.setFieldValue('isInventoryEnabled', true);
              setInventoryChoiceModalVisible(false);
            }}
          >
            Yes, manage inventory
          </Button>
        </div>
      </CustomModal>
    </>
  );
};

export default AddGrpo;
