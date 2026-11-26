import * as Yup from 'yup';
import { PRODUCTION_MODULE_METHOD } from 'utils/constants';
import { GST_RATE_OPTIONS, ITEM_TYPE_OPTIONS } from '@/utils/dropdownEnums';
import { parseBooleanImportValue } from './item.utils';

const ITEM_TYPE_VALUES = ITEM_TYPE_OPTIONS.map(option => option.value);

export const itemMasterValidateSchema = autoGenerate => {
  return Yup.object({
    itemName: Yup.string().trim().required('Please enter the item name').max(200, 'Item name must not exceed 200 characters.'),
    itemNo: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the item number'),
    itemType: Yup.string().oneOf(ITEM_TYPE_VALUES).required('Please select the item type'),
    itemModelNo: Yup.string().trim().required('Please enter the item model number'),
    itemGroup: Yup.string().required('Please select the item group'),
    subItemGroup: Yup.string().nullable().notRequired(),
    itemUnit: Yup.string().required('Please select the item unit'),
    unitConversions: Yup.array()
      .max(2, 'You can add up to 2 item unit conversions')
      .of(
        Yup.object({
          unit: Yup.string().required('Please select the unit'),
          qty: Yup.number().nullable(),
          baseQty: Yup.number()
            .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
            .typeError('Please enter a valid quantity')
            .moreThan(0, 'Quantity must be greater than 0')
            .required('Please enter the quantity'),
          salesPrice: Yup.number()
            .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
            .typeError('Please enter a valid sales price')
            .moreThan(0, 'Sales price must be greater than 0')
            .required('Please enter the sales price'),
          purchasePrice: Yup.number()
            .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
            .typeError('Please enter a valid purchase price')
            .min(0, 'Purchase price cannot be negative')
            .required('Please enter the purchase price'),
        })
      )
      .test('conversion-units', function (rows) {
        if (!Array.isArray(rows)) return true;
        const itemUnit = this.parent.itemUnit;
        const seen = new Set();
        for (let index = 0; index < rows.length; index += 1) {
          const unit = rows[index]?.unit;
          if (!unit) continue;
          if (itemUnit && unit === itemUnit) {
            return this.createError({ path: `unitConversions[${index}].unit`, message: 'Select a unit other than the item unit' });
          }
          if (seen.has(unit)) {
            return this.createError({ path: `unitConversions[${index}].unit`, message: 'This unit is already added' });
          }
          seen.add(unit);
        }
        return true;
      })
      .test('service-no-unit-conversion', 'Unit conversion is not allowed for a service item', function (rows) {
        if (!this.parent.isService) return true;
        return !Array.isArray(rows) || rows.length === 0;
      }),
    stockInUnit: Yup.string().nullable().notRequired(),
    stockOutUnit: Yup.string().nullable().notRequired(),
    description: Yup.string().nullable().notRequired(),
    remarks: Yup.string().nullable().notRequired(),
    salesOrPurchaseRequired: Yup.mixed().test('item-role-required', 'Select at least one of Sellable, Purchasable or Track Inventory', function (_, context) {
      const { isSellable, isPurchasable, trackInventory } = context.parent;
      return isSellable || isPurchasable || trackInventory;
    }),
    isSellable: Yup.boolean(),
    sellingPrice: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .typeError('Please enter a valid selling price')
      .nullable()
      .when('isSellable', {
        is: true,
        then: schema => schema.moreThan(0, 'Selling price must be greater than 0').required('Please enter the selling price when the item is marked as sellable'),
        otherwise: schema => schema.notRequired(),
      }),
    salesAccountId: Yup.string()
      .nullable()
      .when('isSellable', {
        is: true,
        then: schema => schema.required('Please select the sales account'),
        otherwise: schema => schema.notRequired(),
      }),
    isPurchasable: Yup.boolean(),
    costPrice: Yup.number()
      .transform((v, o) => (o === '' ? null : v))
      .typeError('Please enter a valid cost price')
      .nullable()
      .when('isPurchasable', {
        is: true,
        then: schema => schema.moreThan(0, 'Cost price must be greater than 0').required('Please enter the cost price when the item is marked as purchasable'),
        otherwise: schema => schema.notRequired(),
      }),
    purchaseAccountId: Yup.string()
      .nullable()
      .when('isPurchasable', {
        is: true,
        then: schema => schema.required('Please select the purchase account'),
        otherwise: schema => schema.notRequired(),
      }),
    trackInventory: Yup.boolean(),
    inventoryAccountId: Yup.string()
      .nullable()
      .when('trackInventory', {
        is: true,
        then: schema => schema.required('Please select the inventory account'),
        otherwise: schema => schema.notRequired(),
      }),
    isGoods: Yup.boolean(),
    isService: Yup.boolean(),
    itemCategory: Yup.mixed().test('at-least-one', 'Please select either Goods or Service', function (_, context) {
      const { isGoods, isService } = context.parent;
      return isGoods || isService;
    }),
    hsnCode: Yup.string().trim().required('Please enter the HSN code'),
    gst: Yup.string().required('Please select the GST rate'),
    itemStatus: Yup.boolean().optional(),
  });
};

