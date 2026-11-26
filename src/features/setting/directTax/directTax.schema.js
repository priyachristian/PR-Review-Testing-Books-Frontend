import * as Yup from 'yup';

export const directTaxValidateSchema = Yup.object({
  taxName: Yup.string().trim().required('Tax Name is required'),
  taxRate: Yup.number().typeError('Rate must be a number').min(0, 'Rate cannot be negative').max(100, 'Rate cannot be more than 100').required('Rate is required'),
  sectionId: Yup.string().required('Section is required'),
  startDate: Yup.mixed().required('Start Date is required'),
  endDate: Yup.mixed()
    .nullable()
    .test('end-after-start', 'End Date must be on or after the Start Date', function (endDate) {
      const { startDate } = this.parent;
      return !endDate || !startDate || !endDate.isBefore(startDate, 'day');
    }),
});
