import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const SidebarCard = ({ titleWidth = 60, rows = 4 }) => (
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

const CustomerDetailSkeleton = ({ isVendorPage = false }) => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <S w={190} h={18} />
            <div className="flex items-center gap-2">
              <S w={120} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={70} h={22} className="rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <S w={170} h={32} className="rounded-md" />
          <S w={180} h={32} className="rounded-md" />
        </div>
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-6">
      <div className="w-full xl:w-3/4">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
          {['Overview', 'Transactions', 'History'].map((_, i) => (
            <div key={i} className={`pb-2 ${i === 0 ? 'border-b-2 -mb-px' : ''}`} style={i === 0 ? { borderColor: 'var(--primary-500, #1677ff)' } : undefined}>
              <S w={i === 0 ? 86 : i === 1 ? 110 : 70} h={16} />
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="my-container container-spacing">
            <div className="flex items-center justify-between gap-4">
              <S w={220} h={18} />
              <S w={isVendorPage ? 100 : 120} h={22} className="rounded-full" />
            </div>

            <div className="mt-4 space-y-6">
              {Array.from({ length: 3 }).map((_, row) => (
                <div key={row} className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
                  {Array.from({ length: 3 }).map((_, col) => (
                    <div key={col} className="space-y-2">
                      <S w={92} h={12} />
                      <S w={col === 2 ? '75%' : '85%'} h={16} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="my-container container-spacing">
            <S w={200} h={18} />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <S w={240} h={12} />
                    <S w={36} h={12} />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, c) => (
                      <S key={c} w="90%" h={12} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <SidebarCard titleWidth={50} rows={3} />
      </div>
    </div>
  </>
);

export default CustomerDetailSkeleton;
