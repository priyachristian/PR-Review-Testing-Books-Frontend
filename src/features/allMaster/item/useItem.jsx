import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  itemMasterSliceMethods,
  resetItem as resetItemAction,
  resetItemBriefDetail as resetItemBriefDetailAction,
  resetItemTransactions as resetItemTransactionsAction,
  clearItemReport as clearItemReportAction,
  resetItems as resetItemsAction,
  resetInventoryTransferRequest as resetInventoryTransferRequestAction,
  resetInventoryTransferDetail as resetInventoryTransferDetailAction,
} from './item.slice';

export const useItemMaster = () => {
  const dispatch = useDispatch();

  const {
    items,
    item,
    itemBriefDetail,
    viewItemLoading,
    itemTransactions,
    itemTransactionsLoading,
    itemTransactionsPagination,
    itemTransactionStatuses,
    itemTransactionType,
    getStockLoading,
    itemAvailableStock,
    FGLoading,
    fgBomItemDrop,
    pagination,
    pagination1,
    purchasing,
    saleData,
    inventryData,
    productData,
    attchData,
    attchFile,
    create,
    update,
    file,
    salesFile,
    exportLoading,
    attechmentFile,
    IQCDrop,
    inventoryTransferRequest,
    inventoryTransferDetail,
    inventoryTransferDetailLoading,
    warehouseDrop,
    recipeDrop,
    itemDrop,
    itemDropLoading,
    allItemDrop,
    allItemDropLoading,
    itemDropWithBom,
    approveTransferLoading,
    rejectTransferLoading,
    loading,
    submitLoading,
    deleteLoading,
    uploading,
    droploading,
    itemHistory,
    itemsUsedIn,
    itemsUsedInLoading,
    productionDataSubmitLoading,
    error,
  } = useSelector(state => state.itemMaster);

  const getWarehouseDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getWarehouseDrop(payload));
      return response;
    },
    [dispatch]
  );

  const transferItem = useCallback(
    async productionData => {
      const response = await dispatch(itemMasterSliceMethods.transferItem(productionData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getAllItemDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getAllItemDrop(payload));
      return response;
    },
    [dispatch]
  );

  const addItemStock = useCallback(
    async productionData => {
      const response = await dispatch(itemMasterSliceMethods.addItemStock(productionData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getItems = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItems(payload));
      return response;
    },
    [dispatch]
  );

  const getItemsExport = useCallback(
    async payload => {
      return await dispatch(itemMasterSliceMethods.getItemsExport(payload)).unwrap();
    },
    [dispatch]
  );

  const getIQCDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getIQCDrop(payload));
      return response;
    },
    [dispatch]
  );

  const salesFileUpload = useCallback(
    async fileData => {
      const response = await dispatch(itemMasterSliceMethods.salesFileUpload(fileData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getItemDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemDrop(payload));
      return response;
    },
    [dispatch]
  );

  const getRecipeDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getRecipeDrop(payload));
      return response;
    },
    [dispatch]
  );

  const attechmentFileUpload = useCallback(
    async fileData => {
      const response = await dispatch(itemMasterSliceMethods.attechmentFileUpload(fileData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const createItem = useCallback(
    async itemDataa => {
      const response = await dispatch(itemMasterSliceMethods.createItem(itemDataa)).unwrap();
      return response;
    },
    [dispatch]
  );

  const updateItemData = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.updateItemData(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getItemReport = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemReport(payload));
      return response;
    },
    [dispatch]
  );

  const getItemDropWithBom = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemDropWithBom(payload));
      return response;
    },
    [dispatch]
  );

  const fetchInventoryTransferRequest = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.fetchInventoryTransferRequest(payload));
      return response;
    },
    [dispatch]
  );

  const approveInventoryTransferRequest = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.approveInventoryTransferRequest(payload));
      return response;
    },
    [dispatch]
  );

  const rejectInventoryTransferRequest = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.rejectInventoryTransferRequest(payload));
      return response;
    },
    [dispatch]
  );

  const getItemById = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemById(payload));
      return response;
    },
    [dispatch]
  );

  const getViewItem = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getViewItem(payload));
      return response;
    },
    [dispatch]
  );

  const resetItemBriefDetail = useCallback(() => dispatch(resetItemBriefDetailAction()), [dispatch]);

  const getItemTransactions = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemTransactions(payload));
      return response;
    },
    [dispatch]
  );

  const resetItemTransactions = useCallback(() => dispatch(resetItemTransactionsAction()), [dispatch]);

  const resetItem = useCallback(() => dispatch(resetItemAction()), [dispatch]);

  const clearItemReport = useCallback(() => dispatch(clearItemReportAction()), [dispatch]);

  const resetItems = useCallback(() => dispatch(resetItemsAction()), [dispatch]);

  const getFGBOMItemDrop = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getFGBOMItemDrop(payload));
      return response;
    },
    [dispatch]
  );

  const getItemAvailableStock = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemAvailableStock(payload));
      return response;
    },
    [dispatch]
  );

  const getInventoryTransferById = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getInventoryTransferById(payload));
      return response;
    },
    [dispatch]
  );

  const resetInventoryTransferRequest = useCallback(() => dispatch(resetInventoryTransferRequestAction()), [dispatch]);

  const resetInventoryTransferDetail = useCallback(() => dispatch(resetInventoryTransferDetailAction()), [dispatch]);

  const toggleItemStatus = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.toggleItemStatus(payload));
      return response;
    },
    [dispatch]
  );

  const getItemsUsedIn = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.getItemsUsedIn(payload));
      return response;
    },
    [dispatch]
  );

  const addProductionDataToItem = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.addProductionDataToItem(payload));
      return response;
    },
    [dispatch]
  );

  const deleteItem = useCallback(
    async payload => {
      const response = await dispatch(itemMasterSliceMethods.deleteItem(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  return {
    items,
    item,
    itemBriefDetail,
    viewItemLoading,
    itemTransactions,
    itemTransactionsLoading,
    itemTransactionsPagination,
    itemTransactionStatuses,
    itemTransactionType,
    pagination,
    pagination1,
    purchasing,
    saleData,
    inventryData,
    productData,
    attchData,
    attchFile,
    create,
    update,
    inventoryTransferRequest,
    inventoryTransferDetail,
    inventoryTransferDetailLoading,
    file,
    salesFile,
    attechmentFile,
    IQCDrop,
    warehouseDrop,
    recipeDrop,
    itemDrop,
    itemDropLoading,
    allItemDrop,
    allItemDropLoading,
    itemDropWithBom,
    getStockLoading,
    itemAvailableStock,
    FGLoading,
    fgBomItemDrop,
    loading,
    submitLoading,
    deleteLoading,
    uploading,
    droploading,
    itemHistory,
    exportLoading,
    error,
    getWarehouseDrop,
    transferItem,
    getAllItemDrop,
    addItemStock,
    getItems,
    getItemsExport,
    toggleItemStatus,
    getIQCDrop,
    salesFileUpload,
    getItemDrop,
    getRecipeDrop,
    attechmentFileUpload,
    createItem,
    updateItemData,
    getItemReport,
    getItemDropWithBom,
    fetchInventoryTransferRequest,
    approveInventoryTransferRequest,
    rejectInventoryTransferRequest,
    approveTransferLoading,
    rejectTransferLoading,
    getItemById,
    getViewItem,
    getItemTransactions,
    resetItemBriefDetail,
    resetItemTransactions,
    resetItem,
    clearItemReport,
    resetItems,
    getFGBOMItemDrop,
    getItemAvailableStock,
    getInventoryTransferById,
    resetInventoryTransferRequest,
    resetInventoryTransferDetail,
    itemsUsedIn,
    itemsUsedInLoading,
    getItemsUsedIn,
    addProductionDataToItem,
    deleteItem,
    productionDataSubmitLoading,
  };
};
