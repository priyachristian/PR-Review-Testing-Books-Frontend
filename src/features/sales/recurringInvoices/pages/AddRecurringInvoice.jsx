import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import { Button, Tooltip } from '@/components/AntDComponent';
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import DiscountConfigChangeContent from '@/components/dataDisplay/statCard/DiscountConfigChangeContent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import ItemTable from '@/components/dataDisplay/appTable/ItemTable';
import Toast from '@/components/ui/common/Toast';
import { checkSalesItemsBeforeSave } from '@/utils/itemLineStatus';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal';

// Hooks
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useRecurringInvoice, recurringInvoiceValidateSchema, recurringInvoiceTransformer } from '@/features/sales/recurringInvoices';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { recurringInvoiceInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculatePriceListChange } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
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
import { errorsToTouched } from '@/utils/util';

const AddRecurringInvoice = () => {
  const formikRef = useRef(null);
  const { recurringId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    submitLoading,
    recurringInvoice,
    getRecurringInvoicesById,
    resetRecurringInvoice,
    createRecurringInvoices,
    updateRecurringInvoices,
    loading: recurringInvoiceLoading,
  } = useRecurringInvoice();
  const recurringInvoiceData = recurringInvoice || null;
  const updatedRecurringInvoiceDataRef = useRef(recurringInvoiceData);
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
  } = useDivisionBranchWarehouseWithResource(recurringInvoiceData, RESOURCES.RECURRING_INVOICE, {
    skipLocationDropdowns: !!recurringId,
    skipAutoItemDrop: true,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const selectedCustomerData = recurringId
    ? { ...recurringInvoiceData?.customerId, id: recurringInvoiceData?.customerId?._id || recurringInvoiceData?.customerId?.id }
    : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || {};
  const { profile } = useProfile();
  const { currency } = useCompanyCurrency();
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const documentCurrency = selectedCustomerData?.currency || recurringInvoiceData?.currency || currency;
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [invoiceConfig, setInvoiceConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const [changeDiscountConfig, setChangeDiscountConfig] = useState(false);
  const [showCustomerError, setShowCustomerError] = useState(false);
  const scrollToError = useScrollToError();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [itemDropPriceListId, setItemDropPriceListId] = useState(null);
  const initialAddressId = useRef(null);

  // Document Configuration Sheet Hook
  const {
    isOpen: isRecurringInvoiceConfigOpen,
    handleOpen: handleOpenRecurringInvoiceConfig,
    handleClose: handleCloseRecurringInvoiceConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.RECURRING_INVOICE,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveRecurringInvoiceConfig,
    drawerSaveLoading: recurringInvoiceConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isRecurringInvoiceConfigOpen,
    moduleConfig: invoiceConfig,
    setModuleConfig: setInvoiceConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseRecurringInvoiceConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.RECURRING_INVOICE,
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
        moduleName: MODULE_NAMES.RECURRING_INVOICE,
        customerId: formikRef.current?.values?.customerId || recurringInvoiceData?.customerId?._id || recurringInvoiceData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update recurring invoice configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const lastFetchedItemDropKeyRef = useRef(null);
  const itemDropAbortControllerRef = useRef(null);

  const fetchItemDropdown = createItemDropdownFetcher({
    getAllItemDrop,
    lastFetchedItemDropKeyRef,
    itemDropAbortControllerRef,
  });

  const fetchCustomerAddress = customerId => {
    setSelectedAddress(null);
    initialAddressId.current = null;
    formikRef.current?.setFieldValue('addressId', null);
    getCustomerAddress({ customerId });
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (recurringId) {
      if (recurringInvoiceData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.RECURRING_INVOICE,
          customerId: recurringInvoiceData?.customerId?._id || recurringInvoiceData?.customerId?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.RECURRING_INVOICE,
        customerId: recurringInvoiceData?.customerId?._id || recurringInvoiceData?.customerId?.id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [recurringId, recurringInvoiceData, getModuleConfig, resetModuleConfig]);

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
    if (formikRef.current && !recurringId && invoiceConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (invoiceConfig.autoGenerate) {
        const newRecurringId = `${invoiceConfig.prefix}${invoiceConfig.nextNumber}`;
        formikRef.current.setFieldValue('recurringId', newRecurringId);
      }
      formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!recurringInvoiceData?.divisionId && !hasSelectedValues && defaultConfig) {
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
  }, [invoiceConfig, recurringId, recurringInvoiceData, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRecurringInvoice = async () => {
      if (!recurringId) {
        resetRecurringInvoice();
        return;
      }

      try {
        const result = await getRecurringInvoicesById({ recurringId, signal: controller.signal });
        if (controller.signal.aborted) return;

        const customerId = result?.data?.customerId?._id || result?.data?.customerId?.id;
        if (customerId) {
          fetchCustomerAddress(customerId);
        }
      } catch {
        /* aborted or handled by slice */
      }
    };

    loadRecurringInvoice();

    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetRecurringInvoice();
      resetCustomerAddress();
    };
  }, [recurringId, getRecurringInvoicesById, resetRecurringInvoice, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (recurringInvoice) {
      setDivisionBranchWarehouseFromEntity(recurringInvoice);
      setSelectedCustomerId(recurringInvoice?.customerId?.id || recurringInvoice?.customerId?._id || '');
    }
  }, [recurringInvoice, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (!selectedWarehouseId) return;

    const customer = selectedCustomerId ? (recurringId ? selectedCustomerData : customerDropDownList?.find(cust => cust.id === selectedCustomerId)) : null;

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
    recurringId,
    selectedCustomerData?.includePriceListItemOnly,
    selectedCustomerData?.otherDetails?.includePriceListItemOnly,
  ]);

  useEffect(() => {
    if (recurringInvoiceData?.priceListId) {
      setItemDropPriceListId(recurringInvoiceData.priceListId);
    }
  }, [recurringInvoiceData?.priceListId]);

  useEffect(() => {
    return () => {
      itemDropAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (customerNotInBranch) {
      formikRef.current?.setFieldValue('customerId', null);
      setShowCustomerError(true);
    }
  }, [customerNotInBranch]);
  useEffect(() => {
    if (customerAddress?.length > 0) {
      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === recurringInvoiceData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress[0] || null;
      if (recurringId) {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      } else {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    } else if (Array.isArray(customerAddress) && formikRef.current?.values?.customerId) {
      formikRef.current.setFieldError('customerId', undefined);
    }
  }, [customerAddress]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues) return;
    const newCustomerState = selectedAddress?.state || '';
    const discountCfg = recurringInvoiceData?.appliesTo && !changeDiscountConfig ? { appliesTo: recurringInvoiceData?.appliesTo } : moduleConfig?.discountConfig;
    if (currentValues.taxContext) {
      if (currentValues.taxContext.customerState === newCustomerState) return;
      const newTaxContext = { ...currentValues.taxContext, customerState: newCustomerState };
      formikRef.current.setFieldValue('taxContext', newTaxContext);
      calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue, discountCfg);
    } else if (selectedCustomerData?.id) {
      const newTaxContext = buildTaxContext(profile, selectedCustomerData, newCustomerState);
      formikRef.current.setFieldValue('taxContext', newTaxContext);
      calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue, discountCfg);
    }
  }, [selectedAddress, selectedCustomerData]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialValues = useMemo(() => {
    const rawValues = recurringInvoiceInitialValues(
      moduleConfig,
      changeDiscountConfig ? updatedRecurringInvoiceDataRef.current : recurringInvoiceData,
      moduleConfig?.termsandConditions || '',
      defaultPaymentTermsId,
      Boolean(recurringId)
    );

    return {
      ...rawValues,
      startDate: rawValues.startDate ? dayjs(rawValues.startDate) : null,
      endDate: rawValues.endDate ? dayjs(rawValues.endDate) : null,
    };
  }, [recurringInvoiceData, moduleConfig, changeDiscountConfig, defaultPaymentTermsId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['recurringId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

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
      originalItems: recurringInvoiceData?.items,
      documentLabel: 'recurring invoice',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading) return;

    const invoiceDataPayload = recurringInvoiceTransformer(
      {
        ...values,
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state),
        appliesTo:
          recurringInvoiceData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: recurringInvoiceData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      recurringId,
      [],
      recurringInvoiceData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: recurringInvoiceData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    const result = recurringId ? await updateRecurringInvoices({ recurringId, recurringInvoiceData: invoiceDataPayload }) : await createRecurringInvoices(invoiceDataPayload);
    const targetId = recurringId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/recurring-invoices/${targetId}`, {
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

  const discountConfigForRecalculate = getDiscountConfigForRecalculate({
    documentData: recurringInvoiceData,
    changeDiscountConfig,
    moduleConfig,
  });

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
      setFieldValue('tax', null);
      calculateAmounts({ ...values, taxContext, tax: null }, setFieldValue, discountConfigForRecalculate);
      setSelectedCustomerId(nextCustomerId);
      fetchCustomerAddress(nextCustomerId);
      setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1);

      const customerPaymentTerms = newCustomerDetail?.paymentTermsId;
      setFieldValue('paymentTermsId', customerPaymentTerms?._id || customerPaymentTerms?.id || defaultPaymentTermsId);
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
      appliesTo: recurringInvoiceData?.appliesTo,
      discountConfig: recurringInvoiceData?.discountConfig,
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
      updatedRecurringInvoiceDataRef.current = {
        ...recurringInvoiceData,
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (recurringInvoiceData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== recurringInvoiceData?.appliesTo) {
      handleDiscountConfigChange();
    }
  }, [moduleConfig, recurringInvoiceData]);

  if (recurringId && (recurringInvoiceLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{recurringId ? `Edit Recurring Invoice / ${recurringInvoiceData?.recurringInvoiceId}` : 'Add Recurring Invoice'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!recurringId && (
              <Button type="default" onClick={handleOpenRecurringInvoiceConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Recurring Invoice Configuration
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={recurringInvoiceValidateSchema(invoiceConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!recurringId ? (
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
                          <CustomInput type="text" name="divisionId" label="Division" value={recurringInvoiceData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={recurringInvoiceData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={recurringInvoiceData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative">
                            {documentCurrency && values?.customerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!recurringId ? (
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
                              <CustomInput type="text" name="customerId" label="Customer Name" value={recurringInvoiceData?.customerId?.customerDisplayName} disabled />
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
                            name="recurringId"
                            label="Invoice#"
                            placeholder="Enter Invoice"
                            value={values.recurringId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.recurringId}
                            touched={touched.recurringId}
                            setFieldValue={setFieldValue}
                            required={true}
                            disabled={invoiceConfig?.autoGenerate || recurringId}
                            suffix={
                              !recurringId && (
                                <Tooltip title="Configure Invoice Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                          />

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

                          <div className="pt-7">
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
                        disabled={recurringInvoiceData?.quoteId || recurringInvoiceData?.salesOrders?.length > 0 || recurringInvoiceData?.deliveryChallanId}
                        splitWiseType={values?.splitWiseType}
                        discountConfig={
                          recurringInvoiceData?.appliesTo && !changeDiscountConfig
                            ? {
                                appliesTo: recurringInvoiceData?.appliesTo,
                              }
                            : moduleConfig?.discountConfig
                        }
                        moduleType={MODULE_TYPE.SALES}
                        pageType={pageTypes.RECURRING_INVOICE}
                        currency={documentCurrency}
                      />
                      <div className="flex justify-end pt-2">
                        <TotalContainer
                          profile={profile}
                          selectedCustomer={{ ...selectedCustomerData, address: { ...selectedCustomerData?.address, shipping: selectedAddress || selectedCustomerData?.address?.shipping } }}
                          values={values}
                          setFieldValue={setFieldValue}
                          calculateAmounts={calculateAmounts}
                          discountConfig={
                            recurringInvoiceData?.appliesTo && !changeDiscountConfig
                              ? {
                                  appliesTo: recurringInvoiceData?.appliesTo,
                                }
                              : moduleConfig?.discountConfig
                          }
                          currency={documentCurrency}
                          directTaxTypes={['TCS']}
                          isDirectTaxApplicable={selectedCustomerData?.isCustomerDirectTax}
                          documentDate={values.startDate}
                        />
                      </div>

                      {/* Notes & Terms card */}
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-3">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
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
        <CodeConfigModal
          isVisible={isConfigModalVisible}
          onCancel={handleConfigModalVisibility}
          loading={moduleConfigLoading}
          initialConfig={invoiceConfig}
          resource={RESOURCES.RECURRING_INVOICE}
          setConfigDetail={config => {
            setInvoiceConfig(config);
            setDrawerCodeConfig(config);
          }}
          moduleName={MODULE_NAMES?.RECURRING_INVOICE}
        />
        {!recurringId && (
          <DocumentConfigSheet
            resource={RESOURCES.RECURRING_INVOICE}
            open={isRecurringInvoiceConfigOpen}
            onClose={handleCloseRecurringInvoiceConfig}
            onSave={handleSaveRecurringInvoiceConfig}
            getTermsValue={getTermsAndConditionsValue}
            loading={documentConfigLoading || recurringInvoiceConfigSaving}
            codeConfigValue={drawerCodeConfig}
            onCodeConfigChange={setDrawerCodeConfig}
            codeConfigDisabled={recurringInvoiceConfigSaving}
          />
        )}
      </div>
    </>
  );
};

export default AddRecurringInvoice;
