import * as Yup from 'yup';

// Empty input becomes undefined so the "is required" message shows instead of "must be a number".
const positive = label =>
  Yup.number()
    .transform((value, original) => (original === '' ? undefined : value))
    .typeError(`${label} must be a number`)
    .moreThan(0, `${label} must be greater than 0`);

const unitSchema = Yup.object().shape({
  selected: Yup.boolean(),
  samplePrice: Yup.mixed().when('selected', { is: true, then: () => positive('Sample Price').required('Sample Price is required') }),
  minQty: Yup.mixed().when('selected', { is: true, then: () => positive('Min Qty').required('Min Qty is required') }),
  maxQty: Yup.mixed().when('selected', {
    is: true,
    then: () =>
      positive('Max Qty')
        .required('Max Qty is required')
        .test('max-gte-min', 'Max Qty cannot be less than Min Qty', function (value) {
          return Number(value) >= Number(this.parent.minQty);
        }),
  }),
});

// The code is typed by the user only when auto numbering is off.
export const sampleCatalogValidateSchema = isAutoCode =>
  Yup.object().shape({
    catalogCode: isAutoCode ? Yup.string().nullable() : Yup.string().trim().max(50, 'Catalog Code must be at most 50 characters').required('Catalog Code is required'),
    name: Yup.string().trim().max(150, 'Catalog Name must be at most 150 characters').required('Catalog Name is required'),
    description: Yup.string().max(1000, 'Description must be at most 1000 characters'),
    startDate: Yup.mixed().nullable(),
    endDate: Yup.mixed()
      .nullable()
      .test('end-after-start', 'End Date cannot be before Start Date', function (value) {
        const { startDate } = this.parent;
        return !value || !startDate || new Date(value) >= new Date(startDate);
      }),
    visibility: Yup.string().required('Visibility is required'),
    customerIds: Yup.array().when('visibility', {
      is: 'SELECTED_CUSTOMERS',
      then: schema => schema.min(1, 'Select at least one customer'),
    }),
    items: Yup.array().of(
      Yup.object().shape({
        // The trailing blank row is skipped on save, so it only errors when no row has an item.
        itemId: Yup.string()
          .nullable()
          .test('item-required', 'Item is required', function (value) {
            return Boolean(value) || (this.from?.[1]?.value?.items || []).some(row => row.itemId);
          }),
        units: Yup.array()
          .of(unitSchema)
          .test('one-unit', 'Select at least one unit', function (units) {
            return !this.parent.itemId || (units || []).some(unit => unit.selected);
          }),
      })
    ),
  });
