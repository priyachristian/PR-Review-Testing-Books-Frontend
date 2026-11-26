import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_STATUS } from '../../complaint.constants';
import { stopGapActionSchema } from '../../complaint.schema';

const getInProgress = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.IN_PROGRESS.key)?.inProgress || null;

const StopGapActionModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const existing = useMemo(() => getInProgress(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      whatYouDid: existing?.stopGapAction || '',
    }),
    [existing]
  );

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
      title="What did you do right away?"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={stopGapActionSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Before you know the real cause — stopped a dispatch, held the stock, told them not to fit it.
            </p>

            <CustomInput
              type="textarea"
              name="whatYouDid"
              label="What you did"
              placeholder="What did you do right away?"
              rows={3}
              value={values.whatYouDid}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.whatYouDid}
              touched={touched.whatYouDid}
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
              <CustomButton className="px-7 py-4" text="Save it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default StopGapActionModal;
