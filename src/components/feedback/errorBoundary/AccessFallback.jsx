import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';

// Components
import CustomButton from '@/components/ui/button/CustomButton';

// Extras
import Icons from '@/assets/icons/icon';

const AccessFallback = ({ title = 'Access Denied', description = "You don't have permission to access this page", showHomeButton = true, onDismiss }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onDismiss?.();
    navigate('/home');
  };

  const handleGoBack = () => {
    onDismiss?.();
    navigate(-1);
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="custom-card max-w-lg w-full shadow-xl border border-gray-200 rounded-xl fade-in" bordered={false}>
        <div className="text-center p-6">
          {/* Warning Icon */}
          <div className="mb-6">
            <Icons.LockOutlined className="text-6xl text-yellow-500 mb-4" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">{title}</h2>

          {/* Description */}
          <p className="text-gray-600 text-base leading-relaxed mb-8">{description}. Please contact your administrator if you believe this is an error.</p>

          {/* Suggestion Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700 text-sm m-0 flex items-center justify-center">
              <Icons.InfoCircleOutlined className="mr-2" />
              Try going back to the dashboard or contact your system administrator for access.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {showHomeButton && <CustomButton text="Go to Dashboard" type="primary" size="large" icon={<Icons.HomeOutlined />} onClick={handleGoHome} className="px-8 py-4" />}

            <CustomButton text="Go Back" type="default" size="large" icon={<Icons.ArrowLeftOutlined />} onClick={handleGoBack} className="px-8 py-4" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccessFallback;
