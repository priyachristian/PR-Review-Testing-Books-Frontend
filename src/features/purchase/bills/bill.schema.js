import * as Yup from 'yup';

export const billsValidateSchema = (autoGenerate, isSplitSessionActive) => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    vendor: Yup.string().required('Please select the vendor'),
    billDate: Yup.string().required('Please select the bill date'),
    dueDate: Yup.string().required('Please select the due date'),
    billId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the bill number'),
    splitPercentage: Yup.number().typeError('Please enter a valid percentage').optional().nullable().max(100, 'Percentage cannot be more than 100'),
    customer: Yup.string().when('shippingAddressType', {
      is: 'Customer',
      then: schema => schema.required('Please select the customer'),
      otherwise: schema => schema.optional().nullable(),
    }),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select the item'),
        batchNumberMandatory: Yup.boolean().optional(),
        batchExpiryDateMandatory: Yup.boolean().optional(),
        vendorBatchNo: Yup.string().when('batchNumberMandatory', {
          is: true,
          then: schema => schema.required('Please enter the batch number'),
          otherwise: schema => schema.optional(),
        }),
        vendorBatchExpiry: Yup.string().when('batchExpiryDateMandatory', {
          is: true,
          then: schema => schema.required('Please select the batch expiry date'),
          otherwise: schema => schema.optional().nullable(),
        }),
        quantity: !isSplitSessionActive
          ? Yup.number().typeError('Please enter a valid quantity').required('Please enter the quantity').positive('Quantity must be greater than zero')
          : Yup.number().typeError('Please enter a valid quantity').required('Please enter the quantity'),
        finalQty: Yup.number().optional().nullable(),
        rate: !isSplitSessionActive
          ? Yup.number().typeError('Please enter a valid rate').required('Please enter the rate').positive('Rate must be greater than zero')
          : Yup.number().typeError('Please enter a valid rate').required('Please enter the rate'),
        finalRate: Yup.number().optional().nullable(),
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
        splitPercentage: Yup.number().typeError('Please enter a valid percentage').optional().nullable().max(99, 'Percentage cannot be more than 99'),
      })
    ),
  });
};
