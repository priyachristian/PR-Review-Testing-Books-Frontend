import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { issuePartRequestSchema } from '../partRequest.schema';
import { usePartRequest } from '../usePartRequest';

const buildIssuePayload = (partRequestId, values) => ({
  partRequestId,
  issuedQty: Number(values.issuedQty),
});

const IssuePartRequestModal = ({ open, partRequest, onClose, onSuccess }) => {
  const { updateLoading, issuePartRequest } = usePartRequest();

  const approvedQty = Number(partRequest?.approvedQty);
  const initialValues = useMemo(
    () => ({
      approvedQty: Number.isFinite(approvedQty) ? approvedQty : null,
      issuedQty: Number.isFinite(approvedQty) ? approvedQty : '',
    }),
    [approvedQty]
  );

  const handleSubmit = async values => {
    if (updateLoading) return;

    try {
      await issuePartRequest(buildIssuePayload(partRequest?.id || partRequest?._id, values));
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
        if (!nextOpen && !updateLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={updateLoading}
      width={520}
      title="Issue Part Request"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={issuePartRequestSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="issuePartRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{partRequest?.mrNo ? <span className="font-semibold text-slate-900">{partRequest.mrNo}</span> : 'This part request'} will move to Issued.</p>

            <CustomInput
              type="number"
              name="issuedQty"
              label="Issued Qty"
              placeholder="Enter quantity"
              decimalPlaces={0}
              min={1}
              max={Number.isFinite(approvedQty) ? approvedQty : undefined}
              value={values.issuedQty}
              onBlur={handleBlur}
              errorMessage={errors.issuedQty}
              touched={touched.issuedQty}
              setFieldValue={setFieldValue}
              required
            />

            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={updateLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Issue" type="primary" onClick={submitForm} loading={updateLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default IssuePartRequestModal;
