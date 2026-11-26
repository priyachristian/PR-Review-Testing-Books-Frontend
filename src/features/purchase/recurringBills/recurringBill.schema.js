import * as Yup from 'yup';

export const recurringBillValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    vendorId: Yup.string().required('Please select the vendor'),
    profileName: Yup.string().required('Please enter a profile name'),
    recurringBillId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please select a recurring bill'),
    period: Yup.string().required('Please select how often this bill should repeat'),
    frequency: Yup.number().typeError('Please enter a valid frequency').required('Please enter the repeat frequency'),
    neverExpires: Yup.boolean(),
    startDate: Yup.string().required('Please select the start date'),
    endDate: Yup.string().when('neverExpires', {
      is: false,
      then: schema => schema.required('Please select the end date'),
      otherwise: schema => schema.notRequired(),
    }),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select an item'),
        quantity: Yup.number().typeError('Please enter a valid quantity').positive('Quantity must be greater than zero').required('Please enter the quantity'),
        rate: Yup.number().typeError('Please enter a valid rate').positive('Rate must be greater than zero').required('Please enter the rate'),
        amount: Yup.number().typeError('Please enter a valid amount').required('Amount is required'),
      })
    ),
  });
};
