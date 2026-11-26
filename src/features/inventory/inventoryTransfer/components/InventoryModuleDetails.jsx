// Components
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

const InventoryModuleDetails = ({ isModalVisible, setIsModalVisible, selectedRawMaterials }) => {
  const inventoryColumn = () => [
    {
      title: 'Item Name',
      dataIndex: 'rawMaterialId',
      key: 'rawMaterialId',
      render: rawMaterialId => rawMaterialId?.itemName || '-',
    },
    {
      title: 'PO Req. Qty',
      dataIndex: 'productionOrderRequiredUnit',
      key: 'productionOrderRequiredUnit',
      render: itemName => `${itemName} pcs` || '-',
    },
  ];

  return (
    <div>
      <CustomModal modalOpen={isModalVisible} setModalOpen={setIsModalVisible} title="Raw Materials" width={600}>
        <div>
          <CustomTable columns={inventoryColumn()} data={selectedRawMaterials} />
        </div>
      </CustomModal>
    </div>
  );
};

export default InventoryModuleDetails;
