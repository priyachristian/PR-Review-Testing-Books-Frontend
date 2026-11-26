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

const MetadataCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={130} h={12} />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <S w={65} h={12} />
          <S w={90} h={12} />
        </div>
      ))}
    </div>
  </div>
);

const DetailFieldGridSkeleton = ({ rows = 3 }) => (
  <div className="mt-2 space-y-6">
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {[0, 1, 2].map(col => (
          <div key={col} className="space-y-2">
            <S w={92} h={12} />
            <S w={col === 2 ? '75%' : '85%'} h={16} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const DetailTableSkeleton = ({ cols = 5, rows = 2 }) => (
  <div className="overflow-x-auto mt-4">
    <table className="w-full border-collapse bg-white">
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

const RecurringBillDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <S w={210} h={18} />
            <div className="flex items-center gap-2">
              <S w={120} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={70} h={22} className="rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <S w={120} h={32} className="rounded-md hidden sm:block" />
          <S w={110} h={32} className="rounded-md hidden md:block" />
          <S w={80} h={32} className="rounded-md hidden md:block" />
        </div>
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
      <div className="w-full xl:w-3/4">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
          {[
            { w: 72, active: true },
            { w: 80, active: false },
            { w: 64, active: false },
            { w: 128, active: false },
          ].map((tab, i) => (
            <div key={i} className={`pb-2 ${tab.active ? 'border-b-2 -mb-px' : ''}`} style={tab.active ? { borderColor: 'var(--primary-500, #1677ff)' } : undefined}>
              <S w={tab.w} h={16} />
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="my-container container-spacing">
            <S w={220} h={22} className="mb-1" />
            <DetailFieldGridSkeleton rows={3} />
          </div>

          <div className="my-container container-spacing">
            <S w={120} h={22} className="mb-1" />
            <DetailTableSkeleton cols={5} rows={2} />

            <div className="flex justify-end mt-6">
              <div className="w-full md:w-1/3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex justify-between items-center ${i === 3 ? 'border-t border-gray-200 pt-3' : ''}`}>
                    <S w={i === 3 ? 48 : 72} h={i === 3 ? 16 : 14} />
                    <S w={i === 3 ? 80 : 64} h={i === 3 ? 16 : 14} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="my-container container-spacing">
            <S w={130} h={22} className="mb-3" />
            <div className="grid md:grid-cols-2 gap-6">
              {[0, 1].map(i => (
                <div key={i} className="space-y-2">
                  <S w={i === 0 ? 96 : 130} h={12} />
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100 space-y-2">
                    <S w="85%" h={14} />
                    <S w="70%" h={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <SidebarCard titleWidth={50} rows={3} />
        <MetadataCard />
        <SidebarCard titleWidth={80} rows={2} />
      </div>
    </div>
  </>
);

export default RecurringBillDetailSkeleton;
