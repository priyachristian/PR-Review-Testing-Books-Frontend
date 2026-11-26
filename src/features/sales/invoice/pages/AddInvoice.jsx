import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import { Button, Modal, Tooltip } from '@/components/AntDComponent';
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import PriceListApplyConfirmModal, { PRICE_LIST_CONFIRM_MODE } from '@/components/feedback/confirmModal/PriceListApplyConfirmModal';
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
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import { buildConversionItemsDrop, getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useInvoice, invoiceValidateSchema, invoiceTransformer, stripInvoiceForDuplicate } from '@/features/sales/invoice';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, NIC_DOC_NUMBER_MAX_LENGTH, pageTypes } from 'utils/constants';
import { invoiceInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculateDueDate, calculatePriceListChange, calculateSplitAmount } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { toDecimalString } from '@/utils/currency';
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
import {
  applyDefaultItemRatesByPriceList,
  buildLegacyCustomerPriceListConfirmState,
  createItemDropdownFetcher,
  findItemById,
  getCustomerPriceListId,
  getDiscountConfigForRecalculate,
  isIncludePriceListItemOnly,
  resetSalesItemsForPriceList,
  revertConvertedItemsToSource,
  resolveSalesItemDropdownParams,
  showPriceListResetConfirm,
  isStockCheckedOn,
} from '@/utils/salesModuleUtils';

