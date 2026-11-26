import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const buildListQueryParams = ({
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  search = '',
  productionDate = null,
  startDate = null,
  endDate = null,
  productionManageMethod = null,
  status = '',
  division = '',
  branch = '',
  itemGroupId = '',
  subItemGroupId = '',
}) => {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) queryParams.append('search', search);
  if (productionDate) queryParams.append('productionDate', productionDate);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) queryParams.append('status', status);
  if (productionManageMethod) queryParams.append('productionManageMethod', productionManageMethod);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (itemGroupId) queryParams.append('itemGroupId', itemGroupId);
  if (subItemGroupId) queryParams.append('subItemGroupId', subItemGroupId);
  return queryParams;
};

const fetchProductionOrder = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    productionDate = null,
    startDate = null,
    endDate = null,
    productionManageMethod = null,
    status = '',
    signal,
    division = '',
    branch = '',
    itemGroupId = '',
    subItemGroupId = '',
  } = payload ?? {};

  const config = {
    params: buildListQueryParams({
      page,
      limit,
      search,
      productionDate,
      startDate,
      endDate,
      productionManageMethod,
      status,
      division,
      branch,
      itemGroupId,
      subItemGroupId,
    }),
    ...withAbortSignal(signal),
  };

  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.BASE, config);
  return response.data;
}, 'fetchProductionOrder');

const fetchProductionOrderById = withErrorHandling(async payload => {
  const { productionOrderId, productionManageMethod, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const route = API_ROUTES.PRODUCTION_ORDER.FETCH_PRODUCT_ORDER_BY_METHOD[productionManageMethod] || API_ROUTES.PRODUCTION_ORDER.FETCH_PRODUCT_ORDER_BY_ID;
  const response = await axiosConfig.get(route(productionOrderId), config);
  return response.data;
}, 'fetchProductionOrderById');

const fetchProductionItem = withErrorHandling(async ({ itemId }) => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.FETCH_ITEM, {
    params: { itemId },
  });
  return response.data;
}, 'fetchProductionItem');

const fetchItemProductionData = withErrorHandling(async ({ itemId, warehouseId, processId }) => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.PRODUCTION_DATA, {
    params: { itemId, warehouseId, ...(processId ? { processId } : {}) },
  });
  return response.data;
}, 'fetchItemProductionData');

const createProductionOrder = withErrorHandling(async productionModule => {
  const response = await axiosConfig.post(API_ROUTES.PRODUCTION_ORDER.CREATE, productionModule);
  return response.data;
}, 'createProductionOrder');

const submitProductionOrder = withErrorHandling(async payload => {
  const { productionId, productionModule } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.SUBMIT_ORDER(productionId), productionModule);
  return response.data;
}, 'submitProductionOrder');

const startProductionProcess = withErrorHandling(async payload => {
  const { productionOrderId, processId } = payload;

  const response = await axiosConfig.patch(
    API_ROUTES.PRODUCTION_ORDER.START_PRODUCTION_PROCESS,
    {},
    {
      params: {
        productionOrderId,
        processId,
      },
    }
  );

  return response.data;
}, 'startProductionProcess');

const endProductionProcess = withErrorHandling(async payload => {
  const { productionOrderId, processId, endData } = payload;

  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.END_PRODUCTION, endData, {
    params: {
      productionOrderId,
      processId,
    },
  });

  return response.data;
}, 'endProductionProcess');

const submitProcess = withErrorHandling(async payload => {
  const { productionOrderId, processId, submitData } = payload;

  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.PROCESS_SUBMISSION, submitData, {
    params: {
      productionOrderId,
      processId,
    },
  });

  return response.data;
}, 'submitProcess');

const deleteProcessSubmission = withErrorHandling(async payload => {
  const { productionOrderId, processId, submissionId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.PRODUCTION_ORDER.PROCESS_SUBMISSION, {
    params: {
      productionOrderId,
      processId,
      submissionId,
    },
  });

  return response.data;
}, 'deleteProcessSubmission');

