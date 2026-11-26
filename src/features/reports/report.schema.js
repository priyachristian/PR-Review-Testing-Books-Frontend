import * as Yup from 'yup';

export const customerAgingReportValidateSchema = Yup.object().shape({
  reportType: Yup.string().oneOf(['customer']).default('customer'),
  startDate: Yup.mixed()
    .nullable()
    .test('is-date', 'Start Date must be a valid date', function (value) {
      if (!value) return true;
      return value instanceof Date || !isNaN(new Date(value).getTime());
    }),
  endDate: Yup.mixed()
    .nullable()
    .test('is-date', 'End Date must be a valid date', function (value) {
      if (!value) return true;
      return value instanceof Date || !isNaN(new Date(value).getTime());
    })
    .test('not-before-start', 'End Date cannot be before Start Date', function (value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true;
      return new Date(value) >= new Date(startDate);
    }),
  numberOfColumns: Yup.number()
    .typeError('Number of Columns must be a number')
    .integer('Number of Columns must be an integer')
    .min(1, 'Number of Columns must be at least 1')
    .max(8, 'Number of Columns must be at most 8')
    .required('Number of Columns is required'),
  columnType: Yup.string().oneOf(['days', 'weeks', 'months', 'years'], 'Column Type must be one of: days, weeks, months, years').required('Column Type is required'),
  duration: Yup.number().typeError('Duration must be a number').integer('Duration must be an integer').min(1, 'Duration must be at least 1').required('Duration is required'),
  customerIds: Yup.array().of(Yup.string()).optional(),
});

export const vendorAgingReportValidateSchema = Yup.object().shape({
  reportType: Yup.string().oneOf(['vendor']).default('vendor'),
  startDate: Yup.mixed()
    .nullable()
    .test('is-date', 'Start Date must be a valid date', function (value) {
      if (!value) return true;
      return value instanceof Date || !isNaN(new Date(value).getTime());
    }),
  endDate: Yup.mixed()
    .nullable()
    .test('is-date', 'End Date must be a valid date', function (value) {
      if (!value) return true;
      return value instanceof Date || !isNaN(new Date(value).getTime());
    })
    .test('not-before-start', 'End Date cannot be before Start Date', function (value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true;
      return new Date(value) >= new Date(startDate);
    }),
  numberOfColumns: Yup.number()
    .typeError('Number of Columns must be a number')
    .integer('Number of Columns must be an integer')
    .min(1, 'Number of Columns must be at least 1')
    .max(8, 'Number of Columns must be at most 8')
    .required('Number of Columns is required'),
  columnType: Yup.string().oneOf(['days', 'weeks', 'months', 'years'], 'Column Type must be one of: days, weeks, months, years').required('Column Type is required'),
  duration: Yup.number().typeError('Duration must be a number').integer('Duration must be an integer').min(1, 'Duration must be at least 1').required('Duration is required'),
  vendorIds: Yup.array().of(Yup.string()).optional(),
});
