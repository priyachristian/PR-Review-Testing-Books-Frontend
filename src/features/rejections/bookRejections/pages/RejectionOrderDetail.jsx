import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Card, Spin } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { RejBadge, MatchTag, ActionBlock, RecoverySummary, formatRecoveryAmount } from '@/features/rejections/bookRejections/components/RejectionShared';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import RejectionDetailSkeleton from '@/features/rejections/bookRejections/components/RejectionDetailSkeleton';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import { useProfile } from '@/features/setting/profile/useProfile';
import { useRejectionOrder } from '@/features/rejections/bookRejections/useRejectionOrder';
import { useRejectionReason } from '@/features/setting/rejectionReason/useRejectionReason';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { RESOURCES } from '@/utils/jsonFile';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { colorPalette } from '@/utils/theme';
import { REJECTION_STATUS as STATUS, REJECTION_FLOW as FLOW, canEditRejectionOrder, getRejectionEditBlockedMessage } from '@/utils/dropdownEnums';
import { MODULE_NAMES } from '@/utils/constants';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';
import { dateFormateForUi, roundQty } from '@/utils/services';

const CONVERT_REFERENCE_TARGETS = {
  SALES_ORDER: { label: 'Sales Order', buildDetailPath: id => ADMIN_ROUTE_PATHS.salesOrders.build.detail(id) },
  CREDIT_NOTE: { label: 'Credit Note', buildDetailPath: id => ADMIN_ROUTE_PATHS.creditNotes.build.detail(id) },
};
const getConvertReferenceTarget = convertReference => CONVERT_REFERENCE_TARGETS[convertReference?.type] || CONVERT_REFERENCE_TARGETS.CREDIT_NOTE;

const HISTORY_READONLY_MSG = 'Viewing a previous stage - this action is read-only.';

// Derived-quantity helpers (only used here).
const countedQty = i => Math.max(0, (i.received || i.booked || 0) - (i.returned || 0));
const rejQty = i => Math.max(0, countedQty(i) - (i.expired || 0));
const formatMfgDate = date => (date ? dateFormateForUi(date) : '-');
const orderReturned = rej => rej.items.reduce((a, i) => a + (i.returned || 0), 0);

/* ── view-model mapping ──────────────────────────────────────
   The backend stores items/recovery/reasons in a normalized shape.
   These helpers translate to/from the flatter shape the step
   components below were authored against. Component recovery
   economics (BOM cost/weight) come from the real backend bulk
   endpoint (getRejectionRecoveryBom), keyed off each item's
   production BOM and cost price. */
function arrayToRecoveryMap(componentRecoveries) {
  const map = {};
  (componentRecoveries || []).forEach(c => {
    const key = c.componentPath || c.componentName;
    map[key] = {
      reuse: c.reuse || 0,
      ret: c.vendorReturn || 0,
      scrap: c.scrap || 0,
      scrapKg: (c.scrapWeightKg || 0) > 0,
      componentItemId: c.componentItemId || null,
      componentName: c.componentName || '',
    };
  });
  return map;
}

function recoveryMapToArray(recoveryMap) {
  if (!recoveryMap) return [];
  return Object.entries(recoveryMap)
    .map(([componentPath, d]) => {
      const reuse = Number(d.reuse) || 0;
      const ret = Number(d.ret) || 0;
      const scrap = Number(d.scrap) || 0;
      return {
        componentPath,
        componentName: d.componentName || componentPath,
        componentItemId: d.componentItemId || null,
        reuse,
        vendorReturn: ret,
        scrap,
        scrapWeightKg: 0,
      };
    })
    .filter(c => c.reuse || c.vendorReturn || c.scrap);
}

function toViewModel(order) {
  if (!order) return null;
  return {
    _id: order._id,
    no: order.rejectionOrderId,
    status: order.status,
    customer: order.customerId?.customerDisplayName || order.customerId?.companyName || '-',
    city: order.address?.city || '-',
    state: order.address?.state || '-',
    project: order.divisionId?.name || '-',
    branch: order.branchId?.name || '-',
    warehouse: order.warehouseId?.name || '-',
    transport: order.transport || '',
    transportName: order.transportName || '',
    transportationDate: order.transportationDate || null,
    arrivalDate: order.arrivalDate || null,
    note: order.note || '',
    attachments: order.attachments || [],
    convertType: order.convertType || null,
    convertReference: order.convertReference || null,
    items: (order.items || []).map(i => ({
      id: i._id,
      itemId: typeof i.itemId === 'object' ? i.itemId?._id || i.itemId?.id : i.itemId,
      series: i.itemId?.name || i.wattage || 'Item',
      watt: i.wattage || '',
      booked: i.bookedQty,
      received: i.receivedQty,
      returned: i.returnedQty || 0,
      mfgDate: i.manufacturingDate || null,
      expired: i.warrantyExpiredQty ?? null,
      expiredMfgDate: i.warrantyExpiredMfgDate || null,
      reasons: (i.reasonAssignments || []).map(r => [typeof r.reason === 'object' ? r.reason?._id : r.reason, r.qty, r.subReason || '']),
      recovery: arrayToRecoveryMap(i.componentRecoveries),
      convert: i.convertType || null,
    })),
  };
}

function toApiItems(items) {
  return items.map(i => ({
    _id: i.id,
    itemId: i.itemId || null,
    wattage: i.watt,
    bookedQty: i.booked,
    receivedQty: i.received,
    returnedQty: i.returned,
    manufacturingDate: i.mfgDate ?? null,
    warrantyExpiredQty: i.expired ?? null,
    warrantyExpiredMfgDate: i.expiredMfgDate ?? null,
    reasonAssignments: (i.reasons || []).map(([reason, qty, subReason]) => ({ reason, qty: Number(qty), subReason })),
    componentRecoveries: recoveryMapToArray(i.recovery),
    convertType: i.convert ?? null,
  }));
}

/* ── RecInput ── */
function RecInput({ v, onChange, disabled = false }) {
  return <CustomInput type="number" name="rec" placeholder="0" value={v} onChange={e => onChange(e.target.value)} setFieldValue={() => {}} disabled={disabled} />;
}

/* ── Shared print / export for the order's PDF reports ── */
function useReportPdfActions({ rej, filePrefix, buildDocument }) {
  const { profile, getProfile } = useProfile();
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);

  const buildPdfBlob = async () => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    return renderPdfToBlob(await buildDocument(freshProfile));
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await buildPdfBlob();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const safeNo = (rej?.no || 'report').replace(/[^a-zA-Z0-9]/g, '_');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filePrefix}_${safeNo}_${dateStr}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      const blob = await buildPdfBlob();
      const blobUrl = URL.createObjectURL(blob);

      // Print the generated PDF through a hidden iframe (same approach as the reports module).
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
    } finally {
      setPrinting(false);
    }
  };

  return { exporting, printing, handleExportPdf, handlePrint };
}

function ReportActions({ actions, onClose }) {
  const { exporting, printing, handleExportPdf, handlePrint } = actions;
  return (
    <div className="flex justify-end gap-2.5 mt-3.5 pt-3.5 border-t">
      <CustomButton type="default" text="Close" disabled={printing || exporting} onClick={onClose} />
      <CustomButton type="secondary" icon={<Icons.PrinterOutlined style={{ fontSize: 14 }} />} text="Print" loading={printing} disabled={printing || exporting} onClick={handlePrint} />
      <CustomButton type="primary" icon={<Icons.DownloadOutlined style={{ fontSize: 14 }} />} text="Export PDF" loading={exporting} disabled={exporting || printing} onClick={handleExportPdf} />
    </div>
  );
}

