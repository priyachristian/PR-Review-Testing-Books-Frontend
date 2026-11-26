import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// Components
import { Pagination, Select, Tag, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import PageHeader from '@/components/ui/common/PageHeader';

// Extras
import { useReport } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { TABLE_PAGE_SIZE_OPTIONS } from '@/utils/pagination';
import { GROSS_PROFIT_TABS } from '@/utils/tabs';

const PRIMARY = colorPalette.primary[500];

const Breadcrumb = ({ items, onNavigate }) => (
  <div className="bg-white border-b border-gray-200 px-4 py-2 sm:px-6">
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
          {idx < items.length - 1 ? (
            <button className="font-medium hover:underline transition-colors" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
              {item}
            </button>
          ) : (
            <Tooltip title={item} placement="bottomLeft">
              <span className="font-semibold text-gray-800 truncate max-w-[180px] inline-block align-bottom">{item}</span>
            </Tooltip>
          )}
        </span>
      ))}
    </div>
  </div>
);

const Row = ({ label, value, valueClass = 'text-gray-900' }) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value ?? '—'}</span>
  </div>
);

const BatchCard = ({ batch }) => {
  const profitClass = batch?.netProfit > 0 ? 'text-green-600' : batch?.netProfit < 0 ? 'text-red-500' : 'text-gray-900';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="text-sm font-semibold text-gray-700">Batch</span>
        {renderBatchNumber(batch.batchNo, batch.itemBatchId)}
      </div>

      <div className="px-4 py-1 grid grid-cols-2 gap-x-8">
        <div>
          <Row label="Quantity" value={batch?.quantity ?? '—'} />
          <Row label="Purchase Price" value={formatAmount(batch?.purchasePrice) || '—'} />
          <Row label="Total Cost" value={formatAmount(batch?.totalCost) || '—'} />
        </div>
        <div>
          <Row label="Selling Price" value={formatAmount(batch?.sellingPrice) || '—'} />
          <Row label="Revenue" value={formatAmount(batch?.totalRevenue) || '—'} />
          <Row label="Profit" value={formatAmount(batch?.netProfit) || '—'} valueClass={profitClass} />
        </div>
      </div>
    </div>
  );
};

