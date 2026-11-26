import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_STATUS, COMPLAINT_WARRANTY_POSITION_OPTIONS } from '../../complaint.constants';
import { warrantyCheckSchema } from '../../complaint.schema';

const getInProgress = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.IN_PROGRESS.key)?.inProgress || null;

const WarrantyCheckModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const existing = useMemo(() => getInProgress(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      position: existing?.warrantyPosition || '',
      why: existing?.warrantyWhy || existing?.why || '',
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
      title="Warranty check"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={warrantyCheckSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Decides whether we pay for it or the customer does.
            </p>

            <CustomInput
              type="select"
              name="position"
              label="Where does it stand"
              placeholder="Select warranty position"
              value={values.position}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.position}
              touched={touched.position}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_WARRANTY_POSITION_OPTIONS}
              required
            />

            <CustomInput
              type="text"
              name="why"
              label="Why"
              placeholder="Why does it stand there?"
              value={values.why}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.why}
              touched={touched.why}
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

export default WarrantyCheckModal;