/* ── ExpiryReport modal ── */
function ExpiryReport({ rej, onClose }) {
  const items = useMemo(() => rej.items.filter(i => i.expired > 0).map(i => ({ ...i, key: i.id })), [rej.items]);
  const totals = useMemo(() => items.reduce((acc, i) => ({ received: acc.received + (i.received || 0), expired: acc.expired + i.expired }), { received: 0, expired: 0 }), [items]);

  const actions = useReportPdfActions({
    rej,
    filePrefix: 'Warranty_Expiry_Report',
    buildDocument: async profile => {
      const { ExpiryReportPdf } = await import('./pdf/ExpiryReportPdf');
      return <ExpiryReportPdf rej={rej} items={items} totals={totals} profile={profile} />;
    },
  });

  const columns = [
    {
      title: 'Item',
      key: 'item',
      width: 240,
      render: (_, i) => (
        <>
          <b>{i.series}</b> <span style={{ color: colorPalette.secondary[500] }}>{i.watt ? ` · ${i.watt}` : ''}</span>
        </>
      ),
    },
    { title: 'Mfg Date', key: 'mfgDate', width: 110, render: (_, i) => formatMfgDate(i.expiredMfgDate) },
    { title: 'Received', dataIndex: 'received', key: 'received', width: 90 },
    {
      title: 'Expired',
      key: 'expired',
      width: 85,
      render: (_, i) => (
        <span className="font-bold" style={{ color: colorPalette.warning[700] }}>
          {i.expired}
        </span>
      ),
    },
  ];

  return (
    <CustomModal modalOpen setModalOpen={open => !open && onClose()} title={`Warranty Expiry Report - ${rej.no}`} width={680} closeIconDisabled={actions.printing || actions.exporting}>
      <div>
        <p className="text-[13px] mb-2.5" style={{ color: colorPalette.secondary[600] }}>
          {rej.customer} · {rej.city}, {rej.state} · {totals.expired} pc warranty expired
        </p>
        <CustomTable columns={columns} data={items} pagination={false} dynamicScrollY={true} />
        <ReportActions actions={actions} onClose={onClose} />
      </div>
    </CustomModal>
  );
}

/* ── MatchReport modal ── */
function MatchReport({ rej, onClose }) {
  const actions = useReportPdfActions({
    rej,
    filePrefix: 'Matching_Report',
    buildDocument: async profile => {
      const { MatchingReportPdf } = await import('@smit9313/abss-pdf');
      return <MatchingReportPdf rej={rej} profile={profile} />;
    },
  });

  const matchColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_, i) => (
        <>
          <b>{i.series}</b> <span className="text-gray-500">{i.watt ? ` · ${i.watt}` : ''}</span>
        </>
      ),
    },
    { title: 'Booked', dataIndex: 'booked', key: 'booked' },
    { title: 'Received', dataIndex: 'received', key: 'received' },
    {
      title: 'Difference',
      key: 'diff',
      render: (_, i) => {
        const d = (i.received || 0) - i.booked;
        return (
          <span className={`font-extrabold ${d === 0 ? 'text-green-700' : d < 0 ? 'text-amber-700' : 'text-primary'}`}>
            {d > 0 ? '+' : ''}
            {d}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, i) => ((i.received || 0) - i.booked === 0 ? <MatchTag ok /> : <MatchTag />),
    },
  ];

  return (
    <CustomModal modalOpen setModalOpen={open => !open && onClose()} title={`Matching Report - ${rej.no}`} width={680} closeIconDisabled={actions.printing || actions.exporting}>
      <div>
        <p className="text-[13px] text-gray-600 mb-2.5">
          {rej.customer} · {rej.city}, {rej.state}
        </p>
        <CustomTable columns={matchColumns} data={rej.items.map(i => ({ ...i, key: i.id }))} pagination={false} dynamicScrollY={true} />
        <ReportActions actions={actions} onClose={onClose} />
      </div>
    </CustomModal>
  );
}

/* ── ReturnModal ── */
function ReturnModal({ rej, onClose, onSubmit }) {
  const [vals, setVals] = useState(() => Object.fromEntries(rej.items.map(i => [i.id, String(i.returned || '')])));
  const set = (id, v) => setVals(s => ({ ...s, [id]: v }));
  const valid = rej.items.every(i => {
    const v = Number(vals[i.id] || 0);
    const max = i.received || i.booked;
    return v >= 0 && v <= max;
  });
  const returnColumns = [
    { title: 'Item', key: 'item', render: (_, i) => <b>{i.series}</b> },
    { title: 'Watt', key: 'watt', render: (_, i) => i.watt },
    { title: 'Received', key: 'received', render: (_, i) => i.received || i.booked },
    {
      title: 'Return Qty',
      key: 'returnQty',
      render: (_, i) => <CustomInput type="number" name={`ret_${i.id}`} placeholder="0" value={vals[i.id]} onChange={e => set(i.id, e.target.value)} setFieldValue={() => {}} />,
    },
    {
      title: 'Remaining',
      key: 'remaining',
      render: (_, i) => {
        const max = i.received || i.booked;
        const rem = max - Number(vals[i.id] || 0);
        return <span className={`font-bold ${rem < 0 ? 'text-red-600' : 'text-gray-800'}`}>{rem}</span>;
      },
    },
  ];

  return (
    <CustomModal modalOpen setModalOpen={open => !open && onClose()} title="Return Product" width={700}>
      <p className="text-gray-600 text-[13.5px] mb-3.5">Enter qty to return - remaining continues through settlement.</p>
      <CustomTable columns={returnColumns} data={rej.items.map(i => ({ ...i, key: i.id }))} pagination={false} dynamicScrollY={true} />
      {!valid && <p className="text-[12.5px] text-red-600 mt-2">Return qty cannot exceed received qty.</p>}
      <div className="flex justify-end gap-2.5 mt-3.5 pt-3.5 border-t">
        <CustomButton type="default" text="Cancel" onClick={onClose} />
        <CustomButton type="primary" icon={<Icons.ArrowLeftOutlined style={{ fontSize: 15 }} />} text="Submit Return" disabled={!valid} onClick={() => onSubmit(vals)} />
      </div>
    </CustomModal>
  );
}

/* ── Step 4: Reason assignment ── */
const REASON_ROW_HEIGHT = 48;
const REASON_LIST_MAX_HEIGHT = REASON_ROW_HEIGHT * 8;
const REASON_LIST_OVERSCAN = 4;
const REASON_ROW_GRID = 'grid grid-cols-[44px_1.6fr_1.6fr] gap-2.5';
const NO_SUB_REASONS = [];

// Saved assignments hold a qty; the form shows one row per rejected piece.
const expandReasonRows = item => {
  const target = rejQty(item);
  const rows = item.reasons.flatMap(([rid, qty, sub]) => Array.from({ length: Number(qty) || 0 }, () => ({ rid, sub: sub || '' }))).slice(0, target);
  return [...rows, ...Array.from({ length: target - rows.length }, () => ({ rid: '', sub: '' }))];
};

// Pieces with the same reason and sub-reason save as one assignment, as reports expect a qty per assignment.
const mergeReasonRows = rows => {
  const merged = new Map();
  rows
    .filter(row => row.rid)
    .forEach(({ rid, sub }) => {
      const key = `${rid}|${sub}`;
      merged.set(key, [rid, (merged.get(key)?.[1] || 0) + 1, sub]);
    });
  return [...merged.values()];
};

const ReasonRow = memo(function ReasonRow({ itemId, rowIndex, row, parentOptions, subOptions, readOnly, onChange }) {
  return (
    <div className={`${REASON_ROW_GRID} items-center`} style={{ height: REASON_ROW_HEIGHT }}>
      <span className="text-[13px]" style={{ color: colorPalette.secondary[500] }}>
        {rowIndex + 1}
      </span>
      <CustomInput
        type="select"
        name={`reason_${itemId}_${rowIndex}`}
        placeholder="Select reason"
        value={row.rid || undefined}
        selectOptions={parentOptions}
        onChange={value => onChange(itemId, rowIndex, 'rid', value)}
        setFieldValue={() => {}}
        disabled={readOnly}
        allowClear
      />
      <CustomInput
        type="select"
        name={`sub_${itemId}_${rowIndex}`}
        placeholder="Sub-reason (optional)"
        value={row.sub || undefined}
        selectOptions={subOptions}
        onChange={value => onChange(itemId, rowIndex, 'sub', value)}
        setFieldValue={() => {}}
        disabled={readOnly || subOptions.length === 0}
        allowClear
      />
    </div>
  );
});

// Mounts only the visible rows, since one item can have hundreds of pieces.
function VirtualReasonRows({ rows, renderRow }) {
  const [scrollTop, setScrollTop] = useState(0);
  const viewportHeight = Math.min(rows.length * REASON_ROW_HEIGHT, REASON_LIST_MAX_HEIGHT);
  const start = Math.max(0, Math.floor(scrollTop / REASON_ROW_HEIGHT) - REASON_LIST_OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / REASON_ROW_HEIGHT) + REASON_LIST_OVERSCAN);

  return (
    <div className="overflow-y-auto" style={{ maxHeight: REASON_LIST_MAX_HEIGHT, scrollbarGutter: 'stable' }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: rows.length * REASON_ROW_HEIGHT }}>
        <div style={{ transform: `translateY(${start * REASON_ROW_HEIGHT}px)` }}>{rows.slice(start, end).map((row, offset) => renderRow(row, start + offset))}</div>
      </div>
    </div>
  );
}

