import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { Popconfirm, Tag, Tabs } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { ActionButtons, DetailField } from '@/components/ui';
import ItemGroupDetailSkeleton from '../components/ItemGroupDetailSkeleton';
import AddItemGroupModal from '../components/AddItemGroupModal';
import { itemGroupDetailItemsColumn } from '../itemGroup.columns';
import Icons from 'assets/icons/icon';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const ItemGroupDetail = () => {
  const { itemGroupId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { loading, deleteLoading, getItemGroupById, itemGroupDetail, deleteItemGroup } = useItemGroup();
  const { isViewOnly, useItemGroupMaster } = useModulePermissions(RESOURCES.ITEM_GROUP_MASTER);

  useEffect(() => {
    const controller = new AbortController();
    getItemGroupById({ itemGroupId, signal: controller.signal });
    return () => controller.abort();
  }, [itemGroupId]);

  useEffect(() => {
    setActiveKey('1');
  }, [itemGroupId]);

  const handleRefresh = async () => {
    await getItemGroupById({ itemGroupId });
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  const handleEditModalSuccess = () => {
    getItemGroupById({ itemGroupId });
  };

  const handleDeleteClick = async () => {
    const result = await deleteItemGroup({ itemGroupId });
    if (result?.payload) {
      navigate('/item-group-master');
    }
  };

  const BasicInfo = () => {
    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Basic Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Item Group Name" value={itemGroupDetail?.name} truncate={false} valueClassName="break-words" />
              <DetailField label="Total Items" value={itemGroupDetail?.itemCount ?? 0} />
              <DetailField label="Item Group ID">{itemGroupDetail?.itemGroupId ? <Tag className="font-semibold">{itemGroupDetail.itemGroupId}</Tag> : '-'}</DetailField>
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg pb-2">Associated Items ({itemGroupDetail?.itemCount || 0})</p>
          <p className="text-[13px] font-medium text-[#64748b] mb-3">List of items linked to this group</p>

          <CustomTable columns={itemGroupDetailItemsColumn(navigate)} data={itemGroupDetail?.items || []} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
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
    return <ItemGroupDetailSkeleton />;
  }

  if (!itemGroupDetail) {
    return <NoFoundPage docType={MODULE_NAMES?.ITEMGROUP} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Item Group Details</h1>
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
            <PermissionButton
              canAccess={!!useItemGroupMaster?.edit}
              isViewOnly={isViewOnly}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              block
              onClick={handleEditClick}
            >
              Edit
            </PermissionButton>
            <Popconfirm
              title="Delete Item Group"
              description="Are you sure you want to delete this item group?"
              okText="Yes"
              cancelText="No"
              onConfirm={handleDeleteClick}
              disabled={!useItemGroupMaster?.delete || isViewOnly}
            >
              <PermissionButton canAccess={!!useItemGroupMaster?.delete} isViewOnly={isViewOnly} disabled={deleteLoading} wrapperClassName="block w-full" danger icon={<Icons.DeleteOutlined />} block>
                Delete
              </PermissionButton>
            </Popconfirm>
          </ActionButtons>
        </div>
      </div>
      <AddItemGroupModal showModal={editModalOpen} setModalOpen={setEditModalOpen} itemGroup={itemGroupDetail} onSuccess={handleEditModalSuccess} />
    </>
  );
};

export default ItemGroupDetail;
