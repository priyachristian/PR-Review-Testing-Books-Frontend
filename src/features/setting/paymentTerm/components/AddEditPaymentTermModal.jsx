import { useMemo } from 'react';
import { Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { paymentTermValidateSchema } from '@/features/setting/paymentTerm/paymentTerm.schema';
import { usePaymentTerm } from '@/features/setting/paymentTerm';

const AddEditPaymentTermModal = ({ modalOpen, isEdit, handleModalClose, editingTerm, onFormSubmit }) => {
  const { submitLoading, createPaymentTerm, updatePaymentTerm } = usePaymentTerm();

  const initialValues = useMemo(
    () => ({
      name: isEdit && editingTerm ? editingTerm.name : '',
      days: isEdit && editingTerm ? editingTerm.days : '',
    }),
    [isEdit, editingTerm, modalOpen]
  );

  const onSubmit = async values => {
    const payload = {
      name: values.name?.trim(),
      days: Number(values.days),
    };
    const action = isEdit ? await updatePaymentTerm({ id: editingTerm._id || editingTerm.id, data: payload }) : await createPaymentTerm(payload);

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
      title={isEdit ? 'Edit Payment Term' : 'Add Payment Term'}
    >
      <Formik initialValues={initialValues} validationSchema={paymentTermValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="AddEditPaymentTermModal" onFinish={handleSubmit}>
            <CustomInput
              type="text"
              name="name"
              label="Name"
              placeholder="e.g. Net 30"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
              setFieldValue={setFieldValue}
              required
            />
            <div className="mt-2">
              <CustomInput
                type="number"
                name="days"
                label="Days"
                placeholder="e.g. 30"
                value={values.days}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.days}
                touched={touched.days}
                setFieldValue={setFieldValue}
                min={0}
                required
              />
            </div>
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

export default AddEditPaymentTermModal;
