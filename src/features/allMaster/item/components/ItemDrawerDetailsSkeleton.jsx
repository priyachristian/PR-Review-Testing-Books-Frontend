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

const ItemDrawerDetailsSkeleton = () => {
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
    </div>
  );
};

export default ItemDrawerDetailsSkeleton;
