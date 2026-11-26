import dayjs from 'dayjs';
import { calculateAmounts, calculateItemRateForSplit } from './services';
import { CURRENCIES } from './constants';
import { getGstNumericRate } from './gstDisplay';
import { toDecimalString } from './currency';
import { getItemUnitName, resolveUnitRefId } from './itemLineUnit';

const createAdditionalChargesArr = (moduleConfig, data) => {
  let moduleChargeArr = [];
  moduleConfig?.additionalChargesConfig?.forEach(item => {
    moduleChargeArr?.push({
      isTaxable: item?.isTaxable,
      taxRate: item?.taxRate,
      name: item?.name,
      amount: 0,
    });
  });

  let storedChargesArr = [];

  if (data?.additionalCharges?.length > 0) {
    data?.additionalCharges?.forEach(item => {
      let isChargeExists = moduleChargeArr?.findIndex(x => x?.name === item?.name);

      if (isChargeExists >= 0) {
        moduleChargeArr[isChargeExists].amount = item?.amount;
      } else {
        storedChargesArr.push({
          isTaxable: item?.isTaxable,
          taxRate: item?.taxRate,
          name: item?.name,
          amount: item?.amount,
        });
      }
    });
  }

  let finalChargesArr = [...moduleChargeArr, ...storedChargesArr];

  return finalChargesArr;
};

const mapBackendTotals = data => {
  const hasConversionItems = data?.items?.some(item => item?.referenceType);

  if (hasConversionItems) {
    const appliesTo = data?.appliesTo;

    const items = (data?.items || []).map(item => ({
      ...item,
      quantity: item?.referenceType && Number(item?.remainingQty) > 0 ? item.remainingQty : item.quantity,
      ...(appliesTo === 'ITEM' && {
        discountValue: item?.discountConfig?.discountValue ?? '',
        discountType: item?.discountConfig?.discountType || 'PERCENTAGE',
      }),
    }));

    const calculationData = {
      items,
      additionalcharge: data?.additionalCharges || [],
      ...(appliesTo === 'TRANSACTION' &&
        data?.discountConfig && {
          discountValue: data.discountConfig.discountValue,
          discountType: data.discountConfig.discountType,
        }),
    };

    const totals = calculateAmounts(calculationData, () => {}, appliesTo ? { appliesTo } : undefined);

    data = {
      ...data,
      subTotal: totals.subTotal,
      totalTax: totals.totalTax,
      total: totals.total,
      roundOffAmount: totals.roundOffAmount,
    };
  }

  return {
    subTotal: Number(data?.subTotal || 0),
    totalTax: Number(data?.totalTax || 0),
    total: Number(data?.total ?? data?.amount ?? 0),
    totalTaxablevalue: Number(data?.totalTaxablevalue ?? data?.subTotal ?? 0),
    isRoundOff: data?.isRoundOff,
    roundOffAmount: Number(data?.roundOffAmount || 0),
  };
};

