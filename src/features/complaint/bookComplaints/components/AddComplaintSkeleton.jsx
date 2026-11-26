import { Skeleton } from '@/components/AntDComponent';

const FieldSkeleton = ({ labelWidth = 100 }) => (
  <div>
    <Skeleton.Input active size="small" style={{ width: labelWidth, height: 14, marginBottom: 8 }} />
    <Skeleton.Input active block style={{ height: 32 }} />
  </div>
);

const OptionCardSkeleton = () => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200">
    <Skeleton.Input active size="small" style={{ width: 140, height: 16 }} />
    <Skeleton.Button active size="small" style={{ width: 16, height: 16, minWidth: 16 }} />
  </div>
);

const WizardSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <Skeleton.Input active size="small" style={{ width: 220, height: 18, marginBottom: 12 }} />
      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        <OptionCardSkeleton />
        <OptionCardSkeleton />
      </div>
    </div>

    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <Skeleton.Input active size="small" style={{ width: 200, height: 18, marginBottom: 8 }} />
      <Skeleton.Input active size="small" style={{ width: 180, height: 14, marginBottom: 12 }} />
      <Skeleton.Input active block style={{ height: 32 }} />
    </div>
  </div>
);

const FormSkeleton = () => (
  <>
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
        <FieldSkeleton labelWidth={110} />
        <FieldSkeleton labelWidth={130} />
        <FieldSkeleton labelWidth={120} />
      </div>

      <FieldSkeleton labelWidth={140} />

      <div>
        <Skeleton.Input active size="small" style={{ width: 180, height: 14, marginBottom: 8 }} />
        <Skeleton.Input active block style={{ height: 96 }} />
      </div>

      <div className="grid md:grid-cols-2 gap-x-7 gap-y-5">
        <div>
          <Skeleton.Input active size="small" style={{ width: 140, height: 14, marginBottom: 8 }} />
          <Skeleton.Button active block style={{ height: 72 }} />
        </div>
        <div>
          <Skeleton.Input active size="small" style={{ width: 100, height: 14, marginBottom: 8 }} />
          <Skeleton.Button active block style={{ height: 72 }} />
        </div>
      </div>
    </div>

    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-start gap-4 px-12 py-[12.5px]">
        <Skeleton.Button active style={{ width: 88, height: 32 }} />
        <Skeleton.Button active style={{ width: 88, height: 32 }} />
      </div>
    </div>
  </>
);

const AddComplaintSkeleton = ({ isEdit = false }) => (
  <>
    <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center space-x-4">
          <Skeleton.Button active shape="circle" size="default" />
          <Skeleton.Input active size="small" style={{ width: isEdit ? 140 : 150, height: 22 }} />
        </div>
      </div>
    </div>

    <div className="relative pb-24 bg-white pt-16 -m-4">
      <div className="px-6 flex flex-col gap-4">{isEdit ? <FormSkeleton /> : <WizardSkeleton />}</div>
    </div>
  </>
);

export default AddComplaintSkeleton;
