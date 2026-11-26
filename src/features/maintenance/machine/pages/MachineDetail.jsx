import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button, Checkbox, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { ActionButtons, DetailField } from '@/components/ui';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import Icons from 'assets/icons/icon';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from '@/hooks/useModulePermissions';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from '@/utils/services';
import { TruncatedCell } from '@/utils/tableColumns';

import { getMachineDocumentDetails, MACHINE_PM_TASK_TYPES, sparePartLabel, useMachine } from '@/features/maintenance/machine';
import { formatMaintenanceLabel } from '@/features/maintenance/maintenanceRequest/maintenanceRequest.utils';

const machineRecord = machine => {
  if (!machine) return null;
  if (machine.machineName || machine.machineCode) return machine;
  return machine.machine || machine.result || null;
};

const displayValue = value => (value === 0 || value ? value : undefined);

const taskTypeLabel = taskType => MACHINE_PM_TASK_TYPES.find(option => option.value === taskType)?.label || taskType;

const detailTableProps = { pagination: false, dynamicScrollY: false, scroll: { x: 'max-content' } };

const pmTaskColumns = [
  {
    title: 'Task Type',
    dataIndex: 'taskType',
    key: 'taskType',
    width: 160,
    render: value => (value ? <Tag>{taskTypeLabel(value)}</Tag> : '-'),
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: value => (value ? <TruncatedCell value={value} /> : '-'),
  },
  {
    title: 'Required',
    dataIndex: 'isRequired',
    key: 'isRequired',
    width: 140,
    render: value => <Checkbox checked={value !== false} />,
  },
];

const wearPartColumns = [
  {
    title: 'Spare Part',
    dataIndex: 'sparePartId',
    key: 'sparePartId',
    render: sparePart => {
      const label = typeof sparePart === 'string' ? sparePart : sparePartLabel(sparePart);
      return label ? <TruncatedCell value={label} /> : '-';
    },
  },
  {
    title: 'Avg Life Hours',
    dataIndex: 'avgLifeHours',
    key: 'avgLifeHours',
    width: 160,
    render: value => displayValue(value) ?? '-',
  },
  {
    title: 'UOM',
    dataIndex: 'uom',
    key: 'uom',
    width: 120,
    render: value => (typeof value === 'string' ? value : value?.name) || '-',
  },
];

const maintenanceRequestColumns = [
  {
    title: 'MR No',
    dataIndex: 'mrNo',
    key: 'mrNo',
    width: 140,
    render: (value, record) => {
      const id = record?.id || record?._id;
      if (!value) return '-';
      if (!id) return <Tag className="font-semibold">{value}</Tag>;
      return (
        <Link to={`/maintenance-request/${id}`} onClick={event => event.stopPropagation()}>
          <Tag className="font-semibold cursor-pointer hover:opacity-80">{value}</Tag>
        </Link>
      );
    },
  },
  {
    title: 'Raised At',
    dataIndex: 'raisedAt',
    key: 'raisedAt',
    width: 170,
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : '-'),
  },
  {
    title: 'Problem',
    dataIndex: 'problemDescription',
    key: 'problemDescription',
    render: value =>
      value ? (
        <Tooltip title={value}>
          <span className="line-clamp-2">{value}</span>
        </Tooltip>
      ) : (
        '-'
      ),
  },
  {
    title: 'Machine Stopped',
    dataIndex: 'isMachineStopped',
    key: 'isMachineStopped',
    width: 140,
    render: value => (value ? 'Yes' : 'No'),
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: 140,
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : '-'),
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    width: 120,
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : '-'),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 130,
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : '-'),
  },
];

