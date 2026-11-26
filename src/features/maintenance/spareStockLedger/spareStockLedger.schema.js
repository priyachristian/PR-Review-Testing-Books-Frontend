import * as Yup from 'yup';
import dayjs from 'dayjs';

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

export const ADJUSTMENT_TYPES = [
  { label: 'Increase', value: 'INCREASE' },
  { label: 'Decrease', value: 'DECREASE' },
];

export const getStockAdjustmentInitialValues = () => ({
  sparePartId: undefined,
  adjustmentType: 'INCREASE',
  qty: '',
  date: dayjs(),
  remarks: '',
});

export const stockAdjustmentSchema = Yup.object({
  sparePartId: Yup.string().required('Please select spare part'),
  adjustmentType: Yup.string().oneOf(['INCREASE', 'DECREASE']).required('Please select adjustment type'),
  qty: Yup.number()
    .transform(emptyNumberToNull)
    .nullable()
    .typeError('Enter a valid number')
    .moreThan(0, 'Must be greater than 0')
    .test('max-decimals', 'Can have up to 4 decimal places', function validateDecimals(value) {
      if (value == null) return true;
      return /^\d+(\.\d{0,4})?$/.test(String(this.originalValue ?? value));
    })
    .required('Please enter quantity'),
  date: Yup.mixed()
    .nullable()
    .test('valid-date', 'Please select a valid date', value => !value || dayjs(value).isValid()),
  remarks: Yup.string().trim().required('Please enter remarks'),
});

export const buildStockAdjustmentPayload = values => {
  const qty = Number(values.qty);
  const signedQty = values.adjustmentType === 'DECREASE' ? -Math.abs(qty) : Math.abs(qty);
  const date = values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined;

  return {
    sparePartId: values.sparePartId,
    qty: signedQty,
    remarks: values.remarks.trim(),
    ...(date ? { date } : {}),
  };
};
