import { useMemo } from 'react';
import { Formik } from 'formik';

import { Upload } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_CHANNEL_OPTIONS, COMPLAINT_CONTACT_CHANNEL, COMPLAINT_STATUS } from '../../complaint.constants';
import { replyToCustomerSchema } from '../../complaint.schema';

const getAssignedReply = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.ASSIGNED.key)?.assigned || null;

const ReplyToCustomerModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const existingReply = useMemo(() => getAssignedReply(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      channel: existingReply?.channel || complaint?.contactChannel || COMPLAINT_CONTACT_CHANNEL.PHONE_CALL,
      message: existingReply?.message || '',
      proof: null,
    }),
    [existingReply, complaint?.contactChannel]
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
      title="Reply to the customer"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={replyToCustomerSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              They should hear back within {complaint?.replyWithinHours || 4} hours.
            </p>

            <CustomInput
              type="select"
              name="channel"
              label="How are you telling them"
              placeholder="Select channel"
              value={values.channel}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.channel}
              touched={touched.channel}
              setFieldValue={setFieldValue}
              selectOptions={COMPLAINT_CHANNEL_OPTIONS}
              required
            />

            <CustomInput
              type="textarea"
              name="message"
              label="What are you telling them"
              placeholder="What will you tell the customer?"
              rows={4}
              value={values.message}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.message}
              touched={touched.message}
              setFieldValue={setFieldValue}
              required
            />

            <div className="mb-1">
              <label htmlFor="reply-proof-upload" className="text-sm font-medium text-gray-800">
                Add proof <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
              </label>
              <Upload
                showUploadList={false}
                beforeUpload={file => {
                  setFieldValue('proof', file);
                  return false;
                }}
                className="block mt-1.5"
              >
                <button
                  id="reply-proof-upload"
                  type="button"
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  <Icons.PaperClipOutlined />
                  <span>{values.proof?.name || 'Call recording or written note'}</span>
                </button>
              </Upload>
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
              <CustomButton className="px-7 py-4" text="Save it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ReplyToCustomerModal;
