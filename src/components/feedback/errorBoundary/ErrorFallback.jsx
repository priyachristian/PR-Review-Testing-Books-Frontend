import { Alert } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';

// Extras
import Icons from 'assets/icons/icon';

const fallbackURL = import.meta.env.VITE_FALLBACK_URL;

const ErrorFallback = ({ filtersCleared = false }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-background">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <Icons.FrownOutlined style={{ fontSize: '40px' }} />
        <h1 className="text-4xl font-bold tracking-tight">Oops!</h1>
        <p className="text-lg text-muted-foreground">Something went wrong. Don't worry, we're on it.</p>

        {filtersCleared && (
          <Alert
            message="Page Configuration Cleared"
            description="We detected an issue with saved filters and column settings on this page and have cleared them to prevent further errors."
            type="info"
            showIcon
            className="w-full text-left"
          />
        )}

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <CustomButton
            className="px-8 py-4"
            type="primary"
            text={'Go To Home'}
            onClick={() => {
              window.location.href = fallbackURL;
            }}
          />
          <CustomButton
            className="px-8 py-4"
            type="default"
            text="Try Again"
            onClick={() => {
              window.location.reload();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
