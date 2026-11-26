import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

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

const SidebarCard = ({ titleWidth = 60, rows = 3 }) => (
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

const SingleTabMasterDetailSkeleton = ({ titleWidth, children }) => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center space-x-4">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <div className="flex flex-col gap-1.5">
          <S w={titleWidth} h={22} />
        </div>
      </div>
    </div>
    <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
      <div className="w-full xl:w-3/4">
        <div className="flex items-center gap-8 border-b border-gray-200 px-1 pb-0 mb-4 mt-3">
          <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
            <S w={78} h={18} />
          </div>
        </div>
        <div className="space-y-10">{children}</div>
      </div>
      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <SidebarCard titleWidth={50} rows={3} />
      </div>
    </div>
  </>
);

export const BranchDetailPageSkeleton = () => (
  <SingleTabMasterDetailSkeleton titleWidth={155}>
    <div className="my-container container-spacing">
      <S w={220} h={22} className="mb-1" />
      <ItemDetailFieldGrid rows={3} />
    </div>
    <div className="my-container container-spacing">
      <S w={150} h={22} className="mb-1" />
      <ItemDetailFieldGrid rows={1} />
    </div>
    <div className="my-container container-spacing">
      <S w={200} h={22} className="mb-1" />
      <ItemDetailFieldGrid rows={2} />
    </div>
  </SingleTabMasterDetailSkeleton>
);
