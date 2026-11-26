const style = `
  @keyframes rejectionShimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .ra-shimmer {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f2f5 25%, #e4e7eb 50%, #f0f2f5 75%);
    background-size: 600px 100%;
    animation: rejectionShimmer 1.4s ease-in-out infinite;
  }
`;

const S = ({ w, h = 14, className = '' }) => <div className={`ra-shimmer ${className}`} style={{ width: w, height: h }} />;

export const RejectionShimmerStyles = () => <style>{style}</style>;

export const KpiValueSkeleton = () => <S w={80} h={24} className="mt-1" />;

export const MethodBreakdownSkeleton = () => (
  <div className="flex flex-row gap-4 w-full overflow-x-auto">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex-1 min-w-[220px] bg-white border border-gray-200 p-4 flex items-center justify-between">
        <div className="space-y-2">
          <S w={90} h={12} />
          <S w={120} h={24} />
          <S w={80} h={14} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <S w={50} h={22} className="rounded-full" />
          <S w={90} h={14} />
        </div>
      </div>
    ))}
  </div>
);

const TREND_ROWS = [
  { rejected: '6%', submitted: '92%' },
  { rejected: '5%', submitted: '75%' },
  { rejected: '4%', submitted: '68%' },
];

const X_AXIS_TICKS = 7;

export const TrendChartSkeleton = () => (
  <div className="relative" style={{ height: 260 }}>
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-1.5">
        <S w={12} h={12} className="rounded-sm" />
        <S w={52} h={12} />
      </div>
      <div className="flex items-center gap-1.5">
        <S w={12} h={12} className="rounded-sm" />
        <S w={60} h={12} />
      </div>
    </div>

    <div className="flex gap-3" style={{ height: 200 }}>
      <div className="flex flex-col justify-around py-6 shrink-0" style={{ width: 52 }}>
        {TREND_ROWS.map((_, i) => (
          <S key={i} w={44} h={12} />
        ))}
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 flex justify-between">
          {Array.from({ length: X_AXIS_TICKS }).map((_, i) => (
            <div key={i} className="h-full border-l border-dashed border-gray-200" />
          ))}
        </div>

        <div className="relative h-full flex flex-col justify-around py-6">
          {TREND_ROWS.map((row, i) => (
            <div key={i} className="space-y-1.5 pr-2">
              <S w={row.rejected} h={10} className="rounded-sm" />
              <S w={row.submitted} h={14} className="rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex justify-between mt-2 ml-[52px] pl-3 pr-1">
      {Array.from({ length: X_AXIS_TICKS }).map((_, i) => (
        <S key={i} w={18} h={10} />
      ))}
    </div>
  </div>
);
