import { Button, Tooltip } from 'antd';
import Icons from 'assets/icons/icon';

const DISABLED_TOOLTIP = 'Only Applied Filters Should be Lockable.';

const FilterLockButton = ({ isLocked, activeFiltersCount = 0, onToggle }) => {
  const lockDisabled = !isLocked && activeFiltersCount === 0;

  const tooltipTitle = lockDisabled ? DISABLED_TOOLTIP : isLocked ? 'Unlock filters to clear saved preferences' : 'Lock current filters to save preferences';

  const button = (
    <Button type={isLocked ? 'primary' : 'default'} icon={isLocked ? <Icons.UnlockOutlined /> : <Icons.LockOutlined />} onClick={onToggle} disabled={lockDisabled}>
      {isLocked ? 'Unlock' : 'Lock'}
    </Button>
  );

  return (
    <Tooltip title={tooltipTitle} placement="top">
      {lockDisabled ? <span className="inline-block">{button}</span> : button}
    </Tooltip>
  );
};

export default FilterLockButton;
