import { useMemo } from 'react';
import { Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { itemUnitValidateSchema } from '@/features/setting/itemUnit/itemUnit.schema';
import { useItemUnit } from '@/features/setting/itemUnit';

const AddEditItemUnitModal = ({ modalOpen, isEdit, handleModalClose, editingUnit, onFormSubmit }) => {
  const { submitLoading, createItemUnit, updateItemUnit } = useItemUnit();

  const initialValues = useMemo(
    () => ({
      name: isEdit && editingUnit ? editingUnit.name : '',
    }),
    [isEdit, editingUnit, modalOpen]
  );

  const onSubmit = async values => {
    const payload = {
      name: values.name?.trim(),
    };
    const action = isEdit ? await updateItemUnit({ id: editingUnit._id || editingUnit.id, data: payload }) : await createItemUnit(payload);

    if (action?.meta?.requestStatus !== 'rejected') {
      onFormSubmit();
      handleModalClose();
    }
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) handleModalClose();
      }}
      destroyOnClose
      width={480}
      title={isEdit ? 'Edit Item Unit' : 'Add Item Unit'}
    >
      <Formik initialValues={initialValues} validationSchema={itemUnitValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="AddEditItemUnitModal" onFinish={handleSubmit}>
            <CustomInput
              type="text"
              name="name"
              label="Name"
              placeholder="e.g. Kilogram"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
              setFieldValue={setFieldValue}
              required
            />
            <div className="flex gap-3 justify-end items-center pt-4">
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

export default AddEditItemUnitModal;
