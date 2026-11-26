import { useMemo } from 'react';
import { Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { productionWarehouseConfigValidateSchema } from '@/features/setting/productionWarehouseConfig/productionWarehouseConfig.schema';
import { buildWarehouseSelectOptions, warehouseSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const getId = value => (typeof value === 'object' && value ? value._id || value.id || null : value || null);

const ProductionWarehouseConfigForm = ({ modalOpen, isEdit, handleModalClose, editingConfig, warehouseDrop, warehouseLoading, submitLoading, onSubmit }) => {
  const initialValues = useMemo(
    () => ({
      departmentName: isEdit && editingConfig ? editingConfig.departmentName || '' : '',
      rawMaterialWarehouseId: isEdit && editingConfig ? getId(editingConfig.rawMaterialWarehouseId) : null,
      productionWarehouseId: isEdit && editingConfig ? getId(editingConfig.productionWarehouseId) : null,
      finishedGoodsWarehouseId: isEdit && editingConfig ? getId(editingConfig.finishedGoodsWarehouseId) : null,
    }),
    [isEdit, editingConfig]
  );

  const warehouseOptions = useMemo(() => buildWarehouseSelectOptions(warehouseDrop), [warehouseDrop]);

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) handleModalClose();
      }}
      destroyOnClose
      title={isEdit ? 'Edit Production Warehouse Configuration' : 'Add Production Warehouse Configuration'}
    >
      <Formik initialValues={initialValues} validationSchema={productionWarehouseConfigValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="ProductionWarehouseConfigForm" onFinish={handleSubmit}>
            <CustomInput
              type="text"
              name="departmentName"
              label="Department Name"
              placeholder="e.g. Assembly"
              value={values.departmentName}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.departmentName}
              touched={touched.departmentName}
              setFieldValue={setFieldValue}
              required
            />
            <div className="mt-2">
              <CustomInput
                type="select"
                name="rawMaterialWarehouseId"
                label="Raw Material Warehouse"
                placeholder="Select raw material warehouse"
                value={values.rawMaterialWarehouseId}
                onChange={value => setFieldValue('rawMaterialWarehouseId', value)}
                onBlur={handleBlur}
                errorMessage={errors.rawMaterialWarehouseId}
                touched={touched.rawMaterialWarehouseId}
                setFieldValue={setFieldValue}
                selectOptions={warehouseOptions}
                loading={warehouseLoading}
                allowClear
                required
                selectVariant="twoColumn"
                columnSelectHeader={warehouseSelectColumnHeader}
              />
            </div>
            <div className="mt-2">
              <CustomInput
                type="select"
                name="productionWarehouseId"
                label="Production Warehouse"
                placeholder="Select production warehouse"
                value={values.productionWarehouseId}
                onChange={value => setFieldValue('productionWarehouseId', value)}
                onBlur={handleBlur}
                errorMessage={errors.productionWarehouseId}
                touched={touched.productionWarehouseId}
                setFieldValue={setFieldValue}
                selectOptions={warehouseOptions}
                loading={warehouseLoading}
                allowClear
                required
                selectVariant="twoColumn"
                columnSelectHeader={warehouseSelectColumnHeader}
              />
            </div>
            <div className="mt-2">
              <CustomInput
                type="select"
                name="finishedGoodsWarehouseId"
                label="Finished Goods Warehouse"
                placeholder="Select finished goods warehouse"
                value={values.finishedGoodsWarehouseId}
                onChange={value => setFieldValue('finishedGoodsWarehouseId', value)}
                onBlur={handleBlur}
                errorMessage={errors.finishedGoodsWarehouseId}
                touched={touched.finishedGoodsWarehouseId}
                setFieldValue={setFieldValue}
                selectOptions={warehouseOptions}
                loading={warehouseLoading}
                allowClear
                required
                selectVariant="twoColumn"
                columnSelectHeader={warehouseSelectColumnHeader}
              />
            </div>
            <div className="flex gap-3 justify-end items-center pt-3">
              <CustomButton
                text="Cancel"
                type="default"
                disabled={submitLoading}
                onClick={() => {
                  resetForm();
                  handleModalClose();
                }}
              />
              <CustomButton text="Save" type="primary" loading={submitLoading} onClick={handleSubmit} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ProductionWarehouseConfigForm;