const baseIntitalValues = (data, initialCalculations, additionalcharge, isSplitWise) => {
  return {
    items:
      data && data?.items?.length > 0
        ? data?.items.map(item => {
            let itemRateForSplitDoc = data?.isSplit ? calculateItemRateForSplit(item) || 0 : 0;
            let amount = item?.rate * item?.quantity;
            let taxAmount = (data?._id || data?.id) && item?.taxAmount != null ? parseFloat(item.taxAmount) : (getGstNumericRate(item?.gst) / 100) * amount;
            if (data?.appliesTo === 'ITEM') {
              if (item?.discountConfig?.discountType === 'AMOUNT') {
                amount = amount - parseFloat(item?.discountConfig?.discountValue || 0);
              } else {
                amount = amount - (amount * parseFloat(item?.discountConfig?.discountValue || 0)) / 100;
              }
              taxAmount = (getGstNumericRate(item?.gst) / 100) * amount;
            }

            const hasConversionLink = data?.salesOrders?.length > 0 || data?.purchaseOrders?.length > 0 || data?.deliveryChallanIds?.length > 0 || data?.grpoIds?.length > 0;

            return {
              itemId: item.itemId?.id || item.itemId?._id || item.itemId,
              itemName: item?.itemName,
              itemNo: item?.itemNo,
              hsnCode: item?.hsnCode,
              itemUnit: getItemUnitName(item),
              itemUnitId: resolveUnitRefId(item?.itemUnitId) || resolveUnitRefId(item?.itemId?.itemUnitId) || null,
              quantity: item?.quantity,
              description: item?.description,
              rate: data?.isSplit ? itemRateForSplitDoc : item?.rate != null && item?.rate !== '' ? String(item.rate) : '0',
              gst: item?.gst,
              taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
              amount: toDecimalString(amount),
              ...((data?.salesOrders?.length > 0 || data?.purchaseOrders?.length > 0) && {
                referenceType: item?.referenceType || '',
              }),
              ...((data?.deliveryChallanIds?.length > 0 || data?.grpoIds?.length > 0) &&
                item?.referenceType && {
                  referenceType: item?.referenceType || '',
                }),
              ...(hasConversionLink && item?.referenceId && { referenceId: item.referenceId }),
              ...(hasConversionLink && item?.referenceNo && { referenceNo: item.referenceNo }),
              ...(isSplitWise && { finalQty: item?.quantity }),
              ...(isSplitWise && { splitQty: 0 }),
              ...(data?.appliesTo === 'ITEM' && {
                discountType: item?.discountConfig?.discountType || 'PERCENTAGE',
              }),
              ...(data?.appliesTo === 'ITEM' && {
                discountValue: item?.discountConfig?.discountValue || '',
              }),
            };
          })
        : [
            {
              itemId: null,
              itemName: '',
              itemNo: '',
              description: '',
              hsnCode: '',
              itemUnit: '',
              itemUnitId: null,
              gst: '0',
              taxAmount: '0.00',
              quantity: '1.00',
              rate: '0.00',
              amount: '0.00',
            },
          ],
    subTotal: initialCalculations?.subTotal ? initialCalculations?.subTotal : '0.00',
    totalTax: initialCalculations?.totalTax ? initialCalculations?.totalTax : '0.00',
    total: initialCalculations?.total ? (data?.isRoundOff ? Math.round(initialCalculations?.total || 0) : initialCalculations?.total) : '0.00',
    sgst: initialCalculations?.totalTax ? toDecimalString(parseFloat(initialCalculations?.totalTax) / 2) : '0.00',
    cgst: initialCalculations?.totalTax ? toDecimalString(parseFloat(initialCalculations?.totalTax) / 2) : '0.00',
    igst: initialCalculations?.totalTax ? initialCalculations?.totalTax : '0.00',
    divisionId: data?.divisionId ? data?.divisionId : null,
    branchId: data?.branchId ? data?.branchId : null,
    warehouseId: data?.warehouseId ? data?.warehouseId : null,
    additionalcharge: additionalcharge,
    isRoundOff: initialCalculations?.isRoundOff ?? true,
    roundOffAmount: initialCalculations?.roundOffAmount ?? 0,
    ...(data?.isSplit && { isSplit: data?.isSplit }),
    exchangeRate: data?.currency?.exchangeRate ?? 1,
  };
};

// Resolve the payment terms to show in a document form.
// Edit: honor exactly what was saved — never reapply the customer/company default, even if the user
// cleared it. Create (including duplicate/convert): fall back to the default when the source has none.
const resolveFormPaymentTermsId = (savedPaymentTerms, defaultPaymentTermsId, isEdit) => {
  const savedId = savedPaymentTerms?._id || savedPaymentTerms?.id || savedPaymentTerms || null;
  return isEdit ? savedId : savedId || defaultPaymentTermsId;
};

export const quoteInitialValues = (moduleConfig, data, Signterms, status, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(data);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, data);
  return {
    ...baseIntitalValues(data, initialCalculations, additionalcharge),
    customerId: data?.customerId ? data?.customerId?._id || data?.customerId?.id : null,
    quoteNumber: data?.quoteId ? data?.quoteId : '',
    reference: data?.reference ? data?.reference : '',
    quoteDate: data?.quoteDate ? data?.quoteDate : dayjs().format('YYYY-MM-DD'),
    expiryDate: data?.expiryDate ? data?.expiryDate : null,
    subject: data?.subject ? data?.subject : '',
    customerNotes: data?.customerNotes ? data?.customerNotes : '',
    termsAndConditions: data?.termsAndConditions ? data?.termsAndConditions : Signterms,
    status: data?.status ? data?.status : status,
    paymentTermsId: resolveFormPaymentTermsId(data?.paymentTermsId, paymentTermsId, isEdit),
    priceList: data?.priceListId || undefined,
    ...(data?.appliesTo === 'TRANSACTION' && {
      discountValue: data?.discountConfig?.discountValue,
    }),
    ...(data?.appliesTo === 'TRANSACTION' && {
      discountType: data?.discountConfig?.discountType,
    }),
    addressId: data?.addressId || null,
  };
};

