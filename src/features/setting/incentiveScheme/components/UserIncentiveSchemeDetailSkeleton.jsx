import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`uds-shimmer ${className}`} style={{ width: w, height: h }} />;

const StatCardSkeleton = () => (
  <div className="bg-[#f5f5f4] rounded-xl border border-gray-200 px-4 py-3">
    <S w={80} h={12} className="mb-1" />
    <S w={90} h={22} />
  </div>
);

const SchemeRowSkeleton = () => (
  <div className="py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-start justify-between gap-4 mb-2">
      <S w={160} h={14} />
      <S w={70} h={16} />
    </div>
    <div className="flex gap-4 mb-2">
      <S w={100} h={12} />
      <S w={100} h={12} />
    </div>
    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
      <S w="45%" h={6} className="rounded-full" />
    </div>
  </div>
);

const UserIncentiveSchemeDetailSkeleton = () => (
  <>
    <div className="bg-white py-2 border-b">
      <div className="flex items-center space-x-4 h-full px-4">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <S w={180} h={18} />
      </div>
    </div>

    <div className="p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <S w={48} h={48} className="rounded-full flex-shrink-0" />
          <div>
            <S w={160} h={18} className="mb-1" />
            <S w={120} h={12} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        <S w={220} h={15} className="mb-4" />
        <SchemeRowSkeleton />
        <SchemeRowSkeleton />
      </div>
    </div>
  </>
);

export default UserIncentiveSchemeDetailSkeleton;
