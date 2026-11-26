import { Formik } from 'formik';
import { Alert } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { E_INVOICE_CANCELLATION_REASONS, E_WAY_BILL_CANCELLATION_REASONS, GST_DOCUMENT_CANCEL_MODE } from '@/utils/constants';
import { cancelEInvoiceSchema, cancelEWayBillSchema } from '../gstDocument.schema';

const E_INVOICE_REASON_OTHER = E_INVOICE_CANCELLATION_REASONS[4].value;

const MODE_CONFIG = {
  [GST_DOCUMENT_CANCEL_MODE.E_INVOICE]: {
    title: 'Cancel E-Invoice',
    formName: 'CancelEInvoiceForm',
    documentName: 'E-Invoice',
    validationSchema: cancelEInvoiceSchema,
    reasons: E_INVOICE_CANCELLATION_REASONS,
    remarkReason: E_INVOICE_REASON_OTHER,
    note: 'IRN can be cancelled only within 24 hours of generation.',
  },
  [GST_DOCUMENT_CANCEL_MODE.E_WAY_BILL]: {
    title: 'Cancel E-Way Bill',
    formName: 'CancelEWayBillForm',
    documentName: 'E-Way Bill',
    validationSchema: cancelEWayBillSchema,
    reasons: E_WAY_BILL_CANCELLATION_REASONS,
    remarkReason: null,
    note: 'E-Way Bill can be cancelled within 24 hours of generation.',
  },
};

/**
 * Cancel modal for e-invoice and e-way bill, shared by every document module.
 *
 * `onSubmit({ cancellationReasonCode, cancellationReasonRemarks })` makes the module's API call;
 * the modal stays open if it rejects. The caller closes the modal (clears `mode`) after a successful call.
 */
const CancelGstDocumentModal = ({ mode, onClose, onSubmit, loading = false }) => {
  const config = MODE_CONFIG[mode];
  if (!config) return null;

  const needsRemark = values => Boolean(config.remarkReason) && values.cancelReason === config.remarkReason;

  const handleSubmit = async values => {
    const payload = {
      cancellationReasonCode: values.cancelReason,
      ...(needsRemark(values) && { cancellationReasonRemarks: values.cancelRemark?.trim() }),
    };
    try {
      await onSubmit(payload);
    } catch (error) {
      // The API layer already reports the failure; keep the modal open so the user can retry.
    }
  };

  return (
    <CustomModal modalOpen={true} setModalOpen={onClose} title={config.title} width={560} destroyOnClose={true}>
      <Formik key={mode} initialValues={{ cancelReason: null, cancelRemark: '' }} validationSchema={config.validationSchema} onSubmit={handleSubmit}>
        {({ values, setFieldValue, handleSubmit: submitForm, errors, touched }) => (
          <CustomForm name={config.formName} onFinish={submitForm} onFinishFailed={() => {}}>
            <div className="space-y-4">
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to cancel this {config.documentName}?</p>

              <CustomInput
                type="select"
                name="cancelReason"
                label="Cancellation Reason"
                errorMessage={errors.cancelReason}
                touched={touched.cancelReason}
                value={values.cancelReason}
                setFieldValue={setFieldValue}
                options={Object.values(config.reasons)}
                placeholder="Select a reason"
                required
              />

              {needsRemark(values) && (
                <CustomInput
                  type="text"
                  name="cancelRemark"
                  label="Remark"
                  placeholder="Enter remark"
                  errorMessage={errors.cancelRemark}
                  touched={touched.cancelRemark}
                  value={values.cancelRemark}
                  setFieldValue={setFieldValue}
                  required
                />
              )}

              <Alert type="warning" showIcon message={config.note} />

              <div className="flex justify-end gap-5 border-t border-gray-100 pt-4">
                <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={loading} onClick={onClose} />
                <CustomButton
                  className="px-8 py-4"
                  type="primary"
                  text="Confirm Cancellation"
                  loading={loading}
                  onClick={submitForm}
                  disabled={!values.cancelReason || (needsRemark(values) && !values.cancelRemark?.trim()) || loading}
                />
              </div>
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default CancelGstDocumentModal;