const DocumentCard = ({ document, details, loading, onToggle, navigate, itemFallback }) => {
  const [open, setOpen] = useState(false);
  const activeData = details?.data;
  const summary = details?.summary || {};
  const batchData = activeData?.item?.batches || [];

  const totalQuantity = document?.totalQuantity ?? 0;
  const totalCost = document?.totalCost ?? 0;
  const totalRevenue = summary?.totalRevenue ?? document?.totalRevenue ?? 0;
  const totalProfit = summary?.totalNetProfit ?? document?.totalNetProfit ?? 0;
  const totalMargin = summary?.profitMarginPercentage ?? document?.profitMarginPercentage ?? 0;

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    onToggle(nextOpen, document);
  };

  const handleNavigateToDocument = () => {
    const moduleName = document?.moduleName || activeData?.moduleName || activeData?.documentType;
    const id = document?.documentId || activeData?.documentId;
    if (!id) return;

    if (moduleName === 'INVOICE') {
      navigate(`/invoices/${id}`);
      return;
    }
    if (moduleName === 'DELIVERY_CHALLAN') {
      navigate(`/delivery-challans/${id}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="font-semibold text-gray-800 text-sm truncate">{document?.documentNo || 'Document'}</span>
              <Tag className="font-bold m-0 text-xs">{activeData?.item?.itemNo || itemFallback?.itemNo || '-'}</Tag>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{activeData?.item?.itemName || itemFallback?.itemName || 'Item'}</p>
          </div>

          <div className="flex-shrink-0 self-start lg:self-center">
            <Tag className="font-semibold cursor-pointer" color="blue" onClick={handleNavigateToDocument}>
              View ({document?.documentNo || '-'})
            </Tag>
          </div>
        </div>
      </div>

      <div className="px-5 py-1 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
        <div>
          <Row label="Customer" value={document?.customerName || '—'} />
          <Row label="Total Qty" value={totalQuantity} />
          <Row label="Total Cost" value={formatAmount(totalCost) || '—'} />
        </div>
        <div>
          <Row label="Total Revenue" value={formatAmount(totalRevenue) || '—'} />
          <Row label="Total Profit" value={formatAmount(totalProfit) || '—'} valueClass={totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-500' : 'text-gray-900'} />
          <Row label="Profit %" value={`${totalMargin || 0}%`} valueClass={totalMargin > 0 ? 'text-green-600' : totalMargin < 0 ? 'text-red-500' : 'text-gray-900'} />
        </div>
      </div>

      <button
        type="button"
        className="w-full flex items-center px-5 py-2 border-t cursor-pointer select-none transition-colors"
        style={open ? { backgroundColor: colorPalette.primary[50], borderColor: colorPalette.primary[200] } : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
        onClick={handleToggle}
      >
        <span className="text-sm font-semibold mr-1.5" style={{ color: open ? colorPalette.primary[600] : '#4b5563' }}>
          Batch Details
        </span>
        <span className="text-[11px]" style={{ color: open ? colorPalette.primary[500] : '#9ca3af' }}>
          {open ? <Icons.UpOutlined /> : <Icons.DownOutlined />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
          {loading ? (
            <div className="py-4 flex justify-center">
              <CustomLoader variant="spinner" />
            </div>
          ) : batchData?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {batchData.map((batch, index) => (
                <BatchCard key={batch?.id || batch?.batchNo || index} batch={batch} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">No batch data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

const ViewItemDetailsProfitAndLossReport = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { loading, getProfitAndLoseItemWiseDetails, getProfitAndLossBatchItemDetails, profitAndLoseItemWiseDetails, pagination } = useReport();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedDetailsByDocument, setExpandedDetailsByDocument] = useState({});
  const [expandedRowLoadingByDocument, setExpandedRowLoadingByDocument] = useState({});
  useEffect(() => {
    if (itemId) {
      const payload = {
        itemId,
        page: searchParams?.get('page') || 1,
        limit: searchParams?.get('limit') || pagination?.limit,
      };
      getProfitAndLoseItemWiseDetails(payload);
    }
  }, [getProfitAndLoseItemWiseDetails, itemId, pagination?.limit, searchParams]);

  const updateUrlParams = newParams => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params;
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const getDocumentKey = useCallback(record => record?.documentId || record?.id || record?.documentNo, []);

  const fetchBatchDetailsByDocument = useCallback(
    async documentId => {
      if (!documentId || expandedRowLoadingByDocument[documentId]) return;
      setExpandedRowLoadingByDocument(prev => ({ ...prev, [documentId]: true }));

      try {
        const response = await getProfitAndLossBatchItemDetails({ itemId, documentId });
        setExpandedDetailsByDocument(prev => ({
          ...prev,
          [documentId]: {
            data: response?.payload?.data || null,
            summary: response?.payload?.extras?.summary || {},
          },
        }));
      } finally {
        setExpandedRowLoadingByDocument(prev => ({ ...prev, [documentId]: false }));
      }
    },
    [expandedRowLoadingByDocument, getProfitAndLossBatchItemDetails, itemId]
  );

  const handleDocumentToggle = useCallback(
    async (open, document) => {
      if (!open) return;
      const rowKey = getDocumentKey(document);
      if (!rowKey || expandedDetailsByDocument[rowKey]) return;
      await fetchBatchDetailsByDocument(document?.documentId);
    },
    [expandedDetailsByDocument, fetchBatchDetailsByDocument, getDocumentKey]
  );

  useEffect(() => {
    setExpandedDetailsByDocument({});
    setExpandedRowLoadingByDocument({});
  }, [itemId, searchParams]);

  const itemLabel = profitAndLoseItemWiseDetails?.item?.itemName
    ? `${profitAndLoseItemWiseDetails?.item?.itemName}${profitAndLoseItemWiseDetails?.item?.itemNo ? ` (${profitAndLoseItemWiseDetails?.item?.itemNo})` : ''}`
    : 'Item';

  const breadcrumbItems = ['Reports', 'Gross Profit', itemLabel];
  const handleBreadcrumbNavigate = idx => {
    if (idx === 0) navigate('/reports');
    if (idx === 1) navigate(`/reports/gross-profit?tab=${GROSS_PROFIT_TABS.ITEM_WISE}`);
  };

  const documents = profitAndLoseItemWiseDetails?.item?.documents || [];
  const currentPage = Number(searchParams?.get('page') || 1);
  const pageSize = Number(searchParams?.get('limit') || pagination?.limit || 10);
  const isInitialPageLoading = loading && !documents.length;

  return (
    <div className="-m-4">
      <div>
        <div className="sticky-page-header bg-white border-b">
          <div className="bg-white py-2 -ml-2">
            <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
          </div>
          <div className="container-spacing py-3 md:py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CustomButton
                  type="default"
                  className="flex-shrink-0"
                  text={<Icons.ArrowLeftOutlined />}
                  onClick={() => {
                    navigate(`/reports/gross-profit?tab=${GROSS_PROFIT_TABS.ITEM_WISE}`);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <PageHeader
                    loading={loading}
                    title={
                      <Tooltip title={`${profitAndLoseItemWiseDetails?.item?.itemName} (${profitAndLoseItemWiseDetails?.item?.itemNo})`} placement="bottomLeft">
                        <span className="truncate inline-block max-w-[250px]">
                          {profitAndLoseItemWiseDetails?.item?.itemName} ({profitAndLoseItemWiseDetails?.item?.itemNo})
                        </span>
                      </Tooltip>
                    }
                    rightStats={[
                      { label: 'Total Revenue', value: formatAmount(pagination?.summary?.totalRevenue || 0) },
                      { label: 'Total Profit', value: formatAmount(pagination?.summary?.totalNetProfit || 0) },
                      { label: 'Profit Margin', value: `${pagination?.summary?.profitMarginPercentage || 0}%` },
                    ]}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 self-start xl:self-center">
                <Tag className="font-semibold cursor-pointer" color="blue" onClick={() => navigate(`/item-master/${profitAndLoseItemWiseDetails?.item?.itemId}`)}>
                  View ({profitAndLoseItemWiseDetails?.item?.itemNo})
                </Tag>
              </div>
            </div>
          </div>
        </div>
        <div className="container-spacing py-4">
          {isInitialPageLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <CustomLoader />
            </div>
          ) : documents.length ? (
            <div className="flex flex-col gap-4">
              {documents.map((document, index) => {
                const rowKey = getDocumentKey(document);
                return (
                  <DocumentCard
                    key={rowKey || index}
                    document={document}
                    details={expandedDetailsByDocument[rowKey]}
                    loading={!!expandedRowLoadingByDocument[document?.documentId]}
                    onToggle={handleDocumentToggle}
                    navigate={navigate}
                    itemFallback={profitAndLoseItemWiseDetails?.item}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white border border-gray-200 rounded-xl">
              <Icons.FileTextOutlined className="text-4xl mb-3" />
              <p className="text-sm">No documents found for this item.</p>
            </div>
          )}
          {!isInitialPageLoading && pagination?.totalRecords > 0 && <div className="h-20" />}
        </div>
        {!isInitialPageLoading && pagination?.totalRecords > 0 && (
          <div className="flex flex-col fixed fixed-pagination sm:flex-row !z-50 sm:items-center justify-between gap-1 py-[8.8px] px-2 ps-4 border-t border-l border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={pagination?.totalRecords || 0}
                  showSizeChanger={false}
                  onChange={handlePaginationChange}
                  className="custom-pagination"
                  size="default"
                  itemRender={(page, type, originalElement) => {
                    if (type === 'prev') {
                      return (
                        <button className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                          <span className="text-[#1E3A56] font-normal text-[22px] -mt-[3px] mr-2">‹</span>
                          <span className="text-[#1E3A56] font-normal text-[14px]">Back</span>
                        </button>
                      );
                    }

                    if (type === 'next') {
                      return (
                        <button className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                          <span className="text-[#1E3A56] font-normal text-[14px]">Next</span>
                          <span className="text-[#1E3A56] font-normal text-[22px] -mt-[3px] ml-2">›</span>
                        </button>
                      );
                    }

                    if (type === 'page') {
                      const isActive = page === currentPage;
                      return (
                        <button
                          style={{
                            borderRadius: 6,
                            padding: '4px 12px',
                            minWidth: 35,
                            height: 30,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? 'white' : 'inherit',
                          }}
                        >
                          {page}
                        </button>
                      );
                    }

                    return originalElement;
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-7 w-full sm:w-auto">
              <div className="flex pagination-select items-center gap-2 text-sm text-[#1E3A56]">
                <span>Result per page</span>
                <Select value={pageSize} className="py-0.5" onChange={value => handlePaginationChange(1, parseInt(value, 10))}>
                  {TABLE_PAGE_SIZE_OPTIONS.map(n => (
                    <Select.Option key={n} value={n}>
                      {n}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="text-center sm:text-left mr-5">
                <div className="flex flex-wrap justify-center sm:justify-start items-center text-sm text-[#1E3A56] font-normal leading-[20px] gap-1">
                  <span>{(currentPage - 1) * pageSize + 1}</span>
                  <span>-</span>
                  <span>{Math.min(currentPage * pageSize, pagination?.totalRecords || 0)}</span>
                  <span>of</span>
                  <span>{pagination?.totalRecords || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewItemDetailsProfitAndLossReport;
