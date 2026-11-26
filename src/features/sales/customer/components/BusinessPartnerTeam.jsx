import { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

// Components
import { Tooltip } from '@/components/AntDComponent';
import AddContactPerson from './AddContactPerson';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';

// Extras
import { useCustomer, addBusinessPartnerTeam, getBusinessPartnerTeamMemberDetails } from '@/features/sales/customer';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { MODULE_NAMES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';

const columns = (handleEdit, handleDeleteClick) => [
  {
    title: 'First Name',
    dataIndex: 'firstName',
    key: 'firstName',
  },
  {
    title: 'Last Name',
    dataIndex: 'lastName',
    key: 'lastName',
  },
  {
    title: 'Mobile No',
    dataIndex: 'mobileNo',
    key: 'mobileNo',
  },
  {
    title: 'Email Address',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Work Phone',
    dataIndex: 'workPhone',
    key: 'workPhone',
  },
  {
    title: 'Department',
    dataIndex: 'department',
    key: 'department',
  },
  {
    title: 'Authority & Power',
    dataIndex: 'authorityPower',
    key: 'authorityPower',
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <div className="flex items-center gap-3">
        <Tooltip title="Edit Contact Person">
          <Icons.EditOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={() => handleEdit(record)} />
        </Tooltip>
        <Tooltip title="Delete Contact Person">
          <Icons.DeleteOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} onClick={() => handleDeleteClick(record)} />
        </Tooltip>
      </div>
    ),
  },
];

const mapToTableRow = (person, key) => ({ ...person, key });

const BusinessPartnerTeam = () => {
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [addFormKey, setAddFormKey] = useState(0);
  const teamDeleteModal = useConfirmModal();
  const { businessPartner } = useCustomer();
  const partnerList = businessPartner ?? [];

  const data = useMemo(() => partnerList.map((p, i) => mapToTableRow(p, i)), [partnerList]);

  const handleEdit = useCallback(record => {
    setEditingRecord(record);
    setModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingRecord(null);
    setAddFormKey(k => k + 1);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleUpdateBusinessPartner = useCallback(
    (index, payload) => {
      const updated = partnerList.map((p, i) => (i === index ? { ...p, ...payload } : p));
      dispatch(addBusinessPartnerTeam(updated));
    },
    [dispatch, partnerList]
  );

  const handleDeleteClick = useCallback(
    record => {
      teamDeleteModal.open(record);
    },
    [teamDeleteModal]
  );

  const confirmDelete = useCallback(() => {
    const record = teamDeleteModal.payload;
    if (!record) return;
    dispatch(addBusinessPartnerTeam(partnerList.filter((_, i) => i !== record.key)));
    teamDeleteModal.close();
  }, [dispatch, partnerList, teamDeleteModal]);

  const tableColumns = useMemo(() => columns(handleEdit, handleDeleteClick), [handleEdit, handleDeleteClick]);

  return (
    <div className="pb-28 relative">
      <div>
        <div className="pb-5">
          <CustomButton
            type="primary"
            onClick={handleAdd}
            className="px-4 py-4"
            text={
              <div className="flex gap-2 items-center">
                <Icons.PlusCircleOutlined />
                <div>Add Business Partner Team</div>
              </div>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <CustomTable columns={tableColumns} data={data} pagination={false} dynamicScrollY={false} scroll={{ x: true }} />
        </div>
        <DocumentConfirmModal modal={teamDeleteModal} docType={MODULE_NAMES.CONTACT_PERSON} onConfirm={confirmDelete} getDocumentDetails={getBusinessPartnerTeamMemberDetails} />
        <AddContactPerson
          key={editingRecord ? `edit-${editingRecord.key ?? editingRecord.email}` : `add-${addFormKey}`}
          modalOpen={modalOpen}
          setModalOpen={handleModalClose}
          editingRecord={editingRecord}
          setEditingRecord={setEditingRecord}
          onUpdateBusinessPartner={handleUpdateBusinessPartner}
        />
      </div>
    </div>
  );
};

export default BusinessPartnerTeam;
