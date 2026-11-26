import { useEffect, useState } from 'react';

// Components
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { Button, Radio } from '@/components/AntDComponent';

const DispatchExportModal = ({ modalOpen, setModalOpen, onConfirm, title, actionLabel = 'Download' }) => {
  const [includeDispatch, setIncludeDispatch] = useState('yes');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setIncludeDispatch('yes');
      setIsProcessing(false);
    }
  }, [modalOpen]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const result = onConfirm(includeDispatch === 'yes');
      if (result && typeof result.then === 'function') {
        await result;
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Dispatch export error:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    setModalOpen(false);
  };

  return (
    <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title={title || `${actionLabel} Invoice PDF`} width={520} destroyOnClose={true}>
      <div className="space-y-4 py-2">
        {/* Include Dispatch Details Selection */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-2">Include Dispatch Details</div>
          <Radio.Group value={includeDispatch} onChange={e => setIncludeDispatch(e.target.value)} className="flex gap-4" disabled={isProcessing}>
            <Radio value="yes">Yes</Radio>
            <Radio value="no">No</Radio>
          </Radio.Group>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleConfirm} disabled={isProcessing} loading={isProcessing}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default DispatchExportModal;
