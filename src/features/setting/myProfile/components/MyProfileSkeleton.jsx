import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const StatCardSkeleton = () => (
  <div className="bg-[#f5f5f4] rounded-xl border border-gray-200 px-4 py-3">
    <S w={80} h={12} className="mb-1" />
    <S w={90} h={22} />
  </div>
);

const MyProfileSkeleton = () => (
  <>
    <div className="bg-white py-2.5 px-4 border-b">
      <S w={140} h={18} />
    </div>

    <div className="p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mx-2 sm:mx-4">
        <div className="flex flex-col items-center px-8 pt-10 pb-8">
          <S w={72} h={72} className="rounded-full mb-4" />
          <S w={160} h={18} />
        </div>
        <div className="mx-4 mb-4 rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`label-${index}`} className="px-5 py-4 flex items-center bg-[#fafafa]">
                <S w={70} h={12} />
              </div>
            ))}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`value-${index}`} className="px-5 py-4 flex items-center bg-white">
                <S w={index === 1 ? 160 : 110} h={14} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <S w={220} h={15} className="mb-4" />
        <S w="100%" h={60} />
      </div>
    </div>
  </>
);

export default MyProfileSkeleton;
