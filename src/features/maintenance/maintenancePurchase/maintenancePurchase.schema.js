import * as Yup from 'yup';

export const MAINTENANCE_PURCHASE_STAGES = [
  { label: 'PR', value: 'PR' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'PO', value: 'PO' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Received', value: 'RECEIVED' },
];

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

const quantitySchema = Yup.number()
  .transform(emptyNumberToNull)
  .nullable()
  .typeError('Enter a valid number')
  .integer('Must be a whole number')
  .moreThan(0, 'Must be greater than 0')
  .required('Please enter the quantity');

const rateSchema = Yup.number()
  .transform(emptyNumberToNull)
  .nullable()
  .typeError('Enter a valid number')
  .min(0, 'Must be 0 or more')
  .test('max-decimals', 'Can have up to 2 decimal places', function validateRateDecimals(value) {
    if (value == null) return true;
    return /^\d+(\.\d{0,2})?$/.test(String(this.originalValue ?? value));
  })
  .required('Please enter the rate');

export const maintenancePurchaseValidateSchema = Yup.object({
  vendor: Yup.string().trim().required('Please enter the vendor'),
  linkedMrId: Yup.string().nullable(),
  expectedDelivery: Yup.mixed().nullable(),
  items: Yup.array()
    .of(
      Yup.object({
        sparePartId: Yup.string()
          .nullable()
          .required('Please select a spare part')
          .test('unique-spare-part', 'This spare part is already added', function uniqueSparePart(value) {
            if (!value) return true;
            const ancestors = (this.from || []).map(entry => entry?.value).filter(Boolean);
            const items = ancestors.find(entry => Array.isArray(entry?.items))?.items || ancestors.find(entry => Array.isArray(entry)) || [];
            return items.filter(item => item?.sparePartId === value).length <= 1;
          }),
        requestedQty: quantitySchema,
        rate: rateSchema,
      })
    )
    .min(1, 'At least one item is required'),
});

export const approveMaintenancePurchaseSchema = Yup.object({
  items: Yup.array()
    .of(
      Yup.object({
        sparePartId: Yup.string().required(),
        partName: Yup.string(),
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
      })
    )
    .min(1, 'At least one item is required'),
});

export const raiseMaintenancePurchasePoSchema = Yup.object({
  vendor: Yup.string().trim().required('Please enter the vendor'),
  expectedDelivery: Yup.mixed().nullable().required('Please select expected delivery'),
});

export const receiveMaintenancePurchaseSchema = Yup.object({
  items: Yup.array()
    .of(
      Yup.object({
        sparePartId: Yup.string().required(),
        partName: Yup.string(),
        orderedQty: Yup.number().nullable(),
        receivedSoFar: Yup.number().nullable(),
        remainingQty: Yup.number().nullable(),
        receiveNow: Yup.number()
          .transform(emptyNumberToNull)
          .nullable()
          .typeError('Enter a valid number')
          .integer('Must be a whole number')
          .min(0, 'Must be 0 or more')
          .test('max-remaining', 'Cannot exceed remaining qty', function validateReceiveNow(value) {
            if (value == null) return true;
            const remainingQty = Number(this.parent?.remainingQty);
            if (!Number.isFinite(remainingQty)) return true;
            return value <= remainingQty;
          }),
      })
    )
    .min(1, 'At least one item is required')
    .test('at-least-one-receive', 'Enter receive qty for at least one item', items =>
      (items || []).some(item => {
        const receiveNow = Number(item?.receiveNow);
        return Number.isFinite(receiveNow) && receiveNow > 0;
      })
    ),
});
