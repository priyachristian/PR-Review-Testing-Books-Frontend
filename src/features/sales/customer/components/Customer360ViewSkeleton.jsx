import React from 'react';
import CustomerCreditDashboardSkeleton from './CustomerCreditDashboardSkeleton';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const SnapshotCardSkeleton = () => (
  <div className="customer-360-snapshot-card-skeleton bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex items-center justify-between gap-2 mb-2">
      <S w={36} h={36} className="rounded-sm flex-shrink-0" />
    </div>
    <div className="space-y-2">
      <S w="70%" h={12} />
      <S w={96} h={28} />
    </div>
  </div>
);

const DetailCardSkeleton = () => (
  <div className="bg-gray-50 border-r border-b border-gray-200 px-3 py-2.5 flex items-center gap-3 h-full">
    <S w={16} h={16} className="shrink-0" />
    <div className="min-w-0 flex-1 space-y-2">
      <S w="60%" h={10} />
      <S w={64} h={20} />
    </div>
  </div>
);

const InsightRowSkeleton = () => (
  <div className="flex items-center gap-3">
    <S w={16} h={12} className="shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <S w="60%" h={12} />
        <S w={40} h={12} className="shrink-0" />
      </div>
      <S w="100%" h={6} className="rounded-full" />
    </div>
  </div>
);

const Customer360HeaderSkeleton = () => (
  <>
    <div className="customer-360-view-header bg-white border-b border-gray-200 px-4 py-3 -m-4 overflow-hidden">
      <div className="customer-360-view-header__row flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <S w={32} h={32} className="rounded-md flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0 flex-1">
            <div className="ds-shimmer h-[22px] sm:h-[27px] w-[180px] max-w-full rounded" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 min-h-[22px]">
              <S w={72} h={22} className="rounded shrink-0" />
              <S w={4} h={4} className="rounded-full shrink-0" />
              <S w={100} h={14} className="shrink-0" />
            </div>
          </div>
        </div>
        <S w={128} h={24} className="rounded shrink-0" />
      </div>
    </div>
  </>
);

const Customer360BodySkeleton = () => (
  <>
    <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-gray-200 -mx-4 mt-4">
      {[1, 2, 3, 4].map(i => (
        <SnapshotCardSkeleton key={i} />
      ))}
    </div>

    <div className="grid grid-cols-3 border-l border-gray-200 -mx-4">
      {[1, 2, 3].map(i => (
        <DetailCardSkeleton key={i} />
      ))}
    </div>

    <div className="bg-white border-l border-r border-b border-gray-200 -mx-4">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
        <S w={112} h={14} />
        <S w={176} h={12} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 px-4 py-4">
        {[0, 1].map(col => (
          <div key={col} className={`space-y-3 ${col === 0 ? 'md:pr-6 pb-4 md:pb-0' : 'md:pl-6 pt-4 md:pt-0'}`}>
            <S w={64} h={10} className="mb-1" />
            {[1, 2, 3, 4, 5].map(i => (
              <InsightRowSkeleton key={i} />
            ))}
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white border border-gray-200 -mx-4">
      <div className="border-b border-gray-200 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: 13 }).map((_, i) => (
            <S key={i} w={40} h={28} className="rounded-md shrink-0" />
          ))}
        </div>
      </div>
      <div className="p-4">
        <S w={208} h={14} className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <S key={i} w="100%" h={16} />
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white border-l border-r border-b border-gray-200 -mx-4 px-4 pb-4">
      <CustomerCreditDashboardSkeleton />
    </div>
  </>
);

const Customer360ViewSkeleton = () => (
  <>
    <Customer360HeaderSkeleton />
    <Customer360BodySkeleton />
  </>
);

export { Customer360HeaderSkeleton, Customer360BodySkeleton };
export default Customer360ViewSkeleton;
