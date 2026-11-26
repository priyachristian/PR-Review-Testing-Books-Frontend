export const getPaymentReceivedDocumentDetails = payment =>
  payment
    ? {
        paymentReceivedId: payment.paymentReceivedId,
        customerName: payment.customerName,
        customerDisplayName: payment?.customerId?.customerDisplayName || payment.customerDisplayName || payment.customerName,
        paymentDate: payment.paymentDate,
        paymentMode: payment.paymentMode,
        amountReceived: payment.amountReceived,
        status: payment.status,
        reference: payment.reference,
        notes: payment.notes,
      }
    : null;
