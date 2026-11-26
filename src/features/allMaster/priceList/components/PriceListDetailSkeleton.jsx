import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const DetailTableSkeleton = ({ cols = 5, rows = 5 }) => (
  <div className="overflow-x-auto mt-2">
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

const SidebarCard = ({ titleWidth = 60, rows = 2 }) => (
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

const SingleTabMasterDetailSkeleton = ({ titleWidth, rows = 2, children }) => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <S w={titleWidth} h={22} />
        </div>
        <div className="flex items-center gap-2">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
        </div>
      </div>
    </div>
    <div className="flex flex-col xl:flex-row xl:justify-between pt-3 gap-6 xl:gap-8">
      <div className="w-full xl:w-3/4 min-w-0">
        <div className="flex items-center gap-8 border-b border-gray-200 px-1 pb-0 mb-4 mt-3">
          <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
            <S w={78} h={18} />
          </div>
        </div>
        <div className="space-y-10">{children}</div>
      </div>
      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3 shrink-0">
        <SidebarCard titleWidth={50} rows={rows} />
      </div>
    </div>
  </>
);

const PriceListDetailSkeleton = () => (
  <SingleTabMasterDetailSkeleton titleWidth={160} rows={2}>
    <div className="my-container container-spacing">
      <S w={180} h={22} className="mb-1" />
      <div className="mt-2 space-y-3">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <S w={88} h={14} />
              <S w="88%" h={18} />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="my-container container-spacing">
      <S w={220} h={22} className="mb-2" />
      <S w={280} h={14} className="mb-3" />
      <DetailTableSkeleton cols={5} rows={5} />
    </div>
  </SingleTabMasterDetailSkeleton>
);

export default PriceListDetailSkeleton;
