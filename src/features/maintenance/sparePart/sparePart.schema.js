import * as Yup from 'yup';

export const SPARE_PART_CATEGORIES = [
  { label: 'Mechanical', value: 'MECHANICAL' },
  { label: 'Consumable', value: 'CONSUMABLE' },
  { label: 'Electrical', value: 'ELECTRICAL' },
];

export const SPARE_PART_STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

const optionalNumber = Yup.number().transform(emptyNumberToNull).nullable().typeError('Enter a valid number').min(0, 'Must be 0 or more');

const optionalDecimal = places =>
  optionalNumber.test('max-decimals', `Can have up to ${places} decimal places`, function validateDecimals(value) {
    if (value == null) return true;
    return new RegExp(`^\\d+(\\.\\d{0,${places}})?$`).test(String(this.originalValue ?? value));
  });

const optionalWholeNumber = optionalNumber.integer('Must be a whole number');

export const sparePartValidateSchema = Yup.object({
  name: Yup.string().trim().required('Please enter the spare part name'),
  category: Yup.string()
    .oneOf(
      SPARE_PART_CATEGORIES.map(category => category.value),
      'Please select a category'
    )
    .required('Please select a category'),
  uom: Yup.string().required('Please select a unit'),
  standardRate: optionalDecimal(2),
  stock: optionalDecimal(4),
  minStockLevel: optionalDecimal(4),
  maxStockLevel: optionalDecimal(4).test('max-gte-min', 'Max stock level must be greater than or equal to min stock level', function validateMaxStock(value) {
    const { minStockLevel } = this.parent;
    if (value == null || minStockLevel == null) return true;
    return value >= minStockLevel;
  }),
  preferredVendor: Yup.string().trim().nullable(),
  leadDays: optionalWholeNumber,
  drawingReference: Yup.string().trim().nullable(),
  fitsOnMachines: Yup.array().of(Yup.string()).nullable(),
});
