import * as Yup from 'yup';

export const debitNoteValidateSchema = autoGenerate => {
  return Yup.object({
    vendorId: Yup.string().required('Please select a vendor'),
    billId: Yup.string()
      .nullable()
      .test('bill-validation', 'Please provide either a Bill ID or a Bill Number', function (value) {
        const { billNo } = this.parent;
        const hasBillNo = billNo && String(billNo).trim() !== '';
        const hasBillId = value && value !== '';
        return hasBillId || hasBillNo;
      }),
    billNo: Yup.string()
      .nullable()
      .test('bill-no-validation', 'Please provide either a Bill ID or a Bill Number', function (value) {
        const { billId } = this.parent;
        const hasBillId = billId && billId !== '';
        const hasBillNo = value && String(value).trim() !== '';
        return hasBillId || hasBillNo;
      }),
    divisionId: Yup.string().required('Please select a division'),
    branchId: Yup.string().required('Please select a branch'),
    warehouseId: Yup.string().required('Please select a warehouse'),
    debitNoteId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the Debit Note number'),
    type: Yup.string().required('Please select the debit note type'),
    customer: Yup.string().when('shippingAddressType', {
      is: 'Customer',
      then: schema => schema.required('Please select a customer'),
      otherwise: schema => schema.optional().nullable(),
    }),
    items: Yup.array().itemTableRows(
      Yup.object({
        itemId: Yup.string().required('Please select an item'),
        quantity: Yup.number().typeError('Please enter a valid quantity').positive('Quantity must be greater than 0').required('Quantity is required'),
        rate: Yup.number().typeError('Please enter a valid rate').positive('Rate must be greater than 0').required('Rate is required'),
        amount: Yup.number().typeError('Please enter a valid amount').required('Amount is required'),
      })
    ),
  });
};
