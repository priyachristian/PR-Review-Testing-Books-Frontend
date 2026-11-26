import React from 'react';

import InventoryPipelineSkeleton from './InventoryPipelineSkeleton';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const DetailFieldGridSkeleton = ({ count = 6 }) => (
  <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <S w={88} h={12} />
        <S w={i % 3 === 0 ? '85%' : '75%'} h={16} />
      </div>
    ))}
  </div>
);

const ViewInventoryDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center md:items-stretch md:-mt-2.5 md:-mb-2.5 min-w-0">
          <div className="flex items-center gap-3 pr-4 self-center min-w-0">
            <S w={36} h={36} className="rounded-md flex-shrink-0" />
            <div className="flex flex-col gap-2 min-w-0">
              <S w={280} h={18} className="max-w-full" />
              <div className="flex items-center gap-2">
                <S w={72} h={12} />
                <S w={4} h={4} className="rounded-full" />
                <S w={56} h={22} className="rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-stretch divide-x divide-gray-200 border-l border-r border-gray-200 overflow-x-auto">
            {[100, 120].map((labelW, i) => (
              <div key={i} className="flex flex-col items-end justify-center px-4 py-1">
                <S w={labelW} h={11} className="mb-1" />
                <S w={i === 0 ? 36 : 72} h={16} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <S w={120} h={32} className="rounded-md" />
        </div>
      </div>
    </div>

    <div className="w-full pt-3">
      <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
        <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
          <S w={72} h={16} />
        </div>
        <div className="pb-2">
          <S w={88} h={16} />
        </div>
        <div className="pb-2">
          <S w={64} h={16} />
        </div>
      </div>

      <div className="space-y-5 pb-5">
        <div className="my-container container-spacing">
          <S w={130} h={22} className="mb-1" />
          <DetailFieldGridSkeleton count={6} />

          <div className="mt-6">
            <S w={170} h={22} className="mb-1" />
            <DetailFieldGridSkeleton count={5} />
          </div>

          <div className="mt-6">
            <InventoryPipelineSkeleton />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default ViewInventoryDetailSkeleton;
