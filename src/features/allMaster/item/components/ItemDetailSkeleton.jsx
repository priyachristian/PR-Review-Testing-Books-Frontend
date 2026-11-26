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

const ItemDetailTableSkeleton = ({ cols = 8, rows = 5 }) => (
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

const ItemDetailFieldGrid = ({ rows = 3 }) => (
  <div className="mt-2 space-y-6">
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {[0, 1, 2].map(col => (
          <div key={col} className="space-y-2">
            <S w={88} h={14} />
            <S w="88%" h={18} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const ItemDetailPageSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center space-x-4">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <div className="flex flex-col gap-2">
          <S w={140} h={18} />
          <div className="flex items-center gap-2">
            <S w={120} h={12} />
            <S w={4} h={4} className="rounded-full" />
            <S w={70} h={22} className="rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-6">
      <div className="w-full xl:w-3/4">
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
          <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
            <S w={78} h={18} />
          </div>
          <div className="pb-2">
            <S w={72} h={18} />
          </div>
          <div className="pb-2">
            <S w={70} h={18} />
          </div>
        </div>

        <div className="space-y-10">
          <div className="my-container container-spacing">
            <S w={220} h={22} className="mb-1" />
            <ItemDetailFieldGrid rows={4} />
          </div>

          <div className="my-container container-spacing">
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-x-3 mb-3">
                  <S w={160} h={22} />
                  <S w={88} h={26} className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <S w={100} h={14} />
                  <S w="55%" h={18} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-x-3 mb-3">
                  <S w={180} h={22} />
                  <S w={104} h={26} className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <S w={88} h={14} />
                  <S w="50%" h={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="my-container container-spacing">
            <S w={180} h={22} className="mb-2" />
            <ItemDetailFieldGrid rows={2} />
            <div className="mt-4 space-y-2">
              <S w="70%" h={14} />
              <S w="85%" h={14} />
            </div>
          </div>

          <div className="my-container container-spacing">
            <S w={120} h={22} className="mb-2" />
            <ItemDetailFieldGrid rows={2} />
          </div>

          <div className="my-container container-spacing">
            <S w={180} h={22} className="mb-2" />
            <ItemDetailFieldGrid rows={1} />
            <ItemDetailTableSkeleton cols={8} rows={5} />
          </div>

          <div className="my-container container-spacing">
            <S w={170} h={22} className="mb-2" />
            <ItemDetailFieldGrid rows={2} />
          </div>

          <div className="my-container container-spacing">
            <S w={140} h={22} className="mb-2" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4">
              <div className="space-y-2">
                <S w={72} h={14} />
                <S w="92%" h={18} />
              </div>
            </div>
          </div>

          <div className="my-container container-spacing">
            <S w={120} h={22} className="mb-2" />
            <div className="flex flex-wrap gap-3 mt-2">
              <S w={120} h={80} className="rounded-md" />
              <S w={120} h={80} className="rounded-md" />
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

export const ItemDetailUsedInTabSkeleton = () => (
  <>
    <div className="my-container container-spacing">
      <S w={100} h={22} className="mb-3" />
      <ItemDetailTableSkeleton cols={4} rows={6} />
    </div>
  </>
);

export const ItemDetailHistoryTabSkeleton = () => (
  <>
    <div className="my-container p-4 mx-auto">
      <div className="mb-5 flex items-center gap-2 pb-3 border-b-2 border-[#f5f6fa]">
        <S w={140} h={22} />
        <S w={36} h={22} className="rounded-full" />
      </div>
      <div className="pl-2.5 border-l-2 border-[#e0e7ef] space-y-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="relative pl-2">
            <S w="55%" h={14} className="mb-2" />
            <div className="bg-[#f5f6fa] rounded-lg p-3 space-y-2">
              <S w="100%" h={14} />
              <S w="85%" h={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);
