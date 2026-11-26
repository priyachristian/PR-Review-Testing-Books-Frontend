import { Modal } from '@/components/AntDComponent';
import CloseIconButton from '@/components/ui/button/CloseIconButton';

const CustomModal = ({
  modalOpen,
  setModalOpen,
  title,
  children,
  width = 520,
  showCloseIcon = true,
  closeIconDisabled = false,
  destroyOnClose = false,
  className,
  styles,
  afterOpenChange,
  ...rest
}) => {
  return (
    <div>
      <Modal
        {...rest}
        title={
          <div className="flex w-full items-center justify-between gap-3">
            <div className="min-w-0 text-sm font-semibold">{title}</div>
            {showCloseIcon && <CloseIconButton onClick={() => setModalOpen(false)} disabled={closeIconDisabled} />}
          </div>
        }
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        footer={false}
        width={width}
        maskClosable={false}
        closable={false}
        destroyOnClose={destroyOnClose}
        className={className}
        styles={styles}
        afterOpenChange={afterOpenChange}
      >
        {children}
      </Modal>
    </div>
  );
};

export default CustomModal;