export const salesOrderInitialValues = (moduleConfig, salesOrderData, Signterms, status, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(salesOrderData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, salesOrderData);
  return {
    ...baseIntitalValues(salesOrderData, initialCalculations, additionalcharge),
    customerId: salesOrderData ? salesOrderData?.customerId?._id || salesOrderData?.customerId?.id || salesOrderData?.customerId : null,
    orderId: salesOrderData?.orderId ? salesOrderData?.orderId : '',
    reference: salesOrderData?.reference ? salesOrderData?.reference : '',
    orderDate: salesOrderData?.orderDate ? salesOrderData?.orderDate : dayjs().format('YYYY-MM-DD'),
    expectedShipmentDate: salesOrderData?.expectedShipmentDate ? salesOrderData?.expectedShipmentDate : null,
    deliveryMethod: salesOrderData?.deliveryMethod ? salesOrderData?.deliveryMethod : null,
    tagId: salesOrderData?.tagId?._id || salesOrderData?.tagId?.id || salesOrderData?.tagId || null,
    paymentTermsId: resolveFormPaymentTermsId(salesOrderData?.paymentTermsId, paymentTermsId, isEdit),
    customerNotes: salesOrderData?.customerNotes ? salesOrderData?.customerNotes : '',
    termsAndConditions: salesOrderData?.termsAndConditions ? salesOrderData?.termsAndConditions : Signterms,
    status: salesOrderData?.status ? salesOrderData?.status : status,
    priceList: salesOrderData?.priceListId || undefined,
    ...(salesOrderData?.appliesTo === 'TRANSACTION' && {
      discountValue: salesOrderData?.discountConfig?.discountValue,
    }),
    ...(salesOrderData?.appliesTo === 'TRANSACTION' && {
      discountType: salesOrderData?.discountConfig?.discountType,
    }),
    addressId: salesOrderData?.addressId || null,
  };
};

export const deliveryChallanInitialValues = (moduleConfig, deliveryChallanData, Signterms, status, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(deliveryChallanData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, deliveryChallanData);
  return {
    ...baseIntitalValues(deliveryChallanData, initialCalculations, additionalcharge),
    customerId: deliveryChallanData?.customerId ? deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id || deliveryChallanData?.customerId : null,
    challanId: deliveryChallanData?.challanId ? deliveryChallanData?.challanId : '',
    reference: deliveryChallanData?.reference ? deliveryChallanData?.reference : '',
    challanDate: deliveryChallanData?.challanDate ? deliveryChallanData?.challanDate : dayjs().format('YYYY-MM-DD'),
    challanType: deliveryChallanData?.challanType ? deliveryChallanData?.challanType : null,
    customerNotes: deliveryChallanData?.customerNotes ? deliveryChallanData?.customerNotes : '',
    termsAndConditions: deliveryChallanData?.termsAndConditions ? deliveryChallanData?.termsAndConditions : Signterms,
    status: deliveryChallanData?.status ? deliveryChallanData?.status : status,
    paymentTermsId: resolveFormPaymentTermsId(deliveryChallanData?.paymentTermsId, paymentTermsId, isEdit),
    priceList: deliveryChallanData?.priceListId || undefined,
    ...(deliveryChallanData?.appliesTo === 'TRANSACTION' && {
      discountValue: deliveryChallanData?.discountConfig?.discountValue,
    }),
    ...(deliveryChallanData?.appliesTo === 'TRANSACTION' && {
      discountType: deliveryChallanData?.discountConfig?.discountType,
    }),
    addressId: deliveryChallanData?.addressId || null,
    isStockTransfer: Boolean(deliveryChallanData?.isStockTransfer),
    fromDivisionId: deliveryChallanData?.stockTransfer?.fromDivisionId || null,
    fromBranchId: deliveryChallanData?.stockTransfer?.fromBranchId || null,
    fromWarehouseId: deliveryChallanData?.stockTransfer?.fromWarehouseId || null,
  };
};

