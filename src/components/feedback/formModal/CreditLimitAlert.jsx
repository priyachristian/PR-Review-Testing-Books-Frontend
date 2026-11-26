// Components
import { Alert } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { ALERT_TYPE } from '@/utils/constants';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import CloseIconButton from '@/components/ui/button/CloseIconButton';

const CreditLimitAlert = ({ open, onClose, alertData, alertType = ALERT_TYPE?.WARNING }) => {
  let { data = {}, message = 'Something went wrong' } = alertData;

  let usagePercentColor = 'bg-green-600';
  if (data?.usagePercent > 50 && data?.usagePercent <= 75) {
    usagePercentColor = 'bg-yellow-600';
  } else if (data?.usagePercent > 75) {
    usagePercentColor = 'bg-red-600';
  }

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={next => {
        if (!next) onClose();
      }}
      title={null}
      width={420}
      centered={true}
      showCloseIcon={false}
      className="credit-limit-modal"
      styles={{
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        },
        content: {
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex justify-between items-center gap-3 pb-3 border-b border-slate-200 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: alertType?.color }}>
              <span className="text-white text-lg font-bold">
                <Icons.InfoCircleOutlined />
              </span>
            </div>
            <div>
              <span className="font-bold text-base text-slate-800">Credit Limit Status</span>
              <div className="text-xs text-slate-500 mt-0.5">Branch: {data?.branchName}</div>
            </div>
          </div>
          {/* Close Button - Top Right */}
          <CloseIconButton onClick={onClose} />
        </div>
        {/* Credit Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Credit Limit */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Limit</div>
            <div className="text-lg font-bold text-emerald-600">{formatAmount(data?.totalCreditLimit)}</div>
          </div>
          {/* Current Usage */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
            <div className="text-xs text-slate-500 mb-1">Current Usage</div>
            <div className="text-lg font-bold text-red-600">{formatAmount(data?.currentUsage)}</div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-medium">Available Credit</span>
            <span className="text-xs text-emerald-600 font-semibold">{data?.currentUsage > data?.totalCreditLimit ? formatAmount(0) : formatAmount(data?.remainingLimit)}</span>
          </div>
          {data?.currentUsage > data?.totalCreditLimit && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-medium">Exceeded Credit</span>
              <span className="text-xs text-red-600 font-semibold">{formatAmount(data?.currentUsage - data?.totalCreditLimit)}</span>
            </div>
          )}
          <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
            <div className={`h-full ${usagePercentColor} rounded transition-all duration-300 ease-in-out`} style={{ width: `${data?.usagePercent}%` }} />
          </div>
          <div className="text-[11px] mt-1.5 text-center">{data?.usagePercent}% Used</div>
        </div>
        {/* Status Message */}
        <Alert message={message} type={alertType?.type} />
      </div>
    </CustomModal>
  );
};

export default CreditLimitAlert;
