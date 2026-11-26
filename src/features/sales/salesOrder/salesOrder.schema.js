import '@/utils/util';
import * as Yup from 'yup';

export const salesOrderValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    tagId: Yup.string().optional().nullable(),
    customerId: Yup.string().required('Please select the customer'),
    orderId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the sales order number'),
    orderDate: Yup.string().required('Please select the order date'),
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
