import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getInvoice = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    invoiceDate = null,
    startDate = null,
    endDate = null,
    status = '',
    isSplit = false,
    sortBy = '',
    signal,
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    eInvoicePending = false,
    eWayBillPending = false,
    includeComplianceCount = false,
    country = '',
    state = '',
    city = '',
    addressType = '',
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (search) {
    queryParams.append('search', search);
  }

  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }

  if (invoiceDate) {
    queryParams.append('invoiceDate', invoiceDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (addedBy) {
    queryParams.append('addedBy', addedBy);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (eInvoicePending) {
    queryParams.append('eInvoicePending', true);
  }
  if (eWayBillPending) {
    queryParams.append('eWayBillPending', true);
  }
  if (includeComplianceCount) {
    queryParams.append('includeComplianceCount', true);
  }
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (addressType) queryParams.append('addressType', addressType);
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.BASE, config);

  return response.data;
}, 'getInvoice');

const getPendingInvoice = withErrorHandling(async payload => {
  const { customerId, warehouseId, pagination = false, signal, isAdd = true, isSplit = false } = payload;
  const queryParams = new URLSearchParams({
    pagination: pagination,
    isAdd: isAdd,
  });

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (warehouseId) {
    queryParams.append('warehouseId', warehouseId);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GET_PENDING_INVOICE(customerId), config);

  return response.data;
}, 'getPendingInvoice');

const getInvoiceDropdown = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', signal } = payload || {};
  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.DROPDOWN, config);
  return response.data;
}, 'getInvoiceDropdown');

const createInvoices = async invoiceData => {
  try {
    const { formData } = buildMultipartPayload(invoiceData, 'attachments', 'attachment');
    const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Invoices :', error);
    throw error;
  }
};

const updateInvoices = async ({ invoiceId, invoiceData }) => {
  try {
    const { formData } = buildMultipartPayload(invoiceData, 'attachments', 'attachment');
    const response = await axiosConfig.patch(API_ROUTES.SALES.INVOICE.UPDATE(invoiceId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error update invoice :', error);
    throw error;
  }
};

const invoiceFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'invoiceFileUpload');

const updateStatus = withErrorHandling(async payload => {
  const { invoiceId, status } = payload;
  const response = await axiosConfig.patch(
    API_ROUTES.SALES.INVOICE.UPDATE_SATUS(invoiceId),
    {
      status,
    },
    {}
  );
  return response.data;
}, 'updateStatus');

const getInvoiceTransport = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GET_INVOICE_TRANSPORT, {});
  return response.data;
}, 'getInvoiceTransport');

const createInvoiceTransport = withErrorHandling(async transportData => {
  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CREATE_INVOICE_TRANSPORT, transportData, {});
  return response.data;
}, 'createInvoiceTransport');

const updateInvoiceTransport = withErrorHandling(async ({ transportId, transportData }) => {
  const response = await axiosConfig.patch(API_ROUTES.SALES.INVOICE.UPDATE_INVOICE_TRANSPORT(transportId), transportData, {});
  return response.data;
}, 'updateInvoiceTransport');

const getInvoiceDispatch = withErrorHandling(async dispatchId => {
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GET_INVOICE_DISPATCH(dispatchId));
  return response.data;
}, 'getInvoiceDispatch');

