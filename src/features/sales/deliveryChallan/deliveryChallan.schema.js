import * as Yup from 'yup';
import '@/utils/util';

export const deliveryChallanValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    fromDivisionId: Yup.string()
      .nullable()
      .when('isStockTransfer', { is: true, then: schema => schema.required('Please select the from division') }),
    fromBranchId: Yup.string()
      .nullable()
      .when('isStockTransfer', { is: true, then: schema => schema.required('Please select the from branch') }),
    fromWarehouseId: Yup.string()
      .nullable()
      .when('isStockTransfer', {
        is: true,
        then: schema =>
          schema.required('Please select the from warehouse').test('different-warehouse', 'From and To warehouse must be different', (value, context) => value !== context.parent.warehouseId),
      }),
    customerId: Yup.string().required('Please select the customer'),
    challanId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the delivery challan number'),
    challanDate: Yup.string().required('Please select the delivery challan date'),
    challanType: Yup.string().required('Please select the challan type'),
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
