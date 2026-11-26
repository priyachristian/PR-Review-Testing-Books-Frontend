import { Button } from 'antd';

// Extras
import { colorPalette } from '@/utils/theme';

// Extended types beyond Ant Design's primary/default/dashed/link/text
const CUSTOM_TYPES = new Set(['secondary', 'success', 'warning', 'ghost', 'outline']);
const ANTD_TYPES = new Set(['primary', 'default', 'dashed', 'link', 'text']);

const CustomButton = ({ text, className = '', onClick, type = 'default', size = 'middle', loading = false, disabled = false, icon, children, danger, style, ...props }) => {
  const isDangerType = type === 'danger';
  const isCustomType = CUSTOM_TYPES.has(type);
  const resolvedDanger = Boolean(danger || isDangerType);
  // Ant Design only accepts primary|default|dashed|link|text
  const antdType = isDangerType ? 'primary' : isCustomType ? 'default' : ANTD_TYPES.has(type) ? type : 'default';

  // Base colors only — React style cannot apply :hover; hover lives in Custom.css
  const getTypeStyles = () => {
    switch (type) {
      case 'secondary':
        return {
          backgroundColor: colorPalette.secondary[50],
          borderColor: colorPalette.secondary[300],
          color: colorPalette.secondary[700],
        };
      case 'success':
        return {
          backgroundColor: colorPalette.success[500],
          borderColor: colorPalette.success[500],
          color: '#ffffff',
        };
      case 'warning':
        return {
          backgroundColor: colorPalette.warning[500],
          borderColor: colorPalette.warning[500],
          color: '#ffffff',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: colorPalette.primary[500],
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colorPalette.primary[500],
          color: colorPalette.primary[500],
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: '28px',
          padding: '4px 12px',
          fontSize: '12px',
        };
      case 'large':
        return {
          height: '44px',
          padding: '8px 20px',
          fontSize: '16px',
        };
      default:
        return {
          height: '32px',
          padding: '6px 13px',
          fontSize: '13px',
        };
    }
  };

  const buttonStyles = {
    ...getTypeStyles(),
    ...getSizeStyles(),
    borderRadius: '6px',
    fontWeight: 500,
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const typeClass = isCustomType ? `custom-button-${type}` : '';

  return (
    <Button
      type={antdType}
      size={size}
      loading={loading}
      disabled={disabled}
      danger={resolvedDanger}
      icon={icon}
      onClick={onClick}
      className={`custom-button ${typeClass} ${className}`.trim()}
      style={buttonStyles}
      {...props}
    >
      {text || children}
    </Button>
  );
};

export default CustomButton;
