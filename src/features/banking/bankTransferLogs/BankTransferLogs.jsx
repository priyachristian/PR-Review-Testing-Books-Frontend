import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TextArea from 'antd/es/input/TextArea';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import { Button, Tabs } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useUser } from '@/features/setting/user/useUser';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useBank, allBankTransactionsColumn } from '@/features/banking/banks';
import { RESOURCES } from '@/utils/jsonFile';
import { PAYMENT_TRANSACTION_TYPE } from '@/utils/constants';
import { PAGE_HEADERS } from '@/utils/label';

const BankTransferLogs = () => {
  const {
    loading,
    allBankTransactions,
    paginationForAllTransactions,
    getAllBankTransactions,
    approveTransactionLoading,
    rejectTransactionLoading,
    cancelTransactionLoading,
    approveTransaction,
    rejectTransaction,
    cancelTransaction,
    resetAllBankTransactions,
  } = useBank();
  const { isViewOnly, useBankTransferLogs } = useModulePermissions(RESOURCES.BANK_TRANSFER_LOGS);
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessRoles } = useUser();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

  const handleTabChange = key => {
    setActiveTab(key);
    setSearchParams(prev => ({ ...Object.fromEntries(prev), tab: key, page: 1 }));
  };

  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    transactionId: null,
    note: '',
  });
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [cancelModal, setCancelModal] = useState({
    visible: false,
    transactionId: null,
    note: '',
  });

  const fetchBankTransferLogs = useCallback(
    signal => {
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || paginationForAllTransactions?.limit || DEFAULT_PAGE_SIZE;
      const sortBy = searchParams.get('sortBy') || '';
      const transactionType = activeTab !== 'all' ? activeTab : undefined;
      const payload = {
        page,
        limit,
        ...(sortBy ? { sortBy } : {}),
        ...(transactionType ? { transactionType } : {}),
        signal,
      };
      getAllBankTransactions(payload);
    },
    [searchParams, paginationForAllTransactions?.limit, getAllBankTransactions, activeTab]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBankTransferLogs(controller.signal);
    return () => controller.abort();
  }, [searchParams, fetchBankTransferLogs]);

  useResetOnUnmount(resetAllBankTransactions);

  const handlePaginationChange = (page, pageSize) => {
    setSearchParams(prev => ({ ...Object.fromEntries(prev), page, limit: pageSize }));
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortBy = '';
    if (Array.isArray(sorter)) {
      const s = sorter[0];
      if (s?.order) sortBy = `${s.field}:${s.order === 'descend' ? 'desc' : 'asc'}`;
    } else if (sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }
    setSearchParams(prev => ({ ...Object.fromEntries(prev), sortBy, page: 1 }));
  };

  const handleApprovePayment = async () => {
    try {
      await approveTransaction({
        transactionId: approvalModal.transactionId,
        notes: approvalModal.note,
      });
      setApprovalModal({ visible: false, transactionId: null, note: '' });
      fetchBankTransferLogs();
    } catch (error) {
      console.log('handleApprovePayment Error::', error);
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectTransaction({
        transactionId: approvalModal.transactionId,
        notes: approvalModal.note,
      });
      setApprovalModal({ visible: false, transactionId: null, note: '' });
      fetchBankTransferLogs();
    } catch (error) {
      console.log('handleRejectPayment Error::', error);
    }
  };

  const handleCancelReceived = async () => {
    try {
      await cancelTransaction({
        transactionId: cancelModal.transactionId,
        notes: cancelModal.note,
      });
      setCancelModal({ visible: false, paymentId: null, note: '' });
      fetchBankTransferLogs();
    } catch (error) {
      console.log('handleCancelReceived Error::', error);
    }
  };

  const handleApprovedModalClick = id => {
    if (isViewOnly || !useBankTransferLogs?.edit || !accessRoles?.isAccountant) return;
    let findPayment = allBankTransactions?.find(x => x?.id === id);
    setSelectedRecord(findPayment);
    setApprovalModal({
      visible: true,
      transactionId: id,
      note: '',
    });
  };

  const handleCancelModalClick = id => {
    if (isViewOnly || !useBankTransferLogs?.edit || !accessRoles?.isAccountant) return;
    setCancelModal({
      visible: true,
      transactionId: id,
      note: '',
    });
  };

  const columns = allBankTransactionsColumn(isViewOnly, accessRoles.isAccountant, handleCancelModalClick, handleApprovedModalClick, useBankTransferLogs).filter(c => c.visible);

  const tabItems = [
    {
      key: 'all',
      label: 'All',
    },
    {
      key: PAYMENT_TRANSACTION_TYPE.WITHDRAWAL,
      label: 'Withdrawal',
    },
    {
      key: PAYMENT_TRANSACTION_TYPE.DEPOSIT,
      label: 'Deposit',
    },
    {
      key: PAYMENT_TRANSACTION_TYPE.TRANSFER,
      label: 'Transfer',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 border-b">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{PAGE_HEADERS?.BANK_TRANSFER_LOGS?.title}</div>
      </div>

      <div className="bg-white">
        <div className="px-3">
          <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
        </div>
        <CustomTable
          columns={columns}
          loading={loading}
          data={allBankTransactions || []}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || paginationForAllTransactions?.limit || DEFAULT_PAGE_SIZE,
            total: paginationForAllTransactions?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <CustomModal
        modalOpen={approvalModal.visible}
        setModalOpen={open => {
          if (!open) setApprovalModal({ visible: false, transactionId: null, note: '' });
        }}
        title="Approve Payment"
      >
        <p>
          Enter Transaction Details and click on Approve to proceed with the payment.{' '}
          {selectedRecord?.attachments?.length > 0 && (
            <a href={selectedRecord?.attachments?.[0]} target="_blank" rel="noopener noreferrer">
              <span className="cursor-pointer text-blue-700 underline underline-offset-2">View Attachments</span>
            </a>
          )}
        </p>
        <TextArea rows={4} placeholder="Enter transaction details" value={approvalModal.note} onChange={e => setApprovalModal(prev => ({ ...prev, note: e.target.value }))} />
        <div className="flex justify-end gap-2 mt-4">
          <Button key="back" onClick={() => setApprovalModal({ visible: false, transactionId: null, note: '' })}>
            Go Back
          </Button>
          <Button key="link" type="primary" danger loading={rejectTransactionLoading} onClick={handleRejectPayment} style={{ minWidth: 80 }}>
            Reject
          </Button>
          <Button key="submit" type="primary" loading={approveTransactionLoading} onClick={handleApprovePayment} style={{ minWidth: 90 }}>
            Approve
          </Button>
        </div>
      </CustomModal>
      <CustomModal
        modalOpen={cancelModal.visible}
        setModalOpen={open => {
          if (!open) setCancelModal({ visible: false, transactionId: null, note: '' });
        }}
        title="Cancel Payment"
      >
        <p>Enter Transaction Details and click on cancel to proceed with the payment.</p>
        <TextArea rows={4} placeholder="Enter transaction details" value={cancelModal.note} onChange={e => setCancelModal(prev => ({ ...prev, note: e.target.value }))} />
        <div className="flex justify-end gap-2 mt-4">
          <Button key="back" onClick={() => setCancelModal({ visible: false, transactionId: null, note: '' })}>
            Go Back
          </Button>
          <Button key="submit" type="primary" loading={cancelTransactionLoading} onClick={handleCancelReceived} style={{ minWidth: 120 }}>
            Cancel Payment
          </Button>
        </div>
      </CustomModal>
    </div>
  );
};

export default BankTransferLogs;
