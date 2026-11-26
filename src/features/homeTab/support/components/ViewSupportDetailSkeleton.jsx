const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const Field = () => (
  <div className="space-y-2">
    <S w={90} h={12} />
    <S w="85%" h={18} />
  </div>
);

const GridRow = ({ cols = 3 }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
    {Array.from({ length: cols }).map((_, idx) => (
      <Field key={idx} />
    ))}
  </div>
);

const ViewSupportDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2 min-w-0">
            <S w={180} h={22} />
            <div className="flex items-center gap-2">
              <S w={80} h={14} />
              <S w={8} h={8} className="rounded-full" />
              <S w={64} h={18} className="rounded-full" />
              <S w={8} h={8} className="rounded-full" />
              <S w={56} h={18} className="rounded-full" />
            </div>
          </div>
        </div>
        <S w={90} h={32} className="rounded-md" />
      </div>
    </div>

    <div className="pt-5">
      <div className="flex items-center gap-8 border-b border-gray-200 px-1 pb-0 mb-4">
        {[80, 90].map((w, i) => (
          <div key={i} className={`pb-2 ${i === 0 ? 'border-b-2 -mb-px' : ''}`} style={i === 0 ? { borderColor: 'var(--primary-500, #1677ff)' } : undefined}>
            <S w={w} h={18} />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="my-container container-spacing">
          <S w={110} h={22} />
          <div className="mt-3 rounded-lg border border-gray-200 bg-[#FBFCFE] p-3">
            <div className="flex items-start gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 min-w-[88px]">
                  <S w={24} h={24} className="rounded-full" />
                  <S w={72} h={12} />
                  <S w={56} h={10} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <S w={190} h={22} />
          <div className="mt-2 space-y-4">
            <GridRow />
            <GridRow />
            <GridRow />
          </div>
        </div>

        <div className="my-container container-spacing">
          <S w={160} h={22} />
          <div className="mt-3 space-y-3">
            <S w="100%" h={14} />
            <S w="85%" h={14} />
            <S w="60%" h={14} />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4 pt-2">
              <Field />
              <Field />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default ViewSupportDetailSkeleton;
