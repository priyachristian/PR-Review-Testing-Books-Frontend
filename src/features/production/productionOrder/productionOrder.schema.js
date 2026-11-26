import * as Yup from 'yup';
import { PRODUCTION_MODULE_METHOD } from '@/utils/constants';

const menpowerRows = Yup.array().of(
  Yup.lazy(value => {
    const started = Boolean(value?.workerName || (value?.salary !== '' && value?.salary != null) || (value?.workerHours !== '' && value?.workerHours != null));
    return Yup.object({
      workerName: started ? Yup.string().required('Please select the worker') : Yup.string().nullable(),
      salary: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid salary')
            .required('Please enter the salary')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid salary')
            .nullable(),
      workerHours: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid worker hours')
            .required('Please enter the worker hours')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid worker hours')
            .nullable(),
      workerCost: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid worker cost')
            .required('Please enter the worker cost')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid worker cost')
            .nullable(),
    });
  })
);

const scrapOutRows = Yup.array().of(
  Yup.lazy(value => {
    const started = Boolean(value?.scrapItem);
    return Yup.object({
      scrapItem: Yup.string().nullable(),
      itemUnitId: started ? Yup.string().required('Please select an item unit') : Yup.string().nullable(),
      qty: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid quantity')
            .positive('Quantity must be greater than zero')
            .required('Please enter the quantity')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid quantity')
            .nullable(),
    });
  })
);

const additionalCostRows = Yup.array().of(
  Yup.lazy(value => {
    const started = Boolean(value?.notes || Number(value?.amount) > 0);
    return Yup.object({
      notes: started ? Yup.string().trim().required('Please enter the notes') : Yup.string().nullable(),
      amount: started
        ? Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid amount')
            .required('Please enter the amount')
        : Yup.number()
            .transform((v, o) => (o === '' ? null : v))
            .typeError('Please enter a valid amount')
            .nullable(),
    });
  })
);

export const processSubmitValidateSchema = Yup.object({
  processRawMaterial: Yup.array().of(
    Yup.lazy(value => {
      const started = Boolean(value?.item);
      return Yup.object({
        item: Yup.string().nullable(),
        itemUnitId: started ? Yup.string().required('Please select an item unit') : Yup.string().nullable(),
        qty: started
          ? Yup.number()
              .transform((v, o) => (o === '' ? null : v))
              .typeError('Please enter a valid quantity')
              .positive('Quantity must be greater than zero')
              .required('Please enter the quantity')
          : Yup.number()
              .transform((v, o) => (o === '' ? null : v))
              .typeError('Please enter a valid quantity')
              .nullable(),
      });
    })
  ),
  menpower: menpowerRows,
  scrapOutProcess: scrapOutRows,
  processOutcome: Yup.number()
    .transform((v, o) => (o === '' ? undefined : v))
    .typeError('Please enter a valid quantity')
    .min(0, 'Good output cannot be negative')
    .required('Please enter the good output')
    .test('reports-something', 'Please enter the good output or the rejected quantity', function (value) {
      return Number(value || 0) + Number(this.parent.processRejection || 0) > 0;
    }),
  processRejection: Yup.number()
    .transform((v, o) => (o === '' ? 0 : v))
    .typeError('Please enter a valid quantity')
    .min(0, 'Rejected quantity cannot be negative'),
  additionalCosts: additionalCostRows,
});

