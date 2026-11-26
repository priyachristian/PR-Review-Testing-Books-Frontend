import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Components
import { WarehouseDetailPageSkeleton } from '@/features/allMaster/warehouse/components/WarehouseDetailSkeleton';
import { Button, Dropdown, Tabs, Popconfirm } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { ActionButtons, DetailField } from '@/components/ui';
import Icons from 'assets/icons/icon';

// Hooks
import { useWarehouse } from '@/features/allMaster/warehouse';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const WarehouseDetail = () => {
  const { wrhId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { loading, singleWarehouse, getWarehouseById, resetWarehouse, toggleWarehouseStatus, deleteWarehouse, submitLoading, deleteLoading } = useWarehouse();
  const { isViewOnly, useModuleWarehouse } = useModulePermissions(RESOURCES.WAREHOUSE_MASTER);

  useEffect(() => {
    const controller = new AbortController();
    if (wrhId) {
      getWarehouseById({ warehouseId: wrhId, signal: controller.signal });
    } else {
      resetWarehouse();
    }
    return () => {
      resetWarehouse();
      controller.abort();
    };
  }, [wrhId]);

  const handleRefresh = async () => {
    await getWarehouseById({ warehouseId: wrhId });
  };

  const handleEditClick = () => {
    navigate(`/warehouse-master/${wrhId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = async () => {
    try {
      await deleteWarehouse({ warehouseId: wrhId });
      navigate('/warehouse-master');
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
    }
  };

  const canDelete = useModuleWarehouse?.delete && !isViewOnly;
  const isActive = singleWarehouse?.isActive;

  const handleMarkAsStatus = async () => {
    await toggleWarehouseStatus({ warehouseId: wrhId, isActive: !isActive });
    await getWarehouseById({ warehouseId: wrhId });
  };

  const BasicInfo = () => {
    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Warehouse ID" value={singleWarehouse?.warehouseId} />
              <DetailField label="Division Name" value={singleWarehouse?.divisionId?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Branch Name" value={singleWarehouse?.branchId?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Status">
                {singleWarehouse?.isActive !== undefined ? <StatusBadge status={singleWarehouse?.isActive} value={singleWarehouse?.isActive ? 'Active' : 'Inactive'} /> : '-'}
              </DetailField>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Warehouse Name" value={singleWarehouse?.name} truncate={false} valueClassName="break-words" />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Address Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Street 1" value={singleWarehouse?.address?.street1} />
              <DetailField label="Street 2" value={singleWarehouse?.address?.street2} />
              <DetailField label="City" value={singleWarehouse?.address?.city} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="State" value={singleWarehouse?.address?.state} />
              <DetailField label="Country" value={singleWarehouse?.address?.country} />
              <DetailField label="Pin Code" value={singleWarehouse?.address?.pinCode} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <BasicInfo />,
    },
  ];

  if (loading) {
    return <WarehouseDetailPageSkeleton />;
  }

  if (!singleWarehouse) {
    return <NoFoundPage docType={MODULE_NAMES?.WAREHOUSE} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Warehouse Details</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            {isViewOnly || !useModuleWarehouse?.edit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!useModuleWarehouse?.edit} type="primary" className="px-4 py-2 w-full" wrapperClassName="block w-full" block>
                Mark Warehouse As
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
                          Are you sure you want to mark this warehouse as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Warehouse As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton
              canAccess={!!useModuleWarehouse?.edit}
              isViewOnly={isViewOnly}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              block
              onClick={handleEditClick}
            >
              Edit
            </PermissionButton>
            <Popconfirm title="Delete Warehouse" description="Are you sure you want to delete this warehouse?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={handleDeleteClick}>
              <PermissionButton
                canAccess={!!useModuleWarehouse?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteLoading}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                block
              >
                Delete
              </PermissionButton>
            </Popconfirm>
          </ActionButtons>
        </div>
      </div>
    </>
  );
};

export default WarehouseDetail;
