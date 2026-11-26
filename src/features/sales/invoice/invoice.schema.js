import '@/utils/util';
import * as Yup from 'yup';
import { NIC_DOC_NUMBER_MAX_LENGTH } from '@/utils/constants';

export const invoiceValidateSchema = (autoGenerate, isSplitSessionActive) => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    customerId: Yup.string().optional().nullable(),
    invoiceDate: Yup.string().required('Please select the invoice date'),
    invoiceId: autoGenerate
      ? Yup.string().notRequired().max(NIC_DOC_NUMBER_MAX_LENGTH, `Invoice number cannot be more than ${NIC_DOC_NUMBER_MAX_LENGTH} characters`)
      : Yup.string().trim().required('Please enter the invoice number').max(NIC_DOC_NUMBER_MAX_LENGTH, `Invoice number cannot be more than ${NIC_DOC_NUMBER_MAX_LENGTH} characters`),
    dueDate: Yup.string().required('Please select the due date'),
    paymentTermsId: Yup.string().required('Please select the payment terms'),
    splitWiseType: Yup.string().optional().nullable(),
    splitPercentage: Yup.number()
      .typeError('Please enter a valid value')
      .optional()
      .nullable()
      .when('splitWiseType', {
        is: 'Split By Price',
        then: schema => schema.max(100, 'Value cannot be more than 100'),
        otherwise: schema => schema.notRequired(),
      }),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select the item'),
        finalQty: Yup.number().optional().nullable(),
        quantity: !isSplitSessionActive
          ? Yup.number().typeError('Please enter a valid quantity').required('Please enter the quantity').min(0, 'Quantity must be greater than zero')
          : Yup.number()
              .typeError('Please enter a valid quantity')
              .nullable()
              .test('qty-validation', function (value) {
                const { finalQty } = this.parent;
                const rootForm = this.from[this.from.length - 1].value; // root form values
                const splitWiseType = rootForm.splitWiseType;
                // Case 1: splitWiseType not set → only required
                if (!splitWiseType) {
                  if (value == null) return this.createError({ message: 'Please enter the quantity' });
                  return true;
                }
                // Case 2: Split By Qty → optional but <= finalQty
                if (splitWiseType === 'Split By Qty') {
                  if (value == null) return true;
                  return (
                    value <= finalQty ||
                    this.createError({
                      message: 'Quantity cannot be greater than the available quantity',
                    })
                  );
                }
                // Case 3: Split By Price → only required, skip greater-than check
                if (splitWiseType === 'Split By Price') {
                  if (value == null) return this.createError({ message: 'Please enter the quantity' });
                  return true;
                }
                // Case 4: Any other case → required and <= finalQty
                if (value == null) return this.createError({ message: 'Please enter the quantity' });
                return (
                  value <= finalQty ||
                  this.createError({
                    message: 'Quantity cannot be greater than the available quantity',
                  })
                );
              }),

        finalRate: Yup.number().optional().nullable(),
        rate: !isSplitSessionActive
          ? Yup.number().typeError('Please enter a valid rate').required('Please enter the rate').positive('Rate must be greater than zero')
          : Yup.number()
              .typeError('Please enter a valid rate')
              .nullable()
              .test('rate-validation', function (value) {
                const { finalRate } = this.parent;
                const rootForm = this.from[this.from.length - 1].value;
                const splitWiseType = rootForm.splitWiseType;
                // Case 1: splitWiseType not set → only required
                if (!splitWiseType) {
                  if (value == null) return this.createError({ message: 'Please enter the rate' });
                  return true;
                }
                // Case 2: Split By Price → optional but <= finalRate
                if (splitWiseType === 'Split By Price') {
                  if (value == null) return true;
                  return (
                    value <= finalRate ||
                    this.createError({
                      message: 'Rate cannot be greater than the original rate',
                    })
                  );
                }
                // Case 3: Split By Qty → only required, skip greater-than check
                if (splitWiseType === 'Split By Qty') {
                  if (value == null) return this.createError({ message: 'Please enter the rate' });
                  return true;
                }
                // Case 4: Any other case → required and <= finalRate
                if (value == null) return this.createError({ message: 'Please enter the rate' });
                return (
                  value <= finalRate ||
                  this.createError({
                    message: 'Rate cannot be greater than the original rate',
                  })
                );
              }),

        amount: Yup.number().typeError('Please enter a valid amount').required('Please enter the amount'),

        splitQty: Yup.number()
          .typeError('Please enter a valid quantity')
          .optional()
          .nullable()
          .when('finalQty', (finalQty, schema) =>
            schema.test('less-than-finalQty', 'Quantity cannot be greater than the available quantity', function (value) {
              if (value == null || finalQty == null) return true;
              return value <= finalQty;
            })
          ),

        splitRate: Yup.number()
          .typeError('Please enter a valid rate')
          .optional()
          .nullable()
          .when('finalRate', (finalRate, schema) =>
            schema.test('less-than-finalRate', 'Rate cannot be greater than the original rate', function (value) {
              if (value == null || finalRate == null) return true;
              return value <= finalRate;
            })
          ),

        splitPercentage: Yup.number()
          .typeError('Please enter a valid percentage')
          .optional()
          .nullable()
          .test('split-percentage-max', 'Percentage cannot be more than 99', function (value) {
            const rootForm = this.from[this.from.length - 1].value;
            if (rootForm.splitWiseType !== 'Split By Price') return true;
            if (value == null) return true;
            return value <= 99;
          }),
      })
    ),
  });
};

// E-invoice and e-way bill form schemas are shared across modules and live with the gstDocument feature.
export { eWayBillSchema, generateEInvoiceSchema, cancelEInvoiceSchema, cancelEWayBillSchema, onlyEwayBillSchema } from '@/features/sales/gstDocument/gstDocument.schema';
