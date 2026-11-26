import '@/utils/util';
import * as Yup from 'yup';

export const quoteValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select a division'),
    branchId: Yup.string().required('Please select a branch'),
    warehouseId: Yup.string().required('Please select a warehouse'),
    customerId: Yup.string().required('Please select a customer'),
    quoteDate: Yup.string().required('Please select the quotation date'),
    quoteNumber: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the quotation number'),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select an item'),
        quantity: Yup.number().typeError('Please enter a valid quantity').positive('Quantity must be greater than zero').required('Please enter the quantity'),
        rate: Yup.number().typeError('Please enter a valid rate').positive('Rate must be greater than zero').required('Please enter the rate'),
        amount: Yup.number().typeError('Please enter a valid amount').required('Please enter the amount'),
      })
    ),
  });
};
