import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const DetailFieldGridSkeleton = ({ count = 4, cols = 'md:grid-cols-2 lg:grid-cols-4' }) => (
  <div className={`mt-2 grid ${cols} gap-x-4 gap-y-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <S w={92} h={12} />
        <S w={i % 4 === 3 ? 72 : '85%'} h={16} />
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
            <th key={i} className="border border-gray-300 py-2.5 px-2 text-left">
              <S w={i % 3 === 0 ? 72 : 64} h={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }).map((_, col) => (
              <td key={col} className="border border-gray-300 py-2 px-2">
                <S w={col === 0 ? '55%' : col % 2 ? '75%' : '65%'} h={14} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InventoryTransferDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <S w={320} h={18} />
            <div className="flex items-center gap-2">
              <S w={90} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={72} h={22} className="rounded-md" />
            </div>
          </div>
        </div>
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
      </div>
    </div>

    <div className="w-full pt-3">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
        <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
          <S w={72} h={16} />
        </div>
      </div>

      <div className="space-y-10 pb-5">
        <div className="my-container container-spacing">
          <S w={180} h={22} className="mb-1" />
          <DetailFieldGridSkeleton count={4} />
          <DetailFieldGridSkeleton count={3} />
        </div>

        <div className="my-container container-spacing">
          <S w={200} h={22} className="mb-1" />
          <DetailFieldGridSkeleton count={2} cols="md:grid-cols-2" />
        </div>

        <div className="my-container container-spacing">
          <S w={150} h={22} className="mb-1" />
          <div className="mt-2 space-y-2">
            <S w={52} h={12} />
            <S w="75%" h={16} />
            <S w="55%" h={16} />
          </div>
        </div>

        <div className="my-container container-spacing">
          <S w={180} h={22} className="mb-2" />
          <DetailTableSkeleton cols={5} rows={4} />
        </div>
      </div>
    </div>
  </>
);

export default InventoryTransferDetailSkeleton;
