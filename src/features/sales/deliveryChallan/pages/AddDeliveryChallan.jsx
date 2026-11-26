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
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal';

// Hooks
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import { buildConversionItemsDrop, getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useDeliveryChallan, deliveryChallanValidateSchema, deliveryChallanTransformer, stripDeliveryChallanForDuplicate } from '@/features/sales/deliveryChallan';
import StockTransferSourceFields from '@/features/sales/deliveryChallan/components/StockTransferSourceFields';
import StockTransferNotice from '@/features/sales/deliveryChallan/components/StockTransferNotice';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, confirmModalEnum, DISCOUNT_CONFIG_CHANGE_MODAL, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { deliveryChallanInitialValues } from 'utils/intialValueSetup';
import { buildTaxContext, calculateAmounts, calculatePriceListChange } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { checkSalesItemsBeforeSave } from '@/utils/itemLineStatus';
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

const AddDeliveryChallan = () => {
  const formikRef = useRef(null);
  const { deliveryId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    submitLoading,
    submitWithStatusLoading,
    deliveryChallan,
    createDeliveryChallans,
    updateDeliveryChallans,
    getDeliveryChallanById,
    resetDeliveryChallan,
    loading: deliveryChallanLoading,
  } = useDeliveryChallan();
  const duplicateFromId = !deliveryId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);

  const deliveryChallanData = useMemo(() => {
    const rawData = deliveryId || isDuplicate ? deliveryChallan : location.state?.deliveryChallanData;
    if (!rawData || !isDuplicate) return rawData;
    return stripDeliveryChallanForDuplicate(rawData);
  }, [deliveryChallan, deliveryId, isDuplicate, location.state?.deliveryChallanData]);
  const isConverted = !!(deliveryChallanData?.salesOrders?.length > 0);
  const updatedDeliveryChallanDataRef = useRef(deliveryChallanData);
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
  } = useDivisionBranchWarehouseWithResource(deliveryChallanData, RESOURCES.DELIVERY_CHALLANS, {
    skipLocationDropdowns: !!deliveryId || isConverted,
    skipAutoItemDrop: true,
    enableBranchFirst: !isDuplicate,
    enableWarehouseFirst: !isDuplicate,
    moduleConfig,
  });
  const { currency } = useCompanyCurrency();
  const customerFromDocument = deliveryChallanData?.customerId ? { ...deliveryChallanData.customerId, id: deliveryChallanData.customerId._id || deliveryChallanData.customerId.id } : {};
  const selectedCustomerData = deliveryId || isConverted ? customerFromDocument : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || customerFromDocument;
  const conversionItemsDrop = useMemo(() => (isConverted ? buildConversionItemsDrop(deliveryChallanData?.items, allItemDrop) : []), [isConverted, deliveryChallanData?.items, allItemDrop]);
  const itemsDropForTable = isConverted ? conversionItemsDrop : allItemDrop;
  const documentCurrency = selectedCustomerData?.currency || deliveryChallanData?.currency || currency;
  const { paymentTermsDropLoading, paymentTermsOptions, defaultPaymentTermsId } = usePaymentTermsDropdown();
  const { profile, inventoryConfig, getInventoryConfig } = useProfile();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [deliveryChallanConfig, setDeliveryChallanConfig] = useState({
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
    isOpen: isDeliveryChallanConfigOpen,
    handleOpen: handleOpenDeliveryChallanConfig,
    handleClose: handleCloseDeliveryChallanConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveDeliveryChallanConfig,
    drawerSaveLoading: deliveryChallanConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isDeliveryChallanConfigOpen,
    moduleConfig: deliveryChallanConfig,
    setModuleConfig: setDeliveryChallanConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseDeliveryChallanConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
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
        moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
        customerId: formikRef.current?.values?.customerId || deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update delivery challan configuration',
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

    if (deliveryId || isDuplicate) {
      if (deliveryChallanData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
          customerId: deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
        customerId: deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [deliveryId, isDuplicate, deliveryChallanData, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    const controller = new AbortController();
    getInventoryConfig({ signal: controller.signal });
    return () => controller.abort();
  }, [getInventoryConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setDeliveryChallanConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !deliveryId && deliveryChallanConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (deliveryChallanConfig.autoGenerate) {
        const newChallanId = `${deliveryChallanConfig.prefix}${deliveryChallanConfig.nextNumber}`;
        formikRef.current.setFieldValue('challanId', newChallanId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!deliveryChallanData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [deliveryChallanConfig, deliveryId, deliveryChallanData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (deliveryId) {
      getDeliveryChallanById({
        deliveryChallanId: deliveryId,
        signal: controller.signal,
      });
    } else if (duplicateFromId) {
      getDeliveryChallanById({
        deliveryChallanId: duplicateFromId,
        signal: controller.signal,
      });
    }
    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [deliveryId, duplicateFromId, getDeliveryChallanById, resetCustomerDropDownList, resetCustomerAddress]);

  useEffect(() => {
    if (!deliveryId && !duplicateFromId) {
      resetDeliveryChallan();
    }

    return () => {
      resetDeliveryChallan();
    };
  }, [deliveryId, duplicateFromId, resetDeliveryChallan]);

  useEffect(() => {
    if (deliveryChallan) {
      setDivisionBranchWarehouseFromEntity(deliveryChallan);
      setSelectedCustomerId(deliveryChallan?.customerId?.id || deliveryChallan?.customerId?._id || '');
      discountConfigHandledRef.current = false;
    }
  }, [deliveryChallan, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (!deliveryId && isConverted && deliveryChallanData) {
      setDivisionBranchWarehouseFromEntity(deliveryChallanData);
      setSelectedCustomerId(deliveryChallanData?.customerId?.id || deliveryChallanData?.customerId?._id || '');
    }
  }, [deliveryId, isConverted, deliveryChallanData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    const customerId = deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id;
    if (!customerId || lastFetchedAddressCustomerIdRef.current === customerId) return;
    fetchCustomerAddress(customerId);
  }, [deliveryChallanData]);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    if (isConverted) {
      fetchItemDropdown({ warehouseId: selectedWarehouseId });
      return;
    }

    const customer = selectedCustomerId ? (deliveryId || isDuplicate || isConverted ? selectedCustomerData : customerDropDownList?.find(cust => cust.id === selectedCustomerId)) : null;

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
    deliveryId,
    isDuplicate,
    isConverted,
    selectedCustomerData?.includePriceListItemOnly,
    selectedCustomerData?.otherDetails?.includePriceListItemOnly,
  ]);

  useEffect(() => {
    if (deliveryChallanData?.priceListId) {
      setItemDropPriceListId(deliveryChallanData.priceListId);
    }
  }, [deliveryChallanData?.priceListId]);

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
    if (!customerAddress?.length) return;

    const savedId = deliveryChallanData?.addressId || deliveryChallanData?.addressId?._id || deliveryChallanData?.addressId?.id;
    const selectedId = selectedAddress?._id;
    if (selectedId && initialAddressId.current && selectedId !== initialAddressId.current) return;

    const nextAddress = customerAddress.find(address => address?._id === savedId) || customerAddress.find(address => address?.isDefault) || customerAddress[0];
    setSelectedAddress(nextAddress);
    initialAddressId.current = nextAddress?._id || null;
    formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
  }, [customerAddress, deliveryChallanData?.addressId]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues || !selectedCustomerData?.id) return;
    const newCustomerState = selectedAddress?.state || '';
    const discountCfg = deliveryChallanData?.appliesTo && !changeDiscountConfig ? { appliesTo: deliveryChallanData?.appliesTo } : moduleConfig?.discountConfig;
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

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(() => {
    const rawValues = deliveryChallanInitialValues(
      moduleConfig,
      changeDiscountConfig
        ? {
            ...updatedDeliveryChallanDataRef.current,
            addressId: initialAddressId.current,
          }
        : { ...deliveryChallanData, addressId: initialAddressId.current },
      moduleConfig?.termsandConditions || '',
      'PENDING',
      defaultPaymentTermsId,
      Boolean(deliveryId)
    );

    return {
      ...rawValues,
      attachments: deliveryChallanData?.attachments || [],
      challanDate: rawValues.challanDate ? dayjs(rawValues.challanDate) : dayjs(),
    };
  }, [deliveryChallanData, additionalChargesConfig, changeDiscountConfig, defaultPaymentTermsId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['challanId', 'termsAndConditions'];
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
      originalItems: deliveryChallanData?.items,
      isConverted,
      documentLabel: 'delivery challan',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading || submitWithStatusLoading) return;

    const targetStatus = values?.status || null;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const deliveryChallanDataPayload = deliveryChallanTransformer(
      {
        ...values,
        ...(!deliveryId ? { status: '' } : {}),
        taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state),
        appliesTo:
          deliveryChallanData?.appliesTo && !changeDiscountConfig
            ? {
                appliesTo: deliveryChallanData?.appliesTo,
              }
            : moduleConfig?.discountConfig?.isEnabled
              ? moduleConfig?.discountConfig?.appliesTo
              : '',
      },
      deliveryChallanData,
      deliveryId,
      attachments.filter(att => typeof att === 'string'), // Only URLs for transformer
      deliveryChallanData?.appliesTo && !changeDiscountConfig
        ? {
            appliesTo: deliveryChallanData?.appliesTo,
          }
        : moduleConfig?.discountConfig?.isEnabled
          ? moduleConfig?.discountConfig
          : ''
    );

    // Add all attachments (File objects + URLs) to payload
    deliveryChallanDataPayload.attachments = attachments;

    const result = deliveryId
      ? await updateDeliveryChallans({
          deliveryId,
          deliveryChallanData: deliveryChallanDataPayload,
        })
      : await createDeliveryChallans({
          deliveryChallanData: targetStatus ? { ...deliveryChallanDataPayload, status: targetStatus } : deliveryChallanDataPayload,
        });

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
    // When editing, use deliveryId from route; when creating, use ID from result
    const targetId = deliveryId || result?.payload?.data?.id || result?.payload?.data?._id;

    if (targetId) {
      navigateAfterSave(`/delivery-challans/${targetId}`, {
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
    documentData: deliveryChallanData,
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
      appliesTo: deliveryChallanData?.appliesTo,
      discountConfig: deliveryChallanData?.discountConfig,
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
      updatedDeliveryChallanDataRef.current = {
        // ...deliveryChallanData,
        ...(formikRef?.current?.values || {}),
        appliesTo: moduleConfig?.discountConfig?.appliesTo,
      };
    };
    let modal = ConfirmModal(data);
    modal.showModal();
  };

  useEffect(() => {
    if (deliveryChallanData?.appliesTo && moduleConfig && moduleConfig?.discountConfig?.appliesTo !== deliveryChallanData?.appliesTo && !discountConfigHandledRef.current) {
      handleDiscountConfigChange();
      discountConfigHandledRef.current = true;
    }
  }, [moduleConfig, deliveryChallanData]);

  if ((deliveryId || isDuplicate) && (deliveryChallanLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{deliveryId ? `Edit Delivery Challan / ${deliveryChallanData?.challanId}` : 'Add Delivery Challan'} </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!deliveryId && (
              <Button type="default" onClick={handleOpenDeliveryChallanConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Delivery Challan Configuration
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={deliveryChallanValidateSchema(deliveryChallanConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              // On a stock transfer the challan's own location is where the stock goes.
              const locationLabelPrefix = values.isStockTransfer ? 'To ' : '';
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="mb-3">
                        <CustomInput
                          type="checkbox"
                          name="isStockTransfer"
                          CheckboxName="Internal stock transfer"
                          value={Boolean(values.isStockTransfer)}
                          setFieldValue={setFieldValue}
                          disabled={Boolean(deliveryId)}
                          onChange={e => {
                            if (!e.target.checked) {
                              setFieldValue('fromDivisionId', null, false);
                              setFieldValue('fromBranchId', null, false);
                              setFieldValue('fromWarehouseId', null, false);
                            }
                          }}
                        />
                        {deliveryId && <p className="m-0 mt-1 text-xs text-gray-500">This option cannot be changed after the delivery challan is created.</p>}
                      </div>
                      {values.isStockTransfer && (
                        <div className="mb-3 flex flex-col gap-3">
                          <StockTransferNotice />
                          <StockTransferSourceFields values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} handleBlur={handleBlur} />
                        </div>
                      )}
                      {!deliveryId && !isConverted ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="select"
                            name="divisionId"
                            label={`${locationLabelPrefix}Division`}
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
                            label={`${locationLabelPrefix}Branch`}
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
                            label={`${locationLabelPrefix}Warehouse`}
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
                          <CustomInput type="text" name="divisionId" label={`${locationLabelPrefix}Division`} value={deliveryChallanData?.divisionName} disabled />
                          <CustomInput type="text" name="branchId" label={`${locationLabelPrefix}Branch`} value={deliveryChallanData?.branchName} disabled />
                          <CustomInput type="text" name="warehouseId" label={`${locationLabelPrefix}Warehouse`} value={deliveryChallanData?.warehouseName} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Document fields */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative">
                            {documentCurrency && selectedCustomerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!deliveryId && !isConverted ? (
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
                                required={true}
                                loading={customerLoading}
                              />
                            ) : (
                              <CustomInput type="text" name="customerId" label="Customer Name" value={deliveryChallanData?.customerId?.customerDisplayName} disabled />
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

                          {deliveryChallanData?.salesOrders?.length > 0 && (
                            <CustomInput type="text" name="salesOrderId" label="Sales Order" value={deliveryChallanData?.salesOrders?.map(order => order.salesOrderNo).join(', ') || ''} disabled />
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="challanId"
                            label="Delivery Challan#"
                            placeholder="Enter Delivery Challan"
                            value={values.challanId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.challanId}
                            touched={touched.challanId}
                            setFieldValue={setFieldValue}
                            disabled={deliveryChallanConfig?.autoGenerate || deliveryId}
                            suffix={
                              !deliveryId && (
                                <Tooltip title="Configure Delivery Challan Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="challanDate"
                            label="Delivery Challan Date"
                            value={values.challanDate ? values.challanDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.challanDate}
                            touched={touched.challanDate}
                            placeholder="Select delivery Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />

                          <div className="relative">
                            <CustomInput
                              type="select"
                              name="challanType"
                              label="Challan Type"
                              placeholder="Select Challan type"
                              value={values.challanType}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.challanType}
                              touched={touched.challanType}
                              setFieldValue={setFieldValue}
                              selectOptions={[
                                { value: 'Supply of Liquid Gas', label: 'Supply of Liquid Gas' },
                                { value: 'Job Work', label: 'Job Work' },
                                { value: 'Supply on Approval', label: 'Supply on Approval' },
                                { value: 'Others', label: 'Others' },
                              ]}
                              required={true}
                            />
                          </div>

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
                        showInventoryWarning={inventoryConfig?.salesFlowStockDeductSource === 'DELIVERY_CHALLAN'}
                        values={values}
                        arr={values.items}
                        findItem={findItemById}
                        itemsDrop={isConverted ? conversionItemsDrop : allItemDropLoading ? [] : allItemDrop}
                        itemsDropLoading={!isConverted && allItemDropLoading}
                        showBatchIndicator={isConverted && !deliveryId && isStockCheckedOn(inventoryConfig, 'DELIVERY_CHALLAN')}
                        setFieldValue={setFieldValue}
                        calculateAmounts={calculateAmounts}
                        errors={errors}
                        handleBlur={handleBlur}
                        handleChange={handleChange}
                        selectedCustomerData={selectedCustomerData}
                        activePriceListItems={priceListDrop?.find(pl => pl?.id === values?.priceList)?.items}
                        touched={touched}
                        disabled={deliveryChallanData?.salesOrders?.length > 0}
                        preserveDocumentTaxRate={isDuplicate}
                        discountConfig={
                          deliveryChallanData?.appliesTo && !changeDiscountConfig
                            ? {
                                appliesTo: deliveryChallanData?.appliesTo,
                              }
                            : moduleConfig?.discountConfig
                        }
                        moduleType={MODULE_TYPE.SALES}
                        pageType={pageTypes.DELIVERY_CHALLAN}
                        currency={documentCurrency}
                        excludeDocumentId={deliveryId || undefined}
                      />
                      {/* Attach File(s) & TotalContainer section */}
                      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                        {/* Left side: Attach File(s) */}
                        <div className="flex-1 w-full lg:max-w-[480px]">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <CustomFileUpload
                              name="attachments"
                              label="Attach File(s) to Delivery Challan"
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
                              deliveryChallanData?.appliesTo && !changeDiscountConfig
                                ? {
                                    appliesTo: deliveryChallanData?.appliesTo,
                                  }
                                : moduleConfig?.discountConfig
                            }
                            disabled={deliveryChallanData?.salesOrders?.length > 0}
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
                            if (!submitLoading) {
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
                            }
                          }}
                        />
                        {!deliveryId && (
                          <CustomButton
                            className="px-8 py-4 min-w-[100px]"
                            type="primary"
                            text="Save & Sent"
                            loading={submitWithStatusLoading}
                            onClick={async () => {
                              if (!submitWithStatusLoading) {
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
                              }
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
          initialConfig={deliveryChallanConfig}
          resource={RESOURCES.DELIVERY_CHALLANS}
          setConfigDetail={config => {
            setDeliveryChallanConfig(config);
            setDrawerCodeConfig(config);
          }}
          moduleName={MODULE_NAMES?.DELIVERY_CHALLAN}
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
        {!deliveryId && (
          <DocumentConfigSheet
            resource={RESOURCES.DELIVERY_CHALLANS}
            open={isDeliveryChallanConfigOpen}
            onClose={handleCloseDeliveryChallanConfig}
            onSave={handleSaveDeliveryChallanConfig}
            getTermsValue={getTermsAndConditionsValue}
            loading={documentConfigLoading || deliveryChallanConfigSaving}
            codeConfigValue={drawerCodeConfig}
            onCodeConfigChange={setDrawerCodeConfig}
            codeConfigDisabled={deliveryChallanConfigSaving}
          />
        )}
      </div>
    </>
  );
};

export default AddDeliveryChallan;
