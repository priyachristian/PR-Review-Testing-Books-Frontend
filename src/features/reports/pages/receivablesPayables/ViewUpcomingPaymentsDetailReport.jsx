import { formatAmount } from '@/utils/currency';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Extras
import Icons from 'assets/icons/icon';
import { reportService, getUpcomingPaymentsPayablesColumns, getUpcomingPaymentsReceivablesColumns } from '@/features/reports';
import { dateFormateForBackend, dateFormateForUi } from 'utils/services';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Report filters carried from the summary page and back to it.
const FILTER_KEYS = ['startDate', 'endDate', 'branchId', 'numberOfColumns', 'columnType', 'duration'];

const ViewUpcomingPaymentsDetailReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);

  const recordsPerPage = useRef(DEFAULT_PAGE_SIZE);
  const abortControllerRef = useRef(null);

  // Receivables or payables from the last URL segment; both paths sit under /receivables-payables/.
  const isReceivables = location.pathname.split('/').pop() === 'receivables';
  const typeLabel = isReceivables ? 'Receivables' : 'Payables';

  const bucketLabel = searchParams.get('bucket') || '';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const branchId = searchParams.get('branchId');
  const numberOfColumns = searchParams.get('numberOfColumns');
  const columnType = searchParams.get('columnType');
  const duration = searchParams.get('duration');

  const bucketItems = useMemo(() => {
    const bucket = data?.buckets?.find(b => b.label === bucketLabel);
    if (!bucket) return [];
    return isReceivables ? bucket.receivables : bucket.payables;
  }, [data, bucketLabel, isReceivables]);

  const pageRecords = useMemo(() => {
    const start = (page - 1) * recordsPerPage.current;
    return bucketItems.slice(start, start + recordsPerPage.current);
  }, [bucketItems, page]);

  const summary = useMemo(
    () =>
      bucketItems.reduce(
        (acc, item) => ({
          totalAmount: acc.totalAmount + item.amount,
          totalBalance: acc.totalBalance + item.balanceAmount,
        }),
        { totalAmount: 0, totalBalance: 0 }
      ),
    [bucketItems]
  );

  const handlePaginationChange = (newPage, limit) => {
    recordsPerPage.current = limit;
    setPage(newPage);
  };

  const handleDocumentClick = useCallback(redirectUrl => navigate(redirectUrl), [navigate]);

  const tableColumns = useMemo(
    () => (isReceivables ? getUpcomingPaymentsReceivablesColumns({ onDocumentClick: handleDocumentClick }) : getUpcomingPaymentsPayablesColumns({ onDocumentClick: handleDocumentClick })),
    [isReceivables, handleDocumentClick]
  );

  const handleBack = () => {
    const backParams = new URLSearchParams();
    FILTER_KEYS.forEach(key => {
      if (searchParams.get(key)) backParams.set(key, searchParams.get(key));
    });
    navigate(`/reports/receivables-payables?${backParams.toString()}`);
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const branchIds = branchId ? branchId.split(',').filter(Boolean) : [];
    setLoading(true);
    reportService
      .getUpcomingPayments({
        startDate: dateFormateForBackend(startDate),
        endDate: dateFormateForBackend(endDate),
        numberOfColumns: Number(numberOfColumns),
        columnType,
        duration: Number(duration),
        branchId: branchIds.length > 0 ? branchIds : null,
        signal: abortControllerRef.current.signal,
      })
      .then(response => {
        setData(response?.data);
        setPage(1);
        setLoading(false);
      })
      .catch(error => {
        if (isCanceledRequestError(error)) return;
        setData(null);
        setLoading(false);
      });

    return () => abortControllerRef.current?.abort();
  }, [startDate, endDate, branchId, numberOfColumns, columnType, duration]);

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={handleBack} />
          <div>
            <p className="font-bold text-[1.125rem]">
              {typeLabel}: {bucketLabel}
            </p>
            <p className="text-xs text-gray-500">
              Reports {'>'} Receivables / Payables {'>'} {bucketLabel} {typeLabel}
            </p>
          </div>
        </div>
        {startDate && endDate && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Date Range</div>
            <div className="text-sm font-semibold text-gray-700">
              {dateFormateForUi(startDate)} to {dateFormateForUi(endDate)}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-b border-gray-200 container-spacing py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-600">Total Amount</div>
            <div className="text-lg font-bold text-gray-900">{formatAmount(summary.totalAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Total Balance Due</div>
            <div className="text-lg font-bold text-red-600">{formatAmount(summary.totalBalance)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Total Documents</div>
            <div className="text-lg font-bold text-gray-900">{bucketItems.length}</div>
          </div>
        </div>
      </div>

      <CustomTable
        columns={tableColumns}
        data={pageRecords}
        loading={loading}
        tableId={isReceivables ? 'invoiceId' : 'billId'}
        pagination={{
          current: page,
          pageSize: recordsPerPage.current,
          total: bucketItems.length,
          onChange: handlePaginationChange,
        }}
        showSizeChanger={false}
        scroll={{ x: 'max-content' }}
        onRowClick={record => handleDocumentClick(record.redirectUrl)}
      />
    </div>
  );
};

export default ViewUpcomingPaymentsDetailReport;
