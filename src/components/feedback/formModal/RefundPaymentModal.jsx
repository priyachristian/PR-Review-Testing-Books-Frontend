import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import Toast from '@/components/ui/common/Toast';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';

import { usePaymentMade } from '@/features/purchase/paymentsMade/usePaymentMade';
import { usePaymentReceived } from '@/features/sales/paymentsReceived/usePaymentReceived';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { PAYMENT_MODE_OPTIONS } from '@/utils/constants';
import { refundPaymentSchema } from '@/utils/validationsSchema';
import { toApiDate } from '@/utils/util';

const RefundPaymentModal = ({ modalOpen, onClose, paymentDetails, fetchPayment, variant, editRefund = null }) => {
  const isPaymentMade = variant === 'paymentMade';
  const isEdit = !!editRefund;
  const { accountDrop, droploading, getAccounts } = useChartOfAccounts();

  const { addRefund: addRefundMade, updateRefund: updateRefundMade, refundLoading: refundLoadingMade } = usePaymentMade();
  const { addRefund: addRefundReceived, updateRefund: updateRefundReceived, refundLoading: refundLoadingReceived } = usePaymentReceived();

  const refundLoading = isPaymentMade ? refundLoadingMade : refundLoadingReceived;

  useEffect(() => {
    if (!modalOpen) return;
    getAccounts({ type: 'PAYMENT' });
  }, [modalOpen, getAccounts]);

  const initialValues = useMemo(
    () => ({
      refundedAt: editRefund?.refundedAt ? dayjs(editRefund.refundedAt) : dayjs(),
      amountRefunded: editRefund?.amountRefunded || '',
      paymentMode: editRefund?.paymentMode || '',
      accountId: (isPaymentMade ? editRefund?.toAccountId : editRefund?.fromAccountId) || '',
      description: editRefund?.description || '',
    }),
    [modalOpen, editRefund?._id, paymentDetails?._id, paymentDetails?.id]
  );

  const availableBalance = Number(paymentDetails?.availableBalance || paymentDetails?.unusedAmount || 0) + (isEdit ? Number(editRefund.amountRefunded || 0) : 0);

  const onFinish = async values => {
    const amountNum = Number(values.amountRefunded);

    if (amountNum > availableBalance) {
      Toast.warning('Refund amount exceeds available balance');
      return;
    }

    const bodyCore = {
      refundedAt: toApiDate(values.refundedAt),
      amountRefunded: amountNum,
      paymentMode: values.paymentMode,
      ...(isPaymentMade ? { toAccountId: values.accountId } : { fromAccountId: values.accountId }),
      description: values.description.trim(),
    };

    const paymentPk = paymentDetails?._id || paymentDetails?.id;

    try {
      if (isEdit) {
        const refundPk = editRefund._id || editRefund.id;
        if (isPaymentMade) {
          await updateRefundMade({
            ...bodyCore,
            paymentMadeId: paymentPk,
            refundId: refundPk,
          });
        } else {
          await updateRefundReceived({
            ...bodyCore,
            paymentReceivedId: paymentPk,
            refundId: refundPk,
          });
        }
      } else if (isPaymentMade) {
        await addRefundMade({
          ...bodyCore,
          paymentMadeId: paymentPk,
        });
      } else {
        await addRefundReceived({
          ...bodyCore,
          paymentReceivedId: paymentPk,
        });
      }
      if (fetchPayment) fetchPayment();
      onClose();
    } catch {
      // handled in slice
    }
  };

  const documentNoLabel = isPaymentMade ? 'Payment Made #' : 'Payment Received #';
  const documentNo = isPaymentMade ? paymentDetails?.paymentMadeId : paymentDetails?.paymentReceivedId;

  const counterpartyLabel = isPaymentMade ? 'Vendor Name' : 'Customer Name';
  const counterpartyName = isPaymentMade
    ? paymentDetails?.vendorId?.customerDisplayName || paymentDetails?.customerDisplayName
    : paymentDetails?.customerId?.customerDisplayName || paymentDetails?.customerDisplayName;

  const title = isEdit ? (isPaymentMade ? 'Edit refund — Payment made' : 'Edit refund — Payment received') : isPaymentMade ? 'Refund Payment Made' : 'Refund Payment Received';

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={onClose}
      destroyOnClose
      width={1000}
      title={
        <div className="flex items-center space-x-2">
          <Icons.CreditCardOutlined className="text-blue-500 text-lg" />
          <span className="text-lg font-semibold">{title}</span>
        </div>
      }
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2 mb-1">
              <Icons.FileTextOutlined className="text-blue-500" />
              <span className="text-sm font-medium text-gray-600">{documentNoLabel}</span>
            </div>
            <p className="text-base font-bold text-gray-900">{documentNo || '-'}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2 mb-1">
              <Icons.WalletOutlined className="text-green-500" />
              <span className="text-sm font-medium text-gray-600">Available Balance</span>
            </div>
            <p className="text-base font-bold text-green-600">{formatAmount(availableBalance, true, paymentDetails?.currency)}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center space-x-2 mb-1">
              <Icons.UserOutlined className="text-purple-500" />
              <span className="text-sm font-medium text-gray-600">{counterpartyLabel}</span>
            </div>
            <p className="text-base font-bold text-gray-900">{counterpartyName || '-'}</p>
          </div>
        </div>
      </div>

      <Formik initialValues={initialValues} validationSchema={refundPaymentSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue, setFieldTouched }) => (
          <CustomForm name="refund-payment" onFinish={handleSubmit}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <CustomInput
                  type="text"
                  label="Refund amount"
                  name="amountRefunded"
                  placeholder="Enter amount"
                  value={values.amountRefunded}
                  onChange={e => setFieldValue('amountRefunded', e.target.value)}
                  onBlur={handleBlur}
                  errorMessage={errors.amountRefunded}
                  touched={touched.amountRefunded}
                  setFieldValue={setFieldValue}
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="select"
                  label="Payment mode"
                  name="paymentMode"
                  placeholder="Select mode"
                  value={values.paymentMode}
                  onChange={value => setFieldValue('paymentMode', value)}
                  onBlur={handleBlur}
                  allowClear
                  errorMessage={errors.paymentMode}
                  touched={touched.paymentMode}
                  setFieldValue={setFieldValue}
                  selectOptions={PAYMENT_MODE_OPTIONS}
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="account"
                  label={isPaymentMade ? 'To Account' : 'From Account'}
                  name="accountId"
                  placeholder={isPaymentMade ? 'Select to account' : 'Select from account'}
                  value={values.accountId}
                  onChange={value => setFieldValue('accountId', value || '')}
                  onBlur={handleBlur}
                  errorMessage={errors.accountId}
                  touched={touched.accountId}
                  setFieldValue={setFieldValue}
                  selectOptions={accountDrop.PAYMENT}
                  loading={droploading}
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="date"
                  label="Refund date"
                  name="refundedAt"
                  value={values.refundedAt ? values.refundedAt : null}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  onBlur={handleBlur}
                  errorMessage={errors.refundedAt}
                  touched={touched.refundedAt}
                  placeholder="Select refund date"
                  format="YYYY-MM-DD"
                  required={true}
                />
              </div>
            </div>

            <div className="mb-6">
              <CustomInput
                type="textarea"
                label="Reason"
                name="description"
                placeholder="Enter reason for refund"
                value={values.description}
                onChange={e => setFieldValue('description', e.target.value)}
                onBlur={handleBlur}
                errorMessage={errors.description}
                touched={touched.description}
                setFieldValue={setFieldValue}
                rows={3}
                required={true}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
              <CustomButton className="px-4 py-2" type="default" text="Cancel" disabled={refundLoading} onClick={onClose} />
              <CustomButton className="px-4 py-2" type="primary" loading={refundLoading} text="Submit" onClick={handleSubmit} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RefundPaymentModal;
