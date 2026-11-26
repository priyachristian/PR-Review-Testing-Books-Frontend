import * as Yup from 'yup';

export const inventoryAdjustmentValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select a division'),
    branchId: Yup.string().required('Please select a branch'),
    warehouseId: Yup.string().required('Please select a warehouse'),
    inventoryAdjustmentNumber: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter an inventory adjustment number'),
    adjustmentDate: Yup.string().required('Please select a date'),
    reason: Yup.string().required('Please select a reason'),
    accountId: Yup.string().required('Please select an adjustment account'),
    items: Yup.array().itemTableRows(
      Yup.object().shape({
        itemId: Yup.string().required('Please select an item'),
        itemUnitId: Yup.string().required('Please select an item unit'),
        currentStock: Yup.number().typeError('Please enter a valid current stock').required('Current stock is required'),
        updatedStock: Yup.number().typeError('Please enter a valid updated stock').required('Updated stock is required'),
        adjustedStock: Yup.number().typeError('Please enter a valid adjusted quantity').required('Adjusted quantity is required'),
        purchasePrice: Yup.number()
          .nullable()
          .when('adjustedStock', {
            is: adjustedStock => Number(adjustedStock) > 0,
            then: schema => schema.typeError('Please enter a valid purchase price').required('Purchase price is required').moreThan(0, 'Purchase price must be greater than 0'),
            otherwise: schema => schema.notRequired().nullable(),
          }),
      })
    ),
  });
};
