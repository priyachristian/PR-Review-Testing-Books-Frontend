import Icons from 'assets/icons/icon';
import { Tooltip } from '@/components/AntDComponent';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { formatMaintenanceCountdown, getMaintenanceTooltipContent } from '@/utils/maintenanceMode';

const MaintenanceTooltipTitle = ({ formattedTime, maintenanceModeMessage, activateAt }) => {
  const { title, timeRemaining, scheduledAt, message } = getMaintenanceTooltipContent({
    formattedTime,
    maintenanceModeMessage,
    activateAt,
  });

  return (
    <div className="max-w-[260px] text-xs leading-snug">
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div>{timeRemaining}</div>
      {scheduledAt && <div className="mt-1 text-gray-200">Starts at: {scheduledAt}</div>}
      <div className="mt-1.5">{message}</div>
    </div>
  );
};

const MaintenanceCountdownTimer = ({ variant = 'inline', tooltipPlacement = 'bottom' }) => {
  const { isCountdownActive, timeLeftMs, maintenanceModeMessage, activateAt } = useMaintenanceMode();

  if (!isCountdownActive || timeLeftMs <= 0) {
    return null;
  }

  const getTimerColor = () => {
    if (timeLeftMs <= 5 * 60 * 1000) return 'text-red-500';
    if (timeLeftMs <= 30 * 60 * 1000) return 'text-orange-500';
    return 'text-amber-600';
  };

  const timerColor = getTimerColor();
  const formattedTime = formatMaintenanceCountdown(timeLeftMs);

  const tooltipTitle = <MaintenanceTooltipTitle formattedTime={formattedTime} maintenanceModeMessage={maintenanceModeMessage} activateAt={activateAt} />;

  const wrapWithTooltip = (content, { trigger } = {}) => (
    <Tooltip title={tooltipTitle} placement={tooltipPlacement} trigger={trigger}>
      <div className="cursor-help">{content}</div>
    </Tooltip>
  );

  if (variant === 'banner') {
    return wrapWithTooltip(
      <div className="w-full h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 bg-amber-50 text-amber-900 min-w-0">
        <Icons.ClockCircleOutlined className={`text-sm flex-shrink-0 ${timerColor}`} />
        <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap">Maintenance in</span>
        <span className={`text-[11px] sm:text-sm font-mono font-semibold whitespace-nowrap ${timerColor}`}>{formattedTime}</span>
      </div>,
      { trigger: ['hover', 'focus', 'click'] }
    );
  }

  if (variant === 'compact') {
    return wrapWithTooltip(
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded-md border border-amber-200 min-w-0 max-w-[100px] sm:max-w-[140px]">
        <Icons.ClockCircleOutlined className={`text-xs flex-shrink-0 ${timerColor}`} />
        <span className={`text-[10px] sm:text-xs font-mono font-semibold truncate ${timerColor}`}>{formattedTime}</span>
      </div>,
      { trigger: ['hover', 'focus', 'click'] }
    );
  }

  return wrapWithTooltip(
    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200 flex-shrink-0">
      <Icons.ClockCircleOutlined className={`text-sm ${timerColor}`} />
      <div className="flex flex-col items-center">
        <span className="text-xs text-amber-800 leading-none whitespace-nowrap">Maintenance in</span>
        <span className={`text-sm font-mono font-semibold leading-none whitespace-nowrap ${timerColor}`}>{formattedTime}</span>
      </div>
    </div>
  );
};

export default MaintenanceCountdownTimer;
