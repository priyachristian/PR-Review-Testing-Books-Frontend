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
import {
  buildConversionItemsDrop,
  getBranchSelectPlaceholder,
  getDivisionBranchFromWarehouseOption,
  getWarehouseSelectPlaceholder,
  useDivisionBranchWarehouseWithResource,
} from 'hooks/useDivisionBranchWarehouse';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import usePurchaseSaveActivation from '@/hooks/usePurchaseSaveActivation';

// Extras
import { useBill, billsValidateSchema, billTransformer, stripBillForDuplicate } from '@/features/purchase/bills';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { applyBatchMandatoryFlags, billInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculateDueDate, calculateSplitAmount } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { errorsToTouched, shouldPreventNavigation } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { toDecimalString } from '@/utils/currency';
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

const AddBill = () => {
  const formikRef = useRef(null);
  const { billsId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const billModuleName = location.state?.isSplit ? MODULE_NAMES.SPLIT_BILL : MODULE_NAMES.BILL;
  const { submitLoading, submitWithStatusLoading, bill, resetBill, getBillById, createBills, updateBills, loading: billLoading, createSplitBill } = useBill();
  const duplicateFromId = !billsId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const billsData = useMemo(() => {
    const rawData = billsId || isDuplicate ? bill : location.state?.billsData;
    if (!rawData || !isDuplicate) return rawData;
    return stripBillForDuplicate(rawData);
  }, [bill, billsId, isDuplicate, location.state?.billsData]);
  const isConverted = !!(billsData?.purchaseOrders?.length > 0 || billsData?.grpoIds?.length > 0);
  const updatedBillsDataRef = useRef(billsData);
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, loading: customerVendorDropLoading, customerDropDownList, getCustomerDropList, resetCustomerDropDownList } = useCustomer();
  const scrollToError = useScrollToError();
  const { currency } = useCompanyCurrency();
  const { paymentTermsDrop, paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTerm, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { getCompanyProfileSettings, address, getProfileAddress, resetAddress, inventoryConfig, profile, getInventoryConfig, loading: profileLoading } = useProfile();
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
    isSplitWise,
    isSplitSessionActive,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(billsData, RESOURCES.BILLS, {
    skipLocationDropdowns: !!billsId || isConverted,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });

  const [selectedVendor, setSelectedVendor] = useState(billsData?.vendor?.id || billsData?.vendor?._id || '');
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [billConfig, setBillConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [changeDiscountConfig, setChangeDiscountConfig] = useState(false);
  const [showCustomerError, setShowCustomerError] = useState(false);
  const [creditLimitAlertOpen, setCreditLimitAlertOpen] = useState(false);
  const [creditLimitAlertData, setCreditLimitAlertData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(billsData?.customer?._id || billsData?.customer?.id || '');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [inventoryChoiceModalVisible, setInventoryChoiceModalVisible] = useState(false);
  const configSaveAbortRef = useRef(null);
  const inventoryModalShownRef = useRef(false);
  const discountConfigHandledRef = useRef(false);

  const vendorFromDocument = billsData?.vendor ? { ...billsData.vendor, id: billsData.vendor._id || billsData.vendor.id } : {};
  const selectedVendorData = billsId || isConverted ? vendorFromDocument : vendorDropDownList?.find(cust => cust._id === selectedVendor) || vendorFromDocument;
  const documentCurrency = selectedVendorData?.currency || billsData?.currency || currency;
  const conversionItemsDrop = useMemo(() => (isConverted ? buildConversionItemsDrop(billsData?.items, allItemDrop) : []), [isConverted, billsData?.items, allItemDrop]);
  const itemsDropForTable = isConverted ? conversionItemsDrop : allItemDrop;
  const { pendingActivation, setPendingActivation, resolveActivation } = usePurchaseSaveActivation({
    vendor: selectedVendorData,
    branchId: selectedBranchId,
    itemsDrop: allItemDrop,
    itemsDropLoading: allItemDropLoading,
    getVendorDropList: billsId || isConverted ? getVendorDropList : undefined,
  });

  // Document Configuration Sheet Hook
  const {
    isOpen: isBillConfigOpen,
    handleOpen: handleOpenBillConfig,
    handleClose: handleCloseBillConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: billModuleName,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveBillConfig,
    drawerSaveLoading: billConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isBillConfigOpen,
    moduleConfig: billConfig,
    setModuleConfig: setBillConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseBillConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: billModuleName,
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
        moduleName: billModuleName,
        customerId: formikRef.current?.values?.vendor || billsData?.vendor?._id || billsData?.vendor?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update bill configuration',
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

    getCompanyProfileSettings(payload);
    getInventoryConfig(payload);

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

    if (billsId || isDuplicate) {
      if (billsData) {
        getModuleConfig({
          ...payload,
          moduleName: billModuleName,
          customerId: billsData?.vendor?._id || billsData?.vendor?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: billModuleName,
        customerId: billsData?.vendor?._id || billsData?.vendor?.id,
      });
    }

    const resolveCustomerId = customer => customer?._id || customer?.id || customer;

    if ((billsId || isDuplicate) && billsData) {
      if (billsData?.customer) {
        const customerId = resolveCustomerId(billsData.customer);
        if (customerId && lastFetchedAddressCustomerIdRef.current !== customerId) {
          fetchCustomerAddress(customerId);
        }
      } else if (lastFetchedAddressCustomerIdRef.current !== 'PROFILE') {
        fetchProfileAddress();
      }
    } else if (!billsId && !isDuplicate) {
      if (billsData?.customer) {
        const customerId = resolveCustomerId(billsData.customer);
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
  }, [billsId, isDuplicate, billsData, billModuleName, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (isConverted || billsId) return;
    if (vendorDropDownList?.length > 0 && billsData?.vendor) {
      let findCustomerExists = vendorDropDownList?.find(customer => customer?._id === billsData?.vendor?.id || customer?._id === billsData?.vendor?._id);
      if (!findCustomerExists) {
        formikRef.current?.setFieldValue('vendor', null);
        setShowCustomerError(true);
      }
    }
  }, [vendorDropDownList, billsData, isConverted, billsId]);

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
        const newBillId = `${billConfig.prefix}${billConfig.nextNumber}`;
        formikRef.current.setFieldValue('billId', newBillId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!billsData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [billConfig, billsId, billsData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (billsId) {
      getBillById({ billId: billsId, signal: controller.signal });
    } else if (duplicateFromId) {
      getBillById({ billId: duplicateFromId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetVendorDropDownList();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [billsId, duplicateFromId, getBillById, resetVendorDropDownList, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (!billsId && !duplicateFromId) {
      resetBill();
    }

    return () => {
      resetBill();
    };
  }, [billsId, duplicateFromId, resetBill]);

  useEffect(() => {
    if (bill) {
      setSelectedVendor(billsData?.vendor?.id || billsData?.vendor?._id || '');
      setDivisionBranchWarehouseFromEntity(bill);
      discountConfigHandledRef.current = false;
    }
  }, [bill, setDivisionBranchWarehouseFromEntity]);

  useEffect(() => {
    if (!billsId && isConverted && billsData) {
      setDivisionBranchWarehouseFromEntity(billsData);
      setSelectedVendor(billsData?.vendor?.id || billsData?.vendor?._id || '');
    }
  }, [billsId, isConverted, billsData, setDivisionBranchWarehouseFromEntity]);

  useEffect(() => {
    const showBatchNo = inventoryConfig?.purchaseFlowStockAddSource === 'BILL';
    if (!showBatchNo || !isConverted || !allItemDrop?.length || !formikRef.current) return;

    const currentItems = formikRef.current.values?.items || [];
    const updatedItems = applyBatchMandatoryFlags(currentItems, allItemDrop, billsData?.items);
    const flagsChanged = updatedItems.some(
      (item, index) => item.batchNumberMandatory !== currentItems[index]?.batchNumberMandatory || item.batchExpiryDateMandatory !== currentItems[index]?.batchExpiryDateMandatory
    );
    if (flagsChanged) {
      formikRef.current.setFieldValue('items', updatedItems);
    }
  }, [allItemDrop, isConverted, billsData?.items, inventoryConfig?.purchaseFlowStockAddSource]);

  useEffect(() => {
    if (!inventoryConfig) return;
    const isGrpoSource = inventoryConfig?.purchaseFlowStockAddSource === 'GRPO';
    const isBillSource = inventoryConfig?.purchaseFlowStockAddSource === 'BILL';
    const isConvertingFromGrpo = (billsData?.grpoIds?.length ?? 0) > 0;
    const hasCustomer = Boolean(billsData?.customer || selectedCustomer);
    const shouldShowGrpo = isGrpoSource && !isConvertingFromGrpo;
    const shouldShowBill = isBillSource && hasCustomer;
    const shouldShow = !billsId && !isDuplicate && (shouldShowGrpo || shouldShowBill) && !inventoryModalShownRef.current;
    if (shouldShow) {
      inventoryModalShownRef.current = true;
      setInventoryChoiceModalVisible(true);
    }
  }, [inventoryConfig, billsData?.grpoIds, billsData?.customer, selectedCustomer, billsId, isDuplicate]);

  useEffect(() => {
    if (billsId || isConverted || !selectedBranchId) return;
    fetchVendorDrop(selectedBranchId);
  }, [selectedBranchId, billsId, isConverted]);

  useEffect(() => {
    if (!selectedBranchId) return;
    if (!billsId && !isConverted) return;
    const controller = new AbortController();
    getCustomerDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [billsId, isConverted, selectedBranchId, getCustomerDropList]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      if ((billsId || isDuplicate) && billLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === billsData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress?.[0] || null;

      if (billsId || isDuplicate) {
        if (billsData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [customerAddress, billsData, billLoading, moduleConfigLoading, billsId, isDuplicate]);

  useEffect(() => {
    if (address?.length > 0) {
      if ((billsId || isDuplicate) && billLoading) return;
      if (moduleConfigLoading) return;

      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === billsData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (billsId || isDuplicate) {
        if (billsData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, billsData, billLoading, moduleConfigLoading, billsId, isDuplicate]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedVendorData?._id) return;
    const discountCfg = billsData?.appliesTo && !changeDiscountConfig ? { appliesTo: billsData?.appliesTo } : moduleConfig?.discountConfig;
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
    const rawValues = billInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? { ...updatedBillsDataRef.current, addressId: currentValues?.addressId }
        : {
            ...billsData,
            addressId: currentValues?.addressId,
            isSplit: location.state?.isSplit ?? billsData?.isSplit,
          },
      moduleConfig?.termsandConditions || '',
      defaultPaymentTermsId,
      isSplitWise && billsData?.isSplitWise && isSplitSessionActive,
      allItemDrop,
      inventoryConfig?.purchaseFlowStockAddSource === 'BILL' ? true : false,
      Boolean(billsId)
    );
    // A duplicate keeps the source's payment terms but drops its dueDate, so derive
    // the dueDate from those terms rather than leaving it blank.
    const duplicateDueDate = isDuplicate ? calculateDueDate(billsData?.paymentTermsId || defaultPaymentTerm) : null;

    return {
      ...rawValues,
      attachments: billsData?.attachments || [],
      isInventoryEnabled: currentValues?.isInventoryEnabled ?? billsData?.inventoryConfig?.stockAddEnabled ?? false,
      billDate: rawValues.billDate ? dayjs(rawValues.billDate) : dayjs(),
      dueDate: duplicateDueDate ? dayjs(duplicateDueDate) : rawValues.dueDate ? dayjs(rawValues.dueDate) : null,
    };
  }, [billsData, additionalChargesConfig, changeDiscountConfig, isDuplicate, defaultPaymentTermsId, defaultPaymentTerm]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['billId', 'addressId'];
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

    if (submitLoading || submitWithStatusLoading) return;

    // Split bills use their own endpoint, which has no activation flags.
    const activationFlags = location.state?.isSplit ? {} : resolveActivation(values, activationConfirmed);
    if (!activationFlags) return;

    const targetStatus = values?.status || null;

    const billsDataPayload = billTransformer(
      {
        ...values,
        ...(isSplitSessionActive && billsId && billsData?.isSplit && { isSplit: true }),
        taxContext: buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || ''),
        appliesTo:
          billsData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: billsData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      billsData,
      billsId,
      // Extract attachments from Formik values (can be File objects or URL strings)
      Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [],
      billsData?.isSplitWise && isSplitSessionActive,
      billsData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: billsData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    let updatedItems = billsDataPayload?.items?.filter(x => x?.quantity > 0 && x?.rate > 0);
    billsDataPayload.items = updatedItems;
    Object.assign(billsDataPayload, activationFlags);

    const createArg = !billsId && targetStatus ? { ...billsDataPayload, status: targetStatus } : billsDataPayload;
    const result = billsId ? await updateBills({ billsId, billsData: billsDataPayload }) : location.state?.isSplit ? await createSplitBill(createArg) : await createBills(createArg);

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
    // When editing, use billsId from route; when creating, use ID from result
    const targetId = billsId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (targetId) {
      // Navigate to detail page after successful save
      navigateAfterSave(`/bills/${targetId}`, {
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
      appliesTo: billsData?.appliesTo,
      discountConfig: billsData?.discountConfig,
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
      updatedBillsDataRef.current = {
        // ...billsData,
        ...(formikRef?.current?.values || {}),
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (billsData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== billsData?.appliesTo && !discountConfigHandledRef.current) {
      handleDiscountConfigChange();
      discountConfigHandledRef.current = true;
    }
  }, [moduleConfig, billsData]);

  useEffect(() => {
    if (billsId || !billsData) return;
    const isConversion = billsData?.purchaseOrders?.length > 0 || billsData?.grpoIds?.length > 0;
    if (!isConversion) return;
    if (!formikRef.current) return;
    const paymentTerms = billsData?.paymentTermsId || defaultPaymentTerm;
    formikRef.current?.setFieldValue('paymentTermsId', paymentTerms?._id || paymentTerms?.id || defaultPaymentTermsId);
    formikRef.current?.setFieldValue('dueDate', dayjs(calculateDueDate(paymentTerms)));
  }, [billsData, billsId, defaultPaymentTerm, defaultPaymentTermsId]);

  if ((billsId || isDuplicate) && (billLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{billsId ? `Edit Bill / ${billsData?.billId}` : `Add ${location.state?.isSplit ? 'Split' : ''} Bill`}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVendor && <CustomerBasicDetail customerData={selectedVendorData} isVendor={true} wrapperClassName="flex items-center" />}
            {!billsId && (
              <Button type="default" onClick={handleOpenBillConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Bill Configuration
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
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={billsValidateSchema(billConfig?.autoGenerate, billsData?.isSplitWise && isSplitSessionActive)}
            onSubmit={onFinish}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!billsId && !isConverted ? (
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
                              setSelectedCustomer(null);
                              dispatch(resetBranch());
                            }}
                            disabled={billsData?.grpoId || billsData?.grpoIds || billsData?.purchaseOrders?.length > 0}
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
                              setSelectedCustomer(null);
                            }}
                            disabled={billsData?.grpoId || billsData?.grpoIds || billsData?.purchaseOrders?.length > 0 || (warehouseRequiresCascade && !values.divisionId)}
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
                            disabled={!!billsData?.grpoId || !!billsData?.grpoIds || billsData?.purchaseOrders?.length > 0 || (warehouseRequiresCascade && !values.branchId)}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={billsData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={billsData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={billsData?.warehouseName} disabled />
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
                            {!billsId && !isConverted ? (
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
                                  setFieldValue('tax', null, false);
                                  const setFieldValueWithoutValidation = (field, value) => setFieldValue(field, value, false);
                                  calculateAmounts(
                                    { ...values, taxContext, tax: null },
                                    setFieldValueWithoutValidation,
                                    billsData?.appliesTo && !changeDiscountConfig
                                      ? {
                                          appliesTo: billsData?.appliesTo,
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
                                loading={customerVendorDropLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Vendor Available</div>}
                                disabled={billsData?.grpoId || billsData?.grpoIds || billsData?.purchaseOrders?.length > 0}
                                required
                              />
                            ) : (
                              <CustomInput type="text" name="vendor" label="Vendor Name" value={billsData?.vendor?.customerDisplayName} disabled />
                            )}
                          </div>

                          {billsData?.grpoIds?.length > 0 ? (
                            <CustomInput type="text" label="GRPO No#" placeholder="Enter GRPO" value={billsData?.grpoIds?.map(grpo => grpo?.grpoNo).join(', ') || billsData?.grpoNo} disabled />
                          ) : billsData?.purchaseOrders?.length > 0 ? (
                            <CustomInput
                              type="text"
                              label="Purchase Order No#"
                              placeholder="Enter Purchase Order"
                              value={billsData?.purchaseOrders?.map(order => order?.purchaseOrderNo).join(', ') || ''}
                              disabled
                            />
                          ) : null}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="billId"
                            label="Bill#"
                            placeholder="Enter Bill"
                            value={values.billId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.billId}
                            touched={touched.billId}
                            setFieldValue={setFieldValue}
                            disabled={billConfig?.autoGenerate || billsId}
                            suffix={
                              !billsId && (
                                <Tooltip title="Configure Bill Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="billDate"
                            label="Bill Date"
                            value={values.billDate ? values.billDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.billDate}
                            touched={touched.billDate}
                            placeholder="Select Bill Date"
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
                            placeholder="Select Due Date"
                            format="YYYY-MM-DD"
                            required={true}
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
                                setSelectedCustomer(null);
                                if (e?.target?.value === 'Customer') {
                                  const isBillSource = inventoryConfig?.purchaseFlowStockAddSource === 'BILL';
                                  if (!billsId && !isDuplicate && isBillSource && !inventoryModalShownRef.current) {
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
                                  name="customer"
                                  label="Customer Name"
                                  value={values.customer}
                                  onChange={e => {
                                    setFieldValue('addressId', null);
                                    setSelectedAddress(null);
                                    setFieldValue('customer', e);
                                    setSelectedCustomer(e);
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
                                  loading={customerVendorDropLoading}
                                  notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                  required
                                />
                                {values?.customer && (
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

                          {((inventoryConfig?.purchaseFlowStockAddSource === 'GRPO' && !(billsData?.grpoIds?.length > 0)) ||
                            (inventoryConfig?.purchaseFlowStockAddSource === 'BILL' && values?.shippingAddressType === 'Customer')) && (
                            <div className="pt-2">
                              <Tooltip
                                title={
                                  billsId
                                    ? 'The inventory effect cannot be changed after the bill is created.'
                                    : 'Enable this if the goods should be added to your inventory before being delivered to the customer.'
                                }
                                placement="top"
                              >
                                <span className="inline-block">
                                  <CustomInput
                                    type="checkbox"
                                    name="isInventoryEnabled"
                                    CheckboxName="Manage inventory effect (add stock from this bill)"
                                    value={values.isInventoryEnabled}
                                    onBlur={handleBlur}
                                    setFieldValue={setFieldValue}
                                    errorMessage={errors.isInventoryEnabled}
                                    touched={touched.isInventoryEnabled}
                                    disabled={!!billsId}
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

                          {billsData?.isSplitWise && isSplitSessionActive && (
                            <>
                              <CustomInput
                                type="select"
                                name="splitWiseType"
                                label="Split Wise Type"
                                placeholder="Select Split Wise Type"
                                value={values?.splitWiseType || undefined}
                                onChange={e => {
                                  if (e === 'Split By Qty') {
                                    let itemArr = values?.items?.map(x => {
                                      const clone = { ...x };
                                      clone.splitQty = 0;
                                      clone.finalQty = clone?.quantity;
                                      clone.rate = clone?.finalRate;
                                      clone.splitAmount = 0;
                                      clone.splitPercentage = '';
                                      return clone;
                                    });
                                    setFieldValue('splitPercentage', '');
                                    calculateAmounts(
                                      { ...values, items: itemArr },
                                      setFieldValue,
                                      billsData?.appliesTo && !changeDiscountConfig ? { appliesTo: billsData?.appliesTo } : moduleConfig?.discountConfig
                                    );
                                  } else {
                                    let itemArr = values?.items?.map(x => {
                                      const clone = { ...x };
                                      clone.splitRate = 0;
                                      clone.finalRate = clone?.rate;
                                      clone.quantity = clone?.finalQty || clone?.quantity;
                                      clone.splitAmount = 0;
                                      return clone;
                                    });
                                    calculateAmounts(
                                      { ...values, items: itemArr },
                                      setFieldValue,
                                      billsData?.appliesTo && !changeDiscountConfig ? { appliesTo: billsData?.appliesTo } : moduleConfig?.discountConfig
                                    );
                                  }
                                  setFieldValue('splitWiseType', e);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.splitWiseType}
                                touched={touched.splitWiseType}
                                setFieldValue={setFieldValue}
                                selectOptions={[
                                  { value: 'Split By Qty', label: 'Split By Qty' },
                                  { value: 'Split By Price', label: 'Split By Price' },
                                ]}
                              />
                              {values?.splitWiseType === 'Split By Price' && (
                                <CustomInput
                                  type="text"
                                  name="splitPercentage"
                                  label="Split Percentage"
                                  placeholder="Enter Split Percentage"
                                  value={values.splitPercentage}
                                  onChange={e => {
                                    if (e?.target?.value && !isNaN(e?.target?.value)) {
                                      const newValue = parseFloat(e?.target?.value);
                                      setFieldValue(`splitPercentage`, newValue);

                                      const updatedItems = values?.items?.map(item => {
                                        if (!item?.finalRate) {
                                          item.finalRate = parseFloat(item?.rate || 0);
                                        }
                                        const splitPriceByPercentage = (item?.finalRate * newValue) / 100;
                                        const splitRateValue = parseFloat(splitPriceByPercentage);
                                        let splitAmount = calculateSplitAmount({ ...item, splitRate: splitRateValue }, values?.splitWiseType);

                                        return {
                                          ...item,
                                          rate: toDecimalString(parseFloat(item?.finalRate - splitRateValue)),
                                          splitRate: splitPriceByPercentage,
                                          splitAmount: toDecimalString(splitAmount),
                                          splitPercentage: newValue,
                                        };
                                      });

                                      setFieldValue('items', updatedItems);
                                      calculateAmounts(
                                        { ...values, items: updatedItems },
                                        setFieldValue,
                                        billsData?.appliesTo && !changeDiscountConfig ? { appliesTo: billsData?.appliesTo } : moduleConfig?.discountConfig
                                      );
                                    } else if (e?.target?.value === '') {
                                      const updatedItems = values?.items?.map(item => ({
                                        ...item,
                                        rate: item?.finalRate || item?.rate,
                                        splitRate: '',
                                        splitAmount: 0,
                                        splitPercentage: '',
                                      }));
                                      setFieldValue('items', updatedItems);
                                      calculateAmounts(
                                        { ...values, items: updatedItems },
                                        setFieldValue,
                                        billsData?.appliesTo && !changeDiscountConfig ? { appliesTo: billsData?.appliesTo } : moduleConfig?.discountConfig
                                      );
                                    }
                                  }}
                                  maxlength={3}
                                  onBlur={handleBlur}
                                  errorMessage={errors.splitPercentage}
                                  touched={touched.splitPercentage}
                                  setFieldValue={setFieldValue}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ItemTable
                      showInventoryWarning={inventoryConfig?.purchaseFlowStockAddSource === 'BILL' || values.isInventoryEnabled}
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
                      disabled={billsData?.grpoId || (billsData?.grpoIds?.length ?? 0) > 0 || billsData?.purchaseOrders?.length > 0 || billsData?.isSplit}
                      preserveDocumentTaxRate={isDuplicate}
                      splitWiseType={values?.splitWiseType}
                      discountConfig={
                        billsData?.appliesTo && !changeDiscountConfig
                          ? {
                              appliesTo: billsData?.appliesTo,
                            }
                          : moduleConfig?.discountConfig
                      }
                      page={MODULE_NAMES?.BILL}
                      pageType={pageTypes.BILLS}
                      isShowBatchNo={inventoryConfig?.purchaseFlowStockAddSource === 'BILL' ? true : false}
                      moduleType={MODULE_TYPE.PURCHASE}
                      currency={documentCurrency}
                      excludeDocumentId={billsId || undefined}
                    />
                    {/* Attach File(s) & TotalContainer section */}
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                      {/* Left side: Attach File(s) */}
                      <div className="flex-1 w-full lg:max-w-[480px]">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <CustomFileUpload
                            name="attachments"
                            label="Attach Files(s) to Bills"
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
                            billsData?.appliesTo && !changeDiscountConfig
                              ? {
                                  appliesTo: billsData?.appliesTo,
                                }
                              : moduleConfig?.discountConfig
                          }
                          disabled={billsData?.grpoId || (billsData?.grpoIds?.length ?? 0) > 0 || billsData?.purchaseOrders?.length > 0}
                          currency={documentCurrency}
                          directTaxTypes={['TDS', 'TCS']}
                          isDirectTaxApplicable={selectedVendorData?.isVendorDirectTax}
                          documentDate={values.billDate}
                        />
                      </div>
                    </div>

                    {/* Customer Notes & Terms & Conditions (grid col 2) */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
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
                              Toast.error('Please provide an address.');
                              return;
                            }

                            let isItemFullySplit = [];
                            if (values?.splitWiseType === 'Split By Price') {
                              values?.items?.forEach(x => {
                                if (parseFloat(x?.finalRate) === parseFloat(x?.splitRate)) {
                                  isItemFullySplit.push(x);
                                }
                              });
                            }

                            if (isItemFullySplit?.length > 0) {
                              Toast.warning("One or more items in this bill have already been fully split and can't be edited further.");
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
                        {!billsId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Open"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              if (!values?.addressId) {
                                Toast.error('Please provide an address.');
                                return;
                              }

                              let isItemFullySplit = [];
                              if (values?.splitWiseType === 'Split By Price') {
                                values?.items?.forEach(x => {
                                  if (parseFloat(x?.finalRate) === parseFloat(x?.splitRate)) {
                                    isItemFullySplit.push(x);
                                  }
                                });
                              }

                              if (isItemFullySplit?.length > 0) {
                                Toast.warning("One or more items in this bill have already been fully split and can't be edited further.");
                                return;
                              }

                              formikRef.current.setFieldValue('status', BACKEND_ENUM?.OPEN);
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
        initialConfig={billConfig}
        resource={RESOURCES.BILLS}
        setConfigDetail={config => {
          setBillConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={billModuleName}
      />
      {!billsId && (
        <DocumentConfigSheet
          resource={RESOURCES.BILLS}
          open={isBillConfigOpen}
          onClose={handleCloseBillConfig}
          onSave={handleSaveBillConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || billConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={billConfigSaving}
        />
      )}
      <DocumentActivationModal
        open={!!pendingActivation}
        documentLabel="bill"
        partyLabel={confirmModalEnum.DOCUMENT_ACTIVATION.VENDOR_LABEL}
        partyName={pendingActivation?.needsVendor ? selectedVendorData?.customerDisplayName : null}
        branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name || billsData?.branchName}
        warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name || billsData?.warehouseName}
        itemNames={pendingActivation?.itemNames}
        loading={submitLoading || submitWithStatusLoading}
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
        <p className="text-gray-700">Do you want to manage inventory effect here (add stock from this bill)?</p>
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

export default AddBill;
