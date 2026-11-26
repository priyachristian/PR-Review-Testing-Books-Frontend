import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import AddEditPaymentTermModal from '@/features/setting/paymentTerm/components/AddEditPaymentTermModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { usePaymentTerm, paymentTermColumn } from '@/features/setting/paymentTerm';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

export default function PaymentTermsPage() {
  const { paymentTerms, pagination, loading, getPaymentTerms, updatePaymentTermStatus, setDefaultPaymentTerm, removePaymentTerm, resetPaymentTerm } = usePaymentTerm();
  const { usePaymentTerms, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.paymentTerms);
  const { accessRoles, signin } = useAuth();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || signin?.user?.isAdmin;
  const canAdd = (isAdmin || usePaymentTerms?.add) && !isViewOnly;

  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  useResetOnUnmount(resetPaymentTerm);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  };

  const fetchList = signal => {
    getPaymentTerms({
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 15,
      signal,
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const handleAdd = () => {
    setIsEdit(false);
    setEditingTerm(null);
    setModalOpen(true);
  };

  const handleEdit = term => {
    setIsEdit(true);
    setEditingTerm(term);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEdit(false);
    setEditingTerm(null);
    setModalOpen(false);
  };

  const handleFormSubmit = () => {
    const c = new AbortController();
    fetchList(c.signal);
  };

  const handleDelete = async id => {
    const action = await removePaymentTerm({ id });
    if (action?.payload) handleFormSubmit();
  };

  const handleToggleStatus = async record => {
    const action = await updatePaymentTermStatus({
      id: record._id || record.id,
      isActive: !record.isActive,
    });
    if (action?.meta?.requestStatus !== 'rejected') handleFormSubmit();
  };

  const handleSetDefault = async record => {
    const action = await setDefaultPaymentTerm({ id: record._id || record.id });
    if (action?.meta?.requestStatus !== 'rejected') handleFormSubmit();
  };

  const columns = paymentTermColumn(handleEdit, handleDelete, handleToggleStatus, handleSetDefault, {
    permissions: usePaymentTerms,
    isViewOnly,
  });

  if (!isAdmin && !usePaymentTerms?.view) {
    return null;
  }

  return (
    <>
      <div>
        <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#e8f4fc] flex justify-center items-center w-10 h-10 rounded-lg shrink-0">
                <Icons.CalendarOutlined className="text-[#1E3A56] text-lg" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#030711] tracking-tight leading-tight">Payment Terms</h3>
                <p className="text-xs text-[#6b7280]">Manage payment term names and due days</p>
              </div>
            </div>
            <PermissionButton
              canAccess={canAdd}
              isViewOnly={isViewOnly}
              type="primary"
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text="Add Payment Term"
              onClick={canAdd ? handleAdd : undefined}
              className="w-full sm:w-auto shrink-0"
              wrapperClassName="w-full sm:w-auto inline-block shrink-0"
            />
          </div>
        </div>

        <CustomTable
          columns={columns}
          data={(paymentTerms || []).map(t => ({ ...t, key: t._id || t.id }))}
          loading={loading}
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || pagination?.limit || 15,
            total: pagination?.totalResults || 0,
            onChange: (page, pageSize) => updateUrlParams({ page, limit: pageSize }),
          }}
        />
      </div>

      <AddEditPaymentTermModal modalOpen={modalOpen} isEdit={isEdit} handleModalClose={handleModalClose} editingTerm={editingTerm} onFormSubmit={handleFormSubmit} />
    </>
  );
}