function ReasonStep({ rej, reasons, onSave, onMatch, hasMismatch, onExpiry, hasExpired, isViewOnly, canEdit, readOnly = false }) {
  const parentReasons = useMemo(() => (reasons || []).filter(r => !r.parentReasonId), [reasons]);
  const subReasonsByParent = useMemo(() => {
    const map = {};
    (reasons || [])
      .filter(r => r.parentReasonId)
      .forEach(r => {
        const pid = typeof r.parentReasonId === 'object' ? r.parentReasonId?._id || r.parentReasonId?.id : r.parentReasonId;
        if (!map[pid]) map[pid] = [];
        map[pid].push(r);
      });
    return map;
  }, [reasons]);

  const parentOptions = useMemo(() => parentReasons.map(reason => ({ label: reason.name, value: reason.id })), [parentReasons]);
  const subOptionsByParent = useMemo(
    () => Object.fromEntries(Object.entries(subReasonsByParent).map(([parentId, subs]) => [parentId, subs.map(reason => ({ label: reason.name, value: reason.name }))])),
    [subReasonsByParent]
  );

  const [draft, setDraft] = useState(() => Object.fromEntries(rej.items.map(i => [i.id, expandReasonRows(i)])));
  const [bulk, setBulk] = useState({});

  const setRow = useCallback((itemId, rowIndex, field, value) => {
    setDraft(d => ({
      ...d,
      // A cleared select gives undefined; keep '' so identical rows still merge on save.
      [itemId]: d[itemId].map((row, i) => (i === rowIndex ? { ...row, [field]: value ?? '', ...(field === 'rid' ? { sub: '' } : {}) } : row)),
    }));
  }, []);

  const applyToEmptyRows = itemId => {
    const { rid, sub = '' } = bulk[itemId] || {};
    setDraft(d => ({ ...d, [itemId]: d[itemId].map(row => (row.rid ? row : { rid, sub })) }));
    setBulk(b => ({ ...b, [itemId]: {} }));
  };

  const [saving, setSaving] = useState(false);
  const targets = Object.fromEntries(rej.items.map(i => [i.id, rejQty(i)]));
  const assignedCount = i => (draft[i.id] || []).filter(row => row.rid).length;
  const allOk = rej.items.every(i => assignedCount(i) === targets[i.id]);

  // Rows without a reason are ignored on save.
  const buildItems = () => rej.items.map(i => ({ ...i, reasons: mergeReasonRows(draft[i.id] || []) }));

  const persist = async status => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ items: buildItems(), ...(status ? { status } : {}) });
    } finally {
      setSaving(false);
    }
  };

  // Full save moves the order to Sorted; draft save persists partial reasons without changing status.
  const save = () => persist('SORTED');
  const saveDraft = () => persist();

  return (
    <ActionBlock title="Step 4 · Assign rejection reasons" desc="Assign a reason to each rejected piece. Every piece needs a reason to move to Sorted.">
      {(hasMismatch || hasExpired) && (
        <div className="mb-3 flex gap-2">
          {hasMismatch && <CustomButton type="ghost" size="small" icon={<Icons.FileTextOutlined style={{ fontSize: 14 }} />} text="Matching Report" onClick={onMatch} />}
          {hasExpired && <CustomButton type="ghost" size="small" icon={<Icons.FileTextOutlined style={{ fontSize: 14 }} />} text="Expiry Report" onClick={onExpiry} />}
        </div>
      )}
      <div className="grid gap-3">
        {rej.items.map(i => {
          const target = targets[i.id];
          const tot = assignedCount(i);
          const ok = tot === target;
          const itemBulk = bulk[i.id] || {};
          if (target === 0)
            return (
              <div key={i.id} className="border rounded-[10px] p-3.5 flex items-center gap-2.5" style={{ borderColor: colorPalette.secondary[200], background: colorPalette.primary[50] + '66' }}>
                <Icons.ArrowLeftOutlined style={{ fontSize: 16, color: colorPalette.brand.teal }} />
                <b>{i.series}</b>{' '}
                <span style={{ color: colorPalette.secondary[500] }}>
                  {i.watt ? ` · ${i.watt}` : ''}
                  {i.mfgDate ? ` · Mfg ${formatMfgDate(i.mfgDate)}` : ''}
                </span>
                <span className="ml-auto text-[12.5px] font-bold" style={{ color: i.expired > 0 ? colorPalette.warning[700] : colorPalette.brand.teal }}>
                  {i.expired > 0 ? `Warranty expired${i.expiredMfgDate ? ` (Mfg ${formatMfgDate(i.expiredMfgDate)})` : ''}` : 'Fully returned'}
                </span>
              </div>
            );
          return (
            <div key={i.id} className="border rounded-[10px] p-4" style={{ borderColor: colorPalette.secondary[200] }}>
              {/* Item header */}
              <div className="flex justify-between items-center mb-3.5">
                <b className="text-[14.5px]">
                  {i.series}{' '}
                  <span className="font-medium" style={{ color: colorPalette.secondary[500] }}>
                    {i.watt ? ` · ${i.watt}` : ''}
                    {i.mfgDate ? ` · Mfg ${formatMfgDate(i.mfgDate)}` : ''}
                  </span>
                  {i.expired > 0 && (
                    <span className="ml-2 text-[12.5px] font-medium" style={{ color: colorPalette.warning[700] }}>
                      {i.expired} pc warranty expired{i.expiredMfgDate ? ` (Mfg ${formatMfgDate(i.expiredMfgDate)})` : ''}, not counted
                    </span>
                  )}
                </b>
                <span className="text-[13px] font-bold flex items-center gap-[5px]" style={{ color: ok ? colorPalette.success[700] : colorPalette.warning[700] }}>
                  Assigned {tot}/{target} pc {ok && <Icons.CheckCircleOutlined style={{ fontSize: 13 }} />}
                </span>
              </div>

              {target > 1 && !readOnly && (
                <div className="grid grid-cols-[1.6fr_1.6fr_auto] gap-2.5 items-center mb-3 pb-3 border-b" style={{ borderColor: colorPalette.secondary[100] }}>
                  <CustomInput
                    type="select"
                    name={`bulk_reason_${i.id}`}
                    placeholder="Reason for empty rows"
                    value={itemBulk.rid || undefined}
                    selectOptions={parentOptions}
                    onChange={value => setBulk(b => ({ ...b, [i.id]: { rid: value, sub: '' } }))}
                    setFieldValue={() => {}}
                    allowClear
                  />
                  <CustomInput
                    type="select"
                    name={`bulk_sub_${i.id}`}
                    placeholder="Sub-reason (optional)"
                    value={itemBulk.sub || undefined}
                    selectOptions={subOptionsByParent[itemBulk.rid] || NO_SUB_REASONS}
                    onChange={value => setBulk(b => ({ ...b, [i.id]: { ...b[i.id], sub: value } }))}
                    setFieldValue={() => {}}
                    disabled={!subOptionsByParent[itemBulk.rid]}
                    allowClear
                  />
                  <CustomButton
                    type="outline"
                    icon={<Icons.CheckCircleOutlined style={{ fontSize: 14 }} />}
                    text="Apply to empty rows"
                    disabled={!itemBulk.rid || tot === target}
                    onClick={() => applyToEmptyRows(i.id)}
                  />
                </div>
              )}

              {/* Column headers */}
              <div
                className={`${REASON_ROW_GRID} mb-1 text-[11px] font-semibold uppercase tracking-[0.04em]`}
                style={{ color: colorPalette.secondary[500], overflow: 'hidden', scrollbarGutter: 'stable' }}
              >
                <span>#</span>
                <span>Reason</span>
                <span>Sub-Reason</span>
              </div>

              {/* One row per rejected piece */}
              <VirtualReasonRows
                rows={draft[i.id] || []}
                renderRow={(row, rowIndex) => (
                  <ReasonRow
                    key={rowIndex}
                    itemId={i.id}
                    rowIndex={rowIndex}
                    row={row}
                    parentOptions={parentOptions}
                    subOptions={subOptionsByParent[row.rid] || NO_SUB_REASONS}
                    readOnly={readOnly}
                    onChange={setRow}
                  />
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 flex items-center gap-3 flex-wrap">
        <PermissionButton
          canAccess={canEdit}
          isViewOnly={isViewOnly}
          type="primary"
          icon={<Icons.AppstoreOutlined style={{ fontSize: 16 }} />}
          text="Save Reasons → Sorted"
          loading={saving}
          disabled={!allOk || saving || readOnly}
          tooltipTitle={readOnly ? HISTORY_READONLY_MSG : !allOk ? 'Every rejected piece needs a reason before moving to Sorted.' : undefined}
          onClick={save}
        />
        <PermissionButton
          canAccess={canEdit}
          isViewOnly={isViewOnly}
          type="outline"
          icon={<Icons.SaveOutlined style={{ fontSize: 16 }} />}
          text="Save Progress"
          loading={saving}
          disabled={saving || readOnly}
          tooltipTitle={readOnly ? HISTORY_READONLY_MSG : undefined}
          onClick={saveDraft}
        />
        {!allOk && (
          <span className="text-[12.5px]" style={{ color: colorPalette.warning[700] }}>
            Every rejected piece needs a reason to move to Sorted - use "Save Progress" to save partially.
          </span>
        )}
      </div>
    </ActionBlock>
  );
}

function walkBom(nodes, fn, depth = 0) {
  (nodes || []).forEach(n => {
    fn(n, depth);
    walkBom(n.children, fn, depth + 1);
  });
}

const allocOf = d => (Number(d?.reuse) || 0) + (Number(d?.ret) || 0) + (Number(d?.scrap) || 0);

const recoveryFor = (recovery, node) => recovery?.[node.path] || recovery?.[node.name] || {};

function walkLeaves(nodes, fn) {
  (nodes || []).forEach(n => {
    if ((n.children || []).length) walkLeaves(n.children, fn);
    else fn(n);
  });
}

function flattenBom(nodes, depth = 0, out = []) {
  (nodes || []).forEach(({ children, ...row }) => {
    out.push({ ...row, depth, hasChildren: (children || []).length > 0 });
    flattenBom(children, depth + 1, out);
  });
  return out;
}

/* ── helpers for recovery agg ── */
function calcAgg(items, bomMap, recoveryMap) {
  const agg = { rejection: 0, reuse: 0, ret: 0, scrap: 0, total: 0, net: 0, pct: 0 };
  items.forEach(i => {
    const bom = bomMap[i.itemId];
    if (!bom || bom.loading || !bom.components?.length) return;
    const qty = rejQty(i);
    walkLeaves(bom.components, n => {
      const d = recoveryFor(recoveryMap[i.id], n);
      agg.rejection += n.unitPrice * n.qtyPerUnit * qty;
      agg.reuse += n.unitPrice * (Number(d.reuse) || 0);
      agg.ret += n.unitPrice * (Number(d.ret) || 0);
      agg.scrap += n.unitPrice * (Number(d.scrap) || 0);
    });
  });
  agg.total = agg.reuse + agg.ret + agg.scrap;
  agg.net = agg.rejection - agg.total;
  agg.pct = agg.rejection ? (agg.total / agg.rejection) * 100 : 0;
  return agg;
}

/* ── Step 5: Recovery ── */
const RECOVERY_FIELDS = ['reuse', 'ret', 'scrap'];

const remainingFor = (cell, field, available) => {
  const usedElsewhere = RECOVERY_FIELDS.filter(f => f !== field).reduce((total, f) => total + Number(cell?.[f] || 0), 0);
  const remaining = roundQty(available - usedElsewhere);
  return remaining > 0 ? String(remaining) : '';
};

function RecoveryStep({ rej, bomMap, onSave, isViewOnly, canEdit, readOnly = false }) {
  const { currencySymbol } = useCompanyCurrency();
  const [saving, setSaving] = useState(false);
  // Column whose checkbox is ticked, per item; only one can hold the remaining qty at a time.
  const [checkedField, setCheckedField] = useState({});
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      rej.items.map(i => [
        i.id,
        Object.fromEntries(Object.entries(i.recovery || {}).map(([name, d]) => [name, { reuse: String(d.reuse || ''), ret: String(d.ret || ''), scrap: String(d.scrap || ''), scrapKg: !!d.scrapKg }])),
      ])
    )
  );

  // Typing in the ticked column makes it manual; typing elsewhere keeps the ticked column at the remainder.
  const setCell = (itemId, path, field, value, available) => {
    const ticked = checkedField[itemId];
    if (ticked === field) setCheckedField(c => ({ ...c, [itemId]: null }));
    setDraft(d => {
      const cell = { ...(d[itemId]?.[path] || {}), [field]: value };
      if (ticked && ticked !== field) cell[ticked] = remainingFor(cell, ticked, available);
      return { ...d, [itemId]: { ...d[itemId], [path]: cell } };
    });
  };

  const toggleField = (item, field, checked) => {
    const previous = checkedField[item.id];
    const qty = rejQty(item);
    const leaves = [];
    walkLeaves(bomMap[item.itemId]?.components, n => leaves.push(n));
    setCheckedField(c => ({ ...c, [item.id]: checked ? field : null }));
    setDraft(d => {
      const itemDraft = { ...d[item.id] };
      leaves.forEach(n => {
        const cell = { ...(itemDraft[n.path] || {}) };
        if (previous && previous !== field) cell[previous] = '';
        cell[field] = checked ? remainingFor(cell, field, n.qtyPerUnit * qty) : '';
        itemDraft[n.path] = cell;
      });
      return { ...d, [item.id]: itemDraft };
    });
  };

  const recoveryColumnTitle = (item, field, label) => (
    <CustomInput
      type="checkbox"
      name={`recovery_${field}_${item.id}`}
      value={checkedField[item.id] === field}
      CheckboxName={label}
      checkboxClassName="!ms-0 text-[12px] uppercase"
      onChange={e => toggleField(item, field, e.target.checked)}
      disabled={readOnly}
    />
  );

  const draftNums = Object.fromEntries(
    rej.items.map(i => [
      i.id,
      Object.fromEntries(Object.entries(draft[i.id] || {}).map(([name, v]) => [name, { reuse: Number(v.reuse || 0), ret: Number(v.ret || 0), scrap: Number(v.scrap || 0), scrapKg: !!v.scrapKg }])),
    ])
  );

  const agg = calcAgg(rej.items, bomMap, draftNums);

  const overAlloc = rej.items.some(i => {
    const bom = bomMap[i.itemId];
    if (!bom || bom.loading) return false;
    const qty = rejQty(i);
    let over = false;
    walkLeaves(bom.components, n => {
      if (allocOf(draftNums[i.id]?.[n.path]) > n.qtyPerUnit * qty) over = true;
    });
    return over;
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        items: rej.items.map(i => {
          const byPath = {};
          walkBom(bomMap[i.itemId]?.components || [], n => {
            byPath[n.path] = { name: n.name, itemId: n.itemId };
          });
          const recovery = Object.fromEntries(
            Object.entries(draftNums[i.id] || {}).map(([path, d]) => [path, { ...d, componentItemId: byPath[path]?.itemId || null, componentName: byPath[path]?.name || path }])
          );
          return { ...i, recovery };
        }),
        status: 'DEVOLVED',
      });
    } finally {
      setSaving(false);
    }
  };

  const workItems = rej.items.filter(i => rejQty(i) > 0);

  return (
    <ActionBlock title="Step 5 · Rejection recovery" desc="Route each raw material to Reuse, Return-to-vendor, or Scrap. Sub-assemblies are recovered through their own materials.">
      <RecoverySummary agg={agg} />
      <div className="grid gap-3 mt-3.5">
        {workItems.map(i => {
          const bom = bomMap[i.itemId];
          const qty = rejQty(i);
          // Per-item recovery value: sum only this item's component reuse/return/scrap (not the order-wide agg).
          let itemRecoveryVal = 0;
          let itemCostVal = 0;
          walkLeaves(bom?.components, n => {
            itemRecoveryVal += n.unitPrice * allocOf(draftNums[i.id]?.[n.path]);
            itemCostVal += n.unitPrice * n.qtyPerUnit * qty;
          });
          const itemRecovery = `${currencySymbol}${formatRecoveryAmount(itemRecoveryVal)}`;
          const itemLoss = `${currencySymbol}${formatRecoveryAmount(Math.max(0, itemCostVal - itemRecoveryVal))}`;
          return (
            <div key={i.id} className="border border-gray-200 rounded-[10px] overflow-hidden">
              <div className="flex justify-between items-center px-3.5 py-[11px] bg-gray-50">
                <b className="text-[14.5px]">
                  {i.series}{' '}
                  <span className="text-gray-500 font-medium">
                    {i.watt ? `· ${i.watt}W ` : ''}· {qty} pc
                    {i.mfgDate ? ` · Mfg ${formatMfgDate(i.mfgDate)}` : ''}
                  </span>
                </b>
                <span className="flex items-center gap-3 text-[13px] font-bold">
                  <span style={{ color: colorPalette.brand.teal }}>{itemRecovery} recovered</span>
                  <span style={{ color: colorPalette.error[600] }}>{itemLoss} loss</span>
                </span>
              </div>

              {!i.itemId && <div className="px-3.5 py-3 text-gray-500 text-[13px]">No item linked - recovery not available.</div>}

              {i.itemId && (!bom || bom.loading) && (
                <div className="p-5 flex justify-center">
                  <Spin size="small" />
                </div>
              )}

              {i.itemId && bom && !bom.loading && (
                <CustomTable
                  columns={[
                    {
                      title: 'Component',
                      key: 'name',
                      width: 170,
                      render: c => (
                        <span style={{ paddingLeft: c.depth * 18 }} className={c.hasChildren ? 'font-semibold text-[14.5px]' : ''}>
                          {c.name}
                        </span>
                      ),
                    },
                    { title: 'Qty/unit per piece', key: 'qtyPerUnit', width: 150, render: c => (c.hasChildren ? '' : c.qtyPerUnit) },
                    { title: 'Total Available', key: 'totalAvailable', width: 130, render: c => (c.hasChildren ? '' : c.qtyPerUnit * qty) },
                    {
                      title: `Unit (${currencySymbol})`,
                      key: 'unitPrice',
                      width: 75,
                      render: c => (c.hasChildren ? '' : `${currencySymbol}${Number(c.unitPrice).toLocaleString('en-IN')}`),
                    },
                    {
                      title: recoveryColumnTitle(i, 'reuse', 'Reuse (pc)'),
                      key: 'reuse',
                      width: 135,
                      render: c =>
                        c.hasChildren ? null : <RecInput v={draft[i.id]?.[c.path]?.reuse || ''} onChange={x => setCell(i.id, c.path, 'reuse', x, c.qtyPerUnit * qty)} disabled={readOnly} />,
                    },
                    {
                      title: recoveryColumnTitle(i, 'ret', 'Return (pc)'),
                      key: 'ret',
                      width: 135,
                      render: c => (c.hasChildren ? null : <RecInput v={draft[i.id]?.[c.path]?.ret || ''} onChange={x => setCell(i.id, c.path, 'ret', x, c.qtyPerUnit * qty)} disabled={readOnly} />),
                    },
                    {
                      title: recoveryColumnTitle(i, 'scrap', 'Scrap (pc)'),
                      key: 'scrap',
                      width: 135,
                      render: c =>
                        c.hasChildren ? null : <RecInput v={draft[i.id]?.[c.path]?.scrap || ''} onChange={x => setCell(i.id, c.path, 'scrap', x, c.qtyPerUnit * qty)} disabled={readOnly} />,
                    },
                    {
                      title: 'Scrap → kg',
                      key: 'scrapKg',
                      width: 110,
                      render: c =>
                        c.hasChildren ? null : (
                          <CustomButton
                            size="small"
                            type="outline"
                            className="whitespace-nowrap !w-20"
                            icon={<Icons.NumberOutlined style={{ fontSize: 12 }} />}
                            text={draft[i.id]?.[c.path]?.scrapKg ? 'kg ✓' : 'to kg'}
                            disabled={readOnly}
                          />
                        ),
                    },
                    {
                      title: 'Loss',
                      key: 'loss',
                      width: 90,
                      render: c => {
                        if (c.hasChildren) return null;
                        const loss = c.qtyPerUnit * qty - allocOf(draftNums[i.id]?.[c.path]);
                        return <span className={`font-bold ${loss < 0 ? 'text-red-600' : 'text-gray-500'}`}>{loss} pc</span>;
                      },
                    },
                    {
                      title: `Recovery (${currencySymbol})`,
                      key: 'recovery',
                      width: 130,
                      render: c => {
                        if (c.hasChildren) return null;
                        const used = allocOf(draftNums[i.id]?.[c.path]);
                        return <span className="font-bold text-teal-600">{`${currencySymbol}${formatRecoveryAmount(c.unitPrice * used)}`}</span>;
                      },
                    },
                  ]}
                  data={flattenBom(bom.components).map(c => ({ ...c, key: c.path }))}
                  pagination={false}
                  dynamicScrollY={false}
                  scroll={{ x: 1300, y: 360 }}
                  rowClassName={c => {
                    if (c.hasChildren) return 'bg-gray-50';
                    return allocOf(draftNums[i.id]?.[c.path]) > c.qtyPerUnit * qty ? 'bg-red-50' : '';
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 flex items-center gap-3">
        <PermissionButton
          canAccess={canEdit}
          isViewOnly={isViewOnly}
          type="primary"
          icon={<Icons.SyncOutlined style={{ fontSize: 16 }} />}
          text="Save Recovery → Devolved"
          loading={saving}
          disabled={overAlloc || saving || readOnly}
          tooltipTitle={readOnly ? HISTORY_READONLY_MSG : overAlloc ? "Reuse + Return + Scrap can't exceed available qty per component." : undefined}
          onClick={save}
        />
        {overAlloc && (
          <span className="text-[12.5px]" style={{ color: colorPalette.error[600] }}>
            Reuse + Return + Scrap can't exceed available qty per component.
          </span>
        )}
      </div>
    </ActionBlock>
  );
}

/* ── Devolved view ── */
function DevolvedView({ rej, bomMap }) {
  const { currencySymbol } = useCompanyCurrency();
  const recoveryMap = Object.fromEntries(rej.items.map(i => [i.id, i.recovery || {}]));
  const agg = calcAgg(rej.items, bomMap, recoveryMap);
  const workItems = rej.items.filter(i => rejQty(i) > 0);

  return (
    <ActionBlock title="Devolved - recovery closed" desc="Components routed to reuse, vendor return and scrap.">
      <RecoverySummary agg={agg} />
      <div className="grid gap-3 mt-3.5">
        {workItems.map(i => {
          const bom = bomMap[i.itemId];
          const qty = rejQty(i);
          return (
            <div key={i.id} className="border border-gray-200 rounded-[10px] overflow-hidden">
              <div className="flex justify-between px-3.5 py-[11px] bg-gray-50">
                <b className="text-[14.5px]">
                  {i.series}{' '}
                  <span className="text-gray-500 font-medium">
                    {i.watt ? `· ${i.watt}W ` : ''}· {qty} pc
                    {i.mfgDate ? ` · Mfg ${formatMfgDate(i.mfgDate)}` : ''}
                  </span>
                </b>
              </div>

              {i.itemId && (!bom || bom.loading) && (
                <div className="p-5 flex justify-center">
                  <Spin size="small" />
                </div>
              )}

              {(!i.itemId || (bom && !bom.loading)) && (
                <CustomTable
                  columns={[
                    {
                      title: 'Component',
                      key: 'name',
                      render: c => (
                        <span style={{ paddingLeft: c.depth * 18 }} className={c.hasChildren ? 'font-semibold text-[14.5px]' : ''}>
                          {c.name}
                        </span>
                      ),
                    },
                    { title: 'Qty/unit per piece', key: 'qtyPerUnit', width: 90, render: c => (c.hasChildren ? '' : c.qtyPerUnit) },
                    {
                      title: `Unit (${currencySymbol})`,
                      key: 'unitPrice',
                      width: 90,
                      render: c => (c.hasChildren ? '' : `${currencySymbol}${Number(c.unitPrice).toLocaleString('en-IN')}`),
                    },
                    { title: 'Reuse', key: 'reuse', render: c => (c.hasChildren ? '' : `${recoveryFor(i.recovery, c).reuse || 0} pc`), width: 90 },
                    { title: 'Return', key: 'ret', render: c => (c.hasChildren ? '' : `${recoveryFor(i.recovery, c).ret || 0} pc`), width: 90 },
                    { title: 'Scrap', key: 'scrap', render: c => (c.hasChildren ? '' : `${recoveryFor(i.recovery, c).scrap || 0} pc`), width: 90 },
                    {
                      title: 'Loss',
                      key: 'loss',
                      width: 90,
                      render: c => {
                        if (c.hasChildren) return null;
                        const loss = c.qtyPerUnit * qty - allocOf(recoveryFor(i.recovery, c));
                        return <span className={`font-bold ${loss < 0 ? 'text-red-600' : 'text-gray-500'}`}>{loss} pc</span>;
                      },
                    },
                    {
                      title: `Recovery (${currencySymbol})`,
                      key: 'recovery',
                      render: c => {
                        if (c.hasChildren) return null;
                        const rval = c.unitPrice * allocOf(recoveryFor(i.recovery, c));
                        return <span className="font-bold text-teal-600">{`${currencySymbol}${formatRecoveryAmount(rval)}`}</span>;
                      },
                      width: 90,
                    },
                  ]}
                  data={flattenBom(bom?.components).map(c => ({ ...c, key: c.path }))}
                  rowClassName={c => (c.hasChildren ? 'bg-gray-50' : '')}
                  pagination={false}
                  dynamicScrollY={false}
                />
              )}
            </div>
          );
        })}
      </div>
    </ActionBlock>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE ROOT
══════════════════════════════════════════════════════════ */
export default function RejectionOrderDetail() {
  const { rejectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { rejectionOrder, loading, submitLoading, getRejectionOrderById, saveRejectionWorkflow, getRejectionRecoveryBom } = useRejectionOrder();
  const { rejectionReasons, getRejectionReasons } = useRejectionReason();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const { useModuleRejectionOrders, isViewOnly } = useModulePermissions(RESOURCES.REJECTION_ORDERS);
  const canEdit = !!useModuleRejectionOrders?.edit;

  const rej = useMemo(() => toViewModel(rejectionOrder), [rejectionOrder]);

  const [bomMap, setBomMap] = useState({});

  const [matchOpen, setMatchOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [recv, setRecv] = useState({});
  const [warrantyDraft, setWarrantyDraft] = useState({});
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);

  const handleBatchClick = async (itemBatchId, item) => {
    setBatchDrawerOpen(true);
    await getItemInventoryBatchById({ itemId: item._id, batchId: itemBatchId });
  };

  const handleBatchDrawerClose = () => {
    setBatchDrawerOpen(false);
    resetItemInventoryBatch();
  };

  const [viewStepIdx, setViewStepIdx] = useState(null);
  useEffect(() => {
    setViewStepIdx(null);
  }, [rej?.status]);

  useEffect(() => {
    const controller = new AbortController();
    getRejectionOrderById({ rejectionOrderId: rejectionId, signal: controller.signal });
    getRejectionReasons({ pagination: false, isActive: true });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rejectionId]);

  useEffect(() => {
    if (rej?.status === 'RECEIVED') {
      setRecv(Object.fromEntries(rej.items.map(i => [i.id, i.received ?? ''])));
      setWarrantyDraft(Object.fromEntries(rej.items.map(i => [i.id, { qty: i.expired ?? '', mfgDate: i.expiredMfgDate || i.mfgDate || null }])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rej?._id, rej?.status]);

  useEffect(() => {
    if (!rej?._id || (rej.status !== 'SORTED' && rej.status !== 'DEVOLVED')) return;
    const controller = new AbortController();
    (async () => {
      // One bulk call: backend resolves every item of this rejection order into its BOM/price recovery rows.
      const resp = await getRejectionRecoveryBom({ rejectionOrderId: rej._id, signal: controller.signal });
      const rows = resp?.payload?.data;
      if (!Array.isArray(rows)) return;
      // Seed every linked item so any omitted by the response resolves to an empty table instead of an infinite spinner.
      const map = {};
      rej.items.forEach(it => {
        if (it.itemId) map[it.itemId] = { loading: false, isBomBased: false, components: [] };
      });

      const normalizeComponents = (nodes, parentPath = '') =>
        (nodes || []).map(c => {
          const compId = (typeof c.itemId === 'object' ? c.itemId?._id : c.itemId)?.toString();
          const path = c.path || (parentPath ? `${parentPath}/${compId}` : compId);
          return {
            itemId: compId,
            path,
            name: c.name || 'Component',
            qtyPerUnit: c.qtyPerUnit || 1,
            unitPrice: c.unitPrice || 0,
            children: normalizeComponents(c.children, path),
          };
        });

      rows.forEach(row => {
        const itemId = (typeof row.itemId === 'object' ? row.itemId?._id : row.itemId)?.toString();
        if (!itemId) return;
        map[itemId] = {
          loading: false,
          isBomBased: !!row.isBomBased,
          components: normalizeComponents(row.components),
        };
      });
      setBomMap(map);
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rej?._id, rej?.status]);

  const applyPatch = async patch => {
    const { status, items, convertType } = patch;
    const data = {};
    if (items) data.items = toApiItems(items);
    if (convertType !== undefined) data.convertType = convertType;
    if (status) data.status = status;
    const result = await saveRejectionWorkflow({ rejectionOrderId: rej._id, data });
    if (result?.meta?.requestStatus === 'rejected') return;
    getRejectionOrderById({ rejectionOrderId: rej._id });
  };

  if (loading && !rej) {
    return <RejectionDetailSkeleton />;
  }

  if (!rej && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.REJECTION_ORDER} />;
  }

  const stepIdx = FLOW.indexOf(rej.status);
  const activeStepIdx = viewStepIdx === null ? stepIdx : viewStepIdx;
  const viewStatus = FLOW[activeStepIdx];
  const isHistory = activeStepIdx !== stepIdx;
  const hasMismatch = rej.items.some(i => (i.received || 0) !== i.booked && rej.status !== 'PENDING' && rej.status !== 'RECEIVED');
  const anyReturned = rej.items.some(i => (i.returned || 0) > 0);
  const anyExpired = rej.items.some(i => (i.expired || 0) > 0);

  const markReceived = () => applyPatch({ status: 'RECEIVED' });
  // Field-level check for Step 2; limit is the entered received qty (0 is a real value, not "use booked").
  const getWarrantyError = i => {
    const raw = warrantyDraft[i.id]?.qty;
    if (raw === '' || raw === undefined || raw === null) return '';
    const qty = Number(raw);
    if (!Number.isFinite(qty) || qty < 0) return 'Enter a valid qty (0 or more).';
    if (!Number.isInteger(qty)) return 'Qty must be a whole number.';
    const limit = Math.max(0, Number(recv[i.id] || 0) - (i.returned || 0));
    if (qty > limit) return `Cannot exceed the received qty (${limit}).`;
    return '';
  };

  const countError = (() => {
    if (rej.items.some(i => recv[i.id] === '' || recv[i.id] === undefined)) return 'Enter received qty for every item before saving.';
    if (rej.items.some(i => getWarrantyError(i))) return 'Warranty expired qty cannot exceed the received qty.';
    if (rej.items.some(i => Number(warrantyDraft[i.id]?.qty || 0) > 0 && !warrantyDraft[i.id]?.mfgDate)) return 'Enter the manufacturing date for warranty expired pieces.';
    return null;
  })();
  const saveCount = () =>
    applyPatch({
      items: rej.items.map(i => {
        const { qty, mfgDate } = warrantyDraft[i.id] || {};
        const expired = qty === '' || qty === undefined ? null : Number(qty);
        return { ...i, received: Number(recv[i.id] || 0), expired, expiredMfgDate: expired > 0 ? dayjs(mfgDate).format('YYYY-MM-DD') : null };
      }),
      status: 'REJECTION_COUNTED',
    });
  const doConvert = async type => {
    setConvertOpen(false);

    // Build prefill from raw rejectionOrder items (itemId is a populated doc from backend)
    const prefillItems = (rejectionOrder?.items || [])
      .map(i => {
        const qty = (i.receivedQty || i.bookedQty || 0) - (i.returnedQty || 0) - (i.warrantyExpiredQty || 0);
        const price = i.itemId?.salesInformation?.sellingPrice || 0;
        return {
          itemId: i.itemId?._id || i.itemId?.id || i.itemId,
          quantity: String(qty),
          rate: String(price),
          itemUnit: i.itemId?.itemUnit || '',
        };
      })
      .filter(i => i.itemId && Number(i.quantity) > 0);

    const prefillData = {
      customerId: rejectionOrder?.customerId,
      divisionId: rejectionOrder?.divisionId?._id || rejectionOrder?.divisionId,
      branchId: rejectionOrder?.branchId?._id || rejectionOrder?.branchId,
      warehouseId: rejectionOrder?.warehouseId?._id || rejectionOrder?.warehouseId,
      items: prefillItems.length ? prefillItems : undefined,
      type: 'GOODS_REJECTION',
      rejectionOrderDetails: {
        rejectionOrderRef: rejectionOrder?._id,
        rejectionOrderId: rejectionOrder?.rejectionOrderId,
      },
    };

    if (type === 'PC2PC') {
      navigate(`/${ADMIN_ROUTE_PATHS.salesOrders.new}`, {
        state: {
          salesOrderData: prefillData,
          fromRejection: true,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigate(`/${ADMIN_ROUTE_PATHS.creditNotes.new}`, {
        state: {
          creditNoteData: prefillData,
          fromRejection: true,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    }
  };
  const doReturn = async map => {
    await applyPatch({ items: rej.items.map(i => ({ ...i, returned: Number(map[i.id] || 0) })) });
    setReturnOpen(false);
  };

  return (
    <>
      {/* fixed page header */}
      <div className="fixed-header fixed top-14 ml-[1px] -mt-[16px] bg-white py-2 border-b z-10">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-semibold text-gray-900">{rej.no}</h1>
              <RejBadge s={rej.status} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Always shown; disabled outside Pending. Permission/view-only tooltips come from PermissionButton. */}
            <PermissionButton
              canAccess={canEdit}
              isViewOnly={isViewOnly}
              disabled={!canEditRejectionOrder(rej.status)}
              tooltipTitle={canEdit && !isViewOnly && !canEditRejectionOrder(rej.status) ? getRejectionEditBlockedMessage(rej.status) : undefined}
              tooltipProps={{ placement: 'bottom' }}
              type="default"
              icon={<Icons.EditOutlined />}
              className="px-4 py-2"
              onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.edit(rej._id)}`)}
            >
              Edit
            </PermissionButton>
            {rej.convertType && <StatusBadge accentHex={colorPalette.primary[500]} value={rej.convertType === 'PC2PC' ? 'PC-to-PC Return' : 'Credit Note'} />}
            {rej.convertReference?._id && (
              <button
                type="button"
                onClick={() => navigate(`/${getConvertReferenceTarget(rej.convertReference).buildDetailPath(rej.convertReference._id)}`)}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Icons.FileTextOutlined style={{ fontSize: 13 }} />
                {getConvertReferenceTarget(rej.convertReference).label}: {rej.convertReference.no}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* pt-16 clears the fixed header (positioned at top-14 / 56px); inner div keeps horizontal padding only. */}
      <div className="bg-white pt-16 -m-4">
        <div className="px-4">
          {/* info + stepper card */}
          <Card className="mb-3.5">
            <div className="text-gray-600 text-[13.5px]">
              <b className="text-gray-800">{rej.customer}</b> · <Icons.EnvironmentOutlined style={{ fontSize: 12, verticalAlign: -1 }} /> {rej.city}, {rej.state}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-gray-500 text-[12.5px] mt-1">
              <span>
                <span className="text-gray-400">Division:</span> {rej.project}
              </span>
              <span>
                <span className="text-gray-400">Branch:</span> {rej.branch}
              </span>
              <span>
                <span className="text-gray-400">Warehouse:</span> {rej.warehouse}
              </span>
              {rej.transportName && (
                <span>
                  <span className="text-gray-400">Transport Name:</span> {rej.transportName}
                </span>
              )}
              {rej.transport && (
                <span>
                  <span className="text-gray-400">LR / Transport No.:</span> {rej.transport}
                </span>
              )}
              {rej.transportationDate && (
                <span>
                  <span className="text-gray-400">Transportation Date:</span> {new Date(rej.transportationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
              {rej.arrivalDate && (
                <span>
                  <span className="text-gray-400">Arrival Date:</span> {new Date(rej.arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            {rej.note && (
              <div className="text-gray-500 text-[12.5px] mt-0.5">
                <span className="text-gray-400">Note:</span> {rej.note}
              </div>
            )}

            {/* stepper */}
            <div className="flex mt-[18px]">
              {FLOW.map((s, i) => {
                const st = STATUS[s];
                const done = i <= stepIdx;
                const clickable = i <= stepIdx;
                const isActive = i === activeStepIdx;
                return (
                  <div key={s} className="flex-1 flex items-center">
                    <div
                      className={`flex flex-col items-center gap-[5px] flex-none ${clickable ? 'cursor-pointer' : ''}`}
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={() => clickable && setViewStepIdx(i)}
                      onKeyDown={e => {
                        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setViewStepIdx(i);
                        }
                      }}
                    >
                      <div
                        className="w-[27px] h-[27px] rounded-[20px] grid place-items-center text-xs font-extrabold"
                        style={{
                          background: done ? (st?.color ?? colorPalette.secondary[300]) : colorPalette.secondary[100],
                          color: done ? '#ffffff' : colorPalette.secondary[500],
                          outline: isActive ? `2px solid ${colorPalette.primary[500]}` : 'none',
                          outlineOffset: 2,
                        }}
                      >
                        {done ? <Icons.CheckCircleOutlined style={{ fontSize: 15 }} /> : i + 1}
                      </div>
                      <span className="text-[10.5px] font-bold whitespace-nowrap" style={{ color: done ? (st?.color ?? colorPalette.secondary[300]) : colorPalette.secondary[500] }}>
                        {st?.label ?? s}
                      </span>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div className="flex-1 h-[3px] mx-1 mb-[18px] rounded-[3px]" style={{ background: i < stepIdx ? (st?.color ?? colorPalette.secondary[300]) : colorPalette.secondary[100] }} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* attachments */}
          {rej.attachments?.length > 0 && (
            <Card className="mb-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <Icons.LinkOutlined style={{ fontSize: 14, color: colorPalette.secondary[500] }} />
                <span className="font-semibold text-[13.5px] text-gray-700">LR Slip / Attachments</span>
              </div>
              <AttachMentDetails data={rej} />
            </Card>
          )}

          {/* returned summary */}
          {orderReturned(rej) > 0 && (
            <Card style={{ marginBottom: 14, borderLeft: `3px solid ${colorPalette.brand.teal}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icons.ArrowLeftOutlined style={{ fontSize: 16, color: colorPalette.brand.teal }} />
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>Returned to customer</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: colorPalette.brand.teal }}>{orderReturned(rej)} pc</span>
              </div>
              <CustomTable
                columns={[
                  { title: 'Item', key: 'item', render: (_, i) => <span style={{ fontWeight: 600 }}>{i.series}</span> },
                  { title: 'Watt', dataIndex: 'watt', key: 'watt' },
                  { title: 'Received', key: 'received', render: (_, i) => i.received || i.booked },
                  { title: 'Returned', key: 'returned', render: (_, i) => <span className="font-bold text-teal-600">{i.returned}</span> },
                  { title: 'To Reject', key: 'toReject', render: (_, i) => <span className="font-bold">{rejQty(i)}</span> },
                ]}
                data={rej.items.filter(i => (i.returned || 0) > 0).map(i => ({ ...i, key: i.id }))}
                pagination={false}
                dynamicScrollY={true}
              />
            </Card>
          )}

          {/* read-only history banner */}
          {isHistory && (
            <div className="mb-3.5 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
              <Icons.EyeOutlined style={{ fontSize: 14 }} />
              <span>
                Viewing <b>{STATUS[viewStatus]?.label ?? viewStatus}</b> stage - read only.
              </span>
              <button type="button" className="ml-auto font-semibold underline" onClick={() => setViewStepIdx(null)}>
                Back to current step
              </button>
            </div>
          )}

          {/* step content */}
          {viewStatus === 'PENDING' && (
            <ActionBlock title="Step 1 · Awaiting goods" desc="Booking created. Once rejected goods arrive, mark them as received.">
              <CustomTable
                className="mb-4"
                columns={[
                  { title: 'Item', key: 'item', render: (_, i) => <b>{i.series}</b> },
                  { title: 'Watt', dataIndex: 'watt', key: 'watt' },
                  { title: 'Booked Qty', dataIndex: 'booked', key: 'booked' },
                  { title: 'Mfg Date', key: 'mfgDate', render: (_, i) => formatMfgDate(i.mfgDate) },
                ]}
                data={rej.items.map(i => ({ ...i, key: i.id }))}
                pagination={false}
                dynamicScrollY={true}
              />
              <PermissionButton
                canAccess={canEdit}
                isViewOnly={isViewOnly}
                type="primary"
                icon={<Icons.TruckOutlined style={{ fontSize: 16 }} />}
                text="Mark Goods Received"
                loading={submitLoading}
                disabled={submitLoading || isHistory}
                tooltipTitle={isHistory ? HISTORY_READONLY_MSG : undefined}
                onClick={markReceived}
              />
            </ActionBlock>
          )}

          {viewStatus === 'RECEIVED' && (
            <ActionBlock title="Step 2 · Count received quantity" desc="Enter the actual received qty against each item.">
              <CustomTable
                className="mb-4"
                columns={[
                  { title: 'Item', key: 'item', render: (_, i) => <b>{i.series}</b>, width: 280 },
                  { title: 'Watt', dataIndex: 'watt', key: 'watt', width: 80 },
                  { title: 'Booked', dataIndex: 'booked', key: 'booked', width: 80 },
                  {
                    title: 'Received (actual)',
                    key: 'receivedActual',
                    width: 150,
                    render: (_, i) => {
                      const val = isHistory ? (i.received ?? '') : recv[i.id];
                      return (
                        <CustomInput
                          type="number"
                          name={`recv_${i.id}`}
                          placeholder="0"
                          value={val}
                          onChange={e => setRecv(s => ({ ...s, [i.id]: e.target.value }))}
                          setFieldValue={() => {}}
                          disabled={isHistory}
                        />
                      );
                    },
                  },
                  {
                    title: 'Match',
                    key: 'match',
                    width: 110,
                    render: (_, i) => {
                      const val = isHistory ? i.received : recv[i.id];
                      const r = Number(val || 0);
                      const ok = r === i.booked && r > 0;
                      return val === '' || val === undefined ? <span style={{ color: colorPalette.secondary[500] }}>-</span> : ok ? <MatchTag ok /> : <MatchTag />;
                    },
                  },
                  {
                    title: 'Warranty Expired Qty',
                    key: 'warrantyExpiredQty',
                    width: 170,
                    render: (_, i) => (
                      <CustomInput
                        type="number"
                        name={`expired_${i.id}`}
                        placeholder="0"
                        value={isHistory ? (i.expired ?? '') : (warrantyDraft[i.id]?.qty ?? '')}
                        onChange={e => setWarrantyDraft(d => ({ ...d, [i.id]: { ...d[i.id], qty: e.target.value } }))}
                        setFieldValue={() => {}}
                        disabled={isHistory}
                        errorMessage={isHistory ? '' : getWarrantyError(i)}
                        touched={!isHistory}
                      />
                    ),
                  },
                  {
                    title: 'Mfg Date',
                    key: 'expiredMfgDate',
                    width: 160,
                    render: (_, i) => {
                      const saved = isHistory ? i.expiredMfgDate || i.mfgDate : warrantyDraft[i.id]?.mfgDate;
                      return (
                        <CustomInput
                          type="date"
                          name={`expired_mfg_${i.id}`}
                          value={saved ? dayjs(saved) : null}
                          onChange={date => setWarrantyDraft(d => ({ ...d, [i.id]: { ...d[i.id], mfgDate: date } }))}
                          setFieldValue={() => {}}
                          format="DD/MM/YYYY"
                          disabledDate={d => d.isAfter(dayjs(), 'day')}
                          disabled={isHistory || !(Number(warrantyDraft[i.id]?.qty) > 0)}
                        />
                      );
                    },
                  },
                ]}
                data={rej.items.map(i => ({ ...i, key: i.id }))}
                pagination={false}
                dynamicScrollY={true}
              />
              <PermissionButton
                canAccess={canEdit}
                isViewOnly={isViewOnly}
                type="primary"
                icon={<Icons.FileSearchOutlined style={{ fontSize: 16 }} />}
                text="Save Count → Rejection Counted"
                loading={submitLoading}
                disabled={submitLoading || isHistory || Boolean(countError)}
                tooltipTitle={isHistory ? HISTORY_READONLY_MSG : countError || undefined}
                onClick={saveCount}
              />
            </ActionBlock>
          )}

          {viewStatus === 'REJECTION_COUNTED' && (
            <ActionBlock title="Step 3 · Settle with customer" desc="Settle via PC-to-PC or credit note. Optionally return good-condition pieces first.">
              <CustomTable
                className="mb-4"
                columns={[
                  { title: 'Item', key: 'item', render: (_, i) => <b>{i.series}</b>, width: 320 },
                  { title: 'Watt', dataIndex: 'watt', key: 'watt', width: 90 },
                  { title: 'Mfg Date', key: 'mfgDate', render: (_, i) => formatMfgDate(i.mfgDate), width: 110 },
                  { title: 'Booked', dataIndex: 'booked', key: 'booked', width: 90 },
                  { title: 'Received', dataIndex: 'received', key: 'received', width: 90 },
                  ...(anyReturned
                    ? [
                        {
                          title: 'Returned',
                          key: 'returned',
                          render: (_, i) => <span className={`${(i.returned || 0) > 0 ? 'text-teal-600 font-bold' : 'text-gray-500 font-normal'}`}>{i.returned || 0}</span>,
                          width: 90,
                        },
                      ]
                    : []),
                  ...(anyExpired
                    ? [
                        {
                          title: 'Warranty Expired',
                          key: 'warrantyExpired',
                          render: (_, i) => (
                            <span className="font-bold" style={{ color: i.expired > 0 ? colorPalette.warning[700] : colorPalette.secondary[500] }}>
                              {i.expired || 0}
                              {i.expired > 0 && i.expiredMfgDate ? ` (Mfg ${formatMfgDate(i.expiredMfgDate)})` : ''}
                            </span>
                          ),
                          width: 190,
                        },
                      ]
                    : []),
                  { title: 'To Reject', key: 'toReject', render: (_, i) => <span className="font-bold">{rejQty(i)}</span>, width: 90 },
                  { title: 'Match', key: 'match', render: (_, i) => ((i.received || 0) === i.booked ? <MatchTag ok /> : <MatchTag />), width: 90 },
                ]}
                data={rej.items.map(i => ({ ...i, key: i.id }))}
                pagination={false}
                dynamicScrollY={true}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <PermissionButton
                  canAccess={canEdit}
                  isViewOnly={isViewOnly}
                  type="ghost"
                  icon={<Icons.ArrowLeftOutlined style={{ fontSize: 15 }} />}
                  text="Return Product"
                  onClick={() => setReturnOpen(true)}
                  disabled
                />
                {hasMismatch && <CustomButton type="ghost" icon={<Icons.FileTextOutlined style={{ fontSize: 15 }} />} text="Matching Report" onClick={() => setMatchOpen(true)} />}
                {anyExpired && <CustomButton type="ghost" icon={<Icons.FileTextOutlined style={{ fontSize: 15 }} />} text="Expiry Report" onClick={() => setExpiryOpen(true)} />}
                <PermissionButton
                  canAccess={canEdit}
                  isViewOnly={isViewOnly}
                  type="primary"
                  icon={<Icons.AccountBookOutlined style={{ fontSize: 15 }} />}
                  text="Convert / Settle"
                  disabled={isHistory}
                  tooltipTitle={isHistory ? HISTORY_READONLY_MSG : undefined}
                  onClick={() => setConvertOpen(true)}
                />
              </div>
            </ActionBlock>
          )}

          {viewStatus === 'SETTLED' && (
            <ReasonStep
              rej={rej}
              reasons={rejectionReasons}
              onSave={applyPatch}
              onMatch={() => setMatchOpen(true)}
              hasMismatch={hasMismatch}
              onExpiry={() => setExpiryOpen(true)}
              hasExpired={anyExpired}
              isViewOnly={isViewOnly}
              canEdit={canEdit}
              readOnly={isHistory}
            />
          )}
          {viewStatus === 'SORTED' && <RecoveryStep rej={rej} bomMap={bomMap} onSave={applyPatch} isViewOnly={isViewOnly} canEdit={canEdit} readOnly={isHistory} />}
          {viewStatus === 'DEVOLVED' && <DevolvedView rej={rej} bomMap={bomMap} />}

          {/* modals */}
          {matchOpen && <MatchReport rej={rej} onClose={() => setMatchOpen(false)} />}
          {expiryOpen && <ExpiryReport rej={rej} onClose={() => setExpiryOpen(false)} />}
          {returnOpen && <ReturnModal rej={rej} onClose={() => setReturnOpen(false)} onSubmit={doReturn} />}
          <CustomModal modalOpen={convertOpen} setModalOpen={setConvertOpen} title="Convert / Settle rejection">
            <p className="text-gray-600 text-[13.5px] mb-3.5">
              Select how customer impact will be settled. Status moves to <b>Settled</b>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: Icons.UndoOutlined, title: 'PC-to-PC Return + Sales Order', desc: 'Replace rejected pieces with fresh stock and raise a new sales order.', type: 'PC2PC' },
                { icon: Icons.TagOutlined, title: 'Credit Note', desc: 'Issue a credit note for the rejected value.', type: 'Credit Note' },
              ].map(c => (
                <button
                  key={c.type}
                  onClick={() => doConvert(c.type)}
                  className="text-left cursor-pointer rounded-[10px] p-4 transition-colors"
                  style={{ background: '#ffffff', border: `1.5px solid ${colorPalette.secondary[200]}` }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = colorPalette.primary[500])}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = colorPalette.secondary[200])}
                >
                  <div className="w-9 h-9 rounded-[9px] grid place-items-center mb-2.5" style={{ background: colorPalette.primary[50], color: colorPalette.primary[500] }}>
                    <c.icon style={{ fontSize: 18 }} />
                  </div>
                  <div className="font-bold text-[14px]">{c.title}</div>
                  <div className="text-[12.5px] mt-1" style={{ color: colorPalette.secondary[600] }}>
                    {c.desc}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-3.5">
              <CustomButton type="default" text="Cancel" onClick={() => setConvertOpen(false)} />
            </div>
          </CustomModal>
        </div>
      </div>
      {rejectionId && <StockMovementPanel url={API_ROUTES.REJECTION.ORDERS.STOCK_MOVEMENT(rejectionId)} onBatchClick={handleBatchClick} />}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
}
