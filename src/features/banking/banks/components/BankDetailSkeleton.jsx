import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const DetailFieldGridSkeleton = ({ rows = 3 }) => (
  <div className="mt-2 space-y-6">
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {[0, 1, 2].map(col => (
          <div key={col} className="space-y-2">
            <S w={90} h={12} />
            <S w="85%" h={16} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const BankDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <S w={120} h={18} />
        </div>
        <div className="flex gap-2">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <S w={96} h={32} className="rounded-md" />
          <S w={96} h={32} className="rounded-md" />
        </div>
      </div>
    </div>

    <div className="w-full pt-6">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
        <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
          <S w={72} h={16} />
        </div>
      </div>

      <div className="space-y-10 pb-5">
        <div className="my-container container-spacing">
          <S w={200} h={22} className="mb-1" />
          <DetailFieldGridSkeleton rows={3} />
        </div>
      </div>
    </div>
  </>
);

export default BankDetailSkeleton;
