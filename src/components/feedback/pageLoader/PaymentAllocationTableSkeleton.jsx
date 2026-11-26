const style = `
  @keyframes paymentAllocationTableShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .pat-skeleton-shimmer {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f2f5 25%, #e4e7eb 50%, #f0f2f5 75%);
    background-size: 600px 100%;
    animation: paymentAllocationTableShimmer 1.4s ease-in-out infinite;
  }
`;

const TH_BASE_CLASS = 'border px-2 py-3 bg-[#fafafa] text-start pl-5';
const TD_BASE_CLASS = 'pl-5 border text-start relative';

export const PAYMENT_ALLOCATION_TABLE_COLUMNS = {
  invoice: ['Invoice Date', 'Due Date', 'Invoice No', 'Invoice Amount', 'Amount Due', 'Payment'],
  bill: ['Bill Date', 'Due Date', 'Bill No', 'Bill Amount', 'Amount Due', 'Payment'],
};

const VARIANT_LAYOUT = {
  invoice: {
    columnWidths: ['w-[130px]', 'w-[130px]', 'w-[160px]', 'w-[150px]', 'w-[150px]', 'w-[150px]'],
  },
  bill: {
    columnWidths: ['w-[130px]', 'w-[130px]', 'w-[160px]', 'w-[150px]', 'w-[150px]', 'w-[150px]'],
  },
};

const SkeletonCell = () => <div className="pat-skeleton-shimmer h-[14px] w-[85%] max-w-[120px]" />;

const PaymentAllocationTableSkeleton = ({ variant = 'invoice', columns, rowCount = 5 }) => {
  const headers = columns ?? PAYMENT_ALLOCATION_TABLE_COLUMNS[variant] ?? PAYMENT_ALLOCATION_TABLE_COLUMNS.invoice;
  const { columnWidths } = VARIANT_LAYOUT[variant] ?? VARIANT_LAYOUT.invoice;

  const getThClassName = index => `${TH_BASE_CLASS} ${columnWidths[index] ?? ''}`;
  const getTdClassName = index => `${columnWidths[index] ?? ''} ${TD_BASE_CLASS}`;

  return (
    <>
      <style>{style}</style>
      <div className="overflow-x-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr className="w-full">
              {headers.map((label, index) => (
                <th key={label} className={getThClassName(index)}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, colIndex) => (
                  <td key={colIndex} className={getTdClassName(colIndex)}>
                    <div className="py-2">
                      <SkeletonCell />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PaymentAllocationTableSkeleton;
