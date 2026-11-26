import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Components
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import { Button, Tabs } from '@/components/AntDComponent';
import { DetailField } from '@/components/ui';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useBank } from '@/features/banking/banks';
import { RESOURCES } from '@/utils/jsonFile';
import { formatAmount } from '@/utils/currency';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import Icons from 'assets/icons/icon';
import BankDetailSkeleton from '../components/BankDetailSkeleton';
import BankDepositWithdraw from '../components/BankDepositWithdraw';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES } from '@/utils/constants';

const BasicInfo = ({ bank }) => {
  const currencyLabel = bank?.currency?.code || bank?.currency?.name ? `${bank?.currency?.code || '-'} - ${bank?.currency?.name || '-'}` : undefined;

  return (
    <div className="space-y-10 pb-5">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">General Information</p>

        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Bank Name" value={bank?.bankName} truncate={false} valueClassName="break-words" />
            <DetailField label="Account Name" value={bank?.accountName} truncate={false} valueClassName="break-words" />
            <DetailField label="Bank Account Number" value={bank?.accountNumber} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Account Type" value={bank?.accountType} />
            <DetailField label="IFSC Code" value={bank?.ifsc} />
            <DetailField label="Bank Account Branch" value={bank?.branch} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Currency" value={currencyLabel} />
            <DetailField label="GSTIN/UIN" value={bank?.gstinUin} />
            <DetailField label="Opening Balance" value={bank?.openingBalance != null ? formatAmount(bank.openingBalance, true, bank?.currency) : 0} />
            <DetailField label="Available Balance" value={bank?.availableBalance != null ? formatAmount(bank.availableBalance, true, bank?.currency) : 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

const BankDetail = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState('DEPOSIT');
  const { loading, bank, getBankById, resetBank } = useBank();
  const { useModuleBank } = useModulePermissions(RESOURCES.BANK);

  useEffect(() => {
    const controller = new AbortController();
    if (bankId) {
      getBankById({ bankId: bankId, signal: controller.signal });
    } else {
      resetBank();
    }
    return () => controller.abort();
  }, [bankId, getBankById, resetBank]);

  const handleRefresh = async () => {
    await getBankById({ bankId });
  };

  const openTxModal = type => {
    setTxType(type);
    setTxModalOpen(true);
  };

  const handleLedgerClick = () => {
    navigate(`/reports/bank-ledger?accountId=${bankId}&page=${DEFAULT_PAGE}&limit=${DEFAULT_PAGE_SIZE}`);
  };

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <BasicInfo bank={bank} />,
    },
  ];

  if (loading) {
    return <BankDetailSkeleton />;
  }

  if (!bank) {
    return <NoFoundPage docType={MODULE_NAMES.BANK} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">{bank?.accountName}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            <Button type="primary" icon={<Icons.FileSearchOutlined />} onClick={handleLedgerClick}>
              View Ledger
            </Button>
            {useModuleBank.canEdit && (
              <>
                <Button type="default" onClick={() => openTxModal('WITHDRAWAL')}>
                  Withdraw
                </Button>
                <Button type="primary" onClick={() => openTxModal('DEPOSIT')}>
                  Deposit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full pt-3">
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        <BankDepositWithdraw modalOpen={txModalOpen} setModalOpen={setTxModalOpen} bank={bank} transactionType={txType} onSuccess={() => getBankById({ bankId })} />
      </div>
    </>
  );
};

export default BankDetail;
