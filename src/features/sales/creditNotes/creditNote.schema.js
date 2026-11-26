import * as Yup from 'yup';

export const creditNotesValidateSchema = autoGenerate => {
  return Yup.object({
    customerId: Yup.string().required('Please select the customer'),
    creditNoteDate: Yup.string().required('Please select the credit note date'),
    creditNoteId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the credit note number'),
    invoiceId: Yup.string()
      .nullable()
      .test('invoice-validation', 'Please provide either the invoice number or select the invoice', function (value) {
        const { invoiceNo } = this.parent;
        const hasInvoiceNo = invoiceNo && typeof invoiceNo === 'string' && invoiceNo.trim() !== '';
        const hasInvoiceId = value !== null && value !== undefined && value !== '';
        return hasInvoiceId || hasInvoiceNo;
      }),
    invoiceNo: Yup.string().test('invoice-no-validation', 'Please provide either the invoice number or select the invoice', function (value) {
      const { invoiceId } = this.parent;
      const hasInvoiceId = invoiceId !== null && invoiceId !== undefined && invoiceId !== '';
      const hasInvoiceNo = value && typeof value === 'string' && value.trim() !== '';
      return hasInvoiceId || hasInvoiceNo;
    }),
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    type: Yup.string().required('Please select the credit note type'),
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

export const refundSchema = Yup.object().shape({
  refundAmount: Yup.number()
    .required('Refund amount is required')
    .min(0.01, 'Refund amount must be greater than 0')
    .test('max-amount', 'Refund amount cannot exceed available balance', function (value) {
      const { parent } = this;
      return value <= (parent.availableBalance || 0);
    }),
  refundDate: Yup.date().required('Refund date is required'),
  accountId: Yup.string().required('Account is required'),
  reference: Yup.string(),
  notes: Yup.string(),
});
