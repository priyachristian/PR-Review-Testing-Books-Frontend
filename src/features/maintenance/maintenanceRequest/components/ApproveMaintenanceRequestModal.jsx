import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { approveRequestSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const approveRequestInitialValues = {
  remark: '',
};

const buildApprovePayload = (maintenanceRequestId, values) => {
  const remark = values.remark?.trim();
  return {
    maintenanceRequestId,
    ...(remark ? { remark } : {}),
  };
};

const ApproveMaintenanceRequestModal = ({ open, request, onClose, onSuccess }) => {
  const { approveLoading, approveMaintenanceRequest } = useMaintenanceRequest();

  const handleSubmit = async values => {
    if (approveLoading) return;

    try {
      await approveMaintenanceRequest(buildApprovePayload(request?.id || request?._id, values));
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
        if (!nextOpen && !approveLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={approveLoading}
      width={520}
      title="Approve Maintenance Request"
    >
      <Formik initialValues={approveRequestInitialValues} validationSchema={approveRequestSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="approveMaintenanceRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'This request'} will move to Approved.</p>
            <CustomInput
              type="textarea"
              name="remark"
              label={
                <span>
                  Remark <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                </span>
              }
              placeholder="Add a remark"
              rows={3}
              value={values.remark}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.remark}
              touched={touched.remark}
              setFieldValue={setFieldValue}
            />
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={approveLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Approve" type="primary" onClick={submitForm} loading={approveLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ApproveMaintenanceRequestModal;
