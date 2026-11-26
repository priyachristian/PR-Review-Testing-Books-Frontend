import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import AddAccountModel from '@/components/feedback/formModal/AddAccountModel';
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import { Button, Tooltip } from '@/components/AntDComponent';

// Hooks
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Extras
import { useRecurringExpenses, recurringExpenseValidateSchema, recurringExpenseTransformer } from '@/features/purchase/recurringExpenses';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { MODULE_NAMES } from 'utils/constants';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { colorPalette } from '@/utils/theme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddRecurringExpense = () => {
  const { recurringExpenseId } = useParams();
  const location = useLocation();
  const formikRef = useRef();
  const dispatch = useDispatch();
  const {
    submitLoading,
    recurringExpense,
    createRecurringExpenses,
    updateRecurringExpenses,
    getRecurringExpenseById,
    resetRecurringExpense,
    loading: recurringExpenseLoading,
  } = useRecurringExpenses();
  const expenseData = recurringExpense;
  const { currency } = useCompanyCurrency();
  const [modalOpen1, setModalOpen1] = useState(false);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    selectedCustomerId,
    setSelectedCustomerId,
    customerDropDownList,
    resetCustomerDropDownList,
    customerLoading,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(expenseData, RESOURCES.RECURRING_EXPENSES, {
    enableBranchFirst: !recurringExpenseId,
    enableWarehouseFirst: !recurringExpenseId,
    moduleConfig,
  });
  const { address, getProfileAddress, resetAddress, loading: profileLoading } = useProfile();
  const { accountDrop, getAccounts, droploading: accountDropLoading } = useChartOfAccounts();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [expenseConfig, setExpenseConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const scrollToError = useScrollToError();
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Document Configuration Sheet Hook
  const {
    isOpen: isRecurringExpenseConfigOpen,
    handleOpen: handleOpenRecurringExpenseConfig,
    handleClose: handleCloseRecurringExpenseConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.RECURRING_EXPENSE,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveRecurringExpenseConfig,
    drawerSaveLoading: recurringExpenseConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isRecurringExpenseConfigOpen,
    moduleConfig: expenseConfig,
    setModuleConfig: setExpenseConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseRecurringExpenseConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.RECURRING_EXPENSE,
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
        moduleName: MODULE_NAMES.RECURRING_EXPENSE,
        customerId: formikRef.current?.values?.customerId || selectedCustomerId || expenseData?.customerId?._id || expenseData?.customerId?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update recurring expense configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const selectedCustomerData = customerDropDownList?.find(cust => cust.id === selectedCustomerId) || {};
  const documentCurrency = selectedCustomerData?.currency || expenseData?.currency || currency;

  const fetchProfileAddress = () => {
    getProfileAddress({});
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getAccounts({ ...payload, type: 'EXPENSE' });
    getAccounts({ ...payload, type: 'PAYMENT' });
    getModuleConfig({ ...payload, moduleName: MODULE_NAMES?.RECURRING_EXPENSE });
    if (!recurringExpenseId) {
      fetchProfileAddress();
    }
    return () => {
      resetModuleConfig();
      resetCustomerDropDownList();
      resetAddress();
      controller.abort();
    };
  }, [recurringExpenseId, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRecurringExpense = async () => {
      if (!recurringExpenseId) {
        resetRecurringExpense();
        return;
      }

      const result = await getRecurringExpenseById({
        recurringExpenseId,
        signal: controller.signal,
      });
      if (controller.signal.aborted || result.meta?.requestStatus !== 'fulfilled') return;

      fetchProfileAddress();
    };

    loadRecurringExpense();

    return () => {
      controller.abort();
      resetAddress();
      resetRecurringExpense();
    };
  }, [recurringExpenseId]);

  useEffect(() => {
    if (expenseData) {
      setDivisionBranchWarehouseFromEntity(expenseData);
      setSelectedCustomerId(expenseData?.customerId?._id || expenseData?.customerId?.id || '');
    }
  }, [expenseData, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (moduleConfig) {
      setExpenseConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !recurringExpenseId && expenseConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (expenseConfig.autoGenerate) {
        const newRecurringExpenseId = `${expenseConfig.prefix}${expenseConfig.nextNumber}`;
        formikRef.current.setFieldValue('recurringExpenseId', newRecurringExpenseId);
      }
      formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!expenseData?.divisionId && !hasSelectedValues && defaultConfig) {
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
  }, [expenseConfig, recurringExpenseId, expenseData, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (address?.length > 0) {
      let findDefaultAddress = address?.find(address => address?.isDefault);
      let findSelectedAddress = address?.find(address => address?._id === selectedAddress?._id || address?._id === expenseData?.addressId);
      const nextAddress = findSelectedAddress || findDefaultAddress || address?.[0] || null;

      if (recurringExpenseId) {
        if (expenseData) {
          setSelectedAddress(nextAddress);
          formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
        }
      } else {
        setSelectedAddress(nextAddress);
        formikRef.current?.setFieldValue('addressId', nextAddress?._id || null);
      }
    }
  }, [address, expenseData]);

  const initialValues = useMemo(
    () => ({
      recurringExpenseId: expenseData?.recurringExpenseId || '',
      divisionId: expenseData ? expenseData?.divisionId : null,
      branchId: expenseData ? expenseData?.branchId : null,
      warehouseId: expenseData?.warehouseId || null,
      expenseAccount: expenseData ? expenseData?.expenseAccount : null,
      amount: expenseData ? expenseData?.amount : '',
      paidThroughAccountId: expenseData?.paidThroughAccountId?._id || expenseData?.paidThroughAccountId?.id || expenseData?.paidThroughAccountId || null,
      notes: expenseData ? expenseData?.notes : '',
      customer: expenseData ? expenseData?.customer?._id || expenseData?.customer?.id : null,
      termsAndConditions: expenseData?.termsAndConditions || moduleConfig?.termsandConditions || '',
      frequency: expenseData?.repeatEvery?.frequency || null,
      period: expenseData?.repeatEvery?.period || null,
      startDate: expenseData?.startDate ? dayjs(expenseData.startDate) : null,
      endDate: expenseData?.endDate ? dayjs(expenseData.endDate) : null,
      neverExpires: expenseData?.neverExpires || false,
      exchangeRate: expenseData?.currency?.exchangeRate ?? 1,
      receipts: expenseData?.receipts || [],
    }),
    [expenseData]
  );

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['recurringExpenseId', 'addressId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const onFinish = async values => {
    if (submitLoading) return;

    const receipts = Array.isArray(values.receipts) ? values.receipts.filter(item => item != null) : values.receipts ? [values.receipts] : [];
    const recurringExpenseData = recurringExpenseTransformer(values, recurringExpenseId, receipts);
    const result = recurringExpenseId ? await updateRecurringExpenses({ expenseId: recurringExpenseId, recurringExpenseData }) : await createRecurringExpenses(recurringExpenseData);
    const targetId = recurringExpenseId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/recurring-expenses/${targetId}`, {
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

  if (recurringExpenseId && (recurringExpenseLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{recurringExpenseId ? `Edit Recurring Expense` : 'Add Recurring Expense'}</h1>
            </div>
          </div>
          {!recurringExpenseId && (
            <Button type="default" onClick={handleOpenRecurringExpenseConfig} className="flex items-center gap-2">
              <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
              Recurring Expense Configuration
            </Button>
          )}
        </div>
      </div>
      <div className="relative pb-24 bg-white pt-16 -m-4">
        <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={recurringExpenseValidateSchema(expenseConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
            // Update form values for dirty checking
            updateFormValues(values);
            return (
              <CustomForm onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="px-6 flex flex-col gap-2">
                  {/* Inventory context */}
                  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
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
                            setFieldValue('customer', null, false);
                          }
                        }}
                        onBlur={handleBlur}
                        errorMessage={errors.warehouseId}
                        touched={touched.warehouseId}
                        setFieldValue={setFieldValue}
                        selectVariant="twoColumn"
                        columnSelectHeader={warehouseSelectColumnHeader}
                        selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                        disabled={warehouseRequiresCascade && !values.branchId}
                        required={true}
                        loading={warehouseLoading}
                      />
                    </div>
                  </div>

                  {/* Expense details */}
                  <div className={`${!values?.divisionId || !values?.branchId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0">Expense details</h3>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                        <div className="relative">
                          {documentCurrency && selectedCustomerId && (
                            <div className="absolute top-0 right-0 z-10">
                              <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                            </div>
                          )}
                          <CustomInput
                            type="select"
                            selectVariant="twoColumn"
                            columnSelectHeader={{ id: 'Customer/Vendor ID', name: 'Customer/Vendor Name' }}
                            name="customer"
                            label="Customer/Vendor Name"
                            value={values.customer}
                            onChange={e => {
                              const newCustomerDetail = customerDropDownList?.find(cust => cust.id === e) || {};
                              setSelectedCustomerId(e);
                              setFieldValue('customer', e);
                              setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1, false);
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.customer}
                            touched={touched.customer}
                            setFieldValue={setFieldValue}
                            placeholder="Select Customer/Vendor Name"
                            selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                            loading={customerLoading}
                            notFoundContent={<div className="flex items-center justify-center w-full">No Customer/Vendor Available</div>}
                          />
                          <AdditionalAddressContainer
                            customerAddress={address}
                            addressLoading={profileLoading}
                            fetchCustomerAddress={fetchProfileAddress}
                            selectedCustomer={selectedCustomerId}
                            setFieldValue={setFieldValue}
                            selectedAddress={selectedAddress}
                            setSelectedAddress={setSelectedAddress}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                        <div>
                          <CustomInput
                            type="text"
                            name="recurringExpenseId"
                            label="Expenses#"
                            placeholder="Enter Expenses"
                            value={values.recurringExpenseId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.recurringExpenseId}
                            touched={touched.recurringExpenseId}
                            setFieldValue={setFieldValue}
                            disabled={expenseConfig?.autoGenerate || recurringExpenseId}
                            suffix={
                              !recurringExpenseId && (
                                <Tooltip title="Configure Expenses Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required={true}
                          />
                        </div>

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

                        <div className="flex items-center gap-2 justify-between w-full">
                          <CustomInput
                            type="account"
                            name="expenseAccount"
                            label="Expense Account"
                            placeholder="Select Expense Account"
                            value={values.expenseAccount}
                            onBlur={handleBlur}
                            errorMessage={errors.expenseAccount}
                            touched={touched.expenseAccount}
                            setFieldValue={setFieldValue}
                            filterOption={(input, option) => {
                              if (!option) return false;
                              const searchText = input.toLowerCase();
                              const getLabelText = label => {
                                if (typeof label === 'string') return label;
                                if (typeof label === 'object' && label.props?.children) return label.props.children;
                                return '';
                              };

                              const optionLabel = getLabelText(option.label).toLowerCase();
                              const optionTitle = option.title?.toLowerCase() || '';

                              return optionLabel.includes(searchText) || optionTitle.includes(searchText);
                            }}
                            onChange={value => {
                              if (value === 'addNewAccount') {
                                setModalOpen1(true);
                              } else {
                                setFieldValue(`expenseAccount`, value);
                              }
                            }}
                            selectOptions={accountDrop.EXPENSE}
                            loading={accountDropLoading}
                            required={true}
                          />
                          <Icons.PlusCircleOutlined
                            onClick={() => {
                              setModalOpen1(true);
                            }}
                            style={{ color: colorPalette.primary[500] }}
                            className="text-xl cursor-pointer w-max py-1.5 mt-5"
                          />
                        </div>

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

                        <CustomInput
                          type="number"
                          name="amount"
                          label="Amount"
                          placeholder="Enter Amount"
                          value={values.amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.amount}
                          touched={touched.amount}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          type="account"
                          name="paidThroughAccountId"
                          label="Paid Through"
                          placeholder="Select Paid Through Account"
                          value={values.paidThroughAccountId}
                          onChange={value => setFieldValue('paidThroughAccountId', value || null)}
                          onBlur={handleBlur}
                          errorMessage={errors.paidThroughAccountId}
                          touched={touched.paidThroughAccountId}
                          setFieldValue={setFieldValue}
                          selectOptions={accountDrop.PAYMENT}
                          loading={accountDropLoading}
                          required={true}
                        />

                        <CustomInput
                          type="textarea"
                          name="notes"
                          label="Notes"
                          placeholder="Max.500 characters"
                          value={values.notes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.notes}
                          touched={touched.notes}
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

                        {!(documentCurrency?.code && currency?.code && documentCurrency.code !== currency.code) && (
                          <CustomFileUpload
                            name="receipts"
                            label="Upload Your Files"
                            value={values.receipts}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            errorMessage={errors.receipts}
                            touched={touched.receipts}
                            fileType="all"
                            multiple={true}
                            maxSize={5}
                            maxFiles={3}
                            compact={true}
                          />
                        )}
                        {documentCurrency?.code && currency?.code && documentCurrency.code !== currency.code && (
                          <CustomFileUpload
                            name="receipts"
                            label="Upload Your Files"
                            value={values.receipts}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            errorMessage={errors.receipts}
                            touched={touched.receipts}
                            fileType="all"
                            multiple={true}
                            maxSize={5}
                            maxFiles={3}
                            compact={true}
                          />
                        )}

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
                {values?.divisionId && values?.branchId && (
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
                          handleSubmit();
                        }}
                      />
                      <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                    </div>
                  </div>
                )}
              </CustomForm>
            );
          }}
        </Formik>
      </div>
      {modalOpen1 && (
        <AddAccountModel
          modalOpen1={modalOpen1}
          setModalOpen1={setModalOpen1}
          getList={() => {
            getAccounts({ type: 'EXPENSE' });
            getAccounts({ type: 'PAYMENT' });
          }}
        />
      )}
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={expenseConfig}
        resource={RESOURCES.RECURRING_EXPENSES}
        setConfigDetail={config => {
          setExpenseConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES?.RECURRING_EXPENSE}
      />
      {!recurringExpenseId && (
        <DocumentConfigSheet
          resource={RESOURCES.RECURRING_EXPENSES}
          open={isRecurringExpenseConfigOpen}
          onClose={handleCloseRecurringExpenseConfig}
          onSave={handleSaveRecurringExpenseConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || recurringExpenseConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={recurringExpenseConfigSaving}
        />
      )}
    </>
  );
};

export default AddRecurringExpense;
