import { useMemo, useState } from 'react';

// Components
import { Form, Select, Tag } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import CustomButton from '@/components/ui/button/CustomButton';

const RejectionReasonModal = ({
  open,
  onCancel,
  onSubmit,
  reasons = [],
  loading = false,
  idLabel = 'SQ No',
  idValue,
  status,
  statusLabelMap,
  warningMessage = 'You are about to reject this quotation. This action cannot be undone.',
}) => {
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const normalizedReasons = useMemo(() => (Array.isArray(reasons) ? reasons.filter(Boolean) : []), [reasons]);

  const selectOptions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const fromList = normalizedReasons.filter(reason => !q || reason.toLowerCase().includes(q)).map(reason => ({ value: reason, label: reason }));

    const trimmed = searchText.trim();
    const hasExactMatch = normalizedReasons.some(r => r.toLowerCase() === trimmed.toLowerCase());
    const showCreate = Boolean(trimmed && !hasExactMatch);

    if (!showCreate) {
      return fromList;
    }

    const primary = colorPalette.primary[500];
    return [
      ...fromList,
      {
        value: trimmed,
        label: (
          <span className="flex items-center gap-2 text-[13px] font-medium" style={{ color: primary }}>
            <Icons.PlusOutlined style={{ color: primary }} />
            <span>Create &quot;{trimmed}&quot;</span>
          </span>
        ),
      },
    ];
  }, [normalizedReasons, searchText]);

  const closeAndReset = () => {
    form.resetFields();
    setSearchText('');
    onCancel?.();
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const rejectionReason = values.rejectionReason;
    await onSubmit?.(rejectionReason);
    closeAndReset();
  };

  return (
    <CustomModal modalOpen={open} setModalOpen={() => closeAndReset()} title="Mark Quotation as Rejected?" destroyOnClose>
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
      <Form form={form} layout="vertical mt-5">
        <Form.Item name="rejectionReason" label="Rejection Reason" rules={[{ required: true, message: 'Rejection reason is required' }]}>
          <Select
            allowClear
            placeholder="Search or type rejection reason"
            options={selectOptions}
            showSearch
            searchValue={searchText}
            onSearch={setSearchText}
            onSelect={() => setSearchText('')}
            onClear={() => setSearchText('')}
            onDropdownVisibleChange={visible => {
              if (!visible) {
                setSearchText('');
              }
            }}
            filterOption={false}
            optionLabelProp="value"
          />
        </Form.Item>
      </Form>
      <div className="flex justify-end gap-3 pt-7">
        <CustomButton onClick={closeAndReset} disabled={loading} className="px-5">
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
