import { Tooltip } from '@/components/AntDComponent';

export const DETAIL_LABEL_CLASS = 'block font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase';
export const DETAIL_LABEL_INLINE_CLASS = 'inline-flex items-center gap-1 font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase';
export const DETAIL_VALUE_CLASS = 'text-[13px] font-medium text-[#1e293b] leading-5';
export const TABLE_HEAD_CLASS = 'py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase';
export const TABLE_CELL_CLASS = 'py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5';

const DetailField = ({ label, value, children, labelSuffix, className = '', valueClassName = '', truncate = true }) => {
  const displayValue = value?.toString()?.trim() ? value : '-';

  return (
    <div className={`min-w-0 pr-4 ${className}`.trim()}>
      <span className={labelSuffix ? DETAIL_LABEL_INLINE_CLASS : DETAIL_LABEL_CLASS}>
        {label}
        {labelSuffix}
      </span>
      {children !== undefined ? (
        <div className={`${DETAIL_VALUE_CLASS} overflow-hidden ${valueClassName}`.trim()}>{children}</div>
      ) : truncate ? (
        <Tooltip title={displayValue !== '-' ? displayValue : undefined} placement="topLeft">
          <p className={`${DETAIL_VALUE_CLASS} truncate ${valueClassName}`.trim()}>{displayValue}</p>
        </Tooltip>
      ) : (
        <p className={`${DETAIL_VALUE_CLASS} ${valueClassName}`.trim()}>{displayValue}</p>
      )}
    </div>
  );
};

export default DetailField;
