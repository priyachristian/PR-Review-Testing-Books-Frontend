import { Skeleton } from '@/components/AntDComponent';

const SectionTitle = ({ width = 200 }) => (
  <div className="flex items-center justify-between gap-4">
    <Skeleton.Input active size="small" style={{ width, height: 16 }} />
  </div>
);

const FieldSkeleton = ({ labelWidth = 110 }) => (
  <div className="space-y-2">
    <Skeleton.Input active size="small" style={{ width: labelWidth, height: 14 }} />
    <Skeleton.Input active size="default" style={{ width: '100%', height: 20 }} />
  </div>
);

const InfoGrid = () => (
  <div className="mt-3 space-y-3">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, idx) => (
        <div key={idx}>
          <FieldSkeleton labelWidth={idx % 3 === 0 ? 120 : 100} />
        </div>
      ))}
    </div>
  </div>
);

const AddressGrid = () => (
  <div className="mt-4 space-y-4">
    {['Billing Address', 'Shipping Address'].map(title => (
      <div key={title} className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <Skeleton.Input active size="small" style={{ width: 160, height: 16 }} />
        </div>
        <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx}>
              <FieldSkeleton labelWidth={idx % 2 === 0 ? 130 : 110} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const BranchTable = () => (
  <div className="my-container container-spacing">
    <div className="flex items-center justify-between pb-2">
      <SectionTitle width={120} />
    </div>
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-6 gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton.Input key={idx} active size="small" style={{ width: '100%', height: 14 }} />
          ))}
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-6 gap-2 px-3 py-3">
              {Array.from({ length: 6 }).map((__, colIdx) => (
                <Skeleton.Input key={colIdx} active size="small" style={{ width: '100%', height: 14 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CustomerDrawerDetailsSkeleton = () => {
  return (
    <div className="px-4 py-3 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton.Button active size="small" style={{ width: 110, height: 28 }} />
        <Skeleton.Button active size="small" style={{ width: 90, height: 28 }} />
      </div>

      <div className="my-container container-spacing">
        <SectionTitle width={190} />
        <InfoGrid />
      </div>

      <BranchTable />

      <div className="my-container container-spacing">
        <SectionTitle width={110} />
        <AddressGrid />
      </div>
    </div>
  );
};

export default CustomerDrawerDetailsSkeleton;
