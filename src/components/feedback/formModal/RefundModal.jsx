import { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useCreditNote, refundSchema } from '@/features/sales/creditNotes';
import { useDebitNote, refundValidateSchema } from '@/features/purchase/debitNotes';
import { formatAmount } from '@/utils/currency';
import { toApiDate } from '@/utils/util';
import Toast from '@/components/ui/common/Toast';

const RefundModal = ({ modalOpen, onClose, variant, documentDetails, fetchAfterRefund }) => {
  const { accountDrop, droploading, getAccounts } = useChartOfAccounts();
  const { createCreditNoteRefund, creditNoteRefundLoading } = useCreditNote();
  const { createDebitNoteRefund, debitNoteRefundLoading } = useDebitNote();

  const title = variant === 'credit' ? 'Refund Credit Notes' : 'Refund Debit Note';
  const validationSchema = variant === 'credit' ? refundSchema : refundValidateSchema;
  const submitLoading = variant === 'credit' ? creditNoteRefundLoading : debitNoteRefundLoading;

  useEffect(() => {
    if (!modalOpen) return;
    getAccounts({ type: 'PAYMENT' });
  }, [modalOpen, getAccounts]);

  const summaryItems = useMemo(() => {
    if (variant === 'credit') {
      return [
        { label: 'Credit Note#', value: documentDetails?.creditNoteId || '-' },
        {
          label: 'Available Balance',
          value: formatAmount(documentDetails?.availableBalance || 0),
        },
        {
          label: 'Customer Name',
          value: documentDetails?.customerId?.customerDisplayName || documentDetails?.customerDisplayName || '-',
        },
      ];
    }
    return [
      { label: 'Debit Note#', value: documentDetails?.debitNoteId || '-' },
      {
        label: 'Available Balance',
        value: formatAmount(documentDetails?.availableBalance || 0),
      },
      {
        label: 'Vendor Name',
        value: documentDetails?.vendorId?.customerDisplayName || documentDetails?.customerDisplayName || '-',
      },
    ];
  }, [variant, documentDetails]);

  const initialValues = useMemo(
    () => ({
      refundAmount: '',
      refundDate: dayjs(),
      accountId: '',
      reference: '',
      notes: '',
      availableBalance: documentDetails?.availableBalance || 0,
    }),
    [documentDetails?.id, documentDetails?.availableBalance]
  );

  const handleSubmit = async values => {
    try {
      if (variant === 'credit') {
        await createCreditNoteRefund({
          creditNoteId: documentDetails?.id || documentDetails?._id,
          refundAmount: values.refundAmount,
          refundDate: toApiDate(values.refundDate),
          fromAccountId: values.accountId,
          reference: values.reference,
          notes: values.notes,
        });
      } else {
        await createDebitNoteRefund({
          debitNoteId: documentDetails?.id || documentDetails?._id,
          refundAmount: values.refundAmount,
          refundDate: toApiDate(values.refundDate),
          toAccountId: values.accountId,
          reference: values.reference,
          notes: values.notes,
        });
      }
      if (fetchAfterRefund) fetchAfterRefund();
      onClose();
    } catch (error) {
      Toast.error(error.message);
    }
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) onClose();
      }}
      title={title}
      width={600}
      destroyOnClose={true}
    >
      <div className="bg-[#fafafa] mb-5 rounded-md p-4 border-b border-gray-100 shadow-sm">
        <div className="flex gap-10">
          {summaryItems.map(({ label, value }) => (
            <div key={label}>
              <p>{label}</p>
              <p className="font-bold">{value == null || value === '' ? '-' : value}</p>
            </div>
          ))}
        </div>
      </div>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue, setFieldTouched }) => (
          <CustomForm name="refund" onFinish={handleSubmit}>
            <div className="space-y-2">
              <div>
                <CustomInput
                  name="refundAmount"
                  label="Refund Amount"
                  type="number"
                  placeholder="Enter refund amount"
                  max={values.availableBalance}
                  min={0.01}
                  step="0.01"
                  setFieldValue={setFieldValue}
                  value={values.refundAmount}
                  onBlur={handleBlur}
                  errorMessage={errors.refundAmount}
                  touched={touched.refundAmount}
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="date"
                  label="Refund Date"
                  name="refundDate"
                  value={values.refundDate ? values.refundDate : null}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  onBlur={handleBlur}
                  placeholder="Select Refund Date"
                  format="YYYY-MM-DD"
                  errorMessage={errors.refundDate}
                  touched={touched.refundDate}
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="account"
                  name="accountId"
                  label={variant === 'credit' ? 'From Account' : 'To Account'}
                  required
                  placeholder={variant === 'credit' ? 'Select from account' : 'Select to account'}
                  value={values.accountId}
                  onChange={value => setFieldValue('accountId', value || '')}
                  onBlur={handleBlur}
                  errorMessage={errors.accountId}
                  touched={touched.accountId}
                  setFieldValue={setFieldValue}
                  selectOptions={accountDrop.PAYMENT}
                  loading={droploading}
                />
              </div>

              <div>
                <CustomInput name="reference" label="Reference" placeholder="Enter reference number" setFieldValue={setFieldValue} value={values.reference} onBlur={handleBlur} />
              </div>

              <div>
                <CustomInput name="notes" type="textarea" label="Notes" rows={3} placeholder="Enter notes (optional)" setFieldValue={setFieldValue} value={values.notes} onBlur={handleBlur} />
              </div>
            </div>

            <div className="flex mt-5 gap-5 justify-end">
              <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={onClose} />
              <CustomButton className="px-8 py-4" type="primary" text="Process Refund" loading={submitLoading} onClick={handleSubmit} style={{ minWidth: 130 }} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RefundModal;
