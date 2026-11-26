import { useLocation, useNavigate } from 'react-router-dom';
import { calculateDueDate } from 'utils/services';

export const normalizeEntityId = value => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  return value?.id ?? value?._id ?? '';
};

export const resolveConversionLocationNames = (entity, lookups = {}) => {
  const { divDrop = [], branchDrop = [], warehouseDrop = [] } = lookups;
  const divisionId = normalizeEntityId(entity?.divisionId);
  const branchId = normalizeEntityId(entity?.branchId);
  const warehouseId = normalizeEntityId(entity?.warehouseId);
  const findName = (list, id) => list.find(entry => entry?.id === id || entry?._id === id)?.name || '';

  return {
    divisionName: entity?.divisionName || entity?.divisionId?.name || findName(divDrop, divisionId),
    branchName: entity?.branchName || entity?.branchId?.name || findName(branchDrop, branchId),
    warehouseName: entity?.warehouseName || entity?.warehouseId?.name || findName(warehouseDrop, warehouseId),
  };
};

export const resolveConversionVendor = (entity, selectedVendorId, vendorDropDown = []) => {
  const vendorId = normalizeEntityId(entity?.vendor) || selectedVendorId || null;
  const vendorFromDrop = vendorDropDown.find(v => v._id === vendorId || v.id === vendorId);
  const vendorObject = typeof entity?.vendor === 'object' && entity?.vendor != null && !Array.isArray(entity.vendor) ? entity.vendor : {};

  return {
    ...vendorObject,
    id: vendorId,
    customerDisplayName: vendorObject.customerDisplayName || vendorFromDrop?.customerDisplayName || entity?.customerDisplayName || entity?.customerName || '',
    address: vendorObject.address || vendorFromDrop?.address,
    gstinUin: vendorObject.gstinUin || vendorObject.otherDetails?.gstinUin || vendorFromDrop?.otherDetails?.gstinUin,
    isVendorDirectTax: vendorObject.isVendorDirectTax || vendorFromDrop?.isVendorDirectTax,
  };
};

export const resolveConversionCustomer = (entity, selectedCustomerId, customerDropDown = []) => {
  const selectedId = Array.isArray(selectedCustomerId) ? selectedCustomerId[0] : selectedCustomerId;
  const customerId = normalizeEntityId(entity?.customerId) || selectedId || null;
  const customerFromDrop = customerDropDown.find(c => c._id === customerId || c.id === customerId);
  const customerObject = typeof entity?.customerId === 'object' && entity?.customerId != null && !Array.isArray(entity.customerId) ? entity.customerId : {};

  return {
    ...customerObject,
    id: customerId,
    customerDisplayName: customerObject.customerDisplayName || entity?.customerDisplayName || customerFromDrop?.customerDisplayName || '',
    address: customerObject.address || customerFromDrop?.address,
    gstinUin: customerObject.gstinUin || customerObject.otherDetails?.gstinUin || customerFromDrop?.otherDetails?.gstinUin,
    isCustomerDirectTax: customerObject.isCustomerDirectTax || customerFromDrop?.isCustomerDirectTax,
  };
};

const baseConvertToData = (data, isSplitWise) => {
  let itemArr = [...(data?.items || [])];
  if (isSplitWise) {
    itemArr = itemArr?.map(x => {
      const clone = { ...x };
      clone.splitQty = 0;
      clone.finalQty = clone?.quantity;

      return clone;
    });
  }
  return {
    items: itemArr,
    subTotal: data?.subTotal,
    cgst: data.cgst,
    sgst: data.sgst,
    igst: data.igst,
    totalTax: data.totalTax,
    total: data.total,
    divisionId: data?.divisionId ? data?.divisionId : null,
    branchId: data?.branchId ? data?.branchId : null,
    warehouseId: data?.warehouseId ? data?.warehouseId : null,
    additionalCharges: data?.additionalCharges,
    ...(data?.appliesTo && { appliesTo: data?.appliesTo }),
    ...(data?.appliesTo === 'TRANSACTION' && {
      discountConfig: data?.discountConfig,
    }),
    addressId: data?.addressId || null,
    customer: data?.customer || null,
    isRoundOff: data.isRoundOff || false,
    roundOffAmount: data.roundOffAmount || 0,
    currency: data?.currency || null,
  };
};

