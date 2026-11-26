import * as Yup from 'yup';

export const paymentMadeValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    vendor: Yup.string().required('Please select the vendor'),
    paymentMadeId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the payment reference number'),
    paymentDate: Yup.string().required('Please select the payment date'),
    paymentMode: Yup.string().required('Please select the payment mode'),
    paidThroughAccountId: Yup.string().nullable().required('Please select the paid through account'),
    advancedPayment: Yup.boolean(),
    reflectPaymentInLines: Yup.boolean(),
    receivedAmount: Yup.number()
      .transform((v, orig) => (orig === '' || orig == null ? undefined : v))
      .typeError('Please enter a valid amount')
      .required('Please enter the paid amount')
      .moreThan(0, 'Paid amount must be greater than 0'),
    bills: Yup.array(),
    paymentmade: Yup.mixed().notRequired(),
  });
};
