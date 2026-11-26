import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const StatCardSkeleton = () => (
  <div className="bg-[#f5f5f4] rounded-xl border border-gray-200 px-4 py-3">
    <S w={80} h={12} className="mb-1" />
    <S w={100} h={22} />
  </div>
);

const ProgressRowSkeleton = ({ fillWidth = '35%' }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <S w={100} h={13} />
      <S w={60} h={13} />
    </div>
    <div className="h-[8px] bg-gray-100 rounded-full overflow-hidden">
      <S w={fillWidth} h={8} className="rounded-full" />
    </div>
    <div className="flex items-center justify-between mt-1">
      <S w={50} h={11} />
      <S w={60} h={11} />
    </div>
  </div>
);

const UserRowSkeleton = () => (
  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] gap-3 items-center py-3 border-b border-gray-100 text-[13px]">
    <S w="75%" h={13} />
    <S w={60} h={13} />
    <S w={60} h={13} />
    <S w={60} h={13} />
    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
      <S w="60%" h={6} className="rounded-full" />
    </div>
    <S w={44} h={13} className="ml-auto" />
  </div>
);

const IncentiveSchemeDetailSkeleton = () => (
  <>
    <div className="bg-white py-2 border-b">
      <div className="flex items-center space-x-4 h-full px-4">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <div className="flex flex-col">
          <S w={120} h={18} />
        </div>
      </div>
    </div>

    <div className="p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <S w={220} h={20} className="mb-1" />
            <S w={160} h={12} />
          </div>
          <S w={72} h={24} className="rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <S w={240} h={15} className="mb-4" />
        <div className="flex flex-col gap-4">
          <ProgressRowSkeleton fillWidth="40%" />
          <ProgressRowSkeleton fillWidth="8%" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <S w={180} h={15} className="mb-4" />
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] gap-3 text-[11px] text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100">
          <S w={40} h={11} />
          <S w={50} h={11} />
          <S w={55} h={11} />
          <S w={55} h={11} />
          <S w={55} h={11} />
          <S w={44} h={11} className="ml-auto" />
        </div>
        <UserRowSkeleton />
      </div>

      <div className="flex justify-end">
        <S w={100} h={32} className="rounded-md" />
      </div>
    </div>
  </>
);

export default IncentiveSchemeDetailSkeleton;