export const invoiceInitialValues = (moduleConfig, invoiceData, Signterms, paymentTermsId, isSplitWise, isEdit = false) => {
  let initialCalculations = mapBackendTotals(invoiceData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, invoiceData);
  return {
    ...baseIntitalValues(invoiceData, initialCalculations, additionalcharge, isSplitWise),
    customerId: invoiceData ? invoiceData?.customerId?._id || invoiceData?.customerId?.id || invoiceData?.customerId : null,
    invoiceId: invoiceData?.invoiceId ? invoiceData?.invoiceId : '',
    referenceNumber: invoiceData?.referenceNumber ? invoiceData?.referenceNumber : '',
    invoiceDate: invoiceData?.invoiceDate ? invoiceData?.invoiceDate : dayjs().format('YYYY-MM-DD'),
    dueDate: invoiceData?.dueDate ? invoiceData?.dueDate : dayjs().format('YYYY-MM-DD'),
    paymentTermsId: resolveFormPaymentTermsId(invoiceData?.paymentTermsId, paymentTermsId, isEdit),
    subject: invoiceData?.subject ? invoiceData?.subject : '',
    customerNotes: invoiceData?.customerNotes ? invoiceData?.customerNotes : '',
    termsAndConditions: invoiceData?.termsAndConditions ? invoiceData?.termsAndConditions : Signterms,
    priceList: invoiceData?.priceListId || undefined,
    id: invoiceData?._id || invoiceData?.id || '',
    ...(isSplitWise && { splitWiseType: 'Split By Qty' }),
    ...(invoiceData?.appliesTo === 'TRANSACTION' && {
      discountValue: invoiceData?.discountConfig?.discountValue,
    }),
    ...(invoiceData?.appliesTo === 'TRANSACTION' && {
      discountType: invoiceData?.discountConfig?.discountType,
    }),
    ledger: invoiceData?.accountLedger ? true : false,
    accountLedger: invoiceData?.accountLedger,
    addressId: invoiceData?.addressId || null,
    tax: invoiceData?.tax?.taxId ? invoiceData.tax : null,
  };
};

export const purchaseOrderInitialValues = (moduleConfig, purchaseOrderData, Signterms, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(purchaseOrderData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, purchaseOrderData);
  return {
    ...baseIntitalValues(purchaseOrderData, initialCalculations, additionalcharge),
    vendor: purchaseOrderData?.vendor ? purchaseOrderData?.vendor?._id || purchaseOrderData?.vendor?.id : null,
    purchaseOrderId: purchaseOrderData?.purchaseOrderId ? purchaseOrderData?.purchaseOrderId : '',
    date: purchaseOrderData?.date ? purchaseOrderData?.date : dayjs().format('YYYY-MM-DD'),
    deliveryDate: purchaseOrderData?.deliveryDate ? purchaseOrderData?.deliveryDate : null,
    paymentTermsId: resolveFormPaymentTermsId(purchaseOrderData?.paymentTermsId, paymentTermsId, isEdit),
    customerNotes: purchaseOrderData?.customerNotes ? purchaseOrderData?.customerNotes : '',
    termsAndConditions: purchaseOrderData?.termsAndConditions ? purchaseOrderData?.termsAndConditions : Signterms,
    reference: purchaseOrderData?.reference ? purchaseOrderData?.reference : '',
    ...(purchaseOrderData?.appliesTo === 'TRANSACTION' && {
      discountValue: purchaseOrderData?.discountConfig?.discountValue,
    }),
    ...(purchaseOrderData?.appliesTo === 'TRANSACTION' && {
      discountType: purchaseOrderData?.discountConfig?.discountType,
    }),
    shippingAddressType: purchaseOrderData?.customer ? 'Customer' : 'Organization',
    customer: purchaseOrderData?.customer || null,
    addressId: purchaseOrderData?.addressId || null,
  };
};

const getItemRowId = item => item?.itemId?._id || item?.itemId?.id || item?.itemId;

