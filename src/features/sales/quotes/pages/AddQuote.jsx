import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import { Button, Tooltip } from '@/components/AntDComponent';
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import CreditLimitAlert from '@/components/feedback/formModal/CreditLimitAlert';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import DiscountConfigChangeContent from '@/components/dataDisplay/statCard/DiscountConfigChangeContent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import ItemTable from '@/components/dataDisplay/appTable/ItemTable';
import Toast from '@/components/ui/common/Toast';
import { checkSalesItemsBeforeSave } from '@/utils/itemLineStatus';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal.jsx';

// Hooks
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useQuotes, quoteValidateSchema, quoteTransformer, stripQuoteForDuplicate } from '@/features/sales/quotes';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { quoteInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculatePriceListChange } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';
import {
  applyDefaultItemRatesByPriceList,
  buildLegacyCustomerPriceListConfirmState,
  createItemDropdownFetcher,
  findItemById,
  getCustomerPriceListId,
  getDiscountConfigForRecalculate,
  isIncludePriceListItemOnly,
  resetSalesItemsForPriceList,
  resolveSalesItemDropdownParams,
  showPriceListResetConfirm,
} from '@/utils/salesModuleUtils';

const AddQuote = () => {
  const formikRef = useRef(null);
  const { quoteId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { submitLoading, submitWithStatusLoading, quote, createQuotes, updateQuotes, getQuoteById, resetQuote, loading } = useQuotes();
  const duplicateFromId = !quoteId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const quoteData = useMemo(() => {
    if (!quote || !isDuplicate) return quote;
    return stripQuoteForDuplicate(quote);
  }, [quote, isDuplicate]);
  const updatedQuoteDataRef = useRef(quoteData);
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
    customerDropDownList,
    resetCustomerDropDownList,
    customerLoading,
    priceListDrop,
    priceListDropLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    selectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    selectedCustomerId,
    setSelectedCustomerId,
    customerNotInBranch,
    getAllItemDrop,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(quoteData, RESOURCES.QUOTES, {
    skipLocationDropdowns: !!quoteId,
    skipAutoItemDrop: true,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });
  const { currency } = useCompanyCurrency();
  const customerFromDocument = quoteData?.customerId ? { ...quoteData.customerId, id: quoteData.customerId._id || quoteData.customerId.id } : {};
  const selectedCustomerData = quoteId ? customerFromDocument : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || customerFromDocument;
  const documentCurrency = selectedCustomerData?.currency || quoteData?.currency || currency;
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { profile } = useProfile();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [quoteConfig, setQuoteConfig] = useState({
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
  const [itemDropPriceListId, setItemDropPriceListId] = useState(null);
  const initialAddressId = useRef(null);

  // Document Configuration Sheet Hook
  const {
    isOpen: isQuotationConfigOpen,
    handleOpen: handleOpenQuotationConfig,
    handleClose: handleCloseQuotationConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.QUOTATION,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveQuotationConfig,
    drawerSaveLoading: quotationConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isQuotationConfigOpen,
    moduleConfig: quoteConfig,
    setModuleConfig: setQuoteConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseQuotationConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.QUOTATION,
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
        moduleName: MODULE_NAMES.QUOTATION,
        customerId: formikRef.current?.values?.customerId || quoteData?.customerId?._id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update quote configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const lastFetchedAddressCustomerIdRef = useRef(null);
  const lastFetchedItemDropKeyRef = useRef(null);
  const itemDropAbortControllerRef = useRef(null);

  const fetchItemDropdown = createItemDropdownFetcher({
    getAllItemDrop,
    lastFetchedItemDropKeyRef,
    itemDropAbortControllerRef,
  });

  const fetchCustomerAddress = customerId => {
    lastFetchedAddressCustomerIdRef.current = customerId || null;
    setSelectedAddress(null);
    initialAddressId.current = null;
    formikRef.current?.setFieldValue('addressId', null);
    getCustomerAddress({ customerId });
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (quoteId || isDuplicate) {
      if (quoteData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.QUOTATION,
          customerId: quoteData?.customerId?._id || quoteData?.customerId?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.QUOTATION,
        customerId: quoteData?.customerId?._id || quoteData?.customerId?.id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [quoteId, isDuplicate, quoteData, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setQuoteConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !quoteId && quoteConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (quoteConfig.autoGenerate) {
        const newQuoteId = `${quoteConfig.prefix}${quoteConfig.nextNumber}`;
        formikRef.current.setFieldValue('quoteNumber', newQuoteId);
      }
      formikRef.current.setFieldValue('autoGenerate', quoteConfig?.autoGenerate || false);
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultDivisionId = moduleConfig?.defaultConfiguration?.divisionId;
      const defaultBranchId = moduleConfig?.defaultConfiguration?.branchId;
      const defaultWarehouseId = moduleConfig?.defaultConfiguration?.warehouseId;

      if (!hasSelectedValues && !isDuplicate) {
        formikRef.current.setFieldValue('divisionId', defaultDivisionId);
        formikRef.current.setFieldValue('branchId', defaultBranchId);
        formikRef.current.setFieldValue('warehouseId', defaultWarehouseId);

        if (defaultDivisionId) setSelectedDivisionId(defaultDivisionId);
        if (defaultBranchId) setSelectedBranchId(defaultBranchId);
        if (defaultWarehouseId) setSelectedWarehouseId(defaultWarehouseId);
      }

      if (defaultBranchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [quoteConfig, moduleConfig, quoteId, isDuplicate, setSelectedDivisionId, setSelectedBranchId, setSelectedWarehouseId]);

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(() => {
    const rawValues = quoteInitialValues(
      moduleConfig,
      changeDiscountConfig ? { ...updatedQuoteDataRef.current, addressId: initialAddressId.current } : { ...quoteData, addressId: initialAddressId.current },
      moduleConfig?.termsandConditions || '',
      'DRAFT',
      defaultPaymentTermsId,
      Boolean(quoteId)
    );

    return {
      ...rawValues,
      attachments: quoteData?.attachments || [],
      quoteDate: rawValues.quoteDate ? dayjs(rawValues.quoteDate) : dayjs(),
      expiryDate: rawValues.expiryDate ? dayjs(rawValues.expiryDate) : null,
    };
  }, [quoteData, additionalChargesConfig, changeDiscountConfig, defaultPaymentTermsId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['quoteNumber', 'autoGenerate'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (customerNotInBranch) {
      formikRef.current?.setFieldValue('customerId', null);
      setShowCustomerError(true);
    }
  }, [customerNotInBranch]);

  const onFinish = async values => {
    if (!validateDocumentTotalBeforeSave(values)) {
      Toast.error(DOCUMENT_TOTAL_MIN_MESSAGE);
      return;
    }
    if (!values?.addressId) return;

    // Block the save when a newly added item is inactive / not available in the selected warehouse.
    const itemBlockMsg = checkSalesItemsBeforeSave({
      items: values.items,
      itemsDrop: allItemDrop,
      itemsDropLoading: allItemDropLoading,
      originalItems: quoteData?.items,
      documentLabel: 'quotation',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading || submitWithStatusLoading) return;

    const targetStatus = values?.status || null;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const quoteDataPayload = quoteTransformer(
      {
        ...values,
        ...(!quoteId ? { status: '' } : {}),
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state),
        appliesTo:
          quoteData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: quoteData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      quoteId,
      attachments,
      quoteData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: quoteData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    const createArg = !quoteId && targetStatus ? { ...quoteDataPayload, status: targetStatus } : quoteDataPayload;
    const result = quoteId ? await updateQuotes({ quoteId, quoteData: quoteDataPayload }) : await createQuotes(createArg);

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
    // When editing, use quoteId from route; when creating, use ID from result
    const targetId = quoteId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (targetId) {
      // Navigate to detail page after successful save
      navigateAfterSave(`/quotes/${targetId}`, {
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

  const discountConfigForRecalculate = getDiscountConfigForRecalculate({ documentData: quoteData, changeDiscountConfig, moduleConfig });

  const handleDefaultItemRateChanges = (values, itemsArr, setFieldValue, type = 'default', priceListExists) => {
    const updatedItems = applyDefaultItemRatesByPriceList({
      items: itemsArr,
      priceListExists,
      allItemDrop,
      type,
    });

    const nextPriceListId = getCustomerPriceListId(priceListExists);
    setFieldValue('priceList', nextPriceListId || undefined);
    setFieldValue('items', updatedItems);
    setItemDropPriceListId(nextPriceListId || null);
    calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfigForRecalculate);
  };

  const handleConfirmModal = (data, values, itemsArr, setFieldValue, type, priceListExists) => {
    data.onOk = () => handleDefaultItemRateChanges(values, itemsArr, setFieldValue, type, priceListExists);
    let modal = ConfirmModal(data);

    modal.showModal();
  };

  const handleCustomerSelectionChange = ({ nextCustomerId, values, setFieldValue }) => {
    const previousCustomerId = values?.customerId;
    const prevCustomerDetail = customerDropDownList?.find(cust => cust.id === previousCustomerId) || {};
    const newCustomerDetail = customerDropDownList?.find(cust => cust.id === nextCustomerId) || {};
    const newCustomerPriceListId = getCustomerPriceListId(newCustomerDetail);
    const hasLineItems = values?.items?.some(item => item?.itemId);
    const includePriceListOnly = isIncludePriceListItemOnly(newCustomerDetail);

    const commitCustomerSelection = () => {
      setFieldValue('customerId', nextCustomerId);
      const taxContext = buildTaxContext(profile, newCustomerDetail, newCustomerDetail?.address?.shipping?.state);
      setFieldValue('taxContext', taxContext);
      calculateAmounts({ ...values, taxContext }, setFieldValue, discountConfigForRecalculate);
      setSelectedCustomerId(nextCustomerId);
      fetchCustomerAddress(nextCustomerId);
      setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1);
      setFieldValue('paymentTermsId', newCustomerDetail?.paymentTermsId?._id || newCustomerDetail?.paymentTermsId?.id || newCustomerDetail?.paymentTermsId || defaultPaymentTermsId);
    };

    if (includePriceListOnly && hasLineItems) {
      setFieldValue('customerId', previousCustomerId || null);
      showPriceListResetConfirm({
        onOk: () => {
          commitCustomerSelection();
          resetSalesItemsForPriceList({
            values,
            setFieldValue,
            priceListId: newCustomerPriceListId,
            setItemDropPriceListId,
            calculateAmounts,
            discountConfig: discountConfigForRecalculate,
          });
        },
      });
      return;
    }

    commitCustomerSelection();

    if (includePriceListOnly && !values?.priceList) {
      setFieldValue('priceList', newCustomerPriceListId || undefined);
      setItemDropPriceListId(newCustomerPriceListId || null);
      return;
    }

    const shouldOpenLegacyPriceListConfirm = previousCustomerId && values?.priceList && (prevCustomerDetail?.priceList?.items?.length > 0 || newCustomerDetail?.priceList?.items?.length > 0);
    const shouldOpenExistingPriceListConfirm = nextCustomerId && values?.priceList;

    if (shouldOpenLegacyPriceListConfirm || shouldOpenExistingPriceListConfirm) {
      setItemDropPriceListId(values?.priceList || null);

      const { title, okText, cancelText, type, priceListExists } = buildLegacyCustomerPriceListConfirmState({
        values,
        nextCustomerId,
        customerDropDownList,
        newCustomerPriceListId,
        confirmModalEnum,
      });

      handleConfirmModal(
        {
          ...getPriceListChangeConfirmModalProps({ message: title }),
          okText,
          cancelText,
          type,
          onCancel: () => setItemDropPriceListId(values?.priceList || null),
        },
        values,
        values?.items,
        setFieldValue,
        type,
        priceListExists
      );
      return;
    }

    setItemDropPriceListId(newCustomerPriceListId || null);
    setFieldValue('priceList', newCustomerPriceListId || undefined);
  };

  const handlePriceListSelectionChange = ({ nextPriceListId, values, setFieldValue }) => {
    const includePriceListOnly = isIncludePriceListItemOnly(selectedCustomerData);
    const previousPriceList = values?.priceList;
    const hasLineItems = values?.items?.some(item => item?.itemId);

    const applyPriceListChange = () => {
      if (includePriceListOnly) {
        resetSalesItemsForPriceList({
          values,
          setFieldValue,
          priceListId: nextPriceListId,
          setItemDropPriceListId,
          calculateAmounts,
          discountConfig: discountConfigForRecalculate,
        });
        return;
      }

      const updatedItems = calculatePriceListChange(values, priceListDrop, nextPriceListId, allItemDrop);
      setFieldValue('items', updatedItems);
      setFieldValue('priceList', nextPriceListId);
      setItemDropPriceListId(nextPriceListId || null);
      calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfigForRecalculate);
    };

    if (includePriceListOnly && previousPriceList !== nextPriceListId && hasLineItems) {
      setFieldValue('priceList', previousPriceList);
      showPriceListResetConfirm({ onOk: applyPriceListChange });
      return;
    }

    applyPriceListChange();
  };

  const handleDiscountConfigChange = () => {
    const previousConfig = {
      appliesTo: quoteData?.appliesTo,
      discountConfig: quoteData?.discountConfig,
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
      updatedQuoteDataRef.current = {
        ...quoteData,
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    const controller = new AbortController();
    if (quoteId) {
      getQuoteById({ quoteId, signal: controller.signal });
    } else if (duplicateFromId) {
      getQuoteById({ quoteId: duplicateFromId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [quoteId, duplicateFromId, getQuoteById, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (quote) {
      setDivisionBranchWarehouseFromEntity(quote);
      const customerId = quote?.customerId?._id || quote?.customerId?.id;
      if (!customerId || lastFetchedAddressCustomerIdRef.current === customerId) return;
      fetchCustomerAddress(customerId);
    }
  }, [quote, setDivisionBranchWarehouseFromEntity]);

  useEffect(() => {
    if (!selectedWarehouseId) return;

    const customer = selectedCustomerId ? (quoteId || isDuplicate ? selectedCustomerData : customerDropDownList?.find(cust => cust.id === selectedCustomerId)) : null;

    if (selectedCustomerId && isIncludePriceListItemOnly(customer) && !itemDropPriceListId) {
      fetchItemDropdown({ warehouseId: selectedWarehouseId });
      return;
    }

    const params = resolveSalesItemDropdownParams({
      warehouseId: selectedWarehouseId,
      customerId: selectedCustomerId,
      customer,
      priceListId: itemDropPriceListId,
    });

    if (!params) return;
    fetchItemDropdown(params);
  }, [
    selectedWarehouseId,
    selectedCustomerId,
    itemDropPriceListId,
    customerDropDownList,
    quoteId,
    isDuplicate,
    selectedCustomerData?.includePriceListItemOnly,
    selectedCustomerData?.otherDetails?.includePriceListItemOnly,
  ]);

  useEffect(() => {
    return () => {
      itemDropAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (quoteData?.priceListId) {
      setItemDropPriceListId(quoteData.priceListId);
    }
  }, [quoteData?.priceListId]);

  useEffect(() => {
    if (!quoteId && !duplicateFromId) {
      resetQuote();
    }

    return () => {
      resetQuote();
    };
  }, [quoteId, duplicateFromId]);

  useEffect(() => {
    if (quoteData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== quoteData?.appliesTo) {
      handleDiscountConfigChange();
    }
  }, [moduleConfig, quoteData]);
  useEffect(() => {
    if (!customerAddress?.length) return;

    const savedId = quoteData?.addressId || quoteData?.addressId?._id || quoteData?.addressId?.id;
    const selectedId = selectedAddress?._id;
    if (selectedId && initialAddressId.current && selectedId !== initialAddressId.current) return;

    const nextAddress = customerAddress.find(address => address?._id === savedId) || customerAddress.find(address => address?.isDefault) || customerAddress[0];
    setSelectedAddress(nextAddress);
    initialAddressId.current = nextAddress?._id || null;
    formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
  }, [customerAddress, quoteData?.addressId]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedCustomerData?.id) return;
    const newCustomerState = selectedAddress?.state || '';
    const discountCfg = quoteData?.appliesTo && !changeDiscountConfig ? { appliesTo: quoteData?.appliesTo } : moduleConfig?.discountConfig;
    const newTaxContext = buildTaxContext(profile, selectedCustomerData, newCustomerState);
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
  }, [selectedAddress, selectedCustomerData]); // eslint-disable-line react-hooks/exhaustive-deps

  if ((quoteId || isDuplicate) && (loading || moduleConfigLoading || !quoteData)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{quoteId ? `Edit Quote / ${quoteData?.quoteId}` : 'Add Quote'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!quoteId && (
              <Button type="default" onClick={handleOpenQuotationConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Quote Configuration
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={quoteValidateSchema(quoteConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!quoteId ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="select"
                            name="divisionId"
                            label="Division"
                            placeholder="Select division"
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
                              setFieldValue('customerId', null, false);
                              dispatch(resetBranch());
                            }}
                            disabled={quoteId}
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
                            onChange={e =>
                              applyBranchSelection(e, {
                                setFieldValue,
                                setFieldTouched,
                                values,
                              })
                            }
                            disabled={!!quoteId || (warehouseRequiresCascade && !values.divisionId)}
                            loading={branchLoading}
                          />
                          <CustomInput
                            type="select"
                            name="warehouseId"
                            label="Warehouse"
                            placeholder={getWarehouseSelectPlaceholder(warehouseRequiresCascade, values)}
                            value={values.warehouseId}
                            onChange={e =>
                              applyWarehouseSelection(e, {
                                setFieldValue,
                                setFieldTouched,
                                currentBranchId: values.branchId,
                                values,
                              })
                            }
                            onBlur={handleBlur}
                            errorMessage={errors.warehouseId}
                            touched={touched.warehouseId}
                            setFieldValue={setFieldValue}
                            required={true}
                            selectVariant="twoColumn"
                            columnSelectHeader={warehouseSelectColumnHeader}
                            selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                            disabled={!!quoteId || (warehouseRequiresCascade && !values.branchId)}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={quoteData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={quoteData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={quoteData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative min-w-0">
                            {documentCurrency && selectedCustomerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!quoteId ? (
                              <CustomInput
                                type="select"
                                selectVariant="twoColumn"
                                columnSelectHeader={{ id: 'Customer ID', name: 'Customer Name' }}
                                name="customerId"
                                label="Customer"
                                value={values.customerId}
                                onChange={e => handleCustomerSelectionChange({ nextCustomerId: e, values, setFieldValue })}
                                onBlur={handleBlur}
                                errorMessage={errors.customerId}
                                touched={touched.customerId}
                                setFieldValue={setFieldValue}
                                placeholder="Select customer"
                                selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                                disabled={quoteId}
                                loading={customerLoading}
                                required={true}
                              />
                            ) : (
                              <CustomInput type="text" name="customerId" label="Customer" value={quoteData?.customerId?.customerDisplayName} disabled />
                            )}
                            {values?.customerId && (
                              <AdditionalAddressContainer
                                customerAddress={customerAddress}
                                addressLoading={addressLoading}
                                fetchCustomerAddress={fetchCustomerAddress}
                                selectedCustomer={selectedCustomerId}
                                setFieldValue={setFieldValue}
                                selectedAddress={selectedAddress}
                                setSelectedAddress={setSelectedAddress}
                              />
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="quoteNumber"
                            label="Quote Number"
                            value={values.quoteNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.quoteNumber}
                            touched={touched.quoteNumber}
                            setFieldValue={setFieldValue}
                            placeholder="Enter Quote Number"
                            disabled={quoteConfig?.autoGenerate || quoteId}
                            suffix={
                              !quoteId && (
                                <Tooltip title="Configure Quotation Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />
                          <CustomInput
                            type="date"
                            name="quoteDate"
                            label="Quote Date"
                            value={values.quoteDate ? values.quoteDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.quoteDate}
                            touched={touched.quoteDate}
                            placeholder="Select Quote Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />
                          <CustomInput
                            type="date"
                            name="expiryDate"
                            label="Expiry Date"
                            value={values.expiryDate ? values.expiryDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.expiryDate}
                            touched={touched.expiryDate}
                            placeholder="Select Expiry Date"
                            format="YYYY-MM-DD"
                          />
                          <CustomInput
                            type="text"
                            name="reference"
                            label="Reference #"
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
                            allowClear={true}
                          />
                          <CustomInput
                            type="select"
                            name="priceList"
                            label="Price List"
                            placeholder="Select Price List"
                            value={values?.priceList}
                            onChange={e => handlePriceListSelectionChange({ nextPriceListId: e, values, setFieldValue })}
                            onBlur={handleBlur}
                            errorMessage={errors.priceList}
                            touched={touched.priceList}
                            setFieldValue={setFieldValue}
                            selectVariant="twoColumn"
                            columnSelectHeader={priceListSelectColumnHeader}
                            selectOptions={buildPriceListSelectOptions(priceListDrop)}
                            loading={priceListDropLoading}
                            allowClear={true}
                          />
                          <CustomInput
                            type="textarea"
                            name="subject"
                            label="Subject"
                            placeholder="Enter Subject"
                            value={values.subject}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.subject}
                            touched={touched.subject}
                            setFieldValue={setFieldValue}
                          />
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

                      <ItemTable
                        values={values}
                        arr={values.items}
                        findItem={findItemById}
                        itemsDrop={allItemDropLoading ? [] : allItemDrop}
                        itemsDropLoading={allItemDropLoading}
                        setFieldValue={setFieldValue}
                        calculateAmounts={calculateAmounts}
                        errors={errors}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                        selectedCustomerData={selectedCustomerData}
                        activePriceListItems={priceListDrop?.find(pl => pl?.id === values?.priceList)?.items}
                        touched={touched}
                        preserveDocumentTaxRate={isDuplicate}
                        discountConfig={discountConfigForRecalculate}
                        moduleType={MODULE_TYPE.SALES}
                        pageType={pageTypes.QUOTE}
                        currency={documentCurrency}
                        excludeDocumentId={quoteId || undefined}
                      />
                      {/* Attach File(s) & TotalContainer section */}
                      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                        {/* Left side: Attach File(s) */}
                        <div className="flex-1 w-full lg:max-w-[480px]">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <CustomFileUpload
                              name="attachments"
                              label="Attach File(s) to Quote"
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
                            selectedCustomer={{ ...selectedCustomerData, address: { ...selectedCustomerData?.address, shipping: selectedAddress || selectedCustomerData?.address?.shipping } }}
                            values={values}
                            setFieldValue={setFieldValue}
                            calculateAmounts={calculateAmounts}
                            currency={documentCurrency}
                            discountConfig={discountConfigForRecalculate}
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
                  </div>
                  {values?.divisionId && values?.branchId && values?.warehouseId && (
                    <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-5 flex-wrap">
                        <CustomButton
                          className="px-8 py-4"
                          type="primary"
                          text="Save"
                          loading={submitLoading}
                          onClick={async () => {
                            formikRef.current.setFieldValue('status', '');
                            let errors = await formikRef.current.validateForm();

                            if (Object.keys(errors).length > 0) {
                              setTouched(errorsToTouched(errors));
                              const firstErrorField = Object.keys(errors)[0];
                              scrollToError(firstErrorField, errors);
                              return;
                            }

                            if (values?.customerId && !values?.addressId) {
                              Toast.error('Address is required');
                              return;
                            }

                            handleSubmit();
                          }}
                        />
                        {!quoteId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Sent"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              formikRef.current.setFieldValue('status', BACKEND_ENUM?.SENT);

                              let errors = await formikRef.current.validateForm();

                              if (Object.keys(errors).length > 0) {
                                setTouched(errorsToTouched(errors));
                                const firstErrorField = Object.keys(errors)[0];
                                scrollToError(firstErrorField, errors);
                                return;
                              }

                              if (values?.customerId && !values?.addressId) {
                                Toast.error('Address is required');
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
        <CodeConfigModal
          isVisible={isConfigModalVisible}
          onCancel={handleConfigModalVisibility}
          loading={moduleConfigLoading}
          initialConfig={quoteConfig}
          resource={RESOURCES.QUOTES}
          setConfigDetail={config => {
            setQuoteConfig(config);
            setDrawerCodeConfig(config);
          }}
          moduleName={MODULE_NAMES?.QUOTATION}
        />
        {creditLimitAlertOpen && <CreditLimitAlert open={creditLimitAlertOpen} onClose={() => setCreditLimitAlertOpen(false)} alertData={creditLimitAlertData} />}
        {!quoteId && (
          <DocumentConfigSheet
            resource={RESOURCES.QUOTES}
            open={isQuotationConfigOpen}
            onClose={handleCloseQuotationConfig}
            onSave={handleSaveQuotationConfig}
            getTermsValue={getTermsAndConditionsValue}
            loading={documentConfigLoading || quotationConfigSaving}
            codeConfigValue={drawerCodeConfig}
            onCodeConfigChange={setDrawerCodeConfig}
            codeConfigDisabled={quotationConfigSaving}
          />
        )}
      </div>
    </>
  );
};

export default AddQuote;
