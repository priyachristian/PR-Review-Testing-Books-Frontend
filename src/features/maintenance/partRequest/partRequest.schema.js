import * as Yup from 'yup';

export const PART_REQUEST_STATUSES = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Issued', value: 'ISSUED' },
  { label: 'Short', value: 'SHORT' },
];

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

export const approvePartRequestSchema = Yup.object({
  requestedQty: Yup.number().nullable(),
  approvedQty: Yup.number()
    .transform(emptyNumberToNull)
    .nullable()
    .typeError('Enter a valid number')
    .integer('Must be a whole number')
    .moreThan(0, 'Must be greater than 0')
    .test('max-requested', 'Cannot exceed requested qty', function validateApprovedQty(value) {
      if (value == null) return true;
      const requestedQty = Number(this.parent?.requestedQty);
      if (!Number.isFinite(requestedQty)) return true;
      return value <= requestedQty;
    })
    .required('Please enter approved qty'),
  approvalRemark: Yup.string().trim(),
});

export const issuePartRequestSchema = Yup.object({
  approvedQty: Yup.number().nullable(),
  issuedQty: Yup.number()
    .transform(emptyNumberToNull)
    .nullable()
    .typeError('Enter a valid number')
    .integer('Must be a whole number')
    .moreThan(0, 'Must be greater than 0')
    .test('max-approved', 'Cannot exceed approved qty', function validateIssuedQty(value) {
      if (value == null) return true;
      const approvedQty = Number(this.parent?.approvedQty);
      if (!Number.isFinite(approvedQty)) return true;
      return value <= approvedQty;
    })
    .required('Please enter issued qty'),
});
