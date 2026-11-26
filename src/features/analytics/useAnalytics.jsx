import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  analyticsSliceMethods,
  resetSalesAnalytics as resetSalesAnalyticsAction,
  resetPurchaseAnalytics as resetPurchaseAnalyticsAction,
  resetPaymentAnalytics as resetPaymentAnalyticsAction,
  resetItemGroupAnalytics as resetItemGroupAnalyticsAction,
  resetSubItemGroupAnalytics as resetSubItemGroupAnalyticsAction,
  resetTopCustomersOfSalesAnalytics as resetTopCustomersOfSalesAnalyticsAction,
  resetCustomerWiseBusinessPerformance as resetCustomerWiseBusinessPerformanceAction,
  resetTopItemsOfSalesAnalytics as resetTopItemsOfSalesAnalyticsAction,
  resetCustomersWithSingleInvoiceAnalytics as resetCustomersWithSingleInvoiceAnalyticsAction,
  resetTopVendorsByAmountPurchaseAnalytics as resetTopVendorsByAmountPurchaseAnalyticsAction,
  resetTopVendorsByRevenuePurchaseAnalytics as resetTopVendorsByRevenuePurchaseAnalyticsAction,
  resetTopVendorsByItemsPurchaseAnalytics as resetTopVendorsByItemsPurchaseAnalyticsAction,
  resetTopCustomerByAmountPaymentReceivedAnalytics as resetTopCustomerByAmountPaymentReceivedAnalyticsAction,
  resetRecentPaymentReceivedAnalytics as resetRecentPaymentReceivedAnalyticsAction,
  resetUpcomingPaymentReceivedByInvoiceAnalytics as resetUpcomingPaymentReceivedByInvoiceAnalyticsAction,
  resetOverDueInvoiceAnalytics as resetOverDueInvoiceAnalyticsAction,
  resetItemProcessAnalytics as resetItemProcessAnalyticsAction,
  resetTopVendorsByAmountPaymentMadeAnalytics as resetTopVendorsByAmountPaymentMadeAnalyticsAction,
  resetRecentPaymentMadeAnalytics as resetRecentPaymentMadeAnalyticsAction,
  resetUpcomingPaymentMadeByBillsAnalytics as resetUpcomingPaymentMadeByBillsAnalyticsAction,
  resetOverDueBillsAnalytics as resetOverDueBillsAnalyticsAction,
  resetSalesOrderRmAnalytics as resetSalesOrderRmAnalyticsAction,
  resetGeneralSalesAnalyticsList as resetGeneralSalesAnalyticsListAction,
  resetGeneralSalesAnalyticsById as resetGeneralSalesAnalyticsByIdAction,
} from '@/features/analytics/analytics.slice';

