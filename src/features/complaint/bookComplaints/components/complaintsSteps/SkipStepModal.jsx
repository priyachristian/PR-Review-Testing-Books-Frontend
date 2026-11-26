import { Formik } from 'formik';
import { ForwardOutlined } from '@ant-design/icons';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { skipStepSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  skipReason: '',
};

const SkipStepModal = ({ open, onClose, submitLoading = false, onSubmit }) => {
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
      title="Skip this step?"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={skipStepSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Only use this when the step is not needed for this case.
            </p>

            <CustomInput
              type="textarea"
              name="skipReason"
              label="Why skip"
              placeholder="Not needed for this case"
              rows={3}
              value={values.skipReason}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.skipReason}
              touched={touched.skipReason}
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
              <CustomButton className="px-7 py-4" text="Skip step" type="primary" icon={<ForwardOutlined />} loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default SkipStepModal;
