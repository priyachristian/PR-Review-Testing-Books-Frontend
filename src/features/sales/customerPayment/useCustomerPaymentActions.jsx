// React
import { useCallback, useState } from 'react';

// Third Party
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import RejectionReasonModal from './components/RejectionReasonModal';
import SelectDocumentLocationModal from '@/components/feedback/formModal/SelectDocumentLocationModal';

// Hooks
import { useCustomerPayments } from './useCustomerPayments';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Utils
import { RESOURCES } from '@/utils/jsonFile';
import { formatAmount } from '@/utils/currency';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { ADDITIONAL_FEATURES, BACKEND_ENUM, MODULE_NAMES, MODULE_NAMES_LABELS, CUSTOMER_PAYMENT_STATUS, PERMISSION_MESSAGES } from 'utils/constants';

export const CUSTOMER_PAYMENT_LABEL = MODULE_NAMES_LABELS[MODULE_NAMES.CUSTOMER_PAYMENT];
export const PAYMENT_RECEIVED_LABEL = MODULE_NAMES_LABELS[MODULE_NAMES.PAYMENT_RECEIVED];

// Backend status keys for customer payments (CUSTOMER_PAYMENT_STATUS maps these to labels).
export const CP_STATUS = { SUBMITTED: 'SUBMITTED', APPROVED: 'APPROVED', REJECTED: 'REJECTED', CANCELLED: 'CANCELLED' };

export const getRefId = ref => ref?._id || ref?.id || ref || null;
const getCustomerName = payment => payment?.customerId?.customerDisplayName || payment?.customerId?.companyName || '-';

/**
 * Record (approve into a Payment Received) and Reject actions for a customer payment, shared by the
 * list three-dot menu and the detail page so both apply the same rules and prefill.
 * Render `actionModals` once in the page. `onRejected(payment)` runs after a successful reject.
 */
export const useCustomerPaymentActions = ({ onRejected } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submitLoading, rejectCustomerPayment } = useCustomerPayments();
  const { useModuleCustomerPayment, useModulePaymentReceived, isViewOnly } = useModulePermissions(RESOURCES.CUSTOMER_PAYMENT);
  const { activeFeatures } = useProfile();
  const isPlanAvailable = !!activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];

  const [recordTarget, setRecordTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // First failing rule wins, so the tooltip always names the actual reason an action is disabled.
  const getBlockReasons = useCallback(
    payment => {
      const statusMsg = PERMISSION_MESSAGES.alreadyInStatus('payment', CUSTOMER_PAYMENT_STATUS?.[payment?.status] || payment?.status);
      const isSubmitted = payment?.status === CP_STATUS.SUBMITTED;

      const common = action => {
        if (!isPlanAvailable) return PERMISSION_MESSAGES.UPGRADE_PLAN;
        if (!useModuleCustomerPayment?.edit) return PERMISSION_MESSAGES.noActionPermission(action, CUSTOMER_PAYMENT_LABEL);
        return null;
      };

      const record =
        common('record') ||
        (!useModulePaymentReceived?.create && PERMISSION_MESSAGES.requiresModuleRight('Recording', PAYMENT_RECEIVED_LABEL, 'create')) ||
        (isViewOnly && PERMISSION_MESSAGES.VIEW_ONLY) ||
        (!isSubmitted && statusMsg) ||
        null;
      const reject = common('reject') || (isViewOnly && PERMISSION_MESSAGES.VIEW_ONLY) || (!isSubmitted && statusMsg) || null;

      return { recordBlockReason: record, rejectBlockReason: reject };
    },
    [isPlanAvailable, useModuleCustomerPayment?.edit, useModulePaymentReceived?.create, isViewOnly]
  );

  const openRecord = useCallback(payment => setRecordTarget(payment), []);
  const openReject = useCallback(payment => setRejectTarget(payment), []);

  // Record = create a real PaymentReceived prefilled from this submission. The Add Payment Received
  // flow (journal, validation, invoice allocation) is reused as-is; on save it links back to this
  // submission via the record endpoint (see AddPaymentReceived).
  // Location refs go as { id, name } objects because the Add form reads `.id`/`._id`; invoices go as
  // plain ids so the form resolves them against live balances, not this snapshot.
  const handleRecord = selectedLocation => {
    const payment = recordTarget;
    const toRef = (id, name) => (id ? { _id: id, id, name } : null);
    const depositToAccountId = getRefId(payment?.depositToAccountId);

    const paymentReceivedData = {
      customerId: payment?.customerId,
      paymentDate: payment?.paymentDate,
      paymentMode: payment?.paymentMode,
      depositToAccountId: depositToAccountId ? { _id: depositToAccountId } : null,
      reference: payment?.reference,
      amountReceived: payment?.amount,
      currency: payment?.currency,
      invoices: (payment?.invoices || []).map(inv => ({ invoiceId: getRefId(inv?.invoiceId), invoiceNo: inv?.invoiceNo, amountApplied: inv?.amountApplied })),
      divisionId: toRef(selectedLocation.divisionId, selectedLocation.divisionName),
      branchId: toRef(selectedLocation.branchId, selectedLocation.branchName),
      warehouseId: toRef(selectedLocation.warehouseId, selectedLocation.warehouseName),
    };

    setRecordTarget(null);

    navigate(`/${ADMIN_ROUTE_PATHS.paymentsReceived.new}`, {
      state: {
        paymentReceivedData,
        customerPaymentId: getRefId(payment),
        customerPaymentNo: payment?.customerPaymentId,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleReject = async rejectionReason => {
    const payment = rejectTarget;
    await rejectCustomerPayment({ customerPaymentId: getRefId(payment), rejectionReason });
    setRejectTarget(null);
    onRejected?.(payment);
  };

  const actionModals = (
    <>
      <RejectionReasonModal
        open={Boolean(rejectTarget)}
        idValue={rejectTarget?.customerPaymentId}
        status={BACKEND_ENUM?.REJECTED}
        statusLabelMap={CUSTOMER_PAYMENT_STATUS}
        idLabel="Payment No"
        onCancel={() => setRejectTarget(null)}
        onSubmit={handleReject}
        loading={submitLoading}
      />

      <SelectDocumentLocationModal
        open={Boolean(recordTarget)}
        onClose={() => setRecordTarget(null)}
        onSubmit={handleRecord}
        title={`Record as ${PAYMENT_RECEIVED_LABEL}`}
        submitText="Record Payment"
        resource={RESOURCES.PAYMENT_RECEIVED}
        summary={[
          { label: 'Payment#', value: recordTarget?.customerPaymentId },
          { label: 'Customer Name', value: getCustomerName(recordTarget) },
          { label: 'Amount', value: formatAmount(recordTarget?.amount, true, recordTarget?.currency) },
        ]}
      />
    </>
  );

  return { getBlockReasons, openRecord, openReject, actionModals, submitLoading };
};
