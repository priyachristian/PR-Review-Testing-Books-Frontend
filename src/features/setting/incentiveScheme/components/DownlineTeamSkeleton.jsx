import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const TeamMemberCardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="p-4">
      <div className="flex gap-3 mb-4">
        <S w={40} h={40} className="rounded-full flex-shrink-0" />
        <div>
          <S w={120} h={14} className="mb-1" />
          <S w={90} h={12} />
        </div>
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-b-0">
          <S w={96} h={12} />
          <S w={64} h={14} />
        </div>
      ))}

      <div className="pt-3 mt-1 border-t border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <S w={112} h={12} />
          <S w={28} h={12} />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <S w="55%" h={6} className="rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const DownlineTeamSkeleton = () => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <TeamMemberCardSkeleton key={index} />
      ))}
    </div>
  </>
);

export default DownlineTeamSkeleton;
