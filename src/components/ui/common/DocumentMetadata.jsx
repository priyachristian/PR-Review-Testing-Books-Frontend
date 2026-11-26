import { UserOutlined } from '@ant-design/icons';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Extras
import { dateFormateForUi } from 'utils/services';
import { colorPalette } from '@/utils/theme';

/**
 * Compact Document Metadata Component
 * Displays created/updated user information
 */
const DocumentMetadata = ({ data, showUpdatedBy = true, showCreatedFrom = false, showPriorityTag = false }) => {
  const rowClass = 'flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 text-xs';
  const labelClass = 'text-gray-500 shrink-0';
  const valueClass = 'font-medium text-gray-900 break-words min-w-0 sm:flex-1 sm:pl-2 sm:text-right';

  return (
    <div className="w-full min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <UserOutlined className="w-3 h-3" />
          Document Information
        </h3>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        {showPriorityTag && (
          <>
            <div className={rowClass}>
              <span className={labelClass}>Priority Tag</span>
              <span className={`${valueClass} flex sm:justify-end`}>
                {data?.tagId?.name ? <StatusBadge status={data.tagId?.id || data.tagId?._id} value={data.tagId.name} accentHex={data.tagId?.color} /> : '-'}
              </span>
            </div>
            <div className="border-t border-gray-100 my-1 sm:my-2" />
          </>
        )}

        {data?.currency?.code && (
          <>
            <div className={rowClass}>
              <span className={labelClass}>Currency</span>
              <span className={valueClass}>
                <StatusBadge value={`${data.currency.code}`.trim()} accentHex={colorPalette.primary[500]} />
              </span>
            </div>
            <div className="border-t border-gray-100 my-1 sm:my-2" />
          </>
        )}

        <div className={rowClass}>
          <span className={labelClass}>Created by</span>
          <span className={valueClass}>{`${data?.addedBy?.firstName || ''} ${data?.addedBy?.lastName || ''}`.trim() || '-'}</span>
        </div>
        <div className={rowClass}>
          <span className={labelClass}>Created at</span>
          <span className={valueClass}>{dateFormateForUi(data?.createdAt) || '-'}</span>
        </div>

        {showUpdatedBy && data?.updatedBy && (
          <>
            <div className="border-t border-gray-100 my-1 sm:my-2" />
            <div className={rowClass}>
              <span className={labelClass}>Updated by</span>
              <span className={valueClass}>{`${data?.updatedBy?.firstName || ''} ${data?.updatedBy?.lastName || ''}`.trim() || '-'}</span>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>Updated at</span>
              <span className={valueClass}>{dateFormateForUi(data?.updatedAt) || '-'}</span>
            </div>
          </>
        )}

        {showCreatedFrom && (
          <>
            <div className="border-t border-gray-100 my-1 sm:my-2" />
            <div className={rowClass}>
              <span className={labelClass}>Created From</span>
              <span className={valueClass}>{data?.appName || '-'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentMetadata;
