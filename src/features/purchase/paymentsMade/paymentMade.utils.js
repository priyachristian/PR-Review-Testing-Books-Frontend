export const getPaymentMadeDocumentDetails = payment =>
  payment
    ? {
        paymentMadeId: payment.paymentMadeId,
        vendorName: payment.vendorId?.customerName || payment.customerName,
        vendorDisplayName: payment.vendorId?.customerDisplayName || payment.vendorId?.customerName || payment?.customerId?.customerDisplayName || payment.customerDisplayName || payment.customerName,
        paymentDate: payment.paymentDate,
        paymentMode: payment.paymentMode,
        paymentMade: payment.paymentMade,
        status: payment.status,
        reference: payment.reference,
      }
    : null;
