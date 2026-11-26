import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  reportSliceMethods,
  clearSalesLedger as clearSalesLedgerAction,
  clearSalesLedgerDetail as clearSalesLedgerDetailAction,
  clearPurchaseLedger as clearPurchaseLedgerAction,
  clearPurchaseLedgerDetail as clearPurchaseLedgerDetailAction,
  clearCreditorsReport as clearCreditorsReportAction,
  clearDebtorsReport as clearDebtorsReportAction,
  clearProfitAndLose as clearProfitAndLoseAction,
  clearCustomerProfitAndLose as clearCustomerProfitAndLoseAction,
  clearProfitAndLoseItemWiseDetails as clearProfitAndLoseItemWiseDetailsAction,
  clearProfitAndLoseItemWise as clearProfitAndLoseItemWiseAction,
  clearProfitAndLoseCustomerMonthWise as clearProfitAndLoseCustomerMonthWiseAction,
  clearProfitAndLossBatchItemDetails as clearProfitAndLossBatchItemDetailsAction,
  clearProfitAndLossBatchCustomerDetails as clearProfitAndLossBatchCustomerDetailsAction,
  clearItemAnalytics as clearItemAnalyticsAction,
  clearAgingReport as clearAgingReportAction,
  clearCustomerAgingReport as clearCustomerAgingReportAction,
  clearVendorAgingReport as clearVendorAgingReportAction,
  clearCustomerAgingDetails as clearCustomerAgingDetailsAction,
  clearVendorAgingDetails as clearVendorAgingDetailsAction,
  clearBucketData as clearBucketDataAction,
  clearUpcomingPayments as clearUpcomingPaymentsAction,
  clearBalanceSheet as clearBalanceSheetAction,
  clearProfitLossSheet as clearProfitLossSheetAction,
  clearDynamicReportsList as clearDynamicReportsListAction,
  clearDynamicReportById as clearDynamicReportByIdAction,
} from '@/features/reports/report.slice';

