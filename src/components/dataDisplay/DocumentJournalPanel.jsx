import { memo, useEffect, useMemo, useState } from 'react';

import axiosConfig from 'app/axiosConfig';
import { Tag } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { API_ROUTES } from '@/utils/apiRoute';
import { formatAmount } from '@/utils/currency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { TruncatedCell } from '@/utils/tableColumns';

const buildTableData = journal => {
  const rows = (journal?.entries || []).map((entry, index) => ({
    ...entry,
    key: entry.id || `entry-${index}`,
    isTotal: false,
  }));

  rows.push({
    key: 'totals-row',
    isTotal: true,
    accountName: 'Total',
    branchName: '',
    debit: journal?.totalDebit || 0,
    credit: journal?.totalCredit || 0,
  });

  return rows;
};

const journalColumns = (hiddenColumns = []) => {
  const columns = [
    {
      title: 'Account',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 280,
      render: (value, row) => {
        if (row.isTotal) {
          return <div className="font-semibold text-right pr-4">Total</div>;
        }

        return value || '-';
      },
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      width: 200,
      render: (value, row) => (row.isTotal ? '' : value || '-'),
    },
    {
      title: 'Transaction Details',
      key: 'transactionDetails',
      width: 260,
      render: (_, row) => (row.isTotal ? '' : <TruncatedCell value={row.partyName || row.narration} />),
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      width: 140,
      align: 'right',
      render: (value, row) => {
        const amount = formatAmount(value || 0);
        return row.isTotal ? <span className="font-semibold">{amount}</span> : amount;
      },
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      width: 140,
      align: 'right',
      render: (value, row) => {
        const amount = formatAmount(value || 0);
        return row.isTotal ? <span className="font-semibold">{amount}</span> : amount;
      },
    },
  ];

  return columns.filter(column => !hiddenColumns.includes(column.key));
};

const JournalSection = memo(({ journal, hiddenColumns }) => {
  const tableData = useMemo(() => buildTableData(journal), [journal]);

  const columns = useMemo(() => journalColumns(hiddenColumns), [hiddenColumns]);

  return (
    <div className="mb-6 last:mb-0">
      <p className="font-bold text-lg pb-2">{journal?.title || 'Journal Entries'}</p>

      <CustomTable
        rowKey="key"
        data={tableData}
        columns={columns}
        pagination={false}
        dynamicScrollY={false}
        scroll={{ x: 'max-content' }}
        rowClassName={record => (record.isTotal ? 'bg-gray-50' : '')}
      />
    </div>
  );
});

JournalSection.displayName = 'JournalSection';

const DocumentJournalPanel = ({ sourceModule, sourceId, hiddenColumns = [] }) => {
  const { currencyCode } = useCompanyCurrency();

  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [baseCurrencyCode, setBaseCurrencyCode] = useState(null);

  useEffect(() => {
    if (!sourceModule || !sourceId) return;

    const controller = new AbortController();

    const fetchJournal = async () => {
      setLoading(true);

      try {
        const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.LEDGER.GET_JOURNAL_BY_SOURCE, {
          params: { sourceModule, sourceId },
          signal: controller.signal,
        });

        const result = response?.data?.data || response?.data || {};

        setJournals(Array.isArray(result?.journals) ? result.journals : []);
        setBaseCurrencyCode(result?.baseCurrencyCode || null);
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          setJournals([]);
          setBaseCurrencyCode(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchJournal();

    return () => controller.abort();
  }, [sourceModule, sourceId]);

  const currencyLabel = baseCurrencyCode || currencyCode;

  return (
    <div className="my-container container-spacing">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Journal</h3>

        <p className="text-xs text-gray-500 mt-1">
          Amount is displayed in your base currency{' '}
          <Tag color="green" className="mx-0 text-[11px] font-semibold">
            {currencyLabel}
          </Tag>
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-2">Loading journal entries…</p>
      ) : journals.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No journal entries recorded for this document.</p>
      ) : (
        journals.map(journal => <JournalSection key={journal.journalId} journal={journal} hiddenColumns={hiddenColumns} />)
      )}
    </div>
  );
};

export default memo(DocumentJournalPanel);
