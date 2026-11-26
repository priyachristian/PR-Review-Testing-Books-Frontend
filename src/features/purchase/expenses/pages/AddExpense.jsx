import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import TotalContainer, { GrandTotalBar } from '@/components/ui/common/TotalContainer';
import { Button, Tooltip } from '@/components/AntDComponent';

// Hooks
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useAccountLedger } from '@/features/accountant/accountLedger';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import useDocumentConfigSheet from 'hooks/useDocumentConfigSheet';
import useDocumentDrawerModuleConfigSave from 'hooks/useDocumentDrawerModuleConfigSave';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Extras
import { useExpenses, expenseValidateSchema, expenseTransformer, calculateExpenseAmounts, stripExpenseForDuplicate } from '@/features/purchase/expenses';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { MODULE_NAMES } from 'utils/constants';
import { buildCustomerSelectOptions, buildLedgerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { EXPENSE_AMOUNTS_ARE_OPTIONS, EXPENSE_INPUT_CREDIT_OPTIONS, EXPENSE_SUPPLY_TYPE_OPTIONS, EXPENSE_TAX_SPLIT_OPTIONS, GST_RATE_OPTIONS } from '@/utils/dropdownEnums';
import { buildTaxContext, isIGSTExists } from 'utils/services';
import { errorsToTouched } from '@/utils/util';
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

const AddExpense = () => {
  const { expenseId } = useParams();
  const location = useLocation();
  const formikRef = useRef();
  const dispatch = useDispatch();
  const { submitLoading, expense, createExpenses, updateExpenses, getExpenseById, resetExpenses, loading: expenseLoading } = useExpenses();
  const duplicateFromId = !expenseId ? location.state?.duplicateFromId : null;
  const isDuplicate = Boolean(duplicateFromId);
  const expenseData = useMemo(() => (isDuplicate ? stripExpenseForDuplicate(expense) : expense), [expense, isDuplicate]);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig, updateModuleConfig } = useModuleConfig();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    selectedBranchId,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    selectedCustomerId,
    setSelectedCustomerId,
    customerLoading,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(expenseData, RESOURCES.EXPENSES, {
    enableBranchFirst: !expenseId && !isDuplicate,
    enableWarehouseFirst: !expenseId && !isDuplicate,
    moduleConfig,
  });
  const { accountDrop, getAccounts, droploading: accountDropLoading } = useChartOfAccounts();
  const { allCustomersDropDownList, getAllCustomersDropList, resetAllCustomersDropDownList } = useCustomer();
  const { accountLedgerDrop, getAccountLedgerDropdown, resetAccountLedgerDrop, dropLoading: ledgerDropLoading } = useAccountLedger();
  const { profile, getCompanyProfileSettings } = useProfile();
  const { currency } = useCompanyCurrency();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [expenseConfig, setExpenseConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const configSaveAbortRef = useRef(null);
  const scrollToError = useScrollToError();

  const {
    isOpen: isExpenseConfigOpen,
    handleOpen: handleOpenExpenseConfig,
    handleClose: handleCloseExpenseConfig,
    getTermsAndConditionsValue,
    loading: documentConfigLoading,
  } = useDocumentConfigSheet({
    moduleName: MODULE_NAMES.EXPENSE,
    moduleConfig,
    formikRef,
    formFieldName: 'termsAndConditions',
  });

  const {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave: handleSaveExpenseConfig,
    drawerSaveLoading: expenseConfigSaving,
  } = useDocumentDrawerModuleConfigSave({
    isDrawerOpen: isExpenseConfigOpen,
    moduleConfig: expenseConfig,
    setModuleConfig: setExpenseConfig,
    formikRef,
    abortRef: configSaveAbortRef,
    onClose: handleCloseExpenseConfig,
    persist: async ({ signal, number, terms }) => {
      await updateModuleConfig({
        moduleName: MODULE_NAMES.EXPENSE,
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
        moduleName: MODULE_NAMES.EXPENSE,
        customerId: formikRef.current?.values?.party || selectedCustomerId || expenseData?.party?.id,
        signal,
      }).catch(() => {}),
    errorMessage: 'Failed to update expense configuration',
  });

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const selectedCustomerData = allCustomersDropDownList?.find(cust => cust.id === selectedCustomerId) || {};
  const isVendor = selectedCustomerData?.Role?.isVendor;
  const documentCurrency = selectedCustomerData?.currency || expenseData?.currency || currency;

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getAccounts({ ...payload, type: 'EXPENSE' });
    getAccounts({ ...payload, type: 'PAYMENT' });
    getAccountLedgerDropdown(payload);
    getModuleConfig({ ...payload, moduleName: MODULE_NAMES?.EXPENSE });
    getCompanyProfileSettings(payload);
    return () => {
      resetModuleConfig();
      resetAllCustomersDropDownList();
      resetAccountLedgerDrop();
      controller.abort();
    };
  }, [expenseId, getAccounts, getAccountLedgerDropdown, getModuleConfig, getCompanyProfileSettings, resetModuleConfig, resetAllCustomersDropDownList, resetAccountLedgerDrop]);

  useEffect(() => {
    if (!selectedBranchId) return;

    const controller = new AbortController();
    getAllCustomersDropList({ branchId: selectedBranchId, signal: controller.signal });
    return () => controller.abort();
  }, [selectedBranchId, getAllCustomersDropList]);

  useEffect(() => {
    const controller = new AbortController();

    const loadExpense = async () => {
      if (!expenseId && !duplicateFromId) {
        resetExpenses();
        return;
      }

      await getExpenseById({ expenseId: expenseId || duplicateFromId, signal: controller.signal });
    };

    loadExpense();

    return () => {
      controller.abort();
      resetExpenses();
    };
  }, [expenseId, duplicateFromId]);

  useEffect(() => {
    if (expenseData) {
      setDivisionBranchWarehouseFromEntity(expenseData);
      setSelectedCustomerId(expenseData?.party?.id || '');
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
    if (formikRef.current && !expenseId && expenseConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      if (expenseConfig.autoGenerate) {
        const newExpensesId = `${expenseConfig.prefix}${expenseConfig.nextNumber}`;
        formikRef.current.setFieldValue('expenseId', newExpensesId);
      }
      if (!isDuplicate) {
        formikRef.current.setFieldValue('termsAndConditions', moduleConfig?.termsandConditions);
      }

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!expenseData?.divisionId && !hasSelectedValues && !isDuplicate && defaultConfig) {
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
  }, [expenseConfig, expenseId, expenseData, moduleConfig, isDuplicate, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  const initialValues = useMemo(
    () => ({
      expenseId: expenseData?.expenseId || '',
      divisionId: expenseData ? expenseData?.divisionId : null,
      branchId: expenseData ? expenseData?.branchId : null,
      warehouseId: expenseData?.warehouseId || null,
      date: expenseData?.date ? dayjs(expenseData.date) : dayjs(),
      paidThroughAccountId: expenseData?.paidThroughAccountId?.id || null,
      notes: expenseData ? expenseData?.notes : '',
      party: expenseData?.party?.id || null,
      termsAndConditions: expenseData?.termsAndConditions || moduleConfig?.termsandConditions || '',
      receipts: expenseData?.receipts || [],
      exchangeRate: expenseData?.currency?.exchangeRate ?? 1,
      lines: expenseData?.lines?.length
        ? expenseData.lines
        : [
            {
              accountId: expenseData?.expenseAccount?.id || null,
              description: '',
              amount: expenseData?.total ?? '',
              gst: 'none',
              supplyType: 'GOODS',
              hsnCode: '',
              isItcEligible: !!profile?.gstNumber,
            },
          ],
      invoiceNo: expenseData?.invoiceNo || '',
      invoiceDate: expenseData?.invoiceDate ? dayjs(expenseData.invoiceDate) : null,
      isTaxInclusive: expenseData?.isTaxInclusive ?? false,
      taxSplit: expenseData?.taxSplit ?? 'CGST_SGST',
      supplierGstin: expenseData?.supplierGstin || '',
      isBillable: expenseData?.isBillable ?? false,
      tax: expenseData?.tax || null,
      isRoundOff: expenseData?.isRoundOff ?? false,
      subTotal: expenseData?.subTotal ?? expenseData?.total ?? 0,
      totalTax: expenseData?.totalTax ?? 0,
      total: expenseData?.total ?? 0,
      roundOffAmount: expenseData?.roundOffAmount ?? 0,
    }),
    [expenseData, profile?.gstNumber]
  );

  const fieldsToIgnore = ['expenseId', 'termsAndConditions'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const onFinish = async values => {
    if (submitLoading) return;

    const receipts = Array.isArray(values.receipts) ? values.receipts.filter(item => item != null) : values.receipts ? [values.receipts] : [];
    const payload = expenseTransformer(values, receipts);
    const result = expenseId ? await updateExpenses({ expenseId, expenseData: payload }) : await createExpenses(payload);
    const targetId = expenseId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/expenses/${targetId}`, {
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

  if ((expenseId || isDuplicate) && (expenseLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{expenseId ? `Edit Expense` : 'Add Expense'}</h1>
            </div>
          </div>
          {!expenseId && (
            <Button type="default" onClick={handleOpenExpenseConfig} className="flex items-center gap-2">
              <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
              Expense Configuration
            </Button>
          )}
        </div>
      </div>
      <div className="relative pb-24 bg-white pt-16 -m-4">
        <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={expenseValidateSchema(expenseConfig?.autoGenerate, isVendor)} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => {
            updateFormValues(values);

            const isVendorSupplier = isVendor && !values.isBillable;
            const isTaxFreeVendor = isVendorSupplier && !selectedCustomerData?.gstinUin;
            const canClaimCredit = !!profile?.gstNumber && !(values.isBillable && !isVendor);
            const hasGstLine = values.lines.some(line => Number(line.gst) > 0);
            const isCreditClaimed = values.lines.some(line => Number(line.gst) > 0 && line.isItcEligible);

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
                          setFieldValue('party', null, false);
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
                          setFieldValue('party', null, false);
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
                            setFieldValue('party', null, false);
                          }
                        }}
                        onBlur={handleBlur}
                        required={true}
                        errorMessage={errors.warehouseId}
                        touched={touched.warehouseId}
                        setFieldValue={setFieldValue}
                        selectVariant="twoColumn"
                        columnSelectHeader={warehouseSelectColumnHeader}
                        selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                        disabled={warehouseRequiresCascade && !values.branchId}
                        loading={warehouseLoading}
                      />
                    </div>
                  </div>

                  {/* Expense details */}
                  <div className={`flex flex-col gap-2 ${!values?.divisionId || !values?.branchId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0">Expense details</h3>

                      {/* Header fields */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 pt-2 items-start relative">
                        <div className="relative">
                          {documentCurrency && selectedCustomerId && (
                            <div className="absolute top-0 right-0 z-10">
                              <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                            </div>
                          )}
                          <CustomInput
                            type="select"
                            selectVariant="twoColumn"
                            columnSelectHeader={{ id: 'Party No', name: 'Customer/Vendor/Ledger Name' }}
                            name="party"
                            label="Customer/Vendor/Ledger"
                            value={values.party}
                            onChange={e => {
                              const isLedger = (accountLedgerDrop || []).some(ledger => ledger.id === e);
                              const newCustomerDetail = allCustomersDropDownList?.find(cust => cust.id === e) || {};

                              setSelectedCustomerId(isLedger ? null : e);
                              setFieldValue('party', e);
                              setFieldValue('exchangeRate', isLedger ? 1 : newCustomerDetail?.currency?.exchangeRate || 1);
                              setFieldValue('isBillable', false);
                              setFieldValue('tax', null);
                              const isNewTaxFreeVendor = newCustomerDetail.Role?.isVendor && !newCustomerDetail.gstinUin;
                              const lines = isNewTaxFreeVendor ? values.lines.map(line => ({ ...line, gst: 'none' })) : values.lines;
                              setFieldValue('lines', lines);
                              setFieldValue('supplierGstin', '');
                              setFieldValue('taxSplit', isIGSTExists(buildTaxContext(profile, newCustomerDetail, newCustomerDetail.address?.billing?.state || '')) ? 'IGST' : 'CGST_SGST');
                              calculateExpenseAmounts({ ...values, lines, tax: null }, setFieldValue);
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.party}
                            touched={touched.party}
                            setFieldValue={setFieldValue}
                            placeholder="Select Party"
                            selectOptions={[...buildCustomerSelectOptions(allCustomersDropDownList, values.branchId), ...buildLedgerSelectOptions(accountLedgerDrop)]}
                            loading={customerLoading || ledgerDropLoading}
                            notFoundContent={<div className="flex items-center justify-center w-full">No Customer/Vendor/Ledger Available</div>}
                          />
                        </div>

                        {selectedCustomerId && (
                          <div className="pt-6">
                            <CustomInput
                              type="checkbox"
                              name="isBillable"
                              CheckboxName={
                                <span className="inline-flex items-center">
                                  Billable
                                  <div className="pointer-events-auto cursor-pointer ml-2 inline-block text-base">
                                    <Tooltip title="Mark this expense to recover the amount from the selected party." placement="right">
                                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
                                    </Tooltip>
                                  </div>
                                </span>
                              }
                              value={values.isBillable}
                              setFieldValue={setFieldValue}
                              onChange={e => {
                                const isBillable = e.target.checked;
                                setFieldValue('isBillable', isBillable);
                                setFieldValue('tax', null);
                                const isNewTaxFreeVendor = isVendor && !isBillable && !selectedCustomerData?.gstinUin;
                                const isCustomerBillable = isBillable && !isVendor;
                                const lines = values.lines.map(line => ({ ...line, gst: isNewTaxFreeVendor ? 'none' : line.gst, isItcEligible: isCustomerBillable ? false : line.isItcEligible }));
                                setFieldValue('lines', lines);
                                setFieldValue('supplierGstin', '');
                                calculateExpenseAmounts({ ...values, lines, isBillable, tax: null }, setFieldValue);
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                        <div>
                          <CustomInput
                            type="text"
                            name="expenseId"
                            label="Expenses#"
                            placeholder="Enter Expenses"
                            value={values.expenseId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.expenseId}
                            touched={touched.expenseId}
                            setFieldValue={setFieldValue}
                            disabled={expenseConfig?.autoGenerate || expenseId}
                            suffix={
                              !expenseId && (
                                <Tooltip title="Configure Expenses Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />
                        </div>

                        <CustomInput
                          type="date"
                          name="date"
                          label="Date"
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

                        {!(values.isBillable && isVendor) && (
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
                        )}

                        <CustomInput
                          type="text"
                          name="invoiceNo"
                          label="Invoice No."
                          placeholder="Bill number from the seller"
                          value={values.invoiceNo}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.invoiceNo}
                          touched={touched.invoiceNo}
                          setFieldValue={setFieldValue}
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
                          placeholder="Select Invoice Date"
                          format="YYYY-MM-DD"
                          required={!!values.invoiceNo?.trim()}
                        />

                        {canClaimCredit && !isVendorSupplier && hasGstLine && (
                          <CustomInput
                            type="text"
                            name="supplierGstin"
                            label="Supplier GSTIN"
                            placeholder="GSTIN printed on the bill"
                            value={values.supplierGstin}
                            onChange={e => {
                              const supplierGstin = e.target.value.toUpperCase();
                              setFieldValue('supplierGstin', supplierGstin);
                              setFieldValue('taxSplit', isIGSTExists({ myGSTNo: profile?.gstNumber, customerGSTNo: supplierGstin }) ? 'IGST' : 'CGST_SGST');
                            }}
                            onBlur={handleBlur}
                            errorMessage={errors.supplierGstin}
                            touched={touched.supplierGstin}
                            setFieldValue={setFieldValue}
                            required={isCreditClaimed}
                          />
                        )}

                        <CustomInput
                          type="radio"
                          name="isTaxInclusive"
                          label="Amounts Are"
                          value={values.isTaxInclusive}
                          setFieldValue={setFieldValue}
                          radioOptions={EXPENSE_AMOUNTS_ARE_OPTIONS}
                          onChange={e => calculateExpenseAmounts({ ...values, isTaxInclusive: e.target.value }, setFieldValue)}
                        />

                        {hasGstLine && (
                          <CustomInput
                            type="select"
                            name="taxSplit"
                            label="Tax Type"
                            showSearch={false}
                            value={values.taxSplit}
                            setFieldValue={setFieldValue}
                            selectOptions={EXPENSE_TAX_SPLIT_OPTIONS}
                            onChange={value => setFieldValue('taxSplit', value)}
                            errorMessage={errors.taxSplit}
                            touched={!!errors.taxSplit}
                          />
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

                    {/* Expense table */}
                    <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white pr-4 pl-1 pt-4 shadow-sm">
                      <div className="mb-3 text-sm font-semibold text-gray-900 ml-4">Expense Table</div>
                      <table className="w-full min-w-[1100px] table-fixed" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <thead>
                          <tr className="w-full text-[10px] uppercase tracking-wide text-gray-500">
                            <th className="border-0 border-b border-gray-100 px-4 pb-2 text-start w-[280px]">Account</th>
                            <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[110px]">Supply Type</th>
                            <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[105px]">HSN/SAC</th>
                            <th className="border-0 border-b border-gray-100 px-2 pb-2 text-start w-[180px]">Description</th>
                            {!isTaxFreeVendor && (
                              <>
                                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end whitespace-nowrap w-[110px]">Tax</th>
                                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[135px]">Input Credit</th>
                              </>
                            )}
                            <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end whitespace-nowrap w-[110px]">Amount</th>
                            <th className="border-0 border-b border-gray-100 px-1 pb-2 w-[28px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {values.lines.map((line, index) => {
                            return (
                              <tr key={index}>
                                <td className="border-0 border-b border-gray-100 py-2 px-3 text-start align-top relative">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <CustomInput
                                        type="account"
                                        name={`lines[${index}].accountId`}
                                        placeholder="Select Expense Account"
                                        value={line.accountId}
                                        onChange={value => {
                                          setFieldValue(
                                            'lines',
                                            values.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, accountId: value } : line))
                                          );
                                        }}
                                        errorMessage={errors.lines?.[index]?.accountId}
                                        touched={touched.lines?.[index]?.accountId}
                                        selectOptions={accountDrop.EXPENSE}
                                        loading={accountDropLoading}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top">
                                  <CustomInput
                                    type="select"
                                    name={`lines[${index}].supplyType`}
                                    showSearch={false}
                                    popupMatchSelectWidth={false}
                                    setFieldValue={setFieldValue}
                                    value={line.supplyType}
                                    selectOptions={EXPENSE_SUPPLY_TYPE_OPTIONS}
                                    onChange={value =>
                                      setFieldValue(
                                        'lines',
                                        values.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, supplyType: value } : line))
                                      )
                                    }
                                  />
                                </td>
                                <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top">
                                  <CustomInput type="text" name={`lines[${index}].hsnCode`} value={line.hsnCode} onChange={handleChange} onBlur={handleBlur} setFieldValue={setFieldValue} />
                                </td>
                                <td className="border-0 border-b border-gray-100 px-2 py-2 text-start align-top">
                                  <CustomInput type="text" name={`lines[${index}].description`} value={line.description} onChange={handleChange} onBlur={handleBlur} setFieldValue={setFieldValue} />
                                </td>
                                {!isTaxFreeVendor && (
                                  <>
                                    <td className="border-0 border-b border-gray-100 px-2 py-2 text-end align-top">
                                      <CustomInput
                                        type="select"
                                        name={`lines[${index}].gst`}
                                        showSearch={false}
                                        popupMatchSelectWidth={false}
                                        setFieldValue={setFieldValue}
                                        value={line.gst}
                                        selectOptions={GST_RATE_OPTIONS}
                                        onChange={value => {
                                          const lines = values.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, gst: value } : line));
                                          setFieldValue('lines', lines);
                                          calculateExpenseAmounts({ ...values, lines }, setFieldValue);
                                        }}
                                      />
                                    </td>
                                    <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top">
                                      <CustomInput
                                        type="select"
                                        name={`lines[${index}].isItcEligible`}
                                        showSearch={false}
                                        popupMatchSelectWidth={false}
                                        setFieldValue={setFieldValue}
                                        value={line.isItcEligible}
                                        disabled={!canClaimCredit}
                                        selectOptions={EXPENSE_INPUT_CREDIT_OPTIONS}
                                        onChange={value =>
                                          setFieldValue(
                                            'lines',
                                            values.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, isItcEligible: value } : line))
                                          )
                                        }
                                      />
                                    </td>
                                  </>
                                )}
                                <td className="border-0 border-b border-gray-100 px-2 py-2 text-end align-top">
                                  <CustomInput
                                    type="number"
                                    name={`lines[${index}].amount`}
                                    placeholder="0.00"
                                    className="text-right"
                                    value={line.amount}
                                    onChange={e => {
                                      const lines = values.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, amount: e.target.value } : line));
                                      setFieldValue('lines', lines);
                                      calculateExpenseAmounts({ ...values, lines }, setFieldValue);
                                    }}
                                    onBlur={handleBlur}
                                    setFieldValue={setFieldValue}
                                    errorMessage={errors.lines?.[index]?.amount}
                                    touched={touched.lines?.[index]?.amount}
                                  />
                                </td>
                                <td className="border-0 border-b border-gray-100 px-1 py-2 text-end align-top">
                                  {values.lines.length > 1 ? (
                                    <div className="flex h-[34px] items-center justify-end">
                                      <Icons.DeleteOutlined
                                        style={{ fontSize: 15, color: colorPalette.error[500], cursor: 'pointer' }}
                                        onClick={() => {
                                          const lines = values.lines.filter((_, lineIndex) => lineIndex !== index);
                                          setFieldValue('lines', lines);
                                          calculateExpenseAmounts({ ...values, lines }, setFieldValue);
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-[34px]" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <CustomButton
                        type="primary"
                        className="mt-3 ms-1 mb-2"
                        onClick={() =>
                          setFieldValue('lines', [...values.lines, { accountId: null, description: '', amount: '', gst: 'none', supplyType: 'GOODS', hsnCode: '', isItcEligible: canClaimCredit }])
                        }
                        text={
                          <div className="flex gap-1 text-xs items-center">
                            <Icons.PlusCircleOutlined className="text-xs" />
                            <div>Add Line</div>
                          </div>
                        }
                      />
                    </div>

                    {/* Attachments and total */}
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
                      <div className="flex-1 w-full lg:max-w-[480px]">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
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
                        </div>
                      </div>
                      <div className="w-full lg:w-auto shrink-0">
                        <TotalContainer
                          profile={profile}
                          selectedCustomer={selectedCustomerData}
                          values={values}
                          setFieldValue={setFieldValue}
                          calculateAmounts={calculateExpenseAmounts}
                          currency={documentCurrency}
                          directTaxTypes={['TDS', 'TCS']}
                          isDirectTaxApplicable={selectedCustomerData?.isVendorDirectTax && !values.isBillable}
                          documentDate={values.date}
                        />
                      </div>
                    </div>

                    {/* Notes and terms */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
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
                        <CustomInput
                          type="textarea"
                          name="termsAndConditions"
                          label="Terms & Conditions"
                          placeholder="Max.500 characters"
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
        initialConfig={expenseConfig}
        resource={RESOURCES.EXPENSES}
        setConfigDetail={config => {
          setExpenseConfig(config);
          setDrawerCodeConfig(config);
        }}
        moduleName={MODULE_NAMES?.EXPENSE}
      />
      {!expenseId && (
        <DocumentConfigSheet
          resource={RESOURCES.EXPENSES}
          open={isExpenseConfigOpen}
          onClose={handleCloseExpenseConfig}
          onSave={handleSaveExpenseConfig}
          getTermsValue={getTermsAndConditionsValue}
          loading={documentConfigLoading || expenseConfigSaving}
          codeConfigValue={drawerCodeConfig}
          onCodeConfigChange={setDrawerCodeConfig}
          codeConfigDisabled={expenseConfigSaving}
        />
      )}
    </>
  );
};

export default AddExpense;
