import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// Components
import { DivisionDetailPageSkeleton } from '@/features/allMaster/division/components/DivisionDetailSkeleton';
import { Button, Dropdown, Tabs, Tag, Popconfirm } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { ActionButtons, DetailField } from '@/components/ui';
import Icons from 'assets/icons/icon';

// Hooks
import { useDivision, divisionSliceMethods } from '@/features/allMaster/division';
import useModulePermissions from 'hooks/useModulePermissions';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const DivisionDetail = () => {
  const { divId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState('1');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const { loading, singleDivision, getDivisionById, resetDivision, toggleDivisionStatus, submitLoading, deleteLoading } = useDivision();
  const { isViewOnly, useModuleDivision } = useModulePermissions(RESOURCES.DIVISION);

  useEffect(() => {
    const controller = new AbortController();
    if (divId) {
      getDivisionById({ divisionId: divId, signal: controller.signal });
    } else {
      resetDivision();
    }
    return () => {
      resetDivision();
      controller.abort();
    };
  }, [divId]);

  const handleRefresh = async () => {
    await getDivisionById({ divisionId: divId });
  };

  const handleEditClick = () => {
    navigate(`/division/${divId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = async () => {
    try {
      await dispatch(divisionSliceMethods.deleteDivision(divId)).unwrap();
      navigate('/division');
    } catch (error) {
      console.error('Failed to delete division:', error);
    }
  };

  const canDelete = useModuleDivision?.delete && !isViewOnly;

  const isActive = singleDivision?.isActive;

  const handleMarkAsStatus = async () => {
    await toggleDivisionStatus({ divisionId: divId, isActive: !isActive });
    await getDivisionById({ divisionId: divId });
  };

  const BasicInfo = () => {
    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Division Name" value={singleDivision?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Division Code" value={singleDivision?.divisionCode} />
              <DetailField label="Status">
                {singleDivision?.isActive !== undefined ? <Tag color={singleDivision?.isActive ? 'green' : 'red'}>{singleDivision?.isActive ? 'Active' : 'Inactive'}</Tag> : '-'}
              </DetailField>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Contact Email" value={singleDivision?.contactEmail} />
              <DetailField label="Contact Phone" value={singleDivision?.contactPhone} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Address Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Street 1" value={singleDivision?.address?.street1} />
              <DetailField label="Street 2" value={singleDivision?.address?.street2} />
              <DetailField label="City" value={singleDivision?.address?.city} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="State" value={singleDivision?.address?.state} />
              <DetailField label="Pin Code" value={singleDivision?.address?.pinCode} />
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
    return <DivisionDetailPageSkeleton />;
  }

  if (!singleDivision) {
    return <NoFoundPage docType={MODULE_NAMES?.DIVISION} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Division Details</h1>
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
            {isViewOnly || !useModuleDivision?.edit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!useModuleDivision?.edit} type="primary" className="px-4 py-2 w-full" wrapperClassName="block w-full" block>
                Mark Division As
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
                          Are you sure you want to mark this division as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Division As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton
              canAccess={!!useModuleDivision?.edit}
              isViewOnly={isViewOnly}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              block
              onClick={handleEditClick}
            >
              Edit
            </PermissionButton>
            <Popconfirm title="Delete Division" description="Are you sure you want to delete this division?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={handleDeleteClick}>
              <PermissionButton
                canAccess={!!useModuleDivision?.delete}
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

export default DivisionDetail;
