import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  saleOrderSliceMethods,
  resetSalesOrder as resetSalesOrderAction,
  resetSalesOrderDropConvert as resetSalesOrderDropConvertAction,
  resetPendingItems as resetPendingItemsAction,
  resetSalesOrders as resetSalesOrdersAction,
  resetSalesOrderWiseAnalysis as resetSalesOrderWiseAnalysisAction,
  resetCustomerWisePendingOrderAnalysis as resetCustomerWisePendingOrderAnalysisAction,
  resetCustomerWiseSalesOrderAnalysis as resetCustomerWiseSalesOrderAnalysisAction,
} from './salesOrder.slice';

export const useSalesOrder = () => {
  const dispatch = useDispatch();

  const {
    salesOrders,
    salesOrder,
    pendingItems,
    salesOrderDrop,
    salesOrderDropForConvert,
    salesOrderFile,
    salesOrderWiseAnalysis,
    salesOrderWiseAnalysisPagination,
    customerWiseSalesOrderAnalysis,
    customerWiseSalesOrderAnalysisPagination,
    itemWiseSalesOrderAnalysis,
    itemWiseSalesOrderAnalysisPagination,
    newVsOldCustomerReport,
    newVsOldCustomerReportModuleData,
    moduleDataLoading,
    newCustomerPagination,
    oldCustomerPagination,
    pagination,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    convertToProductionLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    pendingItemLoading,
    exportLoading,
    error,
  } = useSelector(state => state.salesOrder);

  const getSalesOrder = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesOrder(payload));
    },
    [dispatch]
  );

  const getSalesCustomerDrop = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesCustomerDrop(payload));
    },
    [dispatch]
  );

  const getSalesOrderDropdown = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesOrderDropdown(payload));
    },
    [dispatch]
  );

  const getSalesItems = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesItems(payload));
    },
    [dispatch]
  );

  const salesOrderFileUpload = useCallback(
    async fileData => {
      try {
        const response = await dispatch(saleOrderSliceMethods.salesOrderFileUpload(fileData)).unwrap();

        return response;
      } catch (error) {
        console.error('Error in salesOrderFileUpload:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const createSalesOrder = useCallback(
    async saleOrderData => {
      return await dispatch(saleOrderSliceMethods.createSalesOrder(saleOrderData));
    },
    [dispatch]
  );

  const updateSalesOrder = useCallback(
    async ({ salesId, saleOrderData }) => {
      try {
        const response = await dispatch(saleOrderSliceMethods.updateSalesOrder({ salesId, saleOrderData }));

        return response;
      } catch (error) {
        console.error('Error in updateSalesOrder:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const revertClose = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.revertClose(payload)).unwrap();
    },
    [dispatch]
  );

  const getSalesOrderById = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesOrderById(payload));
    },
    [dispatch]
  );

  const resetSalesOrder = useCallback(() => dispatch(resetSalesOrderAction()), [dispatch]);
  const resetSalesOrders = useCallback(() => dispatch(resetSalesOrdersAction()), [dispatch]);
  const resetSalesOrderWiseAnalysis = useCallback(() => dispatch(resetSalesOrderWiseAnalysisAction()), [dispatch]);
  const resetCustomerWisePendingOrderAnalysis = useCallback(() => dispatch(resetCustomerWisePendingOrderAnalysisAction()), [dispatch]);
  const resetCustomerWiseSalesOrderAnalysis = useCallback(() => dispatch(resetCustomerWiseSalesOrderAnalysisAction()), [dispatch]);
  const getSalesOrderDropdownForConvert = useCallback(
    async payload => {
      try {
        const response = await dispatch(saleOrderSliceMethods.getSalesOrderDropdownForConvert(payload));

        return response;
      } catch (error) {
        console.error('Error in getSalesOrderDropdownForConvert:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const getPendingItemsSalesOrder = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getPendingItemsSalesOrder(payload));
    },
    [dispatch]
  );

  const resetSalesOrderDropConvert = useCallback(() => dispatch(resetSalesOrderDropConvertAction()), [dispatch]);

  const resetPendingItems = useCallback(() => dispatch(resetPendingItemsAction()), [dispatch]);

  const removeSalesOrder = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.removeSalesOrder(payload)).unwrap();
    },
    [dispatch]
  );

  const getSalesOrderWiseAnalysis = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getSalesOrderWiseAnalysis(payload));
    },
    [dispatch]
  );

  const getCustomerWiseSalesOrderAnalysis = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getCustomerWiseSalesOrderAnalysis(payload));
    },
    [dispatch]
  );

  const getItemWiseSalesOrderAnalysis = useCallback(
    async payload => {
      try {
        const response = await dispatch(saleOrderSliceMethods.getItemWiseSalesOrderAnalysis(payload));

        return response;
      } catch (error) {
        console.error('Error in getItemWiseSalesOrderAnalysis:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const getNewVsOldCustomerReport = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.getNewVsOldCustomerReport(payload));
    },
    [dispatch]
  );

  const getNewVsOldCustomerReportModuleData = useCallback(
    async payload => {
      try {
        const response = await dispatch(saleOrderSliceMethods.getNewVsOldCustomerReportModuleData(payload));
        return response;
      } catch (error) {
        console.error('Error in getNewVsOldCustomerReportModuleData:', error);
        throw error;
      }
    },
    [dispatch]
  );

  const convertToProductionOrder = useCallback(
    async payload => {
      return await dispatch(saleOrderSliceMethods.convertToProductionOrder(payload)).unwrap();
    },
    [dispatch]
  );

  const getSalesOrderExports = useCallback(async payload => await dispatch(saleOrderSliceMethods.getSalesOrderExports(payload)).unwrap(), [dispatch]);

  return {
    salesOrders,
    salesOrder,
    pendingItems,
    salesOrderDrop,
    salesOrderDropForConvert,
    salesOrderFile,
    salesOrderWiseAnalysis,
    salesOrderWiseAnalysisPagination,
    customerWiseSalesOrderAnalysis,
    customerWiseSalesOrderAnalysisPagination,
    itemWiseSalesOrderAnalysis,
    itemWiseSalesOrderAnalysisPagination,
    newVsOldCustomerReport,
    newCustomerPagination,
    oldCustomerPagination,
    pagination,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    convertToProductionLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    pendingItemLoading,
    exportLoading,
    error,
    getSalesOrder,
    getSalesOrderExports,
    getSalesCustomerDrop,
    getSalesOrderDropdown,
    createSalesOrder,
    updateSalesOrder,
    salesOrderFileUpload,
    updateStatus,
    revertClose,
    getSalesItems,
    getSalesOrderById,
    resetSalesOrder,
    getSalesOrderDropdownForConvert,
    getPendingItemsSalesOrder,
    resetSalesOrderDropConvert,
    resetPendingItems,
    removeSalesOrder,
    resetSalesOrders,
    resetSalesOrderWiseAnalysis,
    resetCustomerWisePendingOrderAnalysis,
    resetCustomerWiseSalesOrderAnalysis,
    getSalesOrderWiseAnalysis,
    getCustomerWiseSalesOrderAnalysis,
    getItemWiseSalesOrderAnalysis,
    getNewVsOldCustomerReport,
    getNewVsOldCustomerReportModuleData,
    convertToProductionOrder,
    newVsOldCustomerReportModuleData,
    moduleDataLoading,
  };
};
