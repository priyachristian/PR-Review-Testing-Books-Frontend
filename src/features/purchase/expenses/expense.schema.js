import * as Yup from 'yup';

export const expenseValidateSchema = (autoGenerate, isVendorParty) => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    expenseId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the expense number'),
    date: Yup.string().required('Please select the date'),
    paidThroughAccountId: Yup.string()
      .nullable()
      .when('isBillable', {
        is: isBillable => !(isBillable && isVendorParty),
        then: schema => schema.required('Please select the paid through account'),
      }),
    lines: Yup.array()
      .of(
        Yup.object({
          accountId: Yup.string().nullable().required('Please select the expense account'),
          amount: Yup.number().typeError('Please enter a valid amount').positive('Amount must be greater than zero').required('Please enter the amount'),
        })
      )
      .min(1),
    invoiceNo: Yup.string().nullable(),
    invoiceDate: Yup.mixed()
      .nullable()
      .when('invoiceNo', {
        is: invoiceNo => !!invoiceNo?.trim(),
        then: schema => schema.required('Please select the invoice date'),
      }),
    supplierGstin: Yup.string()
      .nullable()
      .when(['lines', 'isBillable'], {
        is: (lines, isBillable) => !(isVendorParty && !isBillable) && lines?.some(line => Number(line.gst) > 0 && line.isItcEligible),
        then: schema => schema.trim().required('Please enter the supplier GSTIN'),
      })
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Please enter a valid GSTIN', excludeEmptyString: true }),
  });
};
