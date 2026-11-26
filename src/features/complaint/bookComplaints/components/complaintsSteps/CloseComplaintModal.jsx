import { useMemo } from 'react';
import { Formik } from 'formik';
import { Rate } from 'antd';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_STATUS } from '../../complaint.constants';
import { closeComplaintSchema } from '../../complaint.schema';

const getClosed = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.CLOSED.key)?.closed || null;

const CloseComplaintModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();
  const title = `Close ${complaint?.complaintNo || 'complaint'}`;

  const existing = useMemo(() => getClosed(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      howItEnded: existing?.howItEnded || '',
      customerRating: existing?.customerSatisfaction ?? null,
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
      title={title}
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={closeComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Say what finally settled it, and how happy the customer was.
            </p>

            <CustomInput
              type="textarea"
              name="howItEnded"
              label="How it ended"
              placeholder="What finally settled it?"
              rows={3}
              value={values.howItEnded}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.howItEnded}
              touched={touched.howItEnded}
              setFieldValue={setFieldValue}
              required
            />

            <div className="mb-2" role="group" aria-labelledby="customer-rating-label">
              <div id="customer-rating-label" className="text-sm font-medium text-gray-800">
                How happy is the customer
              </div>
              <div className="mt-1.5">
                <Rate value={values.customerRating} onChange={value => setFieldValue('customerRating', value)} style={{ color: colorPalette.warning[500] }} />
              </div>
              {touched.customerRating && errors.customerRating ? <p className="text-red-500 text-xs mt-1 mb-0">{errors.customerRating}</p> : null}
            </div>

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
              <CustomButton className="px-7 py-4" text="Close it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default CloseComplaintModal;
