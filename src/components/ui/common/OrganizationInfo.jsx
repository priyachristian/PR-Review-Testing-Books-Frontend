/**
 * Compact Organization Information Component
 * Displays division, branch, and warehouse details
 * Handles both flat structure (divisionName) and nested structure (divisionId.name)
 */
const OrganizationInfo = ({ data, title = 'Organization' }) => {
  const infoList = [
    {
      label: 'Division',
      value: data?.divisionName || data?.divisionId?.name || '-',
    },
    {
      label: 'Branch',
      value: data?.branchName || data?.branchId?.name || '-',
    },
    {
      label: 'Warehouse',
      value: data?.warehouseName || data?.warehouseId?.name || '-',
    },
  ];

  const rowClass = 'flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 text-xs';
  const labelClass = 'text-gray-500 shrink-0';
  const valueBaseClass = 'font-medium break-words min-w-0 sm:flex-1 sm:pl-2 sm:text-right';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        {infoList.map((item, index) => (
          <div key={index} className={rowClass}>
            <span className={labelClass}>{item.label}</span>
            <span className={`${valueBaseClass} ${item.value === '-' ? 'text-gray-400' : 'text-gray-900'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrganizationInfo;
