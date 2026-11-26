import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const DELIVERY_CHALLAN_DUPLICATE_OMIT_KEYS = ['id', '_id', 'challanId', 'status', 'createdAt', 'updatedAt', 'salesOrders', 'convertedTo', 'challanDate', 'attachments'];

export const getDeliveryChallanDocumentDetails = challan =>
  challan
    ? {
        challanId: challan.challanId,
        challanNumber: challan.challanNumber,
        customerName: challan.customerName,
        customerDisplayName: challan?.customerId?.customerDisplayName || challan.customerDisplayName || challan.customerName,
        challanDate: challan.challanDate,
        total: challan.total,
        status: challan.status,
      }
    : null;

/** Strip identity / conversion fields so a duplicate opens as a fresh create. */
export const stripDeliveryChallanForDuplicate = deliveryChallan => {
  if (!deliveryChallan) return deliveryChallan;
  const cloneable = { ...deliveryChallan };
  DELIVERY_CHALLAN_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const deliveryChallanTransformer = (values, deliveryChallanData, deliveryId, deliveryPDF, discountConfig) => {
  const finalSalesOrders = [];

  deliveryChallanData?.salesOrders?.forEach(x => {
    finalSalesOrders.push({
      salesOrderId: x?.salesOrderId,
      salesOrderNo: x?.salesOrderNo,
    });
  });
  return {
    ...baseTransformer(values, false, discountConfig),
    customerId: values.customerId,
    ...(deliveryChallanData?.salesOrders && { salesOrders: finalSalesOrders }),
    ...(!deliveryId && { challanId: values.challanId }),
    reference: values.reference,
    challanDate: toApiDate(values.challanDate),
    challanType: values.challanType,
    adjustment: {
      description: values.description,
      amount: values.amount,
    },
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments: deliveryPDF,
    discount: values?.discount,
    paymentTermsId: values.paymentTermsId,
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
    isStockTransfer: Boolean(values?.isStockTransfer),
    stockTransfer: values?.isStockTransfer ? { fromDivisionId: values.fromDivisionId, fromBranchId: values.fromBranchId, fromWarehouseId: values.fromWarehouseId } : null,
  };
};