export const useAnalytics = () => {
  const dispatch = useDispatch();
  const {
    salesAnalytics,
    topCustomersOfSalesAnalytics,
    customerWiseBusinessPerformance,
    topItemsOfSalesAnalytics,
    customersWithSingleInvoiceAnalytics,
    pagination,
    purchaseAnalytics,
    topVendorsByAmountPurchaseAnalytics,
    topVendorsByRevenuePurchaseAnalytics,
    topVendorsByItemsPurchaseAnalytics,
    paymentAnalytics,
    topCustomerByAmountPaymentReceivedAnalytics,
    recentPaymentReceivedAnalytics,
    upcomingPaymentReceivedByInvoiceAnalytics,
    overDueInvoiceAnalytics,
    itemProcessAnalytics,
    topVendorsByAmountPaymentMadeAnalytics,
    recentPaymentMadeAnalytics,
    upcomingPaymentMadeByBillsAnalytics,
    overDueBillsAnalytics,
    itemGroupAnalytics,
    subItemGroupAnalytics,
    salesOrderRmAnalytics,
    itemWiseRmAnalytics,
    salesOrderWiseRmAnalytics,
    generalSalesAnalyticsList,
    generalSalesAnalyticsListLoading,
    generalSalesAnalyticsListError,
    createGeneralSalesAnalyticsLoading,
    createGeneralSalesAnalyticsError,
    generalSalesAnalyticsById,
    generalSalesAnalyticsByIdLoading,
    generalSalesAnalyticsByIdError,
    updateGeneralSalesAnalyticsLoading,
    deleteGeneralSalesAnalyticsLoading,
    loading,
    deleteLoading,
    updateLoading,
    addLoading,
    error,
  } = useSelector(state => state.analytics);

  const getSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getSalesAnalytics(payload));
    },
    [dispatch]
  );

  const getPurchaseAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getPurchaseAnalytics(payload));
    },
    [dispatch]
  );

  const getPaymentAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getPaymentAnalytics(payload));
    },
    [dispatch]
  );

  const getItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.fetchItemGroupAnalytics(payload));
    },
    [dispatch]
  );

  const addItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.addItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const updateItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.updateItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.deleteItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const getRowWiseItemGroupAnalyticsByItemGroup = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getRowWiseItemGroupAnalyticsByItemGroup(payload));
    },
    [dispatch]
  );

  const resetSalesAnalytics = useCallback(() => dispatch(resetSalesAnalyticsAction()), [dispatch]);
  const resetPurchaseAnalytics = useCallback(() => dispatch(resetPurchaseAnalyticsAction()), [dispatch]);
  const resetPaymentAnalytics = useCallback(() => dispatch(resetPaymentAnalyticsAction()), [dispatch]);

  const resetItemGroupAnalytics = useCallback(() => dispatch(resetItemGroupAnalyticsAction()), [dispatch]);
  const resetSubItemGroupAnalytics = useCallback(() => dispatch(resetSubItemGroupAnalyticsAction()), [dispatch]);

  const getSubItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.fetchSubItemGroupAnalytics(payload));
    },
    [dispatch]
  );

  const addSubItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.addSubItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const updateSubItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.updateSubItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteSubItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.deleteSubItemGroupAnalytics(payload)).unwrap();
    },
    [dispatch]
  );

  const getRowWiseSubItemGroupAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getRowWiseSubItemGroupAnalytics(payload));
    },
    [dispatch]
  );

  const getTopCustomersOfSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopCustomersOfSalesAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopCustomersOfSalesAnalytics = useCallback(() => dispatch(resetTopCustomersOfSalesAnalyticsAction()), [dispatch]);

  const getCustomerWiseBusinessPerformance = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getCustomerWiseBusinessPerformance(payload));
    },
    [dispatch]
  );

  const resetCustomerWiseBusinessPerformance = useCallback(() => dispatch(resetCustomerWiseBusinessPerformanceAction()), [dispatch]);

  const getTopItemsOfSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopItemsOfSalesAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopItemsOfSalesAnalytics = useCallback(() => dispatch(resetTopItemsOfSalesAnalyticsAction()), [dispatch]);

  const getCustomersWithSingleInvoiceAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getCustomersWithSingleInvoiceAnalytics(payload));
    },
    [dispatch]
  );

  const resetCustomersWithSingleInvoiceAnalytics = useCallback(() => dispatch(resetCustomersWithSingleInvoiceAnalyticsAction()), [dispatch]);

  const getTopVendorsByAmountPurchaseAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopVendorsByAmountPurchaseAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopVendorsByAmountPurchaseAnalytics = useCallback(() => dispatch(resetTopVendorsByAmountPurchaseAnalyticsAction()), [dispatch]);

  const getTopVendorsByRevenuePurchaseAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopVendorsByRevenuePurchaseAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopVendorsByRevenuePurchaseAnalytics = useCallback(() => dispatch(resetTopVendorsByRevenuePurchaseAnalyticsAction()), [dispatch]);

  const getTopVendorsByItemsPurchaseAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopVendorsByItemsPurchaseAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopVendorsByItemsPurchaseAnalytics = useCallback(() => dispatch(resetTopVendorsByItemsPurchaseAnalyticsAction()), [dispatch]);

  const getTopCustomerByAmountPaymentReceivedAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopCustomerByAmountPaymentReceivedAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopCustomerByAmountPaymentReceivedAnalytics = useCallback(() => dispatch(resetTopCustomerByAmountPaymentReceivedAnalyticsAction()), [dispatch]);

  const getRecentPaymentReceivedAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getRecentPaymentReceivedAnalytics(payload));
    },
    [dispatch]
  );

  const resetRecentPaymentReceivedAnalytics = useCallback(() => dispatch(resetRecentPaymentReceivedAnalyticsAction()), [dispatch]);

  const getUpcomingPaymentReceivedByInvoiceAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getUpcomingPaymentReceivedByInvoiceAnalytics(payload));
    },
    [dispatch]
  );

  const resetUpcomingPaymentReceivedByInvoiceAnalytics = useCallback(() => dispatch(resetUpcomingPaymentReceivedByInvoiceAnalyticsAction()), [dispatch]);

  const getOverDueInvoiceAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getOverDueInvoiceAnalytics(payload));
    },
    [dispatch]
  );

  const resetOverDueInvoiceAnalytics = useCallback(() => dispatch(resetOverDueInvoiceAnalyticsAction()), [dispatch]);

  const getItemProcessAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getItemProcessAnalytics(payload));
    },
    [dispatch]
  );

  const resetItemProcessAnalytics = useCallback(() => dispatch(resetItemProcessAnalyticsAction()), [dispatch]);

  const getTopVendorsByAmountPaymentMadeAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getTopVendorsByAmountPaymentMadeAnalytics(payload));
    },
    [dispatch]
  );

  const resetTopVendorsByAmountPaymentMadeAnalytics = useCallback(() => dispatch(resetTopVendorsByAmountPaymentMadeAnalyticsAction()), [dispatch]);

  const getRecentPaymentMadeAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getRecentPaymentMadeAnalytics(payload));
    },
    [dispatch]
  );

  const resetRecentPaymentMadeAnalytics = useCallback(() => dispatch(resetRecentPaymentMadeAnalyticsAction()), [dispatch]);

  const getUpcomingPaymentMadeByBillsAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getUpcomingPaymentMadeByBillsAnalytics(payload));
    },
    [dispatch]
  );

  const resetUpcomingPaymentMadeByBillsAnalytics = useCallback(() => dispatch(resetUpcomingPaymentMadeByBillsAnalyticsAction()), [dispatch]);

  const getOverDueBillsAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getOverDueBillsAnalytics(payload));
    },
    [dispatch]
  );

  const resetOverDueBillsAnalytics = useCallback(() => dispatch(resetOverDueBillsAnalyticsAction()), [dispatch]);

  const getSalesOrderRmAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getSalesOrderRmAnalytics(payload));
    },
    [dispatch]
  );

  const resetSalesOrderRmAnalytics = useCallback(() => dispatch(resetSalesOrderRmAnalyticsAction()), [dispatch]);

  const getItemWiseRmAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getItemWiseRmAnalytics(payload));
    },
    [dispatch]
  );

  const getSalesOrderWiseRmAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getSalesOrderWiseRmAnalytics(payload));
    },
    [dispatch]
  );

  const getGeneralSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getGeneralSalesAnalytics(payload));
    },
    [dispatch]
  );

  const createGeneralSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.createGeneralSalesAnalytics(payload));
    },
    [dispatch]
  );

  const resetGeneralSalesAnalyticsList = useCallback(() => dispatch(resetGeneralSalesAnalyticsListAction()), [dispatch]);

  const getGeneralSalesAnalyticsById = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.getGeneralSalesAnalyticsById(payload));
    },
    [dispatch]
  );

  const updateGeneralSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.updateGeneralSalesAnalytics(payload));
    },
    [dispatch]
  );

  const deleteGeneralSalesAnalytics = useCallback(
    async payload => {
      return await dispatch(analyticsSliceMethods.deleteGeneralSalesAnalytics(payload));
    },
    [dispatch]
  );

  const resetGeneralSalesAnalyticsById = useCallback(() => dispatch(resetGeneralSalesAnalyticsByIdAction()), [dispatch]);

  return {
    salesAnalytics,
    topCustomersOfSalesAnalytics,
    customerWiseBusinessPerformance,
    topItemsOfSalesAnalytics,
    customersWithSingleInvoiceAnalytics,
    pagination,
    purchaseAnalytics,
    topVendorsByAmountPurchaseAnalytics,
    topVendorsByRevenuePurchaseAnalytics,
    topVendorsByItemsPurchaseAnalytics,
    paymentAnalytics,

    topCustomerByAmountPaymentReceivedAnalytics,
    recentPaymentReceivedAnalytics,
    upcomingPaymentReceivedByInvoiceAnalytics,
    overDueInvoiceAnalytics,

    topVendorsByAmountPaymentMadeAnalytics,
    recentPaymentMadeAnalytics,
    upcomingPaymentMadeByBillsAnalytics,
    overDueBillsAnalytics,

    salesOrderRmAnalytics,
    itemWiseRmAnalytics,
    salesOrderWiseRmAnalytics,
    generalSalesAnalyticsList,
    generalSalesAnalyticsListLoading,
    generalSalesAnalyticsListError,
    createGeneralSalesAnalyticsLoading,
    createGeneralSalesAnalyticsError,
    updateGeneralSalesAnalyticsLoading,
    deleteGeneralSalesAnalyticsLoading,
    generalSalesAnalyticsById,
    generalSalesAnalyticsByIdLoading,
    generalSalesAnalyticsByIdError,
    loading,
    deleteLoading,
    updateLoading,
    addLoading,
    error,
    getSalesAnalytics,
    getPurchaseAnalytics,
    getPaymentAnalytics,
    getItemGroupAnalytics,
    addItemGroupAnalytics,
    updateItemGroupAnalytics,
    deleteItemGroupAnalytics,
    getRowWiseItemGroupAnalyticsByItemGroup,
    getSubItemGroupAnalytics,
    addSubItemGroupAnalytics,
    updateSubItemGroupAnalytics,
    deleteSubItemGroupAnalytics,
    getRowWiseSubItemGroupAnalytics,
    resetSalesAnalytics,
    resetPurchaseAnalytics,
    resetPaymentAnalytics,
    resetItemGroupAnalytics,
    resetSubItemGroupAnalytics,
    getTopCustomersOfSalesAnalytics,
    resetTopCustomersOfSalesAnalytics,
    getCustomerWiseBusinessPerformance,
    resetCustomerWiseBusinessPerformance,
    getTopItemsOfSalesAnalytics,
    resetTopItemsOfSalesAnalytics,
    getCustomersWithSingleInvoiceAnalytics,
    resetCustomersWithSingleInvoiceAnalytics,
    getTopVendorsByAmountPurchaseAnalytics,
    resetTopVendorsByAmountPurchaseAnalytics,
    getTopVendorsByRevenuePurchaseAnalytics,
    resetTopVendorsByRevenuePurchaseAnalytics,
    getTopVendorsByItemsPurchaseAnalytics,
    resetTopVendorsByItemsPurchaseAnalytics,

    getTopCustomerByAmountPaymentReceivedAnalytics,
    resetTopCustomerByAmountPaymentReceivedAnalytics,
    getRecentPaymentReceivedAnalytics,
    resetRecentPaymentReceivedAnalytics,
    getUpcomingPaymentReceivedByInvoiceAnalytics,
    resetUpcomingPaymentReceivedByInvoiceAnalytics,
    getOverDueInvoiceAnalytics,
    resetOverDueInvoiceAnalytics,

    itemProcessAnalytics,
    getItemProcessAnalytics,
    resetItemProcessAnalytics,

    getTopVendorsByAmountPaymentMadeAnalytics,
    resetTopVendorsByAmountPaymentMadeAnalytics,
    getRecentPaymentMadeAnalytics,
    resetRecentPaymentMadeAnalytics,
    getUpcomingPaymentMadeByBillsAnalytics,
    resetUpcomingPaymentMadeByBillsAnalytics,
    getOverDueBillsAnalytics,
    resetOverDueBillsAnalytics,
    itemGroupAnalytics,
    subItemGroupAnalytics,
    getSalesOrderRmAnalytics,
    resetSalesOrderRmAnalytics,
    getItemWiseRmAnalytics,
    getSalesOrderWiseRmAnalytics,
    getGeneralSalesAnalytics,
    createGeneralSalesAnalytics,
    getGeneralSalesAnalyticsById,
    updateGeneralSalesAnalytics,
    deleteGeneralSalesAnalytics,
    resetGeneralSalesAnalyticsList,
    resetGeneralSalesAnalyticsById,
  };
};
