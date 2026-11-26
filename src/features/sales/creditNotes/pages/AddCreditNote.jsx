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
import CustomButton from '@/components/ui/button/CustomButton';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
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

// Hooks
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useInvoice } from '@/features/sales/invoice/useInvoice';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useCreditNote, creditNotesValidateSchema, creditNoteTransformer } from '@/features/sales/creditNotes';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { CREDIT_NOTE_TYPE_ENUM, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { buildTaxContext, calculateAmounts } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { getItemUnitName } from '@/utils/itemLineUnit';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const AddCreditNote = () => {
  const formikRef = useRef(null);
  const { creditNotesId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { submitLoading, creditNote, resetCreditNote, getCreditNoteById, createCreditNotes, updateCreditNotes, loading: creditNoteLoading } = useCreditNote();
  const creditNoteData = creditNotesId ? creditNote : location.state?.creditNoteData || creditNote;
  const fromRejection = !!creditNoteData?.rejectionOrderDetails?.rejectionOrderRef;
  const cameFromRejectionPage = !creditNotesId && Boolean(location.state?.fromRejection);
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
    getCustomerAddress,
    resetCustomerAddress,
    addressLoading,
    isSplitWise,
    isSplitSessionActive,
    customerDropDownList,
    resetCustomerDropDownList,
    customerLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedWarehouseId,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(creditNoteData, RESOURCES.CREDIT_NOTES, {
    skipLocationDropdowns: !!creditNotesId,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const { customerPendingInvoice, getPendingInvoice, pendingInvoiceLoading } = useInvoice();
  const { profile } = useProfile();
  const selectedCustomerData = creditNotesId ? { ...creditNoteData?.customerId, id: creditNoteData?.customerId?._id } : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || {};
  const { currency } = useCompanyCurrency();
  const documentCurrency = selectedCustomerData?.currency || creditNoteData?.currency || currency;
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [creditNoteConfig, setCreditNoteConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const scrollToError = useScrollToError();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const initialAddressId = useRef(null);
  const [useInvoiceNo, setUseInvoiceNo] = useState(false);
  const [isSplitForApi, setIsSplitForApi] = useState(isSplitSessionActive);

  useEffect(() => {
    if (creditNoteData?.isSplit !== undefined) {
      setIsSplitForApi(creditNoteData.isSplit);
    } else if (!creditNotesId) {
      setIsSplitForApi(isSplitSessionActive);
    }
  }, [creditNoteData?.isSplit, creditNotesId, isSplitSessionActive]);

  useEffect(() => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('splitInvoices', isSplitForApi);
      formikRef.current.setFieldValue('isSplit', isSplitForApi);
    }
  }, [isSplitForApi]);

  // Document Configuration Sheet Hook
  const {
    isOpen: isCreditNoteConfigOpen,
    handleOpen: handleOpenCreditNoteConfig,
    handleClose: handleCloseCreditNoteConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.CREDIT_NOTE,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveCreditNoteConfig,
    drawerSaveLoading: creditNoteConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isCreditNoteConfigOpen,
    moduleConfig: creditNoteConfig,
    setModuleConfig: setCreditNoteConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseCreditNoteConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.CREDIT_NOTE,
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
        moduleName: MODULE_NAMES.CREDIT_NOTE,
        customerId: formikRef.current?.values?.customerId || selectedCustomerId || creditNoteData?.customerId?._id || creditNoteData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update credit note configuration',
  });

  const fetchCustomerAddress = customerId => {
    setSelectedAddress(null);
    initialAddressId.current = null;
    formikRef.current?.setFieldValue('addressId', null);
    getCustomerAddress({ customerId });
  };

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getModuleConfig({ ...payload, moduleName: MODULE_NAMES.CREDIT_NOTE });

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [creditNotesId, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedCustomerId && selectedWarehouseId) {
      getPendingInvoice({
        customerId: selectedCustomerId,
        warehouseId: selectedWarehouseId,
        signal: controller.signal,
        isAdd: true,
        isSplit: isSplitForApi,
      });
    }

    return () => controller.abort();
  }, [selectedCustomerId, selectedWarehouseId, isSplitForApi, getPendingInvoice]);

  useEffect(() => {
    if (moduleConfig) {
      setCreditNoteConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !creditNotesId && creditNoteConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (creditNoteConfig.autoGenerate) {
        const newCreditNoteId = `${creditNoteConfig.prefix}${creditNoteConfig.nextNumber}`;
        formikRef.current.setFieldValue('creditNoteId', newCreditNoteId);
      }
      formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!creditNoteData?.divisionId && !hasSelectedValues && defaultConfig) {
        formikRef.current.setFieldValue('divisionId', defaultConfig.divisionId);
        formikRef.current.setFieldValue('branchId', defaultConfig.branchId);
        formikRef.current.setFieldValue('warehouseId', defaultConfig.warehouseId);
        setFromEntity({
          divisionId: defaultConfig.divisionId,
          branchId: defaultConfig.branchId,
          warehouseId: defaultConfig.warehouseId,
        });
      }

      if (defaultConfig?.branchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [creditNoteConfig, creditNotesId, creditNoteData, moduleConfig, setFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    if (creditNotesId) {
      getCreditNoteById({ creditNoteId: creditNotesId, signal: controller.signal });
    } else {
      resetCreditNote();
    }

    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetCustomerAddress();
    };
  }, [creditNotesId]);

  useEffect(() => {
    if (creditNote) {
      setFromEntity(creditNoteData);
      setSelectedCustomerId(creditNoteData?.customerId?.id || creditNoteData?.customerId?._id || '');
      fetchCustomerAddress(creditNoteData?.customerId?._id || creditNoteData?.customerId?.id || '');
      setUseInvoiceNo(!!creditNoteData?.invoiceNo && !creditNoteData?.invoiceId);
    }
  }, [creditNote]);

  useEffect(() => {
    if (!creditNotesId && creditNoteData?.divisionId) {
      setFromEntity(creditNoteData);
    }
  }, [creditNoteData, creditNotesId, setFromEntity]);

  useEffect(() => {
    if (!creditNotesId && creditNoteData?.customerId) {
      const customerId = creditNoteData.customerId?._id || creditNoteData.customerId?.id;
      if (customerId) {
        setSelectedCustomerId(customerId);
        fetchCustomerAddress(customerId);
      }
    }
  }, [creditNoteData?.customerId]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === creditNoteData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress[0] || null;

      if (creditNotesId) {
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
    if (currentValues.taxContext) {
      if (currentValues.taxContext.customerState === newCustomerState) return;
      const newTaxContext = { ...currentValues.taxContext, customerState: newCustomerState };
      formikRef.current.setFieldValue('taxContext', newTaxContext);
      calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue);
    } else if (selectedCustomerData?.id) {
      const newTaxContext = buildTaxContext(profile, selectedCustomerData, newCustomerState);
      formikRef.current.setFieldValue('taxContext', newTaxContext);
      calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue);
    }
  }, [selectedAddress, selectedCustomerData]); // eslint-disable-line react-hooks/exhaustive-deps

  const createAdditionalChargesArr = () => {
    let moduleChargeArr = [];
    moduleConfig?.additionalChargesConfig?.forEach(item => {
      moduleChargeArr?.push({
        isTaxable: item?.isTaxable,
        taxRate: item?.taxRate,
        name: item?.name,
        amount: 0,
      });
    });

    let storedChargesArr = [];

    if (creditNoteData?.additionalCharges?.length > 0) {
      creditNoteData?.additionalCharges?.forEach(item => {
        let isChargeExists = moduleChargeArr?.findIndex(x => x?.name === item?.name);

        if (isChargeExists >= 0) {
          moduleChargeArr[isChargeExists].amount = item?.amount;
        } else {
          storedChargesArr.push({
            isTaxable: item?.isTaxable,
            taxRate: item?.taxRate,
            name: item?.name,
            amount: item?.amount,
          });
        }
      });
    }

    let finalChargesArr = [...moduleChargeArr, ...storedChargesArr];

    return finalChargesArr;
  };

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const initialValues = useMemo(
    () => ({
      customerId: creditNoteData ? creditNoteData?.customerId?._id || creditNoteData?.customerId?.id : null,
      warehouseId: creditNoteData?.warehouseId ? creditNoteData?.warehouseId : null,
      creditNoteId: creditNoteData ? creditNoteData?.creditNoteId : '',
      referenceNumber: creditNoteData ? creditNoteData?.referenceNumber : '',
      creditNoteDate: creditNoteData?.creditNoteDate ? dayjs(creditNoteData.creditNoteDate) : dayjs(),
      subject: creditNoteData ? creditNoteData?.subject : '',
      items:
        creditNoteData && creditNoteData?.items.length > 0
          ? creditNoteData?.items.map(item => ({
              itemId: item.itemId?.id || item.itemId?._id || item.itemId,
              itemName: item?.itemName,
              itemNo: item?.itemNo,
              hsnCode: item?.hsnCode,
              itemUnit: getItemUnitName(item),
              itemUnitId: item?.itemUnitId?._id || item?.itemUnitId?.id || (typeof item?.itemUnitId === 'string' ? item.itemUnitId : null) || null,
              quantity: item?.quantity,
              rate: item?.rate,
              gst: item?.gst,
              taxAmount: item?.taxAmount,
              amount: item?.amount,
            }))
          : [
              {
                itemId: null,
                itemName: '',
                itemNo: '',
                hsnCode: '',
                itemUnit: '',
                itemUnitId: null,
                gst: '0',
                taxAmount: '0.00',
                quantity: '1.00',
                rate: '0.00',
                amount: '0.00',
              },
            ],
      subTotal: creditNoteData ? creditNoteData?.subTotal : '0.00',
      sgst: creditNoteData?.sgst ? creditNoteData?.sgst : '0.00',
      cgst: creditNoteData?.cgst ? creditNoteData?.cgst : '0.00',
      igst: creditNoteData?.igst ? creditNoteData?.igst : '0.00',
      totalTax: creditNoteData?.totalTax ? creditNoteData?.totalTax : '0.00',
      total: creditNoteData ? creditNoteData?.total : '0.00',
      customerNotes: creditNoteData ? creditNoteData?.customerNotes : '',
      termsAndConditions: creditNoteData?.termsAndConditions || moduleConfig?.termsandConditions || '',
      divisionId: creditNoteData?.divisionId ? creditNoteData?.divisionId : null,
      branchId: creditNoteData?.branchId ? creditNoteData?.branchId : null,
      invoiceId: creditNoteData?.invoiceId?._id || creditNoteData?.invoiceId?.id || creditNoteData?.invoiceId || null,
      invoiceNo: creditNoteData?.invoiceNo ? creditNoteData?.invoiceNo : '',
      additionalcharge: createAdditionalChargesArr(),
      type: creditNoteData?.type || null,
      addressId: initialAddressId.current,
      isRoundOff: creditNoteData?.isRoundOff ?? true,
      roundOffAmount: creditNoteData?.roundOffAmount ?? 0,
      splitInvoices: creditNotesId ? creditNoteData?.isSplit || false : isSplitSessionActive,
      isSplit: creditNotesId ? creditNoteData?.isSplit || false : isSplitSessionActive,
      attachments: creditNoteData?.attachments || [],
      rejectionOrderDetails: creditNoteData?.rejectionOrderDetails || null,
      exchangeRate: creditNoteData?.currency?.exchangeRate ?? 1,
      tax: creditNoteData?.tax?.taxId ? creditNoteData.tax : null,
    }),
    [creditNoteData, additionalChargesConfig, creditNotesId]
  );

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['creditNoteId', 'addressId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const onFinish = async values => {
    if (!validateDocumentTotalBeforeSave(values)) {
      Toast.error(DOCUMENT_TOTAL_MIN_MESSAGE);
      return;
    }
    if (!values?.addressId) return;

    // Block the save when a newly added item is inactive / not available in the selected warehouse.
    // Items carried from the source invoice (held in creditNoteData.items) are tolerated.
    const itemBlockMsg = checkSalesItemsBeforeSave({
      items: values.items,
      itemsDrop: allItemDrop,
      itemsDropLoading: allItemDropLoading,
      originalItems: creditNoteData?.items,
      documentLabel: 'credit note',
    });
    if (itemBlockMsg) {
      Toast.error(itemBlockMsg);
      return;
    }

    if (submitLoading) return;

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const creditNotePayload = creditNoteTransformer(
      { ...values, taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state) },
      creditNotesId,
      attachments,
      isSplitWise && isSplitSessionActive && (values.splitInvoices || creditNoteData?.isSplit)
    );

    const result = creditNotesId ? await updateCreditNotes({ creditNotesId, creditNoteData: creditNotePayload }) : await createCreditNotes(creditNotePayload);

    if (shouldPreventNavigation(result)) {
      return;
    }

    // For successful updates/creates, navigate to detail page
    // When editing, use creditNotesId from route; when creating, use ID from result
    const targetId = creditNotesId || result?.payload?.data?.id || result?.data?.id;

    // If this credit note was just created from a rejection order, go back to it
    if (cameFromRejectionPage && creditNotePayload.rejectionOrderDetails?.rejectionOrderRef) {
      navigateAfterSave(`/rejection-orders/${creditNotePayload.rejectionOrderDetails.rejectionOrderRef}`);
      return;
    }

    if (targetId) {
      navigateAfterSave(`/credit-notes/${targetId}`, {
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

  const findItem = (itemId, allItemDrop) => {
    const item = (allItemDrop || []).find(item => item._id === itemId);
    return item;
  };

  if (creditNotesId && (creditNoteLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{creditNotesId ? `Edit Credit Note / ${creditNoteData?.creditNoteId}` : 'Add Credit Note'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
            {!creditNotesId && (
              <Button type="default" onClick={handleOpenCreditNoteConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Credit Note Configuration
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="relative pb-24 bg-white pt-16 -m-4">
        <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={creditNotesValidateSchema(creditNoteConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
            // Update form values for dirty checking
            updateFormValues(values);

            return (
              <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="px-6 flex flex-col gap-2">
                  {/* Inventory context */}
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    {!creditNotesId ? (
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
                            setFieldValue('invoiceId', null, false);
                            setFieldValue('invoiceNo', '', false);
                            dispatch(resetBranch());
                          }}
                          disabled={fromRejection}
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
                            setFieldValue('invoiceId', null, false);
                            setFieldValue('invoiceNo', '', false);
                          }}
                          disabled={fromRejection || (warehouseRequiresCascade && !values.divisionId)}
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
                            setFieldValue('invoiceId', null, false);
                            setFieldValue('invoiceNo', '', false);
                          }}
                          onBlur={handleBlur}
                          errorMessage={errors.warehouseId}
                          touched={touched.warehouseId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={warehouseSelectColumnHeader}
                          selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                          disabled={fromRejection || (warehouseRequiresCascade && !values.branchId)}
                          loading={warehouseLoading}
                        />
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                        <CustomInput type="text" name="divisionId" label="Division" value={creditNoteData?.divisionName} disabled />
                        <CustomInput type="text" name="branchId" label="Branch" value={creditNoteData?.branchName} disabled />
                        <CustomInput type="text" name="warehouseId" label="Warehouse" value={creditNoteData?.warehouseName} disabled />
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
                          {documentCurrency && selectedCustomerId && (
                            <div className="absolute top-0 right-0 z-10">
                              <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                            </div>
                          )}
                          {!creditNotesId ? (
                            <CustomInput
                              type="select"
                              selectVariant="twoColumn"
                              columnSelectHeader={{ id: 'Customer ID', name: 'Customer Name' }}
                              name="customerId"
                              label="Customer Name"
                              value={values.customerId}
                              onChange={e => {
                                const newCustomerDetail = customerDropDownList?.find(cust => cust.id === e) || {};
                                setFieldValue('customerId', e);
                                const taxContext = buildTaxContext(profile, newCustomerDetail, newCustomerDetail?.address?.shipping?.state);
                                setFieldValue('taxContext', taxContext);
                                setFieldValue('tax', null);
                                calculateAmounts({ ...values, taxContext, tax: null }, setFieldValue);
                                setSelectedCustomerId(e);
                                setFieldValue('invoiceId', null);
                                setFieldValue('invoiceNo', '');
                                fetchCustomerAddress(e);
                                setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1);
                              }}
                              onBlur={handleBlur}
                              errorMessage={errors.customerId}
                              touched={touched.customerId}
                              setFieldValue={setFieldValue}
                              placeholder="Select Customer Name"
                              selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                              required={true}
                              disabled={fromRejection}
                              loading={customerLoading}
                              notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                            />
                          ) : (
                            <CustomInput type="text" name="customerId" label="Customer Name" value={creditNoteData?.customerId?.customerDisplayName} disabled />
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

                        {creditNoteData?.rejectionOrderDetails?.rejectionOrderId && (
                          <CustomInput type="text" name="rejectionOrderNo" label="Rejection Order" value={creditNoteData?.rejectionOrderDetails?.rejectionOrderId} disabled />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                        <CustomInput
                          type="text"
                          name="creditNoteId"
                          label="Credit Note#"
                          placeholder="Enter Credit Notes"
                          value={values.creditNoteId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.creditNoteId}
                          touched={touched.creditNoteId}
                          setFieldValue={setFieldValue}
                          disabled={creditNoteConfig?.autoGenerate || creditNotesId}
                          suffix={
                            !creditNotesId && (
                              <Tooltip title="Configure Payment Received Number">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            )
                          }
                          required
                        />

                        <CustomInput
                          type="date"
                          name="creditNoteDate"
                          label="Credit Note Date"
                          value={values.creditNoteDate ? values.creditNoteDate : null}
                          setFieldValue={setFieldValue}
                          setFieldTouched={setFieldTouched}
                          onBlur={handleBlur}
                          errorMessage={errors.creditNoteDate}
                          touched={touched.creditNoteDate}
                          placeholder="Select Credit Date"
                          format="YYYY-MM-DD"
                          required={true}
                        />

                        <CustomInput
                          type="select"
                          name="type"
                          label="Credit Note Type"
                          placeholder="Select Credit Note Type"
                          value={values.type}
                          onBlur={handleBlur}
                          errorMessage={errors.type}
                          touched={touched.type}
                          setFieldValue={setFieldValue}
                          required={true}
                          disabled={fromRejection}
                          selectOptions={Object?.entries(CREDIT_NOTE_TYPE_ENUM)?.map(([key, value]) => ({
                            label: value,
                            value: key,
                          }))}
                          onChange={handleChange}
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

                        {values?.customerId && (
                          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-7 items-start">
                            <div>
                              {!useInvoiceNo ? (
                                <CustomInput
                                  type="select"
                                  name="invoiceId"
                                  label="Invoice"
                                  required={true}
                                  value={values.invoiceId}
                                  onChange={e => {
                                    setFieldValue('invoiceId', e);
                                    setFieldValue('invoiceNo', '');
                                    const invoiceTax = customerPendingInvoice?.find(invoice => (invoice._id || invoice.id) === e)?.tax;
                                    const tax = invoiceTax?.taxId ? { ...invoiceTax, amount: null } : null;
                                    setFieldValue('tax', tax);
                                    calculateAmounts({ ...values, tax, taxContext: buildTaxContext(profile, selectedCustomerData, selectedAddress?.state) }, setFieldValue);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.invoiceId}
                                  touched={touched.invoiceId}
                                  setFieldValue={setFieldValue}
                                  placeholder="Select Invoice"
                                  selectOptions={(customerPendingInvoice || []).map(option => ({
                                    label: option?.invoiceId,
                                    value: option?._id || option?.id,
                                  }))}
                                  loading={pendingInvoiceLoading}
                                />
                              ) : (
                                <CustomInput
                                  type="text"
                                  name="invoiceNo"
                                  label="Invoice No"
                                  required={true}
                                  value={values.invoiceNo}
                                  onChange={e => {
                                    setFieldValue('invoiceNo', e.target.value);
                                    if (values.invoiceId) {
                                      setFieldValue('invoiceId', null);
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.invoiceNo}
                                  touched={touched.invoiceNo}
                                  setFieldValue={setFieldValue}
                                  placeholder="Enter Invoice No"
                                />
                              )}
                            </div>
                            <div className="pt-7">
                              <Tooltip title="Check to enter Invoice No manually instead of selecting from list">
                                <div>
                                  <CustomInput
                                    type="checkbox"
                                    name="useInvoiceNo"
                                    CheckboxName="Use Invoice No"
                                    value={useInvoiceNo}
                                    onChange={e => {
                                      const checked = e.target.checked;
                                      setUseInvoiceNo(checked);
                                      setFieldValue(checked ? 'invoiceId' : 'invoiceNo', checked ? null : '');
                                    }}
                                    setFieldValue={setFieldValue}
                                    checkboxClassName="mt-1"
                                  />
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        )}

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

                        {isSplitSessionActive && isSplitWise && (
                          <div className="flex gap-x-4 pt-7">
                            <div className="w-max">
                              <CustomInput
                                type="switch"
                                name="splitInvoices"
                                value={values.splitInvoices}
                                onChange={checked => {
                                  setIsSplitForApi(checked);
                                  setFieldValue('splitInvoices', checked);
                                  setFieldValue('isSplit', checked);
                                  calculateAmounts({ ...values, isSplit: checked }, setFieldValue);
                                  setFieldValue('invoiceId', null);
                                  setFieldValue('invoiceNo', '');
                                  setUseInvoiceNo(false);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.splitInvoices}
                                touched={touched.splitInvoices}
                                setFieldValue={setFieldValue}
                                disabled={creditNotesId}
                              />
                            </div>
                            <div>Split Invoices</div>
                          </div>
                        )}
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
                      disabled={fromRejection}
                      moduleType={MODULE_TYPE.SALES}
                      pageType={pageTypes.CREDIT_NOTE}
                      allowRateEdit={fromRejection}
                      currency={documentCurrency}
                      excludeDocumentId={creditNotesId || undefined}
                    />
                    {/* Attach File(s) & TotalContainer section */}
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                      {/* Left side: Attach File(s) */}
                      <div className="flex-1 w-full lg:max-w-[480px]">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <CustomFileUpload
                            name="attachments"
                            label="Attach File(s) to Credit Notes"
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
                          calculateAmounts={calculateAmounts}
                          setFieldValue={setFieldValue}
                          currency={documentCurrency}
                          directTaxTypes={['TCS']}
                          isDirectTaxApplicable={selectedCustomerData?.isCustomerDirectTax}
                          documentDate={values.creditNoteDate}
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
              </CustomForm>
            );
          }}
        </Formik>
      </div>
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={creditNoteConfig}
        resource={RESOURCES.CREDIT_NOTES}
        setConfigDetail={config => {
          setCreditNoteConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES?.CREDIT_NOTE}
      />
      {!creditNotesId && (
        <DocumentConfigSheet
          resource={RESOURCES.CREDIT_NOTES}
          open={isCreditNoteConfigOpen}
          onClose={handleCloseCreditNoteConfig}
          onSave={handleSaveCreditNoteConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || creditNoteConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={creditNoteConfigSaving}
        />
      )}
    </>
  );
};

export default AddCreditNote;
