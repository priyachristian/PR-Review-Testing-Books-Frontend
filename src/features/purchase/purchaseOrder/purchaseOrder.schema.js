import * as Yup from 'yup';

export const purchaseOrderValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    vendor: Yup.string().required('Please select the vendor'),
    date: Yup.string().required('Please select the order date'),
    deliveryDate: Yup.string().required('Please select the delivery date'),
    purchaseOrderId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the purchase order number'),
    customer: Yup.string().when('shippingAddressType', {
      is: 'Customer',
      then: schema => schema.required('Please select the customer'),
      otherwise: schema => schema.optional().nullable(),
    }),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select the item'),
        quantity: Yup.number().typeError('Please enter a valid quantity').positive('Quantity must be greater than zero').required('Please enter the quantity'),
        rate: Yup.number().typeError('Please enter a valid rate').positive('Rate must be greater than zero').required('Please enter the rate'),
        amount: Yup.number().typeError('Please enter a valid amount').required('Please enter the amount'),
      })
    ),
  });
};
