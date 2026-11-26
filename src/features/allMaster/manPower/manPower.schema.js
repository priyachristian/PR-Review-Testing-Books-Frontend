import * as Yup from 'yup';

export const workerValidateSchema = Yup.object({
  workerName: Yup.string().trim().required('Worker Name is required'),
  departmentName: Yup.string().trim().nullable(),
  perHourSalary: Yup.number().typeError('Please enter salary').min(0, 'Salary cannot be negative').required('Please enter salary'),
});
