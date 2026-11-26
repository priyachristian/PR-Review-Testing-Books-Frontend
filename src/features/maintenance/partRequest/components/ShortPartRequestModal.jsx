import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { usePartRequest } from '../usePartRequest';

const ShortPartRequestModal = ({ open, partRequest, onClose, onSuccess }) => {
  const { updateLoading, shortPartRequest } = usePartRequest();

  const handleConfirm = async () => {
    if (updateLoading) return;

    try {
      await shortPartRequest({ partRequestId: partRequest?.id || partRequest?._id });
      onSuccess?.();
      onClose();
    } catch {
      // The slice already shows the error toast.
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen && !updateLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={updateLoading}
      width={520}
      title="Mark Part Request Short"
    >
      <p className="mb-4 text-sm text-slate-600">
        {partRequest?.mrNo ? <span className="font-semibold text-slate-900">{partRequest.mrNo}</span> : 'This part request'} will move to Short because the part could not be issued.
      </p>

      <div className="flex items-center justify-end gap-4 pt-6">
        <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={updateLoading} onClick={onClose} />
        <CustomButton className="px-7 py-4" text="Mark Short" type="primary" onClick={handleConfirm} loading={updateLoading} />
      </div>
    </CustomModal>
  );
};

export default ShortPartRequestModal;
