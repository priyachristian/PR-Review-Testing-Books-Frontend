import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_NOT_REAL_REASON_OPTIONS } from '../../complaint.constants';
import { notRealComplaintSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  reason: '',
  note: '',
};

const NotRealComplaintModal = ({ open, onClose, submitLoading = false, onSubmit }) => {
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
      title="Not a real complaint?"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={notRealComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              It stays on the customer&apos;s history but stops being counted.
            </p>

            <CustomInput
              type="select"
              name="reason"
              label="Why"
              placeholder="Select a reason"
              value={values.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.reason}
              touched={touched.reason}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_NOT_REAL_REASON_OPTIONS}
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
              <CustomButton
                className="px-7 py-4"
                text="Mark it"
                type="default"
                icon={<Icons.StopOutlined />}
                loading={submitLoading || isSubmitting}
                onClick={submitForm}
                style={{
                  backgroundColor: colorPalette.error[50],
                  borderColor: colorPalette.error[200],
                  color: colorPalette.error[700],
                }}
              />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default NotRealComplaintModal;
