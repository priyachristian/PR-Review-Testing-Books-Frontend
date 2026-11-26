import { formatAmount } from '@/utils/currency';

const LastRateComparison = ({ lastRate, currentRate, currencySymbol, onClick }) => {
  const last = Number(lastRate);
  if (lastRate == null || Number.isNaN(last) || last <= 0) return null;

  const current = Number(currentRate);
  const hasCurrent = currentRate !== '' && currentRate != null && !Number.isNaN(current);
  const percent = hasCurrent && last > 0 ? Math.round(((current - last) / last) * 100) : null;

  const formattedLast = formatAmount(last, true, currencySymbol ? { symbol: currencySymbol } : undefined);
  let changeNode = null;

  if (percent != null && percent !== 0) {
    const isIncrease = percent > 0;
    changeNode = (
      <span className={`whitespace-nowrap font-medium no-underline ${isIncrease ? 'text-green-600' : 'text-red-500'}`}>
        {isIncrease ? '↑' : '↓'} {isIncrease ? `+${percent}` : percent}%
      </span>
    );
  }

  const title = changeNode ? `Last: ${formattedLast} ${percent > 0 ? '↑' : '↓'} ${percent > 0 ? `+${percent}` : percent}%` : `Last: ${formattedLast}`;

  const content = (
    <>
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <span>Last:</span>
        <span className="font-semibold text-gray-800">{formattedLast}</span>
      </span>
      {changeNode ? <span className="ml-1">{changeNode}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onClick(e);
        }}
        title={title}
        aria-label={`View last transaction rate ${formattedLast}`}
        className="mt-1 w-full text-xs text-left text-gray-600 cursor-pointer bg-transparent border-0 p-0 inline-flex flex-wrap items-center gap-x-1 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="mt-1 w-full text-xs text-left text-gray-600 inline-flex flex-wrap items-center gap-x-1" title={title}>
      {content}
    </div>
  );
};

export default LastRateComparison;
