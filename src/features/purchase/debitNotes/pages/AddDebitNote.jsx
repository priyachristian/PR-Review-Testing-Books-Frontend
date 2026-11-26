import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import ItemTable from '@/components/dataDisplay/appTable/ItemTable';
import Toast from '@/components/ui/common/Toast';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import { Button, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import DocumentActivationModal from '@/components/feedback/confirmModal/DocumentActivationModal';

// Hooks
import { useBill } from '@/features/purchase/bills/useBill';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useDeepCompareMemo } from 'hooks/useDeepCompareMemo';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import usePurchaseSaveActivation from '@/hooks/usePurchaseSaveActivation';

// Extras
import { useDebitNote, debitNoteValidateSchema, debitNoteTransformer } from '@/features/purchase/debitNotes';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { confirmModalEnum, DEBIT_NOTE_TYPE_ENUM, MODULE_NAMES, MODULE_TYPE, pageTypes } from 'utils/constants';
import { buildTaxContext, calculateAmounts } from 'utils/services';
import { DOCUMENT_TOTAL_MIN_MESSAGE, validateDocumentTotalBeforeSave } from '@/utils/documentValidation';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import { getItemUnitName } from '@/utils/itemLineUnit';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { toDecimalString } from '@/utils/currency';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const AddDebitNote = () => {
  const formikRef = useRef(null);
  const { vendorId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { submitLoading, debitNote, resetDebitNote, getDebitNoteById, createDebitNotes, updateDebitNotes, loading: debitNoteLoading } = useDebitNote();
  const debitNoteData = debitNote;
  const [selectedVendor, setSelectedVendor] = useState(debitNoteData?.vendorId?._id || '');
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, loading: vendorLoading } = useCustomer();
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
    isSplitWise,
    isSplitSessionActive,
    customerDropDownList,
    getCustomerDropList,
    resetCustomerDropDownList,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity,
    selectedBranchId,
    selectedWarehouseId,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(debitNoteData, RESOURCES.DEBIT_NOTE, {
    skipLocationDropdowns: !!vendorId,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const scrollToError = useScrollToError();
  const { currency } = useCompanyCurrency();
  const { getPendingBills, vendorPendingBills, pendingBillsLoading } = useBill();
  const { profile, address, getProfileAddress, resetAddress } = useProfile();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [debitNoteConfig, setDebitNoteConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [selectedCustomer, setSelectedCustomer] = useState(debitNoteData?.customer?._id || debitNoteData?.customer?.id || '');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useBillNo, setUseBillNo] = useState(false);
  const [isSplitForApi, setIsSplitForApi] = useState(isSplitSessionActive);
  const initialAddressId = useRef(null);
  const configSaveAbortRef = useRef(null);

  const selectedVendorData = vendorId ? { ...debitNoteData?.vendorId, id: debitNoteData?.vendorId?._id } : vendorDropDownList?.find(cust => cust._id === selectedVendor) || {};
  const documentCurrency = selectedVendorData?.currency || debitNoteData?.currency || currency;
  const { pendingActivation, setPendingActivation, resolveActivation } = usePurchaseSaveActivation({
    vendor: selectedVendorData,
    branchId: selectedBranchId,
    itemsDrop: allItemDrop,
    itemsDropLoading: allItemDropLoading,
    getVendorDropList: vendorId ? getVendorDropList : undefined,
  });

  useEffect(() => {
    if (debitNoteData?.isSplit !== undefined) {
      setIsSplitForApi(debitNoteData.isSplit);
    } else if (!vendorId) {
      setIsSplitForApi(isSplitSessionActive);
    }
  }, [debitNoteData?.isSplit, vendorId, isSplitSessionActive]);

  useEffect(() => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('splitBills', isSplitForApi);
      formikRef.current.setFieldValue('isSplit', isSplitForApi);
    }
  }, [isSplitForApi]);

  // Document Configuration Sheet Hook
  const {
    isOpen: isDebitNoteConfigOpen,
    handleOpen: handleOpenDebitNoteConfig,
    handleClose: handleCloseDebitNoteConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.DEBIT_NOTE,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveDebitNoteConfig,
    drawerSaveLoading: debitNoteConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isDebitNoteConfigOpen,
    moduleConfig: debitNoteConfig,
    setModuleConfig: setDebitNoteConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseDebitNoteConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.DEBIT_NOTE,
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
        moduleName: MODULE_NAMES.DEBIT_NOTE,
        customerId: formikRef.current?.values?.vendorId || debitNoteData?.vendorId?._id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update debit note configuration',
  });

  const fetchVendorDrop = branchId => {
    getVendorDropList({ branchId });
  };

  const fetchCustomerAddress = customerId => {
    getCustomerAddress({ customerId });
  };

  const fetchProfileAddress = () => {
    getProfileAddress({});
  };

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { isService: false, signal: controller.signal };

    getModuleConfig({ ...payload, moduleName: MODULE_NAMES.DEBIT_NOTE });
    if (!vendorId) {
      fetchProfileAddress();
    }

    return () => {
      controller.abort();
      resetModuleConfig();
      resetCustomerDropDownList();
      resetCustomerAddress();
      resetAddress();
      resetVendorDropDownList();
    };
  }, []);

  useEffect(() => {
    if (vendorId || !selectedBranchId) return;
    fetchVendorDrop(selectedBranchId);
  }, [selectedBranchId, vendorId]);

  useEffect(() => {
    if (!vendorId || !selectedBranchId) return;
    const controller = new AbortController();
    getCustomerDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [vendorId, selectedBranchId, getCustomerDropList]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedVendor && selectedWarehouseId) {
      getPendingBills({
        vendorId: selectedVendor,
        warehouseId: selectedWarehouseId,
        signal: controller.signal,
        isAdd: true,
        isSplit: isSplitForApi,
      });
    }
    return () => controller.abort();
  }, [selectedVendor, selectedWarehouseId, isSplitForApi, getPendingBills]);

  useEffect(() => {
    if (moduleConfig) {
      setDebitNoteConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !vendorId && debitNoteConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (debitNoteConfig.autoGenerate) {
        const newDebitNoteId = `${debitNoteConfig.prefix}${debitNoteConfig.nextNumber}`;
        formikRef.current.setFieldValue('debitNoteId', newDebitNoteId);
      }
      formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!debitNoteData?.divisionId && !hasSelectedValues && defaultConfig) {
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
  }, [debitNoteConfig, vendorId, debitNoteData, moduleConfig, setFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();

    const loadDebitNote = async () => {
      if (!vendorId) {
        resetDebitNote();
        return;
      }

      try {
        const result = await getDebitNoteById({ debitNoteId: vendorId, signal: controller.signal });
        if (controller.signal.aborted) return;

        const data = result?.data;
        if (data?.customer) {
          fetchCustomerAddress(data.customer);
        } else {
          fetchProfileAddress();
        }
      } catch {
        /* aborted or handled by slice */
      }
    };

    loadDebitNote();

    return () => {
      resetDebitNote();
      controller.abort();
    };
  }, [vendorId]);

  useEffect(() => {
    if (debitNote) {
      setFromEntity(debitNoteData);
      setSelectedVendor(debitNoteData?.vendorId?._id || '');
      setUseBillNo(!!debitNoteData?.billNo && !debitNoteData?.billId);
    }
  }, [debitNote]);

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

    if (debitNoteData?.additionalCharges?.length > 0) {
      debitNoteData?.additionalCharges?.forEach(item => {
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

    return [...moduleChargeArr, ...storedChargesArr];
  };

  useEffect(() => {
    if (customerAddress?.length > 0) {
      let findDefaultAddress = customerAddress?.find(address => address?.isDefault);
      let findSelectedAddress = customerAddress?.find(address => address?._id === selectedAddress?._id || address?._id === debitNoteData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || customerAddress?.[0] || null;

      if (vendorId) {
        if (debitNoteData) {
          setSelectedAddress(nextAddress);
          initialAddressId.current = nextAddress?._id || null;
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [customerAddress, debitNoteData]);

  useEffect(() => {
    if (address?.length > 0) {
      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === debitNoteData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (vendorId) {
        if (debitNoteData) {
          initialAddressId.current = nextAddress?._id || null;
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        initialAddressId.current = nextAddress?._id || null;
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, debitNoteData]);

  useEffect(() => {
    const currentValues = formikRef.current?.values;
    if (!selectedAddress || !currentValues) return;
    if (!selectedVendorData?._id) return;
    const newTaxContext = buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || '');
    if (currentValues.taxContext?.customerState === newTaxContext.customerState) return;
    formikRef.current.setFieldValue('taxContext', newTaxContext);
    calculateAmounts({ ...currentValues, taxContext: newTaxContext }, formikRef.current.setFieldValue);
  }, [selectedAddress, selectedVendorData]); // eslint-disable-line react-hooks/exhaustive-deps

  const additionalChargesConfig = useDeepCompareMemo(moduleConfig?.additionalChargesConfig);

  const emptyItemRow = {
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
  };

  const initialValues = useMemo(() => {
    if (!vendorId || !debitNoteData?._id) {
      return {
        vendorId: null,
        debitNoteId: '',
        referenceNumber: '',
        debitNoteDate: dayjs(),
        subject: '',
        type: null,
        items: [emptyItemRow],
        subTotal: '0.00',
        totalTax: '0.00',
        total: '0.00',
        sgst: '0.00',
        cgst: '0.00',
        igst: '0.00',
        notes: '',
        divisionId: null,
        branchId: null,
        warehouseId: null,
        billId: null,
        additionalcharge: createAdditionalChargesArr(),
        shippingAddressType: 'Organization',
        addressId: initialAddressId.current || null,
        customer: null,
        termsAndConditions: moduleConfig?.termsandConditions || '',
        isRoundOff: true,
        roundOffAmount: 0,
        splitBills: isSplitSessionActive,
        isSplit: isSplitSessionActive,
        attachments: [],
        exchangeRate: 1,
        tax: null,
      };
    }

    const mappedItems = debitNoteData?.items?.map(item => ({
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
    }));

    return {
      vendorId: debitNoteData?.vendorId?._id || null,
      debitNoteId: debitNoteData?.debitNoteId || '',
      referenceNumber: debitNoteData?.referenceNumber || '',
      debitNoteDate: debitNoteData?.debitNoteDate ? dayjs(debitNoteData.debitNoteDate) : dayjs(),
      subject: debitNoteData?.subject || '',
      type: debitNoteData?.type || null,
      items: mappedItems?.length > 0 ? mappedItems : [emptyItemRow],
      subTotal: debitNoteData?.subTotal || '0.00',
      totalTax: debitNoteData?.totalTax || '0.00',
      total: debitNoteData?.total || '0.00',
      sgst: debitNoteData?.totalTax ? toDecimalString(parseFloat(debitNoteData?.totalTax) / 2) : '0.00',
      cgst: debitNoteData?.totalTax ? toDecimalString(parseFloat(debitNoteData?.totalTax) / 2) : '0.00',
      igst: debitNoteData?.totalTax,
      notes: debitNoteData?.notes || '',
      divisionId: debitNoteData?.divisionId || null,
      branchId: debitNoteData?.branchId || null,
      warehouseId: debitNoteData?.warehouseId || null,
      billId: debitNoteData?.billId?._id || debitNoteData?.billId?.id || debitNoteData?.billId || null,
      billNo: debitNoteData?.billNo || '',
      additionalcharge: createAdditionalChargesArr(),
      shippingAddressType: debitNoteData?.customer ? 'Customer' : 'Organization',
      addressId: debitNoteData?.addressId || initialAddressId.current || null,
      customer: debitNoteData?.customer || null,
      termsAndConditions: debitNoteData?.termsAndConditions || moduleConfig?.termsandConditions || '',
      isRoundOff: debitNoteData?.isRoundOff ?? true,
      roundOffAmount: debitNoteData?.roundOffAmount ?? 0,
      splitBills: debitNoteData?.isSplit || false,
      isSplit: debitNoteData?.isSplit || false,
      attachments: debitNoteData?.attachments || [],
      exchangeRate: debitNoteData?.currency?.exchangeRate ?? 1,
      tax: debitNoteData?.tax?.taxId ? debitNoteData.tax : null,
    };
  }, [vendorId, vendorId ? debitNoteData : null, additionalChargesConfig, moduleConfig?.termsandConditions]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['debitNoteId', 'addressId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const findItem = (itemId, allItemDrop) => {
    const item = (allItemDrop || []).find(item => item._id === itemId);
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

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const debitNotePayload = debitNoteTransformer(
      { ...values, taxContext: buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || '') },
      vendorId,
      attachments,
      isSplitWise && isSplitSessionActive && (values.splitBills || debitNoteData?.isSplit)
    );
    Object.assign(debitNotePayload, activationFlags);

    let result = vendorId ? await updateDebitNotes({ vendorId, debitNoteData: debitNotePayload }) : await createDebitNotes(debitNotePayload);

    if (shouldPreventNavigation(result)) {
      return;
    }

    const targetId = vendorId || result?.payload?.data?.id || result?.data?.id;

    if (targetId) {
      navigateAfterSave(`/debit-notes/${targetId}`, {
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

  if (vendorId && (debitNoteLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{vendorId ? `Edit Debit Note / ${debitNoteData?.debitNoteId}` : 'Add Debit Note'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedVendor && (
              <CustomerBasicDetail
                customerData={{
                  ...selectedVendorData,
                  id: selectedVendorData?.id || selectedVendorData?._id,
                }}
                isVendor={true}
                wrapperClassName="flex items-center"
              />
            )}
            {!vendorId && (
              <Button type="default" onClick={handleOpenDebitNoteConfig} className="flex items-center gap-2">
                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
                Debit Note Configuration
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="relative pb-24 bg-white pt-16 -m-4">
        <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={debitNoteValidateSchema(debitNoteConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize={true}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched }) => {
            // Update form values for dirty checking
            updateFormValues(values);
            return (
              <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="px-6 flex flex-col gap-2">
                  {/* Inventory context */}
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    {!vendorId ? (
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
                            setSelectedVendor('');
                            setFieldValue('billId', null, false);
                            setFieldValue('billNo', '', false);
                            setFieldValue('customer', null, false);
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
                            setSelectedVendor('');
                            setFieldValue('billId', null, false);
                            setFieldValue('billNo', '', false);
                            setFieldValue('customer', null, false);
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
                            setFieldValue('billId', null, false);
                            setFieldValue('billNo', '', false);
                            const selectedWarehouse = (warehouseDrop || []).find(w => (w.id ?? w._id) === (e || ''));
                            const { branchId } = getDivisionBranchFromWarehouseOption(selectedWarehouse);
                            if (branchId && branchId !== values.branchId) {
                              setFieldValue('vendorId', null, false);
                              setSelectedVendor('');
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
                          disabled={warehouseRequiresCascade && !values.branchId}
                          loading={warehouseLoading}
                        />
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                        <CustomInput type="text" name="divisionId" label="Division" value={debitNoteData?.divisionName} disabled />
                        <CustomInput type="text" name="branchId" label="Branch" value={debitNoteData?.branchName} disabled />
                        <CustomInput type="text" name="warehouseId" label="Warehouse" value={debitNoteData?.warehouseName} disabled />
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
                          {!vendorId ? (
                            <CustomInput
                              type="select"
                              selectVariant="twoColumn"
                              columnSelectHeader={{ id: 'Vendor ID', name: 'Vendor Name' }}
                              name="vendorId"
                              label="Vendor Name"
                              placeholder="Select Vendor Name"
                              value={values.vendorId}
                              onChange={e => {
                                const newVendorDetail = vendorDropDownList?.find(cust => cust._id === e) || {};
                                setFieldValue('vendorId', e);
                                const taxContext = buildTaxContext(profile, newVendorDetail, newVendorDetail?.address?.billing?.state || '');
                                setFieldValue('taxContext', taxContext, false);
                                setFieldValue('tax', null, false);
                                const setFieldValueWithoutValidation = (field, value) => setFieldValue(field, value, false);
                                calculateAmounts({ ...values, taxContext, tax: null }, setFieldValueWithoutValidation);
                                setSelectedVendor(e);
                                setFieldValue('billId', null, false);
                                setFieldValue('billNo', '', false);
                                setFieldValue('exchangeRate', newVendorDetail?.currency?.exchangeRate || 1, false);
                              }}
                              onBlur={handleBlur}
                              errorMessage={errors.vendorId}
                              touched={touched.vendorId}
                              setFieldValue={setFieldValue}
                              selectOptions={buildCustomerSelectOptions(vendorDropDownList, values.branchId)}
                              loading={vendorLoading}
                              required
                              notFoundContent={<div className="flex items-center justify-center w-full">No Vendor Available</div>}
                            />
                          ) : (
                            <CustomInput type="text" name="vendorId" label="Vendor Name" value={debitNoteData?.vendorId?.customerDisplayName} disabled />
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                        <CustomInput
                          type="text"
                          name="debitNoteId"
                          label="Debit Note#"
                          placeholder="Enter Debit Note"
                          value={values.debitNoteId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.debitNoteId}
                          touched={touched.debitNoteId}
                          setFieldValue={setFieldValue}
                          disabled={debitNoteConfig?.autoGenerate || vendorId}
                          suffix={
                            !vendorId && (
                              <Tooltip title="Configure Payment Received Number">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            )
                          }
                          required
                        />

                        <CustomInput
                          type="date"
                          name="debitNoteDate"
                          label="Debit Note Date"
                          value={values.debitNoteDate ? values.debitNoteDate : null}
                          setFieldValue={setFieldValue}
                          setFieldTouched={setFieldTouched}
                          onBlur={handleBlur}
                          errorMessage={errors.debitNoteDate}
                          touched={touched.debitNoteDate}
                          placeholder="Select Vendor Date"
                          format="YYYY-MM-DD"
                        />

                        <CustomInput
                          type="select"
                          name="type"
                          label="Debit Note Type"
                          placeholder="Select debit note type"
                          value={values.type}
                          onBlur={handleBlur}
                          errorMessage={errors.type}
                          touched={touched.type}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectOptions={Object.entries(DEBIT_NOTE_TYPE_ENUM).map(([key, value]) => ({
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

                        {values?.vendorId ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 items-start">
                            <div>
                              {!useBillNo ? (
                                <CustomInput
                                  type="select"
                                  name="billId"
                                  label="Bill"
                                  required={true}
                                  value={values.billId}
                                  onChange={e => {
                                    setFieldValue('billId', e);
                                    setFieldValue('billNo', '');
                                    const billTax = vendorPendingBills?.find(bill => (bill._id || bill.id) === e)?.tax;
                                    const tax = billTax?.taxId ? { ...billTax, amount: null } : null;
                                    setFieldValue('tax', tax, false);
                                    calculateAmounts({ ...values, tax, taxContext: buildTaxContext(profile, selectedVendorData, selectedVendorData?.address?.billing?.state || '') }, (field, value) =>
                                      setFieldValue(field, value, false)
                                    );
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.billId}
                                  touched={touched.billId}
                                  setFieldValue={setFieldValue}
                                  placeholder="Select Bill"
                                  selectOptions={(vendorPendingBills || []).map(option => ({
                                    label: option?.billId,
                                    value: option?._id || option?.id,
                                  }))}
                                  loading={pendingBillsLoading}
                                />
                              ) : (
                                <CustomInput
                                  type="text"
                                  name="billNo"
                                  label="Bill No"
                                  required={true}
                                  value={values.billNo}
                                  onChange={e => {
                                    setFieldValue('billNo', e.target.value);
                                    if (values.billId) {
                                      setFieldValue('billId', null);
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.billNo}
                                  touched={touched.billNo}
                                  setFieldValue={setFieldValue}
                                  placeholder="Enter Bill No"
                                />
                              )}
                            </div>
                            <div className="pt-7">
                              <Tooltip title="Check to enter Bill No manually instead of selecting from list">
                                <div>
                                  <CustomInput
                                    type="checkbox"
                                    name="useBillNo"
                                    CheckboxName="Use Bill No"
                                    value={useBillNo}
                                    onChange={e => {
                                      const checked = e.target.checked;
                                      setUseBillNo(checked);
                                      setFieldValue(checked ? 'billId' : 'billNo', checked ? null : '');
                                    }}
                                    setFieldValue={setFieldValue}
                                    checkboxClassName="mt-1"
                                  />
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        ) : (
                          <div />
                        )}

                        <div className="md:col-start-1 lg:col-start-1">
                          <CustomInput
                            name="shippingAddressType"
                            label=""
                            type="radio"
                            value={values.shippingAddressType}
                            onChange={e => {
                              initialAddressId.current = null;
                              setFieldValue('customer', null);
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
                          />
                          {values?.shippingAddressType === 'Organization' && (
                            <AdditionalAddressContainer
                              customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
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
                                  initialAddressId.current = null;
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
                                required
                              />
                              {values?.customer && (
                                <AdditionalAddressContainer
                                  customerAddress={values?.shippingAddressType === 'Customer' ? customerAddress : address}
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

                        {documentCurrency?.code && currency?.code && documentCurrency.code !== currency.code ? (
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
                        ) : null}

                        {isSplitSessionActive && isSplitWise && (
                          <div className="flex gap-x-4 pt-2">
                            <div className="w-max">
                              <CustomInput
                                type="switch"
                                name="splitBills"
                                value={values.splitBills}
                                onChange={checked => {
                                  setIsSplitForApi(checked);
                                  setFieldValue('splitBills', checked);
                                  setFieldValue('isSplit', checked);
                                  calculateAmounts({ ...values, isSplit: checked }, setFieldValue);
                                  setFieldValue('billId', null);
                                  setFieldValue('billNo', '');
                                  setUseBillNo(false);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.splitBills}
                                touched={touched.splitBills}
                                setFieldValue={setFieldValue}
                                disabled={vendorId}
                              />
                            </div>
                            <div>Split Bills</div>
                          </div>
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
                    moduleType={MODULE_TYPE.PURCHASE}
                    page={MODULE_NAMES.DEBIT_NOTE}
                    pageType={pageTypes.DEBIT_NOTE}
                    excludeDocumentId={vendorId || undefined}
                  />
                  {/* Attach File(s) & TotalContainer section */}
                  <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mt-3">
                    {/* Left side: Attach File(s) */}
                    <div className="flex-1 w-full lg:max-w-[480px]">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <CustomFileUpload
                          name="attachments"
                          label="Attach file(s) to Debit Note"
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
                        directTaxTypes={['TDS', 'TCS']}
                        isDirectTaxApplicable={selectedVendorData?.isVendorDirectTax}
                        documentDate={values.debitNoteDate}
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
                <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-5 flex-wrap">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      loading={submitLoading}
                      htmlType="button"
                      onClick={async () => {
                        if (!values?.addressId) {
                          Toast.error('Address is required');
                          return;
                        }

                        let errors = await formikRef.current.validateForm();

                        if (Object.keys(errors).length > 0) {
                          formikRef.current.setTouched(errorsToTouched(errors));
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
              </CustomForm>
            );
          }}
        </Formik>
      </div>
      <DocumentActivationModal
        open={!!pendingActivation}
        documentLabel="debit note"
        partyLabel={confirmModalEnum.DOCUMENT_ACTIVATION.VENDOR_LABEL}
        partyName={pendingActivation?.needsVendor ? selectedVendorData?.customerDisplayName : null}
        branchName={branchDrop?.find(branch => (branch?.id ?? branch?._id) === selectedBranchId)?.name || debitNoteData?.branchName}
        warehouseName={warehouseDrop?.find(warehouse => (warehouse?.id ?? warehouse?._id) === selectedWarehouseId)?.name || debitNoteData?.warehouseName}
        itemNames={pendingActivation?.itemNames}
        loading={submitLoading}
        onConfirm={async () => {
          await onFinish(pendingActivation.values, { activationConfirmed: true });
          setPendingActivation(null);
        }}
        onCancel={() => setPendingActivation(null)}
      />
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={debitNoteConfig}
        resource={RESOURCES.DEBIT_NOTE}
        setConfigDetail={config => {
          setDebitNoteConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES.DEBIT_NOTE}
      />
      {!vendorId && (
        <DocumentConfigSheet
          resource={RESOURCES.DEBIT_NOTE}
          open={isDebitNoteConfigOpen}
          onClose={handleCloseDebitNoteConfig}
          onSave={handleSaveDebitNoteConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || debitNoteConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={debitNoteConfigSaving}
        />
      )}
    </>
  );
};

export default AddDebitNote;
