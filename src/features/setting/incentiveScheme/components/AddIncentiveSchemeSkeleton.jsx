import { Skeleton } from '@/components/AntDComponent';

const FieldSkeleton = ({ labelWidth = 100 }) => (
  <div>
    <Skeleton.Input active size="small" style={{ width: labelWidth, height: 14, marginBottom: 8 }} />
    <Skeleton.Input active block style={{ height: 32 }} />
  </div>
);

const DocTypeRowSkeleton = () => (
  <div className="bg-[#fafaf9] border border-gray-200 rounded-lg px-3.5 py-3 mb-2.5">
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.6fr 0.8fr 0.8fr 1.4fr auto',
        gap: 12,
        alignItems: 'start',
      }}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <FieldSkeleton key={index} labelWidth={index === 0 ? 100 : index === 1 ? 80 : 50} />
      ))}
      <div className="flex items-end h-full pb-1">
        <Skeleton.Button active size="small" style={{ width: 32, height: 32 }} />
      </div>
    </div>
  </div>
);

const AddIncentiveSchemeSkeleton = () => (
  <>
    <div className="bg-white py-2 border-b">
      <div className="flex items-center space-x-4 h-full px-4">
        <Skeleton.Button active shape="circle" size="default" />
        <Skeleton.Input active size="small" style={{ width: 200, height: 22 }} />
      </div>
    </div>

    <div className="p-5">
      <div className="grid grid-cols-3 gap-x-4">
        <FieldSkeleton labelWidth={90} />
        <FieldSkeleton labelWidth={110} />
        <FieldSkeleton labelWidth={90} />
      </div>

      <div className="my-6">
        <Skeleton.Input active size="small" style={{ width: 160, height: 14 }} />
      </div>

      <DocTypeRowSkeleton />
      <Skeleton.Button active block style={{ height: 32, marginBottom: 12 }} />

      <div className="my-6">
        <Skeleton.Input active size="small" style={{ width: 90, height: 14 }} />
      </div>

      <div className="mb-2">
        <FieldSkeleton labelWidth={110} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 mb-16">
        <FieldSkeleton labelWidth={200} />
        <FieldSkeleton labelWidth={130} />
      </div>
    </div>

    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-end gap-4 px-6 py-[12.5px]">
        <Skeleton.Button active style={{ width: 120, height: 32 }} />
        <Skeleton.Button active style={{ width: 130, height: 32 }} />
      </div>
    </div>
  </>
);

export default AddIncentiveSchemeSkeleton;