const AddInvoice = () => {
  const formikRef = useRef(null);
  const { invoiceId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const invoiceModuleName = location.state?.isSplit ? MODULE_NAMES.SPLIT_INVOICE : MODULE_NAMES.INVOICE;
  const { submitLoading, submitWithStatusLoading, invoice, getInvoiceById, resetInvoice, createInvoices, updateInvoices, loading: invoiceLoading, createSplitInvoice } = useInvoice();
  const duplicateFromId = !invoiceId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const invoiceData = useMemo(() => {
    const rawData = invoiceId || isDuplicate ? invoice : location.state?.invoiceData;
    if (!rawData || !isDuplicate) return rawData;
    return stripInvoiceForDuplicate(rawData);
  }, [invoice, invoiceId, isDuplicate, location.state?.invoiceData]);

  const isConverted = !!(invoiceData?.quoteId || invoiceData?.salesOrders?.length > 0 || invoiceData?.deliveryChallanId || invoiceData?.deliveryChallanIds?.length > 0);
  const updatedInvoiceDataRef = useRef(invoiceData);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const {
    isSplitWise,
    isSplitSessionActive,
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
    getCustomerDropList,
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
    customerLoading,
    getAllItemDrop,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(invoiceData, RESOURCES.INVOICES, {
    skipLocationDropdowns: !!invoiceId || isConverted,
    skipAutoItemDrop: true,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });

  const { currency } = useCompanyCurrency();
  const { paymentTermsDrop, paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTerm, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { profile, getInventoryConfig, inventoryConfig } = useProfile();
  const scrollToError = useScrollToError();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [invoiceConfig, setInvoiceConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [changeDiscountConfig, setChangeDiscountConfig] = useState(false);
  const [showCustomerError, setShowCustomerError] = useState(false);
  const [creditLimitAlertOpen, setCreditLimitAlertOpen] = useState(false);
  const [creditLimitAlertData, setCreditLimitAlertData] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [itemDropPriceListId, setItemDropPriceListId] = useState(null);
  // Pending converted-document price list confirm: { mode, priceList, onConfirm, onCancel } or null.
  const [priceListApplyConfirm, setPriceListApplyConfirm] = useState(null);
  const [inventoryChoiceModalVisible, setInventoryChoiceModalVisible] = useState(false);
  const configSaveAbortRef = useRef(null);
  const discountConfigHandledRef = useRef(false);
  const initialAddressId = useRef(null);
  const inventoryModalShownRef = useRef(false);

  const customerFromDocument = invoiceData?.customerId ? { ...invoiceData.customerId, id: invoiceData.customerId._id || invoiceData.customerId.id } : {};
  const selectedCustomerData = invoiceId || isConverted ? customerFromDocument : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || customerFromDocument;
  const documentCurrency = selectedCustomerData?.currency || invoiceData?.currency || currency;
  const conversionItemsDrop = useMemo(() => (isConverted ? buildConversionItemsDrop(invoiceData?.items, allItemDrop) : []), [isConverted, invoiceData?.items, allItemDrop]);
  const itemsDropForTable = isConverted ? conversionItemsDrop : allItemDrop;

  // Document Configuration Sheet Hook
  const {
    isOpen: isInvoiceConfigOpen,
    handleOpen: handleOpenInvoiceConfig,
    handleClose: handleCloseInvoiceConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: invoiceModuleName,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveInvoiceConfig,
    drawerSaveLoading: invoiceConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isInvoiceConfigOpen,
    moduleConfig: invoiceConfig,
    setModuleConfig: setInvoiceConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseInvoiceConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: invoiceModuleName,
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
        moduleName: invoiceModuleName,
        customerId: formikRef.current?.values?.customerId || invoiceData?.customerId?._id || invoiceData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update invoice configuration',
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

  const fetchCustomerDrop = branchId => {
    getCustomerDropList({ branchId });
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getInventoryConfig(payload);

    return () => {
      Modal.destroyAll();
      controller.abort();
    };
  }, [getInventoryConfig]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (invoiceId || isDuplicate) {
      if (invoiceData) {
        getModuleConfig({
          ...payload,
          moduleName: invoiceModuleName,
          customerId: invoiceData?.customerId?._id || invoiceData?.customerId?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: invoiceModuleName,
        customerId: invoiceData?.customerId?._id || invoiceData?.customerId?.id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [invoiceId, isDuplicate, invoiceData, invoiceModuleName, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setInvoiceConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !invoiceId && invoiceConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (invoiceConfig.autoGenerate) {
        const newInvoiceId = `${invoiceConfig.prefix}${invoiceConfig.nextNumber}`;
        formikRef.current.setFieldValue('invoiceId', newInvoiceId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!invoiceData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [invoiceConfig, invoiceId, invoiceData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (invoiceId) {
      getInvoiceById({ invoiceId, signal: controller.signal });
    } else if (duplicateFromId) {
      getInvoiceById({ invoiceId: duplicateFromId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [invoiceId, duplicateFromId, getInvoiceById, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (!invoiceId && !duplicateFromId) {
      resetInvoice();
    }

    return () => {
      resetInvoice();
    };
  }, [invoiceId, duplicateFromId, resetInvoice]);

  useEffect(() => {
    if (invoice) {
      setDivisionBranchWarehouseFromEntity(invoice);
      setSelectedCustomerId(invoice?.customerId?.id || invoice?.customerId?._id || '');
      discountConfigHandledRef.current = false;
    }
  }, [invoice, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (!invoiceId && isConverted && invoiceData) {
      setDivisionBranchWarehouseFromEntity(invoiceData);
      setSelectedCustomerId(invoiceData?.customerId?.id || invoiceData?.customerId?._id || '');
    }
  }, [invoiceId, isConverted, invoiceData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (!inventoryConfig) return;

    const isDeliveryChallanSource = inventoryConfig?.salesFlowStockDeductSource === 'DELIVERY_CHALLAN';
    const isConvertingFromDeliveryChallan = invoiceData?.deliveryChallanId || (invoiceData?.deliveryChallanIds?.length ?? 0) > 0;

    const shouldShow = !invoiceId && !isDuplicate && isDeliveryChallanSource && !isConvertingFromDeliveryChallan && !inventoryModalShownRef.current;

    if (shouldShow) {
      inventoryModalShownRef.current = true;
      setInventoryChoiceModalVisible(true);
    }
  }, [inventoryConfig, invoiceData?.deliveryChallanId, invoiceData?.deliveryChallanIds, invoiceId, isDuplicate]);

  useEffect(() => {
    if (invoiceData?.branchId) {
      if (!isConverted && !invoiceId && !isDuplicate) {
        fetchCustomerDrop(invoiceData?.branchId);
      }
      const customerId = invoiceData?.customerId?._id || invoiceData?.customerId?.id;
      if (!customerId || lastFetchedAddressCustomerIdRef.current === customerId) return;
      fetchCustomerAddress(customerId);
    }
  }, [invoiceData, isConverted, invoiceId, isDuplicate]);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    if (isConverted) {
      fetchItemDropdown({ warehouseId: selectedWarehouseId });
      return;
    }

    const customer = selectedCustomerId ? (invoiceId || isDuplicate || isConverted ? selectedCustomerData : customerDropDownList?.find(cust => cust.id === selectedCustomerId)) : null;

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
    invoiceId,
    isDuplicate,
    isConverted,
    selectedCustomerData?.includePriceListItemOnly,
    selectedCustomerData?.otherDetails?.includePriceListItemOnly,
  ]);

  useEffect(() => {
    if (invoiceData?.priceListId) {
      setItemDropPriceListId(invoiceData.priceListId);
    }
  }, [invoiceData?.priceListId]);

  useEffect(() => {
    return () => {
      itemDropAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!customerAddress?.length) return;

    const savedId = invoiceData?.addressId || invoiceData?.addressId?._id || invoiceData?.addressId?.id;
    const selectedId = selectedAddress?._id;
    if (selectedId && initialAddressId.current && selectedId !== initialAddressId.current) return;

    const nextAddress = customerAddress.find(address => address?._id === savedId) || customerAddress.find(address => address?.isDefault) || customerAddress[0];
    setSelectedAddress(nextAddress);
    initialAddressId.current = nextAddress?._id || null;
    formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
  }, [customerAddress, invoiceData?.addressId]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedCustomerData?.id) return;
    const newCustomerState = selectedAddress?.state || '';
    const discountCfg = invoiceData?.appliesTo && !changeDiscountConfig ? { appliesTo: invoiceData?.appliesTo } : moduleConfig?.discountConfig;
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

  useEffect(() => {
    if (customerNotInBranch) {
      formikRef.current?.setFieldValue('customerId', null);
      setShowCustomerError(true);
    }
  }, [customerNotInBranch]);

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(() => {
    const currentInventoryState = formikRef.current?.values?.isInventoryEnabled;
    const rawValues = invoiceInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? { ...updatedInvoiceDataRef.current, addressId: initialAddressId.current }
        : {
            ...invoiceData,
            addressId: initialAddressId.current,
            isSplit: location.state?.isSplit ?? invoiceData?.isSplit,
          },
      moduleConfig?.termsandConditions || '',
      defaultPaymentTermsId,
      isSplitWise && invoiceData?.isSplitWise && isSplitSessionActive,
      Boolean(invoiceId)
    );
    // A duplicate keeps the source's payment terms but drops its dueDate, so derive
    // the dueDate from those terms rather than letting it fall back to today.
    const duplicateDueDate = isDuplicate ? calculateDueDate(invoiceData?.paymentTermsId || defaultPaymentTerm) : null;

    return {
      ...rawValues,
      attachments: invoiceData?.attachments || [],
      isInventoryEnabled: currentInventoryState ?? invoiceData?.inventoryConfig?.stockDeductEnabled ?? false,
      invoiceDate: rawValues.invoiceDate ? dayjs(rawValues.invoiceDate) : dayjs(),
      dueDate: duplicateDueDate ? dayjs(duplicateDueDate) : rawValues.dueDate ? dayjs(rawValues.dueDate) : dayjs(),
    };
  }, [invoiceData, additionalChargesConfig, changeDiscountConfig, isDuplicate, defaultPaymentTermsId, defaultPaymentTerm]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['invoices', 'invoiceId', 'additionalcharge', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const onFinish = async values => {
    if (!validateDocumentTotalBeforeSave(values)) {
      Toast.error(DOCUMENT_TOTAL_MIN_MESSAGE);
      return;
    }
    if (!values?.addressId) return;
    if (invoiceData?.deliveryChallanIds?.length > 0) {
      delete invoiceData?.deliveryChallanId;
      delete invoiceData?.deliveryChallanNo;
    }

    // Block the save when a newly added item is inactive / not available in the selected warehouse.
    const itemBlockMsg = checkSalesItemsBeforeSave({
      items: values.items,
      itemsDrop: allItemDrop,
      itemsDropLoading: allItemDropLoading,
      originalItems: invoiceData?.items,
      isConverted,
      documentLabel: 'invoice',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading || submitWithStatusLoading) return;

    const targetStatus = values?.status || null;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const invoiceDataPayload = invoiceTransformer(
      {
        ...values,
        ...(isSplitSessionActive && invoiceId && invoiceData?.isSplit && { isSplit: true }),
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state),
        appliesTo:
          invoiceData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: invoiceData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      invoiceData,
      invoiceId,
      attachments.filter(att => typeof att === 'string'), // Only URLs for transformer
      invoiceData?.isSplitWise && isSplitSessionActive,
      invoiceData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: invoiceData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    // Add all attachments (File objects + URLs) to payload
    invoiceDataPayload.attachments = attachments;

    let updatedItems = invoiceDataPayload?.items?.filter(x => x?.quantity > 0 && x?.rate > 0);
    invoiceDataPayload.items = updatedItems;

    const createArg = !invoiceId && targetStatus ? { ...invoiceDataPayload, status: targetStatus } : invoiceDataPayload;

    const result = invoiceId ? await updateInvoices({ invoiceId, invoiceData: invoiceDataPayload }) : location.state?.isSplit ? await createSplitInvoice(createArg) : await createInvoices(createArg);

    // Check for credit limit error first (special handling - show alert)
    if (result?.payload?.code === 0 && result?.payload?.data?.isCreditLimitError) {
      setCreditLimitAlertOpen(true);
      setCreditLimitAlertData(result?.payload);
      return; // Don't navigate if credit limit error
    }

    if (shouldPreventNavigation(result)) {
      return;
    }

    // For successful updates/creates, navigate to detail page
    // When editing, use invoiceId from route; when creating, use ID from result
    const targetId = invoiceId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (targetId) {
      navigateAfterSave(`/invoices/${targetId}`, {
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

  const discountConfigForRecalculate = getDiscountConfigForRecalculate({
    documentData: invoiceData,
    changeDiscountConfig,
    moduleConfig,
  });

  const handleDefaultItemRateChanges = (values, itemsArr, setFieldValue, type = 'default', priceListExists) => {
    const updatedItems = applyDefaultItemRatesByPriceList({
      items: itemsArr,
      priceListExists,
      allItemDrop: itemsDropForTable,
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
      setFieldValue('tax', null);
      calculateAmounts({ ...values, taxContext, tax: null }, setFieldValue, discountConfigForRecalculate);
      setSelectedCustomerId(nextCustomerId);
      fetchCustomerAddress(nextCustomerId);
      setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1);

      const customerPaymentTerms = newCustomerDetail?.paymentTermsId || defaultPaymentTerm;
      setFieldValue('paymentTermsId', customerPaymentTerms?._id || customerPaymentTerms?.id || defaultPaymentTermsId);
      setFieldValue('dueDate', dayjs(calculateDueDate(customerPaymentTerms)));
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
    const includePriceListOnly = !isConverted && isIncludePriceListItemOnly(selectedCustomerData);
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

      const updatedItems = calculatePriceListChange(values, priceListDrop, nextPriceListId, itemsDropForTable);
      setFieldValue('items', updatedItems);
      setFieldValue('priceList', nextPriceListId);
      setItemDropPriceListId(nextPriceListId || null);
      calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfigForRecalculate);
    };

    // Converted documents carry source rates; if a list is not applied or is removed, revert to those rates.
    const isConvertedDocument = isConverted;
    const findPriceList = priceListId => priceListDrop?.find(priceList => (priceList?.id ?? priceList?._id) === priceListId);
    const revertToSource = priceListId =>
      revertConvertedItemsToSource({
        values,
        setFieldValue,
        sourceItems: initialValues?.items,
        priceListId,
        setItemDropPriceListId,
        calculateAmounts,
        discountConfig: discountConfigForRecalculate,
      });

    if (isConvertedDocument && hasLineItems && previousPriceList && !nextPriceListId) {
      // The select clears the field before calling onChange; keep the list selected until the user confirms.
      setFieldValue('priceList', previousPriceList);
      setPriceListApplyConfirm({
        mode: PRICE_LIST_CONFIRM_MODE.REMOVE,
        priceList: findPriceList(previousPriceList),
        onConfirm: () => revertToSource(null),
        onCancel: () => {},
      });
      return;
    }

    if (isConvertedDocument && hasLineItems && nextPriceListId && previousPriceList !== nextPriceListId) {
      setFieldValue('priceList', nextPriceListId);
      setItemDropPriceListId(nextPriceListId);
      setPriceListApplyConfirm({
        mode: PRICE_LIST_CONFIRM_MODE.APPLY,
        priceList: findPriceList(nextPriceListId),
        onConfirm: applyPriceListChange,
        onCancel: () => revertToSource(initialValues?.priceList),
      });
      return;
    }
    if (includePriceListOnly && previousPriceList !== nextPriceListId && hasLineItems) {
      setFieldValue('priceList', previousPriceList);
      showPriceListResetConfirm({ onOk: applyPriceListChange });
      return;
    }

    applyPriceListChange();
  };

  const handleDiscountConfigChange = () => {
    const previousConfig = {
      appliesTo: invoiceData?.appliesTo,
      discountConfig: invoiceData?.discountConfig,
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
      updatedInvoiceDataRef.current = {
        // ...invoiceData,
        ...(formikRef?.current?.values || {}),
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (invoiceData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== invoiceData?.appliesTo && !discountConfigHandledRef.current) {
      handleDiscountConfigChange();
      discountConfigHandledRef.current = true;
    }
  }, [moduleConfig, invoiceData]);

  if ((invoiceId || isDuplicate) && (invoiceLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{invoiceId ? `Edit Invoice / ${invoiceData?.invoiceId}` : 'Add Invoice'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!invoiceId && (
              <Button type="default" onClick={handleOpenInvoiceConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Invoice Configuration
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
            validationSchema={invoiceValidateSchema(invoiceConfig?.autoGenerate, invoiceData?.isSplitWise && isSplitSessionActive)}
            onSubmit={onFinish}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!invoiceId && !isConverted ? (
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
                              setFieldValue('customerId', null, false);
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
                            onChange={e =>
                              applyBranchSelection(e, {
                                setFieldValue,
                                setFieldTouched,
                                values,
                              })
                            }
                            disabled={warehouseRequiresCascade && !values.divisionId}
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
                            disabled={warehouseRequiresCascade && !values.branchId}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={invoiceData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={invoiceData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={invoiceData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Row 1: Customer Name | Invoice Date | Due Date */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 pt-2 items-start relative">
                          <div className="relative">
                            {documentCurrency && selectedCustomerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!invoiceId && !isConverted ? (
                              <CustomInput
                                type="select"
                                selectVariant="twoColumn"
                                columnSelectHeader={{ id: 'Customer ID', name: 'Customer Name' }}
                                name="customerId"
                                label="Customer Name"
                                value={values.customerId}
                                onChange={e => handleCustomerSelectionChange({ nextCustomerId: e, values, setFieldValue })}
                                onBlur={handleBlur}
                                errorMessage={errors.customerId}
                                touched={touched.customerId}
                                setFieldValue={setFieldValue}
                                placeholder="Select Customer Name"
                                selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                                loading={customerLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                required={true}
                              />
                            ) : (
                              <CustomInput type="text" name="customerId" label="Customer Name" value={invoiceData?.customerId?.customerDisplayName} disabled />
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

                          {invoiceData?.quoteId && <CustomInput type="text" name={'quoteId'} label={'Quote'} value={invoiceData?.quoteNo} disabled />}
                          {invoiceData?.salesOrders?.length > 0 && (
                            <CustomInput type="text" name="salesOrderId" label="Sales Order" value={invoiceData?.salesOrders?.map(order => order.salesOrderNo).join(', ') || ''} disabled />
                          )}
                          {invoiceData?.deliveryChallanIds?.length > 0 && (
                            <CustomInput type="text" name="deliveryChallanId" label="Challan No" value={invoiceData?.deliveryChallanIds?.map(challan => challan.challanId).join(', ') || ''} disabled />
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="invoiceId"
                            label="Invoice#"
                            placeholder="Enter Invoice"
                            value={values.invoiceId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.invoiceId}
                            touched={touched.invoiceId}
                            setFieldValue={setFieldValue}
                            required={true}
                            disabled={invoiceConfig?.autoGenerate || invoiceId}
                            suffix={
                              !invoiceId && (
                                <Tooltip title="Configure Invoice Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                          />

                          <CustomInput
                            type="date"
                            name="invoiceDate"
                            label="Invoice Date"
                            value={values.invoiceDate ? values.invoiceDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.invoiceDate}
                            touched={touched.invoiceDate}
                            placeholder="Select invoice Date"
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
                            type="text"
                            name="referenceNumber"
                            label="Reference Number"
                            placeholder="Enter reference number"
                            value={values.referenceNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.referenceNumber}
                            touched={touched.referenceNumber}
                            setFieldValue={setFieldValue}
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

                          {inventoryConfig?.salesFlowStockDeductSource === 'DELIVERY_CHALLAN' && !invoiceData?.deliveryChallanId && !(invoiceData?.deliveryChallanIds?.length > 0) && (
                            <div className="mt-5 col-span-1 xl:col-span-1 lg:col-span-1 md:col-span-2 sm:col-span-3">
                              <CustomInput
                                type="checkbox"
                                name="isInventoryEnabled"
                                CheckboxName="Manage inventory effect (deduct stock from this invoice)"
                                value={values.isInventoryEnabled}
                                onBlur={handleBlur}
                                setFieldValue={setFieldValue}
                                errorMessage={errors.isInventoryEnabled}
                                touched={touched.isInventoryEnabled}
                                disabled={!!invoiceId}
                              />
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

                          {invoiceData?.isSplitWise && isSplitSessionActive && (
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

                                      return clone;
                                    });
                                    setFieldValue('splitPercentage', '');
                                    calculateAmounts(
                                      { ...values, items: itemArr },
                                      setFieldValue,
                                      invoiceData?.appliesTo && !changeDiscountConfig
                                        ? {
                                            appliesTo: invoiceData?.appliesTo,
                                          }
                                        : moduleConfig?.discountConfig
                                    );
                                  } else {
                                    let itemArr = values?.items?.map(x => {
                                      const clone = { ...x };
                                      clone.splitRate = 0;
                                      clone.finalRate = clone?.rate;
                                      clone.quantity = clone?.finalQty || clone?.quantity;
                                      clone.splitAmount = 0;
                                      clone.splitPercentage = '';

                                      return clone;
                                    });
                                    calculateAmounts(
                                      { ...values, items: itemArr },
                                      setFieldValue,
                                      invoiceData?.appliesTo && !changeDiscountConfig
                                        ? {
                                            appliesTo: invoiceData?.appliesTo,
                                          }
                                        : moduleConfig?.discountConfig
                                    );
                                  }
                                  setFieldValue('splitWiseType', e);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.splitWiseType}
                                touched={touched.splitWiseType}
                                setFieldValue={setFieldValue}
                                selectOptions={[
                                  {
                                    value: 'Split By Qty',
                                    label: 'Split By Qty',
                                  },
                                  {
                                    value: 'Split By Price',
                                    label: 'Split By Price',
                                  },
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

                                      // Apply split percentage to ALL items
                                      const updatedItems = values?.items?.map(item => {
                                        if (!item?.finalRate) {
                                          // Set finalRate if not already set
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
                                        {
                                          ...values,
                                          items: updatedItems,
                                        },
                                        setFieldValue,
                                        invoiceData?.appliesTo && !changeDiscountConfig
                                          ? {
                                              appliesTo: invoiceData?.appliesTo,
                                            }
                                          : moduleConfig?.discountConfig
                                      );
                                    } else if (e?.target?.value === '') {
                                      // Reset all items when split percentage is cleared
                                      const updatedItems = values?.items?.map(item => ({
                                        ...item,
                                        rate: item?.finalRate || item?.rate,
                                        splitRate: '',
                                        splitAmount: 0,
                                        splitPercentage: '',
                                      }));

                                      setFieldValue('items', updatedItems);
                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: updatedItems,
                                        },
                                        setFieldValue,
                                        invoiceData?.appliesTo && !changeDiscountConfig
                                          ? {
                                              appliesTo: invoiceData?.appliesTo,
                                            }
                                          : moduleConfig?.discountConfig
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
                      <ItemTable
                        showInventoryWarning={inventoryConfig?.salesFlowStockDeductSource === 'INVOICE' || values.isInventoryEnabled}
                        showBatchIndicator={isConverted && !invoiceId && (isStockCheckedOn(inventoryConfig, 'INVOICE') || values.isInventoryEnabled)}
                        values={values}
                        arr={values.items}
                        findItem={findItemById}
                        itemsDrop={isConverted ? conversionItemsDrop : allItemDropLoading ? [] : allItemDrop}
                        itemsDropLoading={!isConverted && allItemDropLoading}
                        setFieldValue={setFieldValue}
                        calculateAmounts={calculateAmounts}
                        errors={errors}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                        selectedCustomerData={selectedCustomerData}
                        activePriceListItems={priceListDrop?.find(pl => pl?.id === values?.priceList)?.items}
                        touched={touched}
                        disabled={
                          invoiceData?.quoteId || invoiceData?.salesOrders?.length > 0 || invoiceData?.deliveryChallanId || (invoiceData?.deliveryChallanIds?.length ?? 0) > 0 || invoiceData?.isSplit
                        }
                        preserveDocumentTaxRate={isDuplicate}
                        splitWiseType={values?.splitWiseType}
                        discountConfig={
                          invoiceData?.appliesTo && !changeDiscountConfig
                            ? {
                                appliesTo: invoiceData?.appliesTo,
                              }
                            : moduleConfig?.discountConfig
                        }
                        page={MODULE_NAMES?.INVOICE}
                        moduleType={MODULE_TYPE.SALES}
                        pageType={pageTypes.INVOICE}
                        currency={documentCurrency}
                        excludeDocumentId={invoiceId || undefined}
                      />
                      {/* Attach File(s) & TotalContainer section */}
                      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                        {/* Left side: Attach File(s) */}
                        <div className="flex-1 w-full lg:max-w-[480px]">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <CustomFileUpload
                              name="attachments"
                              label="Attach File(s) to Invoice"
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
                            discountConfig={
                              invoiceData?.appliesTo && !changeDiscountConfig
                                ? {
                                    appliesTo: invoiceData?.appliesTo,
                                  }
                                : moduleConfig?.discountConfig
                            }
                            disabled={invoiceData?.quoteId || invoiceData?.salesOrders?.length > 0 || invoiceData?.deliveryChallanId || (invoiceData?.deliveryChallanIds?.length ?? 0) > 0}
                            currency={documentCurrency}
                            directTaxTypes={['TCS']}
                            isDirectTaxApplicable={selectedCustomerData?.isCustomerDirectTax}
                            documentDate={values.invoiceDate}
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
                          className="px-8 py-4 min-w-[50px]"
                          type="primary"
                          text="Save"
                          loading={submitLoading}
                          onClick={async () => {
                            let isItemFullySplit = [];

                            if (values?.splitWiseType === 'Split By Price') {
                              values?.items?.forEach(x => {
                                if (parseFloat(x?.finalRate) === parseFloat(x?.splitRate)) {
                                  isItemFullySplit.push(x);
                                }
                              });
                            }

                            if (isItemFullySplit?.length > 0) {
                              Toast.warning("One or more items in this invoice have already been fully split and can't be edited further.");
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

                            if (values?.customerId && !values?.addressId) {
                              Toast.error('Address is required');
                              return;
                            }

                            handleSubmit();
                          }}
                        />
                        {!invoiceId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Sent"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              let isItemFullySplit = [];

                              if (values?.splitWiseType === 'Split By Price') {
                                values?.items?.forEach(x => {
                                  if (parseFloat(x?.finalRate) === parseFloat(x?.splitRate)) {
                                    isItemFullySplit.push(x);
                                  }
                                });
                              }

                              if (isItemFullySplit?.length > 0) {
                                Toast.warning("One or more items in this invoice have already been fully split and can't be edited further.");
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
          initialConfig={invoiceConfig}
          resource={RESOURCES.INVOICES}
          setConfigDetail={config => {
            setInvoiceConfig(config);
            setDrawerCodeConfig(config);
          }}
          moduleName={invoiceModuleName}
          maxLength={NIC_DOC_NUMBER_MAX_LENGTH}
        />
        <PriceListApplyConfirmModal
          open={!!priceListApplyConfirm}
          mode={priceListApplyConfirm?.mode}
          priceList={priceListApplyConfirm?.priceList}
          onConfirm={() => {
            priceListApplyConfirm?.onConfirm?.();
            setPriceListApplyConfirm(null);
          }}
          onCancel={() => {
            priceListApplyConfirm?.onCancel?.();
            setPriceListApplyConfirm(null);
          }}
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
          <p className="text-gray-700">Do you want to manage inventory effect here (deduct stock from this invoice)?</p>
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
        {!invoiceId && (
          <DocumentConfigSheet
            resource={RESOURCES.INVOICES}
            open={isInvoiceConfigOpen}
            onClose={handleCloseInvoiceConfig}
            onSave={handleSaveInvoiceConfig}
            getTermsValue={getTermsAndConditionsValue}
            loading={documentConfigLoading || invoiceConfigSaving}
            codeConfigValue={drawerCodeConfig}
            onCodeConfigChange={setDrawerCodeConfig}
            codeConfigDisabled={invoiceConfigSaving}
          />
        )}
      </div>
    </>
  );
};

export default AddInvoice;
