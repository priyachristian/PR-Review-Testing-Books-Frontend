const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const BatchDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center space-x-4">
        <S w={36} h={36} className="rounded-md flex-shrink-0" />
        <div className="flex flex-col gap-1.5">
          <S w={160} h={22} />
          <S w={220} h={14} />
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
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <S w={100} h={12} className="mb-3" />
                <S w="60%" h={22} />
              </div>
            ))}
          </div>
          <div className="my-container container-spacing">
            <S w={160} h={22} className="mb-3" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="space-y-2">
                  <S w={100} h={14} />
                  <S w="80%" h={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3 shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <S w={120} h={12} />
          </div>
          <div className="p-3 space-y-2">
            {[0, 1, 2].map(i => (
              <S key={i} w="100%" h={32} className="rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

export default BatchDetailSkeleton;
