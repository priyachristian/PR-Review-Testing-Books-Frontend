import { Button } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { colorPalette } from 'utils/theme';

export const UnsavedChangesModal = ({ modalInstanceRef, onConfirm, onCancel, onClose }) => ({
  title: (
    <div className="flex justify-between items-center">
      <div className="text-base font-semibold">Unsaved Changes</div>
      <Button
        size="small"
        icon={<Icons.CloseOutlined />}
        onClick={() => {
          if (onClose) {
            onClose();
          } else if (onCancel) {
            onCancel();
          }
          modalInstanceRef?.current?.destroy();
        }}
        className="hover:bg-gray-100"
      />
    </div>
  ),
  content: 'You have unsaved changes. Do you really want to leave?',
  okText: 'Leave',
  cancelText: 'Stay',
  onOk: onConfirm,
  onCancel,
  okButtonProps: {
    style: {
      backgroundColor: colorPalette.primary[500],
      borderColor: colorPalette.primary[500],
      color: '#fff',
    },
  },
});

export default UnsavedChangesModal;
