import { useEffect, useMemo, useState } from 'react';

// Components
import { Button, Select } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Hooks
import { useManPowerConfig } from '@/features/allMaster/manPower/useManPowerConfig';
import { useItemMaster } from '@/features/allMaster/item';

// Extras
import { buildDepartmentSelectOptions, filterWorkersByDepartment, getWorkerId } from '@/utils/manPowerDepartment';
import { dateFormateForUi } from 'utils/services';

const { Option } = Select;

const STATUS_ENUM = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const TransferRejectModal = ({ open, record, onClose, onSuccess }) => {
  const { rejectInventoryTransferRequest, rejectTransferLoading } = useItemMaster();
  const { getWorkerDropdown, dropdownLoading, workerDropdown } = useManPowerConfig();
  const [rejectSelectedManPower, setRejectSelectedManPower] = useState([]);
  const [rejectManpowerDepartment, setRejectManpowerDepartment] = useState('');

  const rejectDepartmentOptions = useMemo(() => buildDepartmentSelectOptions(workerDropdown), [workerDropdown]);
  const filteredWorkersForReject = useMemo(() => filterWorkersByDepartment(workerDropdown, rejectManpowerDepartment), [workerDropdown, rejectManpowerDepartment]);

  useEffect(() => {
    if (open && record?.isProductionOrderReq) {
      getWorkerDropdown({});
    }
  }, [open, record?.isProductionOrderReq, getWorkerDropdown]);

  const resetLocalState = () => {
    setRejectSelectedManPower([]);
    setRejectManpowerDepartment('');
  };

  const handleClose = () => {
    resetLocalState();
    onClose();
  };

  const handleRejectTransfer = async () => {
    const payload = { inventoryTransferId: record?._id };
    if (record?.isProductionOrderReq && rejectSelectedManPower.length > 0) {
      payload.manPower_inventoryTransfer = rejectSelectedManPower;
    }
    const response = await rejectInventoryTransferRequest(payload);
    if (!response?.type?.endsWith('/fulfilled')) return;
    resetLocalState();
    onSuccess?.();
    onClose();
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={isOpen => {
        if (!isOpen) handleClose();
      }}
      title="Reject Transfer"
    >
      <p className="mb-3">Confirm the transfer request and click on reject to proceed with the transfer.</p>
      {record && (
        <div className="py-3 px-4 bg-slate-50 rounded-md mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Transfer Details:</p>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Transfer ID:</span>
              <span className="font-medium">{record?.transferId || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Item Name:</span>
              <span className="font-medium">{record?.isProductionOrderReq ? 'Production Order' : record?.itemId?.itemName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Transfer Date:</span>
              <span className="font-medium">{dateFormateForUi(record?.date) || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>From Warehouse:</span>
              <span className="font-medium">{record?.fromWarehouseId?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>To Warehouse:</span>
              <span className="font-medium">{record?.toWarehouseId?.name || '-'}</span>
            </div>
            {!record?.isProductionOrderReq && (
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">{record?.quantity || '-'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">
                <StatusBadge status={record?.status} value={STATUS_ENUM?.[record?.status] || '-'} />
              </span>
            </div>
            {record?.referenceNumber && (
              <div className="flex justify-between">
                <span>Reference Number:</span>
                <span className="font-medium">{record?.referenceNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {record?.isProductionOrderReq && (
        <>
          <div className="mt-4 mb-2">
            <span className="block text-sm font-medium text-gray-800 mb-1">Department</span>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Filter by department"
              style={{ width: '100%' }}
              size="middle"
              value={rejectManpowerDepartment || undefined}
              onChange={val => {
                const next = val ?? '';
                setRejectManpowerDepartment(next);
                const allowed = new Set(filterWorkersByDepartment(workerDropdown, next).map(w => getWorkerId(w)));
                setRejectSelectedManPower(prev => (prev || []).filter(id => allowed.has(id)));
              }}
              options={rejectDepartmentOptions}
            />
          </div>
          <div className="mb-2">
            <span className="block text-sm font-medium text-gray-800 mb-1">Manpower</span>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select Manpower"
              size="middle"
              value={rejectSelectedManPower}
              onChange={values => setRejectSelectedManPower(values)}
              loading={dropdownLoading}
            >
              {Array.isArray(filteredWorkersForReject) &&
                filteredWorkersForReject.map(w => (
                  <Option key={getWorkerId(w)} value={getWorkerId(w)}>
                    {w?.workerName}
                  </Option>
                ))}
            </Select>
          </div>
        </>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <Button key="back" onClick={handleClose}>
          Go Back
        </Button>
        <Button key="submit" type="primary" loading={rejectTransferLoading} style={{ minWidth: 130 }} onClick={handleRejectTransfer}>
          Reject Transfer
        </Button>
      </div>
    </CustomModal>
  );
};

export default TransferRejectModal;
