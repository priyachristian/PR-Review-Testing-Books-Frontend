import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { moveToInProgressSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  whatHappened: '',
};

const MoveToInProgressModal = ({ open, onClose, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      resetForm();
      handleModalClose();
    } catch {
      // Slice already toasts the error; keep the modal open.
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
      destroyOnClose
      width={520}
      title="Move to In Progress"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={moveToInProgressSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Say in one line what you did. It goes on the record.
            </p>

            <CustomInput
              type="textarea"
              name="whatHappened"
              label="What happened"
              placeholder="Say in one line what you did"
              rows={3}
              value={values.whatHappened}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.whatHappened}
              touched={touched.whatHappened}
              setFieldValue={setFieldValue}
              required
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
              <CustomButton className="px-7 py-4" text="Save and move" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default MoveToInProgressModal;
