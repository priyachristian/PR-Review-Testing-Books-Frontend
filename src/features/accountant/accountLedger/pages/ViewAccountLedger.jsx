import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import FilterInput from '@/components/forms/formInput/FilterInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Tag, Button, Dropdown, Tooltip } from 'antd';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { useAccountLedger, accountLedgerColumn } from '@/features/accountant/accountLedger';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, MODULE_NAMES, configEnum } from '@/utils/constants';
import { getQueryParams, getFromLocalStorage, parsedTableCoulmns } from '@/utils/services';
import Icons from 'assets/icons/icon';
import { PAGE_HEADERS } from '@/utils/label';

const getAccountLedgerDocumentDetails = ledger =>
  ledger
    ? {
        businessAccountLedgerMasterId: ledger.businessAccountLedgerMasterId,
        personName: ledger.personName,
        gstinUin: ledger.gstinUin,
      }
    : null;

const ViewLedgerMaster = () => {
  const navigate = useNavigate();
  const { accountLedgers, getAccountLedger, pagination, loading, deleteLoading, resetAccountLedgers, removeAccountLedger } = useAccountLedger();
  const { isViewOnly, useModuleAccountLedger } = useModulePermissions(RESOURCES.ACCOUNT_LEDGER);
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteModal = useConfirmModal();
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
  });
  const containerRef = useRef(null);

  const fetchAccountLedger = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getAccountLedger({ ...payload, page, limit: pageSize, signal });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAccountLedger(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetAccountLedgers);

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

  const handleEditClick = record => {
    navigate(`/account-partner/${record.id}/edit`);
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteAccountLedger = async () => {
    await removeAccountLedger({ accountLedgerId: deleteModal.payload?.id || deleteModal.payload?._id });
    deleteModal.close();
    fetchAccountLedger();
  };

  const columns = accountLedgerColumn(handleEditClick, handleDeleteClick, isViewOnly, useModuleAccountLedger);

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

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.ACCOUNT_LEDGER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn?.slice(0, -1) ?? []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.ACCOUNT_LEDGER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.ACCOUNT_LEDGER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => accountLedgerColumn(handleEditClick, handleDeleteClick, isViewOnly, useModuleAccountLedger),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchAccountLedger(),
  });

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

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      {/* Sticky Page Header */}
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex flex-wrap items-center lg:gap-6 text-center md:text-left">
          <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.ACCOUNT_LEDGER?.title} (${pagination?.totalResults || 0})`}</div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={useModuleAccountLedger?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-3 px-4 md:px-5"
            wrapperClassName="inline-block w-full md:w-auto"
            onClick={() => navigate('/account-partner/new')}
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
            configPage={configEnum?.ACCOUNT_LEDGER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
        </div>
        <FilterTags />
      </div>

      {/* Table */}
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          loading={loading}
          data={accountLedgers}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.ACCOUNT_LEDGER} onConfirm={deleteAccountLedger} loading={deleteLoading} getDocumentDetails={getAccountLedgerDocumentDetails} />
    </div>
  );
};

export default ViewLedgerMaster;
