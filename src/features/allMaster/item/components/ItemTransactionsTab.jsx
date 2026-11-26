import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import { Checkbox, Empty, Pagination, Select, Spin } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { DETAIL_LABEL_CLASS, DETAIL_VALUE_CLASS } from '@/components/ui/common/DetailField';
import { useItemMaster } from '@/features/allMaster/item';
import { formatAmount } from '@/utils/currency';
import {
  BILL_STATUS,
  CREDIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS,
  DELIVERY_CHALLAN_STATUS,
  GRPO_STATUS,
  INVOICE_STATUS,
  MODULE_NAMES,
  MODULE_TYPE,
  pageTypes,
  PURCHASE_ORDER_STATUS,
  QUOTE_STATUS,
  SALES_ORDER_STATUS,
} from '@/utils/constants';
import { DEFAULT_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from '@/utils/pagination';

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'Quote', label: 'Quotes' },
  { value: 'SalesOrder', label: 'Sales Orders' },
  { value: 'Invoice', label: 'Invoices' },
  { value: 'DeliveryChallan', label: 'Delivery Challans' },
  { value: 'CreditNote', label: 'Credit Notes' },
  { value: 'PurchaseOrder', label: 'Purchase Orders' },
  { value: 'GrpoOrder', label: 'GRPOs' },
  { value: 'Bill', label: 'Bills' },
  { value: 'DebitNote', label: 'Debit Notes' },
];

const TRANSACTION_TYPE_STATUS_LABELS = {
  Quote: QUOTE_STATUS,
  SalesOrder: SALES_ORDER_STATUS,
  Invoice: INVOICE_STATUS,
  DeliveryChallan: DELIVERY_CHALLAN_STATUS,
  CreditNote: CREDIT_NOTE_STATUS,
  PurchaseOrder: PURCHASE_ORDER_STATUS,
  GrpoOrder: GRPO_STATUS,
  Bill: BILL_STATUS,
  DebitNote: DEBIT_NOTE_STATUS,
};

const getTransactionStatusLabel = (type, status) => {
  if (!status || status === 'All') return status;
  return TRANSACTION_TYPE_STATUS_LABELS[type]?.[status] || status;
};

const PURCHASE_TRANSACTION_TYPES = new Set(['PurchaseOrder', 'GrpoOrder', 'Bill', 'DebitNote']);
const CREDIT_NOTE_TYPES = new Set(['CreditNote', 'DebitNote']);

const getQuantityLabel = type => {
  if (PURCHASE_TRANSACTION_TYPES.has(type)) return 'Quantity Purchased';
  if (CREDIT_NOTE_TYPES.has(type)) return 'Quantity';
  return 'Quantity Sold';
};

const PAGE_TYPE_TO_TRANSACTION_TYPE = {
  [pageTypes.QUOTE]: 'Quote',
  [pageTypes.SALES_ORDER]: 'SalesOrder',
  [pageTypes.INVOICE]: 'Invoice',
  [pageTypes.DELIVERY_CHALLAN]: 'DeliveryChallan',
  [pageTypes.CREDIT_NOTE]: 'CreditNote',
  [pageTypes.PURCHASE_ORDER]: 'PurchaseOrder',
  [pageTypes.GRPO]: 'GrpoOrder',
  [pageTypes.BILLS]: 'Bill',
  [pageTypes.DEBIT_NOTE]: 'DebitNote',
};

const MODULE_NAME_TO_TRANSACTION_TYPE = {
  [MODULE_NAMES.QUOTATION]: 'Quote',
  [MODULE_NAMES.SALES_ORDER]: 'SalesOrder',
  [MODULE_NAMES.INVOICE]: 'Invoice',
  [MODULE_NAMES.DELIVERY_CHALLAN]: 'DeliveryChallan',
  [MODULE_NAMES.CREDIT_NOTE]: 'CreditNote',
  [MODULE_NAMES.SPLIT_INVOICE]: 'Invoice',
  [MODULE_NAMES.SPLIT_CREDIT_NOTE]: 'CreditNote',
  [MODULE_NAMES.PURCHASE_ORDER]: 'PurchaseOrder',
  [MODULE_NAMES.GRPO]: 'GrpoOrder',
  [MODULE_NAMES.BILL]: 'Bill',
  [MODULE_NAMES.DEBIT_NOTE]: 'DebitNote',
  [MODULE_NAMES.SPLIT_BILL]: 'Bill',
  [MODULE_NAMES.SPLIT_DEBIT_NOTE]: 'DebitNote',
};

