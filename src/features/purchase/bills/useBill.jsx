import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { billsSliceMethods, resetBill as resetBillAction, resetBills as resetBillsAction, resetPaymentHistory as resetPaymentHistoryAction } from '@/features/purchase/bills/bill.slice';

export const useBill = () => {
  const dispatch = useDispatch();

  const {
    bills,
    bill,
    vendorPendingBills,
    vendorPendingOpeningBalance,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    pendingBillsLoading,
    submitWithStatusLoading,
    error,
    exportLoading,
    exportBillData,
    paymentHistoryLoading,
    paymentHistory,
    applyVendorCreditLoading,
    removeObApplicationLoading,
    autoMapOpeningBalanceLoading,
  } = useSelector(state => state.bills);

  const getBills = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.getBills(payload));
      return response;
    },
    [dispatch]
  );

  const getPendingBills = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.getPendingBills(payload));
      return response;
    },
    [dispatch]
  );

  const createBills = useCallback(
    async billsDataPayload => {
      const response = await dispatch(billsSliceMethods.createBills(billsDataPayload));
      return response;
    },
    [dispatch]
  );

  const updateBills = useCallback(
    async ({ billsId, billsData }) => {
      const response = await dispatch(billsSliceMethods.updateBills({ billsId, billsData }));
      return response;
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.updateStatus(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getBillById = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.getBillById(payload));
      return response;
    },
    [dispatch]
  );

  const resetBill = useCallback(() => dispatch(resetBillAction()), [dispatch]);
  const resetBills = useCallback(() => dispatch(resetBillsAction()), [dispatch]);
  const removeBill = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.removeBill(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const exportBill = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.exportBill(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPaymentHistory = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.getPaymentHistory(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const resetPaymentHistory = useCallback(() => dispatch(resetPaymentHistoryAction()), [dispatch]);

  const createSplitBill = useCallback(
    async payload => {
      const response = await dispatch(billsSliceMethods.createSplitBill(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const applyVendorCreditToBill = useCallback(
    async payload => {
      return await dispatch(billsSliceMethods.applyVendorCreditToBill(payload)).unwrap();
    },
    [dispatch]
  );

  const removeOpeningBalanceApplication = useCallback(
    async payload => {
      return await dispatch(billsSliceMethods.removeOpeningBalanceApplication(payload)).unwrap();
    },
    [dispatch]
  );

  const autoMapOpeningBalanceToBills = useCallback(
    async payload => {
      return await dispatch(billsSliceMethods.autoMapOpeningBalanceToBills(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    bills,
    bill,
    vendorPendingBills,
    vendorPendingOpeningBalance,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    pendingBillsLoading,
    error,
    exportLoading,
    exportBillData,
    paymentHistoryLoading,
    paymentHistory,
    getBills,
    createBills,
    updateBills,
    getPendingBills,
    updateStatus,
    getBillById,
    resetBill,
    removeBill,
    resetBills,
    exportBill,
    getPaymentHistory,
    resetPaymentHistory,
    createSplitBill,
    applyVendorCreditToBill,
    applyVendorCreditLoading,
    removeOpeningBalanceApplication,
    removeObApplicationLoading,
    autoMapOpeningBalanceToBills,
    autoMapOpeningBalanceLoading,
  };
};
