import * as Yup from 'yup';

export const paymentReceivedValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    customerId: Yup.string().required('Please select the customer'),
    paymentId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the payment number'),
    paymentDate: Yup.string().required('Please select the payment date'),
    paymentMode: Yup.string().required('Please select the payment mode'),
    depositToAccountId: Yup.string().nullable().required('Please select the deposit to account'),
    chequeReceivedDate: Yup.string().when('paymentMode', {
      is: val => val === 'CHEQUE',
      then: schema => schema.required('Please select the cheque received date'),
      otherwise: schema => schema.notRequired(),
    }),
    advancedPayment: Yup.boolean(),
    tdsAccountId: Yup.string()
      .nullable()
      .when('taxDeducted', {
        is: true,
        then: schema => schema.required('Please select the TDS account'),
      }),
    reflectPaymentInLines: Yup.boolean(),
    receivedAmount: Yup.number()
      .transform((v, orig) => (orig === '' || orig == null ? undefined : v))
      .typeError('Please enter a valid amount')
      .required('Please enter the received amount'),
    invoices: Yup.array(),
    amountReceived: Yup.mixed().notRequired(),
  });
};
