import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { rejectRequestSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const rejectRequestInitialValues = {
  rejectReason: '',
};

const buildRejectPayload = (maintenanceRequestId, values) => ({
  maintenanceRequestId,
  rejectReason: values.rejectReason.trim(),
});

const RejectMaintenanceRequestModal = ({ open, request, onClose, onSuccess }) => {
  const { rejectLoading, rejectMaintenanceRequest } = useMaintenanceRequest();

  const handleSubmit = async values => {
    if (rejectLoading) return;

    try {
      await rejectMaintenanceRequest(buildRejectPayload(request?.id || request?._id, values));
      onSuccess?.();
      onClose();
    } catch {
      // The slice already shows the error toast.
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen && !rejectLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={rejectLoading}
      width={520}
      title="Reject Maintenance Request"
    >
      <Formik initialValues={rejectRequestInitialValues} validationSchema={rejectRequestSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="rejectMaintenanceRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">
              {request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'This request'} will be rejected. This cannot be undone from here.
            </p>
            <CustomInput
              type="textarea"
              name="rejectReason"
              label="Reject Reason"
              placeholder="Why is this request being rejected?"
              rows={3}
              value={values.rejectReason}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.rejectReason}
              touched={touched.rejectReason}
              setFieldValue={setFieldValue}
              required
            />
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={rejectLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Reject" type="danger" onClick={submitForm} loading={rejectLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RejectMaintenanceRequestModal;
