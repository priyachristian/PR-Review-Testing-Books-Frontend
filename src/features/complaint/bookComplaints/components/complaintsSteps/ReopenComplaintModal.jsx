import { useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_REOPEN_REASON_OPTIONS, COMPLAINT_STATUS } from '../../complaint.constants';
import { reopenComplaintSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  reason: '',
  note: '',
};

const getClosedStep = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.CLOSED.key) || null;

const ReopenComplaintModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const closedOn = useMemo(() => {
    const closedStep = getClosedStep(complaint);
    const date = closedStep?.completedAt || complaint?.updatedAt;
    return date ? dayjs(date).format('DD/MM/YYYY') : null;
  }, [complaint]);

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
      title="Open it again?"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={reopenComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              {closedOn ? `Closed on ${closedOn}. ` : ''}Reopening is counted.
            </p>

            <CustomInput
              type="select"
              name="reason"
              label="Why"
              placeholder="Select why"
              value={values.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.reason}
              touched={touched.reason}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_REOPEN_REASON_OPTIONS}
              required
            />

            <CustomInput
              type="text"
              name="note"
              label={
                <span>
                  Anything to add <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
                </span>
              }
              placeholder="Add a short note"
              value={values.note}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.note}
              touched={touched.note}
              setFieldValue={setFieldValue}
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
              <CustomButton className="px-7 py-4" text="Open it again" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ReopenComplaintModal;