const MachineDetail = () => {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const deleteModal = useConfirmModal();
  const { isViewOnly, useModuleMachine } = useModulePermissions(RESOURCES.MACHINE);
  const { machine, detailLoading, submitLoading, deleteLoading, getMachineById, deleteMachine, updateMachineStatus, resetMachineDetail } = useMachine();

  const machineData = machineRecord(machine);
  const isActive = Boolean(machineData?.isActive);
  const canDelete = useModuleMachine?.delete && !isViewOnly;
  const pmTasks = Array.isArray(machineData?.pmTasks) ? machineData.pmTasks : [];
  const wearParts = Array.isArray(machineData?.wearParts) ? machineData.wearParts : [];
  const maintenanceRequests = Array.isArray(machineData?.maintenanceRequests) ? machineData.maintenanceRequests : [];
  const maintenanceRequestCount = displayValue(machineData?.maintenanceRequestCount) ?? maintenanceRequests.length;

  useEffect(() => {
    const controller = new AbortController();
    if (machineId) {
      getMachineById({ machineId, signal: controller.signal });
    } else {
      resetMachineDetail();
    }

    return () => {
      controller.abort();
      resetMachineDetail();
    };
  }, [machineId, getMachineById, resetMachineDetail]);

  const handleRefresh = async () => {
    await getMachineById({ machineId });
  };

  const handleEditClick = () => {
    navigate(`/machine/${machineId}/edit`);
  };

  const handleDeleteClick = () => {
    if (deleteLoading || !machineData) return;
    deleteModal.open(machineData);
  };

  const confirmDeleteMachine = async () => {
    try {
      await deleteMachine(machineId);
      deleteModal.close();
      navigate('/machine');
    } catch {
      // The slice already shows the error toast.
    }
  };

  const handleMarkAsStatus = async () => {
    try {
      await updateMachineStatus({ machineId, isActive: !isActive });
      await getMachineById({ machineId });
    } catch {
      // The slice already shows the error toast.
    }
  };

  const overview = (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Basic details</p>
        <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Code">{machineData?.machineCode ? <Tag className="font-semibold">{machineData.machineCode}</Tag> : '-'}</DetailField>
          <DetailField label="Name" value={machineData?.machineName} truncate={false} valueClassName="break-words" />
          <DetailField label="Process" value={typeof machineData?.process === 'string' ? machineData.process : machineData?.process?.name} />
          <DetailField label="Location" value={machineData?.location} truncate={false} valueClassName="break-words" />
          <DetailField label="Criticality">{machineData?.criticality ? <Tag>{machineData.criticality}</Tag> : '-'}</DetailField>
          <DetailField label="Has AMC" value={machineData ? (machineData.hasAMC ? 'Yes' : 'No') : undefined} />
          <DetailField label="Status">{machineData ? <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} /> : '-'}</DetailField>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Preventive maintenance</p>
        <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="PM Frequency (Days)" value={displayValue(machineData?.pmFrequencyDays)} />
          <DetailField label="Last PM Date" value={machineData?.lastPMDate ? dateFormateForUi(machineData.lastPMDate) : undefined} />
          <DetailField label="Next PM Due Date" value={machineData?.nextPMDueDate ? dateFormateForUi(machineData.nextPMDueDate) : undefined} />
        </div>
        <div className="mt-5">
          <p className="font-semibold text-sm text-gray-900 mb-2">PM Tasks</p>
          <CustomTable columns={pmTaskColumns} data={pmTasks.map((task, index) => ({ ...task, key: index }))} tableId="key" {...detailTableProps} />
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Wear parts</p>
        <CustomTable
          columns={wearPartColumns}
          data={wearParts.map((part, index) => ({ ...part, key: part?.sparePartId?.id || part?.sparePartId?._id || index }))}
          tableId="key"
          {...detailTableProps}
        />
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">
          Maintenance requests
          {maintenanceRequestCount ? <span className="ml-2 text-sm font-medium text-gray-500">({maintenanceRequestCount})</span> : null}
        </p>
        <CustomTable
          columns={maintenanceRequestColumns}
          data={maintenanceRequests.map((request, index) => ({ ...request, key: request?.id || request?._id || index }))}
          tableId="key"
          onRowClick={record => {
            const id = record?.id || record?._id;
            if (id) navigate(`/maintenance-request/${id}`);
          }}
          {...detailTableProps}
        />
      </div>
    </div>
  );

  if (detailLoading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  if (!machineData) {
    return (
      <NoFoundPage
        title="Machine not found"
        description="This machine may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/machine')}>
            Back To Machines
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Machine Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                {machineData?.machineCode ? (
                  <>
                    <span className="text-sm font-medium text-gray-600">{machineData.machineCode}</span>
                    <span className="text-gray-400">•</span>
                  </>
                ) : null}
                <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={[{ key: '1', label: 'Overview', children: overview }]} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            {isViewOnly || !useModuleMachine?.edit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!useModuleMachine?.edit} type="primary" className="px-4 py-2 w-full" wrapperClassName="block w-full" block>
                Mark Machine As
              </PermissionButton>
            ) : (
              <Dropdown
                placement="bottom"
                trigger={['click']}
                open={statusDropdownOpen}
                onOpenChange={setStatusDropdownOpen}
                dropdownRender={() => (
                  <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                    <div className="px-2 py-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                    </div>
                    <StatusConfirmPopover
                      isActive={isActive}
                      onConfirm={handleMarkAsStatus}
                      onCloseDropdown={() => setStatusDropdownOpen(false)}
                      label={`Mark as ${isActive ? 'Inactive' : 'Active'}`}
                      icon={
                        isActive ? <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} /> : <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />
                      }
                      placement="left"
                      confirmMessage={
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">
                          Are you sure you want to mark this machine as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Machine As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton canAccess={!!useModuleMachine?.edit} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" icon={<Icons.EditOutlined />} block onClick={handleEditClick}>
              Edit
            </PermissionButton>
            <PermissionButton
              canAccess={!!useModuleMachine?.delete}
              isViewOnly={isViewOnly}
              disabled={deleteLoading || !canDelete}
              wrapperClassName="block w-full"
              type="default"
              danger
              icon={<Icons.DeleteOutlined />}
              block
              onClick={handleDeleteClick}
            >
              Delete
            </PermissionButton>
          </ActionButtons>
        </div>
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.MACHINE} onConfirm={confirmDeleteMachine} loading={deleteLoading} getDocumentDetails={getMachineDocumentDetails} />
    </>
  );
};

export default MachineDetail;
