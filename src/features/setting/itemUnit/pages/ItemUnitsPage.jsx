import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import AddEditItemUnitModal from '@/features/setting/itemUnit/components/AddEditItemUnitModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useItemUnit, itemUnitColumn } from '@/features/setting/itemUnit';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

export default function ItemUnitsPage() {
  const { itemUnits, pagination, loading, getItemUnits, resetItemUnit } = useItemUnit();
  const { useItemUnits, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.itemUnit);
  const { accessRoles, signin } = useAuth();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || signin?.user?.isAdmin;
  const canView = isAdmin || useItemUnits?.view;
  const canAdd = (isAdmin || useItemUnits?.add) && !isViewOnly;

  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  useResetOnUnmount(resetItemUnit);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  };

  const fetchList = signal => {
    getItemUnits({
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 15,
      signal,
    });
  };

  useEffect(() => {
    if (!canView) return undefined;
    const controller = new AbortController();
    fetchList(controller.signal);
    return () => controller.abort();
  }, [searchParams, canView]);

  const handleAdd = () => {
    setIsEdit(false);
    setEditingUnit(null);
    setModalOpen(true);
  };

  const handleEdit = unit => {
    setIsEdit(true);
    setEditingUnit(unit);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEdit(false);
    setEditingUnit(null);
    setModalOpen(false);
  };

  const handleFormSubmit = () => {
    const c = new AbortController();
    fetchList(c.signal);
  };

  const columns = itemUnitColumn(handleEdit, {
    permissions: useItemUnits,
    isViewOnly,
  });

  if (!canView) {
    return null;
  }

  return (
    <>
      <div>
        <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#e8f4fc] flex justify-center items-center w-10 h-10 rounded-lg shrink-0">
                <Icons.NumberOutlined className="text-[#1E3A56] text-lg" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#030711] tracking-tight leading-tight">Item Unit</h3>
                <p className="text-xs text-[#6b7280]">Manage item unit names used across inventory and documents</p>
              </div>
            </div>
            <PermissionButton
              canAccess={canAdd}
              isViewOnly={isViewOnly}
              type="primary"
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text="Add Item Unit"
              onClick={canAdd ? handleAdd : undefined}
              className="w-full sm:w-auto shrink-0"
              wrapperClassName="w-full sm:w-auto inline-block shrink-0"
            />
          </div>
        </div>

        <CustomTable
          columns={columns}
          data={(itemUnits || []).map(t => ({ ...t, key: t._id || t.id }))}
          loading={loading}
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || pagination?.limit || 15,
            total: pagination?.totalResults || 0,
            onChange: (page, pageSize) => updateUrlParams({ page, limit: pageSize }),
          }}
        />
      </div>

      <AddEditItemUnitModal modalOpen={modalOpen} isEdit={isEdit} handleModalClose={handleModalClose} editingUnit={editingUnit} onFormSubmit={handleFormSubmit} />
    </>
  );
}
