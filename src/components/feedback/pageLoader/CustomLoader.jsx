import { Spin } from 'antd';
import { colorPalette } from 'utils/theme';

const CustomLoader = ({ size = 'default', variant = 'spinner', text = '', className = '', fullScreen = false }) => {
  // Spinner variant (default)
  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Spin size={size} style={{ color: colorPalette.primary[500] }} />
          {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
        </div>
      </div>
    );
  }

  // Pulse variant
  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-0 left-0 w-8 h-8 bg-blue-500 rounded-full"></div>
          </div>
          {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
        </div>
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
        </div>
      </div>
    );
  }

  // Ring variant
  if (variant === 'ring') {
    return (
      <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{
              borderColor: colorPalette.primary[200],
              borderTopColor: colorPalette.primary[500],
            }}
          ></div>
          {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
        </div>
      </div>
    );
  }

  // Button variant (for buttons)
  if (variant === 'button') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {text && <span className="text-sm">{text}</span>}
      </div>
    );
  }

  // Inline variant (for inline loading)
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        {text && <span className="text-xs text-gray-600">{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : ''} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Spin size={size} />
        {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
      </div>
    </div>
  );
};

export default CustomLoader;
