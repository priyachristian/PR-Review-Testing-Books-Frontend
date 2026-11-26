import * as Yup from 'yup';

export const productionWarehouseConfigValidateSchema = Yup.object({
  departmentName: Yup.string().trim().required('Department name is required'),
  rawMaterialWarehouseId: Yup.string().required('Raw material warehouse is required'),
  productionWarehouseId: Yup.string().required('Production warehouse is required'),
  finishedGoodsWarehouseId: Yup.string().required('Finished goods warehouse is required'),
});