const editProcessSubmission = withErrorHandling(async payload => {
  const { productionOrderId, processId, submissionId, submitData } = payload;
  const response = await axiosConfig.put(API_ROUTES.PRODUCTION_ORDER.PROCESS_SUBMISSION, submitData, {
    params: {
      productionOrderId,
      processId,
      submissionId,
    },
  });
  return response.data;
}, 'editProcessSubmission');

// A BOM submission is replaced or removed in place; the backend reverses its stock and rebuilds the journal.
const editBomSubmission = withErrorHandling(async payload => {
  const { productionOrderId, submissionId, submitData } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.SUBMISSION(productionOrderId, submissionId), submitData);
  return response.data;
}, 'editBomSubmission');

const deleteBomSubmission = withErrorHandling(async payload => {
  const { productionOrderId, submissionId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PRODUCTION_ORDER.SUBMISSION(productionOrderId, submissionId));
  return response.data;
}, 'deleteBomSubmission');

const fetchMaterialConsumption = withErrorHandling(async payload => {
  const { productionOrderId, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.MATERIAL_CONSUMPTION(productionOrderId), withAbortSignal(signal));
  return response.data;
}, 'fetchMaterialConsumption');

const fetchScrapRejection = withErrorHandling(async payload => {
  const { productionOrderId, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.SCRAP_REJECTION(productionOrderId), withAbortSignal(signal));
  return response.data;
}, 'fetchScrapRejection');

const productionItemDrop = withErrorHandling(async payload => {
  const { signal, itemType, isService = true, trackInventory, warehouseId, includeZeroInventory, includeInactive } = payload ?? {};
  const queryParams = new URLSearchParams();
  if (itemType) queryParams.append('itemType', itemType);
  queryParams.append('isService', isService);
  // Production moves stock, so only tracked items qualify.
  if (trackInventory !== undefined) {
    queryParams.append('trackInventory', trackInventory);
  }
  if (warehouseId) {
    queryParams.append('warehouseId', warehouseId);
  }
  if (includeZeroInventory !== undefined) {
    queryParams.append('includeZeroInventory', includeZeroInventory);
  }
  if (includeInactive) {
    queryParams.append('includeInactive', true);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_DROP, config);
  return response.data;
}, 'productionItemDrop');

const productionManPowerDrop = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.MANPOWER, config);
  return response.data;
}, 'productionManPowerDrop');

const getProductionSalesOrderDropdown = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_ORDER.GET_PRODUCTION_SALES_ORDER_DROPDOWN, config);
  return response.data;
}, 'getProductionSalesOrderDropdown');

const updateProductionOrderStatus = withErrorHandling(async payload => {
  const { productionOrderId, status, isManuallyCompleted } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.UPDATE_STATUS(productionOrderId), { status, isManuallyCompleted });
  return response.data;
}, 'updateProductionOrderStatus');

const reRaiseTransferRequest = withErrorHandling(async payload => {
  const { productionOrderId } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.RE_RAISE_TRANSFER(productionOrderId));
  return response.data;
}, 'reRaiseTransferRequest');

const reorderProcesses = withErrorHandling(async payload => {
  const { productionOrderId, processes, isLocked } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_ORDER.REORDER_PROCESSES(productionOrderId), { processes, isLocked });
  return response.data;
}, 'reorderProcesses');

export const productionOrderService = {
  fetchProductionOrder,
  createProductionOrder,
  fetchProductionItem,
  fetchItemProductionData,
  submitProductionOrder,
  startProductionProcess,
  endProductionProcess,
  submitProcess,
  deleteProcessSubmission,
  editProcessSubmission,
  editBomSubmission,
  deleteBomSubmission,
  fetchMaterialConsumption,
  fetchScrapRejection,
  productionItemDrop,
  productionManPowerDrop,
  getProductionSalesOrderDropdown,
  fetchProductionOrderById,
  updateProductionOrderStatus,
  reRaiseTransferRequest,
  reorderProcesses,
};
