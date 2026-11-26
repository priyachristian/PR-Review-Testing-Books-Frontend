import React from 'react';
import { Link } from 'react-router-dom';
import Icons from '@/assets/icons/icon';
import { EyeOutlined, MessageOutlined, InboxOutlined } from '@ant-design/icons';

const formatDate = isoString => {
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const REFERENCE_TYPE_CONFIG = {
  SalesOrder: { path: id => `/sales-orders/${id}`, label: 'sales order' },
  Invoice: { path: id => `/invoices/${id}`, label: 'invoice' },
  RecurringInvoice: { path: id => `/recurring-invoices/${id}`, label: 'recurring invoice' },
  RecurringBill: { path: id => `/recurring-bills/${id}`, label: 'recurring bill' },
  Quote: { path: id => `/quotes/${id}`, label: 'quote' },
  DeliveryChallan: { path: id => `/delivery-challans/${id}`, label: 'delivery challan' },
  PurchaseOrder: { path: id => `/purchase-orders/${id}`, label: 'purchase order' },
  Grpo: { path: id => `/grpo/${id}`, label: 'grpo' },
  BILL: { path: id => `/bills/${id}`, label: 'bill' },
  Bill: { path: id => `/bills/${id}`, label: 'bill' },
  CustomerOrder: { path: id => `/customer-orders/${id}`, label: 'customer order' },
  DebitNote: { path: id => `/debit-notes/${id}`, label: 'debit note' },
  CreditNote: { path: id => `/credit-notes/${id}`, label: 'credit note' },
  PaymentReceived: { path: id => `/payments-received/${id}`, label: 'payment received' },
  PaymentMade: { path: id => `/payments-made/${id}`, label: 'payment made' },
  Expense: { path: id => `/expenses/${id}`, label: 'expense' },
  Customer: { path: id => `/customer-master/${id}`, label: 'customer' },
  Vendor: { path: id => `/vendors/${id}`, label: 'vendor' },
};

const getReferenceLink = (type, id) => {
  if (!type || !id) return '#';
  return REFERENCE_TYPE_CONFIG[type]?.path(id) ?? `/${type.toLowerCase()}/${id}`;
};

const getReferenceLabel = type => REFERENCE_TYPE_CONFIG[type]?.label ?? type?.toLowerCase();

const HistoryTimeline = ({ data }) => (
  <div className="pl-2.5">
    <div className={`border-[#e0e7ef] pl-5 ${data?.length > 0 ? 'border-l-2' : 'border-l-0'}`}>
      {data && data.length > 0 ? (
        data
          .slice()
          .reverse()
          .map(item => (
            <div key={item?._id} className="mb-6 relative">
              <div className="absolute -left-8 top-0 w-6 h-6 bg-[#f5f6fa] rounded-full flex items-center justify-center border border-[#e0e7ef]">
                <span role="img" aria-label="comment">
                  <MessageOutlined />
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <b>{[item?.addedBy?.firstName, item?.addedBy?.lastName].filter(Boolean).join(' ') || 'System'}</b> • {formatDate(item?.createdAt)}
              </div>
              <div className="bg-[#f5f6fa] rounded-lg p-3 mt-1 text-sm">
                {item?.message}
                {item?.referenceType && item?.referenceId && !item?.isDeleted && (
                  <div className="mt-2">
                    <Link to={getReferenceLink(item.referenceType, item.referenceId)} className="text-[--orange] no-underline font-medium inline-flex items-center">
                      <EyeOutlined className="mr-1" /> View the {getReferenceLabel(item.referenceType)}
                    </Link>
                  </div>
                )}
                {item?.isDeleted && (
                  <div className="mt-2 text-red-500">
                    <Icons.DeleteOutlined className="mr-1" />
                    {getReferenceLabel(item.referenceType)} Deleted
                  </div>
                )}
                {!item?.isDeleted && item?.isCancelled && (
                  <div className="mt-2 text-amber-500">
                    <Icons.StopOutlined className="mr-1" />
                    {getReferenceLabel(item.referenceType)} Cancelled
                  </div>
                )}
              </div>
            </div>
          ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <InboxOutlined className="text-4xl text-gray-300 mb-2" />
          <div className="text-lg font-semibold text-gray-500 mb-1">No history found</div>
          <div className="text-sm text-gray-400">There are no comments or actions for this document yet.</div>
        </div>
      )}
    </div>
  </div>
);

const HistoryCommon = ({ data, embedded = false }) => {
  if (embedded) {
    return <HistoryTimeline data={data} />;
  }

  return (
    <div className="my-container p-4 mx-auto">
      <h4 className="mb-5 flex items-center gap-2 text-lg font-semibold border-b-2 border-[#f5f6fa] pb-3">
        All Comments
        <span className="bg-[#e0e7ef] rounded-full px-2 py-0.5 text-sm ml-2">{data?.length || 0}</span>
      </h4>
      <HistoryTimeline data={data} />
    </div>
  );
};

export default HistoryCommon;
