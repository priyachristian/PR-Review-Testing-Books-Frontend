const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const SkeletonSideCard = ({ children, headerW = 100 }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={headerW} h={11} />
    </div>
    <div className="p-3 sm:p-4 space-y-2.5">{children}</div>
  </div>
);

const SkeletonRow = ({ labelW = 90, valueW = '55%' }) => (
  <div className="flex justify-between gap-2 items-center">
    <S w={labelW} h={11} />
    <S w={valueW} h={11} />
  </div>
);

const ProductionDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <S w={220} h={18} />
            <div className="flex items-center gap-2">
              <S w={110} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={80} h={22} className="rounded-full" />
              <S w={90} h={22} className="rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <S w={36} h={32} className="rounded-md" />
          <S w={100} h={32} className="rounded-md" />
          <S w={80} h={32} className="rounded-md" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 sm:grid-cols-6 divide-x divide-gray-200">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center px-2 py-1 gap-1">
            <S w={52} h={10} />
            <S w={64} h={16} />
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
      <div className="w-full xl:w-3/4 min-w-0 space-y-4">
        <div className="flex gap-6 border-b border-gray-200 pb-2.5 mb-4 px-1 overflow-x-auto">
          {[110, 70, 110, 105].map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <S w={w} h={14} />
              {i === 0 ? <div className="h-[2px] w-full rounded-full bg-blue-500 mt-1" /> : <div className="h-[2px] w-full mt-1" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-md shadow-[0px_1px_4px_rgba(46,38,61,0.1)] p-3 sm:p-4 space-y-3">
          <S w={180} h={18} />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <S w={90} h={10} />
                <S w="70%" h={14} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-md shadow-[0px_1px_4px_rgba(46,38,61,0.1)] p-3 sm:p-4 space-y-3">
          <S w={160} h={18} />
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2.5 grid grid-cols-4 gap-4">
              <S w={40} h={12} />
              <S w={80} h={12} />
              <S w={70} h={12} />
              <S w={60} h={12} />
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 grid grid-cols-4 gap-4">
                  <S w="40%" h={12} />
                  <S w="80%" h={12} />
                  <S w="55%" h={12} />
                  <S w="50%" h={12} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2">
          <S w="100%" h={32} className="rounded-md" />
          <S w="100%" h={32} className="rounded-md" />
          <S w="100%" h={32} className="rounded-md" />
        </div>
        <SkeletonSideCard headerW={140}>
          <SkeletonRow labelW={65} valueW="60%" />
          <div className="border-t border-gray-100 my-1" />
          <SkeletonRow labelW={60} valueW="55%" />
        </SkeletonSideCard>
        <SkeletonSideCard headerW={90}>
          <SkeletonRow labelW={55} valueW="50%" />
          <SkeletonRow labelW={50} valueW="45%" />
        </SkeletonSideCard>
      </div>
    </div>
  </>
);

export default ProductionDetailSkeleton;
