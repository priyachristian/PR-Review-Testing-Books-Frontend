import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import AddEditTaxModal from '@/features/setting/directTax/components/AddEditTaxModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useDirectTax, directTaxColumn } from '@/features/setting/directTax';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

const TAB_TYPES = {
  'tds-rates': 'TDS',
  'tcs-rates': 'TCS',
};

const TAB_PARAMS = {
  tds: 'tds-rates',
  tcs: 'tcs-rates',
  'tds-rates': 'tds-rates',
  'tcs-rates': 'tcs-rates',
};

const getPositiveNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export default function DirectTaxesPage() {
  const { taxes, pagination, loading, getTaxes, updateTaxStatus, removeTax, resetTaxSections } = useDirectTax();

  const { useDirectTaxes, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.directTaxes);
  const { accessRoles, signin } = useAuth();

  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || signin?.user?.isAdmin;
  const canAdd = (isAdmin || useDirectTaxes?.add) && !isViewOnly;

  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingTax, setEditingTax] = useState(null);

  useResetOnUnmount(resetTaxSections);

  const activeTab = TAB_PARAMS[searchParams.get('tab')] || 'tds-rates';
  const type = TAB_TYPES[activeTab];
  const page = getPositiveNumber(searchParams.get('page'), 1);
  const limit = getPositiveNumber(searchParams.get('limit'), 15);

  const updateUrlParams = useCallback(
    newParams => {
      const params = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const fetchList = useCallback(
    signal => {
      getTaxes({
        type,
        page,
        limit,
        signal,
      });
    },
    [getTaxes, type, page, limit]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchList(controller.signal);

    return () => controller.abort();
  }, [fetchList]);

  const handleAdd = () => {
    setIsEdit(false);
    setEditingTax(null);
    setModalOpen(true);
  };

  const handleEdit = useCallback(tax => {
    setIsEdit(true);
    setEditingTax(tax);
    setModalOpen(true);
  }, []);

  const handleModalClose = () => {
    setModalOpen(false);
    setIsEdit(false);
    setEditingTax(null);
  };

  const handleFormSubmit = () => {
    fetchList();
  };

  const handleDelete = useCallback(
    async id => {
      const action = await removeTax({ id });

      if (action?.payload) {
        handleFormSubmit();
      }
    },
    [removeTax, fetchList]
  );

  const handleToggleStatus = useCallback(
    async record => {
      const action = await updateTaxStatus({
        id: record.id,
        isActive: !record.isActive,
      });

      if (action?.meta?.requestStatus === 'fulfilled') {
        handleFormSubmit();
      }
    },
    [updateTaxStatus, fetchList]
  );

  const columns = directTaxColumn(handleEdit, handleDelete, handleToggleStatus, {
    permissions: useDirectTaxes,
    isViewOnly,
  });

  if (!isAdmin && !useDirectTaxes?.view) {
    return null;
  }

  return (
    <>
      <div>
        <div className="border border-gray-200 bg-white px-4 py-[6px] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f4fc]">
                <Icons.PercentageOutlined className="text-lg text-[#1E3A56]" />
              </div>

              <div>
                <h3 className="text-base font-semibold leading-tight tracking-tight text-[#030711]">Direct Taxes</h3>
                <p className="text-xs text-[#6b7280]">Income tax TDS and TCS rates</p>
              </div>
            </div>

            <PermissionButton
              canAccess={canAdd}
              isViewOnly={isViewOnly}
              type="primary"
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text={`Add ${type} Tax`}
              onClick={canAdd ? handleAdd : undefined}
              className="w-full shrink-0 sm:w-auto"
              wrapperClassName="inline-block w-full shrink-0 sm:w-auto"
            />
          </div>
        </div>

        <div className="bg-white px-4 pt-2">
          <Tabs
            activeKey={activeTab}
            onChange={tab => updateUrlParams({ tab, page: null })}
            items={[
              { key: 'tds-rates', label: 'Income TDS' },
              { key: 'tcs-rates', label: 'Income TCS' },
            ]}
          />
        </div>

        <CustomTable
          columns={columns}
          data={(taxes || []).map(tax => ({
            ...tax,
            key: tax.id,
          }))}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit || pagination?.limit || 15,
            total: pagination?.totalResults || 0,
            onChange: (nextPage, pageSize) =>
              updateUrlParams({
                page: nextPage,
                limit: pageSize,
              }),
          }}
        />
      </div>

      <AddEditTaxModal modalOpen={modalOpen} isEdit={isEdit} type={type} editingTax={editingTax} handleModalClose={handleModalClose} onFormSubmit={handleFormSubmit} />
    </>
  );
}
