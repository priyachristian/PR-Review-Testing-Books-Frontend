import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Popconfirm, Tag, Tooltip } from 'antd';
import { colorPalette } from '@/utils/theme';

import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

import { manPowerColumn, useManPowerConfig } from '@/features/allMaster/manPower';
import AddWorkerModal from '@/features/allMaster/manPower/components/AddWorkerModal';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, configEnum, PERMISSION_MESSAGES } from '@/utils/constants';
import { filteredURLParams, getQueryParams, getFromLocalStorage, parsedTableCoulmns } from '@/utils/services';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import Icons from 'assets/icons/icon';
import { PAGE_HEADERS } from '@/utils/label';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

const ViewManPowers = () => {
  const { currencySymbol } = useCompanyCurrency();
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const { worker, loading, saveLoading, getWorker, createWorker, updateWorker, deleteWorker, pagination, resetWorkerList } = useManPowerConfig();
  const { useManPowerMaster, isViewOnly } = useModulePermissions(RESOURCES.MAN_POWER_MASTER);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
  });

  const fetchWorkers = signal => {
    const sortBy = searchParams?.get('sortBy') || '';
    let payload = getQueryParams(window.location.href) || {};
    if (sortBy) payload.sortBy = sortBy;
    getWorker({ ...payload, signal });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchWorkers(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetWorkerList);

  const handleTableChange = (pagination, filters, sorter) => {
    let sortParam = '';
    if (sorter && sorter.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }
    const params = new URLSearchParams(searchParams);
    const filterParams = filteredURLParams(params, { sortBy: sortParam });
    setSearchParams(filterParams);
  };

  const mappedWorkerData =
    worker?.map((item, index) => ({
      key: String(index + 1),
      id: item.id || item._id,
      name: item.workerName,
      workerNo: item.workerNo,
      departmentName: item.departmentName,
      modules: [`${currencySymbol}${item.perHourSalary}/hr`],
    })) || [];

  const handleEditClick = record => {
    const selectedWorker = worker.find(w => w.workerNo === record.workerNo);
    setEditingWorker(selectedWorker);
    setShowAddChargeModal(true);
  };

  const handleDelete = async id => {
    try {
      const controller = new AbortController();
      await deleteWorker({ workerId: id });
      getWorker({ signal: controller.signal });
    } catch (error) {
      console.error('Failed to delete worker:', error);
    }
  };

  const handleSearch = () => {
    if (filter.search) {
      setSearchParams({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        search: filter.search,
      });
    }
  };

  const handleClear = () => {
    setFilter({
      search: '',
    });
    setSearchParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: '' });
  };

  const actionColumn = {
    title: 'Action',
    key: 'actions',
    render: (_, record) => {
      const canEdit = useManPowerMaster?.edit && !isViewOnly;
      const canDelete = useManPowerMaster?.delete && !isViewOnly;
      const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

      return (
        <div className="flex space-x-2">
          <Tooltip title={canEdit ? 'Edit Worker' : blockedTooltip}>
            <Icons.EditOutlined
              className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
              onClick={() => {
                if (!canEdit) return;
                handleEditClick(record);
              }}
            />
          </Tooltip>
          <Popconfirm title="Delete Worker" description="Are you sure you want to delete this worker?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={() => handleDelete(record?.id)}>
            <Tooltip title={canDelete ? 'Delete Worker' : blockedTooltip}>
              <Icons.DeleteOutlined
                className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                onClick={e => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      );
    },
  };

  const columns = manPowerColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.MAN_POWER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn?.slice(0, -1) ?? []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.MAN_POWER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.MAN_POWER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => manPowerColumn(),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchWorkers(),
  });

  const handleModalClose = () => {
    setShowAddChargeModal(false);
    setEditingWorker(null);
  };

  const handlePaginationChange = (page, pageSize) => {
    setSearchParams({ page, limit: pageSize });
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'search': {
        return searchParams?.get('search');
      }
      default:
        return value;
    }
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
    }).filter(([, value]) => value);

    if (activeFilters.length === 0) return null;

    return (
      <div className="mb-5 container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters?.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                if (key === 'search') {
                  handleClear();
                } else {
                  setFilter(prev => ({ ...prev, [key]: null }));
                  setSearchParams({ [key]: null });
                }
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {getFilterLabel(key, value)}
            </Tag>
          ))}
          <Button size="small" className="border-none hover:underline shadow-none" onClick={handleClear}>
            Clear All
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="-m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.MAN_POWER?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            isViewOnly={isViewOnly}
            canAccess={!!useManPowerMaster?.create}
            type="primary"
            wrapperClassName="inline-block"
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingWorker(null);
              setShowAddChargeModal(true);
            }}
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.MAN_POWER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
        </div>
        <FilterTags />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          className=" border border-gray-200"
          columns={[...customizedColumns, actionColumn]}
          data={mappedWorkerData}
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.limit || DEFAULT_PAGE_SIZE,
            total: pagination.totalResults || 19,
            onChange: handlePaginationChange,
          }}
        />

        {showAddChargeModal && (
          <AddWorkerModal
            visible={showAddChargeModal}
            onClose={handleModalClose}
            createWorker={createWorker}
            updateWorker={updateWorker}
            refreshWorkers={() => getWorker({})}
            workerData={editingWorker}
            submitLoading={saveLoading}
          />
        )}
      </div>
    </div>
  );
};

export default ViewManPowers;
