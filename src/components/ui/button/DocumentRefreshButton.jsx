import { Button } from 'antd';
import { useState } from 'react';

import Icons from '@/assets/icons/icon';

const DocumentRefreshButton = ({ onRefresh, label = 'Refresh', disabled = false, className = '' }) => {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning || disabled) return;
    setSpinning(true);
    try {
      await onRefresh?.();
    } catch {
      // errors are already handled (toasted) by the redux slice
    } finally {
      setSpinning(false);
    }
  };

  return (
    <Button type="default" size="middle" disabled={disabled || spinning} onClick={handleClick} icon={<Icons.ReloadOutlined spin={spinning} />} className={`flex items-center ${className}`}>
      {label}
    </Button>
  );
};

export default DocumentRefreshButton;
