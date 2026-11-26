import * as Yup from 'yup';

export const rejectionOrderValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().nullable().required('Division is required'),
    branchId: Yup.string().nullable().required('Branch is required'),
    warehouseId: Yup.string().nullable().required('Warehouse is required'),
    customerId: Yup.string().nullable().required('Customer is required'),
    rejectionOrderId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Rejection Order ID is required'),
    items: Yup.array()
      .itemTableRows(
        Yup.object().shape({
          itemId: Yup.string().nullable().required('Item is required'),
          watt: Yup.string().trim().nullable(),
          booked: Yup.number().typeError('Must be a number').min(1, 'Min quantity is 1').required('Quantity is required'),
        })
      )
      .min(1, 'At least one item is required'),
  });
};
