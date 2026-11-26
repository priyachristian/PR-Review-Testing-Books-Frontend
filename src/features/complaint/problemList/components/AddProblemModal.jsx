import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';
import { addProblemSchema } from '../problemList.schema';

const AddProblemModal = ({ open, onClose, parentName, inheritanceSummary, submitLoading = false, onSubmit }) => {
  const title = parentName ? `Add a problem under '${parentName}'` : 'Add a problem';

  const initialValues = { name: '' };

  const handleModalClose = () => onClose?.();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await onSubmit?.(values.name.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen) handleModalClose();
      }}
      destroyOnClose={true}
      title={title}
    >
      <Formik initialValues={initialValues} validationSchema={addProblemSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            {inheritanceSummary && (
              <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
                {inheritanceSummary}
              </p>
            )}

            <CustomInput
              type="text"
              name="name"
              label="What should the option say"
              className="mb-2"
              placeholder="Reflector comes loose"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
              setFieldValue={setFieldValue}
              required={true}
            />

            <div className="flex gap-4 justify-end items-center pt-7">
              <CustomButton
                className="px-7 py-4"
                text="Cancel"
                type="default"
                disabled={submitLoading || isSubmitting}
                onClick={() => {
                  resetForm();
                  handleModalClose();
                }}
              />
              <CustomButton className="px-7 py-4" text="Add it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AddProblemModal;
