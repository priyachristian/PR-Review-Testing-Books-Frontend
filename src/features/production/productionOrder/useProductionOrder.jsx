import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productionOrderSliceMethods, resetProductionOrder as resetProductionOrderAction } from '@/features/production/productionOrder/productionOrder.slice';

export const useProductionOrder = () => {
  const dispatch = useDispatch();
  const {
    productionOrder,
    productionOrderOtherDetails,
    productionItem,
    pagination,
    create,
    update,
    loading,
    updateLoading,
    fetchLoading,
    uploading,
    startDate,
    startLoading,
    endDate,
    scrapItemDrop,
    productionOrderById,
    itemProductionData,
    itemProductionDataLoading,
    RMItemDrop,
    manPowerDrop,
    endLoading,
    submitProcessLoading,
    deleteSubmissionLoading,
    editSubmissionLoading,
    materialConsumption,
    scrapRejection,
    panelLoading,
    salesOrderDrop,
    dropLoading,
    error,
  } = useSelector(state => state.productionOrder);

  const getProductionOrder = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.getProductionOrder(payload));
    },
    [dispatch]
  );

  const fetchProductionItem = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.fetchProductionItem(payload));
    },
    [dispatch]
  );

  const fetchItemProductionData = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.fetchItemProductionData(payload));
    },
    [dispatch]
  );

  const createProductionOrder = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.createProductionOrder(payload));
    },
    [dispatch]
  );

  const updateSubmitProductionOrder = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.updateSubmitProductionOrder(payload)).unwrap();
    },
    [dispatch]
  );

  const startProductionProcess = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.startProductionProcess(payload));
    },
    [dispatch]
  );

  const endProductionProcess = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.endProductionProcess(payload));
    },
    [dispatch]
  );

  const submitProcess = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.submitProcess(payload));
    },
    [dispatch]
  );

  const deleteProcessSubmission = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.deleteProcessSubmission(payload));
    },
    [dispatch]
  );

  const editProcessSubmission = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.editProcessSubmission(payload));
    },
    [dispatch]
  );

  const editBomSubmission = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.editBomSubmission(payload));
    },
    [dispatch]
  );

  const deleteBomSubmission = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.deleteBomSubmission(payload));
    },
    [dispatch]
  );

  const getMaterialConsumption = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.getMaterialConsumption(payload));
    },
    [dispatch]
  );

  const getScrapRejection = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.getScrapRejection(payload));
    },
    [dispatch]
  );

  const productionItemDropRM = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.productionItemDropRM(payload));
    },
    [dispatch]
  );

  const productionItemDropScrap = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.productionItemDropScrap(payload));
    },
    [dispatch]
  );

  const productionManPowerDrop = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.productionManpowerDrop(payload));
    },
    [dispatch]
  );

  const getProductionSalesOrderDropdown = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.getProductionSalesOrderDropdown(payload));
    },
    [dispatch]
  );

  const resetProductionOrder = useCallback(() => dispatch(resetProductionOrderAction()), [dispatch]);

  const getProductionOrderById = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.getProductionOrderById(payload));
    },
    [dispatch]
  );

  const updateProductionOrderStatus = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.updateProductionOrderStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const reRaiseTransferRequest = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.reRaiseTransferRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const reorderProcesses = useCallback(
    async payload => {
      return await dispatch(productionOrderSliceMethods.reorderProcesses(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    productionOrder,
    productionOrderOtherDetails,
    productionItem,
    create,
    updateLoading,
    pagination,
    update,
    loading,
    fetchLoading,
    uploading,
    startLoading,
    startDate,
    endDate,
    salesOrderDrop,
    scrapItemDrop,
    productionOrderById,
    itemProductionData,
    itemProductionDataLoading,
    RMItemDrop,
    manPowerDrop,
    endLoading,
    submitProcessLoading,
    deleteSubmissionLoading,
    editSubmissionLoading,
    materialConsumption,
    scrapRejection,
    panelLoading,
    dropLoading,
    error,
    getProductionOrder,
    createProductionOrder,
    fetchProductionItem,
    fetchItemProductionData,
    updateSubmitProductionOrder,
    startProductionProcess,
    endProductionProcess,
    submitProcess,
    deleteProcessSubmission,
    editProcessSubmission,
    editBomSubmission,
    deleteBomSubmission,
    getMaterialConsumption,
    getScrapRejection,
    productionItemDropRM,
    productionItemDropScrap,
    productionManPowerDrop,
    getProductionSalesOrderDropdown,
    resetProductionOrder,
    getProductionOrderById,
    updateProductionOrderStatus,
    reRaiseTransferRequest,
    reorderProcesses,
  };
};
