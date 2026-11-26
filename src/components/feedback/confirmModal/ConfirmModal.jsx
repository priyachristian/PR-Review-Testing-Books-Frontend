// Components
import { Modal } from '../../AntDComponent';

// Extras
import Icons from 'assets/icons/icon';
import { colorPalette } from 'utils/theme';

const ConfirmModal = ({
  title = '',
  content = '',
  okText = 'Ok',
  cancelText = 'Cancel',
  onOk = () => {},
  onCancel,
  width = '480px',
  variant = 'confirm', // 'confirm' | 'warning'
}) => {
  const showModal = () => {
    const isWarning = variant === 'warning';
    const modalConfig = {
      title,
      content,
      okText,
      cancelText,
      onOk,
      ...(onCancel && { onCancel }),
      width,
      okButtonProps: {
        type: 'primary',
        className: 'confirm-modal-ok-button',
        style: {
          backgroundColor: colorPalette.primary[500],
          borderColor: colorPalette.primary[500],
        },
      },
      cancelButtonProps: {
        className: 'confirm-modal-cancel-button',
        style: {
          borderColor: colorPalette.neutral[300],
          color: colorPalette.neutral[700],
        },
      },
      wrapClassName: 'confirm-modal-theme',
    };

    if (isWarning) {
      modalConfig.icon = <Icons.ExclamationCircleOutlined style={{ color: colorPalette.warning[500], fontSize: 22 }} />;
    }

    Modal.confirm(modalConfig);
  };

  return { showModal };
};

export default ConfirmModal;
