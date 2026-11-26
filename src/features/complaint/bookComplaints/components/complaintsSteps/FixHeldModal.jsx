import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_FIX_HELD_RESULT_OPTIONS, COMPLAINT_STATUS } from '../../complaint.constants';
import { fixHeldSchema } from '../../complaint.schema';

const getVerified = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.VERIFIED.key)?.verified || null;

const getPreventiveAction = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.IN_PROGRESS.key)?.inProgress?.preventiveAction || null;

const FixHeldModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const existing = useMemo(() => getVerified(complaint), [complaint]);
  const preventiveAction = useMemo(() => getPreventiveAction(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      result: existing?.fixHeldResult || '',
      howKnow: existing?.howDoYouKnow || '',
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
      width={560}
      title="Did the fix actually hold?"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={fixHeldSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              {preventiveAction || 'Confirm the fix held before closing this complaint.'}
            </p>

            <CustomInput
              type="select"
              name="result"
              label="Did it work"
              placeholder="Select result"
              value={values.result}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.result}
              touched={touched.result}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_FIX_HELD_RESULT_OPTIONS}
              required
            />

            <CustomInput
              type="textarea"
              name="howKnow"
              label="How do you know"
              placeholder="How do you know the fix held?"
              rows={3}
              value={values.howKnow}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.howKnow}
              touched={touched.howKnow}
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

export default FixHeldModal;
