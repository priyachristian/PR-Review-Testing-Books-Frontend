import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { FieldArray, Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import { Tooltip, Tag, Switch } from '@/components/AntDComponent';
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
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Hooks
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useModuleConfig } from 'hooks/useModuleConfig';
import useScrollToError from 'hooks/useScrollToError';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

// Extras
import { usePaymentReceived, paymentReceivedValidateSchema } from '@/features/sales/paymentsReceived';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { EXPENSE_ROW_TYPE, MODULE_NAMES, OB_TYPE, PAYMENT_MODES, PAYMENT_MODE_OPTIONS } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { errorsToTouched, shouldPreventNavigation, amountField, toApiDate } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import { formatAmount } from '@/utils/currency';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { toDecimalString, toDecimalNumber } from '@/utils/currency';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const AddPaymentReceived = () => {
  const formikRef = useRef(null);
  const { paymentId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();

  const {
    paymentInvoiceDrop,
    paymentInvoiceOpeningBalance,
    paymentInvoicePendingExpenses,
    paymentReceived,
    submitLoading,
    createPaymentsRecived,
    resetPaymentReceived,
    getPaymentRecivedById,
    updatePaymentsRecived,
    getPaymentInvoice,
    clearPaymentInvoiceDrop,
    loading: paymentReceivedLoading,
    droploading,
  } = usePaymentReceived();
  const paymentReceivedData = paymentId ? paymentReceived : location.state?.paymentReceivedData;
  // Recording a customer (portal) payment: amount and invoice allocation must match what the
  // customer submitted, so every control that changes them is locked.
  const isFromCustomerPayment = !paymentId && Boolean(location.state?.customerPaymentId);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const {
    isSplitWise,
    isSplitSessionActive,
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    customerDropDownList,
    resetCustomerDropDownList,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    selectedCustomerId,
    selectedBranchId,
    setSelectedCustomerId,
    customerNotInBranch,
    customerLoading,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(paymentReceivedData, RESOURCES.PAYMENT_RECEIVED, {
    skipLocationDropdowns: !!paymentId,
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });
  const selectedCustomerData = paymentId
    ? {
        id: paymentReceivedData?.customerId?._id || paymentReceivedData?.customerId?.id,
        customerDisplayName: paymentReceivedData?.customerId?.customerDisplayName,
        isCustomerDirectTax: paymentReceivedData?.customerId?.isCustomerDirectTax,
      }
    : customerDropDownList?.find(cust => cust.id === selectedCustomerId) || {};
  const { currency: baseCurrency } = useCompanyCurrency();
  const documentCurrency = paymentReceivedData?.currency || selectedCustomerData?.currency || baseCurrency;
  const { accountDrop, getAccounts } = useChartOfAccounts();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [paymentReceivedConfig, setPaymentReceivedConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [showCustomerError, setShowCustomerError] = useState(false);
  const [isSplitForApi, setIsSplitForApi] = useState(isSplitSessionActive);
  const [currentBranchOnly, setCurrentBranchOnly] = useState(() => !isFromCustomerPayment);
  const scrollToError = useScrollToError();

  useEffect(() => {
    if (paymentReceivedData?.isSplit !== undefined) {
      setIsSplitForApi(paymentReceivedData.isSplit);
    } else if (!paymentId) {
      setIsSplitForApi(isSplitSessionActive);
    }
  }, [paymentReceivedData?.isSplit, paymentId, isSplitSessionActive]);

  useEffect(() => {
    if (paymentId && paymentReceivedData) {
      // Saved allowCrossBranchMapping=true => switch OFF (show all branches)
      setCurrentBranchOnly(!paymentReceivedData.allowCrossBranchMapping);
    } else if (!paymentId) {
      // A portal payment can cover invoices from any branch; show all so its allocation is kept.
      setCurrentBranchOnly(!isFromCustomerPayment);
    }
  }, [paymentId, paymentReceivedData, isFromCustomerPayment]);

  useEffect(() => {
    if (formikRef.current) {
      formikRef.current.setFieldValue('splitInvoices', isSplitForApi);
    }
  }, [isSplitForApi]);

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const rowFromSavedOb = (x, paymentStatus) => {
    const t = x.openingBalanceTransaction || {};
    const ap = Number(x.amountApplied) || 0;
    const remaining = Number(t.remainingAmount) || 0;
    const d = x.appliedDate ? dayjs(x.appliedDate).format('DD-MM-YYYY') : '-';
    const amountDue = paymentStatus === 'APPROVED' ? remaining + ap : remaining;
    return {
      date: d,
      dueDate: d,
      invoiceId: t._id,
      invoiceId2: x.transactionNo || t.transactionNo,
      invoiceAmount: t.amount,
      amountDue,
      amountApplied: x.amountApplied,
      type: OB_TYPE.OPENING_RECEIVABLE,
    };
  };

  const invoiceDropWithOb = useMemo(
    () => mergePendingDropWithOb(paymentInvoiceDrop, paymentInvoiceOpeningBalance, 'invoice', paymentInvoicePendingExpenses),
    [paymentInvoiceDrop, paymentInvoiceOpeningBalance, paymentInvoicePendingExpenses]
  );

  const isSameBranch = (docBranchId, branchId) => {
    if (!branchId) return true;
    const normalized = docBranchId?._id || docBranchId?.id || docBranchId;
    if (!normalized) return true;
    return String(normalized) === String(branchId);
  };

  const buildInvoiceTableData = (data, dropWithOb, selectedCustomerIdForMerge, isEdit, options = {}) => {
    const { currentBranchOnly: branchOnly = false, selectedBranchId: branchId = null } = options;
    const paymentCustomerId = data?.customerId?.id || data?.customerId?._id || null;
    const shouldUsePaymentInvoices = isEdit || (paymentCustomerId && selectedCustomerIdForMerge && paymentCustomerId === selectedCustomerIdForMerge);

    const drop = dropWithOb || [];
    const d = data || {};
    let invoiceTableData = [];

    if (shouldUsePaymentInvoices) {
      d.invoices?.forEach(x => {
        // Unpopulated refs (customer payment prefill sends a plain id) are resolved against the pending drop below.
        if (!x?.invoiceId || typeof x.invoiceId !== 'object') return;
        if (branchOnly && !isSameBranch(x?.invoiceId?.branchId, branchId)) return;
        invoiceTableData.push({
          date: dayjs(x?.invoiceId?.invoiceDate).format('DD-MM-YYYY'),
          dueDate: dayjs(x?.invoiceId?.dueDate).format('DD-MM-YYYY'),
          invoiceId: x?.invoiceId?._id,
          invoiceId2: x?.invoiceId?.invoiceId,
          invoiceAmount: x?.invoiceId?.total,
          amountDue: x?.invoiceId?.balanceAmount,
          amountApplied: x?.amountApplied,
          tdsAmount: x?.tdsAmount || '0.00',
          branchId: x?.invoiceId?.branchId?._id || x?.invoiceId?.branchId || null,
          type: null,
        });
      });
      (d.openingBalanceTransactions || []).forEach(x => {
        const obBranchId = x?.openingBalanceTransaction?.branchId || x?.branchId;
        if (branchOnly && !isSameBranch(obBranchId, branchId)) return;
        invoiceTableData.push({ ...rowFromSavedOb(x, d.status), branchId: obBranchId?._id || obBranchId || null });
      });
      (d.expenses || []).forEach(x => {
        if (branchOnly && !isSameBranch(x.expenseId.branchId, branchId)) return;
        invoiceTableData.push({
          date: dayjs(x.expenseId.date).format('DD-MM-YYYY'),
          dueDate: dayjs(x.expenseId.date).format('DD-MM-YYYY'),
          invoiceId: x.expenseId._id,
          invoiceId2: x.expenseNo,
          invoiceAmount: x.expenseId.total,
          amountDue: x.expenseId.balanceAmount,
          amountApplied: x.amountApplied,
          branchId: x.expenseId.branchId,
          type: EXPENSE_ROW_TYPE,
        });
      });
    }

    drop.forEach(itm => {
      if (branchOnly && !isSameBranch(itm.branchId, branchId)) return;
      if (invoiceTableData.some(x => String(x.invoiceId) === String(itm._id))) return;
      const matchInv = shouldUsePaymentInvoices ? d.invoices?.find(i => String(i.invoiceId?._id || i.invoiceId) === String(itm._id)) : undefined;
      const matchOb = shouldUsePaymentInvoices ? (d.openingBalanceTransactions || []).find(o => String(o.openingBalanceTransaction?._id) === String(itm._id)) : undefined;
      const ob = itm.type === OB_TYPE.OPENING_RECEIVABLE;
      const fmt = dt => (dt ? dayjs(dt).format('DD-MM-YYYY') : '-');
      invoiceTableData.push({
        date: ob ? fmt(itm.invoiceDate) : dayjs(itm.invoiceDate).format('DD-MM-YYYY'),
        dueDate: ob ? fmt(itm.dueDate) : dayjs(itm.dueDate).format('DD-MM-YYYY'),
        invoiceId: itm._id,
        invoiceId2: itm.invoiceId,
        invoiceAmount: itm.total,
        // Only an existing payment has already reduced balanceAmount; a prefill has not, so don't add it back.
        amountDue: itm.balanceAmount + (isEdit ? Number(matchInv?.amountApplied || 0) + Number(matchInv?.tdsAmount || 0) + Number(matchOb?.amountApplied || 0) : 0),
        amountApplied: matchInv?.amountApplied || matchOb?.amountApplied || '0.00',
        tdsAmount: matchInv?.tdsAmount || '0.00',
        branchId: itm.branchId?._id || itm.branchId || null,
        type: itm.type ?? null,
      });
    });

    invoiceTableData.sort((a, b) => {
      const aOb = a?.type === OB_TYPE.OPENING_RECEIVABLE ? 0 : 1;
      const bOb = b?.type === OB_TYPE.OPENING_RECEIVABLE ? 0 : 1;
      return aOb - bOb;
    });

    return invoiceTableData;
  };

  const handleInvoiceTableData = () => {
    if (!formikRef.current) return;

    const { values, setFieldValue } = formikRef.current;
    const branchIdForFilter = selectedBranchId || values?.branchId || paymentReceivedData?.branchId?._id || paymentReceivedData?.branchId?.id || null;
    let rows = buildInvoiceTableData(paymentReceivedData, invoiceDropWithOb, selectedCustomerId, Boolean(paymentId), {
      currentBranchOnly,
      selectedBranchId: branchIdForFilter,
    });

    const receivedAmount = values?.receivedAmount;
    // Keep the customer's own allocation when recording a portal payment instead of re-allocating FIFO.
    const hasPrefilledAllocation = isFromCustomerPayment && rows.some(r => parseFloat(r?.amountApplied) > 0);
    const shouldReflect =
      !hasPrefilledAllocation && !values?.advancedPayment && values?.reflectPaymentInLines && receivedAmount !== '' && receivedAmount != null && !Number.isNaN(parseFloat(receivedAmount));

    if (shouldReflect) {
      let remaining = parseFloat(receivedAmount || 0);
      rows = (rows || []).map(x => {
        const amountDue = parseFloat(x?.amountDue || 0) - (parseFloat(x?.tdsAmount) || 0);
        if (amountDue > remaining) {
          const applied = remaining;
          remaining = 0;
          return { ...x, amountApplied: `${applied}` };
        }
        remaining -= amountDue;
        return { ...x, amountApplied: `${amountDue}` };
      });

      let total = 0;
      rows.forEach(item => {
        const applied = parseFloat(item?.amountApplied);
        if (!Number.isNaN(applied)) total += applied;
      });
      setFieldValue('amountReceived', total);
    }

    setFieldValue('invoices', rows);
  };

  useEffect(() => {
    const controller = new AbortController();
    getAccounts({ signal: controller.signal, type: 'PAYMENT' });
    getAccounts({ signal: controller.signal, type: 'TDS' });
    return () => controller.abort();
  }, [getAccounts]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    if (paymentId) {
      if (paymentReceivedData) {
        getModuleConfig({
          ...payload,
          moduleName: MODULE_NAMES.PAYMENT_RECEIVED,
          customerId: paymentReceivedData?.customerId?.id || paymentReceivedData?.customerId?._id,
        });
      }
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.PAYMENT_RECEIVED,
        customerId: paymentReceivedData?.customerId?.id || paymentReceivedData?.customerId?._id,
      });
    }
  }, [paymentId, paymentReceivedData, getModuleConfig]);

  useEffect(() => {
    const controller = new AbortController();

    if (selectedCustomerId && (!currentBranchOnly || selectedBranchId)) {
      const payload = {
        customerId: selectedCustomerId,
        isSplit: isSplitForApi,
        allowCrossBranchMapping: !currentBranchOnly,
        signal: controller.signal,
      };
      if (currentBranchOnly && selectedBranchId) {
        payload.branchId = selectedBranchId;
      }
      getPaymentInvoice(payload);
    } else {
      clearPaymentInvoiceDrop();
    }

    return () => controller.abort();
  }, [selectedCustomerId, selectedBranchId, currentBranchOnly, isSplitForApi, getPaymentInvoice, clearPaymentInvoiceDrop]);

  useEffect(() => {
    if (moduleConfig) {
      setPaymentReceivedConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !paymentId && paymentReceivedConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;

      const newPaymentId = paymentReceivedConfig.autoGenerate ? `${paymentReceivedConfig.prefix}${paymentReceivedConfig.nextNumber}` : '';
      formikRef.current.setFieldValue('paymentId', newPaymentId);

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
      }

      if (defaultConfig?.branchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [paymentReceivedConfig, paymentId, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (paymentId && (paymentReceivedLoading || moduleConfigLoading)) return;

    if (!selectedCustomerId) {
      if (formikRef.current) {
        formikRef.current.setFieldValue('invoices', []);
        formikRef.current.setFieldValue('amountReceived', '');
        formikRef.current.setFieldValue('receivedAmount', '');
      }
      return;
    }

    if (droploading) return;

    handleInvoiceTableData();
  }, [selectedCustomerId, invoiceDropWithOb, droploading, paymentId, paymentReceivedLoading, moduleConfigLoading, paymentReceivedData, currentBranchOnly, selectedBranchId]);

  useEffect(() => {
    const controller = new AbortController();
    if (paymentId) {
      getPaymentRecivedById({ paymentId, signal: controller.signal });
    } else {
      resetPaymentReceived();
    }

    return () => {
      controller.abort();
      resetCustomerDropDownList();
      resetPaymentReceived();
      clearPaymentInvoiceDrop();
    };
  }, [paymentId, getPaymentRecivedById, resetPaymentReceived, resetCustomerDropDownList, clearPaymentInvoiceDrop]);

  useEffect(() => {
    if (paymentReceived) {
      setDivisionBranchWarehouseFromEntity(paymentReceived);
      setSelectedCustomerId(paymentReceived?.customerId?.id || paymentReceived?.customerId?._id || null);
    }
  }, [paymentReceived, setDivisionBranchWarehouseFromEntity, setSelectedCustomerId]);

  useEffect(() => {
    if (customerNotInBranch) {
      formikRef.current?.setFieldValue('customerId', null);
      setShowCustomerError(true);
    }
  }, [customerNotInBranch]);

  const initialValues = useMemo(() => {
    const sumAmountApplied = paymentReceivedData?.invoices?.reduce((sum, inv) => sum + parseFloat(inv?.amountApplied ?? 0), 0) ?? 0;

    return {
      customerId: paymentReceivedData?.customerId?.id || paymentReceivedData?.customerId?._id || null,
      paymentId: paymentReceivedData ? paymentReceivedData?.paymentReceivedId : '',
      amountReceived: paymentReceivedData ? sumAmountApplied : 0,
      receivedAmount: paymentReceivedData != null && paymentReceivedData?.amountReceived != null && paymentReceivedData?.amountReceived !== '' ? String(paymentReceivedData.amountReceived) : '',
      paymentDate: paymentReceivedData?.paymentDate ? dayjs(paymentReceivedData.paymentDate) : dayjs(),
      paymentMode: paymentReceivedData ? paymentReceivedData?.paymentMode : null,
      depositTo: paymentReceivedData ? paymentReceivedData?.depositTo : null,
      chequeNo: paymentReceivedData ? paymentReceivedData?.chequeNo : '',
      chequeReceivedDate: paymentReceivedData?.chequeReceivedDate ? dayjs(paymentReceivedData.chequeReceivedDate) : null,
      reference: paymentReceivedData ? paymentReceivedData?.reference : '',
      taxDeducted: paymentReceivedData ? paymentReceivedData?.taxDeducted : false,
      tdsAccountId: paymentReceivedData?.tdsAccountId?._id || null,
      notes: paymentReceivedData ? paymentReceivedData?.notes : '',
      invoices:
        paymentId || paymentReceivedData
          ? buildInvoiceTableData(paymentReceivedData, invoiceDropWithOb, paymentReceivedData?.customerId?.id || paymentReceivedData?.customerId?._id || null, Boolean(paymentId), {
              currentBranchOnly: paymentId ? !paymentReceivedData?.allowCrossBranchMapping : currentBranchOnly,
              selectedBranchId: paymentReceivedData?.branchId?.id || paymentReceivedData?.branchId?._id || selectedBranchId,
            })
          : [],
      depositToAccountId: paymentReceivedData?.depositToAccountId?._id || null,
      advancedPayment: paymentReceivedData?.isAdvancePayment ? paymentReceivedData?.isAdvancePayment : false,
      reflectPaymentInLines: paymentReceivedData
        ? paymentId
          ? false
          : !paymentReceivedData?.isAdvancePayment &&
            ((paymentReceivedData?.invoices || []).some(inv => parseFloat(inv?.amountApplied ?? 0) > 0) ||
              (paymentReceivedData?.openingBalanceTransactions || []).some(ob => parseFloat(ob?.amountApplied ?? 0) > 0))
        : true,
      amountUsedForPayments: 0,
      divisionId: paymentReceivedData?.divisionId ? paymentReceivedData?.divisionId?.id || paymentReceivedData?.divisionId?._id : null,
      branchId: paymentReceivedData?.branchId ? paymentReceivedData?.branchId?.id || paymentReceivedData?.branchId?._id : null,
      warehouseId: paymentReceivedData?.warehouseId ? paymentReceivedData?.warehouseId?.id || paymentReceivedData?.warehouseId?._id : null,
      splitInvoices: paymentId ? paymentReceivedData?.isSplit || false : isSplitSessionActive,
      attachments: paymentReceivedData?.attachments || [],
      exchangeRate: paymentReceivedData?.currency?.exchangeRate ?? 1,
    };
  }, [paymentReceivedData, paymentId, isSplitSessionActive]);

  const fieldsToIgnore = ['invoices', 'paymentId', 'amountReceived', 'receivedAmount'];

  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const calculateAmountUsedForPayments = (invoices, setFieldValue) => {
    let total = 0;
    invoices?.forEach(item => {
      if (item?.amountApplied && !isNaN(item?.amountApplied)) {
        total = total + (item?.amountApplied ? parseFloat(item?.amountApplied) : 0);
      }
    });
    if (setFieldValue) {
      setFieldValue('amountReceived', total);
    }
    return total;
  };

  const onFinish = async values => {
    if (submitLoading) return;

    const enteredReceivedAmount = parseFloat(values?.receivedAmount || 0);

    if (!Number.isFinite(enteredReceivedAmount) || enteredReceivedAmount <= 0) {
      Toast.error('Please enter the received amount.');
      return;
    }

    const isTdsDeducted = values.taxDeducted === true && !values?.advancedPayment;
    const rowTds = item => (isTdsDeducted && !item?.type ? parseFloat(item?.tdsAmount) || 0 : 0);
    const itemsWithAmount = values.invoices?.filter(item => (parseFloat(item?.amountApplied) || 0) + rowTds(item) > 0) || [];

    // Every submitted invoice must still be payable (e.g. not paid off or cancelled meanwhile),
    // otherwise the recorded payment would differ from what the customer submitted.
    if (isFromCustomerPayment) {
      // Read from navigation state: `paymentReceivedData` is shadowed by the API payload const below.
      const submittedInvoices = location.state?.paymentReceivedData?.invoices || [];
      const missing = submittedInvoices.filter(
        sub => !itemsWithAmount.some(row => String(row.invoiceId) === String(sub.invoiceId?._id || sub.invoiceId) && Math.abs(parseFloat(row.amountApplied) - parseFloat(sub.amountApplied)) < 0.01)
      );
      if (missing.length > 0) {
        Toast.error(`Invoice ${missing.map(inv => inv.invoiceNo).join(', ')} is no longer payable for the submitted amount. Reject this customer payment instead.`);
        return;
      }
    }

    if (!values?.advancedPayment && values.reflectPaymentInLines && itemsWithAmount.length === 0) {
      Toast.error('Please apply the payment to at least one invoice, or mark it as an advance payment.');
      return;
    }

    const processedInvoices = itemsWithAmount
      .filter(item => !item?.type)
      .map(invoice => ({
        invoiceId: invoice.invoiceId,
        invoiceNo: invoice.invoiceId2,
        amountApplied: parseFloat(invoice.amountApplied) || 0,
        tdsAmount: rowTds(invoice),
      }));
    const processedOpeningBalanceTransactions = itemsWithAmount
      .filter(item => item?.type === OB_TYPE.OPENING_RECEIVABLE)
      .map(ob => ({
        openingBalanceTransactionId: ob.invoiceId,
        transactionNo: ob.invoiceId2 || `OB-${ob.invoiceId}`,
        amountApplied: parseFloat(ob.amountApplied) || 0,
      }));
    const processedExpenses = itemsWithAmount
      .filter(item => item?.type === EXPENSE_ROW_TYPE)
      .map(expense => ({
        expenseId: expense.invoiceId,
        expenseNo: expense.invoiceId2,
        amountApplied: parseFloat(expense.amountApplied),
      }));

    // Extract attachments from Formik values (can be File objects or URL strings)
    const attachments = Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [];

    const amountForApi = enteredReceivedAmount;

    const paymentReceivedData = {
      ...(!paymentId && { customerId: values.customerId }),
      ...(!paymentId && { paymentReceivedId: values.paymentId }),
      amountReceived: toDecimalString(amountForApi),
      paymentDate: toApiDate(values.paymentDate),
      paymentMode: values.paymentMode,
      depositToAccountId: values.depositToAccountId || null,
      reference: values.reference,
      taxDeducted: isTdsDeducted,
      tdsAccountId: isTdsDeducted ? values.tdsAccountId : null,
      ...(!values?.advancedPayment && {
        invoices: processedInvoices,
        openingBalanceTransactions: processedOpeningBalanceTransactions,
        expenses: processedExpenses,
      }),
      notes: values.notes,
      attachments,
      ...(values?.paymentMode === PAYMENT_MODES.CHEQUE && { chequeNo: values.chequeNo }),
      ...(values?.paymentMode === PAYMENT_MODES.CHEQUE && { chequeReceivedDate: toApiDate(values.chequeReceivedDate) }),
      isAdvancePayment: values?.advancedPayment,
      divisionId: values?.divisionId,
      branchId: values?.branchId,
      warehouseId: values?.warehouseId,
      isSplit: values?.splitInvoices || false,
      allowCrossBranchMapping: !currentBranchOnly,
      exchangeRate: values.exchangeRate,
      // Backend approves and links the customer payment in the same transaction.
      ...(isFromCustomerPayment && { customerPaymentId: location.state.customerPaymentId }),
    };

    const result = paymentId ? await updatePaymentsRecived({ paymentId, paymentReceivedData }) : await createPaymentsRecived(paymentReceivedData);

    if (shouldPreventNavigation(result)) {
      return;
    }

    // For successful updates/creates, navigate to detail page
    // When editing, use paymentId from route; when creating, use ID from result
    const targetId = paymentId || result?.payload?.data?.id || result?.data?.id;

    if (targetId) {
      navigateAfterSave(`/payments-received/${targetId}`, {
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

  if (paymentId && (paymentReceivedLoading || moduleConfigLoading)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  const handleAmount = (value, arr, setFieldValue) => {
    let remaining = parseFloat(value || 0);

    const updatedArr = arr?.map(x => {
      const amountDue = parseFloat(x?.amountDue || 0) - (parseFloat(x?.tdsAmount) || 0);
      if (amountDue > remaining) {
        const applied = remaining;
        remaining = 0;
        return { ...x, amountApplied: `${applied}` };
      }
      remaining -= amountDue;
      return { ...x, amountApplied: `${amountDue}` };
    });

    if (updatedArr) {
      calculateAmountUsedForPayments(updatedArr, setFieldValue);
      setFieldValue('invoices', updatedArr);
    }
  };

  const canShowInvoicePaymentOptions = values => !values?.advancedPayment && values?.customerId && values.invoices?.length > 0;

  const hasReceivedAmountValue = value => value !== '' && value != null && !Number.isNaN(parseFloat(value));

  const clearInvoicePayments = (invoices, setFieldValue) => {
    const clearedInvoices = (invoices || []).map(invoice => ({
      ...invoice,
      amountApplied: '0.00',
      tdsAmount: '0.00',
    }));
    setFieldValue('invoices', clearedInvoices);
    calculateAmountUsedForPayments(clearedInvoices, setFieldValue);
  };

  const syncInvoicePaymentsFromReceivedAmount = (receivedAmount, invoices, setFieldValue) => {
    if (hasReceivedAmountValue(receivedAmount)) {
      handleAmount(receivedAmount, invoices, setFieldValue);
      return;
    }
    calculateAmountUsedForPayments(invoices || [], setFieldValue);
  };

  const handleAdvancedPaymentChange = (checked, values, setFieldValue) => {
    if (!checked) {
      setFieldValue('reflectPaymentInLines', true);
      const branchIdForFilter = selectedBranchId || values?.branchId || paymentReceivedData?.branchId?._id || paymentReceivedData?.branchId?.id || null;
      const rows =
        values.invoices?.length > 0
          ? values.invoices
          : buildInvoiceTableData(paymentReceivedData, invoiceDropWithOb, selectedCustomerId, Boolean(paymentId), {
              currentBranchOnly,
              selectedBranchId: branchIdForFilter,
            });
      if (!values.invoices?.length) {
        setFieldValue('invoices', rows);
      }
      syncInvoicePaymentsFromReceivedAmount(values.receivedAmount, rows, setFieldValue);
      return;
    }
    setFieldValue('reflectPaymentInLines', false);
    setFieldValue('taxDeducted', false);
    setFieldValue('tdsAccountId', null);
    clearInvoicePayments(values.invoices, setFieldValue);
  };

  const handleReceivedAmountChange = (event, values, setFieldValue) => {
    const newValue = event?.target?.value;
    setFieldValue('receivedAmount', newValue);
    if (!values?.advancedPayment && values.reflectPaymentInLines && hasReceivedAmountValue(newValue)) {
      handleAmount(newValue, values?.invoices, setFieldValue);
    }
  };

  const handleReceivedAmountFocus = (values, setFieldValue) => {
    if (amountField.focusClear(values.receivedAmount)) {
      setFieldValue('receivedAmount', '');
    }
  };

  const handleReceivedAmountBlur = (event, values, setFieldValue, handleBlur) => {
    const rawValue = String(event.target.value ?? '').trim();
    const nextValue = rawValue === '' ? '' : amountField.blur(rawValue);
    setFieldValue('receivedAmount', nextValue);
    if (!values?.advancedPayment && values.reflectPaymentInLines && hasReceivedAmountValue(nextValue)) {
      handleAmount(nextValue, values?.invoices, setFieldValue);
    }
    handleBlur(event);
  };

  const handleReflectPaymentInLinesChange = (checked, values, setFieldValue) => {
    setFieldValue('reflectPaymentInLines', checked);
    if (checked) {
      syncInvoicePaymentsFromReceivedAmount(values.receivedAmount, values.invoices, setFieldValue);
      return;
    }
    clearInvoicePayments(values.invoices, setFieldValue);
  };

  const updateInvoicePaymentValue = (invoices, index, amountApplied, setFieldValue) => {
    const updatedInvoices = (invoices || []).map((invoice, invoiceIndex) => (invoiceIndex === index ? { ...invoice, amountApplied } : invoice));
    setFieldValue('invoices', updatedInvoices);
    return updatedInvoices;
  };

  const handleInvoicePaymentChange = (value, values, index, setFieldValue) => {
    const updatedInvoices = updateInvoicePaymentValue(values.invoices, index, value, setFieldValue);
    calculateAmountUsedForPayments(updatedInvoices, setFieldValue);
  };

  const handleInvoicePaymentFocus = (item, values, index, setFieldValue) => {
    if (!amountField.focusClear(item.amountApplied)) return;
    updateInvoicePaymentValue(values.invoices, index, '', setFieldValue);
  };

  // Payment + TDS cannot exceed the amount due; an excess resets the edited field to what is left.
  const capToDue = (value, otherAmount, amountDue) => {
    const remainingDue = toDecimalNumber(Number(amountDue) - Number(otherAmount));
    const maxAllowed = Math.max(remainingDue, 0);
    if (Number(value) > maxAllowed) return toDecimalString(maxAllowed);
    return value;
  };

  const handleInvoicePaymentBlur = (event, values, index, setFieldValue, handleBlur) => {
    const invoice = values.invoices[index];
    let nextValue = amountField.blur(event.target.value);
    if (values.taxDeducted === true) {
      nextValue = capToDue(nextValue, invoice.tdsAmount, invoice.amountDue);
    }
    const updatedInvoices = updateInvoicePaymentValue(values.invoices, index, nextValue, setFieldValue);
    calculateAmountUsedForPayments(updatedInvoices, setFieldValue);
    handleBlur(event);
  };

  const handleTaxDeductedChange = (value, values, setFieldValue) => {
    if (value) {
      const tdsAccountOptions = (accountDrop.TDS || []).flatMap(group => group.options);
      const advanceTax = tdsAccountOptions.find(option => option.systemAccountKey === 'ADVANCE_TAX');
      setFieldValue('tdsAccountId', values.tdsAccountId || advanceTax?.value || null);
      return;
    }
    setFieldValue('tdsAccountId', null);
    setFieldValue(
      'invoices',
      values.invoices.map(invoice => ({ ...invoice, tdsAmount: '0.00' }))
    );
  };

  const setInvoiceTdsValue = (invoices, index, tdsAmount, setFieldValue) => {
    setFieldValue(
      'invoices',
      invoices.map((invoice, invoiceIndex) => (invoiceIndex === index ? { ...invoice, tdsAmount } : invoice))
    );
  };

  const handleInvoiceTdsChange = (value, values, index, setFieldValue) => {
    setInvoiceTdsValue(values.invoices, index, value, setFieldValue);
  };

  const handleInvoiceTdsFocus = (item, values, index, setFieldValue) => {
    if (!amountField.focusClear(item.tdsAmount)) return;
    setInvoiceTdsValue(values.invoices, index, '', setFieldValue);
  };

  const handleInvoiceTdsBlur = (event, values, index, setFieldValue, handleBlur) => {
    const invoice = values.invoices[index];
    const enteredTds = amountField.blur(event.target.value);
    const nextTds = capToDue(enteredTds, invoice.amountApplied, invoice.amountDue);
    setInvoiceTdsValue(values.invoices, index, nextTds, setFieldValue);
    handleBlur(event);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{paymentId ? `Edit Payment Received / ${paymentReceivedData?.paymentReceivedId}` : 'Add Payment Received'}</h1>
            </div>
          </div>
          {selectedCustomerId && <CustomerBasicDetail customerData={selectedCustomerData} wrapperClassName="flex items-center" />}
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
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={paymentReceivedValidateSchema(paymentReceivedConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched, setFieldTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
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
                            value={values.divisionId}
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
                              setFieldValue('customerId', null, false);
                              setSelectedCustomerId(null);
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
                            value={values.branchId}
                            onBlur={handleBlur}
                            errorMessage={errors.branchId}
                            touched={touched.branchId}
                            setFieldValue={setFieldValue}
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
                            required={true}
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
                          <CustomInput type="text" name="divisionId" label="Division" value={paymentReceivedData?.divisionId?.name} disabled />
                          <CustomInput type="text" name="branchId" label="Branch" value={paymentReceivedData?.branchId?.name} disabled />
                          <CustomInput type="text" name="warehouseId" label="Warehouse" value={paymentReceivedData?.warehouseId?.name} disabled />
                        </div>
                      )}
                    </div>

                    {/* Document details */}
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0">Document details</h3>

                        {/* Row 1: Customer Name */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative">
                          <div className="relative">
                            {documentCurrency && values.customerId && (
                              <div className="absolute top-0 right-0 z-10">
                                <StatusBadge value={`${documentCurrency.code}`.trim()} accentHex={colorPalette.primary[500]} />
                              </div>
                            )}
                            {!paymentId ? (
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
                                  setFieldValue('receivedAmount', '');
                                  setFieldValue('taxDeducted', false);
                                  setFieldValue('tdsAccountId', null);
                                  setSelectedCustomerId(e);
                                  setFieldValue('exchangeRate', newCustomerDetail?.currency?.exchangeRate || 1);
                                }}
                                onBlur={handleBlur}
                                errorMessage={errors.customerId}
                                touched={touched.customerId}
                                setFieldValue={setFieldValue}
                                placeholder="Select Customer Name"
                                selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                                loading={customerLoading}
                                notFoundContent={<div className="flex items-center justify-center w-full">No Customer Available</div>}
                                required={true}
                                disabled={isFromCustomerPayment}
                              />
                            ) : (
                              <CustomInput type="text" name="customerId" label="Customer Name" value={paymentReceivedData?.customerId?.customerDisplayName} disabled />
                            )}
                          </div>
                        </div>

                        {/* Row 2: Payment Received# | Payment Date | Payment Mode */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start relative mt-4">
                          <CustomInput
                            type="text"
                            name="paymentId"
                            label="Payment Received#"
                            placeholder="Enter Payment Received"
                            value={values.paymentId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.paymentId}
                            touched={touched.paymentId}
                            setFieldValue={setFieldValue}
                            disabled={paymentReceivedConfig?.autoGenerate || paymentId}
                            suffix={
                              !paymentId && (
                                <Tooltip title="Configure Payment Received Number">
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

                          <div className="relative">
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
                              disabled={isFromCustomerPayment && Boolean(paymentReceivedData?.paymentMode)}
                            />
                          </div>

                          <div className="relative">
                            <CustomInput
                              type="account"
                              name="depositToAccountId"
                              label="Deposit To"
                              placeholder="Select Deposit To Account"
                              value={values.depositToAccountId}
                              onChange={value => setFieldValue('depositToAccountId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.depositToAccountId}
                              touched={touched.depositToAccountId}
                              setFieldValue={setFieldValue}
                              selectOptions={accountDrop.PAYMENT}
                              disabled={isFromCustomerPayment && Boolean(paymentReceivedData?.depositToAccountId?._id)}
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
                                name="chequeReceivedDate"
                                label="Received Date"
                                value={values.chequeReceivedDate ? values.chequeReceivedDate : null}
                                setFieldValue={setFieldValue}
                                setFieldTouched={setFieldTouched}
                                onBlur={handleBlur}
                                errorMessage={errors.chequeReceivedDate}
                                touched={touched.chequeReceivedDate}
                                placeholder="Select Cheque Received Date"
                                format="YYYY-MM-DD"
                                required={true}
                              />
                            </>
                          )}

                          {(selectedCustomerData?.isCustomerDirectTax || values.taxDeducted === true) && (
                            <CustomInput
                              type="radio"
                              name="taxDeducted"
                              label="Tax deducted?"
                              value={values.taxDeducted}
                              onChange={e => handleTaxDeductedChange(e.target.value, values, setFieldValue)}
                              onBlur={handleBlur}
                              errorMessage={errors.taxDeducted}
                              touched={touched.taxDeducted}
                              setFieldValue={setFieldValue}
                              disabled={values.advancedPayment}
                              radioOptions={[
                                { value: false, label: 'No Tax deducted' },
                                { value: true, label: 'Yes, TDS (Income Tax)' },
                              ]}
                            />
                          )}
                          {values.taxDeducted === true && (
                            <CustomInput
                              type="account"
                              name="tdsAccountId"
                              label="TDS Account"
                              placeholder="Select TDS Account"
                              value={values.tdsAccountId}
                              onChange={value => setFieldValue('tdsAccountId', value || null)}
                              onBlur={handleBlur}
                              errorMessage={errors.tdsAccountId}
                              touched={touched.tdsAccountId}
                              setFieldValue={setFieldValue}
                              selectOptions={accountDrop.TDS}
                              required={true}
                            />
                          )}
                          {documentCurrency?.code && baseCurrency?.code && documentCurrency.code !== baseCurrency.code && (
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
                          )}

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
                              disabled={isFromCustomerPayment}
                            />
                          </div>
                          <div className="space-y-2">
                            <CustomInput
                              type="text"
                              name="receivedAmount"
                              label="Received Amount"
                              placeholder="Enter Amount"
                              value={amountField.show(values.receivedAmount)}
                              onChange={e => handleReceivedAmountChange(e, values, setFieldValue)}
                              onFocus={() => handleReceivedAmountFocus(values, setFieldValue)}
                              onBlur={e => handleReceivedAmountBlur(e, values, setFieldValue, handleBlur)}
                              errorMessage={errors.receivedAmount}
                              touched={touched.receivedAmount}
                              setFieldValue={setFieldValue}
                              disabled={isFromCustomerPayment}
                              required
                            />
                            {canShowInvoicePaymentOptions(values) && (
                              <CustomInput
                                type="checkbox"
                                name="reflectPaymentInLines"
                                CheckboxName="Should this amount be reflected in the payment field?"
                                value={values.reflectPaymentInLines}
                                errorMessage={errors.reflectPaymentInLines}
                                touched={touched.reflectPaymentInLines}
                                setFieldValue={setFieldValue}
                                onChange={e => handleReflectPaymentInLinesChange(e.target.checked, values, setFieldValue)}
                                disabled={isFromCustomerPayment}
                              />
                            )}
                          </div>
                          {isSplitSessionActive && isSplitWise && (
                            <div className="flex items-center gap-x-4 pt-2">
                              <div className="w-max">
                                <CustomInput
                                  type="switch"
                                  name="splitInvoices"
                                  value={values.splitInvoices}
                                  onChange={checked => {
                                    setIsSplitForApi(checked);
                                    setFieldValue('splitInvoices', checked);
                                    setFieldValue('paymentMode', null);
                                    setFieldValue('amountReceived', '');
                                    setFieldValue('receivedAmount', '');

                                    const invoicesWithZeroApplied = values?.invoices?.map(x => ({
                                      ...x,
                                      amountApplied: '0.00',
                                    }));
                                    if (invoicesWithZeroApplied?.length) {
                                      setFieldValue('invoices', invoicesWithZeroApplied);
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.splitInvoices}
                                  touched={touched.splitInvoices}
                                  setFieldValue={setFieldValue}
                                  disabled={paymentId || isFromCustomerPayment}
                                />
                              </div>
                              <div>Split Invoices</div>
                            </div>
                          )}
                        </div>
                      </div>
                      {!values?.advancedPayment && (
                        <div className="pt-6">
                          {errors.invoices && typeof errors.invoices === 'string' && <div className="text-red-500 text-sm mb-2">{errors.invoices}</div>}
                          <div className="flex justify-between items-center text-base font-semibold pb-3">
                            <p>Invoice Table</p>
                            <button
                              className={`mr-6 ${isFromCustomerPayment ? 'opacity-40 cursor-not-allowed' : ''}`}
                              style={{ color: colorPalette.primary[500] }}
                              disabled={droploading || isFromCustomerPayment}
                              onClick={e => {
                                e.preventDefault();
                                clearInvoicePayments(values.invoices, setFieldValue);
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
                                    const branchIdForFilter = selectedBranchId || values?.branchId || paymentReceivedData?.branchId?._id || paymentReceivedData?.branchId?.id || null;
                                    const nextRows = (values.invoices || []).filter(row => isSameBranch(row.branchId, branchIdForFilter));
                                    setFieldValue('invoices', nextRows);
                                    calculateAmountUsedForPayments(nextRows, setFieldValue);
                                  }
                                }}
                                size="small"
                                disabled={droploading || isFromCustomerPayment}
                              />
                              <span className="text-sm text-gray-700 whitespace-nowrap">Show current branch documents only</span>
                            </div>
                            <p className="text-xs text-gray-500 pl-8">Only Sent, Partially Paid and Overdue invoices will be shown.</p>
                          </div>
                          {errors.invoicePaymentExceedsDue && <div className="text-red-500 text-sm mb-2">{errors.invoicePaymentExceedsDue}</div>}
                          {droploading ? (
                            <PaymentAllocationTableSkeleton variant="invoice" />
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="border-collapse w-full">
                                <thead>
                                  <tr className="w-full">
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[130px]">Invoice Date</th>
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[130px]">Due Date</th>
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[160px]">Invoice No</th>
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Invoice Amount{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Amount Due{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                    <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">Payment{documentCurrency?.code ? ` (${documentCurrency.code})` : ''}</th>
                                    {values.taxDeducted === true && (
                                      <th className="border px-2 py-3 bg-[#fafafa] text-start pl-5 w-[150px]">
                                        <span className="inline-flex items-center">
                                          TDS {documentCurrency?.code ? ` (${documentCurrency.code})` : ''}
                                          <span className="pointer-events-auto cursor-pointer ml-2 inline-block text-base">
                                            <Tooltip
                                              title="TDS is the amount your customer deducts from the invoice and deposits with the government on your behalf. Enter the actual TDS amount here. Payment + TDS cannot exceed the invoice's due amount."
                                              placement="right"
                                            >
                                              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
                                            </Tooltip>
                                          </span>
                                        </span>
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  <FieldArray name="invoices">
                                    {() => (
                                      <>
                                        {values.invoices?.length > 0 ? (
                                          values.invoices?.map((item, index) => (
                                            <tr key={index}>
                                              <td className="w-[130px] pl-5 border text-center relative">
                                                <input
                                                  type="text"
                                                  className="focus:outline-none py-2 w-full"
                                                  name={`invoices[${index}].date`}
                                                  value={item.date}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                                  readOnly
                                                />
                                                {errors.invoices?.[index]?.date && touched.invoices?.[index]?.date && (
                                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.invoices[index].date}</div>
                                                )}
                                              </td>
                                              <td className="w-[130px] pl-5 border text-center">
                                                <input
                                                  type="text"
                                                  className="focus:outline-none py-2 w-full"
                                                  name={`invoices[${index}].dueDate`}
                                                  value={item.dueDate}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                                  readOnly
                                                />
                                              </td>

                                              <td className="w-[160px] pl-5 border relative">
                                                {item?.type === OB_TYPE.OPENING_RECEIVABLE ? (
                                                  <div className="py-2 px-1">
                                                    <Tag className="font-semibold">{item.invoiceId2}</Tag>
                                                    <div className="text-xs text-gray-500 mt-1">(Customer opening balance)</div>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <input
                                                      type="text"
                                                      className="focus:outline-none py-2 w-full"
                                                      name={`invoices[${index}].invoiceId2`}
                                                      value={item.invoiceId2}
                                                      onChange={handleChange}
                                                      onBlur={handleBlur}
                                                      readOnly
                                                    />
                                                    {errors.invoices?.[index]?.invoiceId2 && touched.invoices?.[index]?.invoiceId2 && (
                                                      <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.invoices[index].invoiceId2}</div>
                                                    )}
                                                  </>
                                                )}
                                              </td>
                                              <td className="w-[150px] pl-5 border text-center relative">
                                                <input
                                                  type="text"
                                                  className="focus:outline-none py-2 w-full"
                                                  name={`invoices[${index}].invoiceAmount`}
                                                  value={item?.invoiceAmount ? toDecimalString(item?.invoiceAmount) : 0}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                                  readOnly
                                                />
                                                {errors.invoices?.[index]?.invoiceAmount && touched.invoices?.[index]?.invoiceAmount && (
                                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.invoices[index].invoiceAmount}</div>
                                                )}
                                              </td>
                                              <td className="w-[150px] pl-5 border text-center relative">
                                                <input
                                                  type="text"
                                                  className="focus:outline-none py-2 w-full"
                                                  name={`invoices[${index}].amountDue`}
                                                  value={item?.amountDue ? toDecimalString(item?.amountDue) : ''}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                                  readOnly
                                                />
                                                {errors.invoices?.[index]?.amountDue && touched.invoices?.[index]?.amountDue && (
                                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.invoices[index].amountDue}</div>
                                                )}
                                              </td>
                                              <td className="w-[150px] pl-5 border text-start relative">
                                                <input
                                                  type="text"
                                                  className={`focus:outline-none py-2 w-full ${isFromCustomerPayment ? 'cursor-not-allowed text-gray-500' : ''}`}
                                                  name={`invoices[${index}].amountApplied`}
                                                  placeholder="0.00"
                                                  value={amountField.show(item.amountApplied)}
                                                  readOnly={isFromCustomerPayment}
                                                  onChange={e => handleInvoicePaymentChange(e.target.value, values, index, setFieldValue)}
                                                  onFocus={() => !isFromCustomerPayment && handleInvoicePaymentFocus(item, values, index, setFieldValue)}
                                                  onBlur={e => !isFromCustomerPayment && handleInvoicePaymentBlur(e, values, index, setFieldValue, handleBlur)}
                                                />
                                                {errors.invoices?.[index]?.amountApplied && touched.invoices?.[index]?.amountApplied && (
                                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.invoices[index].amountApplied}</div>
                                                )}
                                              </td>
                                              {values.taxDeducted === true && (
                                                <td className="w-[150px] pl-5 border text-start relative">
                                                  {!item?.type && (
                                                    <input
                                                      type="text"
                                                      className="focus:outline-none py-2 w-full"
                                                      name={`invoices[${index}].tdsAmount`}
                                                      placeholder="0.00"
                                                      value={amountField.show(item.tdsAmount)}
                                                      onChange={e => handleInvoiceTdsChange(e.target.value, values, index, setFieldValue)}
                                                      onFocus={() => handleInvoiceTdsFocus(item, values, index, setFieldValue)}
                                                      onBlur={e => handleInvoiceTdsBlur(e, values, index, setFieldValue, handleBlur)}
                                                    />
                                                  )}
                                                </td>
                                              )}
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={values.taxDeducted === true ? 7 : 6} className="border bg-gray-50">
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
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 gap-y-5 pt-2">
                        <div>
                          <CustomInput
                            type="textarea"
                            name="notes"
                            label="Notes (Not visible to customer)"
                            placeholder="Enter Notes"
                            value={values.notes}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.notes}
                            touched={touched.notes}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                        {!values?.advancedPayment && (
                          <div className="col-span-2 bg-[#fafafa] rounded-lg p-3 px-6 lg:mx-6">
                            <div className="grid grid-cols-2 text-end p-2 justify-between">
                              <div className="text-sm ">Allocated Amount :</div>
                              <div className="text-sm ">{toDecimalString(values?.invoices?.reduce((sum, inv) => sum + parseFloat(inv?.amountApplied || 0), 0) || 0)}</div>
                            </div>
                            {values.taxDeducted === true && (
                              <div className="grid grid-cols-2 text-end p-2 justify-between">
                                <div className="text-sm ">TDS Amount :</div>
                                <div className="text-sm ">{formatAmount(values?.invoices?.reduce((sum, inv) => sum + (parseFloat(inv?.tdsAmount) || 0), 0) || 0, true, documentCurrency)}</div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 text-end p-2 justify-between">
                              <div className="text-sm ">Total Amount Received :</div>
                              <div className="text-sm ">{formatAmount(parseFloat(values?.receivedAmount) || 0, true, documentCurrency)}</div>
                            </div>
                            {(() => {
                              const total = parseFloat(values?.receivedAmount) || 0;
                              const allocated = values?.invoices?.reduce((sum, inv) => sum + parseFloat(inv?.amountApplied || 0), 0) || 0;
                              const unused = total - allocated;
                              if (unused <= 0) return null;
                              return (
                                <div className="grid grid-cols-2 text-end p-2 justify-between">
                                  <div className="text-sm ">Unused Amount :</div>
                                  <div className="text-sm ">{formatAmount(unused, true, documentCurrency)}</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="grid md:grid-cols-1 lg:grid-cols-3 lg:gap-x-7 items-start pt-2">
                        <CustomFileUpload
                          name="attachments"
                          label="Attach File(s) to Payment Received"
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
        <CodeConfigModal
          isVisible={isConfigModalVisible}
          onCancel={handleConfigModalVisibility}
          loading={moduleConfigLoading}
          initialConfig={paymentReceivedConfig}
          title="Configure Payment Received Number Preferences"
          description="Auto-generating payment received numbers can save your time. Would you like to change your current setting?"
          setConfigDetail={setPaymentReceivedConfig}
          moduleName={MODULE_NAMES?.PAYMENT_RECEIVED}
        />
      </div>
    </>
  );
};

export default AddPaymentReceived;
