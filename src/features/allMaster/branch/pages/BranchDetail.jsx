import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// Components
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { Button, Dropdown, Tabs, Tag, Popconfirm } from '@/components/AntDComponent';
import { BranchDetailPageSkeleton } from '@/features/allMaster/branch/components/BranchDetailSkeleton';
import { ActionButtons, DetailField } from '@/components/ui';
import Icons from 'assets/icons/icon';

// Hooks
import { useBranch, branchSliceMethods } from '@/features/allMaster/branch';
import useModulePermissions from 'hooks/useModulePermissions';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const BranchDetail = () => {
  const { brId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState('1');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { loading, singleBranch, getBranchById, resetBranch, toggleBranchStatus, submitLoading, deleteLoading } = useBranch();
  const { isViewOnly, useModuleBranch } = useModulePermissions(RESOURCES.BRANCH);

  useEffect(() => {
    const controller = new AbortController();
    if (brId) {
      getBranchById({ branchId: brId, signal: controller.signal });
    } else {
      resetBranch();
    }
    return () => {
      resetBranch();
      controller.abort();
    };
  }, [brId]);

  const handleRefresh = async () => {
    await getBranchById({ branchId: brId });
  };

  const handleEditClick = () => {
    navigate(`/branch/${brId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = async () => {
    try {
      await dispatch(branchSliceMethods.deleteBranch(brId)).unwrap();
      navigate('/branch');
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const canDelete = useModuleBranch?.delete && !isViewOnly;

  const isActive = singleBranch?.isActive;

  const handleMarkAsStatus = async () => {
    await toggleBranchStatus({ branchId: brId, isActive: !isActive });
    await getBranchById({ branchId: brId });
  };

  const BasicInfo = () => {
    const managerName = `${singleBranch?.branchManager?.firstName || ''} ${singleBranch?.branchManager?.lastName || ''}`.trim();

    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Division Name" value={singleBranch?.divisionId?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Branch Name" value={singleBranch?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Status">
                {singleBranch?.isActive !== undefined ? <Tag color={singleBranch?.isActive ? 'green' : 'red'}>{singleBranch?.isActive ? 'Active' : 'Inactive'}</Tag> : '-'}
              </DetailField>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="GSTIN" value={singleBranch?.gstin} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Branch Manager</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Manager Name" value={managerName || undefined} truncate={false} valueClassName="break-words" />
              <DetailField label="Manager Email" value={singleBranch?.branchManager?.contactEmail} />
              <DetailField label="Manager Phone" value={singleBranch?.branchManager?.contactPhone} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Address Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Street 1" value={singleBranch?.address?.street1} />
              <DetailField label="Street 2" value={singleBranch?.address?.street2} />
              <DetailField label="City" value={singleBranch?.address?.city} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="State" value={singleBranch?.address?.state} />
              <DetailField label="Pin Code" value={singleBranch?.address?.pinCode} />
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
    return <BranchDetailPageSkeleton />;
  }

  if (!singleBranch) {
    return <NoFoundPage docType={MODULE_NAMES?.BRANCH} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Branch Details</h1>
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
            {isViewOnly || !useModuleBranch?.edit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!useModuleBranch?.edit} type="primary" className="px-4 py-2 w-full" wrapperClassName="block w-full" block>
                Mark Branch As
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
                          Are you sure you want to mark this branch as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Branch As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton canAccess={!!useModuleBranch?.edit} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" icon={<Icons.EditOutlined />} block onClick={handleEditClick}>
              Edit
            </PermissionButton>
            <Popconfirm title="Delete Branch" description="Are you sure you want to delete this branch?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={handleDeleteClick}>
              <PermissionButton
                canAccess={!!useModuleBranch?.delete}
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

export default BranchDetail;
