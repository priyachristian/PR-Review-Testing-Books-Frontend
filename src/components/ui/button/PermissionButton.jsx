import { Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import { PERMISSION_MESSAGES } from '@/utils/constants';

const PERMISSION_MSG = PERMISSION_MESSAGES.NO_PERMISSION;
const VIEW_ONLY_MSG = PERMISSION_MESSAGES.VIEW_ONLY;

const PermissionButton = ({
  canAccess = true,
  isViewOnly = false,
  disabled = false,
  tooltipTitle,
  tooltipProps,
  wrapperClassName = 'inline-flex items-center leading-none',
  children,
  ...buttonProps
}) => {
  const isPermissionBlocked = !canAccess;
  const isViewOnlyBlocked = isViewOnly;
  const isDisabled = isViewOnlyBlocked || isPermissionBlocked || disabled || buttonProps.disabled;

  if (isDisabled) {
    const tooltipMsg = tooltipTitle ?? (isViewOnlyBlocked ? VIEW_ONLY_MSG : isPermissionBlocked ? PERMISSION_MSG : undefined);

    if (tooltipMsg) {
      return (
        <Tooltip title={tooltipMsg} placement="top" {...tooltipProps}>
          {/* span wrapper needed — AntD Tooltip requires a non-disabled child */}
          <span className={wrapperClassName}>
            <CustomButton {...buttonProps} disabled>
              {children}
            </CustomButton>
          </span>
        </Tooltip>
      );
    }

    return (
      <CustomButton {...buttonProps} disabled>
        {children}
      </CustomButton>
    );
  }

  return <CustomButton {...buttonProps}>{children}</CustomButton>;
};

export default PermissionButton;
