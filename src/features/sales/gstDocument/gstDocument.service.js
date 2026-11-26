import axiosConfig from 'app/axiosConfig';
import { API_ROUTES } from '@/utils/apiRoute';

const FALLBACK_ERROR = "We couldn't complete this action. Please try again, or contact support if the problem continues.";

// Rejects with the response body ({ message, data }) so the generate modal can read invalid HSN details.
const request = async call => {
  try {
    const response = await call();
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: error?.message || FALLBACK_ERROR };
  }
};

// Only fields the backend expects; empty HSN updates and unset options are left out.
const toGeneratePayload = ({ EwbDtls, EInvDtls, items, updateItemMaster }) => ({
  ...(EwbDtls && { EwbDtls }),
  ...(EInvDtls && Object.keys(EInvDtls).length > 0 && { EInvDtls }),
  ...(items?.length > 0 && { items, updateItemMaster: Boolean(updateItemMaster) }),
});

/**
 * E-invoice / e-way bill calls for any document module. `basePath` is the module's API base (e.g. 'creditNote').
 */
export const gstDocumentService = {
  getOptions: ({ basePath, documentId }) => request(() => axiosConfig.get(API_ROUTES.GST_DOCUMENT.OPTIONS(basePath, documentId))),

  generateEInvoice: ({ basePath, documentId, ...payload }) => request(() => axiosConfig.post(API_ROUTES.GST_DOCUMENT.E_INVOICE(basePath, documentId), toGeneratePayload(payload))),

  generateEWayBill: ({ basePath, documentId, ...payload }) => request(() => axiosConfig.post(API_ROUTES.GST_DOCUMENT.E_WAY_BILL(basePath, documentId), toGeneratePayload(payload))),

  cancelEInvoice: ({ basePath, documentId, cancelPayload }) => request(() => axiosConfig.post(API_ROUTES.GST_DOCUMENT.CANCEL_E_INVOICE(basePath, documentId), cancelPayload)),

  cancelEWayBill: ({ basePath, documentId, cancelPayload }) => request(() => axiosConfig.post(API_ROUTES.GST_DOCUMENT.CANCEL_E_WAY_BILL(basePath, documentId), cancelPayload)),
};