const createInvoiceDispatch = withErrorHandling(async ({ dispatchData }) => {
  let formData = null;
  switch (dispatchData.dispatchMode) {
    case 'Transport & Courier Service':
      formData = buildMultipartPayload(dispatchData, 'transportCourier.bookingCopyImage', 'bookingCopyImage');

      if (!formData.hasFiles) {
        formData.formData = new FormData();
        delete formData.jsonPayload.transportCourier.bookingCopyImage;
        formData.formData.append('JSONString', JSON.stringify(formData.jsonPayload));
      }

      break;
    case 'Full Truck Load':
      formData = buildMultipartPayload(dispatchData, 'truckLoad.truck_goodsImage', 'truck_goodsImage');
      if (!formData.hasFiles) {
        formData.formData = new FormData();
        delete formData.jsonPayload.truckLoad.truck_goodsImage;
        formData.formData.append('JSONString', JSON.stringify(formData.jsonPayload));
      }
      break;
    case 'OurSelf Delivery':
    case 'Pickup By Customer':
      formData = buildMultipartPayload(dispatchData, 'selfDelivery.vehicle_goodsImage', 'vehicle_goodsImage');
      if (!formData.hasFiles) {
        formData.formData = new FormData();
        delete formData.jsonPayload.selfDelivery.vehicle_goodsImage;
        formData.formData.append('JSONString', JSON.stringify(formData.jsonPayload));
      }
      break;
  }

  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CREATE_INVOICE_DISPATCH, formData.formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createInvoiceDispatch');

const updateInvoiceDispatch = withErrorHandling(async ({ dispatchId, dispatchData }) => {
  let formData = null;
  switch (dispatchData.dispatchMode) {
    case 'Transport & Courier Service':
      formData = buildMultipartPayload(dispatchData, 'transportCourier.bookingCopyImage', 'bookingCopyImage');
      break;
    case 'Full Truck Load':
      formData = buildMultipartPayload(dispatchData, 'truckLoad.truck_goodsImage', 'truck_goodsImage');
      break;
    case 'OurSelf Delivery':
    case 'Pickup By Customer':
      formData = buildMultipartPayload(dispatchData, 'selfDelivery.vehicle_goodsImage', 'vehicle_goodsImage');
      break;
  }

  const response = await axiosConfig.patch(API_ROUTES.SALES.INVOICE.UPDATE_INVOICE_DISPATCH(dispatchId), formData.formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updateInvoiceDispatch');

const bookingCopyFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'bookingCopyFileUpload');

const truckGoodsFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'truckGoodsFileUpload');

const vehicleGoodsFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'vehicleGoodsFileUpload');

const getInvoiceById = withErrorHandling(async payload => {
  const { invoiceId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GET_INVOICE_BY_ID(invoiceId), {
    ...config,
  });
  return response.data;
}, 'getInvoiceById');

const removeInvoice = withErrorHandling(async payload => {
  const { invoiceId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.INVOICE.REMOVE_INVOICE(invoiceId), {});
  return response.data;
}, 'removeInvoice');

const getInvoiceExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'invoiceDate', extraFields: ['isSplit', 'country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.EXPORT_INVOICE, config);
  return response.data;
}, 'getInvoiceExports');

const removeDispatchInvoice = withErrorHandling(async payload => {
  const { dispatchId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.INVOICE.REMOVE_DISPATCHED_INVOICE(dispatchId));
  return response.data;
}, 'removeDispatchInvoice');

const generateEInvoice = async ({ invoiceId, EwbDtls, EInvDtls, items, updateItemMaster }) => {
  try {
    const payload = {
      invoiceId,
    };

    // Add E-Way Bill details if provided
    if (EwbDtls) {
      payload.EwbDtls = EwbDtls;
    }

    // Options chosen in the generate modal (ship-to, dispatch-from, trade name and similar)
    if (EInvDtls && Object.keys(EInvDtls).length > 0) {
      payload.EInvDtls = EInvDtls;
    }

    // Add HSN fix details if provided
    if (items && Array.isArray(items) && items.length > 0) {
      payload.items = items.map(item => {
        return { itemId: item?.itemId?._id || item?._id || item?.itemId, hsn: item.hsn };
      }); // [{ itemId, hsn }]
      // Whether the corrected HSN should also be written back to the item master
      payload.updateItemMaster = Boolean(updateItemMaster);
    }

    const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.GENERATE_E_INVOICE, payload, {});
    return response.data;
  } catch (error) {
    console.error('Error generating e-invoice :', error);
    throw error;
  }
};

const cancelEInvoice = withErrorHandling(async ({ invoiceId, cancelPayload }) => {
  let payload = {
    invoiceId,
  };

  // Add cancellation details if provided
  if (cancelPayload) {
    payload = { ...payload, ...cancelPayload };
  }

  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CANCEL_E_INVOICE, payload, {});
  return response.data;
}, 'cancelEInvoice');

const generateEWayBill = withErrorHandling(async ({ invoiceId, EwbDtls }) => {
  const payload = {
    invoiceId,
  };

  if (EwbDtls) {
    payload.EwbDtls = EwbDtls;
  }

  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.GENERATE_E_WAY_BILL, payload, {});
  return response.data;
}, 'generateEWayBill');

const generateOnlyEWayBill = async ({ invoiceId, EwbDtls, items, updateItemMaster }) => {
  try {
    const payload = {
      invoiceId,
    };

    // Add E-Way Bill details if provided
    if (EwbDtls) {
      payload.EwbDtls = EwbDtls;
    }

    if (items && Array.isArray(items) && items.length > 0) {
      payload.items = items.map(item => {
        return { itemId: item?.itemId?._id || item?._id || item?.itemId, hsn: item.hsn };
      }); // [{ itemId, hsn }]
      payload.updateItemMaster = Boolean(updateItemMaster);
    }

    const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.GENERATE_E_WAY_BILL_UNIFIED, payload, {});
    return response.data;
  } catch (error) {
    console.error('Error generating only e-way bill :', error);
    throw error;
  }
};

