import { Formik } from 'formik';
import { PauseCircleOutlined } from '@ant-design/icons';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_WAITING_FOR_OPTIONS } from '../../complaint.constants';
import { waitingOnSomeoneSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  waitingFor: '',
  note: '',
};

const WaitingOnSomeoneModal = ({ open, onClose, submitLoading = false, onSubmit }) => {
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
      title="Waiting on someone?"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={waitingOnSomeoneSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              The clock stops while you wait, so this will not show up as late.
            </p>

            <CustomInput
              type="select"
              name="waitingFor"
              label="Waiting for what"
              placeholder="Select what you are waiting for"
              value={values.waitingFor}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.waitingFor}
              touched={touched.waitingFor}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_WAITING_FOR_OPTIONS}
              required
            />

            <CustomInput
              type="text"
              name="note"
              label="Why"
              placeholder="Why are you waiting?"
              value={values.note}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.note}
              touched={touched.note}
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
              <CustomButton className="px-7 py-4" text="Stop the clock" type="primary" icon={<PauseCircleOutlined />} loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default WaitingOnSomeoneModal;