const resolveBatchMandatoryFlags = (item, allItemDropDown, sourceItems = []) => {
  const itemId = getItemRowId(item);
  const selectedItem = (allItemDropDown || []).find(itm => String(itm?._id || itm?.id) === String(itemId));
  const itemFromDb = (sourceItems || []).find(itm => String(getItemRowId(itm)) === String(itemId));
  const purchasingData = selectedItem?.purchasingData || itemFromDb?.itemId?.purchasingData || itemFromDb?.purchasingData;

  return {
    batchNumberMandatory: purchasingData?.timeBatchNumberMandatory?.activeInactive || false,
    batchExpiryDateMandatory: purchasingData?.punchingTimeBatchNumberMandatory?.activeInactive || false,
  };
};

export const applyBatchMandatoryFlags = (items, allItemDropDown, sourceItems = []) => {
  if (!items?.length) return items;
  return items.map(item => {
    if (!getItemRowId(item)) return item;
    return {
      ...item,
      ...resolveBatchMandatoryFlags(item, allItemDropDown, sourceItems),
    };
  });
};

/** @deprecated Use applyBatchMandatoryFlags */
export const applyBillBatchMandatoryFlags = applyBatchMandatoryFlags;

export const grpoInitialValues = (moduleConfig, grpoData, Signterms, paymentTermsId, allItemDropDown, showBatchNo, isEdit = false) => {
  let initialCalculations = mapBackendTotals(grpoData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, grpoData);
  let initialValues = baseIntitalValues(grpoData, initialCalculations, additionalcharge);

  if (!grpoData?._id && showBatchNo) {
    initialValues.items = initialValues.items.map(item => ({
      ...item,
      vendorBatchNo: '',
      vendorBatchExpiry: null,
      ...resolveBatchMandatoryFlags(item, allItemDropDown, grpoData?.items),
    }));
  } else if (showBatchNo) {
    initialValues.items = initialValues.items.map(item => {
      const itemFromDb = (grpoData?.items || []).find(itm => String(getItemRowId(itm)) === String(getItemRowId(item)));

      return {
        ...item,
        vendorBatchNo: itemFromDb?.vendorBatchNo || '',
        vendorBatchExpiry: itemFromDb?.vendorBatchExpiry || null,
        ...resolveBatchMandatoryFlags(item, allItemDropDown, grpoData?.items),
      };
    });
  }

  return {
    ...initialValues,
    vendor: grpoData?.vendor ? grpoData?.vendor?._id || grpoData?.vendor?.id || grpoData?.vendor : null,
    grpoOrderId: grpoData?.grpoOrderId ? grpoData?.grpoOrderId : '',
    date: grpoData?.date ? grpoData?.date : dayjs().format('YYYY-MM-DD'),
    dueDate: grpoData?.dueDate ? grpoData?.dueDate : null,
    paymentTermsId: resolveFormPaymentTermsId(grpoData?.paymentTermsId, paymentTermsId, isEdit),
    customerNotes: grpoData?.customerNotes ? grpoData?.customerNotes : '',
    termsAndConditions: grpoData?.termsAndConditions ? grpoData?.termsAndConditions : Signterms,
    reference: grpoData?.reference ? grpoData?.reference : '',
    ...(grpoData?.appliesTo === 'TRANSACTION' && {
      discountValue: grpoData?.discountConfig?.discountValue,
    }),
    ...(grpoData?.appliesTo === 'TRANSACTION' && {
      discountType: grpoData?.discountConfig?.discountType,
    }),
    shippingAddressType: grpoData?.customer ? 'Customer' : 'Organization',
    addressId: grpoData?.addressId || null,
    customer: grpoData?.customer || null,
    attachments: grpoData?.attachments || [],
  };
};

