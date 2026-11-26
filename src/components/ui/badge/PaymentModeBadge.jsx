import { Tag } from 'antd';
import { PAYMENT_MODES, PAYMENT_MODE_OPTIONS } from '@/utils/constants';

const PaymentModeBadge = ({ paymentMode }) => {
  const label = PAYMENT_MODE_OPTIONS.find(option => option.value === paymentMode)?.label || paymentMode || '-';
  let color;

  switch (paymentMode) {
    case PAYMENT_MODES.PETTY_CASH:
      color = 'orange';
      break;
    case PAYMENT_MODES.CHEQUE:
      color = 'blue';
      break;
    case PAYMENT_MODES.BANK_TRANSFER:
      color = 'green';
      break;
    case PAYMENT_MODES.UPI:
      color = 'purple';
      break;
    case PAYMENT_MODES.OTHER:
      color = 'default';
      break;
    default:
      color = 'default';
  }

  return (
    <Tag className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium w-fit whitespace-nowrap" color={color}>
      {label}
    </Tag>
  );
};

export default PaymentModeBadge;
