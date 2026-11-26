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
import DocumentActivationModal from '@/components/feedback/confirmModal/DocumentActivationModal';
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
import { checkSalesItemsBeforeSave, isLineUnavailableInWarehouse } from '@/utils/itemLineStatus';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal.jsx';

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
import { useSalesOrder, salesOrderValidateSchema, salesOrderTransformer, stripSalesOrderForDuplicate } from '@/features/sales/salesOrder';
import Icons from 'assets/icons/icon';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { RESOURCES } from '@/utils/jsonFile';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { salesOrderInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculatePriceListChange } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { useSalesOrderTag } from '@/features/allMaster/salesOrderTag';
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
  isCustomerActiveInBranch,
  isIncludePriceListItemOnly,
  resetSalesItemsForPriceList,
  revertConvertedItemsToSource,
  resolveSalesItemDropdownParams,
  showPriceListResetConfirm,
  isStockCheckedOn,
} from '@/utils/salesModuleUtils';

const AddSalesOrder = () => {
  const formikRef = useRef(null);
  const { salesId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { submitLoading, submitWithStatusLoading, salesOrder, createSalesOrder, updateSalesOrder, getSalesOrderById, resetSalesOrder, loading: salesOrderLoading } = useSalesOrder();
  const duplicateFromId = !salesId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const salesOrderData = useMemo(() => {
    const rawData = salesId || isDuplicate ? salesOrder : location.state?.salesOrderData;
    if (!rawData || !isDuplicate) return rawData;
    return stripSalesOrderForDuplicate(rawData);
  }, [salesOrder, salesId, isDuplicate, location.state?.salesOrderData]);
  const fromRejection = !!salesOrderData?.rejectionOrderDetails?.rejectionOrderRef;
  const cameFromRejectionPage = !salesId && Boolean(location.state?.fromRejection);
  const isConverted = !!salesOrderData?.quoteId;
  const isConvertedFromCustomerOrder = !!salesOrderData?.customerOrderId;
  // Sample prices are set per catalog unit, so the unit cannot change for a sample customer order.
  const lockItemUnit = !!(salesOrderData?.sampleCatalogId || salesOrderData?.customerOrderId?.sampleCatalogId);
  const updatedSalesOrderDataRef = useRef(salesOrderData);
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
    selectedBranchId,
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
  } = useDivisionBranchWarehouseWithResource(salesOrderData, RESOURCES.SALES_ORDER, {
    // Customer orders have no location, so it stays selectable on conversion with the customer fixed.
    skipLocationDropdowns: !!salesId || isConverted,
    lockCustomer: !salesId && isConvertedFromCustomerOrder,
    skipItemDropdown: isConverted && !!salesId,
    skipAutoItemDrop: true,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });
  const { currency } = useCompanyCurrency();
  const customerFromDocument = salesOrderData?.customerId ? { ...salesOrderData.customerId, id: salesOrderData.customerId._id || salesOrderData.customerId.id } : {};
  const selectedCustomerData =
    salesId || isConverted || isConvertedFromCustomerOrder ? customerFromDocument : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || customerFromDocument;
  const conversionItemsDrop = useMemo(() => (isConverted ? buildConversionItemsDrop(salesOrderData?.items, allItemDrop) : []), [isConverted, salesOrderData?.items, allItemDrop]);
  const itemsDropForTable = isConverted ? conversionItemsDrop : allItemDrop;
  const documentCurrency = selectedCustomerData?.currency || salesOrderData?.currency || currency;
  const { salesOrderTagsDropdown, getSalesOrderTagsDropdown, dropdownLoading } = useSalesOrderTag();
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { profile, inventoryConfig, getInventoryConfig } = useProfile();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [salesOrderConfig, setSalesOrderConfig] = useState({
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
  const [itemDropPriceListId, setItemDropPriceListId] = useState(null);
  // Pending converted-document price list confirm: { mode, priceList, onConfirm, onCancel } or null.
  const [priceListApplyConfirm, setPriceListApplyConfirm] = useState(null);
  const initialAddressId = useRef(null);

  // Document Configuration Sheet Hook
  const {
    isOpen: isSalesOrderConfigOpen,
    handleOpen: handleOpenSalesOrderConfig,
    handleClose: handleCloseSalesOrderConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.SALES_ORDER,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveSalesOrderConfig,
    drawerSaveLoading: salesOrderConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isSalesOrderConfigOpen,
    moduleConfig: salesOrderConfig,
    setModuleConfig: setSalesOrderConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseSalesOrderConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.SALES_ORDER,
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
        moduleName: MODULE_NAMES.SALES_ORDER,
        customerId: formikRef.current?.values?.customerId || salesOrderData?.customerId?._id || salesOrderData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update sales order configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const lastFetchedAddressCustomerIdRef = useRef(null);
  const lastFetchedItemDropKeyRef = useRef(null);
  const itemDropAbortControllerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getInventoryConfig({ signal: controller.signal });
    return () => controller.abort();
  }, [getInventoryConfig]);

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

    if (salesId || isDuplicate) {
      if (salesOrderData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.SALES_ORDER,
          customerId: salesOrderData?.customerId?._id || salesOrderData?.customerId?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.SALES_ORDER,
        customerId: salesOrderData?.customerId?._id || salesOrderData?.customerId?.id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [salesId, isDuplicate, salesOrderData, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setSalesOrderConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (customerNotInBranch) {
      formikRef.current?.setFieldValue('customerId', null);
      setShowCustomerError(true);
    }
  }, [customerNotInBranch]);

  // Create only: an edited order's customer has no branch list.
  const customerNeedsBranchActivation =
    !salesId && isConvertedFromCustomerOrder && !!selectedBranchId && Array.isArray(salesOrderData?.customerId?.branch) && !isCustomerActiveInBranch(salesOrderData?.customerId, selectedBranchId);
  // { values, needsBranch, itemNames } while waiting for activation confirm.
  const [pendingActivation, setPendingActivation] = useState(null);

  // Customer order lines missing from the warehouse item dropdown (inactive or no warehouse row).
  const getUnavailableConvertedItemNames = items => {
    if (salesId || !isConvertedFromCustomerOrder) return [];
    // allItemDrop is null until loaded; an empty list is valid (warehouse has no active items yet).
    const itemsDropReady = !allItemDropLoading && Array.isArray(allItemDrop);
    const names = (items || []).filter(item => isLineUnavailableInWarehouse(item, { itemsDrop: allItemDrop, itemsDropReady })).map(item => item?.itemName || item?.itemNo || 'Item');
    return [...new Set(names)];
  };

  useEffect(() => {
    if (isConvertedFromCustomerOrder) setShowCustomerError(customerNeedsBranchActivation);
  }, [isConvertedFromCustomerOrder, customerNeedsBranchActivation]);

  useEffect(() => {
    if (formikRef.current && !salesId && salesOrderConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (salesOrderConfig.autoGenerate) {
        const newOrderId = `${salesOrderConfig.prefix}${salesOrderConfig.nextNumber}`;
        formikRef.current.setFieldValue('orderId', newOrderId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!salesOrderData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [salesOrderConfig, salesId, salesOrderData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (salesId) {
      getSalesOrderById({ orderId: salesId, signal: controller.signal });
    } else if (duplicateFromId) {
      getSalesOrderById({ orderId: duplicateFromId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [salesId, duplicateFromId, getSalesOrderById, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (!salesId && !duplicateFromId) {
      resetSalesOrder();
    }

    return () => {
      resetSalesOrder();
    };
  }, [salesId, duplicateFromId, resetSalesOrder]);

  useEffect(() => {
    if (!salesId && (isConverted || isConvertedFromCustomerOrder) && salesOrderData) {
      setDivisionBranchWarehouseFromEntity(salesOrderData);
      setSelectedCustomerId(salesOrderData?.customerId?.id || salesOrderData?.customerId?._id || '');
    }
  }, [salesId, isConverted, isConvertedFromCustomerOrder, salesOrderData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (salesOrder) {
      setDivisionBranchWarehouseFromEntity(salesOrder);
      setSelectedCustomerId(salesOrder?.customerId?.id || salesOrder?.customerId?._id || '');
      discountConfigHandledRef.current = false;
    }
  }, [salesOrder, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    const customerId = salesOrderData?.customerId?._id || salesOrderData?.customerId?.id;
    if (!customerId || lastFetchedAddressCustomerIdRef.current === customerId) return;
    fetchCustomerAddress(customerId);
  }, [salesOrderData]);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    if (isConverted) {
      if (!salesId) fetchItemDropdown({ warehouseId: selectedWarehouseId });
      return;
    }

    const customer = selectedCustomerId
      ? salesId || isDuplicate || isConverted || isConvertedFromCustomerOrder
        ? selectedCustomerData
        : customerDropDownList?.find(cust => cust.id === selectedCustomerId)
      : null;

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
    salesId,
    isDuplicate,
    isConverted,
    isConvertedFromCustomerOrder,
    selectedCustomerData?.includePriceListItemOnly,
    selectedCustomerData?.otherDetails?.includePriceListItemOnly,
  ]);

  useEffect(() => {
    return () => {
      itemDropAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (salesOrderData?.priceListId) {
      setItemDropPriceListId(salesOrderData.priceListId);
    }
  }, [salesOrderData?.priceListId]);

  useEffect(() => {
    const controller = new AbortController();
    getSalesOrderTagsDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [getSalesOrderTagsDropdown]);

  const salesOrderTagDropdownOptions = useMemo(
    () =>
      (Array.isArray(salesOrderTagsDropdown) ? salesOrderTagsDropdown : []).map(tag => {
        const tagCode = tag?.tagId || '-';
        const tagName = tag?.name || '-';
        return {
          value: tag?.id || tag?._id,
          label: (
            <span className="flex items-center gap-2 min-w-0">
              <span aria-hidden className="inline-block h-3 w-3 rounded-full shrink-0 !border !border-black/15" style={{ backgroundColor: tag?.color ?? '#9CA3AF' }} />
              <span className="truncate">{tagName}</span>
            </span>
          ),
          columnId: tagCode,
          columnName: tagName,
          columnColor: tag?.color || '#9CA3AF',
          searchLabel: `${tagCode} ${tagName}`.replace(/\s+/g, ' ').trim(),
        };
      }),
    [salesOrderTagsDropdown]
  );

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(() => {
    const rawValues = salesOrderInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? {
            ...updatedSalesOrderDataRef.current,
            addressId: initialAddressId.current,
          }
        : { ...salesOrderData, addressId: initialAddressId.current },
      moduleConfig?.termsandConditions || '',
      'PENDING',
      defaultPaymentTermsId,
      Boolean(salesId)
    );

    return {
      ...rawValues,
      attachments: salesOrderData?.attachments || [],
      orderDate: rawValues.orderDate ? dayjs(rawValues.orderDate) : dayjs(),
      expectedShipmentDate: rawValues.expectedShipmentDate ? dayjs(rawValues.expectedShipmentDate) : null,
    };
  }, [salesOrderData, additionalChargesConfig, changeDiscountConfig, defaultPaymentTermsId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['additionalcharge', 'termsAndConditions', 'orderId'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (!customerAddress?.length) return;
    const savedId = salesOrderData?.addressId || salesOrderData?.addressId?._id || salesOrderData?.addressId?.id;
    const selectedId = selectedAddress?._id;
    if (selectedId && initialAddressId.current && selectedId !== initialAddressId.current) return;

    const nextAddress = customerAddress.find(address => address?._id === savedId) || customerAddress.find(address => address?.isDefault) || customerAddress[0];
    setSelectedAddress(nextAddress);
    initialAddressId.current = nextAddress?._id || null;
    formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
  }, [customerAddress, salesOrderData?.addressId]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedCustomerData?.id) return;
    const newCustomerState = selectedAddress?.state || '';
    const discountCfg = salesOrderData?.appliesTo && !changeDiscountConfig ? { appliesTo: salesOrderData?.appliesTo } : moduleConfig?.discountConfig;
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

  // Second arg is Formik helpers on submit; only the activation modal passes activationConfirmed.
  const onFinish = async (values, { activationConfirmed = false } = {}) => {
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
      originalItems: salesOrderData?.items,
      isConverted: isConverted || isConvertedFromCustomerOrder,
      documentLabel: 'sales order',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading || submitWithStatusLoading) return;

    const unavailableItemNames = getUnavailableConvertedItemNames(values?.items);
    if ((customerNeedsBranchActivation || unavailableItemNames.length > 0) && !activationConfirmed) {
      setPendingActivation({ values, needsBranch: customerNeedsBranchActivation, itemNames: unavailableItemNames });
      return;
    }

    const targetStatus = values?.status || null;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const saleOrderData = salesOrderTransformer(
      {
        ...values,
        ...(!salesId ? { status: '' } : {}),
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state),
        appliesTo:
          salesOrderData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: salesOrderData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      salesId,
      salesOrderData,
      attachments,
      salesOrderData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: salesOrderData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    if (!saleOrderData?.tagId) {
      delete saleOrderData?.tagId;
    }

    const createArg = {
      ...saleOrderData,
      ...(targetStatus && { status: targetStatus }),
      ...(activationConfirmed && customerNeedsBranchActivation && { activateCustomerBranch: true }),
      ...(activationConfirmed && unavailableItemNames.length > 0 && { activateItemWarehouse: true }),
    };
    const result = salesId ? await updateSalesOrder({ salesId, saleOrderData }) : await createSalesOrder(createArg);

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
    // When editing, use salesId from route; when creating, use ID from result
    const targetId = salesId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (cameFromRejectionPage && saleOrderData.rejectionOrderDetails?.rejectionOrderRef) {
      navigateAfterSave(`/${ADMIN_ROUTE_PATHS.rejections.build.detail(saleOrderData.rejectionOrderDetails.rejectionOrderRef)}`);
      return;
    }

    if (targetId) {
      navigateAfterSave(`/sales-orders/${targetId}`, {
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
    documentData: salesOrderData,
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
    const includePriceListOnly = !isConverted && !fromRejection && isIncludePriceListItemOnly(selectedCustomerData);
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
    const isConvertedDocument = isConverted || isConvertedFromCustomerOrder || fromRejection;
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
      appliesTo: salesOrderData?.appliesTo,
      discountConfig: salesOrderData?.discountConfig,
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
      updatedSalesOrderDataRef.current = {
        // ...salesOrderData,
        ...(formikRef?.current?.values || {}),
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (salesOrderData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== salesOrderData?.appliesTo && !discountConfigHandledRef.current) {
      handleDiscountConfigChange();
      discountConfigHandledRef.current = true;
    }
  }, [moduleConfig, salesOrderData]);

  if ((salesId || isDuplicate) && (salesOrderLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{salesId ? `Edit Sales Order / ${salesOrderData?.orderId}` : 'Add Sales Order'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!salesId && (
              <Button type="default" onClick={handleOpenSalesOrderConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Sales Order Configuration
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
                  <p>{`${moduleConfig?.customer?.customerDisplayName || selectedCustomerData?.customerDisplayName} is not available in this branch`}</p>
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={salesOrderValidateSchema(salesOrderConfig.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!salesId && !isConverted ? (
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
                            loading={divisionLoading}
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
                              if (!isConvertedFromCustomerOrder) {
                                setFieldValue('customerId', null, false);
                                setSelectedCustomerId(null);
                              }
                              dispatch(resetBranch());
                            }}
                            disabled={fromRejection || salesOrderData?.quoteId || salesId}
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
                            disabled={fromRejection || salesOrderData?.quoteId || salesId || (warehouseRequiresCascade && !values.divisionId)}
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
                            disabled={fromRejection || salesOrderData?.quoteId || salesId || (warehouseRequiresCascade && !values.branchId)}
                            loading={warehouseLoading}
                          />
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={salesOrderData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={salesOrderData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={salesOrderData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Header details */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative">
                            {documentCurrency && selectedCustomerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!salesId && !isConverted && !isConvertedFromCustomerOrder ? (
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
                                disabled={fromRejection || salesId || salesOrderData?.quoteId || salesOrderData?.customerOrderId}
                                loading={customerLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                required={true}
                              />
                            ) : (
                              <CustomInput type="text" name="customerId" label="Customer Name" value={salesOrderData?.customerId?.customerDisplayName} disabled />
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

                          {salesOrderData?.quoteId && <CustomInput type="text" name="quoteId" label="Quote" value={salesOrderData?.quoteId?.quoteId || salesOrderData?.quoteNo} disabled />}
                          {salesOrderData?.customerOrderId && <CustomInput type="text" name="customerOrderNo" label="Customer Order#" value={salesOrderData?.customerOrderNo} disabled />}
                          {salesOrderData?.rejectionOrderDetails?.rejectionOrderId && (
                            <CustomInput type="text" name="rejectionOrderNo" label="Rejection Order" value={salesOrderData?.rejectionOrderDetails?.rejectionOrderId} disabled />
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="orderId"
                            label="Sales Order#"
                            placeholder="Enter Sales Order#"
                            value={values.orderId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.orderId}
                            touched={touched.orderId}
                            setFieldValue={setFieldValue}
                            disabled={salesOrderConfig?.autoGenerate || salesId}
                            suffix={
                              !salesId && (
                                <Tooltip title="Configure Sales Order Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="orderDate"
                            label="Sales Order Date"
                            value={values.orderDate ? values.orderDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.orderDate}
                            touched={touched.orderDate}
                            placeholder="Select Sales Order Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />
                          <CustomInput
                            type="date"
                            name="expectedShipmentDate"
                            label="Expected Shipment Date"
                            value={values.expectedShipmentDate ? values.expectedShipmentDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.expectedShipmentDate}
                            touched={touched.expectedShipmentDate}
                            placeholder="Select Expected Shipment Date"
                            format="YYYY-MM-DD"
                          />

                          <CustomInput
                            type="text"
                            name="reference"
                            label="Reference"
                            placeholder="Enter Reference"
                            value={values.reference}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.reference}
                            touched={touched.reference}
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
                            type="select"
                            name="deliveryMethod"
                            label="Delivery Method"
                            placeholder="Select Delivery Method"
                            value={values.deliveryMethod}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.deliveryMethod}
                            touched={touched.deliveryMethod}
                            setFieldValue={setFieldValue}
                            selectOptions={[
                              { value: 'Fast_Delivery', label: 'Fast Delivery' },
                              { value: 'Regular_Delivery', label: 'Regular Delivery' },
                            ]}
                            allowClear={true}
                          />

                          <div>
                            <CustomInput
                              type="select"
                              name="tagId"
                              label="Sales Order Tags"
                              placeholder="Select Sales Order Tags"
                              value={values.tagId}
                              onChange={value => setFieldValue('tagId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.tagId}
                              touched={touched.tagId}
                              setFieldValue={setFieldValue}
                              selectVariant="twoColumn"
                              columnSelectHeader={{ id: 'Tag ID', name: 'Tag Name' }}
                              selectOptions={salesOrderTagDropdownOptions}
                              loading={dropdownLoading}
                              notFoundContent={<div className="flex items-center justify-center w-full">No Tags Available</div>}
                              allowClear={true}
                            />
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

                      <ItemTable
                        showBatchIndicator={isConverted && !salesId && isStockCheckedOn(inventoryConfig, 'SALES_ORDER')}
                        values={values}
                        arr={values.items}
                        findItem={findItemById}
                        itemsDrop={isConverted ? conversionItemsDrop : allItemDropLoading ? [] : allItemDrop}
                        sourceItems={isConvertedFromCustomerOrder && !salesId ? salesOrderData?.items : null}
                        itemsDropLoading={!isConverted && allItemDropLoading}
                        setFieldValue={setFieldValue}
                        calculateAmounts={calculateAmounts}
                        errors={errors}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                        selectedCustomerData={selectedCustomerData}
                        activePriceListItems={priceListDrop?.find(pl => pl?.id === values?.priceList)?.items}
                        touched={touched}
                        disabled={isConverted}
                        lockItemUnit={lockItemUnit}
                        preserveDocumentTaxRate={isDuplicate}
                        discountConfig={
                          salesOrderData?.appliesTo && !changeDiscountConfig
                            ? {
                                appliesTo: salesOrderData?.appliesTo,
                              }
                            : moduleConfig?.discountConfig
                        }
                        moduleType={MODULE_TYPE.SALES}
                        pageType={pageTypes.SALES_ORDER}
                        currency={documentCurrency}
                        excludeDocumentId={salesId || undefined}
                      />
                      {/* Attach File(s) & TotalContainer section */}
                      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                        {/* Left side: Attach File(s) */}
                        <div className="flex-1 w-full lg:max-w-[480px]">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <CustomFileUpload
                              name="attachments"
                              label="Attach File(s) to Sales Order"
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
                            discountConfig={
                              salesOrderData?.appliesTo && !changeDiscountConfig
                                ? {
                                    appliesTo: salesOrderData?.appliesTo,
                                  }
                                : moduleConfig?.discountConfig
                            }
                            disabled={!!salesOrderData?.quoteId}
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
                        {!salesId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Open"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              formikRef.current.setFieldValue('status', BACKEND_ENUM?.OPEN);

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
          initialConfig={salesOrderConfig}
          resource={RESOURCES.SALES_ORDER}
          setConfigDetail={config => {
            setSalesOrderConfig(config);
            setDrawerCodeConfig(config);
          }}
          moduleName={MODULE_NAMES?.SALES_ORDER}
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
        <DocumentActivationModal
          open={!!pendingActivation}
          documentLabel="sales order"
          partyName={pendingActivation?.needsBranch ? selectedCustomerData?.customerDisplayName : null}
          branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name}
          warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name}
          itemNames={pendingActivation?.itemNames}
          loading={submitLoading || submitWithStatusLoading}
          onConfirm={async () => {
            await onFinish(pendingActivation.values, { activationConfirmed: true });
            setPendingActivation(null);
          }}
          onCancel={() => setPendingActivation(null)}
        />
        {creditLimitAlertOpen && <CreditLimitAlert open={creditLimitAlertOpen} onClose={() => setCreditLimitAlertOpen(false)} alertData={creditLimitAlertData} />}
        {!salesId && (
          <DocumentConfigSheet
            resource={RESOURCES.SALES_ORDER}
            open={isSalesOrderConfigOpen}
            onClose={handleCloseSalesOrderConfig}
            onSave={handleSaveSalesOrderConfig}
            getTermsValue={getTermsAndConditionsValue}
            loading={documentConfigLoading || salesOrderConfigSaving}
            codeConfigValue={drawerCodeConfig}
            onCodeConfigChange={setDrawerCodeConfig}
            codeConfigDisabled={salesOrderConfigSaving}
          />
        )}
      </div>
    </>
  );
};

export default AddSalesOrder;