export const billInitialValues = (moduleConfig, billsData, Signterms, paymentTermsId, isSplitWise, allItemDropDown, showBatchNo, isEdit = false) => {
  let initialCalculations = mapBackendTotals(billsData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, billsData);

  let initialValues = baseIntitalValues(billsData, initialCalculations, additionalcharge, isSplitWise);

  if (!billsData?._id && showBatchNo) {
    const isFromGrpo = (billsData?.grpoIds?.length ?? 0) > 0;
    initialValues.items = initialValues.items.map(item => {
      const itemFromDb = (billsData?.items || []).find(itm => String(getItemRowId(itm)) === String(getItemRowId(item)));
      return {
        ...item,
        vendorBatchNo: isFromGrpo ? itemFromDb?.vendorBatchNo || item?.vendorBatchNo || '' : '',
        vendorBatchExpiry: isFromGrpo ? itemFromDb?.vendorBatchExpiry || item?.vendorBatchExpiry || null : null,
        ...resolveBatchMandatoryFlags(item, allItemDropDown, billsData?.items),
      };
    });
  } else if (showBatchNo) {
    initialValues.items = initialValues.items.map(item => {
      const itemFromDb = (billsData?.items || []).find(itm => String(getItemRowId(itm)) === String(getItemRowId(item)));

      return {
        ...item,
        vendorBatchNo: itemFromDb?.vendorBatchNo || '',
        vendorBatchExpiry: itemFromDb?.vendorBatchExpiry || null,
        ...resolveBatchMandatoryFlags(item, allItemDropDown, billsData?.items),
      };
    });
  }

  return {
    ...initialValues,
    vendor: billsData ? billsData?.vendor?._id || billsData?.vendor?.id || billsData?.vendor : null,
    billId: billsData?.billId ? billsData?.billId : '',
    billDate: billsData?.billDate ? billsData?.billDate : dayjs().format('YYYY-MM-DD'),
    dueDate: billsData?.dueDate ? billsData?.dueDate : null,
    paymentTermsId: resolveFormPaymentTermsId(billsData?.paymentTermsId, paymentTermsId, isEdit),
    notes: billsData?.customerNotes ? billsData?.customerNotes : '',
    termsAndConditions: billsData?.termsAndConditions ? billsData?.termsAndConditions : Signterms,
    ...(isSplitWise && { splitWiseType: 'Split By Qty' }),
    id: billsData?._id || billsData?.id || '',
    ...(billsData?.appliesTo === 'TRANSACTION' && {
      discountValue: billsData?.discountConfig?.discountValue,
    }),
    ...(billsData?.appliesTo === 'TRANSACTION' && {
      discountType: billsData?.discountConfig?.discountType,
    }),
    shippingAddressType: billsData?.customer ? 'Customer' : 'Organization',
    addressId: billsData?.addressId || null,
    customer: billsData?.customer || null,
    tax: billsData?.tax?.taxId ? billsData.tax : null,
  };
};

export const creditLimitInitialValues = creditLimitData => {
  return {
    branch: creditLimitData?.branch ? creditLimitData?.branch : null,
    creditLimit: creditLimitData?.creditLimit ? creditLimitData?.creditLimit : 0,
    creditLimitType: creditLimitData?.creditLimitType ? creditLimitData?.creditLimitType : null,
  };
};

export const accountLedgerInitialValues = data => {
  return {
    gstinUin: data?.gstinUin,
    personName: data?.personName,
    pan: data?.pan,
    phoneNo: data?.phoneNo,
    email: data?.email,
    address: data?.address,
    country: data?.country ?? 'India',
    city: data?.city,
    state: data?.state,
    businessAccountLedgerMasterId: data?.businessAccountLedgerMasterId,
  };
};

export const recurringInvoiceInitialValues = (moduleConfig, recurringInvoiceData, Signterms, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(recurringInvoiceData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, recurringInvoiceData);
  const rawShippingAddressId = recurringInvoiceData?.addressId;
  const shippingAddressId =
    rawShippingAddressId == null || rawShippingAddressId === ''
      ? null
      : typeof rawShippingAddressId === 'string'
        ? rawShippingAddressId
        : rawShippingAddressId?._id || rawShippingAddressId?.id || null;
  return {
    ...baseIntitalValues(recurringInvoiceData, initialCalculations, additionalcharge),
    customerId: recurringInvoiceData ? recurringInvoiceData?.customerId?._id || recurringInvoiceData?.customerId?.id : null,
    addressId: shippingAddressId,
    profileName: recurringInvoiceData?.profileName || null,
    recurringId: recurringInvoiceData?.recurringInvoiceId || '',
    referenceNumber: recurringInvoiceData?.referenceNumber ? recurringInvoiceData?.referenceNumber : '',
    paymentTermsId: resolveFormPaymentTermsId(recurringInvoiceData?.paymentTermsId, paymentTermsId, isEdit),
    subject: recurringInvoiceData?.subject ? recurringInvoiceData?.subject : '',
    customerNotes: recurringInvoiceData?.customerNotes ? recurringInvoiceData?.customerNotes : '',
    termsAndConditions: recurringInvoiceData?.termsAndConditions ? recurringInvoiceData?.termsAndConditions : Signterms,
    priceList: recurringInvoiceData?.priceListId || undefined,
    id: recurringInvoiceData?._id || recurringInvoiceData?.id || '',
    frequency: recurringInvoiceData?.repeatEvery?.frequency || null,
    period: recurringInvoiceData?.repeatEvery?.period || null,
    startDate: recurringInvoiceData?.startDate,
    endDate: recurringInvoiceData?.endDate,
    neverExpires: recurringInvoiceData?.neverExpires || false,
    ...(recurringInvoiceData?.appliesTo === 'TRANSACTION' && {
      discountValue: recurringInvoiceData?.discountConfig?.discountValue,
    }),
    ...(recurringInvoiceData?.appliesTo === 'TRANSACTION' && {
      discountType: recurringInvoiceData?.discountConfig?.discountType,
    }),
    tax: recurringInvoiceData?.tax?.taxId ? recurringInvoiceData.tax : null,
  };
};

