import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import RejectionReasonForm from '@/features/setting/rejectionReason/components/RejectionReasonForm';
import useModulePermissions from 'hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useRejectionReason, rejectionReasonColumn } from '@/features/setting/rejectionReason';
import Icons from 'assets/icons/icon';
import { filterInputEnum } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

export default function RejectionReasonPage() {
  const { rejectionReasons, pagination, loading, getRejectionReasons, removeRejectionReason, resetRejectionReason } = useRejectionReason();
  const { useModuleRejectionOrders, isViewOnly } = useModulePermissions(RESOURCES.REJECTION_ORDERS);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({ search: searchParams.get('search') || '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingReason, setEditingReason] = useState(null);

  useResetOnUnmount(resetRejectionReason);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  };

  const fetchList = signal => {
    getRejectionReasons({
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 15,
      search: searchParams.get('search') || '',
      signal,
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = () => updateUrlParams({ page: 1, search: filter.search });
  const handleClear = () => {
    setFilter({ search: '' });
    updateUrlParams({ page: 1, search: '' });
  };
  const handleAdd = () => {
    setIsEdit(false);
    setEditingReason(null);
    setModalOpen(true);
  };
  const handleEdit = r => {
    setIsEdit(true);
    setEditingReason(r);
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setIsEdit(false);
    setEditingReason(null);
    setModalOpen(false);
  };
  const handleFormSubmit = () => {
    const c = new AbortController();
    fetchList(c.signal);
  };

  const handleDelete = async id => {
    const action = await removeRejectionReason({ id });
    if (action?.payload) handleFormSubmit();
  };

  const startIndex = (parseInt(searchParams.get('page') || 1) - 1) * (pagination?.limit || 15);
  const columns = rejectionReasonColumn(handleEdit, handleDelete, isViewOnly, startIndex);

  return (
    <>
      <div>
        {/* Page header */}
        <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#fce8e8] flex justify-center items-center w-10 h-10 rounded-lg shrink-0">
                <Icons.CloseCircleOutlined className="text-[#c0392b] text-lg" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#030711] tracking-tight leading-tight">Rejection Reasons</h3>
                <p className="text-xs text-[#6b7280]">Manage the master list of rejection reasons used across orders</p>
              </div>
            </div>
            <PermissionButton
              canAccess={!!useModuleRejectionOrders?.create}
              isViewOnly={isViewOnly}
              type="primary"
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text="Add Reason"
              onClick={handleAdd}
              className="w-full sm:w-auto shrink-0"
              wrapperClassName="w-full sm:w-auto inline-block shrink-0"
            />
          </div>
        </div>

        {/* Table card */}
        <Card className="rounded-none border border-gray-200 border-t-0 shadow-sm">
          <div className="flex items-center justify-end gap-3 my-1">
            <div className="w-full max-w-[360px]">
              <FilterInput
                type={filterInputEnum.SEARCH}
                name="search"
                placeHolder="Search reasons…"
                value={filter.search}
                setFilter={setFilter}
                onSerch={handleSearch}
                onClear={handleClear}
                searchFullWidth
              />
            </div>
            <Button type="primary" onClick={handleSearch}>
              Apply
            </Button>
          </div>
        </Card>
        <CustomTable
          columns={columns}
          data={(rejectionReasons || []).map(r => ({ ...r, key: r._id || r.id }))}
          loading={loading}
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || pagination?.limit || 15,
            total: pagination?.totalResults || 0,
            onChange: (page, pageSize) => updateUrlParams({ page, limit: pageSize }),
          }}
        />
      </div>

      <RejectionReasonForm modalOpen={modalOpen} isEdit={isEdit} handleModalClose={handleModalClose} editingReason={editingReason} onFormSubmit={handleFormSubmit} />
    </>
  );
}