export const salesDataValidateSchema = Yup.object({
  beforeDispatchFromWarehouse: Yup.boolean().notRequired(),
  customerPortalEnable: Yup.boolean().notRequired(),
  fqlStander: Yup.array().of(Yup.string()).nullable().notRequired(),
  specificCustomerEnable: Yup.boolean().notRequired(),
  specificCustomers: Yup.array().of(Yup.string()).nullable().notRequired(),
  vendorSideMFGAndQCDocument: Yup.array().of(Yup.string()).nullable().notRequired(),
})
  .nullable()
  .notRequired();

export const purchasingDataValidateSchema = Yup.object({
  printOnDocument: Yup.boolean().notRequired(),
  activeInactive: Yup.boolean().notRequired(),
  punchingPrintOnDocument: Yup.boolean().notRequired(),
  punchingActiveInactive: Yup.boolean().notRequired(),
  vendorSideMFGAndQCDocument: Yup.array().of(Yup.string()).nullable().notRequired(),
})
  .nullable()
  .notRequired();

export const addDropdownValidateSchema = Yup.object({
  name: Yup.string().required('Name is required'),
});

export const addGroupDropdownValidateSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
});

const isCompleteBomRow = row => Boolean(row?.itemGroup && row?.item && row?.itemUnitId && row?.qtyPerItem !== '' && row?.qtyPerItem != null);

const productionScrapOutInventorySchema = Yup.array().of(
  Yup.lazy(value => {
    const started = Boolean(value?.scrapItemName);
    return Yup.object().shape({
      itemUnitId: started ? Yup.string().required('Item Unit is required') : Yup.string().nullable(),
      qtyPerItem: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Qty/Item must be a number')
            .required('Qty/Item is required')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Qty/Item must be a number')
            .nullable(),
    });
  })
);

const materialLineSchema = method =>
  Yup.lazy((value, { context }) => {
    const started = context?.productionManageMethod === method && (value?.itemGroup || value?.item || value?.qtyPerItem);
    return Yup.object().shape({
      itemGroup: started ? Yup.string().required('Item Group is required') : Yup.string().nullable(),
      item: started ? Yup.string().required('Item is required') : Yup.string().nullable(),
      itemUnitId: started ? Yup.string().required('Item Unit is required') : Yup.string().nullable(),
      qtyPerItem: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Qty/Item must be a number')
            .required('Qty/Item is required')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Qty/Item must be a number')
            .nullable(),
      reject: Yup.boolean().notRequired(),
      return: Yup.boolean().notRequired(),
    });
  });

const bomBasedRowSchema = materialLineSchema(PRODUCTION_MODULE_METHOD.BOM_BASED);
const processRawMaterialSchema = materialLineSchema(PRODUCTION_MODULE_METHOD.PROCESS_ROUTE);

const processBasedSchema = Yup.array().of(
  Yup.object({
    processId: Yup.string().nullable(),
    rawMaterials: Yup.array().of(processRawMaterialSchema),
  })
);

export const productionDataValidateSchema = Yup.object({
  productionManageMethod: Yup.string().oneOf(Object.values(PRODUCTION_MODULE_METHOD)).nullable().notRequired(),
  productionScrapOutInventory: productionScrapOutInventorySchema,
  selectProcessRecipe: Yup.mixed().nullable().notRequired(),
  bomBased: Yup.array().of(bomBasedRowSchema),
  processBased: processBasedSchema,
});

export const productionDataDrawerValidateSchema = Yup.object({
  productionManageMethod: Yup.string().nullable().required('Production Manage Method is required'),
  productionScrapOutInventory: productionScrapOutInventorySchema,
  selectProcessRecipe: Yup.mixed().when('productionManageMethod', {
    is: PRODUCTION_MODULE_METHOD.PROCESS_ROUTE,
    then: schema =>
      schema.required('Process Recipe is required').test('has-recipe', 'Process Recipe is required', value => {
        if (!value) return false;
        if (typeof value === 'object') return Boolean(value?._id);
        return Boolean(value);
      }),
    otherwise: schema => schema.nullable().notRequired(),
  }),
  bomBased: Yup.array()
    .of(bomBasedRowSchema)
    .when('productionManageMethod', {
      is: PRODUCTION_MODULE_METHOD.BOM_BASED,
      then: schema => schema.test('at-least-one-bom', 'At least one BOM item is required', value => (value || []).some(isCompleteBomRow)),
      otherwise: schema => schema,
    }),
  processBased: processBasedSchema,
});

export const itemAttechmentValidateSchema = Yup.object({
  attachments: Yup.mixed().required('Attachments is required'),
});