export const resolveDefaultTransactionType = ({ pageType, page, moduleType, defaultType } = {}) => {
  if (defaultType) return defaultType;
  if (pageType && PAGE_TYPE_TO_TRANSACTION_TYPE[pageType]) return PAGE_TYPE_TO_TRANSACTION_TYPE[pageType];
  if (page && MODULE_NAME_TO_TRANSACTION_TYPE[page]) return MODULE_NAME_TO_TRANSACTION_TYPE[page];
  if (moduleType === MODULE_TYPE.PURCHASE) return 'PurchaseOrder';
  return 'Quote';
};

const formatTxnDate = date => {
  if (!date || !dayjs(date).isValid()) return '-';
  return dayjs(date).format('MMMM D, YYYY');
};

const formatQty = qty => {
  const n = Number(qty);
  if (Number.isNaN(n)) return '-';
  return n.toFixed(4);
};

const ItemTransactionsTab = ({ itemId, customerId, customerName, vendorId, vendorName, defaultType, pageType, page, moduleType }) => {
  const { getItemTransactions, resetItemTransactions, itemTransactions, itemTransactionsLoading, itemTransactionsPagination, itemTransactionStatuses } = useItemMaster();

  const initialType = resolveDefaultTransactionType({ pageType, page, moduleType, defaultType });
  const hasCustomerContext = Boolean(customerId);
  const hasVendorContext = Boolean(vendorId);
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState('All');
  const [filterByParty, setFilterByParty] = useState(hasCustomerContext || hasVendorContext);
  const [pageNum, setPageNum] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const isPurchaseType = PURCHASE_TRANSACTION_TYPES.has(type);
  // Party filter follows source context: customer only on sales types, vendor only on purchase types.
  const partyFilterApplies = isPurchaseType ? hasVendorContext : hasCustomerContext;
  const activePartyId = partyFilterApplies ? (isPurchaseType ? vendorId : customerId) : null;
  const activePartyName = partyFilterApplies ? (isPurchaseType ? vendorName || 'selected vendor' : customerName || 'selected customer') : null;
  const showPartyFilter = Boolean(activePartyId);

  useEffect(() => {
    setType(initialType);
    setStatus('All');
    setFilterByParty(hasCustomerContext || hasVendorContext);
    setPageNum(1);
  }, [itemId, customerId, vendorId, initialType, hasCustomerContext, hasVendorContext]);

  const statusOptions = useMemo(() => {
    const list = Array.isArray(itemTransactionStatuses) && itemTransactionStatuses.length ? itemTransactionStatuses : ['All'];
    return list.map(s => ({
      value: s,
      label: s === 'All' ? 'Status: All' : getTransactionStatusLabel(type, s),
    }));
  }, [itemTransactionStatuses, type]);

  const fetchTransactions = useCallback(() => {
    if (!itemId) return undefined;
    const controller = new AbortController();
    const payload = {
      itemId,
      type,
      status: status === 'All' ? '' : status,
      page: pageNum,
      limit,
      signal: controller.signal,
    };

    if (filterByParty && partyFilterApplies && activePartyId) {
      if (isPurchaseType) payload.vendorId = activePartyId;
      else payload.customerId = activePartyId;
    }

    getItemTransactions(payload);
    return controller;
  }, [itemId, type, status, filterByParty, partyFilterApplies, activePartyId, isPurchaseType, pageNum, limit, getItemTransactions]);

  useEffect(() => {
    const controller = fetchTransactions();
    return () => {
      controller?.abort();
    };
  }, [fetchTransactions]);

  useEffect(() => {
    return () => {
      resetItemTransactions();
    };
  }, [resetItemTransactions]);

  const handleTypeChange = value => {
    setType(value);
    setStatus('All');
    setPageNum(1);
  };

  const handleStatusChange = value => {
    setStatus(value || 'All');
    setPageNum(1);
  };

  const handlePartyFilterChange = e => {
    setFilterByParty(e.target.checked);
    setPageNum(1);
  };

  const handlePaginationChange = (nextPage, nextPageSize) => {
    if (nextPageSize && nextPageSize !== limit) {
      setLimit(nextPageSize);
      setPageNum(1);
      return;
    }
    setPageNum(nextPage);
  };

  const currentPage = itemTransactionsPagination?.page || pageNum;
  const pageSize = itemTransactionsPagination?.limit || limit;
  const totalResults = itemTransactionsPagination?.totalResults || 0;
  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);
  const partyLabel = isPurchaseType ? 'vendor' : 'customer';
  const quantityLabel = getQuantityLabel(type);

  return (
    <div className="my-container container-spacing space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={type} onChange={handleTypeChange} options={TRANSACTION_TYPE_OPTIONS} className="min-w-[180px]" popupMatchSelectWidth={false} />
        <Select value={status} onChange={handleStatusChange} options={statusOptions} className="min-w-[160px]" popupMatchSelectWidth={false} />
      </div>

      {showPartyFilter ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <Checkbox checked={filterByParty} onChange={handlePartyFilterChange}>
            <span className="text-[13px] text-[#1e293b]">
              Show only <span className="font-semibold">{activePartyName}</span>&apos;s transactions
              <span className="text-[#64748b]"> ({partyLabel})</span>
            </span>
          </Checkbox>
        </div>
      ) : null}

      <div className="rounded-md border border-gray-200 bg-white min-h-[180px] overflow-hidden">
        {itemTransactionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin />
          </div>
        ) : itemTransactions?.length ? (
          <ul className="divide-y divide-gray-100">
            {itemTransactions.map(row => (
              <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-slate-50/80">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={`${DETAIL_VALUE_CLASS} font-semibold truncate`}>{row.customerName || '-'}</p>
                  <p className="text-[12px] text-[#64748b] truncate">
                    <span>{row.refNo || '-'}</span>
                    <span className="mx-1.5 text-gray-300">|</span>
                    <span>{formatTxnDate(row.date)}</span>
                  </p>
                  <div className="pt-0.5">
                    <StatusBadge status={row.status} value={getTransactionStatusLabel(type, row.status)} />
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-2 min-w-[120px]">
                  <div>
                    <span className={DETAIL_LABEL_CLASS}>Item Price</span>
                    <p className={`${DETAIL_VALUE_CLASS} tabular-nums`}>
                      {formatAmount(row.rate, Boolean(row.currencySymbol), {
                        symbol: row.currencySymbol || '',
                      })}
                    </p>
                  </div>
                  <div>
                    <span className={DETAIL_LABEL_CLASS}>{quantityLabel}</span>
                    <p className={`${DETAIL_VALUE_CLASS} tabular-nums`}>{formatQty(row.quantity)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12">
            <Empty description="No transactions found" />
          </div>
        )}

        {totalResults > 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-3 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-1">
              <span className="font-semibold text-gray-900">{rangeStart}</span>
              <span>-</span>
              <span className="font-semibold text-gray-900">{rangeEnd}</span>
              <span>of</span>
              <span className="font-semibold text-gray-900">{totalResults}</span>
              <span>entries</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="flex items-center pagination-select gap-2 text-sm text-gray-600">
                <span>Show</span>
                <Select value={pageSize} className="py-0.5 min-w-[64px]" onChange={value => handlePaginationChange(1, Number(value))}>
                  {TABLE_PAGE_SIZE_OPTIONS.map(n => (
                    <Select.Option key={n} value={n}>
                      {n}
                    </Select.Option>
                  ))}
                </Select>
                <span>per page</span>
              </div>

              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalResults}
                showSizeChanger={false}
                onChange={handlePaginationChange}
                className="custom-pagination"
                size="default"
                itemRender={(pageItem, itemType, originalElement) => {
                  if (itemType === 'prev') {
                    return (
                      <button type="button" className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                        <span className="text-[#1E3A56] font-normal text-[22px] -mt-[3px] mr-2">‹</span>
                        <span className="text-[#1E3A56] font-normal text-[14px]">Back</span>
                      </button>
                    );
                  }
                  if (itemType === 'next') {
                    return (
                      <button type="button" className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                        <span className="text-[#1E3A56] font-normal text-[14px]">Next</span>
                        <span className="text-[#1E3A56] font-normal text-[22px] -mt-[3px] ml-2">›</span>
                      </button>
                    );
                  }
                  if (itemType === 'page') {
                    const isActive = pageItem === currentPage;
                    return (
                      <button
                        type="button"
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
                        {pageItem}
                      </button>
                    );
                  }
                  return originalElement;
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ItemTransactionsTab;
