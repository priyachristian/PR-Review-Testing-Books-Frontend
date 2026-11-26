import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import FilterInput from '@/components/forms/formInput/FilterInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { Button, Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import ColumnSelection from '@/components/ui/common/ColumnSelection';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { useQuality, resetCustomerTests, qualityMasterColumn } from '@/features/allMaster/qualityMaster';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum } from 'utils/constants';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';

const ViewQuality = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { quality, loading, pagination, getQuality, deleteQuality, resetQualityList } = useQuality();
  const { isViewOnly, useModuleQuality } = useModulePermissions(RESOURCES.QUALITY_MASTER);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
  });

  useEffect(() => {
    dispatch(resetCustomerTests());
  }, [dispatch]);

  useResetOnUnmount(resetQualityList);

  const data = quality.map((item, index) => ({
    key: index + 1,
    _id: item._id,
    reportId: item.qcReportID || '',
    reportName: item.qcReportName || '',
    productName: item.productName || '',
    reportType: item.qcType || '',
    checker: item.qcReportResponsible || '',
    qualityData: item,
  }));

  const handleViewClick = qualityData => {
    const qltId = qualityData.qualityData?._id || qualityData.qualityData?.id;
    navigate(`/quality-master/${qltId}`, {
      state: { qualityData: qualityData.qualityData },
    });
  };

  const handleEditClick = qualityData => {
    navigate(`/quality-master/${qualityData.qualityData.id}/edit`, {
      state: { qualityData: qualityData.qualityData },
    });
  };

  const handleDeleteClick = async id => {
    try {
      await deleteQuality({ qualityId: id });
      fetchQuality();
    } catch (error) {
      console.error('Failed to delete quality:', error);
    }
  };

  const handleRowClick = qualityData => {
    handleViewClick(qualityData);
  };

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

  const fetchQuality = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const currentSearch = searchParams.get('search') || filter.search || '';
    const currentSortBy = searchParams.get('sortBy') || '';

    getQuality({
      page,
      limit: pageSize,
      search: currentSearch,
      sortBy: currentSortBy,
      signal,
    });
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

  const handleTableChange = (pagination, filters, sorter) => {
    let sortString = '';

    if (sorter && sorter.field && sorter.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
      setSortBy(sortString);
    } else {
      setSortBy('');
    }

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filter.search,
      sortBy: sortString,
    });
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

  useEffect(() => {
    const controller = new AbortController();
    fetchQuality(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const columns = qualityMasterColumn(handleEditClick, handleViewClick, handleDeleteClick, useModuleQuality, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.QUALITY_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.QUALITY_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.QUALITY_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => qualityMasterColumn(handleEditClick, handleViewClick, handleDeleteClick, useModuleQuality, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchQuality(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.QUALITY_MASTER?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleQuality?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => navigate('/quality-master/new')}
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
            configPage={configEnum?.QUALITY_MASTER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
        </div>
        <FilterTags />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]].map(col => {
            const [field, order] = sortBy?.split(':') || [];
            return {
              ...col,
              sorter: col.sorter ?? Boolean(col.dataIndex && col.dataIndex !== 'Action'),
              sortOrder: col.dataIndex === field ? (order === 'asc' ? 'ascend' : 'descend') : null,
            };
          })}
          loading={loading}
          data={data}
          onChange={handleTableChange}
          onRowClick={handleRowClick}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
    </div>
  );
};

export default ViewQuality;
