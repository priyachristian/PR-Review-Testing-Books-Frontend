import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ProcessForm from '../components/ProcessForm';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { Button, Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { useProcess, processColumn } from '@/features/allMaster/process';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';

const ViewProcesses = () => {
  const { processes, pagination, loading, getProcesses, deleteProcess, resetProcess } = useProcess();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const { isViewOnly, useModuleProcess } = useModulePermissions(RESOURCES.PROCESS);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
  });

  const handleSerch = () => {
    if (filter.search) {
      updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: filter.search });
    }
  };

  const handleClear = () => {
    setFilter({
      search: '',
    });
    updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: '' });
  };

  const fetchProcesses = (signal, pageOverride = null, limitOverride = null) => {
    const currentPage = pageOverride || parseInt(searchParams.get('page')) || 1;
    const currentLimit = limitOverride || parseInt(searchParams.get('limit')) || pagination.limit;
    const currentSortBy = searchParams.get('sortBy') || '';
    const currentSearch = searchParams.get('search') || filter.search || '';

    getProcesses({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      sortBy: currentSortBy,
      signal,
    });
  };

  const handleEdit = process => {
    setIsEdit(true);
    setEditingProcess(process);
    setModalOpen(true);
  };

  const handleDelete = async id => {
    try {
      await deleteProcess({ processId: id });
      fetchProcesses();
    } catch (error) {
      console.error('Failed to delete process:', error);
    }
  };

  const handleModalClose = () => {
    setIsEdit(false);
    setEditingProcess(null);
    setModalOpen(false);
  };

  const handleAddProcess = () => {
    setIsEdit(false);
    setEditingProcess(null);
    setModalOpen(true);
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
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
                  updateUrlParams({ [key]: null });
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

  const handleTableChange = (pagination, filters, sorter) => {
    let sortString = '';
    if (sorter?.field && sorter?.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
    }
    updateUrlParams({ sortBy: sortString, page: 1 });
  };

  const handleFormSubmit = () => {
    const controller = new AbortController();
    fetchProcesses(controller.signal, pagination.page, pagination.limit);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProcesses(controller.signal);

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  useResetOnUnmount(resetProcess);

  const columns = processColumn(handleEdit, handleDelete, useModuleProcess, pagination, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.PROCESS_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.PROCESS_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.PROCESS_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => processColumn(handleEdit, handleDelete, useModuleProcess, pagination, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchProcesses(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.PROCESS?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleProcess?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="px-5"
            wrapperClassName="inline-block"
            onClick={handleAddProcess}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
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
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSerch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.PROCESS_MASTER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
        </div>
        <FilterTags />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          data={processes}
          loading={loading}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <ProcessForm modalOpen={modalOpen} setModalOpen={setModalOpen} isEdit={isEdit} handleModalClose={handleModalClose} editingProcess={editingProcess} onFormSubmit={handleFormSubmit} />
    </div>
  );
};

export default ViewProcesses;
