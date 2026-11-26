import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import { Button, Collapse } from '@/components/AntDComponent';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import HistoryCommon from '@/components/dataDisplay/statCard/HistoryCommon';
import DetailPageWithTableSkeleton from '@/components/ui/common/DetailPageSkeleton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { AsyncPdfDownloadLink } from '@/components/ui/common/AsyncPdfDownloadLink';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useManualJournal } from '@/features/accountant/manualJournal';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { MODULE_NAMES, REPORTING_METHODS, LEDGER_SOURCE_MODULES } from '@/utils/constants';
dayjs.extend(utc);

const ManualJournalDetail = () => {
  const { manualJournalId } = useParams();
  const { journal, loading, getManualJournalById, resetManualJournal } = useManualJournal();
  const { profile, getProfile } = useProfile();

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    if (manualJournalId) {
      getManualJournalById({ manualJournalId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetManualJournal();
    };
  }, [manualJournalId]);

  const handleRefresh = async () => {
    await getManualJournalById({ manualJournalId });
  };

  const tableData = useMemo(() => {
    if (!journal?.journalEntries) return [];

    const entries = journal.journalEntries.map((entry, index) => ({
      ...entry,
      key: `entry-${index}`,
      isTotal: false,
    }));

    const totalsRow = {
      key: 'totals-row',
      isTotal: true,
      accountId: { accountName: 'Total' },
      debits: journal.totalDebits || 0,
      credits: journal.totalCredits || 0,
    };

    return [...entries, totalsRow];
  }, [journal]);

  const columns = () => [
    {
      title: 'Account',
      dataIndex: 'accountId',
      key: 'accountId',
      width: 220,
      render: (_, row) => {
        if (row.isTotal) {
          return <div className="font-semibold text-right pr-4">Total</div>;
        }
        return row?.account?.accountName || '-';
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      render: value => value || '',
    },
    {
      title: 'Contact',
      dataIndex: 'businessAccountLedgerMaster',
      key: 'businessAccountLedgerMaster',
      width: 220,
      render: (_, row) => {
        if (row.isTotal) return '';
        return row?.businessAccountLedgerMaster?.customerDisplayName || row?.businessAccountLedgerMaster?.personName || '';
      },
    },
    {
      title: 'Debit',
      dataIndex: 'debits',
      key: 'debits',
      width: 120,
      align: 'right',
      render: (value, row) => {
        if (row.isTotal) {
          return <span className="font-semibold border-t border-gray-300 pt-1 block">{formatAmount(value || 0)}</span>;
        }
        return value ? formatAmount(value) : '-';
      },
    },
    {
      title: 'Credit',
      dataIndex: 'credits',
      key: 'credits',
      width: 120,
      align: 'right',
      render: (value, row) => {
        if (row.isTotal) {
          return <span className="font-semibold border-t border-gray-300 pt-1 block">{formatAmount(value || 0)}</span>;
        }
        return value ? formatAmount(value) : '-';
      },
    },
  ];

  const handlePrint = async () => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const { ManualJournalDetailPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(<ManualJournalDetailPdf journal={journal} profile={freshProfile} />);
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      iframe.contentWindow?.addEventListener('afterprint', () => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      });
    };
  };

  const loadJournalPdf = useCallback(async () => {
    const m = await import('@smit9313/abss-pdf');
    return {
      document: <m.ManualJournalDetailPdf journal={journal} profile={profile} />,
      fileName: m.manualJournalPdfFileName(journal),
    };
  }, [journal, profile]);

  if (loading) {
    return <DetailPageWithTableSkeleton fieldCount={8} tableCols={5} tableRows={5} />;
  }

  if (!journal) {
    return <NoFoundPage docType={MODULE_NAMES?.MANUAL_JOURNAL} />;
  }

  return (
    <div className="space-y-4 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Manual Journal Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{journal?.manualJournalId}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">Voucher No:</span>
                <span className="text-sm font-semibold text-gray-900">{journal?.vchNo || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            <AsyncPdfDownloadLink loadDocument={loadJournalPdf}>
              {({ loading: pdfLoading }) => (
                <Button type="default" size="middle" icon={<Icons.DownloadOutlined className="mr-2" />} disabled={pdfLoading} className="flex items-center">
                  Download
                </Button>
              )}
            </AsyncPdfDownloadLink>
            <Button type="default" size="middle" icon={<Icons.PrinterOutlined className="mr-2" />} onClick={handlePrint} className="flex items-center">
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-3 space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Icons.FileTextOutlined />
              Journal Details
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{dayjs(journal?.date).format('DD MMM YYYY')}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Reporting Method</span>
              <span className="font-medium text-gray-900">{REPORTING_METHODS.find(method => method.value === journal?.reportingMethod)?.label || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Currency</span>
              <span className="font-medium text-gray-900">{journal?.currency || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Division</span>
              <span className="font-medium text-gray-900">{journal?.divisionName || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Branch</span>
              <span className="font-medium text-gray-900">{journal?.branchName || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Warehouse</span>
              <span className="font-medium text-gray-900">{journal?.warehouseName || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Notes</span>
              <span className="font-medium text-gray-900">{journal?.notes || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Created By</span>
              <span className="font-medium text-gray-900">{journal?.addedBy || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Icons.TableOutlined />
              Journal Entries
            </h3>
          </div>
          <CustomTable rowKey="key" data={tableData} columns={columns()} pagination={false} rowClassName={record => (record.isTotal ? 'bg-gray-50' : '')} />
        </div>

        {journal?.attachments?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
            </div>
            <div className="p-4">
              <AttachMentDetails data={journal} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.MANUAL_JOURNAL} sourceId={manualJournalId} />
        </div>

        {journal?.commentHistory?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Collapse
              items={[
                {
                  key: '1',
                  label: <span className="text-sm font-semibold text-gray-700">History</span>,
                  children: <HistoryCommon data={journal?.commentHistory} />,
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualJournalDetail;
