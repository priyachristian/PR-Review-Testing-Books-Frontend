import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const SALES_ORDER_DUPLICATE_OMIT_KEYS = [
  'id',
  '_id',
  'orderId',
  'status',
  'createdAt',
  'updatedAt',
  'quoteId',
  'quoteNo',
  'customerOrderId',
  'customerOrderNo',
  'rejectionOrderDetails',
  'hasPendingProduction',
  'orderDate',
  'expectedShipmentDate',
  'attachments',
];

export const getSalesOrderDocumentDetails = order =>
  order
    ? {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerDisplayName: order?.customerId?.customerDisplayName || order.customerDisplayName || order.customerName,
        orderDate: order.orderDate,
        expectedShipmentDate: order.expectedShipmentDate,
        total: order.total,
        status: order.status,
      }
    : null;

/** Strip identity / conversion fields so a duplicate opens as a fresh create. */
export const stripSalesOrderForDuplicate = salesOrder => {
  if (!salesOrder) return salesOrder;
  const cloneable = { ...salesOrder };
  SALES_ORDER_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const salesOrderTransformer = (values, salesId, salesOrderData, salesPDF, discountConfig) => {
  return {
    ...baseTransformer(values, false, discountConfig),
    customerId: values.customerId,
    ...(salesOrderData?.quoteId && {
      quoteId: salesOrderData?.quoteId?._id || salesOrderData?.quoteId,
    }),
    ...((salesOrderData?.quoteId || salesOrderData?.quoteNo) && {
      quoteNo: salesOrderData?.quoteId?.quoteId || salesOrderData?.quoteNo,
    }),
    ...(salesOrderData?.customerOrderId && {
      customerOrderId: salesOrderData?.customerOrderId?._id || salesOrderData?.customerOrderId,
    }),
    ...(salesOrderData?.customerOrderNo && {
      customerOrderNo: salesOrderData?.customerOrderNo,
    }),
    ...(!salesId && salesOrderData?.rejectionOrderDetails && { rejectionOrderDetails: salesOrderData.rejectionOrderDetails }),
    ...(!salesId && { orderId: values.orderId }),
    reference: values.reference,
    orderDate: toApiDate(values.orderDate),
    expectedShipmentDate: toApiDate(values.expectedShipmentDate),
    deliveryMethod: values.deliveryMethod,
    ...(values?.tagId && { tagId: values.tagId }),
    paymentTermsId: values.paymentTermsId,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments: salesPDF,
    priceListId: values?.priceList || null,
    ...(values?.status && { status: values?.status }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    addressId: values?.addressId || null,
    exchangeRate: values.exchangeRate,
  };
};
