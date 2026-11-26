import { formatAmount, formatAmountShort } from '@/utils/currency';
import { Tooltip } from '@/components/AntDComponent';

const SkeletonVal = ({ width = 48 }) => <span className="ph-skeleton" style={{ width, height: 16, verticalAlign: 'middle' }} />;

const MoneyVal = ({ value }) => (
  <Tooltip title={formatAmount(value)} placement="top">
    <span className="cursor-default">{formatAmountShort(value)}</span>
  </Tooltip>
);

const StatCol = ({ label, children, valueClassName = 'text-heading', tooltip }) => {
  const content = (
    <div className="flex flex-col items-end justify-center px-4">
      <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-[15px] font-bold ${valueClassName}`}>{children}</span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip title={tooltip} placement="top">
      {content}
    </Tooltip>
  );
};

const PageHeader = props => {
  const {
    title = '',
    totalAmount = 0,
    totalRecord = 0,
    availableCredit = null,
    totalBalance = null,
    transactionCounts = null,
    transactionLabel = 'Paid',
    totalQuantity = null,
    remainingAmount = null,
    loading = false,
    rightStats = null,
  } = props;

  // Use 'in props' so we know the parent explicitly passed this field
  // (even when its value is undefined/null during loading)
  const hasBalance = 'totalBalance' in props;
  const hasAvailableCredit = 'availableCredit' in props;
  const hasTransactionCounts = 'transactionCounts' in props;
  const hasQuantity = 'totalQuantity' in props;
  const hasRemaining = 'remainingAmount' in props;
  const hasAmount = 'totalAmount' in props && props.totalAmount !== null;

  if (rightStats) {
    return (
      <div className="flex flex-wrap items-center md:items-stretch md:-mt-2.5 md:-mb-2.5">
        <span className="text-[1.125rem] font-bold text-heading pr-4 self-center">{title}</span>
        <div className="flex flex-wrap items-stretch divide-x divide-gray-200 border-l border-r border-gray-200 overflow-x-auto">
          {rightStats.map(stat => (
            <StatCol key={stat.label} label={stat.label} valueClassName={stat.colorClass || 'text-heading'} tooltip={stat.tooltip}>
              {loading ? <SkeletonVal width={48} /> : stat.value}
            </StatCol>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center md:items-stretch md:-mt-2.5 md:-mb-2.5">
      <span className="text-[1.125rem] font-bold text-heading pr-4 self-center">{title}</span>
      <div className="flex flex-wrap items-stretch divide-x divide-gray-200 border-l border-r border-gray-200 overflow-x-auto">
        <StatCol label="Total Count">{loading ? <SkeletonVal width={36} /> : totalRecord}</StatCol>

        {(hasAmount || (!loading && totalAmount !== null)) && <StatCol label="Total Value">{loading ? <SkeletonVal width={80} /> : <MoneyVal value={totalAmount} />}</StatCol>}

        {(hasAvailableCredit || (!loading && availableCredit !== null)) && (
          <StatCol label="Available Credit">{loading ? <SkeletonVal width={80} /> : <MoneyVal value={availableCredit ?? 0} />}</StatCol>
        )}

        {(hasRemaining || (!loading && remainingAmount !== null)) && <StatCol label="Remaining Amt">{loading ? <SkeletonVal width={80} /> : <MoneyVal value={remainingAmount ?? 0} />}</StatCol>}

        {(hasTransactionCounts || (!loading && transactionCounts !== null)) && (
          <StatCol label={`${transactionLabel} Amt`}>{loading ? <SkeletonVal width={60} /> : <MoneyVal value={transactionCounts ?? 0} />}</StatCol>
        )}

        {(hasBalance || (!loading && totalBalance !== null)) && <StatCol label="Balance Due">{loading ? <SkeletonVal width={80} /> : <MoneyVal value={totalBalance} />}</StatCol>}

        {(hasQuantity || (!loading && totalQuantity !== null)) && <StatCol label="Total Qty">{loading ? <SkeletonVal width={40} /> : totalQuantity}</StatCol>}
      </div>
    </div>
  );
};

export default PageHeader;