export const useConvert = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleConvertQuote = (data, type) => {
    const payload = {
      ...baseConvertToData(data),
      customerId: data?.customerId,
      reference: data?.reference,
      customerNotes: data?.customerNotes,
      attachments: data?.attachments,
      quoteNo: data?.quoteId,
      quoteId: data?.id || data?._id || '',
      subject: data?.subject,
      additionalCharges: data?.additionalCharges,
      divisionId: data?.divisionId ? data?.divisionId : null,
      branchId: data?.branchId ? data?.branchId : null,
      warehouseId: data?.warehouseId ? data?.warehouseId : null,
      divisionName: data?.divisionName,
      branchName: data?.branchName,
      warehouseName: data?.warehouseName,
      paymentTermsId: data?.paymentTermsId,
    };

    if (type === 'salesOrder') {
      navigate('/sales-orders/new', {
        state: {
          salesOrderData: payload,
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigate('/invoices/new', {
        state: {
          invoiceData: {
            ...payload,
            ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
          },
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    }
  };

  const handleConvertSalesOrder = (data, type) => {
    const customer = resolveConversionCustomer(data, normalizeEntityId(data?.customerId));
    const payload = {
      ...baseConvertToData(data),
      customerId: customer,
      reference: data?.reference,
      paymentTermsId: data?.paymentTermsId,
      customerNotes: data?.customerNotes,
      attachments: data?.attachments,
      // salesOrderNo: data?.orderId ? data?.orderId : "",
      // salesOrderId: data?.id || data?._id || "",
      salesOrders: data?.salesOrders || [
        {
          salesOrderId: data?.id || data?._id,
          salesOrderNo: data?.orderId,
        },
      ],
      divisionName: data?.divisionName,
      branchName: data?.branchName,
      warehouseName: data?.warehouseName,
    };

    if (type === 'deliveryChallan') {
      navigate('/delivery-challans/new', {
        state: {
          deliveryChallanData: payload,
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigate('/invoices/new', {
        state: {
          invoiceData: {
            ...payload,
            ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
          },
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    }
  };

  const handleConvertDeliveryChallan = (data, isSplitWise) => {
    const customer = resolveConversionCustomer(data, normalizeEntityId(data?.customerId));
    const payload = {
      ...baseConvertToData(data, isSplitWise),
      customerId: customer,
      reference: data?.reference,
      paymentTermsId: data?.paymentTermsId,
      customerNotes: data?.customerNotes,
      attachments: data?.attachments,
      isSplitWise,
      divisionName: data?.divisionName,
      branchName: data?.branchName,
      warehouseName: data?.warehouseName,
    };

    // A stock transfer challan is invoiced from its From location; its stock already moved, so the invoice deducts none.
    if (data?.isStockTransfer && data?.stockTransfer) {
      const { fromDivisionId, fromBranchId, fromWarehouseId, fromDivisionName, fromBranchName, fromWarehouseName } = data.stockTransfer;
      Object.assign(payload, {
        divisionId: fromDivisionId,
        branchId: fromBranchId,
        warehouseId: fromWarehouseId,
        divisionName: fromDivisionName,
        branchName: fromBranchName,
        warehouseName: fromWarehouseName,
      });
    }

    if (data?.deliveryChallanIds?.length > 0) {
      payload.deliveryChallanIds = data?.deliveryChallanIds;
    }

    if (data?.challanId && data?._id && !payload.deliveryChallanIds) {
      payload.deliveryChallanIds = [{ deliveryChallanId: data?._id, challanId: data?.challanId }];
    }

    navigate('/invoices/new', {
      state: {
        invoiceData: {
          ...payload,
          ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
        },
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleConvertPurchaseOrder = (data, type) => {
    const payload = {
      ...baseConvertToData(data),
      vendor: resolveConversionVendor(data, normalizeEntityId(data?.vendor)),
      divisionName: data?.divisionName,
      branchName: data?.branchName,
      warehouseName: data?.warehouseName,
      // purchaseOrderId: data?.id || data?._id || "",
      // purchaseOrderNo: data?.purchaseOrderId ? data?.purchaseOrderId : "",
      purchaseOrders: data?.purchaseOrders || [
        {
          purchaseOrderId: data?.id || data?._id,
          purchaseOrderNo: data?.purchaseOrderId,
        },
      ],
      paymentTermsId: data?.paymentTermsId,
      notes: data?.customerNotes || data?.notes || '',
    };

    if (type === 'grpo') {
      navigate('/grpo/new', {
        state: {
          grpoData: {
            ...payload,
            ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
          },
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigate('/bills/new', {
        state: {
          billsData: {
            ...payload,
            ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
          },
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    }
  };

  const handleConvertGRPO = (data, isSplitWise) => {
    const payload = {
      ...baseConvertToData(data, isSplitWise),
      vendor: resolveConversionVendor(data, normalizeEntityId(data?.vendor)),
      divisionName: data?.divisionName,
      branchName: data?.branchName,
      warehouseName: data?.warehouseName,
      paymentTermsId: data?.paymentTermsId,
      notes: data?.customerNotes || data?.notes || '',
      isSplitWise,
    };

    if (data?.grpoIds?.length > 0) {
      payload.grpoIds = data?.grpoIds;
    }

    if (data?.grpoOrderId && (data?.id || data?._id) && !payload.grpoIds) {
      payload.grpoIds = [{ grpoId: data?.id || data?._id, grpoNo: data?.grpoOrderId }];
    }

    navigate('/bills/new', {
      state: {
        billsData: {
          ...payload,
          ...(payload?.paymentTermsId && { dueDate: calculateDueDate(payload?.paymentTermsId) }),
        },
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  return {
    handleConvertQuote,
    handleConvertSalesOrder,
    handleConvertDeliveryChallan,
    handleConvertPurchaseOrder,
    handleConvertGRPO,
  };
};
