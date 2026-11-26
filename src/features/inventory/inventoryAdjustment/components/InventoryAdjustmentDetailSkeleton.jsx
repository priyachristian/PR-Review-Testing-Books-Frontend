import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const DetailFieldGridSkeleton = ({ count = 4, cols = 'md:grid-cols-2 lg:grid-cols-4' }) => (
  <div className={`grid ${cols} gap-y-3`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <S w={92} h={12} />
        <S w={i % 4 === 0 ? 72 : '85%'} h={16} />
      </div>
    ))}
  </div>
);

const DetailTableSkeleton = ({ cols = 5, rows = 4 }) => (
  <div className="overflow-x-auto mt-2">
    <table className="w-full border-collapse bg-white min-w-[640px]">
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
                <S w={col === 0 ? 72 : col % 2 ? '75%' : '65%'} h={14} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SidebarCard = ({ titleWidth = 60, rows = 3 }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={titleWidth} h={12} />
    </div>
    <div className="p-3 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <S key={i} w="100%" h={32} className="rounded-md" />
      ))}
    </div>
  </div>
);

const MetadataCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={130} h={12} />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center gap-2">
          <S w={65} h={12} />
          <S w={90} h={12} />
        </div>
      ))}
    </div>
  </div>
);

const InventoryAdjustmentDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2 min-w-0">
            <S w={280} h={18} className="max-w-full" />
            <div className="flex items-center gap-2">
              <S w={100} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={72} h={22} className="rounded-md" />
            </div>
          </div>
        </div>
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
      </div>
    </div>

    <div className="w-full pt-3">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
            {[72, 110, 64].map((w, i) => (
              <div key={i} className={`pb-2 ${i === 0 ? 'border-b-2 -mb-px' : ''}`} style={i === 0 ? { borderColor: 'var(--primary-500)' } : undefined}>
                <S w={w} h={16} />
              </div>
            ))}
          </div>

          <div className="space-y-10 pb-5">
            <div className="my-container container-spacing">
              <S w={160} h={22} className="mb-1" />
              <div className="mt-2 space-y-3">
                <DetailFieldGridSkeleton count={5} />
                <DetailFieldGridSkeleton count={4} />
                <div className="space-y-2">
                  <S w={88} h={12} />
                  <S w="75%" h={16} />
                  <S w="55%" h={16} />
                </div>
              </div>
            </div>

            <div className="my-container container-spacing">
              <S w={180} h={22} className="mb-2" />
              <DetailTableSkeleton cols={5} rows={4} />
            </div>
          </div>
        </div>

        <div className="xl:mt-[62px] h-fit xl:w-[250px] shrink-0 space-y-3">
          <SidebarCard titleWidth={50} rows={3} />
          <MetadataCard />
        </div>
      </div>
    </div>
  </>
);

export default InventoryAdjustmentDetailSkeleton;
