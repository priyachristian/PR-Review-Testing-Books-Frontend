import * as Yup from 'yup';

export const generalSalesAnalyticsValidateSchema = (existingReports = [], editingReportId = null) => {
  return Yup.object().shape({
    reportName: Yup.string()
      .trim()
      .required('Analytics Name is required')
      .min(3, 'Analytics Name must be at least 3 characters')
      .max(200, 'Analytics Name must not exceed 200 characters')
      .test('unique-name', 'An analytics with this name already exists', function (value) {
        if (!value) return true;
        const trimmedValue = value.trim().toLowerCase();
        const isDuplicate = existingReports.some(report => report.reportName?.trim().toLowerCase() === trimmedValue && report._id !== editingReportId);
        return !isDuplicate;
      }),
    reportBasis: Yup.string().oneOf(['ITEM_GROUP', 'ITEM'], 'Invalid basis').required('Analytics Basis is required'),
    basisIds: Yup.array().of(Yup.string()).min(1, 'Please select at least one item or item group').required('Selection is required'),
    selectedModules: Yup.array().of(Yup.string()).min(1, 'Please select at least one document type').required('Document selection is required'),
    documentStatuses: Yup.object(),
  });
};
