import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { Fragment, useEffect, useState } from 'react';

import axiosConfig from 'app/axiosConfig';
import { formatAmount } from '@/utils/currency';
import { PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';
import { roundQty } from '@/utils/services';

const CalcRow = ({ label, value, sign = '+', muted, strong, negative }) => (
  <div className={`flex items-center justify-between gap-3 py-2 ${strong ? 'border-t border-gray-200' : ''}`}>
    <div className="flex items-center gap-2 min-w-0">
      {!strong && <span className={`w-4 text-center text-sm ${negative ? 'text-red-500' : 'text-gray-400'}`}>{sign}</span>}
      <span className={`text-sm ${strong ? 'font-semibold text-gray-800 pl-6' : muted ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
    </div>
    <span className={`text-sm tabular-nums whitespace-nowrap ${strong ? 'font-semibold text-gray-900' : negative ? 'text-red-500' : 'text-gray-800'}`}>
      {negative ? '- ' : ''}
      {formatAmount(Math.abs(Number(value) || 0))}
    </span>
  </div>
);

const RejectedCostRows = ({ details }) => {
  const rows = [
    ...details.items.map(item => ({
      label: item.itemName || '-',
      itemNo: item.itemNo,
      note: item.writtenOffQty === undefined ? null : `${roundQty(item.writtenOffQty)} written off${item.returnedQty ? `, ${roundQty(item.returnedQty)} returned (no cost)` : ''}`,
      cost: item.cost,
    })),
    ...[
      { label: 'Labour', cost: details.labour },
      { label: 'Overhead', cost: details.overhead },
    ].filter(row => row.cost),
  ];

  if (!rows.length) return null;

  return (
    <div className="ml-6 mb-2 rounded-lg border border-gray-100 bg-gray-50/40 divide-y divide-gray-100">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center justify-between gap-3 px-3 py-1.5">
          <span className="text-[12px] text-gray-600 min-w-0 truncate">
            {row.label}
            {row.itemNo ? <span className="text-gray-400"> ({row.itemNo})</span> : ''}
            {row.note ? <span className="text-gray-400"> · {row.note}</span> : ''}
          </span>
          <span className="text-[12px] text-gray-700 tabular-nums whitespace-nowrap">{formatAmount(row.cost)}</span>
        </div>
      ))}
    </div>
  );
};

const ProductionCostBreakdown = ({ url }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosConfig.get(url, { signal: controller.signal });
        setData(response?.data?.data || null);
      } catch (error) {
        if (error?.name !== 'CanceledError') setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [url]);

  if (loading) {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Cost Breakdown</p>
        <p className="text-sm text-gray-500 py-2">Loading…</p>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Cost Breakdown</p>
        <p className="text-sm text-gray-500 py-2">No cost breakdown available — no cost has been booked on this order yet.</p>
      </div>
    );
  }

  const rmItems = data.rawMaterials?.items || [];
  const showScrap = data.scrapRecovered && Number(data.scrapRecovered.total) > 0;
  const recordedUnit = Number(data.recorded?.unit) || 0;
  const mismatch = Math.abs(recordedUnit - (Number(data.unitCost) || 0)) > 0.01;
  // Every rupee spent sits in one of four places; the calculation below takes the last three off the total.
  const split = data.costSplit || {};
  const units = qty => `${roundQty(qty)} ${roundQty(qty) === 1 ? 'unit' : 'units'}`;
  const buckets = [
    { label: 'Finished, in stock', ...split.finished, color: 'bg-emerald-500' },
    { label: 'Rejected', note: 'production loss', ...split.rejected, color: 'bg-red-400' },
    { label: 'In progress', note: 'work in progress', ...split.inProgress, color: 'bg-amber-400' },
    { label: 'Not started', note: 'no cost yet', ...split.notStarted, color: 'bg-gray-300' },
  ];
  const returnedCard = data.returnedMaterial && {
    label: 'Returned',
    cost: data.returnedMaterial.total,
    caption: 'back to stock',
    color: 'bg-sky-400',
  };
  const cards = returnedCard ? [...buckets.slice(0, 2), returnedCard, ...buckets.slice(2)] : buckets;

  return (
    <div className="my-container container-spacing space-y-4">
      <p className="font-bold text-lg">Cost Breakdown</p>
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[15px] text-gray-900">
              {data.outputItem?.itemName || '-'}
              {data.outputItem?.itemNo ? <span className="text-gray-400 font-normal"> ({data.outputItem.itemNo})</span> : ''}
            </p>
            {data.method && <span className="text-[11px] font-medium text-blue-700 bg-blue-50 rounded px-2 py-0.5">{PRODUCTION_MODULE_METHOD_LABEL[data.method]}</span>}
          </div>
          <p className="text-[12px] text-gray-500 mt-1">
            {data.outputQty} {data.outputQty === 1 ? 'unit' : 'units'} produced
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Cost per unit</p>
          <p className="text-2xl font-semibold text-gray-900 tabular-nums leading-tight">{formatAmount(data.unitCost)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold text-sm text-gray-800">Where the cost went</p>
          <p className="text-sm text-gray-600 tabular-nums">
            Total production cost <span className="font-semibold text-gray-900">{formatAmount(data.totalCost)}</span>
          </p>
        </div>
        <div className="flex h-3 rounded overflow-hidden bg-gray-100">
          {buckets.map(bucket => (
            <div key={bucket.label} className={bucket.color} style={{ width: `${data.totalCost > 0 ? ((bucket.cost || 0) / data.totalCost) * 100 : 0}%` }} />
          ))}
        </div>
        <div className={`grid grid-cols-2 gap-3 ${returnedCard ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          {cards.map(card => (
            <div key={card.label} className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-sm ${card.color}`} />
                {card.label}
              </p>
              <p className="text-base font-semibold text-gray-900 tabular-nums">{formatAmount(card.cost || 0)}</p>
              <p className="text-[12px] text-gray-500">{card.caption || units(card.qty)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100">
          <p className="font-semibold text-sm text-gray-800">How this cost is calculated</p>
        </div>

        <div className="px-4 py-2">
          {rmItems.length > 0 && (
            <div className="pt-1 pb-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Raw materials consumed (actual batch cost)</p>
              <div className="rounded-lg border border-gray-100 bg-gray-50/40 divide-y divide-gray-100">
                {rmItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-[13px] text-gray-700 min-w-0 truncate">
                      {item.itemName || '-'}
                      {item.itemNo ? <span className="text-gray-400"> ({item.itemNo})</span> : ''}
                      <span className="text-gray-400"> · {item.qty}</span>
                    </span>
                    <span className="text-[13px] text-gray-800 tabular-nums whitespace-nowrap">{formatAmount(item.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CalcRow label="Raw materials" value={data.rawMaterials?.total} />
          <CalcRow label="Labour" value={data.labour?.total} />
          <CalcRow label="Overhead" value={data.overhead?.total} />

          <CalcRow label="Total production cost" value={data.totalCost} strong />

          {buckets
            .slice(1)
            .filter(bucket => bucket.qty > 0)
            .map(bucket => (
              <Fragment key={bucket.label}>
                <CalcRow label={`${bucket.label} · ${units(bucket.qty)} → ${bucket.note}`} value={bucket.cost} sign="−" negative />
                {bucket.details && <RejectedCostRows details={bucket.details} />}
              </Fragment>
            ))}

          <CalcRow label="Cost of finished units" value={split.finished?.cost} strong />

          <div className="flex items-center justify-between gap-3 py-2 border-t border-gray-100 mt-1">
            <span className="text-sm text-gray-500 pl-6">÷ Finished quantity</span>
            <span className="text-sm tabular-nums text-gray-600">{split.finished?.qty}</span>
          </div>

          <div className="flex items-center justify-between gap-3 py-2.5 border-t border-gray-200 bg-blue-50/40 -mx-4 px-4">
            <span className="text-sm font-semibold text-gray-800 pl-6">Cost per unit</span>
            <span className="text-base font-semibold text-blue-700 tabular-nums">{formatAmount(data.unitCost)}</span>
          </div>

          {showScrap && (
            <div className="flex items-center justify-between gap-3 py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Scrap recovered, booked as income</span>
              <span className="text-sm tabular-nums text-gray-600">{formatAmount(data.scrapRecovered?.total)}</span>
            </div>
          )}
        </div>
      </div>

      {data.batches.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-800">Finished-goods batches created</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-500 text-[11px] uppercase tracking-wide">
                  <th className="text-left font-semibold py-2 px-4">Batch</th>
                  <th className="text-left font-semibold py-2 px-3">Made by</th>
                  <th className="text-right font-semibold py-2 px-3">Quantity</th>
                  <th className="text-right font-semibold py-2 px-4">Recorded cost / unit</th>
                </tr>
              </thead>
              <tbody>
                {data.batches.map((batch, index) => (
                  <tr key={index} className="border-t border-gray-100 text-gray-800">
                    <td className="py-2.5 px-4 whitespace-nowrap font-medium">{renderBatchNumber(batch.batchNo, batch.itemBatchId, 'Batch ')}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">{batch.submissionNo ? `Submission ${batch.submissionNo}` : '-'}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">{batch.quantity}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap tabular-nums">{formatAmount(batch.purchasePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mismatch && (
            <p className="text-[12px] text-amber-600 px-4 py-2 border-t border-gray-100">
              Note: the recorded batch cost ({formatAmount(recordedUnit)}/unit) differs from the recomputed cost. This can happen with partial submissions or edited data.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductionCostBreakdown;
