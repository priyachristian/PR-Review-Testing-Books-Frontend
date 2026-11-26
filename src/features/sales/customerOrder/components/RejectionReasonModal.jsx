// Components
import { Form, Input, Tag } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Assets
import Icons from '@/assets/icons/icon';
import CustomButton from '@/components/ui/button/CustomButton';

const { TextArea } = Input;

const RejectionReasonModal = ({
  open,
  onCancel,
  onSubmit,
  loading = false,
  idLabel = 'Order No',
  idValue,
  status,
  statusLabelMap,
  warningMessage = 'You are about to reject this customer order. This action cannot be undone.',
}) => {
  const [form] = Form.useForm();

  const closeAndReset = () => {
    form.resetFields();
    onCancel?.();
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit?.(values.rejectionReason);
    closeAndReset();
  };

  return (
    <CustomModal modalOpen={open} setModalOpen={() => closeAndReset()} title="Mark Order as Rejected?" destroyOnClose>
      {(idValue || status) && (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-2 gap-y-3 text-sm">
          <div className="font-medium text-gray-800">{idLabel} :</div>
          <div>
            <Tag className="font-semibold">{idValue || '-'}</Tag>
          </div>
          <div className="font-medium text-gray-800">New Status :</div>
          <div>
            <StatusBadge status={status} value={statusLabelMap?.[status] || '-'} />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 p-3 rounded-md bg-yellow-50 border border-yellow-200 mt-4">
        <Icons.ExclamationCircleOutlined className="text-yellow-600 text-xl mt-0.5" />
        <div className="text-sm text-gray-700 leading-relaxed">
          <p>{warningMessage}</p>
        </div>
      </div>

      <Form form={form} layout="vertical" className="mt-5">
        <Form.Item name="rejectionReason" label="Rejection Reason" rules={[{ required: true, message: 'Rejection reason is required' }]}>
          <TextArea rows={4} placeholder="Enter rejection reason..." className="rounded font-normal" />
        </Form.Item>
      </Form>

      <div className="flex justify-end gap-3 pt-4">
        <CustomButton type="default" onClick={closeAndReset} disabled={loading}>
          Cancel
        </CustomButton>
        <CustomButton type="primary" loading={loading} onClick={handleOk}>
          Yes, Proceed
        </CustomButton>
      </div>
    </CustomModal>
  );
};

export default RejectionReasonModal;