export const bomSubmitValidateSchema = Yup.object({
  fgSubmittedQty: Yup.number()
    .transform((v, o) => (o === '' ? undefined : v))
    .typeError('Please enter a valid quantity')
    .min(0, 'Submitted quantity cannot be negative')
    .required('Please enter the submitted quantity')
    .test('reports-something', 'Please enter the submitted quantity or the rejected quantity', function (value) {
      return Number(value || 0) + Number(this.parent.fgRejectedQty || 0) > 0;
    }),
  fgRejectedQty: Yup.number()
    .transform((v, o) => (o === '' ? 0 : v))
    .typeError('Please enter a valid quantity')
    .min(0, 'Rejected quantity cannot be negative'),
  rawMaterials: Yup.array().of(
    Yup.lazy(value => {
      const started = Boolean(value?.rawMaterialId);
      return Yup.object({
        rawMaterialId: Yup.string().nullable(),
        itemUnitId: started ? Yup.string().required('Please select an item unit') : Yup.string().nullable(),
        perItemRequiredUnit: started
          ? Yup.number()
              .transform((v, o) => (o === '' ? null : v))
              .typeError('Please enter a valid quantity')
              .min(0, 'Per item cannot be negative')
              .required('Please enter the per item quantity')
          : Yup.mixed().nullable(),
        rejectQty: Yup.number()
          .transform((v, o) => (o === '' ? 0 : v))
          .typeError('Please enter a valid quantity')
          .min(0, 'Reject quantity cannot be negative'),
      });
    })
  ),
  scrapOutProcess: scrapOutRows,
  menpower: menpowerRows,
  additionalCosts: additionalCostRows,
});

export const addProductionValidateSchema = autoGenerate =>
  Yup.object({
    productionOrderCode: autoGenerate ? Yup.string().notRequired() : Yup.string().required('Please enter the production order code'),
    production: Yup.boolean().required(),
    salesOrder: Yup.string().when('production', {
      is: true,
      then: schema => schema.required('Please select a sales order'),
      otherwise: schema => schema.notRequired(),
    }),
    item: Yup.string().when('production', {
      is: true,
      then: schema => schema.required('Please select an item'),
      otherwise: schema => schema.notRequired(),
    }),
    itemUnitId: Yup.string().required('Please select an item unit'),
    quantity: Yup.number()
      .typeError('Please enter a valid quantity')
      .positive('Quantity must be greater than 0')
      .test('max-3-decimals', 'Quantity can have up to 3 decimal places', value => {
        if (value == null) return true;
        return /^-?\d+(\.\d{1,3})?$/.test(String(value));
      })
      .required('Please enter the quantity'),

    // nonProdItem: Yup.string().when("production", {
    //   is: false,
    //   then: (schema) => schema.required("Please Select Item"),
    //   otherwise: (schema) => schema.notRequired(),
    // }),

    // divisionId: Yup.string().required("Please Select Division"),
    // branchId: Yup.string().required("Please Select Branch"),
    // warehouseId: Yup.string().required("Please Select Warehouse"),

    // dispatchDivisionId: Yup.string().required("Please Select Dispatch Division"),
    // dispatchBranchId: Yup.string().required("Please Select Dispatch Branch"),
    // dispatchWarehouseId: Yup.string().required("Please Select Dispatch Warehouse"),

    inStockWarehouseId: Yup.string().required('Please select an in-stock warehouse'),
    productionWarehouseId: Yup.string().required('Please select a production warehouse'),
    inventoryInwarehouseId: Yup.string().required('Please select an inventory warehouse'),
    productionDepartmentWarehouseConfigId: Yup.string().nullable(),

    productionManageMethod: Yup.string().oneOf(Object.values(PRODUCTION_MODULE_METHOD)).required('Please select a production method'),
  });

export const createProductionFromSalesOrderSchema = Yup.object({
  inStockWarehouseId: Yup.string().required('Please select an in-stock warehouse'),
  productionWarehouseId: Yup.string().required('Please select a production warehouse'),
  inventoryInwarehouseId: Yup.string().required('Please select an inventory warehouse'),
  departmentFilter: Yup.mixed().nullable(),
  productionOwner: Yup.array().of(Yup.string()),
  items: Yup.array()
    .of(
      Yup.object({
        itemId: Yup.string().required('Item is required'),
        quantity: Yup.number()
          .transform((value, originalValue) => (originalValue === '' ? 0 : value))
          .min(0),
      })
    )
    .min(1, 'At least one item is required')
    .required('Items are required'),
});
