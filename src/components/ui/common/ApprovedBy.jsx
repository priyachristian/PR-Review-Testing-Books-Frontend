import { CheckCircleOutlined } from '@ant-design/icons';

// Extras
import { dateFormateForUi } from 'utils/services';

const ApprovedBy = ({ data }) => {
  if (!data?.approvedBy && !data?.approvalDate) {
    return null;
  }

  const rowClass = 'flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 text-xs';
  const labelClass = 'text-gray-500 shrink-0';
  const valueClass = 'font-medium text-gray-900 break-words min-w-0 sm:flex-1 sm:pl-2 sm:text-right';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-green-50 border-b border-green-200">
        <h3 className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
          <CheckCircleOutlined className="w-3 h-3" />
          Approved By
        </h3>
      </div>
      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <div className={rowClass}>
          <span className={labelClass}>Approved by</span>
          <span className={valueClass}>{data?.approvedBy?.firstName ? `${data?.approvedBy?.firstName || ''} ${data?.approvedBy?.lastName || ''}`.trim() : '-'}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Approved at</span>
          <span className={valueClass}>{data?.approvalDate ? dateFormateForUi(data?.approvalDate) : '-'}</span>
        </div>
      </div>
    </div>
  );
};

export default ApprovedBy;
