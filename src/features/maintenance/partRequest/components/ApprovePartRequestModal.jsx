import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { approvePartRequestSchema } from '../partRequest.schema';
import { usePartRequest } from '../usePartRequest';

const buildApprovePayload = (partRequestId, values) => {
  const approvalRemark = values.approvalRemark?.trim();
  return {
    partRequestId,
    approvedQty: Number(values.approvedQty),
    ...(approvalRemark ? { approvalRemark } : {}),
  };
};

const ApprovePartRequestModal = ({ open, partRequest, onClose, onSuccess }) => {
  const { updateLoading, approvePartRequest } = usePartRequest();

  const requestedQty = Number(partRequest?.requestedQty);
  const initialValues = useMemo(
    () => ({
      requestedQty: Number.isFinite(requestedQty) ? requestedQty : null,
      approvedQty: Number.isFinite(requestedQty) ? requestedQty : '',
      approvalRemark: '',
    }),
    [requestedQty]
  );

  const handleSubmit = async values => {
    if (updateLoading) return;

    try {
      await approvePartRequest(buildApprovePayload(partRequest?.id || partRequest?._id, values));
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
      title="Approve Part Request"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={approvePartRequestSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="approvePartRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{partRequest?.mrNo ? <span className="font-semibold text-slate-900">{partRequest.mrNo}</span> : 'This part request'} will move to Approved.</p>

            <CustomInput
              type="number"
              name="approvedQty"
              label="Approved Qty"
              placeholder="Enter quantity"
              decimalPlaces={0}
              min={1}
              max={Number.isFinite(requestedQty) ? requestedQty : undefined}
              value={values.approvedQty}
              onBlur={handleBlur}
              errorMessage={errors.approvedQty}
              touched={touched.approvedQty}
              setFieldValue={setFieldValue}
              required
            />

            <CustomInput
              type="textarea"
              name="approvalRemark"
              label={
                <span>
                  Remark <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                </span>
              }
              placeholder="Add a remark"
              rows={3}
              value={values.approvalRemark}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.approvalRemark}
              touched={touched.approvalRemark}
              setFieldValue={setFieldValue}
            />

            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={updateLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Approve" type="primary" onClick={submitForm} loading={updateLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ApprovePartRequestModal;