export const recurringBillInitialValues = (moduleConfig, recurringBillsData, Signterms, paymentTermsId, isEdit = false) => {
  let initialCalculations = mapBackendTotals(recurringBillsData);
  let additionalcharge = createAdditionalChargesArr(moduleConfig, recurringBillsData);
  return {
    ...baseIntitalValues(recurringBillsData, initialCalculations, additionalcharge),
    vendorId: recurringBillsData?.vendorId || null,
    profileName: recurringBillsData?.profileName || null,
    recurringBillId: recurringBillsData?.recurringBillId ? recurringBillsData?.recurringBillId : '',
    paymentTermsId: resolveFormPaymentTermsId(recurringBillsData?.paymentTermsId, paymentTermsId, isEdit),
    notes: recurringBillsData?.customerNotes ? recurringBillsData?.customerNotes : '',
    termsAndConditions: recurringBillsData?.termsAndConditions ? recurringBillsData?.termsAndConditions : Signterms,
    id: recurringBillsData?._id || recurringBillsData?.id || '',
    frequency: recurringBillsData?.repeatEvery?.frequency || null,
    period: recurringBillsData?.repeatEvery?.period || null,
    startDate: recurringBillsData?.startDate,
    endDate: recurringBillsData?.endDate,
    neverExpires: recurringBillsData?.neverExpires || false,
    ...(recurringBillsData?.appliesTo === 'TRANSACTION' && {
      discountValue: recurringBillsData?.discountConfig?.discountValue,
    }),
    ...(recurringBillsData?.appliesTo === 'TRANSACTION' && {
      discountType: recurringBillsData?.discountConfig?.discountType,
    }),
    shippingAddressType: recurringBillsData?.customerId ? 'Customer' : 'Organization',
    addressId: recurringBillsData?.addressId || null,
    customerId: recurringBillsData?.customerId || null,
    tax: recurringBillsData?.tax?.taxId ? recurringBillsData.tax : null,
  };
};

export const manualJournalInitialValues = manualJournalData => {
  return {
    divisionId: manualJournalData?.divisionId ? manualJournalData?.divisionId : null,
    branchId: manualJournalData?.branchId ? manualJournalData?.branchId : null,
    warehouseId: manualJournalData?.warehouseId ? manualJournalData?.warehouseId : null,
    manualJournalId: manualJournalData?.manualJournalId ? manualJournalData?.manualJournalId : null,
    notes: manualJournalData?.notes ? manualJournalData?.notes : '',
    journalEntries: manualJournalData?.journalEntries
      ? manualJournalData?.journalEntries.map(entry => {
          const filteredEntry = {
            ...entry,
          };
          delete filteredEntry.businessAccountLedgerMaster;
          delete filteredEntry.account;
          return filteredEntry;
        })
      : [
          {
            accountId: null,
            description: '',
            businessAccountLedgerMasterId: null,
            debits: '',
            credits: '',
          },
          {
            accountId: null,
            description: '',
            businessAccountLedgerMasterId: null,
            debits: '',
            credits: '',
          },
        ],
    currency: manualJournalData?.currency ? manualJournalData?.currency : CURRENCIES.INR,
    date: manualJournalData?.date ? manualJournalData?.date : dayjs().format('YYYY-MM-DD'),
    reportingMethod: manualJournalData?.reportingMethod ? manualJournalData?.reportingMethod : 'accrual-and-cash',
    attachments: manualJournalData?.attachments || [],
  };
};