export const inventoryDataValidateSchema = Yup.object({
  totalOpeningStock: Yup.number().typeError('Stock must be a number').nullable(),
  minimumStockLevel: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .typeError('Minimum Stock Level must be a number')
    .min(0, 'Minimum Stock Level cannot be negative')
    .nullable()
    .notRequired(),
  maximumStockLevel: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .typeError('Maximum Stock Level must be a number')
    .min(0, 'Maximum Stock Level cannot be negative')
    .nullable()
    .notRequired()
    .test('max-not-less-than-min', 'Minimum Stock Level cannot be greater than Maximum Stock Level', function (value) {
      const { minimumStockLevel } = this.parent;
      const max = value == null || value === '' ? 0 : Number(value);
      const min = minimumStockLevel == null || minimumStockLevel === '' ? 0 : Number(minimumStockLevel);
      return !(min > 0 && max > 0 && min > max);
    }),
  warehouses: Yup.array().of(
    Yup.object({
      openingStock: Yup.number()
        .transform((v, o) => (o === '' || o === null || o === undefined ? null : v))
        .typeError('Opening stock must be a number')
        .nullable(),
      openingStockRate: Yup.number()
        .transform((v, o) => (o === '' || o === null || o === undefined ? null : v))
        .typeError('Opening stock rate must be a valid amount')
        .nullable()
        .test('rate-required-when-stock', 'Rate must be greater than 0 when opening stock is entered.', function (value) {
          const stock = Number(this.parent.openingStock);
          if (!(stock > 0)) return true;
          return Number(value) > 0;
        }),
    })
  ),
});

export const addBulkItemValidateSchema = Yup.object({
  itemName: Yup.string().required('Item Name is required'),
  itemType: Yup.string()
    .required('Item Type is required')
    .oneOf(ITEM_TYPE_VALUES, `Invalid item type. Please select a valid option: ${ITEM_TYPE_VALUES.join(', ')}.`),
  itemModelNo: Yup.string().required('Item Model No is required'),
  itemGroup: Yup.string().required('Item Group is required'),
  subItemGroup: Yup.string().nullable().notRequired(),
  itemUnit: Yup.string().required('Item Unit is required'),
  description: Yup.string().required('Description is required'),
  sellingPrice: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
    .typeError('Selling Price must be a number')
    .nullable()
    .notRequired(),
  costPrice: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
    .typeError('Cost Price must be a number')
    .nullable()
    .notRequired(),
  salesAccount: Yup.string().nullable().notRequired(),
  purchaseAccount: Yup.string().nullable().notRequired(),
  inventoryAccount: Yup.string().nullable().notRequired(),
  isGoods: Yup.mixed().nullable(),
  isService: Yup.mixed()
    .nullable()
    .test('category-required', 'Please select either Goods or Service', function () {
      return parseBooleanImportValue(this.parent.isGoods) || parseBooleanImportValue(this.parent.isService);
    }),
  isSellable: Yup.mixed().nullable().notRequired(),
  isPurchasable: Yup.mixed().nullable().notRequired(),
  trackInventory: Yup.mixed().nullable().notRequired(),
  hsnCode: Yup.string().nullable().notRequired(),
  gst: Yup.string()
    .required('GST is required')
    .oneOf(
      GST_RATE_OPTIONS.map(option => option.value),
      `GST must be one of: ${GST_RATE_OPTIONS.map(option => option.value).join(', ')}`
    ),
}).test('item-role-consistency', 'Item role validation', function (values) {
  const isService = parseBooleanImportValue(values.isService);
  const isSellable = parseBooleanImportValue(values.isSellable);
  const isPurchasable = parseBooleanImportValue(values.isPurchasable);
  const trackInventory = parseBooleanImportValue(values.trackInventory);

  if (isService && trackInventory) {
    return this.createError({ path: 'trackInventory', message: 'A service item cannot track inventory.' });
  }
  if (!isSellable && !isPurchasable && !trackInventory) {
    return this.createError({ path: 'isSellable', message: 'Select at least one of Sellable, Purchasable or Track Inventory.' });
  }
  if (isSellable) {
    if (!(Number(values.sellingPrice) > 0)) {
      return this.createError({ path: 'sellingPrice', message: 'Selling price is required and must be greater than 0 when Sellable is on.' });
    }
    if (!values.salesAccount) {
      return this.createError({ path: 'salesAccount', message: 'Sales account is required for a sellable item.' });
    }
  }
  if (isPurchasable) {
    if (!(Number(values.costPrice) > 0)) {
      return this.createError({ path: 'costPrice', message: 'Cost price is required and must be greater than 0 when Purchasable is on.' });
    }
    if (!values.purchaseAccount) {
      return this.createError({ path: 'purchaseAccount', message: 'Purchase account is required for a purchasable item.' });
    }
  }
  if (trackInventory && !isService && !values.inventoryAccount) {
    return this.createError({ path: 'inventoryAccount', message: 'Inventory account is required when Track Inventory is Yes.' });
  }
  return true;
});
