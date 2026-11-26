import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import ProductionWarehouseConfigForm from '@/features/setting/productionWarehouseConfig/components/ProductionWarehouseConfigForm';
import { productionWarehouseConfigColumns } from '@/features/setting/productionWarehouseConfig/productionWarehouseConfig.columns';
import { useProductionWarehouseConfig } from '@/features/setting/productionWarehouseConfig/useProductionWarehouseConfig';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import Icons from 'assets/icons/icon';
import { filterInputEnum, PERMISSION_MESSAGES } from '@/utils/constants';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { RESOURCES } from '@/utils/jsonFile';

export default function ProductionWarehouseConfigPage() {
  const {
    configs,
    loading,
    submitLoading,
    statusLoading,
    deleteLoading,
    getProductionWarehouseConfigs,
    createProductionWarehouseConfig,
    updateProductionWarehouseConfig,
    updateProductionWarehouseConfigStatus,
    deleteProductionWarehouseConfig,
    resetProductionWarehouseConfigs,
  } = useProductionWarehouseConfig();
  const { useProductionWarehouseConfig: permissions, isViewOnly, warehouseDrop, warehouseLoading, getWarehouseDrop } = useModulePermissions(RESOURCES.OTHER_SETTINGS.productionWarehouseConfig);
  const { accessRoles, signin } = useAuth();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || signin?.user?.isAdmin;
  const canView = isAdmin || permissions?.view;
  const canAdd = (isAdmin || permissions?.add) && !isViewOnly;
  const canEdit = (isAdmin || permissions?.update) && !isViewOnly;
  const canDelete = (isAdmin || permissions?.delete) && !isViewOnly;
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({ search: searchParams.get('search') || '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  useResetOnUnmount(resetProductionWarehouseConfigs);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    setSearchParams(params);
  };

  const fetchList = signal => {
    getProductionWarehouseConfigs({ search: searchParams.get('search') || '', signal });
  };

  useEffect(() => {
    if (!canView) return undefined;
    const controller = new AbortController();
    fetchList(controller.signal);
    getWarehouseDrop({});
    return () => controller.abort();
    // fetchList reads the current URL search parameters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canView]);

  const handleSearch = () => updateUrlParams({ page: 1, search: filter.search });

  const handleClear = () => {
    setFilter({ search: '' });
    updateUrlParams({ page: 1, search: '' });
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setModalOpen(true);
  };

  const handleEdit = config => {
    setEditingConfig(config);
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setEditingConfig(null);
    setModalOpen(false);
  };

  const handleFormSubmit = () => fetchList();

  const handleSubmit = async values => {
    const payload = {
      departmentName: values.departmentName?.trim(),
      rawMaterialWarehouseId: values.rawMaterialWarehouseId || null,
      productionWarehouseId: values.productionWarehouseId || null,
      finishedGoodsWarehouseId: values.finishedGoodsWarehouseId || null,
    };
    if (editingConfig) {
      await updateProductionWarehouseConfig({ id: editingConfig._id || editingConfig.id, data: payload });
    } else {
      await createProductionWarehouseConfig({ ...payload, isActive: true });
    }
    handleFormSubmit();
    handleModalClose();
  };

  const handleDelete = async id => {
    try {
      await deleteProductionWarehouseConfig({ id });
      handleFormSubmit();
    } catch {
      // Errors are surfaced by the slice toast.
    }
  };

  const handleStatusChange = async (config, isActive) => {
    try {
      await updateProductionWarehouseConfigStatus({ id: config._id || config.id, isActive });
      handleFormSubmit();
    } catch {
      // Errors are surfaced by the slice toast.
    }
  };

  const currentPage = parseInt(searchParams.get('page'), 10) || 1;
  const pageSize = parseInt(searchParams.get('limit'), 10) || DEFAULT_PAGE_SIZE;
  const startIndex = (currentPage - 1) * pageSize;
  const pageConfigs = (configs || []).slice(startIndex, startIndex + pageSize);
  const columns = productionWarehouseConfigColumns(handleEdit, handleDelete, handleStatusChange, {
    canEdit,
    canDelete,
    isViewOnly,
    startIndex,
    statusLoading,
    deleteLoading,
    warehouseDrop,
    openDropdownKey,
    setOpenDropdownKey,
  });

  if (!canView) return null;

  return (
    <>
      <div>
        <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#e8f4fc] flex justify-center items-center w-10 h-10 rounded-lg shrink-0">
                <Icons.SettingOutlined className="text-[#1E3A56] text-lg" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#030711] tracking-tight leading-tight">Production Warehouse Configuration</h3>
                <p className="text-xs text-[#6b7280]">Manage department warehouse assignments for production orders</p>
              </div>
            </div>
            <PermissionButton
              canAccess={canAdd}
              isViewOnly={isViewOnly}
              tooltipTitle={isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !canAdd ? PERMISSION_MESSAGES.NO_PERMISSION : undefined}
              type="primary"
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text="Add Configuration"
              onClick={handleAdd}
              className="w-full sm:w-auto shrink-0"
              wrapperClassName="w-full sm:w-auto inline-block shrink-0"
            />
          </div>
        </div>

        <Card className="rounded-none border border-gray-200 border-t-0 shadow-sm" styles={{ body: { padding: '8px 16px' } }}>
          <div className="flex items-center justify-end gap-3 my-1">
            <div className="w-full max-w-[360px]">
              <FilterInput
                type={filterInputEnum.SEARCH}
                name="search"
                placeHolder="Search..."
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
          data={pageConfigs.map(config => ({ ...config, key: config._id || config.id }))}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: configs?.length || 0,
            onChange: (page, limit) => updateUrlParams({ page, limit }),
          }}
        />
      </div>

      <ProductionWarehouseConfigForm
        modalOpen={modalOpen}
        isEdit={Boolean(editingConfig)}
        handleModalClose={handleModalClose}
        editingConfig={editingConfig}
        warehouseDrop={warehouseDrop}
        warehouseLoading={warehouseLoading}
        submitLoading={submitLoading}
        onSubmit={handleSubmit}
      />
    </>
  );
}
