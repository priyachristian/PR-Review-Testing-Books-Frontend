import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Popconfirm, Tooltip } from 'antd';

// Components
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Toast from '@/components/ui/common/Toast';

// Hooks
import { useQuotationConfig } from '@/features/setting/quotationConfig/useQuotationConfig';
import useModulePermissions from '@/hooks/useModulePermissions';

// Extras
import Icons from 'assets/icons/icon';
import { colorPalette } from 'utils/theme';

const QuotationConfigPage = () => {
  const { quoteCloseReasons, loading, saving, getQuotationConfig, updateQuotationConfig } = useQuotationConfig();
  const { isViewOnly } = useModulePermissions();
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getQuotationConfig({ signal: controller.signal });
    return () => controller.abort();
  }, [getQuotationConfig]);

  const tableData = useMemo(() => (quoteCloseReasons || []).map(reason => ({ key: reason, reason })), [quoteCloseReasons]);

  const openAdd = () => {
    setEditingOriginal(null);
    setReasonText('');
    setTouched(false);
    setModalOpen(true);
  };

  const openEdit = reason => {
    setEditingOriginal(reason);
    setReasonText(reason);
    setTouched(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOriginal(null);
    setReasonText('');
    setTouched(false);
  };

  const buildNextReasons = trimmed => {
    if (editingOriginal != null) {
      return quoteCloseReasons.map(r => (r === editingOriginal ? trimmed : r));
    }
    return [...quoteCloseReasons, trimmed];
  };

  const listHasDuplicate = list => {
    const seen = new Set();
    for (const s of list) {
      const k = String(s).trim();
      if (seen.has(k)) return true;
      seen.add(k);
    }
    return false;
  };

  const handleSave = async () => {
    setTouched(true);
    const trimmed = reasonText.trim();
    if (!trimmed) {
      return;
    }

    const next = buildNextReasons(trimmed);
    if (listHasDuplicate(next)) {
      Toast.error('Rejection reasons must be unique');
      return;
    }

    const result = await updateQuotationConfig({ quoteCloseReasons: next });
    if (result.meta.requestStatus === 'fulfilled') {
      closeModal();
    }
  };

  const handleDelete = async reason => {
    const next = quoteCloseReasons.filter(r => r !== reason);
    await updateQuotationConfig({ quoteCloseReasons: next });
  };

  const columns = [
    {
      title: 'Rejection reason',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="flex space-x-2">
          <Tooltip title="Edit rejection reason">
            <Icons.EditOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} className="cursor-pointer" onClick={() => openEdit(record.reason)} />
          </Tooltip>
          <Popconfirm title="Remove rejection reason" description="Are you sure you want to remove this rejection reason?" onConfirm={() => handleDelete(record.reason)} okText="Yes" cancelText="No">
            <Tooltip title="Delete rejection reason">
              <Icons.DeleteOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const showError = touched && !reasonText.trim();

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="bg-[#0ea5e91a] flex justify-center items-center w-10 h-10 rounded-lg p-2 shrink-0">
            <Icons.FileTextOutlined className="text-[#0ea5e9] text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Quotation configuration</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure rejection reasons used when closing or rejecting quotes</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow">
        <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#030711] leading-tight">Rejection Reasons</h3>
              <p className="text-xs text-[#6b7280] font-medium mt-1">Add, edit, or remove reasons available when rejecting a quotation</p>
            </div>
            <PermissionButton
              canAccess={isAdmin}
              isViewOnly={isViewOnly}
              type="primary"
              text="Add Reason"
              icon={<Icons.PlusCircleOutlined />}
              onClick={openAdd}
              className="w-full sm:w-auto shrink-0"
              wrapperClassName="w-full sm:w-auto inline-block shrink-0"
            />
          </div>
        </div>
        <CustomTable columns={columns} data={tableData} loading={loading} />

        <CustomModal modalOpen={modalOpen} setModalOpen={closeModal} title={editingOriginal != null ? 'Edit Rejection Reason' : 'Add Rejection Reason'} width={480} destroyOnClose>
          <div className="pt-1">
            <label htmlFor="quoteCloseReason" className="leading-none font-medium text-sm text-[#030711] mb-1 block">
              <span className="text-red-500 mr-1">*</span>
              Rejection Reason
            </label>
            <CustomInput
              type="textarea"
              name="quoteCloseReason"
              placeholder="Enter rejection reason"
              className="font-normal min-h-[100px] rounded-md"
              rows={4}
              value={reasonText}
              onChange={e => setReasonText(e.target.value)}
              onBlur={() => setTouched(true)}
              errorMessage={showError ? 'Please input a rejection reason.' : ''}
              touched={showError}
              required
            />
          </div>
          <div className="flex gap-4 justify-end items-center pt-7">
            <CustomButton text="Cancel" disabled={saving} onClick={closeModal} />
            <CustomButton type="primary" text="Save" loading={saving} onClick={handleSave} />
          </div>
        </CustomModal>
      </div>
    </div>
  );
};

export default QuotationConfigPage;
