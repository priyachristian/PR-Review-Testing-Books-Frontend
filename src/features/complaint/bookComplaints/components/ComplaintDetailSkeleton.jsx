const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const SummarySkeleton = () => (
  <div className="my-container container-spacing">
    <S w={260} h={22} className="mb-2" />
    <S w={180} h={14} className="mb-3" />
    <S w="70%" h={13} className="mb-1" />
    <S w="55%" h={13} />

    <div className="mt-4 pt-3 border-t border-gray-100">
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <S w={70} h={12} />
            <S w="85%" h={16} />
            <S w="60%" h={12} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StepsSkeleton = () => (
  <div className="my-container container-spacing">
    <S w={120} h={20} className="mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start py-2">
          <S w={24} h={24} className="rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 pt-0.5">
            <div className="flex items-center gap-2">
              <S w={i === 0 ? 90 : 110 + (i % 3) * 20} h={15} />
              <S w={80} h={12} />
            </div>
            {i === 1 ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <S w={160} h={14} />
                  <S w={88} h={28} className="rounded-md" />
                </div>
                <S w={140} h={28} className="rounded-md" />
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>

    <div className="mt-5 pt-4 border-t border-gray-100">
      <S w={100} h={14} className="mb-3" />
      <div className="flex flex-wrap gap-2">
        {[120, 140, 100, 130, 110].map((w, i) => (
          <S key={i} w={w} h={32} className="rounded-md" />
        ))}
      </div>
    </div>
  </div>
);

const TeamOnlySkeleton = () => (
  <div className="my-container container-spacing">
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-2.5">
        <S w={18} h={18} className="rounded-sm flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <S w={100} h={20} />
          <S w={200} h={13} />
        </div>
      </div>
      <S w={64} h={22} className="rounded-md" />
    </div>

    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <S w={50} h={16} />
        <S w={64} h={28} className="rounded-md" />
      </div>
      {[0, 1].map(i => (
        <div key={i} className="flex items-start gap-2.5">
          <S w={16} h={16} className="rounded-full flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <S w={i === 0 ? 180 : 140} h={14} />
            <S w={120} h={12} />
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <S w={50} h={16} />
      <S w="100%" h={72} className="rounded-md" />
      <S w={90} h={32} className="rounded-md" />
    </div>
  </div>
);

const HistorySkeleton = () => (
  <div className="my-container container-spacing">
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <S w={16} h={16} className="rounded-sm" />
        <S w={110} h={20} />
      </div>
      <S w={80} h={14} />
    </div>
    <S w="75%" h={13} className="mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 sm:gap-6">
      <div className="space-y-2">
        <S w={90} h={16} />
        <S w={70} h={13} />
      </div>
      <div className="space-y-2">
        <S w={200} h={13} />
        <S w="90%" h={13} />
      </div>
    </div>
  </div>
);

const ComplaintDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center space-x-4">
        <S w={32} h={32} className="rounded-md flex-shrink-0" />
        <div className="flex items-center gap-2 mt-1">
          <S w={100} h={14} />
          <S w={4} h={4} className="rounded-full" />
          <S w={72} h={22} className="rounded-full" />
        </div>
      </div>
    </div>

    <div className="pt-8 space-y-4 pb-8">
      <SummarySkeleton />
      <StepsSkeleton />
      <TeamOnlySkeleton />
      <HistorySkeleton />
    </div>
  </>
);

export default ComplaintDetailSkeleton;
