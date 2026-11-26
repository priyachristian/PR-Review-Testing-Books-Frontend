import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const CardSection = ({ titleWidth = 140, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
      <S w={titleWidth} h={14} />
    </div>
    {children}
  </div>
);

const DetailFieldGridSkeleton = ({ count = 8 }) => (
  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1">
        <S w={i % 3 === 0 ? 72 : 88} h={12} />
        <S w={i % 2 === 0 ? '70%' : '85%'} h={16} />
      </div>
    ))}
  </div>
);

const DetailTableSkeleton = ({ cols = 5, rows = 5 }) => (
  <div className="overflow-x-auto p-2 sm:p-3">
    <table className="w-full border-collapse bg-white min-w-[520px]">
      <thead>
        <tr className="bg-gray-50">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="border border-gray-200 py-2.5 px-2 text-left">
              <S w={i % 3 === 0 ? 72 : 64} h={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }).map((_, col) => (
              <td key={col} className="border border-gray-200 py-2 px-2">
                <S w={col === 0 ? '55%' : col % 2 ? '75%' : '65%'} h={14} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Matches Manual Journal / card-based detail pages:
 * header (back + title + actions) → stacked white cards (details grid + table).
 */
export const DetailPageWithTableSkeleton = ({
  titleWidth = 190,
  subtitleWidths = [110, 70, 80],
  actionCount = 3,
  fieldCount = 8,
  tableCols = 5,
  tableRows = 5,
  detailsTitleWidth = 120,
  tableTitleWidth = 130,
}) => (
  <div className="space-y-4 min-h-screen">
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2 min-w-0">
            <S w={titleWidth} h={18} />
            <div className="flex flex-wrap items-center gap-2">
              <S w={subtitleWidths[0]} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={subtitleWidths[1]} h={12} />
              <S w={subtitleWidths[2]} h={12} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {Array.from({ length: actionCount }).map((_, i) => (
            <S key={i} w={i === 0 ? 36 : 100} h={32} className="rounded-md" />
          ))}
        </div>
      </div>
    </div>

    <div className="pt-3 space-y-4">
      <CardSection titleWidth={detailsTitleWidth}>
        <DetailFieldGridSkeleton count={fieldCount} />
      </CardSection>

      <CardSection titleWidth={tableTitleWidth}>
        <DetailTableSkeleton cols={tableCols} rows={tableRows} />
      </CardSection>
    </div>
  </div>
);

export default DetailPageWithTableSkeleton;
