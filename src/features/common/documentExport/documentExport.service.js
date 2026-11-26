import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';

const toApiError = error => {
  const data = error?.response?.data;
  const err = new Error(data?.message || error?.message || 'Request failed');
  err.code = data?.code;
  err.data = data?.data;
  err.statusCode = error?.response?.status;
  return err;
};

export const createDocumentPdfExport = async ({ moduleType, filters = {}, fileName, format = 'pdf', pdfVariant = 'document' }) => {
  try {
    const response = await axiosConfig.post(API_ROUTES.DOCUMENT_EXPORT.CREATE, {
      moduleType,
      format,
      pdfVariant,
      filters,
      fileName,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const buildDocumentExportDownloadUrl = ({ jobId, token, companyId }) => {
  const base = (import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const path = API_ROUTES.DOCUMENT_EXPORT.DOWNLOAD(jobId);
  const params = new URLSearchParams({
    companyId: String(companyId || ''),
    token: String(token || ''),
  });
  return `${base}/${path}?${params.toString()}`;
};

export const triggerBrowserPdfDownload = ({ jobId, token, companyId }) => {
  const url = buildDocumentExportDownloadUrl({ jobId, token, companyId });

  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  return url;
};
