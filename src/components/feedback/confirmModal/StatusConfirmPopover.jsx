import { useState } from 'react';
import { Popover } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

const VARIANT_CONFIG = {
  primary: {
    confirmButtonType: 'primary',
    iconBg: colorPalette.primary[50],
    iconColor: colorPalette.primary[600],
    calloutBorder: colorPalette.primary[100],
    calloutBg: colorPalette.primary[50],
  },
  danger: {
    confirmButtonType: 'danger',
    iconBg: colorPalette.error[50],
    iconColor: colorPalette.error[600],
    calloutBorder: colorPalette.error[100],
    calloutBg: colorPalette.error[50],
  },
  success: {
    confirmButtonType: 'success',
    iconBg: colorPalette.success[50],
    iconColor: colorPalette.success[600],
    calloutBorder: colorPalette.success[100],
    calloutBg: colorPalette.success[50],
  },
};

const StatusConfirmPopover = ({
  isActive,
  onConfirm,
  onCloseDropdown,
  label,
  icon,
  placement = 'left',
  getPopupContainer,
  confirmMessage,
  variant,
  contentWidth = 280,
  overlayInnerStyle,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedVariant = variant ?? (isActive ? 'danger' : 'success');
  const themeVariant = VARIANT_CONFIG[resolvedVariant] ?? VARIANT_CONFIG.danger;

  const handleConfirm = async e => {
    e?.stopPropagation();
    try {
      setLoading(true);
      await onConfirm();
      setOpen(false);
      if (onCloseDropdown) {
        onCloseDropdown();
      }
    } catch (err) {
      console.error('Error in confirm action:', err);
    } finally {
      setLoading(false);
    }
  };

  const popoverOverlayStyle = {
    borderRadius: 8,
    border: `1px solid ${colorPalette.neutral[200]}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    ...overlayInnerStyle,
  };

  const content = (
    <div
      style={{ width: contentWidth, maxWidth: contentWidth }}
      role="button"
      tabIndex={0}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="rounded-md px-3 py-2.5 mb-3"
        style={{
          background: resolvedVariant === 'primary' ? colorPalette.neutral[50] : themeVariant.calloutBg,
          border: `1px solid ${resolvedVariant === 'primary' ? colorPalette.neutral[100] : themeVariant.calloutBorder}`,
          borderRadius: 6,
        }}
      >
        <div className="text-sm font-medium leading-relaxed" style={{ color: colorPalette.neutral[700] }}>
          {confirmMessage}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <CustomButton
          type="default"
          size="small"
          text="Cancel"
          onClick={e => {
            e.stopPropagation();
            setOpen(false);
          }}
          disabled={loading}
        />
        <CustomButton size="small" text="Confirm" type={themeVariant.confirmButtonType} onClick={handleConfirm} loading={loading} disabled={loading} />
      </div>
    </div>
  );

  const titledIcon = icon ? <span style={{ color: themeVariant.iconColor, fontSize: 14, display: 'inline-flex' }}>{icon}</span> : null;

  return (
    <Popover
      content={content}
      title={
        <div className="flex items-center gap-2.5 -mx-1 pb-2 mb-1" style={{ borderBottom: `1px solid ${colorPalette.neutral[100]}` }}>
          {titledIcon && (
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: themeVariant.iconBg,
              }}
            >
              {titledIcon}
            </span>
          )}
          <span className="text-sm font-semibold leading-tight" style={{ color: colorPalette.neutral[900] }}>
            {label}
          </span>
        </div>
      }
      trigger="click"
      placement={placement}
      open={open}
      onOpenChange={setOpen}
      getPopupContainer={getPopupContainer}
      overlayClassName="status-confirm-popover"
      overlayStyle={{ zIndex: 1050 }}
      overlayInnerStyle={popoverOverlayStyle}
    >
      {children ? (
        // Presentational wrapper: only stops the click from reaching the Popover trigger; the children are the interactive element.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <span className="block w-full" onClick={e => e.stopPropagation()}>
          {children}
        </span>
      ) : (
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 cursor-pointer hover:bg-neutral-50"
          style={{ color: colorPalette.neutral[700] }}
        >
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
        </button>
      )}
    </Popover>
  );
};

export default StatusConfirmPopover;
