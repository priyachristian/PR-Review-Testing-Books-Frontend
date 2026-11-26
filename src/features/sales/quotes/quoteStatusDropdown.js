import { BACKEND_ENUM, QUOTE_STATUS } from '@/utils/constants';

const draftStatus = { status: BACKEND_ENUM.DRAFT, label: QUOTE_STATUS.DRAFT };
const sentStatus = { status: BACKEND_ENUM.SENT, label: QUOTE_STATUS.SENT };
const acceptedStatus = { status: BACKEND_ENUM.ACCEPTED, label: QUOTE_STATUS.ACCEPTED };
const rejectedStatus = { status: BACKEND_ENUM.REJECTED, label: QUOTE_STATUS.REJECTED, confirm: true };
const completedStatus = { status: BACKEND_ENUM.COMPLETED, label: QUOTE_STATUS.COMPLETED };
const cancelStatus = { status: BACKEND_ENUM.CANCELLED, label: QUOTE_STATUS.CANCELLED, confirm: true };

export const QUOTE_STATUS_TRANSITIONS = {
  [BACKEND_ENUM.DRAFT]: [sentStatus, cancelStatus],

  [BACKEND_ENUM.SENT]: [acceptedStatus, rejectedStatus, draftStatus, cancelStatus],

  [BACKEND_ENUM.ACCEPTED]: [completedStatus, sentStatus, draftStatus, cancelStatus],

  [BACKEND_ENUM.REJECTED]: [draftStatus, cancelStatus],

  [BACKEND_ENUM.COMPLETED]: [cancelStatus],

  [BACKEND_ENUM.CANCELLED]: [draftStatus, sentStatus],

  default: [cancelStatus],
};