export const useReport = () => {
  const dispatch = useDispatch();

  const {
    reports,
    bankLedger,
    salesLedger,
    salesLedgerDetail,
    salesLedgerDetailPagination,
    purchaseLedger,
    purchaseLedgerDetail,
    purchaseLedgerDetailPagination,
    creditorsReport,
    debtorsReport,
    profitAndLose,
    customerProfitAndLose,
    profitAndLoseItemWise,
    profitAndLoseItemWiseDetails,
    profitAndLoseCustomerMonthWise,
    profitAndLossBatchItemDetails,
    profitAndLossBatchCustomerDetails,
    profitAndLossByProductionOrder,
    profitAndLossByProductionOrderDetails,
    itemAnalytics,
    agingReport,
    customerAgingReport,
    vendorAgingReport,
    customerAgingDetails,
    vendorAgingDetails,
    bucketData,
    bucketLoading,
    bucketError,
    upcomingPayments,
    upcomingPaymentsLoading,
    upcomingPaymentsError,
    balanceSheet,
    balanceSheetLoading,
    balanceSheetError,
    profitLossSheet,
    profitLossSheetLoading,
    profitLossSheetError,
    dynamicReportsList,
    dynamicReportsListLoading,
    dynamicReportsListError,
    createDynamicReportLoading,
    createDynamicReportError,
    dynamicReportById,
    dynamicReportByIdLoading,
    dynamicReportByIdError,
    updateDynamicReportLoading,
    deleteDynamicReportLoading,
    loading,
    modelLoading,
    detailLoading,
    pagination,
    exportLoading,
    error,
  } = useSelector(state => state.report);

  const getReports = useCallback(async payload => await dispatch(reportSliceMethods.getReports(payload)), [dispatch]);

  const getBankLedger = useCallback(async payload => await dispatch(reportSliceMethods.getBankLedger(payload)), [dispatch]);

  const getSalesLedger = useCallback(async payload => await dispatch(reportSliceMethods.getSalesLedger(payload)), [dispatch]);

  const clearSalesLedger = useCallback(() => dispatch(clearSalesLedgerAction()), [dispatch]);

  const getSalesLedgerDetail = useCallback(async payload => await dispatch(reportSliceMethods.getSalesLedgerDetail(payload)), [dispatch]);

  const getSalesLedgerDetailExport = useCallback(async payload => await dispatch(reportSliceMethods.getSalesLedgerDetailExport(payload)).unwrap(), [dispatch]);

  const clearSalesLedgerDetail = useCallback(() => dispatch(clearSalesLedgerDetailAction()), [dispatch]);

  const getPurchaseLedger = useCallback(async payload => await dispatch(reportSliceMethods.getPurchaseLedger(payload)), [dispatch]);

  const clearPurchaseLedger = useCallback(() => dispatch(clearPurchaseLedgerAction()), [dispatch]);

  const getPurchaseLedgerDetail = useCallback(async payload => await dispatch(reportSliceMethods.getPurchaseLedgerDetail(payload)), [dispatch]);

  const getPurchaseLedgerDetailExport = useCallback(async payload => await dispatch(reportSliceMethods.getPurchaseLedgerDetailExport(payload)).unwrap(), [dispatch]);

  const clearPurchaseLedgerDetail = useCallback(() => dispatch(clearPurchaseLedgerDetailAction()), [dispatch]);

  const getCreditorsReport = useCallback(async payload => await dispatch(reportSliceMethods.getCreditorsReport(payload)), [dispatch]);

  const clearCreditorsReport = useCallback(() => dispatch(clearCreditorsReportAction()), [dispatch]);

  const getDebtorsReport = useCallback(async payload => await dispatch(reportSliceMethods.getDebtorsReport(payload)), [dispatch]);

  const clearDebtorsReport = useCallback(() => dispatch(clearDebtorsReportAction()), [dispatch]);

  const getProfitAndLose = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLose(payload)), [dispatch]);

  const clearProfitAndLose = useCallback(() => dispatch(clearProfitAndLoseAction()), [dispatch]);

  const getCustomerProfitAndLose = useCallback(async payload => await dispatch(reportSliceMethods.getCustomerProfitAndLose(payload)), [dispatch]);

  const clearCustomerProfitAndLose = useCallback(() => dispatch(clearCustomerProfitAndLoseAction()), [dispatch]);

  const getProfitAndLoseItemWise = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLoseItemWise(payload)), [dispatch]);

  const clearProfitAndLoseItemWise = useCallback(() => dispatch(clearProfitAndLoseItemWiseAction()), [dispatch]);

  const getProfitAndLoseItemWiseDetails = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLoseItemWiseDetails(payload)), [dispatch]);

  const clearProfitAndLoseItemWiseDetails = useCallback(() => dispatch(clearProfitAndLoseItemWiseDetailsAction()), [dispatch]);

  const getProfitAndLoseCustomerMonthWise = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLoseCustomerMonthWise(payload)), [dispatch]);

  const clearProfitAndLoseCustomerMonthWise = useCallback(() => dispatch(clearProfitAndLoseCustomerMonthWiseAction()), [dispatch]);

  const getProfitAndLossBatchItemDetails = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLossBatchItemDetails(payload)), [dispatch]);

  const clearProfitAndLossBatchItemDetails = useCallback(() => dispatch(clearProfitAndLossBatchItemDetailsAction()), [dispatch]);

  const getProfitAndLossBatchCustomerDetails = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLossBatchCustomerDetails(payload)), [dispatch]);

  const clearProfitAndLossBatchCustomerDetails = useCallback(() => dispatch(clearProfitAndLossBatchCustomerDetailsAction()), [dispatch]);

  const getProfitAndLossByProductionOrder = useCallback(async payload => await dispatch(reportSliceMethods.getProfitAndLossByProductionOrder(payload)), [dispatch]);

  const getProfitAndLossByProductionOrderDetails = useCallback(
    async productionOrderData => await dispatch(reportSliceMethods.getProfitAndLossByProductionOrderDetails(productionOrderData)),
    [dispatch]
  );

  const getItemAnalytics = useCallback(async payload => await dispatch(reportSliceMethods.getItemAnalytics(payload)), [dispatch]);

  const clearItemAnalytics = useCallback(() => dispatch(clearItemAnalyticsAction()), [dispatch]);

  const getBalanceSheet = useCallback(async payload => await dispatch(reportSliceMethods.getBalanceSheet(payload)), [dispatch]);

  const clearBalanceSheet = useCallback(() => dispatch(clearBalanceSheetAction()), [dispatch]);

  const getAgingReport = useCallback(async payload => await dispatch(reportSliceMethods.getAgingReport(payload)), [dispatch]);

  const clearAgingReport = useCallback(() => dispatch(clearAgingReportAction()), [dispatch]);

  const getCustomerAging = useCallback(async payload => await dispatch(reportSliceMethods.getCustomerAging(payload)), [dispatch]);

  const clearCustomerAgingReport = useCallback(() => dispatch(clearCustomerAgingReportAction()), [dispatch]);

  const getVendorAging = useCallback(async payload => await dispatch(reportSliceMethods.getVendorAging(payload)), [dispatch]);

  const clearVendorAgingReport = useCallback(() => dispatch(clearVendorAgingReportAction()), [dispatch]);

  const getCustomerAgingDetails = useCallback(async payload => await dispatch(reportSliceMethods.getCustomerAgingDetails(payload)), [dispatch]);

  const clearCustomerAgingDetails = useCallback(() => dispatch(clearCustomerAgingDetailsAction()), [dispatch]);

  const getVendorAgingDetails = useCallback(async payload => await dispatch(reportSliceMethods.getVendorAgingDetails(payload)), [dispatch]);

  const clearVendorAgingDetails = useCallback(() => dispatch(clearVendorAgingDetailsAction()), [dispatch]);

  const getCustomerAgingBucket = useCallback(async payload => await dispatch(reportSliceMethods.getCustomerAgingBucket(payload)), [dispatch]);

  const getVendorAgingBucket = useCallback(async payload => await dispatch(reportSliceMethods.getVendorAgingBucket(payload)), [dispatch]);

  const clearBucketData = useCallback(() => dispatch(clearBucketDataAction()), [dispatch]);

  const getUpcomingPayments = useCallback(async payload => await dispatch(reportSliceMethods.getUpcomingPayments(payload)), [dispatch]);

  const clearUpcomingPayments = useCallback(() => dispatch(clearUpcomingPaymentsAction()), [dispatch]);

  const getProfitLossSheet = useCallback(async payload => await dispatch(reportSliceMethods.getProfitLossSheet(payload)), [dispatch]);

  const clearProfitLossSheet = useCallback(() => dispatch(clearProfitLossSheetAction()), [dispatch]);

  const getDynamicReports = useCallback(async payload => await dispatch(reportSliceMethods.getDynamicReports(payload)), [dispatch]);

  const createDynamicReport = useCallback(async payload => await dispatch(reportSliceMethods.createDynamicReport(payload)), [dispatch]);

  const clearDynamicReportsList = useCallback(() => dispatch(clearDynamicReportsListAction()), [dispatch]);

  const getDynamicReportById = useCallback(async payload => await dispatch(reportSliceMethods.getDynamicReportById(payload)), [dispatch]);

  const updateDynamicReport = useCallback(async payload => await dispatch(reportSliceMethods.updateDynamicReport(payload)), [dispatch]);

  const deleteDynamicReport = useCallback(async id => await dispatch(reportSliceMethods.deleteDynamicReport(id)), [dispatch]);

  const clearDynamicReportById = useCallback(() => dispatch(clearDynamicReportByIdAction()), [dispatch]);

  return {
    reports,
    bankLedger,
    salesLedger,
    salesLedgerDetail,
    salesLedgerDetailPagination,
    purchaseLedger,
    purchaseLedgerDetail,
    purchaseLedgerDetailPagination,
    creditorsReport,
    debtorsReport,
    profitAndLose,
    customerProfitAndLose,
    profitAndLoseItemWise,
    profitAndLoseItemWiseDetails,
    profitAndLoseCustomerMonthWise,
    profitAndLossBatchItemDetails,
    profitAndLossBatchCustomerDetails,
    profitAndLossByProductionOrder,
    profitAndLossByProductionOrderDetails,
    itemAnalytics,
    agingReport,
    customerAgingReport,
    vendorAgingReport,
    customerAgingDetails,
    vendorAgingDetails,
    bucketData,
    bucketLoading,
    bucketError,
    upcomingPayments,
    upcomingPaymentsLoading,
    upcomingPaymentsError,
    modelLoading,
    detailLoading,
    pagination,
    loading,
    error,
    getReports,
    getBankLedger,
    getSalesLedger,
    clearSalesLedger,
    getSalesLedgerDetail,
    getSalesLedgerDetailExport,
    exportLoading,
    clearSalesLedgerDetail,
    getPurchaseLedger,
    clearPurchaseLedger,
    getPurchaseLedgerDetail,
    getPurchaseLedgerDetailExport,
    clearPurchaseLedgerDetail,
    getCreditorsReport,
    clearCreditorsReport,
    getDebtorsReport,
    clearDebtorsReport,
    getProfitAndLose,
    clearProfitAndLose,
    getCustomerProfitAndLose,
    clearCustomerProfitAndLose,
    getProfitAndLoseItemWise,
    clearProfitAndLoseItemWise,
    getProfitAndLoseItemWiseDetails,
    clearProfitAndLoseItemWiseDetails,
    getProfitAndLoseCustomerMonthWise,
    clearProfitAndLoseCustomerMonthWise,
    getProfitAndLossBatchItemDetails,
    clearProfitAndLossBatchItemDetails,
    getProfitAndLossBatchCustomerDetails,
    clearProfitAndLossBatchCustomerDetails,
    getProfitAndLossByProductionOrder,
    getProfitAndLossByProductionOrderDetails,
    getItemAnalytics,
    clearItemAnalytics,
    getAgingReport,
    clearAgingReport,
    getCustomerAging,
    clearCustomerAgingReport,
    getVendorAging,
    clearVendorAgingReport,
    getCustomerAgingDetails,
    clearCustomerAgingDetails,
    getVendorAgingDetails,
    clearVendorAgingDetails,
    getCustomerAgingBucket,
    getVendorAgingBucket,
    clearBucketData,
    getUpcomingPayments,
    clearUpcomingPayments,
    balanceSheet,
    balanceSheetLoading,
    balanceSheetError,
    getBalanceSheet,
    clearBalanceSheet,
    profitLossSheet,
    profitLossSheetLoading,
    profitLossSheetError,
    getProfitLossSheet,
    clearProfitLossSheet,
    dynamicReportsList,
    dynamicReportsListLoading,
    dynamicReportsListError,
    getDynamicReports,
    createDynamicReport,
    createDynamicReportLoading,
    createDynamicReportError,
    clearDynamicReportsList,
    dynamicReportById,
    dynamicReportByIdLoading,
    dynamicReportByIdError,
    getDynamicReportById,
    updateDynamicReport,
    updateDynamicReportLoading,
    deleteDynamicReport,
    deleteDynamicReportLoading,
    clearDynamicReportById,
  };
};
