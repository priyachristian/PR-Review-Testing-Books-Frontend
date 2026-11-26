// Mirrors SampleCatalogDetail: header with code and status, Overview tab, Actions and Document Information cards.
const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const FieldSkeleton = ({ className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <S w={88} h={12} />
    <S w="70%" h={16} />
  </div>
);

const TableSkeleton = ({ cols = 5, rows = 4 }) => (
  <div className="overflow-x-auto mt-2">
    <table className="w-full border-collapse bg-white">
      <thead>
        <tr className="bg-gray-50">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="border border-gray-200 py-3 px-3 text-left">
              <S w={i === 0 ? 72 : 64} h={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }).map((_, col) => (
              <td key={col} className="border border-gray-200 py-3 px-3">
                <S w={col === 0 ? '60%' : '45%'} h={14} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SidebarCard = ({ titleWidth, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={titleWidth} h={12} />
    </div>
    <div className="p-3 space-y-3">{children}</div>
  </div>
);

const SampleCatalogDetailSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2">
            <S w={200} h={20} />
            <div className="flex items-center gap-2">
              <S w={64} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={60} h={18} className="rounded-full" />
            </div>
          </div>
        </div>
        <S w={96} h={36} className="rounded-md flex-shrink-0" />
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-3 gap-6 xl:gap-8">
      <div className="w-full xl:w-3/4 min-w-0">
        <div className="flex items-center gap-8 border-b border-gray-200 px-1 pb-0 mb-4 mt-3">
          <div className="pb-2 border-b-2 -mb-px" style={{ borderColor: 'var(--primary-500, #1677ff)' }}>
            <S w={70} h={18} />
          </div>
        </div>
        <div className="space-y-10">
          <div className="my-container container-spacing">
            <S w={180} h={22} className="mb-3" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <FieldSkeleton key={i} />
              ))}
              <FieldSkeleton className="md:col-span-2 lg:col-span-3" />
            </div>
          </div>
          <div className="my-container container-spacing">
            <S w={170} h={22} className="mb-3" />
            <TableSkeleton cols={5} rows={4} />
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3 shrink-0">
        <SidebarCard titleWidth={50}>
          <S w="100%" h={36} className="rounded-md" />
          <S w="100%" h={36} className="rounded-md" />
        </SidebarCard>
        <SidebarCard titleWidth={140}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <S w={70} h={12} />
              <S w={80} h={12} />
            </div>
          ))}
        </SidebarCard>
      </div>
    </div>
  </>
);

export default SampleCatalogDetailSkeleton;
