import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Extras
import Icons from 'assets/icons/icon';
import { SESSION_DURATION } from 'utils/constants';

const SessionTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);

  useEffect(() => {
    if (!isSplitSessionActive) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const storedStartTime = localStorage.getItem('splitSession');
      if (!storedStartTime) {
        setTimeLeft(0);
        return;
      }

      const now = Date.now();
      const startTime = parseInt(storedStartTime, 10);
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remainingTime = SESSION_DURATION - elapsedSeconds;

      if (remainingTime <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(remainingTime);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isSplitSessionActive]);

  // Don't render if session is not active or time is up
  if (!isSplitSessionActive || timeLeft <= 0) {
    return null;
  }

  // Format time as MM:SS
  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Determine color based on remaining time
  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-red-500'; // Red for last 30 seconds
    if (timeLeft <= 60) return 'text-orange-500'; // Orange for last minute
    return 'text-green-600'; // Green for safe time
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border">
      <Icons.ClockCircleOutlined className={`text-sm ${getTimerColor()}`} />
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-600 leading-none">Session ends in</span>
        <span className={`text-sm font-mono font-semibold leading-none ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

export default SessionTimer;
