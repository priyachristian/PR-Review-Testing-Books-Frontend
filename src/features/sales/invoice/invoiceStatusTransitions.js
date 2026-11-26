import { BACKEND_ENUM, INVOICE_STATUS } from '@/utils/constants';

const sentStatus = { status: BACKEND_ENUM.SENT, label: INVOICE_STATUS.SENT };
const cancelledStatus = { status: BACKEND_ENUM.CANCELLED, label: INVOICE_STATUS.CANCELLED, confirm: true };

export const INVOICE_STATUS_TRANSITIONS = {
  [BACKEND_ENUM.DRAFT]: [sentStatus, cancelledStatus],

  [BACKEND_ENUM.SENT]: [cancelledStatus],

  default: [cancelledStatus],
};
