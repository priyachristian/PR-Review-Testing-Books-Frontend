import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const PipelineRowSkeleton = () => (
  <div className="flex items-center gap-2.5 px-3 py-2.5 border-t border-gray-100">
    <S w={32} h={32} className="rounded-md flex-shrink-0" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <S w="45%" h={13} />
      <S w="35%" h={10} />
    </div>
    <S w={20} h={14} />
  </div>
);

const PipelineCardSkeleton = ({ rows = 3 }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="flex items-center justify-between gap-2.5 px-3 py-3">
      <div className="flex items-center gap-2.5">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <div className="space-y-1.5">
          <S w={72} h={13} />
          <S w={108} h={10} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <S w={32} h={10} />
        <S w={24} h={18} />
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <PipelineRowSkeleton key={i} />
    ))}
  </div>
);

/** Mirrors the Available + Incoming − Committed = Projected strip. */
const StageSkeleton = () => (
  <div className="flex items-center gap-2 sm:gap-3">
    <div className="min-w-0 flex-1 space-y-1.5">
      <S w="70%" h={10} />
      <S w={40} h={20} />
    </div>
  </div>
);

const StockPositionSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <StageSkeleton key={i} />
      ))}
    </div>
    <S w="100%" h={8} className="mt-3 rounded-full" />
    <S w="100%" h={8} className="mt-1.5 rounded-full" />
    <S w={220} h={12} className="mt-2.5" />
  </div>
);

const InventoryPipelineSkeleton = () => (
  <div>
    <S w={160} h={22} className="mb-2" />
    <StockPositionSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <PipelineCardSkeleton rows={2} />
      <PipelineCardSkeleton rows={3} />
    </div>
  </div>
);

export default InventoryPipelineSkeleton;
