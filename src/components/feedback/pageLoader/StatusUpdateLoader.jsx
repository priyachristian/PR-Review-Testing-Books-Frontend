// Components
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

const StatusUpdateLoader = ({ loading, hidden = false, text = 'Updating status...', variant = 'ring', size = 'default', className = '' }) => {
  if (!loading || hidden) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader variant={variant} size={size} text={text} className="" />
          <div className="text-center">
            <p className="text-sm text-gray-600">Please wait while we update the status...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateLoader;
