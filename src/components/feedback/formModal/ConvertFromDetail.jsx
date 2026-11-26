// Components
import { Collapse } from '@/components/AntDComponent';
import { CustomTable } from '@/components/dataDisplay';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { CUSTOMER_ORDER_STATUS, DELIVERY_CHALLAN_STATUS, GRPO_STATUS, PURCHASE_ORDER_STATUS, QUOTE_STATUS, SALES_ORDER_STATUS } from 'utils/constants';
import { convertFromColumn, rejectionConvertFromColumn } from 'utils/tableColumns';

const TableView = ({ columns, data, currency }) => {
  const rows = (Array.isArray(data) ? data : [data]).filter(Boolean);
  return <CustomTable columns={columns} data={rows.map(row => ({ ...row, currency }))} className="my-2" />;
};

const ConvertFromDetail = ({ convertFromData, type, from = '', open, onClose, data = null }) => {
  const currency = data?.currency;
  const items = [];

  if (type === 'QUOTE') {
    items.push({
      key: 'Quote',
      label: 'Quote',
      children: <TableView data={[convertFromData]} columns={convertFromColumn('quoteDate', QUOTE_STATUS, 'Quote', 'quoteId', 'QUOTE')} currency={currency} />,
    });
  } else if (type === 'DELIVERY_CHALLAN') {
    items.push({
      key: 'SalesOrder',
      label: 'SalesOrder',
      children: <TableView data={convertFromData} columns={convertFromColumn('orderDate', SALES_ORDER_STATUS, 'Sales Order', 'salesOrderNo', 'SalesOrder')} currency={currency} />,
    });
  } else if (type === 'INVOICE') {
    let label = from === 'QUOTE' ? 'Quote' : from === 'SALES_ORDER' ? 'SalesOrder' : 'DeliveryChallan';
    let columns =
      from === 'QUOTE'
        ? convertFromColumn('quoteDate', QUOTE_STATUS, 'Quote', 'quoteId', 'QUOTE')
        : from === 'SALES_ORDER'
          ? convertFromColumn('orderDate', SALES_ORDER_STATUS, 'Sales Order', 'salesOrderNo', 'SalesOrder')
          : convertFromColumn('challanDate', DELIVERY_CHALLAN_STATUS, 'Delivery Challan', 'challanId', 'DeliveryChallan');

    items.push({
      key: label,
      label: label,
      children: <TableView data={Array.isArray(convertFromData) ? convertFromData : [convertFromData]} columns={columns} currency={currency} />,
    });
  } else if (type === 'REJECTION_ORDER') {
    items.push({
      key: 'RejectionOrder',
      label: 'Rejection Order',
      children: (
        <TableView
          data={Array.isArray(convertFromData) ? convertFromData : [{ ...convertFromData, customerDisplayName: data?.customerId?.customerDisplayName }]}
          columns={rejectionConvertFromColumn()}
          currency={currency}
        />
      ),
    });
  } else if (type === 'GRPO') {
    items.push({
      key: 'PurchaseOrder',
      label: 'PurchaseOrder',
      children: <TableView data={convertFromData} columns={convertFromColumn('date', PURCHASE_ORDER_STATUS, 'Purchase Order', 'purchaseOrderNo', 'PurchaseOrder')} currency={currency} />,
    });
  } else if (type === 'CUSTOMER_ORDER') {
    items.push({
      key: 'CustomerOrder',
      label: 'Customer Order',
      children: <TableView data={[convertFromData]} columns={convertFromColumn('createdAt', CUSTOMER_ORDER_STATUS, 'Customer Order', 'customerOrderId', 'CustomerOrder')} currency={currency} />,
    });
  } else if (type === 'BILL') {
    let label = from === 'GRPO' ? 'GRPO' : 'PurchaseOrder';
    let columns =
      from === 'GRPO' ? convertFromColumn('date', GRPO_STATUS, 'GRPO', 'grpoOrderId', 'GRPO') : convertFromColumn('date', PURCHASE_ORDER_STATUS, 'Purchase Order', 'purchaseOrderNo', 'PurchaseOrder');

    items.push({
      key: label,
      label: label,
      children: <TableView data={label === 'GRPO' && !Array.isArray(convertFromData) ? [convertFromData] : convertFromData} columns={columns} currency={currency} />,
    });
  }

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={next => {
        if (!next) onClose();
      }}
      title="Convert From Detail"
      width={900}
    >
      <div>
        <Collapse expandIconPosition={'end'} items={items} />
      </div>
    </CustomModal>
  );
};

export default ConvertFromDetail;