const cancelOnlyEWayBill = withErrorHandling(async ({ invoiceId, cancelPayload }) => {
  let payload = {
    invoiceId,
  };

  // Add cancellation details if provided
  if (cancelPayload) {
    payload = { ...payload, ...cancelPayload };
  }

  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CANCEL_E_WAY_BILL, payload, {});
  return response.data;
}, 'cancelOnlyEWayBill');

const cancelEWayBill = withErrorHandling(async ({ invoiceId, cancelPayload }) => {
  let payload = {
    invoiceId,
  };

  // Add cancellation details if provided
  if (cancelPayload) {
    payload = { ...payload, ...cancelPayload };
  }

  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CANCEL_E_WAY_BILL, payload, {});
  return response.data;
}, 'cancelEWayBill');

const refetchEInvoice = withErrorHandling(async ({ invoiceId }) => {
  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.REFETCH_E_INVOICE, { invoiceId }, {});
  return response.data;
}, 'refetchEInvoice');

// Addresses, charges and defaults the generate e-invoice / e-way bill modal offers for an invoice
const getGstDocumentOptions = withErrorHandling(async ({ invoiceId }) => {
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GST_DOCUMENT_OPTIONS(invoiceId));
  return response.data;
}, 'getGstDocumentOptions');

const getPaymentHistory = withErrorHandling(async payload => {
  const { invoiceId } = payload;

  const queryParams = new URLSearchParams({});

  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.GET_PAYMENT_HISTORY(invoiceId), {
    params: queryParams,
  });
  return response.data;
}, 'getPaymentHistory');

const fetchGstinDetails = withErrorHandling(async ({ gstin }) => {
  const response = await axiosConfig.get(API_ROUTES.SALES.INVOICE.FETCH_GST_DETAILS(gstin), {});
  return response.data;
}, 'fetchGstinDetails');

const applyCustomerCreditToInvoice = withErrorHandling(async payload => {
  const { customerId, branchId, applications, contextInvoiceId } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.SALES.INVOICE.APPLY_CUSTOMER_CREDIT_TO_INVOICE(customerId),
    { applications, ...(contextInvoiceId ? { contextInvoiceId } : {}) },
    {
      params: { ...(branchId && { branchId }) },
    }
  );
  return response.data;
}, 'applyCustomerCreditToInvoice');

const removeOpeningBalanceApplication = withErrorHandling(async payload => {
  const { invoiceId, applicationId, creditTxnId, applicationScope } = payload;
  const isObToOb = applicationScope === 'opening_balance';
  const url =
    isObToOb && creditTxnId
      ? API_ROUTES.SALES.INVOICE.REMOVE_OPENING_BALANCE_OB_APPLICATION(creditTxnId, applicationId)
      : API_ROUTES.SALES.INVOICE.REMOVE_OPENING_BALANCE_APPLICATION(invoiceId, applicationId);
  const response = await axiosConfig.delete(url);
  return response.data;
}, 'removeOpeningBalanceApplication');

const autoMapOpeningBalanceToInvoices = withErrorHandling(async payload => {
  const { customerId, branchId, isSplit } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.SALES.INVOICE.MAP_OB_CREDIT,
    {},
    {
      params: { ...(customerId && { customerId }), ...(branchId && { branchId }), ...(typeof isSplit && { isSplit }) },
    }
  );
  return response.data;
}, 'autoMapOpeningBalanceToInvoices');

const createSplitInvoice = withErrorHandling(async invoiceData => {
  const { formData } = buildMultipartPayload(invoiceData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.SALES.INVOICE.CREATE_SPLIT_INVOICE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createSplitInvoice');

export const invoiceService = {
  getInvoice,
  getPendingInvoice,
  getInvoiceDropdown,
  createInvoices,
  updateInvoices,
  invoiceFileUpload,
  generateOnlyEWayBill,
  updateStatus,
  getInvoiceTransport,
  createInvoiceTransport,
  updateInvoiceTransport,
  getInvoiceDispatch,
  createInvoiceDispatch,
  updateInvoiceDispatch,
  bookingCopyFileUpload,
  truckGoodsFileUpload,
  vehicleGoodsFileUpload,
  getInvoiceById,
  removeInvoice,
  getInvoiceExports,
  removeDispatchInvoice,
  generateEInvoice,
  cancelEInvoice,
  generateEWayBill,
  cancelEWayBill,
  cancelOnlyEWayBill,
  refetchEInvoice,
  getGstDocumentOptions,
  getPaymentHistory,
  fetchGstinDetails,
  createSplitInvoice,
  applyCustomerCreditToInvoice,
  removeOpeningBalanceApplication,
  autoMapOpeningBalanceToInvoices,
};
