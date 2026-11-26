import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { ActionButtons, DetailField } from '@/components/ui';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import Icons from 'assets/icons/icon';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from '@/hooks/useModulePermissions';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

import { getSparePartDocumentDetails, SPARE_PART_CATEGORIES, useSparePart } from '@/features/maintenance/sparePart';

const sparePartRecord = sparePart => {
  if (!sparePart) return null;
  if (sparePart.name || sparePart.category || sparePart.code) return sparePart;
  return sparePart.sparePart || sparePart.result || null;
};

const displayValue = value => (value === 0 || value ? value : undefined);

const categoryLabel = category => SPARE_PART_CATEGORIES.find(option => option.value === category)?.label || category;

const SparePartDetail = () => {
  const { sparePartId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const deleteModal = useConfirmModal();
  const { isViewOnly, useModuleSparePart } = useModulePermissions(RESOURCES.SPARE_PART);
  const { sparePart, detailLoading, submitLoading, deleteLoading, getSparePartById, deleteSparePart, updateSparePartStatus, resetSparePartDetail } = useSparePart();

  const sparePartData = sparePartRecord(sparePart);
  const isActive = Boolean(sparePartData?.isActive);
  const canDelete = useModuleSparePart?.delete && !isViewOnly;

  useEffect(() => {
    const controller = new AbortController();
    if (sparePartId) {
      getSparePartById({ sparePartId, signal: controller.signal });
    } else {
      resetSparePartDetail();
    }

    return () => {
      controller.abort();
      resetSparePartDetail();
    };
  }, [sparePartId, getSparePartById, resetSparePartDetail]);

  const handleRefresh = async () => {
    await getSparePartById({ sparePartId });
  };

  const handleEditClick = () => {
    navigate(`/spare-part/${sparePartId}/edit`);
  };

  const handleDeleteClick = () => {
    if (deleteLoading || !sparePartData) return;
    deleteModal.open(sparePartData);
  };

  const confirmDeleteSparePart = async () => {
    try {
      await deleteSparePart(sparePartId);
      deleteModal.close();
      navigate('/spare-part');
    } catch {
      // The slice already shows the error toast.
    }
  };

  const handleMarkAsStatus = async () => {
    try {
      await updateSparePartStatus({ sparePartId, isActive: !isActive });
      await getSparePartById({ sparePartId });
    } catch {
      // The slice already shows the error toast.
    }
  };

  const machines = Array.isArray(sparePartData?.fitsOnMachines) ? sparePartData.fitsOnMachines : [];

  const overview = (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Basic details</p>
        <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Code">{sparePartData?.code ? <Tag className="font-semibold">{sparePartData.code}</Tag> : '-'}</DetailField>
          <DetailField label="Name" value={sparePartData?.name} truncate={false} valueClassName="break-words" />
          <DetailField label="Category" value={categoryLabel(sparePartData?.category)} />
          <DetailField label="UOM" value={sparePartData?.uom?.name} />
          <DetailField label="Drawing Reference" value={sparePartData?.drawingReference} truncate={false} valueClassName="break-words" />
          <DetailField label="Status">{sparePartData ? <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} /> : '-'}</DetailField>
          <DetailField label="Fits On Machines" truncate={false} className="md:col-span-2 lg:col-span-3">
            {machines.length === 0 ? (
              '-'
            ) : (
              <div className="flex flex-wrap gap-1 pt-1">
                {machines.map(machine => {
                  const label = [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - ') || machine?.machineName || machine?.machineCode;
                  return (
                    <Tooltip key={machine?._id || machine?.id || label} title={machine?.machineName || machine?.machineCode}>
                      <Tag>{label || '-'}</Tag>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </DetailField>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Stock and supply</p>
        <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Current Stock" value={displayValue(sparePartData?.currentStock)} />
          <DetailField label="Standard Rate" value={displayValue(sparePartData?.standardRate)} />
          <DetailField label="Min Stock Level" value={displayValue(sparePartData?.minStockLevel)} />
          <DetailField label="Max Stock Level" value={displayValue(sparePartData?.maxStockLevel)} />
          <DetailField label="Preferred Vendor" value={sparePartData?.preferredVendor} truncate={false} valueClassName="break-words" />
          <DetailField label="Lead Days" value={displayValue(sparePartData?.leadDays)} />
        </div>
      </div>
    </div>
  );

  if (detailLoading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  if (!sparePartData) {
    return (
      <NoFoundPage
        title="Spare part not found"
        description="This spare part may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/spare-part')}>
            Back To Spare Parts
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
              <h1 className="text-[18px] font-semibold text-gray-900">Spare Part Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                {sparePartData?.code ? (
                  <>
                    <span className="text-sm font-medium text-gray-600">{sparePartData.code}</span>
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
            {isViewOnly || !useModuleSparePart?.edit ? (
              <PermissionButton isViewOnly={isViewOnly} canAccess={!!useModuleSparePart?.edit} type="primary" className="px-4 py-2 w-full" wrapperClassName="block w-full" block>
                Mark Spare Part As
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
                          Are you sure you want to mark this spare part as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                        </p>
                      }
                    />
                  </div>
                )}
              >
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Spare Part As'}
                </Button>
              </Dropdown>
            )}
            <PermissionButton
              canAccess={!!useModuleSparePart?.edit}
              isViewOnly={isViewOnly}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              block
              onClick={handleEditClick}
            >
              Edit
            </PermissionButton>
            <PermissionButton
              canAccess={!!useModuleSparePart?.delete}
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
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.SPARE_PART} onConfirm={confirmDeleteSparePart} loading={deleteLoading} getDocumentDetails={getSparePartDocumentDetails} />
    </>
  );
};

export default SparePartDetail;
