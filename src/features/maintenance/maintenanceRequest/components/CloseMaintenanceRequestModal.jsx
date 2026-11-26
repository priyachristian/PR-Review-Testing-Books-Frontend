import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { closeRequestSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const closeRequestInitialValues = {
  closeRemark: '',
  isFirstTimeFix: false,
};

const buildClosePayload = (maintenanceRequestId, values) => {
  const closeRemark = values.closeRemark?.trim();

  return {
    maintenanceRequestId,
    ...(closeRemark ? { closeRemark } : {}),
    ...(values.isFirstTimeFix ? { isFirstTimeFix: true } : {}),
  };
};

const CloseMaintenanceRequestModal = ({ open, request, onClose, onSuccess }) => {
  const { closeLoading, closeMaintenanceRequest } = useMaintenanceRequest();

  const handleSubmit = async values => {
    if (closeLoading) return;

    try {
      await closeMaintenanceRequest(buildClosePayload(request?.id || request?._id, values));
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
        if (!nextOpen && !closeLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={closeLoading}
      width={520}
      title="Verify & Close"
    >
      <Formik initialValues={closeRequestInitialValues} validationSchema={closeRequestSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="closeMaintenanceRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'This request'} will move to Closed.</p>
            <CustomInput
              type="textarea"
              name="closeRemark"
              label={
                <span>
                  Remark <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                </span>
              }
              placeholder="Add a remark"
              rows={3}
              value={values.closeRemark}
              onBlur={handleBlur}
              errorMessage={errors.closeRemark}
              touched={touched.closeRemark}
              setFieldValue={setFieldValue}
            />
            <div className="mt-3">
              <CustomInput type="checkbox" name="isFirstTimeFix" label="" CheckboxName="First time fix" value={values.isFirstTimeFix} onBlur={handleBlur} setFieldValue={setFieldValue} />
            </div>
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={closeLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Verify & Close" type="primary" onClick={submitForm} loading={closeLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default CloseMaintenanceRequestModal;
