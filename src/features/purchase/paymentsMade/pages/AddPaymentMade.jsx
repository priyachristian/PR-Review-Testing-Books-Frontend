import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { FieldArray, Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import PaymentAllocationTableSkeleton from '@/components/feedback/pageLoader/PaymentAllocationTableSkeleton';
import Toast from '@/components/ui/common/Toast';
import { Tooltip, Tag, Switch } from '@/components/AntDComponent';

// Hooks
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { getBranchSelectPlaceholder, getDivisionBranchFromWarehouseOption, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

// Extras
import { usePaymentMade, paymentMadeValidateSchema } from '@/features/purchase/paymentsMade';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { EXPENSE_ROW_TYPE, MODULE_NAMES, OB_TYPE, PAYMENT_MODES, PAYMENT_MODE_OPTIONS } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';
import { errorsToTouched, amountField, toApiDate } from '@/utils/util';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { formatAmount, toDecimalString } from '@/utils/currency';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { colorPalette } from '@/utils/theme';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const AddPaymentMade = () => {
  const dispatch = useDispatch();
  const formikRef = useRef(null);
  const { paymentId } = useParams();
  const location = useLocation();
  const {
    paymentsMadeInvoiceDrop,
    paymentsMadeOpeningBalance,
    paymentsMadePendingExpenses,
    submitLoading,
    paymentMade,
    resetPaymentMade,
    getPaymentMadeById,
    createPaymentsMade,
    updatePaymentsMade,
    getPaymentsMadeInvoice,
    clearPaymentMadeInvoiceDrop,
    loading: paymentMadeLoading,
    droploading,
  } = usePaymentMade();
  const paymentMadeData = paymentMade;
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig } = useModuleConfig();
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
    selectedBranchId,
    isSplitWise,
    isSplitSessionActive,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(paymentMadeData, RESOURCES.PAYMENT_MADE, {
    skipLocationDropdowns: !!paymentId,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const [selectedCustomer, setSelectedCustomer] = useState(paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id || null);
  const { vendorDropDownList, getVendorDropList, resetVendorDropDownList, loading: vendorLoading } = useCustomer();
  const { accountDrop, getAccounts } = useChartOfAccounts();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [paymentMadeConfig, setPaymentMadeConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [showCustomerError, setShowCustomerError] = useState(false);
  const [isSplitForApi, setIsSplitForApi] = useState(isSplitSessionActive);
  const [currentBranchOnly, setCurrentBranchOnly] = useState(true);
  const scrollToError = useScrollToError();

  useEffect(() => {
    if (paymentMadeData?.isSplit !== undefined) {
      setIsSplitForApi(paymentMadeData.isSplit);
    } else if (!paymentId) {
      setIsSplitForApi(isSplitSessionActive);
    }
  }, [paymentMadeData?.isSplit, paymentId, isSplitSessionActive]);

  useEffect(() => {
    if (paymentId && paymentMadeData) {
      // Saved allowCrossBranchMapping=true => switch OFF (show all branches)
      setCurrentBranchOnly(!paymentMadeData.allowCrossBranchMapping);
    } else if (!paymentId) {
      setCurrentBranchOnly(true);
    }
  }, [paymentId, paymentMadeData]);

  useEffect(() => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('splitBills', isSplitForApi);
    }
  }, [isSplitForApi]);

  const selectedCustomerData = paymentId
    ? {
        id: paymentMadeData?.vendorId?._id || paymentMadeData?.vendorId?.id,
        customerDisplayName: paymentMadeData?.vendorId?.customerDisplayName,
      }
    : vendorDropDownList?.find(cust => cust._id === selectedCustomer) || {};
  const { currency: baseCurrency } = useCompanyCurrency();
  const documentCurrency = paymentMadeData?.currency || selectedCustomerData?.currency || baseCurrency;

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const fetchVendorDrop = branchId => {
    getVendorDropList({ branchId });
  };

  useEffect(() => {
    const controller = new AbortController();
    getAccounts({ signal: controller.signal, type: 'PAYMENT' });
    return () => controller.abort();
  }, [getAccounts]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (paymentId) {
      if (paymentMadeData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.PAYMENT_MADE,
          customerId: paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.PAYMENT_MADE,
        customerId: paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id,
      });
    }

    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [paymentId, paymentMadeData]);

  useEffect(() => {
    const controller = new AbortController();

    if (selectedCustomer && (!currentBranchOnly || selectedBranchId)) {
      const payload = {
        vendorId: selectedCustomer,
        isSplit: isSplitForApi,
        allowCrossBranchMapping: !currentBranchOnly,
        signal: controller.signal,
      };
      if (currentBranchOnly && selectedBranchId) {
        payload.branchId = selectedBranchId;
      }
      getPaymentsMadeInvoice(payload);
    } else {
      clearPaymentMadeInvoiceDrop();
    }

    return () => controller.abort();
  }, [selectedCustomer, selectedBranchId, currentBranchOnly, isSplitForApi, getPaymentsMadeInvoice, clearPaymentMadeInvoiceDrop]);

  useEffect(() => {
    const controller = new AbortController();

    if (paymentId) {
      getPaymentMadeById({ paymentId, signal: controller.signal });
    } else {
      resetPaymentMade();
    }

    return () => {
      controller.abort();
      resetVendorDropDownList();
      resetPaymentMade();
      clearPaymentMadeInvoiceDrop();
    };
  }, [paymentId, getPaymentMadeById, resetPaymentMade, resetVendorDropDownList, clearPaymentMadeInvoiceDrop]);

  useEffect(() => {
    if (vendorDropDownList?.length > 0 && paymentMadeData?.vendorId) {
      let findCustomerExists = vendorDropDownList?.find(customer => customer?._id === paymentMadeData?.vendorId?.id || customer?._id === paymentMadeData?.vendorId?._id);
      if (!findCustomerExists) {
        formikRef.current?.setFieldValue('vendor', null);
        setShowCustomerError(true);
      }
    }
  }, [vendorDropDownList, paymentMadeData]);

  useEffect(() => {
    if (paymentMade) {
      setSelectedCustomer(paymentMade?.vendorId?.id || paymentMade?.vendorId?._id || null);
    }
  }, [paymentMade]);

  const rowFromSavedOb = (x, paymentStatus) => {
    const t = x.openingBalanceTransaction || {};
    const ap = Number(x.amountApplied) || 0;
    const remaining = Number(t.remainingAmount) || 0;
    const d = x.appliedDate ? dayjs(x.appliedDate).format('DD-MM-YYYY') : '-';
    const amountDue = paymentStatus === 'APPROVED' ? remaining + ap : remaining;
    return {
      date: d,
      dueDate: d,
      billId: t._id,
      billId2: x.transactionNo || t.transactionNo,
      billAmount: t.amount,
      amountDue,
      amountApplied: x.amountApplied,
      isSplit: false,
      type: OB_TYPE.OPENING_PAYABLE,
    };
  };

  const billDropWithOb = useMemo(
    () => mergePendingDropWithOb(paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, 'bill', paymentsMadePendingExpenses),
    [paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, paymentsMadePendingExpenses]
  );

  const isSameBranch = (docBranchId, branchId) => {
    if (!branchId) return true;
    const normalized = docBranchId?._id || docBranchId?.id || docBranchId;
    if (!normalized) return true;
    return String(normalized) === String(branchId);
  };

  const buildBillTableData = (data, dropWithOb, selectedVendorIdForMerge, isEdit, options = {}) => {
    const { currentBranchOnly: branchOnly = false, selectedBranchId: branchId = null } = options;
    const paymentVendorId = data?.vendorId?.id || data?.vendorId?._id || null;
    const shouldUsePaymentBills = isEdit || (paymentVendorId && selectedVendorIdForMerge && paymentVendorId === selectedVendorIdForMerge);

    const drop = dropWithOb || [];
    const d = data || {};
    let billTableData = [];

    if (shouldUsePaymentBills) {
      d.bills?.forEach(x => {
        if (branchOnly && !isSameBranch(x?.billId?.branchId, branchId)) return;
        billTableData.push({
          date: dayjs(x?.billId?.billDate).format('DD-MM-YYYY'),
          dueDate: dayjs(x?.billId?.dueDate).format('DD-MM-YYYY'),
          billId: x?.billId?._id,
          billId2: x?.billId?.billId,
          billAmount: x?.billId?.total,
          amountDue: x?.billId?.balanceAmount,
          amountApplied: x?.amountApplied,
          branchId: x?.billId?.branchId?._id || x?.billId?.branchId || null,
          isSplit: d?.isSplit || false,
          type: null,
        });
      });
      (d.openingBalanceTransactions || []).forEach(x => {
        const obBranchId = x?.openingBalanceTransaction?.branchId || x?.branchId;
        if (branchOnly && !isSameBranch(obBranchId, branchId)) return;
        billTableData.push({ ...rowFromSavedOb(x, d.status), branchId: obBranchId?._id || obBranchId || null });
      });
      (d.expenses || []).forEach(x => {
        if (branchOnly && !isSameBranch(x.expenseId.branchId, branchId)) return;
        billTableData.push({
          date: dayjs(x.expenseId.date).format('DD-MM-YYYY'),
          dueDate: dayjs(x.expenseId.date).format('DD-MM-YYYY'),
          billId: x.expenseId._id,
          billId2: x.expenseNo,
          billAmount: x.expenseId.total,
          amountDue: x.expenseId.balanceAmount,
          amountApplied: x.amountApplied,
          branchId: x.expenseId.branchId,
          isSplit: false,
          type: EXPENSE_ROW_TYPE,
        });
      });
    }

    drop.forEach(itm => {
      if (branchOnly && !isSameBranch(itm.branchId, branchId)) return;
      if (billTableData.some(x => String(x.billId) === String(itm._id))) return;
      const matchBill = shouldUsePaymentBills ? d.bills?.find(i => i.billId?.billId === itm.billId) : undefined;
      const matchOb = shouldUsePaymentBills ? (d.openingBalanceTransactions || []).find(o => String(o.openingBalanceTransaction?._id) === String(itm._id)) : undefined;
      const ob = itm.type === OB_TYPE.OPENING_PAYABLE;
      const fmt = dt => (dt ? dayjs(dt).format('DD-MM-YYYY') : '-');
      billTableData.push({
        date: ob ? fmt(itm.billDate) : dayjs(itm.billDate).format('DD-MM-YYYY'),
        dueDate: ob ? fmt(itm.dueDate) : dayjs(itm.dueDate).format('DD-MM-YYYY'),
        billId: itm._id,
        billId2: itm.billId,
        billAmount: itm.total,
        amountDue: itm.balanceAmount + Number(matchBill?.amountApplied || 0) + Number(matchOb?.amountApplied || 0),
        amountApplied: matchBill?.amountApplied || matchOb?.amountApplied || '0.00',
        branchId: itm.branchId?._id || itm.branchId || null,
        isSplit: itm?.isSplit || false,
        type: itm.type ?? null,
      });
    });

    billTableData.sort((a, b) => {
      const aOb = a?.type === OB_TYPE.OPENING_PAYABLE ? 0 : 1;
      const bOb = b?.type === OB_TYPE.OPENING_PAYABLE ? 0 : 1;
      return aOb - bOb;
    });

    return billTableData;
  };

  const handleBillTableData = () => {
    if (!formikRef.current) return;

    const { values, setFieldValue } = formikRef.current;
    const branchIdForFilter = selectedBranchId || values?.branchId || paymentMadeData?.branchId?._id || paymentMadeData?.branchId?.id || null;
    let rows = buildBillTableData(paymentMadeData, billDropWithOb, selectedCustomer, Boolean(paymentId), {
      currentBranchOnly,
      selectedBranchId: branchIdForFilter,
    });

    const paidAmount = values?.receivedAmount;
    const shouldReflect = !values?.advancedPayment && values?.reflectPaymentInLines && paidAmount !== '' && paidAmount != null && !Number.isNaN(parseFloat(paidAmount));

    if (shouldReflect) {
      let remaining = parseFloat(paidAmount || 0);
      rows = (rows || []).map(x => {
        const amountDue = parseFloat(x?.amountDue || 0);
        if (amountDue > remaining) {
          const applied = remaining;
          remaining = 0;
          return { ...x, amountApplied: `${applied}` };
        }
        remaining -= amountDue;
        return { ...x, amountApplied: `${x?.amountDue}` };
      });

      let total = 0;
      rows.forEach(item => {
        const applied = parseFloat(item?.amountApplied);
        if (!Number.isNaN(applied)) total += applied;
      });
      setFieldValue('paymentmade', total);
    }

    setFieldValue('bills', rows);
  };

  useEffect(() => {
    if (moduleConfig) {
      setPaymentMadeConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !paymentId && paymentMadeConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      const newQuoteId = paymentMadeConfig.autoGenerate ? `${paymentMadeConfig.prefix}${paymentMadeConfig.nextNumber}` : '';
      formikRef.current.setFieldValue('paymentMadeId', newQuoteId);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!hasSelectedValues && defaultConfig) {
        formikRef.current.setFieldValue('divisionId', defaultConfig.divisionId);
        formikRef.current.setFieldValue('branchId', defaultConfig.branchId);
        formikRef.current.setFieldValue('warehouseId', defaultConfig.warehouseId);
        setDivisionBranchWarehouseFromEntity({
          divisionId: defaultConfig.divisionId,
          branchId: defaultConfig.branchId,
          warehouseId: defaultConfig.warehouseId,
        });
        if (defaultConfig.branchId) {
          fetchVendorDrop(defaultConfig.branchId);
        }
      }

      if (defaultConfig?.branchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [paymentMadeConfig, paymentId, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (paymentId && (paymentMadeLoading || moduleConfigLoading)) return;

    if (!selectedCustomer) {
      if (formikRef.current) {
        formikRef.current.setFieldValue('bills', []);
        formikRef.current.setFieldValue('paymentmade', '');
        formikRef.current.setFieldValue('receivedAmount', '');
      }
      return;
    }

    if (droploading) return;

    handleBillTableData();
  }, [selectedCustomer, billDropWithOb, droploading, paymentId, paymentMadeLoading, moduleConfigLoading, paymentMadeData, currentBranchOnly, selectedBranchId]);

  useEffect(() => {
    if (paymentMadeData) {
      setSelectedCustomer(paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id || null);
      setDivisionBranchWarehouseFromEntity(paymentMadeData);
      if (!paymentId && (paymentMadeData?.branchId?._id || paymentMadeData?.branchId?.id)) {
        fetchVendorDrop(paymentMadeData?.branchId?._id || paymentMadeData?.branchId?.id);
      }
    }
  }, [paymentMadeData, paymentId, setDivisionBranchWarehouseFromEntity]);

  const initialValues = useMemo(
    () => ({
      vendor: paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id || null,
      paymentMadeId: paymentMadeData ? paymentMadeData?.paymentMadeId : '',
      paymentmade: paymentMadeData ? paymentMadeData?.paymentMade : 0,
      paymentDate: paymentMadeData?.paymentDate ? dayjs(paymentMadeData.paymentDate) : dayjs(),
      paymentMode: paymentMadeData ? paymentMadeData?.paymentMode : null,
      paidThroughAccountId: paymentMadeData?.paidThroughAccountId?._id || null,
      reference: paymentMadeData ? paymentMadeData?.reference : '',
      bills:
        paymentId || paymentMadeData
          ? buildBillTableData(paymentMadeData, billDropWithOb, paymentMadeData?.vendorId?.id || paymentMadeData?.vendorId?._id || null, Boolean(paymentId), {
              currentBranchOnly: paymentId ? !paymentMadeData?.allowCrossBranchMapping : currentBranchOnly,
              selectedBranchId: paymentMadeData?.branchId?.id || paymentMadeData?.branchId?._id || selectedBranchId,
            })
          : [],
      notes: paymentMadeData ? paymentMadeData?.notes : '',
      chequeNo: paymentMadeData ? paymentMadeData?.chequeNo : '',
      pdcChequeDate: paymentMadeData?.pdcChequeDate ? dayjs(paymentMadeData.pdcChequeDate) : null,
      advancedPayment: paymentMadeData?.isAdvancePayment ? paymentMadeData?.isAdvancePayment : false,
      reflectPaymentInLines: paymentMadeData
        ? paymentId
          ? false
          : !paymentMadeData?.isAdvancePayment &&
            ((paymentMadeData?.bills || []).some(b => parseFloat(b?.amountApplied ?? 0) > 0) || (paymentMadeData?.openingBalanceTransactions || []).some(ob => parseFloat(ob?.amountApplied ?? 0) > 0))
        : true,
      amountUsedForPayments: 0,
      receivedAmount: paymentMadeData != null && paymentMadeData?.paymentMade != null && paymentMadeData?.paymentMade !== '' ? String(paymentMadeData.paymentMade) : '',
      divisionId: paymentMadeData?.divisionId ? paymentMadeData?.divisionId?.id || paymentMadeData?.divisionId?._id : null,
      branchId: paymentMadeData?.branchId ? paymentMadeData?.branchId?.id || paymentMadeData?.branchId?._id : null,
      warehouseId: paymentMadeData?.warehouseId ? paymentMadeData?.warehouseId?.id || paymentMadeData?.warehouseId?._id : null,
      splitBills: paymentId ? paymentMadeData?.isSplit || false : isSplitSessionActive,
      attachments: paymentMadeData?.attachments || [],
      exchangeRate: paymentMadeData?.currency?.exchangeRate ?? 1,
    }),
    [paymentMadeData, paymentId, isSplitSessionActive]
  );

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['paymentMadeId', 'bills', 'paymentmade', 'receivedAmount'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const calculateAmountUsedForPayments = (bills, setFieldValue) => {
    let total = 0;
    bills?.forEach(item => {
      if (item?.amountApplied && !isNaN(item?.amountApplied)) {
        total = total + (item?.amountApplied ? parseFloat(item?.amountApplied) : 0);
      }
    });
    if (setFieldValue) {
      setFieldValue('paymentmade', total);
    }

    return total;
  };

  const onFinish = async values => {
    if (submitLoading) return;

    const enteredAmount = parseFloat(values?.receivedAmount || 0);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      Toast.error('Please enter the paid amount.');
      return;
    }

    const paymentMadeForApi = enteredAmount;

    const itemsWithAmount = values.bills?.filter(item => (parseFloat(item?.amountApplied) || 0) > 0) || [];

    if (!values?.advancedPayment && values.reflectPaymentInLines && itemsWithAmount.length === 0) {
      Toast.error('Please apply the payment to at least one bill, or mark it as an advance payment.');
      return;
    }

    const processedBills = itemsWithAmount
      .filter(item => !item?.type)
      .map(bill => ({
        billId: bill.billId,
        billNo: bill.billId2,
        amountApplied: parseFloat(bill.amountApplied) || 0,
      }));
    const processedOpeningBalanceTransactions = itemsWithAmount
      .filter(item => item?.type === OB_TYPE.OPENING_PAYABLE)
      .map(ob => ({
        openingBalanceTransactionId: ob.billId,
        transactionNo: ob.billId2 || `OB-${ob.billId}`,
        amountApplied: parseFloat(ob.amountApplied) || 0,
      }));
    const processedExpenses = itemsWithAmount
      .filter(item => item?.type === EXPENSE_ROW_TYPE)
      .map(expense => ({
        expenseId: expense.billId,
        expenseNo: expense.billId2,
        amountApplied: parseFloat(expense.amountApplied),
      }));
    const paymentMadePayload = {
      vendorId: values.vendor,
      ...(!paymentId && { paymentMadeId: values.paymentMadeId }),
      paymentMade: toDecimalString(paymentMadeForApi),
      paymentDate: toApiDate(values.paymentDate),
      paymentMode: values.paymentMode,
      paidThroughAccountId: values.paidThroughAccountId || null,
      reference: values.reference,
      ...(!values?.advancedPayment && {
        bills: processedBills,
        openingBalanceTransactions: processedOpeningBalanceTransactions,
        expenses: processedExpenses,
      }),
      ...(values?.paymentMode === PAYMENT_MODES.CHEQUE && { chequeNo: values.chequeNo }),
      ...(values?.paymentMode === PAYMENT_MODES.CHEQUE && { pdcChequeDate: toApiDate(values.pdcChequeDate) }),
      notes: values.notes,
      attachments: Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [],
      isAdvancePayment: values?.advancedPayment,
      divisionId: values?.divisionId,
      branchId: values?.branchId,
      warehouseId: values?.warehouseId,
      isSplit: values?.splitBills || false,
      allowCrossBranchMapping: !currentBranchOnly,
      exchangeRate: values.exchangeRate,
    };

    let result = '';

    if (paymentId) {
      result = await updatePaymentsMade({ paymentId, paymentMadeData: paymentMadePayload });
    } else {
      result = await createPaymentsMade(paymentMadePayload);
    }

    if (result?.payload?.code === 0) {
      return;
    }

    // For successful updates/creates, always navigate
    // When editing, use paymentId from route; when creating, use ID from result
    const targetId = paymentId || result?.data?.id || result?.payload?.data?.id;

    // Always navigate after successful save to clear dirty state
    if (targetId) {
      // Navigate to detail page after successful save
      navigateAfterSave(`/payments-made/${targetId}`, {
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

  if (paymentId && (paymentMadeLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  const handleAmount = (value, arr, setFieldValue) => {
    let remaining = parseFloat(value || 0);

    const updatedArr = arr?.map(x => {
      const amountDue = parseFloat(x?.amountDue || 0);
      if (amountDue > remaining) {
        const applied = remaining;
        remaining = 0;
        return { ...x, amountApplied: `${applied}` };
      }
      remaining -= amountDue;
      return { ...x, amountApplied: `${x?.amountDue}` };
    });

    if (updatedArr) {
      calculateAmountUsedForPayments(updatedArr, setFieldValue);
      setFieldValue('bills', updatedArr);
    }
  };

  const canShowBillPaymentOptions = values => !values?.advancedPayment && values?.vendor && values.bills?.length > 0;

  const hasPaidAmountValue = value => value !== '' && value != null && !Number.isNaN(parseFloat(value));

  const clearBillPayments = (bills, setFieldValue) => {
    const clearedBills = (bills || []).map(bill => ({
      ...bill,
      amountApplied: '0.00',
    }));
    setFieldValue('bills', clearedBills);
    calculateAmountUsedForPayments(clearedBills, setFieldValue);
  };

  const syncBillPaymentsFromPaidAmount = (paidAmount, bills, setFieldValue) => {
    if (hasPaidAmountValue(paidAmount)) {
      handleAmount(paidAmount, bills, setFieldValue);
      return;
    }
    calculateAmountUsedForPayments(bills || [], setFieldValue);
  };

  const handleAdvancedPaymentChange = (checked, values, setFieldValue) => {
    if (!checked) {
      setFieldValue('reflectPaymentInLines', true);
      const branchIdForFilter = selectedBranchId || values?.branchId || paymentMadeData?.branchId?._id || paymentMadeData?.branchId?.id || null;
      const rows =
        values.bills?.length > 0
          ? values.bills
          : buildBillTableData(paymentMadeData, billDropWithOb, selectedCustomer, Boolean(paymentId), {
              currentBranchOnly,
              selectedBranchId: branchIdForFilter,
            });
      if (!values.bills?.length) {
        setFieldValue('bills', rows);
      }
      syncBillPaymentsFromPaidAmount(values.receivedAmount, rows, setFieldValue);
      return;
    }
    setFieldValue('reflectPaymentInLines', false);
    clearBillPayments(values.bills, setFieldValue);
  };

  const handlePaidAmountChange = (event, values, setFieldValue) => {
    const newValue = event?.target?.value;
    setFieldValue('receivedAmount', newValue);
    if (!values?.advancedPayment && values.reflectPaymentInLines && hasPaidAmountValue(newValue)) {
      handleAmount(newValue, values?.bills, setFieldValue);
    }
  };

  const handlePaidAmountFocus = (values, setFieldValue) => {
    if (amountField.focusClear(values.receivedAmount)) {
      setFieldValue('receivedAmount', '');
    }
  };

  const handlePaidAmountBlur = (event, values, setFieldValue, handleBlur) => {
    const rawValue = String(event.target.value ?? '').trim();
    const nextValue = rawValue === '' ? '' : amountField.blur(rawValue);
    setFieldValue('receivedAmount', nextValue);
    if (!values?.advancedPayment && values.reflectPaymentInLines && hasPaidAmountValue(nextValue)) {
      handleAmount(nextValue, values?.bills, setFieldValue);
    }
    handleBlur(event);
  };

  const handleReflectPaymentInLinesChange = (checked, values, setFieldValue) => {
    setFieldValue('reflectPaymentInLines', checked);
    if (checked) {
      syncBillPaymentsFromPaidAmount(values.receivedAmount, values.bills, setFieldValue);
      return;
    }
    clearBillPayments(values.bills, setFieldValue);
  };

  const updateBillPaymentValue = (bills, index, amountApplied, setFieldValue) => {
    const updatedBills = (bills || []).map((bill, billIndex) => (billIndex === index ? { ...bill, amountApplied } : bill));
    setFieldValue('bills', updatedBills);
    return updatedBills;
  };

  const handleBillPaymentChange = (value, values, index, setFieldValue) => {
    const updatedBills = updateBillPaymentValue(values.bills, index, value, setFieldValue);
    calculateAmountUsedForPayments(updatedBills, setFieldValue);
  };

  const handleBillPaymentFocus = (item, values, index, setFieldValue) => {
    if (!amountField.focusClear(item.amountApplied)) return;
    updateBillPaymentValue(values.bills, index, '', setFieldValue);
  };

  const handleBillPaymentBlur = (event, values, index, setFieldValue, handleBlur) => {
    const nextValue = amountField.blur(event.target.value);
    const updatedBills = updateBillPaymentValue(values.bills, index, nextValue, setFieldValue);
    calculateAmountUsedForPayments(updatedBills, setFieldValue);
    handleBlur(event);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{paymentId ? `Edit Payment Made / ${paymentMadeData?.paymentMadeId}` : 'Add Payment Made'} </h1>
            </div>
          </div>
          {selectedCustomer && <CustomerBasicDetail customerData={selectedCustomerData} isVendor={true} wrapperClassName="flex items-center" />}
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={paymentMadeValidateSchema(paymentMadeConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    {/* Inventory context */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      {!paymentId ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="select"
                            name="divisionId"
                            label="Division"
                            placeholder="Select Division"
                            value={values?.divisionId}
                            onBlur={handleBlur}
                            errorMessage={errors.divisionId}
                            touched={touched.divisionId}
                            setFieldValue={setFieldValue}
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
                              setSelectedCustomer(null);
                              dispatch(resetBranch());
                            }}
                            required={true}
                            loading={divisionLoading}
                          />
                          <CustomInput
                            type="select"
                            name="branchId"
                            label="Branch"
                            placeholder={getBranchSelectPlaceholder(warehouseRequiresCascade, values)}
                            value={values?.branchId}
                            onBlur={handleBlur}
                            errorMessage={errors.branchId}
                            touched={touched.branchId}
                            setFieldValue={setFieldValue}
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
                              setSelectedCustomer(null);
                              if (e) {
                                fetchVendorDrop(e);
                              }
                            }}
                            disabled={warehouseRequiresCascade && !values.divisionId}
                            required={true}
                            loading={branchLoading}
                          />
                          <CustomInput
                            type="select"
                            name="warehouseId"
                            label="Warehouse"
                            placeholder={getWarehouseSelectPlaceholder(warehouseRequiresCascade, values)}
                            value={values?.warehouseId}
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
                                setSelectedCustomer(null);
                                fetchVendorDrop(branchId);
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
                      ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput type="text" name="divisionId" label="Division" value={paymentMadeData?.divisionName || paymentMadeData?.divisionId?.name} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={paymentMadeData?.branchName || paymentMadeData?.branchId?.name} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={paymentMadeData?.warehouseName || paymentMadeData?.warehouseId?.name} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Row 1: Vendor Name */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 items-start relative pt-2">
                          <div className="relative">
                            {documentCurrency && values.vendor && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!paymentId ? (
                              <CustomInput
                                type="select"
                                selectVariant="twoColumn"
                                columnSelectHeader={{ id: 'Vendor ID', name: 'Vendor Name' }}
                                name="vendor"
                                label="Vendor Name"
                                placeholder="Select Vendor Name"
                                value={values.vendor}
                                onChange={e => {
                                  const newVendorDetail = vendorDropDownList?.find(cust => cust._id === e) || {};
                                  setFieldValue('vendor', e);
                                  setFieldValue('receivedAmount', '');
                                  setSelectedCustomer(e);
                                  setFieldValue('exchangeRate', newVendorDetail?.currency?.exchangeRate || 1);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.vendor}
                                touched={touched.vendor}
                                setFieldValue={setFieldValue}
                                selectOptions={buildCustomerSelectOptions(vendorDropDownList, values.branchId)}
                                loading={vendorLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Vendor Available</div>}
                                required={true}
                              />
                            ) : (
                              <CustomInput type="text" name="vendor" label="Vendor Name" value={paymentMadeData?.vendorId?.customerDisplayName} disabled />
                            )}
                          </div>
                        </div>

                        {/* Row 2: Payment# | Payment Date | Payment Mode */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative pt-2">
                          <CustomInput
                            type="text"
                            name="paymentMadeId"
                            label="Payment#"
                            placeholder="Enter Payment"
                            value={values.paymentMadeId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.paymentMadeId}
                            touched={touched.paymentMadeId}
                            setFieldValue={setFieldValue}
                            disabled={paymentMadeConfig?.autoGenerate || paymentId}
                            suffix={
                              !paymentId && (
                                <Tooltip title="Configure Payment Made Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />

                          <CustomInput
                            type="date"
                            name="paymentDate"
                            label="Payment Date"
                            value={values.paymentDate ? values.paymentDate : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.paymentDate}
                            touched={touched.paymentDate}
                            placeholder="Select Payment Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />

                          {documentCurrency?.code && baseCurrency?.code && documentCurrency.code !== baseCurrency.code ? (
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
                              addonAfter={baseCurrency.code}
                            />
                          ) : (
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
                          )}

                          <CustomInput
                            type="select"
                            name="paymentMode"
                            label="Payment Mode"
                            placeholder="Select Payment Mode"
                            value={values.paymentMode}
                            onChange={value => setFieldValue('paymentMode', value)}
                            onBlur={handleBlur}
                            required={true}
                            errorMessage={errors.paymentMode}
                            touched={touched.paymentMode}
                            setFieldValue={setFieldValue}
                            selectOptions={PAYMENT_MODE_OPTIONS}
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
                            required={true}
                          />
                        </div>

                        {/* Row 3: Cheque fields (if Cheque) & Tax Deducted & Reference (if exchangeRate shown above) */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
                          {values?.paymentMode === PAYMENT_MODES.CHEQUE && (
                            <>
                              <CustomInput
                                type="text"
                                name="chequeNo"
                                label="Cheque No"
                                placeholder="Enter Cheque No"
                                value={values.chequeNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                errorMessage={errors.chequeNo}
                                touched={touched.chequeNo}
                                setFieldValue={setFieldValue}
                              />
                              <CustomInput
                                type="date"
                                name="pdcChequeDate"
                                label="PDC Cheque Date"
                                value={values.pdcChequeDate ? values.pdcChequeDate : null}
                                setFieldValue={setFieldValue}
                                setFieldTouched={setFieldTouched}
                                onBlur={handleBlur}
                                errorMessage={errors.pdcChequeDate}
                                touched={touched.pdcChequeDate}
                                placeholder="Select PDC Cheque Date"
                                format="YYYY-MM-DD"
                              />
                            </>
                          )}

                          {documentCurrency?.code && baseCurrency?.code && documentCurrency.code !== baseCurrency.code && (
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
                          )}
                        </div>

                        {/* Row 4: Advanced Payment | Paid Amount | Split Bills */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
                          <div>
                            <CustomInput
                              type="checkbox"
                              name="advancedPayment"
                              CheckboxName="Advanced Payment"
                              value={values.advancedPayment}
                              errorMessage={errors.advancedPayment}
                              touched={touched.advancedPayment}
                              setFieldValue={setFieldValue}
                              onChange={e => handleAdvancedPaymentChange(e.target.checked, values, setFieldValue)}
                            />
                          </div>
                          <div className="space-y-2">
                            <CustomInput
                              type="text"
                              name="receivedAmount"
                              label="Paid Amount"
                              placeholder="Enter Amount"
                              value={amountField.show(values.receivedAmount)}
                              onChange={e => handlePaidAmountChange(e, values, setFieldValue)}
                              onFocus={() => handlePaidAmountFocus(values, setFieldValue)}
                              onBlur={e => handlePaidAmountBlur(e, values, setFieldValue, handleBlur)}
                              errorMessage={errors.receivedAmount}
                              touched={touched.receivedAmount}
                              setFieldValue={setFieldValue}
                              required
                            />
                            {errors.receivedAmount && touched.receivedAmount && <div className="text-red-500 text-[10px] absolute right-1 -bottom-4">{errors.receivedAmount}</div>}
                            {canShowBillPaymentOptions(values) && (
                              <CustomInput
                                type="checkbox"
                                name="reflectPaymentInLines"
                                CheckboxName="Should this amount be reflected in the payment field?"
                                value={values.reflectPaymentInLines}
                                errorMessage={errors.reflectPaymentInLines}
                                touched={touched.reflectPaymentInLines}
                                setFieldValue={setFieldValue}
                                onChange={e => handleReflectPaymentInLinesChange(e.target.checked, values, setFieldValue)}
                              />
                            )}
                          </div>
                          {isSplitSessionActive && isSplitWise && (
                            <div className="flex items-center gap-x-4 pt-4">
                              <div className="w-max">
                                <CustomInput
                                  type="switch"
                                  name="splitBills"
                                  value={values.splitBills}
                                  onChange={checked => {
                                    setIsSplitForApi(checked);
                                    setFieldValue('splitBills', checked);
                                    setFieldValue('paymentMode', null);
                                    setFieldValue('paymentmade', '');
                                    setFieldValue('receivedAmount', '');

                                    const billsWithZeroApplied = values?.bills?.map(x => ({
                                      ...x,
                                      amountApplied: '0.00',
                                    }));
                                    if (billsWithZeroApplied?.length) {
                                      setFieldValue('bills', billsWithZeroApplied);
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.splitBills}
                                  touched={touched.splitBills}
                                  setFieldValue={setFieldValue}
                                  disabled={paymentId}
                                />
                              </div>
                              <div>Split Bills</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!values?.advancedPayment && (
                      <div className="pt-6">
                        {errors.bills && typeof errors.bills === 'string' && <div className="text-red-500 text-sm mb-2">{errors.bills}</div>}
                        <div className="flex justify-between items-center text-base font-semibold pb-3">
                          <p>Bill Table</p>
                          <button
                            style={{ color: colorPalette.primary[500] }}
                            className="mr-6"
                            disabled={droploading}
                            onClick={e => {
                              e.preventDefault();
                              clearBillPayments(values.bills, setFieldValue);
                            }}
                          >
                            Clear Fields
                          </button>
                        </div>
                        <div className="flex flex-col gap-1 mb-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currentBranchOnly}
                              onChange={checked => {
                                setCurrentBranchOnly(checked);
                                if (checked && formikRef.current) {
                                  const { values, setFieldValue } = formikRef.current;
                                  const branchIdForFilter = selectedBranchId || values?.branchId || paymentMadeData?.branchId?._id || paymentMadeData?.branchId?.id || null;
                                  const nextRows = (values.bills || []).filter(row => isSameBranch(row.branchId, branchIdForFilter));
                                  setFieldValue('bills', nextRows);
                                  calculateAmountUsedForPayments(nextRows, setFieldValue);
                                }
                              }}
                              size="small"
                              disabled={droploading}
                            />
                            <span className="text-sm text-gray-700 whitespace-nowrap">Show current branch documents only</span>
                          </div>
                          <p className="text-xs text-gray-500 pl-8">Only Open, Partially Paid and Overdue bills will be shown.</p>
                        </div>
                        {errors.billPaymentExceedsDue && <div className="text-red-500 text-sm mb-2">{errors.billPaymentExceedsDue}</div>}
                        {droploading ? (
                          <PaymentAllocationTableSkeleton variant="bill" />
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="border-collapse w-full">
                              <thead>
                                <tr className="w-full">
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[130px]">Bill Date</th>
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[130px]">Due Date</th>
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[160px]">Bill No</th>
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Bill Amount{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Amount Due{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                  <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Payment{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <FieldArray name="bills">
                                  {() => (
                                    <>
                                      {values.bills?.length > 0 ? (
                                        values.bills?.map((item, index) => (
                                          <tr key={index}>
                                            <td className="w-[130px] pl-5 border text-center relative">
                                              <input
                                                type="text"
                                                className="focus:outline-none py-2 w-full"
                                                name={`bills[${index}].date`}
                                                value={item.date}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                readOnly
                                              />
                                              {errors.bills?.[index]?.date && touched.bills?.[index]?.date && (
                                                <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.bills[index].date}</div>
                                              )}
                                            </td>

                                            <td className="w-[130px] pl-5 border text-center relative">
                                              <input
                                                type="text"
                                                className="focus:outline-none py-2 w-full"
                                                name={`bills[${index}].dueDate`}
                                                value={item.dueDate}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                readOnly
                                              />
                                            </td>

                                            <td className="w-[160px] pl-5 border relative">
                                              {item?.type === OB_TYPE.OPENING_PAYABLE ? (
                                                <div className="py-2 px-1">
                                                  <Tag className="font-semibold">{item.billId2}</Tag>
                                                  <div className="text-xs text-gray-500 mt-1">(Vendor opening balance)</div>
                                                </div>
                                              ) : (
                                                <>
                                                  <input
                                                    type="text"
                                                    className="focus:outline-none py-2 w-full"
                                                    name={`bills[${index}].billId2`}
                                                    value={item.billId2}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    readOnly
                                                  />
                                                  {errors.bills?.[index]?.billId2 && touched.bills?.[index]?.billId2 && (
                                                    <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.bills[index].billId2}</div>
                                                  )}
                                                </>
                                              )}
                                            </td>
                                            <td className="w-[150px] pl-5 border text-center relative">
                                              <input
                                                type="text"
                                                className="focus:outline-none py-2 w-full"
                                                name={`bills[${index}].billAmount`}
                                                value={item.billAmount}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                readOnly
                                              />
                                              {errors.bills?.[index]?.billAmount && touched.bills?.[index]?.billAmount && (
                                                <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.bills[index].billAmount}</div>
                                              )}
                                            </td>
                                            <td className="w-[150px] pl-5 border text-center relative">
                                              <input
                                                type="text"
                                                className="focus:outline-none py-2 w-full"
                                                name={`bills[${index}].amountDue`}
                                                value={item?.amountDue ? toDecimalString(item?.amountDue) : ''}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                readOnly
                                              />
                                              {errors.bills?.[index]?.amountDue && touched.bills?.[index]?.amountDue && (
                                                <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.bills[index].amountDue}</div>
                                              )}
                                            </td>
                                            <td className="w-[150px] pl-5 border text-start relative">
                                              <input
                                                type="text"
                                                className="focus:outline-none py-2 w-full"
                                                name={`bills[${index}].amountApplied`}
                                                placeholder="0.00"
                                                value={amountField.show(item.amountApplied)}
                                                onChange={e => handleBillPaymentChange(e.target.value, values, index, setFieldValue)}
                                                onFocus={() => handleBillPaymentFocus(item, values, index, setFieldValue)}
                                                onBlur={e => handleBillPaymentBlur(e, values, index, setFieldValue, handleBlur)}
                                              />
                                              {errors.bills?.[index]?.amountApplied && touched.bills?.[index]?.amountApplied && (
                                                <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.bills[index].amountApplied}</div>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="6" className="border bg-gray-50">
                                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                              <Icons.InboxOutlined className="text-3xl mb-2 text-gray-400" />
                                              <span className="text-sm font-medium">No data found</span>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                </FieldArray>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {!values?.advancedPayment && (
                      <div className="flex justify-end pt-2">
                        <div className="w-full lg:w-[520px] bg-[#fafafa] rounded-lg p-3 px-6">
                          <div className="grid grid-cols-2 text-end p-2 justify-between">
                            <div className="text-base ">Allocated Amount :</div>
                            <div className="text-base ">{toDecimalString(values?.bills?.reduce((sum, b) => sum + parseFloat(b?.amountApplied || 0), 0) || 0)}</div>
                          </div>
                          <div className="grid grid-cols-2 text-end p-2 justify-between">
                            <div className="text-base ">Total Amount Paid :</div>
                            <div className="text-base ">{formatAmount(parseFloat(values?.receivedAmount) || 0, true, documentCurrency)}</div>
                          </div>
                          {(() => {
                            const total = parseFloat(values?.receivedAmount) || 0;
                            const allocated = values?.bills?.reduce((sum, b) => sum + parseFloat(b?.amountApplied || 0), 0) || 0;
                            const unused = total - allocated;
                            if (unused <= 0) return null;
                            return (
                              <div className="grid grid-cols-2 text-end p-2 justify-between">
                                <div className="text-base ">Unused Amount :</div>
                                <div className="text-base ">{formatAmount(unused, true, documentCurrency)}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Notes & Attachments card */}
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-3">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2 items-start">
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
                        />

                        <CustomFileUpload
                          name="attachments"
                          label="Attach Files(s) to Payment Made"
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
                  </div>
                  {values?.divisionId && values?.branchId && values?.warehouseId && (
                    <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                      <CustomButton
                        className="px-8 py-4 min-w-[50px]"
                        type="primary"
                        text="Save"
                        loading={submitLoading}
                        onClick={async () => {
                          const errors = await formikRef.current.validateForm();
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
        initialConfig={paymentMadeConfig}
        title="Configure Payment Made Number Preferences"
        description="Auto-generating payment made can save your time. Would you like to change your current setting?"
        setConfigDetail={setPaymentMadeConfig}
        moduleName={MODULE_NAMES?.PAYMENT_MADE}
      />
    </>
  );
};

export default AddPaymentMade;
