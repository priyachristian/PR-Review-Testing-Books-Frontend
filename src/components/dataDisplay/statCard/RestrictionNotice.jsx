import { Result } from '@/components/AntDComponent';

function RestrictionNotice({ status = 'warning', title = 'Action unavailable', subtitle = 'This action is currently unavailable. Please contact your administrator or try again later.', extra }) {
  return (
    <div className="w-full h-full flex items-center justify-center py-10">
      <Result status={status} title={title} subTitle={subtitle} extra={extra} />
    </div>
  );
}

export default RestrictionNotice;
