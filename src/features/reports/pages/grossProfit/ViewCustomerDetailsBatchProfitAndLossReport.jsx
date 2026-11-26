import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag, Tooltip } from '@/components/AntDComponent';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import PageHeader from '@/components/ui/common/PageHeader';

// Extras
import { useReport } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

const PRIMARY = colorPalette.primary[500];

const Breadcrumb = ({ items, onNavigate }) => (
  <div className="flex items-center gap-1.5 text-sm flex-wrap">
    {items.map((item, idx) => (
      <span key={idx} className="flex items-center gap-1.5">
        {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
        {idx < items.length - 1 ? (
          <button className="font-medium hover:underline" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
            <Tooltip title={item} placement="bottomLeft">
              <span className="truncate max-w-[180px] inline-block align-bottom">{item}</span>
            </Tooltip>
          </button>
        ) : (
          <span className="font-semibold text-gray-800 truncate max-w-[180px] inline-block align-bottom">{item}</span>
        )}
      </span>
    ))}
  </div>
);

const Row = ({ label, value, valueClass = 'text-gray-900', truncateValue = false }) => (
  <div className="flex items-center justify-between gap-2 py-1 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
    <span className={`text-sm font-semibold ${truncateValue ? 'min-w-0 max-w-[58%] flex justify-end' : ''} ${valueClass}`}>{value ?? '—'}</span>
  </div>
);

const BatchCard = ({ batch, navigate }) => {
  const profitClass = batch.netProfit > 0 ? 'text-green-600' : batch.netProfit < 0 ? 'text-red-500' : 'text-gray-900';

  const clickable = ['BILL', 'GRPO', 'CREDIT_NOTE', 'PRODUCTION_ORDER'];
  const isClickable = clickable.includes(batch.sourceType);

  const goToSource = () => {
    if (batch.sourceType === 'BILL') navigate(`/bills/${batch.sourceId}`);
    else if (batch.sourceType === 'GRPO') navigate(`/grpo/${batch.sourceId}`);
    else if (batch.sourceType === 'CREDIT_NOTE') navigate(`/credit-notes/${batch.sourceId}`);
    else if (batch.sourceType === 'PRODUCTION_ORDER') navigate(`/reports/gross-profit/customer-details/producation-order/${batch.sourceId}`);
  };

  const sourceLabel = `${batch.sourceType}${batch.sourceNo ? ` (${batch.sourceNo})` : ''}`;

  const sourceNode = batch.sourceType ? (
    <Tooltip title={sourceLabel} placement="topLeft">
      <Tag className={`font-semibold m-0 w-full max-w-[250px] overflow-hidden inline-flex ${isClickable ? 'cursor-pointer' : ''}`} onClick={isClickable ? goToSource : undefined}>
        <span className="truncate block w-full">{sourceLabel}</span>
      </Tag>
    </Tooltip>
  ) : (
    '—'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* batch card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="text-sm font-semibold text-gray-700">Batch</span>
        {renderBatchNumber(batch.batchNo, batch.itemBatchId)}
      </div>

      <div className="px-4 py-1 grid grid-cols-2 gap-x-8">
        <div>
          <Row label="Quantity" value={batch.quantity ?? '—'} />
          <Row label="Purchase Price" value={formatAmount(batch.purchasePrice) || '—'} />
          <Row label="Total Cost" value={formatAmount(batch.totalCost) || '—'} />
          <Row label="Profit" value={formatAmount(batch.netProfit) || '—'} valueClass={profitClass} />
        </div>
        <div>
          <Row label="Source" value={sourceNode} truncateValue />
          <Row label="Selling Price" value={formatAmount(batch.sellingPrice) || '—'} />
          <Row label="Revenue" value={formatAmount(batch.totalRevenue) || '—'} />
        </div>
      </div>
    </div>
  );
};

const ItemCard = ({ item, navigate }) => {
  const [open, setOpen] = useState(false);

  const profitClass = item.totalNetProfit > 0 ? 'text-green-600' : item.totalNetProfit < 0 ? 'text-red-500' : 'text-gray-900';
  const marginClass = item.profitMarginPercentage > 0 ? 'text-green-600' : item.profitMarginPercentage < 0 ? 'text-red-500' : 'text-gray-900';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="font-semibold text-gray-800 text-sm">{item.itemName}</span>
          <Tag className="font-bold m-0 text-xs">{item.itemNo}</Tag>
        </div>
        <button type="button" className="text-xs font-semibold hover:underline flex-shrink-0" style={{ color: PRIMARY }} onClick={() => navigate(`/item-master/${item?.itemId}`)}>
          View Item →
        </button>
      </div>

      {/* ── item stats — 2 column label/value grid ── */}
      <div className="px-5 py-1 grid grid-cols-2 gap-x-10">
        <div>
          <Row label="Total Batches" value={item.batches?.length || 0} />
          <Row label="Total Cost" value={formatAmount(item.totalCost) || '—'} />
          <Row label="Profit" value={formatAmount(item.totalNetProfit) || '—'} valueClass={profitClass} />
        </div>
        <div>
          <Row label="Total Quantity" value={item.totalQuantity ?? '—'} />
          <Row label="Revenue" value={formatAmount(item.totalRevenue) || '—'} />
          <Row label="Profit Margin" value={`${item.profitMarginPercentage ?? 0}%`} valueClass={marginClass} />
        </div>
      </div>

      <button
        type="button"
        className="w-full flex items-center px-5 py-2 border-t cursor-pointer select-none transition-colors"
        style={open ? { backgroundColor: colorPalette.primary[50], borderColor: colorPalette.primary[200] } : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
        onClick={() => setOpen(v => !v)}
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
          {item?.batches?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {item.batches.map((b, i) => (
                <BatchCard key={b.batchNo || i} batch={b} navigate={navigate} />
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

const ViewCustomerDetailsBatchProfitAndLossReport = () => {
  const navigate = useNavigate();
  const { documentId } = useParams();

  const { profitAndLossBatchCustomerDetails, loading, getProfitAndLossBatchCustomerDetails, pagination } = useReport();

  useEffect(() => {
    const controller = new AbortController();
    getProfitAndLossBatchCustomerDetails({ documentId, signal: controller.signal });
    return () => controller.abort();
  }, [documentId, getProfitAndLossBatchCustomerDetails]);

  const handleNavigate = () => {
    if (profitAndLossBatchCustomerDetails?.documentType === 'INVOICE') {
      navigate(`/invoices/${profitAndLossBatchCustomerDetails?.documentId}`);
    } else {
      navigate(`/delivery-challans/${profitAndLossBatchCustomerDetails?.documentId}`);
    }
  };

  const breadcrumbItems = ['Reports', 'Gross Profit', profitAndLossBatchCustomerDetails?.customerDisplayName || 'Customer', profitAndLossBatchCustomerDetails?.documentNo || 'Document'];

  const handleBreadcrumbNavigate = idx => {
    if (idx === 0) navigate('/reports');
    if (idx === 1) navigate('/reports/gross-profit');
    if (idx === 2) navigate(`/reports/gross-profit/customer/${profitAndLossBatchCustomerDetails?.customerId}`);
  };

  const items = profitAndLossBatchCustomerDetails?.items || [];
  const summary = pagination?.summary || {};

  return (
    <div className="-m-4">
      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <CustomLoader />
        </div>
      ) : (
        <div>
          <div className="sticky-page-header bg-white border-b">
            <div className="bg-white px-4 py-2 border-b">
              <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
            </div>

            <div className="container-spacing py-3 md:py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                  <div className="flex-1 min-w-0">
                    <PageHeader
                      loading={loading}
                      title={profitAndLossBatchCustomerDetails?.documentNo}
                      rightStats={[
                        { label: 'Total Revenue', value: formatAmount(summary.totalRevenue || 0) },
                        { label: 'Total Profit', value: formatAmount(summary.totalNetProfit || 0) },
                        { label: 'Profit Margin', value: `${summary.profitMarginPercentage || 0}%` },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 self-start xl:self-center">
                  <Tag className="font-semibold cursor-pointer" color="blue" onClick={handleNavigate}>
                    View ({profitAndLossBatchCustomerDetails?.documentNo})
                  </Tag>
                </div>
              </div>
            </div>
          </div>

          <div className="container-spacing py-4 flex flex-col gap-4">
            {items.length ? (
              items.map((item, idx) => <ItemCard key={item.itemId || idx} item={item} navigate={navigate} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Icons.FileTextOutlined className="text-4xl mb-3" />
                <p className="text-sm">No items found for this document.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCustomerDetailsBatchProfitAndLossReport;
