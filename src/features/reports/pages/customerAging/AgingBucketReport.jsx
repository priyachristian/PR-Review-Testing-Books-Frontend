import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useReport, getAgingBucketReportColumns } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const AgingBucketReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pagination state
  const [page, setPage] = useState(1);
  const [currentPageRecords, setCurrentPageRecords] = useState([]);
  const recordsPerPage = useRef(DEFAULT_PAGE_SIZE);
  const prevPageLimitRef = useRef(recordsPerPage.current);

  const { bucketLoading, bucketError, bucketData, getCustomerAgingBucket, getVendorAgingBucket, clearBucketData } = useReport();

  const { isSplitWise, isSplitSessionActive } = useModulePermissions(RESOURCES.REPORTS);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const minDays = searchParams.get('minDays');
  const maxDays = searchParams.get('maxDays');
  const customerId = searchParams.get('customerId');
  const vendorId = searchParams.get('vendorId');
  const bucketLabel = searchParams.get('bucketLabel');
  const [searchText] = useState('');

  // Determine type from URL path or query params
  const type = customerId ? 'customer' : 'vendor';
  const typeLabel = type === 'customer' ? 'Customer' : 'Vendor';

  // Get documents safely (before conditional returns and useEffect)
  const documents = bucketData ? (type === 'customer' ? bucketData.invoices || [] : bucketData.bills || []) : [];

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchText) return documents;
    const search = searchText.toLowerCase();
    return documents.filter(item => {
      const docNo = type === 'customer' ? item.invoiceNo : item.billNo;
      const entityName = type === 'customer' ? item.customerName : item.vendorName;
      return docNo?.toLowerCase().includes(search) || entityName?.toLowerCase().includes(search) || item.invoiceDate?.toLowerCase().includes(search) || item.billDate?.toLowerCase().includes(search);
    });
  }, [documents, searchText, type]);

  useEffect(() => {
    if (minDays) {
      const payload = {
        minDays: parseInt(minDays, 10),
        maxDays: maxDays ? parseInt(maxDays, 10) : null,
      };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      if (customerId) {
        payload.customerIds = [customerId];
      } else if (vendorId) {
        payload.vendorIds = [vendorId];
      }

      const branchId = searchParams.get('branchId');
      if (branchId) {
        payload.branchId = branchId.split(',').filter(Boolean);
      }

      payload.isSplit = isSplitSessionActive ? true : false;
      const splitToggleOn = searchParams.get('isSplit') === 'true';
      payload.splitOnly = isSplitSessionActive && isSplitWise && splitToggleOn ? true : false;

      if (type === 'customer') {
        getCustomerAgingBucket(payload);
      } else {
        getVendorAgingBucket(payload);
      }
    }

    return () => {
      clearBucketData();
    };
  }, [startDate, endDate, minDays, maxDays, customerId, vendorId, type, isSplitSessionActive, searchParams]);

  // Update current page records when filteredItems or page changes
  useEffect(() => {
    if (filteredItems && filteredItems.length > 0) {
      const recordNumberForNextPage = page === 1 ? 0 : (page - 1) * recordsPerPage.current;
      const updatedPageRecords = filteredItems.slice(recordNumberForNextPage, recordsPerPage.current * page);
      setCurrentPageRecords(updatedPageRecords);
    } else {
      setCurrentPageRecords([]);
    }
  }, [filteredItems, page]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchText]);

  // Calculate summary
  const summary = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.totalAmount += item.total || 0;
        acc.totalPaid += item.paidAmount || 0;
        acc.totalBalance += item.balanceAmount || 0;
        acc.totalDocuments += 1;
        return acc;
      },
      { totalAmount: 0, totalPaid: 0, totalBalance: 0, totalDocuments: 0 }
    );
  }, [filteredItems]);

  const handleBack = () => {
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const branchId = searchParams.get('branchId');
    const customerIds = searchParams.get('customerIds');
    const vendorIds = searchParams.get('vendorIds');
    const numberOfColumns = searchParams.get('numberOfColumns');
    const columnType = searchParams.get('columnType');
    const duration = searchParams.get('duration');
    const sortBy = searchParams.get('sortBy');
    const isSplit = searchParams.get('isSplit');

    if (branchId) params.append('branchId', branchId);
    if (customerIds) params.append('customerIds', customerIds);
    if (vendorIds) params.append('vendorIds', vendorIds);
    if (numberOfColumns) params.append('numberOfColumns', numberOfColumns);
    if (columnType) params.append('columnType', columnType);
    if (duration) params.append('duration', duration);
    if (sortBy) params.append('sortBy', sortBy);
    if (isSplit) params.append('isSplit', isSplit);

    if (type === 'customer') {
      navigate(`/reports/customer-aging?${params.toString()}`);
    } else {
      navigate(`/reports/vendor-aging?${params.toString()}`);
    }
  };

  // Entity click handler removed since we're showing only one entity's documents

  const handleDocumentClick = useCallback(
    documentId => {
      if (type === 'customer') {
        navigate(`/invoices/${documentId}`);
      } else {
        navigate(`/bills/${documentId}`);
      }
    },
    [navigate, type]
  );

  const tableColumns = useMemo(() => getAgingBucketReportColumns({ type, onDocumentClick: handleDocumentClick }), [type, handleDocumentClick]);

  const handlePaginationChange = (newPage, limit) => {
    if (prevPageLimitRef.current !== limit) {
      recordsPerPage.current = limit;
      prevPageLimitRef.current = limit;
    }
    if (filteredItems && filteredItems.length > 0) {
      const recordNumberForNextPage = newPage === 1 ? 0 : (newPage - 1) * recordsPerPage.current;
      const updatedPageRecords = filteredItems.slice(recordNumberForNextPage, recordsPerPage.current * newPage);
      setPage(newPage);
      setCurrentPageRecords(updatedPageRecords);
    }
  };

  const getBucketLabel = () => {
    if (bucketLabel) return bucketLabel;
    if (!bucketData?.bucket) return 'Bucket Details';
    const { label } = bucketData.bucket;
    return label;
  };

  const { dateRange } = bucketData || {};

  return (
    <div className="-m-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={handleBack} />
          <div>
            <p className="font-bold text-[1.125rem]">
              {typeLabel} Aging: {getBucketLabel()}
            </p>
            <p className="text-xs text-gray-500">
              Reports {'>'} {typeLabel} Aging {'>'} {getBucketLabel()}
            </p>
          </div>
        </div>
        {(dateRange || (startDate && endDate)) && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Date Range</div>
            <div className="text-sm font-semibold text-gray-700">
              {startDate ? dateFormateForUi(startDate) : '-'} to {endDate ? dateFormateForUi(endDate) : '-'}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="bg-white border-b border-gray-200 container-spacing py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600">Total Amount</div>
              <div className="text-lg font-bold text-gray-900">{formatAmount(summary.totalAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Total Documents</div>
              <div className="text-lg font-bold text-gray-900">{summary.totalDocuments}</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="">
        {bucketLoading && <CustomLoader />}

        {bucketError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 container-spacing">{bucketError}</div>}

        {!bucketLoading && !bucketError && filteredItems.length > 0 && (
          <CustomTable
            columns={tableColumns}
            data={currentPageRecords.length > 0 ? currentPageRecords : filteredItems}
            loading={false}
            pagination={{
              current: page,
              pageSize: recordsPerPage.current,
              total: filteredItems.length || 0,
              onChange: handlePaginationChange,
            }}
            showSizeChanger={false}
            scroll={{ x: 'max-content', y: 500 }}
            onRowClick={record => handleDocumentClick(record[type === 'customer' ? 'invoiceId' : 'billId'])}
          />
        )}

        {!bucketLoading && !bucketError && filteredItems.length === 0 && documents.length === 0 && (
          <div className="text-center py-8 text-gray-500 container-spacing">No {type === 'customer' ? 'invoices' : 'bills'} found in this bucket.</div>
        )}

        {!bucketLoading && !bucketError && filteredItems.length === 0 && documents.length > 0 && (
          <div className="text-center py-8 text-gray-500 container-spacing">No {type === 'customer' ? 'invoices' : 'bills'} match your search criteria.</div>
        )}
      </div>
    </div>
  );
};

export default AgingBucketReport;
