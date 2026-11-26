import * as Yup from 'yup';

export const qualityValidateSchema = autoGenerate =>
  Yup.object({
    qcType: Yup.string().required('Please Select QC Type'),
    qcReportName: Yup.string().trim().required('Report Name is required'),
    qcReportResponsible: Yup.string().trim().required('Report Responsible is required'),
    qcReportID: autoGenerate ? Yup.string().notRequired() : Yup.string().required('QC Report ID is required'),
    productName: Yup.string().trim().required('Product Name is required'),
  });

export const testTypeDetailValidateSchema = Yup.object({
  testName: Yup.string().trim().required('Test Name is required'),
  remark: Yup.string().trim().required('Remark is required'),
  testType: Yup.string().required('Please Select Test Type'),
});
