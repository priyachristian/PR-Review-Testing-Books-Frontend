import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const INVOICE_DUPLICATE_OMIT_KEYS = [
  'id',
  '_id',
  'invoiceId',
  'status',
  'createdAt',
  'updatedAt',
  'quoteId',
  'quoteNo',
  'salesOrders',
  'deliveryChallanId',
  'deliveryChallanIds',
  'deliveryChallanNo',
  'eInvoice',
  'eWayBill',
  'invoiceDispatchId',
  'openingBalanceApplications',
  'invoiceDate',
  'dueDate',
  'attachments',
];

export const getInvoiceDocumentDetails = invoice =>
  invoice
    ? {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerDisplayName: invoice?.customerId?.customerDisplayName || invoice.customerDisplayName || invoice.customerName,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        total: invoice.total,
        balanceAmount: invoice.balanceAmount,
        status: invoice.status,
      }
    : null;

/** Strip identity / conversion / compliance fields so a duplicate opens as a fresh create. */
export const stripInvoiceForDuplicate = invoice => {
  if (!invoice) return invoice;
  const cloneable = { ...invoice };
  INVOICE_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const invoiceTransformer = (values, invoiceData, invoiceId, invoicePDF, isSplitWise, discountConfig) => {
  const finalSalesOrders = [];
  const finalDeliveryChallans = [];
  invoiceData?.salesOrders?.forEach(x => {
    finalSalesOrders.push({
      salesOrderId: x?.salesOrderId,
      salesOrderNo: x?.salesOrderNo,
    });
  });

  invoiceData?.deliveryChallanIds?.forEach(x => {
    finalDeliveryChallans.push({
      deliveryChallanId: x?.deliveryChallanId,
      challanId: x?.challanId,
    });
  });

  const getBaseValues = baseTransformer(values, isSplitWise, discountConfig);
  return {
    ...getBaseValues,
    customerId: values.customerId,
    ...(invoiceData?.quoteId && { quoteId: invoiceData?.quoteId?._id || invoiceData?.quoteId }),
    ...((invoiceData?.quoteId || invoiceData?.quoteNo) && {
      quoteNo: invoiceData?.quoteId?.quoteId || invoiceData?.quoteNo,
    }),
    ...(invoiceData?.salesOrders && { salesOrders: finalSalesOrders }),
    ...(invoiceData?.deliveryChallanId && {
      deliveryChallanId: invoiceData?.deliveryChallanId?._id || invoiceData?.deliveryChallanId,
    }),
    ...((invoiceData?.deliveryChallanId || invoiceData?.deliveryChallanNo) && {
      deliveryChallanNo: invoiceData?.deliveryChallanId?.challanId || invoiceData?.deliveryChallanNo,
    }),
    ...(invoiceData?.deliveryChallanIds && { deliveryChallanIds: finalDeliveryChallans }),
    ...(!invoiceId && { invoiceId: values.invoiceId }),
    referenceNumber: values.referenceNumber,
    invoiceDate: toApiDate(values.invoiceDate),
    dueDate: toApiDate(values.dueDate),
    paymentTermsId: values.paymentTermsId,
    subject: values.subject,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments: invoicePDF,
    priceListId: values?.priceList || null,
    ...(!values?.id && isSplitWise && getBaseValues?.split && { isSplit: isSplitWise && getBaseValues?.split ? true : false }),
    ...(values?.isSplit && { isSplit: values?.isSplit }),
    ...(values?.status && { status: values?.status }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    addressId: values?.addressId || null,
    isInventoryEnabled: values?.isInventoryEnabled ?? false,
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
