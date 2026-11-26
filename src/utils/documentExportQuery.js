import { withAbortSignal } from '@/utils/serviceHelper';

export const buildDocumentExportRequestConfig = (payload = {}, { dateField, dateQueryKey, partyField = 'customerId', extraFields = [] } = {}) => {
  const { search = '', sortBy = '', startDate = null, endDate = null, status = '', signal, division, branch, customerId, vendor, appName = '', addedBy = '' } = payload;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (dateField && payload[dateField]) {
    queryParams.append(dateQueryKey || dateField, payload[dateField]);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) queryParams.append('status', status);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (appName) queryParams.append('appName', appName);
  if (addedBy) queryParams.append('addedBy', addedBy);

  const partyValue = partyField === 'vendor' ? vendor || customerId : customerId;
  if (partyValue) queryParams.append(partyField, partyValue);

  extraFields.forEach(field => {
    const value = payload[field];
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      queryParams.append(field, value);
    }
  });

  return { params: queryParams, ...withAbortSignal(signal) };
};
