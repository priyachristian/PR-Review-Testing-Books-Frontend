import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag, Tooltip } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

// Extras
import { useReport } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { PRODUCTION_MODULE_METHOD, PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';

const PRIMARY = colorPalette.primary[500];

const Breadcrumb = ({ items, onNavigate }) => (
  <div className="flex items-center gap-1.5 text-sm flex-wrap">
    {items.map((item, idx) => (
      <span key={idx} className="flex items-center gap-1.5">
        {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
        {idx < items.length - 1 ? (
          <button className="font-medium hover:underline" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
            {item}
          </button>
        ) : (
          <span className="font-semibold text-gray-800">{item}</span>
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

const CostStatCard = ({ label, value, icon, highlight = false }) => (
  <div className={`rounded-xl border p-4 h-full ${highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: PRIMARY }}>
        {icon}
      </div>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
    <p className={`text-xl font-bold leading-tight ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
  </div>
);

const BatchCard = ({ batch, detailBatch, onSourceClick }) => {
  const clickable = ['BILL', 'GRPO', 'CREDIT_NOTE', 'PRODUCTION_ORDER'];
  const isClickable = detailBatch && clickable.includes(detailBatch.sourceType);

  const sourceLabel = detailBatch ? `${detailBatch.sourceType}${detailBatch.sourceNo ? ` (${detailBatch.sourceNo})` : ''}` : '';

  const sourceNode = detailBatch?.sourceType ? (
    <Tooltip title={sourceLabel} placement="topLeft">
      <Tag className={`font-semibold m-0 w-full max-w-[250px] overflow-hidden inline-flex ${isClickable ? 'cursor-pointer' : ''}`} onClick={isClickable ? () => onSourceClick(detailBatch) : undefined}>
        <span className="truncate block w-full">{sourceLabel}</span>
      </Tag>
    </Tooltip>
  ) : (
    '—'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
        <Icons.FileTextOutlined className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">Batch</span>
        {renderBatchNumber(batch.batchNo, batch.itemBatchId)}
      </div>
      <div className="px-4 py-1 grid grid-cols-2 gap-x-8">
        <div>
          <Row label="Quantity" value={batch.quantity ?? '—'} />
          <Row label="Purchase Price" value={formatAmount(batch.purchasePrice) || '—'} />
        </div>
        <div>
          <Row label="Source" value={sourceNode} truncateValue />
        </div>
      </div>
    </div>
  );
};

const RawMaterialCard = ({ rawMaterial, isOpen, isLoading, detailBatches, onToggle, onSourceClick, navigate }) => {
  const totalQty = rawMaterial.batches?.map(b => Number(b.quantity) || 0).reduce((a, b) => a + b, 0) ?? 0;
  const itemId = rawMaterial.rawMaterialId || rawMaterial.item;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <Tag className="font-semibold m-0 text-xs flex-shrink-0">RM</Tag>
          <Tag className="font-semibold m-0 text-sm truncate">{rawMaterial.itemNo}</Tag>
          <span className="font-semibold text-gray-800 text-sm truncate">{rawMaterial.itemName}</span>
        </div>
        <button type="button" className="text-xs font-semibold hover:underline flex-shrink-0 ml-3" style={{ color: PRIMARY }} onClick={() => navigate(`/item-master/${itemId}`)}>
          View Item →
        </button>
      </div>

      <div className="px-5 py-1 grid grid-cols-2 gap-x-10">
        <div>
          <Row label="Total Batches" value={rawMaterial.batches?.length || 0} />
          <Row label="Total Quantity" value={totalQty} />
        </div>
        <div>
          <Row label="Material Cost" value={formatAmount(rawMaterial.rawMaterialCost) || '—'} />
        </div>
      </div>

      <button
        type="button"
        className="w-full flex items-center px-5 py-2 border-t cursor-pointer select-none transition-colors"
        style={isOpen ? { backgroundColor: colorPalette.primary[50], borderColor: colorPalette.primary[200] } : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}
        onClick={onToggle}
      >
        <span className="text-sm font-semibold mr-1.5" style={{ color: isOpen ? colorPalette.primary[600] : '#4b5563' }}>
          Batch Details
        </span>
        <span className="text-[11px]" style={{ color: isOpen ? colorPalette.primary[500] : '#9ca3af' }}>
          {isOpen ? <Icons.UpOutlined /> : <Icons.DownOutlined />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <CustomLoader />
            </div>
          ) : rawMaterial.batches?.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {rawMaterial.batches.map((batch, i) => {
                const detailBatch = detailBatches?.find(b => batch.itemBatchId && b.itemBatchId === batch.itemBatchId);
                return <BatchCard key={batch.batchNo || i} batch={batch} detailBatch={detailBatch} onSourceClick={onSourceClick} />;
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-4">No batch data available.</p>
          )}
        </div>
      )}
    </div>
  );
};

const ProcessCard = ({ process, activeRawMaterialKey, detailLoading, detailBatches, onToggleRawMaterial, onSourceClick, navigate }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2.5">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
        <span className="font-semibold text-gray-800 text-sm">
          {process.processNo} — {process.processName}
        </span>
        <Tag color="blue" className="font-semibold m-0 text-xs">
          Process
        </Tag>
      </div>
    </div>

    <div className="p-4 flex flex-col gap-3">
      {process.processRawMaterialInput?.length ? (
        process.processRawMaterialInput.map((rawMaterial, rmIndex) => {
          const key = `${process.processId || process.processNo}-${rawMaterial.rawMaterialId || rawMaterial.item || rmIndex}`;
          return (
            <RawMaterialCard
              key={key}
              rawMaterial={rawMaterial}
              isOpen={activeRawMaterialKey === key}
              isLoading={activeRawMaterialKey === key && detailLoading}
              detailBatches={activeRawMaterialKey === key ? detailBatches : null}
              onToggle={() => onToggleRawMaterial(rawMaterial, key)}
              onSourceClick={onSourceClick}
              navigate={navigate}
            />
          );
        })
      ) : (
        <p className="text-sm text-gray-400 italic text-center py-4">No raw materials in this process.</p>
      )}
    </div>
  </div>
);

const ViewProfitAndLossByProductionOrderReport = () => {
  const navigate = useNavigate();
  const { productionOrderId } = useParams();
  const { modelLoading, getProfitAndLossByProductionOrder, profitAndLossByProductionOrder, getProfitAndLossByProductionOrderDetails, profitAndLossByProductionOrderDetails, detailLoading } =
    useReport();

  const [activeRawMaterialKey, setActiveRawMaterialKey] = useState(null);

  useEffect(() => {
    if (productionOrderId) {
      const controller = new AbortController();
      getProfitAndLossByProductionOrder({ productionOrderId, signal: controller.signal });
      return () => controller.abort();
    }
  }, [productionOrderId, getProfitAndLossByProductionOrder]);

  const handleShowDetails = async record => {
    const productionOrderData = {
      itemId: record.rawMaterialId || record.item,
      batches: (record.batches || []).map(batch => ({ itemBatchId: batch.itemBatchId })),
    };
    await getProfitAndLossByProductionOrderDetails(productionOrderData);
  };

  const handleToggleRawMaterial = async (rawMaterial, key) => {
    if (activeRawMaterialKey === key) {
      setActiveRawMaterialKey(null);
      return;
    }
    setActiveRawMaterialKey(key);
    try {
      await handleShowDetails(rawMaterial);
    } catch {
      setActiveRawMaterialKey(null);
    }
  };

  const handleSourceClick = record => {
    if (!record) return;
    if (record.sourceType === 'BILL') navigate(`/bills/${record.sourceId}`);
    else if (record.sourceType === 'GRPO') navigate(`/grpo/${record.sourceId}`);
    else if (record.sourceType === 'CREDIT_NOTE') navigate(`/credit-notes/${record.sourceId}`);
    else if (record.sourceType === 'PRODUCTION_ORDER') navigate(`/reports/gross-profit/customer-details/producation-order/${record.sourceId}`);
  };

  const data = profitAndLossByProductionOrder;
  const isProcessBased = data?.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE;

  const breadcrumbItems = ['Reports', 'Gross Profit', data?.productionOrderCode || 'Production Order'];

  const handleBreadcrumbNavigate = idx => {
    if (idx === 0) navigate('/reports');
    if (idx === 1) navigate('/reports/gross-profit');
  };

  return (
    <div className="-m-4">
      {modelLoading ? (
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
                  <CustomButton type="default" className="flex-shrink-0" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                  <div className="flex-1 min-w-0">
                    <Tooltip title={data?.itemName} placement="bottomLeft">
                      <span className="text-[1.125rem] font-bold text-heading truncate inline-block max-w-full">{data?.productionOrderCode}</span>
                    </Tooltip>
                  </div>
                </div>

                {data?.productionOrderId && (
                  <div className="flex-shrink-0 self-start xl:self-center">
                    <Tag className="font-semibold cursor-pointer" color="blue" onClick={() => navigate(`/production-orders/${data.productionOrderId}`)}>
                      View ({data?.productionOrderCode})
                    </Tag>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="container-spacing py-4 flex flex-col gap-4">
            {/* Production order info strip */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-700">Production Order Information</span>
              </div>
              <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
                <div>
                  <Row
                    label="Production Order#"
                    value={
                      data?.productionOrderCode ? (
                        <Tag className="font-semibold cursor-pointer m-0" onClick={() => navigate(`/production-orders/${data?.productionOrderId}`)}>
                          {data.productionOrderCode}
                        </Tag>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <Row label="Production Date" value={data?.productionDate ? dateFormateForUi(data.productionDate) : '—'} />
                </div>
                <div>
                  <Row label="Production Method" value={data ? PRODUCTION_MODULE_METHOD_LABEL[data.productionManageMethod] : '—'} />
                  <Row
                    label="Finished Good"
                    value={
                      data?.itemName ? (
                        <Tooltip title={data.itemName} placement="top">
                          <span className="truncate max-w-[180px] inline-block align-bottom">{data.itemName}</span>
                        </Tooltip>
                      ) : (
                        '—'
                      )
                    }
                  />
                </div>
                {isProcessBased && (
                  <div>
                    <Row label="Recipe Name" value={data?.processBased?.recipeName || '—'} />
                  </div>
                )}
              </div>
            </div>

            {/* Raw materials section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Raw Material Breakdown</h3>

              {isProcessBased ? (
                <div className="flex flex-col gap-4">
                  {data?.processBased?.processes?.length ? (
                    data.processBased.processes.map((process, pIndex) => (
                      <ProcessCard
                        key={process?.id || process?.processId || pIndex}
                        process={process}
                        activeRawMaterialKey={activeRawMaterialKey}
                        detailLoading={detailLoading}
                        detailBatches={profitAndLossByProductionOrderDetails?.batches}
                        onToggleRawMaterial={handleToggleRawMaterial}
                        onSourceClick={handleSourceClick}
                        navigate={navigate}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white border border-gray-200 rounded-xl">
                      <Icons.FileTextOutlined className="text-4xl mb-3" />
                      <p className="text-sm">No processes found for this production order.</p>
                    </div>
                  )}
                </div>
              ) : data?.rawMaterials?.length ? (
                <div className="flex flex-col gap-4">
                  {data.rawMaterials.map((rawMaterial, rmIndex) => {
                    const key = `bom-${rawMaterial.rawMaterialId || rawMaterial.itemNo || rmIndex}`;
                    return (
                      <RawMaterialCard
                        key={key}
                        rawMaterial={rawMaterial}
                        isOpen={activeRawMaterialKey === key}
                        isLoading={activeRawMaterialKey === key && detailLoading}
                        detailBatches={activeRawMaterialKey === key ? profitAndLossByProductionOrderDetails?.batches : null}
                        onToggle={() => handleToggleRawMaterial(rawMaterial, key)}
                        onSourceClick={handleSourceClick}
                        navigate={navigate}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white border border-gray-200 rounded-xl">
                  <Icons.FileTextOutlined className="text-4xl mb-3" />
                  <p className="text-sm">No raw materials found for this production order.</p>
                </div>
              )}
            </div>

            {/* Cost summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cost Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <CostStatCard label="Raw Material Cost" value={formatAmount(data?.totalRawMaterialCost || 0)} icon={<Icons.InboxOutlined />} />
                <CostStatCard label="Additional Cost" value={formatAmount(data?.totalAdditionalCost || 0)} icon={<Icons.PlusCircleOutlined />} />
                <CostStatCard label="Manpower Cost" value={formatAmount(data?.totalManpowerCost || 0)} icon={<Icons.TeamOutlined />} />
                <CostStatCard label="Total Production Cost" value={formatAmount(data?.totalProductionCost || 0)} icon={<Icons.DollarOutlined />} />
              </div>

              <div className="mt-3 bg-white border border-gray-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{formatAmount(data?.totalProductionCost || 0)}</span>
                <span className="text-gray-400">÷</span>
                <span className="font-semibold text-gray-800">{data?.totalFgSubmittedQty ?? 0} units</span>
                <span className="text-gray-400">=</span>
                <span className="font-bold text-base" style={{ color: PRIMARY }}>
                  {formatAmount(data?.perItemFGCost || 0)} per unit
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfitAndLossByProductionOrderReport;
