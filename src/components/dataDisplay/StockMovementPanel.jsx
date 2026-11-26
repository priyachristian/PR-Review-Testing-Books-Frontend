import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import axiosConfig from 'app/axiosConfig';
import { Tag } from '@/components/AntDComponent';
import { formatAmount } from '@/utils/currency';
import { SOURCE_ROUTES, DEDUCTED_SOURCE_ROUTES } from '@/utils/constants';
import { roundQty } from '@/utils/services';

const buildSourceLink = (sourceType, sourceDocId) => {
  const builder = sourceType ? SOURCE_ROUTES[sourceType] : null;
  return builder && sourceDocId ? builder(sourceDocId) : null;
};

const buildUsageLink = (sourceType, docId) => {
  const builder = sourceType ? DEDUCTED_SOURCE_ROUTES[sourceType] : null;
  return builder && docId ? builder(docId) : null;
};

const roundPct = value => Math.round(Number(value) || 0);

const sharedBatchUnit = batches => {
  const units = [...new Set((batches || []).map(batch => batch?.unit).filter(Boolean))];
  return units.length === 1 ? units[0] : '';
};

const formatQtyWithUnit = (qty, unit) => {
  if (qty == null || qty === '') return '-';
  return unit ? `${qty} ${unit}` : String(qty);
};

const SourceDoc = ({ sourceDoc, sourceLink }) => {
  if (!sourceDoc) return <span className="text-gray-400">-</span>;
  const tag = <Tag className={`font-semibold m-0${sourceLink ? ' cursor-pointer' : ''}`}>{sourceDoc}</Tag>;
  return sourceLink ? (
    <Link to={sourceLink} onClick={e => e.stopPropagation()}>
      {tag}
    </Link>
  ) : (
    tag
  );
};

