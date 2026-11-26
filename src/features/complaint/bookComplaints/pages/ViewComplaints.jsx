import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { MODULE_NAMES, filterInputEnum, PERMISSION_MESSAGES } from '@/utils/constants';
import { useFilters } from '@/utils/filtersUtils';
import { getQueryParams } from 'utils/services';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from '@/hooks/useModulePermissions';

import ComplaintSourceTabs from '../components/ComplaintSourceTabs';
import ComplaintStatusCards from '../components/ComplaintStatusCards';
import { complaintColumns } from '../complaint.columns';
import { COMPLAINT_SOURCE, COMPLAINT_SOURCE_PROBLEM_TYPE, COMPLAINT_STATUS } from '../complaint.constants';
import { useComplaint } from '../useComplaint';
import { getComplaintDocumentDetails, getProblemTypeFromSource } from '../complaint.utils';

const FILTER_KEY = FILTERS_KEYS.COMPLAINTS_ALL_FILTER;

const problemTypeToSource = problemType => {
  if (problemType === COMPLAINT_SOURCE_PROBLEM_TYPE[COMPLAINT_SOURCE.FACTORY]) {
    return COMPLAINT_SOURCE.FACTORY;
  }
  return COMPLAINT_SOURCE.CUSTOMER;
};

/** Edit/Delete allowed only for NEW real complaints. */
const canModifyComplaintRecord = record => {
  if (!record) return false;
  const step = record.step || record.currentStep;
  if (step !== COMPLAINT_STATUS.NEW.key) return false;
  if (record.isNotRealComplaint) return false;
  return true;
};

const getModifyDisabledReason = record => {
  const step = record?.step || record?.currentStep;
  if (record?.isNotRealComplaint) return 'Not-real complaints cannot be edited or deleted.';
  if (step !== COMPLAINT_STATUS.NEW.key) return 'Only new complaints can be edited or deleted.';
  return null;
};

const ViewComplaints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { useModuleComplaint, isViewOnly } = useModulePermissions(RESOURCES.COMPLAINT);
  const deleteModal = useConfirmModal();
  const { complaints, pagination, statusCounts, customerCount, internalCount, loading, deleteLoading, getComplaints, deleteComplaint, resetComplaints } = useComplaint();
  const [, setShowFilter] = useState(false);

  const { filter, setFilter, updateUrlParams, handleSearch, handleClear } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
    },
  });

  const problemType = searchParams.get('problemType') || COMPLAINT_SOURCE_PROBLEM_TYPE[COMPLAINT_SOURCE.CUSTOMER];
  const status = searchParams.get('status') || '';
  const source = problemTypeToSource(problemType);

  useResetOnUnmount(resetComplaints);

  useEffect(() => {
    setFilter(prev => ({ ...prev, search: searchParams.get('search') || '' }));
  }, [searchParams, setFilter]);

  const fetchComplaints = useCallback(
    signal => {
      const params = getQueryParams(window.location.href) || {};
      const page = parseInt(searchParams.get('page'), 10) || 1;
      const limit = parseInt(searchParams.get('limit'), 10) || pagination?.limit;

      getComplaints({
        ...params,
        page,
        limit,
        problemType,
        status: status || undefined,
        signal,
      });
    },
    [getComplaints, searchParams, pagination?.limit, problemType, status]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchComplaints(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const sourceCounts = useMemo(
    () => ({
      [COMPLAINT_SOURCE.CUSTOMER]: customerCount ?? (source === COMPLAINT_SOURCE.CUSTOMER ? pagination?.totalResults || 0 : 0),
      [COMPLAINT_SOURCE.FACTORY]: internalCount ?? (source === COMPLAINT_SOURCE.FACTORY ? pagination?.totalResults || 0 : 0),
    }),
    [customerCount, internalCount, source, pagination?.totalResults]
  );

  const columns = useMemo(() => complaintColumns({ showCustomer: source === COMPLAINT_SOURCE.CUSTOMER }), [source]);

  const handleSourceChange = nextSource => {
    updateUrlParams({
      problemType: getProblemTypeFromSource(nextSource),
      status: null,
      page: 1,
      limit: pagination?.limit,
    });
  };

  const handleBucketChange = nextBucket => {
    const nextStatus = status === nextBucket ? null : nextBucket;
    updateUrlParams({
      status: nextStatus,
      page: 1,
      limit: pagination?.limit,
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleRowClick = record => {
    navigate(`/${ADMIN_ROUTE_PATHS.complaint.build.detail(record.id)}`);
  };

  const handleViewClick = record => {
    navigate(`/${ADMIN_ROUTE_PATHS.complaint.build.detail(record.id)}`);
  };

  const handleEditClick = record => {
    navigate(`/${ADMIN_ROUTE_PATHS.complaint.build.edit(record.id)}`);
  };

  const handleDeleteClick = record => {
    if (deleteLoading) return;
    deleteModal.open(record);
  };

  const handleDeleteConfirm = async () => {
    const complaintId = deleteModal.payload?.id || deleteModal.payload?._id;
    if (!complaintId) return;

    try {
      await deleteComplaint({ complaintId });
      deleteModal.close();
      fetchComplaints();
    } catch {
      // Toast handled in slice
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.COMPLAINTS?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleComplaint?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="px-5"
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
            onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.complaint.new}`)}
          />
        </div>
      </div>

      <div className="bg-white border-t" style={{ borderColor: colorPalette.secondary[200] }}>
        <ComplaintSourceTabs activeSource={source} counts={sourceCounts} onChange={handleSourceChange} />
      </div>

      <div className="bg-white border-t px-4 py-3.5" style={{ borderColor: colorPalette.secondary[200] }}>
        <ComplaintStatusCards counts={statusCounts} activeBucket={status || null} onChange={handleBucketChange} />
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3" style={{ borderColor: colorPalette.secondary[200] }}>
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput
            type={filterInputEnum.SEARCH}
            name="search"
            placeHolder="Search a number, customer or problem"
            value={filter?.search}
            setFilter={setFilter}
            onSerch={handleSearch}
            onClear={handleClear}
          />
        </div>
      </div>

      <div>
        <CustomTable
          tableId="complaints-list"
          columns={columns}
          data={(complaints || []).map(row => ({ ...row, key: row.id }))}
          loading={loading}
          pagination={{
            current: parseInt(searchParams.get('page'), 10) || 1,
            pageSize: parseInt(searchParams.get('limit'), 10) || pagination?.limit,
            total: pagination?.totalResults || 0,
            onChange: handlePaginationChange,
            showSizeChanger: true,
          }}
          onRowClick={handleRowClick}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 130,
            visible: true,
            render: (_, record) => {
              const canModifyRecord = canModifyComplaintRecord(record);
              const modifyDisabledReason = getModifyDisabledReason(record);
              const canView = useModuleComplaint?.view;
              const canEdit = useModuleComplaint?.edit && !isViewOnly && canModifyRecord;
              const canDelete = useModuleComplaint?.delete && !isViewOnly && canModifyRecord;

              const viewTooltip = canView ? 'View Complaint' : PERMISSION_MESSAGES.NO_PERMISSION;
              const editTooltip = canEdit ? 'Edit Complaint' : isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleComplaint?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : modifyDisabledReason;
              const deleteTooltip = canDelete
                ? 'Delete Complaint'
                : isViewOnly
                  ? PERMISSION_MESSAGES.VIEW_ONLY
                  : !useModuleComplaint?.delete
                    ? PERMISSION_MESSAGES.NO_PERMISSION
                    : modifyDisabledReason;

              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={viewTooltip}>
                    <Icons.EyeOutlined
                      className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: '#1E3A56' }}
                      onClick={canView ? () => handleViewClick(record) : undefined}
                    />
                  </Tooltip>
                  <Tooltip title={editTooltip}>
                    <Icons.EditOutlined
                      style={{ fontSize: 17, color: colorPalette.primary[500] }}
                      className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      onClick={canEdit ? () => handleEditClick(record) : undefined}
                    />
                  </Tooltip>
                  <Tooltip title={deleteTooltip}>
                    <Icons.DeleteOutlined
                      style={{ fontSize: 17, color: '#F14336' }}
                      className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      onClick={canDelete ? () => handleDeleteClick(record) : undefined}
                    />
                  </Tooltip>
                </div>
              );
            },
          })}
        />
      </div>

      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES.COMPLAINT} onConfirm={handleDeleteConfirm} loading={deleteLoading} getDocumentDetails={getComplaintDocumentDetails} />
    </div>
  );
};

export default ViewComplaints;