const UsageDetail = ({ usage, unit }) => {
  if (!usage || usage.length === 0) {
    return <p className="text-[13px] text-gray-400 px-3 py-2">Not used yet — full quantity still in stock.</p>;
  }
  return (
    <table className="w-full text-[13px] border-collapse">
      <thead>
        <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
          <th className="text-left font-semibold py-1.5 px-3">Used in</th>
          <th className="text-left font-semibold py-1.5 px-3">Type</th>
          <th className="text-right font-semibold py-1.5 px-3">Qty</th>
          <th className="text-right font-semibold py-1.5 px-3">Sold at</th>
          <th className="text-right font-semibold py-1.5 px-3">Document Unit Price</th>
          <th className="text-right font-semibold py-1.5 px-3">Profit</th>
        </tr>
      </thead>
      <tbody>
        {usage.map((entry, index) => {
          const label = entry?.docNo || entry?.docType || '-';
          const link = buildUsageLink(entry?.sourceType, entry?.docId);
          const sold = Number(entry?.soldAt) || 0;
          const documentUnitRate = Number(entry?.documentUnitRate) || 0;
          const cost = Number(entry?.cost) || 0;
          const hasSale = sold > 0;
          const canProfit = hasSale && cost > 0;
          const profit = Number(entry?.profit) || 0;
          return (
            <tr key={index} className="border-t border-gray-100 text-gray-800">
              <td className="py-2 px-3 whitespace-nowrap">
                <SourceDoc sourceDoc={entry?.docNo ? label : null} sourceLink={link} />
              </td>
              <td className="py-2 px-3 whitespace-nowrap text-gray-500">{entry?.docType || '-'}</td>
              <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{formatQtyWithUnit(entry?.qty, entry?.unit || unit)}</td>
              <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{hasSale ? formatAmount(sold) : '—'}</td>
              <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{documentUnitRate > 0 ? formatAmount(documentUnitRate) : '—'}</td>
              <td className={`py-2 px-3 text-right whitespace-nowrap tabular-nums font-medium ${!canProfit ? 'text-gray-400' : profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {canProfit ? `${profit < 0 ? '-' : '+'}${formatAmount(Math.abs(profit))}` : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const AddCards = ({ movements }) => {
  const items = (movements || []).map((movement, mIndex) => {
    const batches = movement?.batches || [];
    return {
      key: `${mIndex}`,
      itemName: movement?.itemName,
      itemNo: movement?.itemNo,
      batches,
      totalQty: movement?.totalQty ?? batches.reduce((sum, batch) => sum + (Number(batch?.qty) || 0), 0),
      remainingQty: batches.reduce((sum, batch) => sum + (Number(batch?.remainingQty) || 0), 0),
      unit: sharedBatchUnit(batches),
    };
  });
  items.forEach(item => {
    item.usedQty = Math.max(0, Math.round((item.totalQty - item.remainingQty) * 1000) / 1000);
  });

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-2">No stock movement recorded for this document.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
            <div className="min-w-0">
              <p className="font-semibold text-[15px]">
                {item.itemName || '-'}
                {item.itemNo ? <span className="text-gray-400 font-normal"> ({item.itemNo})</span> : ''}
              </p>
              <p className="text-[12px] text-gray-500 mt-0.5">
                {item.batches.length} {item.batches.length === 1 ? 'batch' : 'batches'}
              </p>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-right">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-tight">Total</p>
                <p className="text-base font-semibold leading-tight text-gray-800 tabular-nums">{formatQtyWithUnit(item.totalQty, item.unit)}</p>
              </div>
              <div className="w-px h-7 bg-gray-200" />
              <div className="text-right">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-tight">Used</p>
                <p className="text-base font-semibold leading-tight text-gray-800 tabular-nums">{formatQtyWithUnit(item.usedQty, item.unit)}</p>
              </div>
              <div className="w-px h-7 bg-gray-200" />
              <div className="text-right">
                <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-tight">In stock</p>
                <p className="text-base font-semibold leading-tight text-green-600 tabular-nums">{formatQtyWithUnit(roundQty(item.remainingQty), item.unit)}</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {item.batches.map((batch, bIndex) => (
              <div key={bIndex} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-1.5">
                  <span className="text-sm font-medium text-gray-800">
                    {renderBatchNumber(batch.batchNo, batch.itemBatchId, 'Batch ')}
                    {batch?.warehouse ? <span className="text-gray-400 font-normal"> · {batch.warehouse}</span> : ''}
                  </span>
                  <span className="text-[13px] text-gray-500">
                    Added <b className="font-medium text-gray-700 tabular-nums">{formatQtyWithUnit(batch?.qty, batch?.unit)}</b>
                    <span className="mx-1.5 text-gray-300">·</span>
                    Purchase Qty <b className="font-medium text-gray-700 tabular-nums">{formatQtyWithUnit(batch?.purchaseQty, batch?.purchaseUnit)}</b>
                    <span className="mx-1.5 text-gray-300">·</span>
                    Cost <b className="font-medium text-gray-700 tabular-nums">{batch?.rate != null ? formatAmount(batch.rate) : '-'}</b>
                    <span className="mx-1.5 text-gray-300">·</span>
                    Document Unit Price <b className="font-medium text-gray-700 tabular-nums">{batch?.documentUnitRate != null ? formatAmount(batch.documentUnitRate) : '-'}</b>
                    <span className="mx-1.5 text-gray-300">·</span>
                    Left <b className="font-medium text-gray-700 tabular-nums">{formatQtyWithUnit(batch?.remainingQty, batch?.unit)}</b>
                  </span>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/40 overflow-x-auto">
                  <UsageDetail usage={batch?.usage} unit={batch?.unit} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const RefBatchCell = ({ referenceBatches, item, onBatchClick }) => {
  const refs = (referenceBatches || []).filter(ref => ref?.batchNo != null);
  if (!refs.length) return <span className="text-gray-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {refs.map(ref =>
        ref?.batchId && onBatchClick ? (
          <Tag key={ref.batchId} className="font-semibold m-0 cursor-pointer" onClick={() => onBatchClick(ref.batchId, item)}>
            Batch {ref.batchNo}
          </Tag>
        ) : (
          renderBatchNumber(ref.batchNo, ref.batchId, 'Batch ', ref.batchId || ref.batchNo)
        )
      )}
    </div>
  );
};

const DeductCards = ({ movements, showMargin, onBatchClick }) => {
  const items = (movements || []).map((movement, mIndex) => {
    const batches = (movement?.batches || []).map(batch => {
      const cost = Number(batch?.cost) || 0;
      const sell = Number(batch?.rate) || 0;
      const qty = Number(batch?.qty) || 0;
      const hasCost = cost > 0;
      const unitMargin = sell - cost;
      return {
        itemBatchId: batch?.itemBatchId,
        batchNo: batch?.batchNo,
        warehouse: batch?.warehouse,
        sourceDoc: batch?.sourceDocNo || batch?.sourceDocType || null,
        sourceLink: buildSourceLink(batch?.sourceType, batch?.sourceDocId),
        referenceBatches: batch?.referenceBatches || [],
        cost,
        sell,
        qty,
        unit: batch?.unit || '',
        sellingQty: batch?.sellingQty,
        sellingUnit: batch?.sellingUnit || '',
        documentUnitRate: batch?.documentUnitRate,
        hasCost,
        unitMargin,
        marginPct: hasCost ? (unitMargin / cost) * 100 : null,
        profit: unitMargin * qty,
      };
    });
    return {
      key: `${mIndex}`,
      itemId: movement?.itemId,
      itemName: movement?.itemName,
      itemNo: movement?.itemNo,
      batches,
      totalQty: batches.reduce((sum, batch) => sum + batch.qty, 0),
      unit: sharedBatchUnit(batches),
      hasProfit: batches.some(batch => batch.hasCost),
      profit: batches.reduce((sum, batch) => sum + (batch.hasCost ? batch.profit : 0), 0),
    };
  });

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-2">No stock movement recorded for this document.</p>;
  }

  const showRefBatch = items.some(item => item.batches.some(batch => batch.referenceBatches?.length > 0));

  return (
    <div className="space-y-3">
      {items.map(item => {
        const itemPayload = { _id: item.itemId, itemNo: item.itemNo, itemName: item.itemName };
        return (
          <div key={item.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
              <div className="min-w-0">
                <p className="font-semibold text-[15px]">
                  {item.itemName || '-'}
                  {item.itemNo ? <span className="text-gray-400 font-normal"> ({item.itemNo})</span> : ''}
                </p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {formatQtyWithUnit(item.totalQty, item.unit)} · {item.batches.length} {item.batches.length === 1 ? 'batch' : 'batches'}
                </p>
              </div>
              {showMargin && item.hasProfit && (
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide leading-tight">Profit</p>
                  <p className={`text-base font-semibold leading-tight ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.profit < 0 ? '-' : ''}
                    {formatAmount(Math.abs(item.profit))}
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                    <th className="text-left font-semibold py-2 px-4">Batch</th>
                    {showRefBatch && <th className="text-left font-semibold py-2 px-3 whitespace-nowrap">Ref Batch</th>}
                    <th className="text-left font-semibold py-2 px-3">From</th>
                    <th className="text-left font-semibold py-2 px-3">Warehouse</th>
                    <th className="text-right font-semibold py-2 px-3">Qty</th>
                    <th className="text-right font-semibold py-2 px-3 whitespace-nowrap">Selling Qty</th>
                    <th className="text-right font-semibold py-2 px-3">Cost</th>
                    <th className="text-right font-semibold py-2 px-3">Document Unit Price</th>
                    <th className="text-right font-semibold py-2 px-3">{showMargin ? 'Sells at' : 'Rate'}</th>
                    {showMargin && <th className="text-right font-semibold py-2 px-4 whitespace-nowrap">Margin</th>}
                  </tr>
                </thead>
                <tbody>
                  {item.batches.map((batch, bIndex) => (
                    <tr key={bIndex} className="border-t border-gray-100 text-gray-800">
                      <td className="py-2.5 px-4 whitespace-nowrap font-medium">{renderBatchNumber(batch.batchNo, batch.itemBatchId, 'Batch ')}</td>
                      {showRefBatch && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <RefBatchCell referenceBatches={batch.referenceBatches} item={itemPayload} onBatchClick={onBatchClick} />
                        </td>
                      )}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <SourceDoc sourceDoc={batch.sourceDoc} sourceLink={batch.sourceLink} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">{batch.warehouse || '-'}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{formatQtyWithUnit(batch.qty, batch.unit)}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{formatQtyWithUnit(batch.sellingQty, batch.sellingUnit)}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{formatAmount(batch.cost)}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{formatAmount(batch.documentUnitRate)}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{formatAmount(batch.sell)}</td>
                      {showMargin &&
                        (batch.hasCost ? (
                          <td className={`py-2.5 px-4 text-right whitespace-nowrap font-medium ${batch.unitMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {batch.unitMargin < 0 ? '-' : '+'}
                            {formatAmount(Math.abs(batch.unitMargin))}
                            {batch.marginPct != null ? ` · ${roundPct(batch.marginPct)}%` : ''}
                          </td>
                        ) : (
                          <td className="py-2.5 px-4 text-right whitespace-nowrap text-gray-400">—</td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MovementSection = ({ direction, movements, showMargin, onBatchClick }) => {
  const title = direction === 'add' ? 'Stock Added To' : 'Stock Deducted From';
  return (
    <div className="mb-6 last:mb-0">
      <p className="font-bold text-lg mb-3">{title}</p>
      {direction === 'deduct' ? <DeductCards movements={movements} showMargin={showMargin} onBatchClick={onBatchClick} /> : <AddCards movements={movements} />}
    </div>
  );
};

const StockMovementPanel = ({ url, onBatchClick }) => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const response = await axiosConfig.get(url, { signal: controller.signal });
        const result = response?.data?.data || response?.data || {};
        setSections(Array.isArray(result?.sections) ? result.sections : []);
      } catch (error) {
        if (error?.name !== 'CanceledError') setSections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
    return () => controller.abort();
  }, [url]);

  return (
    <div className="my-container container-spacing">
      {loading ? (
        <p className="text-sm text-gray-500 py-2">Loading…</p>
      ) : sections.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No stock movement recorded for this document.</p>
      ) : (
        sections.map(section => <MovementSection key={section.direction} direction={section.direction} movements={section.movements} showMargin={section.showMargin} onBatchClick={onBatchClick} />)
      )}
    </div>
  );
};

export default StockMovementPanel;
