import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { QRCodeCanvas } from 'qrcode.react';

// Components
import { Card } from '@/components/AntDComponent';
import ItemDrawerDetails from '@/features/allMaster/item/components/ItemDrawerDetails';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';

// Extras
import brandingLogo from '@/assets/images/ABSS-LOGO.png';
import { SUB_SUPPLY_TYPE_OPTIONS, SUPPLY_TYPE_OPTIONS } from '@/utils/dropdownEnums';
import { formatGstForDisplay, formatGstHalfRateForTaxTable, formatGstRateForTaxTable } from '@/utils/gstDisplay';
import { E_INVOICE_STATUS, E_WAY_BILL_STATUS, TRANSPORT_MODES, pageTypes } from 'utils/constants';
import {
  calculatediscountedValue,
  calculateItemQty,
  calculateItemRateForSplit,
  calculationForChargesTaxTable,
  checkIsPurchaseModule,
  buildTaxContext,
  getGroupedHsnData,
  isIGSTExists,
} from 'utils/services';
import { formatAmount, toDecimalString } from '@/utils/currency';
import { getInvoiceLrDetails } from '@/features/sales/invoice/invoiceLrDetails';
import { formatEWayBillAddress, getEWayBillMovement } from '@/utils/pdfUtils';
import { getItemUnitName } from '@/utils/itemLineUnit';

const SalesModuleDetailView = ({ data, profile, pageType, isEinvoicingAvailable = false, isEwayBillingAvailable = false }) => {
  const [viewItemDetail, setViewItemDetail] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);

  let customerDetails = data?.customerId;
  const lrDetails = pageType === pageTypes?.INVOICE ? getInvoiceLrDetails(data) : null;
  // Portal orders have no branch, bank or terms until they become a sales document.
  const isPortalOrder = pageType === pageTypes?.CUSTOMER_ORDER;

  const isPurchaseModule = checkIsPurchaseModule(pageType);
  const dispatchAttachments = [
    { label: 'Booking Copy', files: data?.dispatchDetails?.transportCourier?.bookingCopyImage },
    { label: 'Truck & Goods Image', files: data?.dispatchDetails?.truckLoad?.truck_goodsImage },
    { label: 'Vehicle & Goods Image', files: data?.dispatchDetails?.selfDelivery?.vehicle_goodsImage },
  ].filter(({ files }) => (Array.isArray(files) ? files.length > 0 : Boolean(files)));
  let billToText = 'Bill To';

  let header = 'Quotation',
    numberTitle = 'SQ No',
    numberId = 'quoteId',
    dateTitle = 'Date',
    date = 'quoteDate',
    refTitle = 'Cust.';

  if (pageType === pageTypes?.PURCHASE_ORDER || pageType === pageTypes?.GRPO || pageType === pageTypes?.BILLS || pageType === pageTypes?.RECURRING_BILL) {
    customerDetails = data?.vendor;
    date = 'date';
    refTitle = 'Vendor';
    billToText = 'Bill From';
  }

  if (pageType === pageTypes?.SALES_ORDER) {
    header = 'Sales Order';
    numberId = 'orderId';
    date = 'orderDate';
    numberTitle = 'SO No';
  } else if (pageType === pageTypes?.RECURRING_INVOICE) {
    header = 'Invoice';
    date = 'nextExecutionDate';
  } else if (pageType === pageTypes?.RECURRING_BILL) {
    header = 'Bill';
    date = 'nextExecutionDate';
  } else if (pageType === pageTypes?.DELIVERY_CHALLAN) {
    header = 'Delivery Challan';
    numberTitle = 'Delivery Challan No';
    numberId = 'challanId';
    date = 'challanDate';
  } else if (pageType === pageTypes?.INVOICE) {
    header = 'Tax Invoice';
    numberTitle = 'Invoice No';
    numberId = 'invoiceId';
    date = 'invoiceDate';
  } else if (pageType === pageTypes?.CREDIT_NOTE) {
    header = 'Credit Note';
    numberTitle = 'Credit Note No';
    numberId = 'creditNoteId';
    date = 'creditNoteDate';
  } else if (pageType === pageTypes?.PURCHASE_ORDER) {
    header = 'Purchase Order';
    dateTitle = 'Delivery Date';
    numberTitle = 'Purchase Order No';
    numberId = 'purchaseOrderId';
  } else if (pageType === pageTypes?.GRPO) {
    header = 'GRPO';
    dateTitle = 'Delivery Date';
    numberTitle = 'GRPO No';
    numberId = 'grpoOrderId';
  } else if (pageType === pageTypes?.BILLS) {
    header = 'Bill';
    numberTitle = 'Bill No';
    numberId = 'billId';
    dateTitle = 'Bill Date';
    date = 'billDate';
  } else if (pageType === pageTypes?.DEBIT_NOTE) {
    header = 'Debit Note';
    numberTitle = 'Debit Note No';
    numberId = 'debitNoteId';
    customerDetails = data?.vendorId;
    date = 'debitNoteDate';
    refTitle = 'Vendor';
  } else if (pageType === pageTypes?.EXPENSES) {
    header = 'Expenses';
    numberTitle = 'Expenses No';
    numberId = 'expenseId';
    customerDetails = data?.customer;
    date = 'date';
  } else if (pageType === pageTypes?.CUSTOMER_ORDER) {
    header = 'Customer Order';
    numberTitle = 'Order No';
    numberId = 'customerOrderId';
    dateTitle = 'Order Date';
    date = 'createdAt';
  }

  const showDueDate = [pageTypes?.INVOICE, pageTypes?.BILLS].includes(pageType);

  const showItemDiscountColumn =
    data?.appliesTo === 'ITEM' &&
    !data?.isSplit &&
    data?.items?.some(item => {
      const discountValue = parseFloat(item?.discountConfig?.discountValue);
      return !isNaN(discountValue) && discountValue > 0;
    });

  const formatItemDiscount = discountConfig => {
    const discountValue = parseFloat(discountConfig?.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) return '';
    return discountConfig?.discountType === 'PERCENTAGE' ? `${discountValue}%` : `${data.currency.symbol}${discountValue}`;
  };

  const getItemId = item => {
    const ref = item?.itemId;
    if (ref == null || ref === '') return null;
    if (typeof ref === 'string' || typeof ref === 'number') return String(ref);
    if (typeof ref === 'object') return ref?.id || ref?._id || null;
    return null;
  };

  const handleItemCodeClick = item => {
    const itemId = getItemId(item);
    if (!itemId) return;

    setSelectedItemData({
      id: itemId,
      itemNo: item?.itemNo,
      itemName: item?.itemName,
    });
    setViewItemDetail(true);
  };

  const itemLinkClassName = 'underline underline-offset-2 hover:text-gray-800 transition-colors cursor-pointer';

  const groupedHsnData = getGroupedHsnData(data);
  const itemsSubTotal = data?.items?.reduce((sum, item) => sum + parseFloat(item?.amount || 0), 0) || 0;

  let valueForChargeTaxTable = calculationForChargesTaxTable(data?.additionalCharges);
  const hsnTaxableTotal = groupedHsnData.reduce((sum, item) => sum + item.taxableValue, 0) + (Number(valueForChargeTaxTable?.amount) || 0);
  const totalCalculations = {
    subTotal: Number(data?.subTotal || 0),
    totalTax: Number(data?.totalTax || 0),
    totalTaxablevalue: Number(data?.totalTaxablevalue || data?.subTotal || 0),
    total: Number(data?.total || data?.amount || 0),
    igst: Number(data?.igst || 0),
    cgst: Number(data?.cgst || 0),
    sgst: Number(data?.sgst || 0),
  };
  const isIGST = isIGSTExists(buildTaxContext(profile, customerDetails, data?.vendorId || data?.vendor ? customerDetails?.address?.billing?.state || '' : data?.shippingAddress?.state));

  const narrationText = data?.customerNotes || data?.notes || data?.narration || '';
  const eWayBillMovement = getEWayBillMovement({ data, profile, pageType });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between text-[#111827]">
        <Card className="w-full my-container">
          <div className="border border-gray-400 bg-white p-3 text-[12px] leading-[1.35]">
            {/* ── E-INVOICE DETAILS ─────────────────────────────────────────── */}
            {data?.eInvoice && isEinvoicingAvailable && (
              <div className="px-3 py-2 mb-4">
                <h3 className="text-[12px] font-bold mb-3 border-b border-dotted border-gray-400 pb-1 uppercase tracking-wide">E-Invoice Details</h3>
                <div className="flex flex-row justify-between items-start">
                  {/* Left — Info (takes most of the width) */}
                  <div className="flex-1 pt-5 pr-4">
                    <div className="grid grid-cols-[120px_1fr] gap-y-1 text-[12px] text-gray-800">
                      <p className="font-bold">IRN :</p>
                      <p className="break-all">{data?.eInvoice?.irn || '-'}</p>
                      <p className="font-bold">Ack No :</p>
                      <p>{data?.eInvoice?.ackNo || '-'}</p>
                      <p className="font-bold">Ack Date :</p>
                      <p>{data?.eInvoice?.ackDate ? dayjs(data?.eInvoice?.ackDate).format('DD/MM/YYYY hh:mm:ss A') : '-'}</p>
                      <p className="font-bold">Status :</p>
                      <p>{E_INVOICE_STATUS[data?.eInvoice?.status]?.label || data?.eInvoice?.status || '-'}</p>
                    </div>
                    <p className="text-[10px] italic text-gray-500 mt-3">This is a digitally signed e-Invoice generated under GST.</p>
                  </div>
                  {/* Right — QR Code (fixed width, aligned right) */}
                  <div className="flex-shrink-0 flex flex-col items-end">
                    <div className="border border-gray-400 p-1 bg-white">
                      <QRCodeCanvas value={data?.eInvoice?.signedQrCode || 'Invalid QR'} size={90} includeMargin={false} minVersion={1} />
                    </div>
                    <p className="text-[10px] mt-1 text-right">
                      Verify at{' '}
                      <Link to="https://einvoice.gst.gov.in/einvoice/search-irn" target="_blank" rel="noreferrer" className={itemLinkClassName}>
                        einvoice.gst.gov.in
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── HEADER: Customer Info (left) + Company Info (right) ────────── */}
            <div className="flex flex-col lg:flex-row gap-2 items-start py-2 px-3 border-b border-gray-400 mb-2">
              {/* Left — Document details */}
              <div className="w-full lg:w-[45%]">
                {/* Document Title */}
                <h2 className="text-[15px] font-bold mt-8 mb-2 pt-1 pb-1 border-t border-b border-gray-400 uppercase tracking-wide">{header}</h2>
                <div className="grid grid-cols-[44.5%_60%] gap-y-[6px] text-gray-800 text-[12px]">
                  {pageType !== pageTypes?.RECURRING_BILL && pageType !== pageTypes?.RECURRING_INVOICE && <p className="font-bold">{numberTitle}</p>}
                  {pageType !== pageTypes?.RECURRING_BILL && pageType !== pageTypes?.RECURRING_INVOICE && <p>: {data?.[numberId] || '-'}</p>}

                  <p className="font-bold">{refTitle} No</p>
                  <p>: {customerDetails?.customerNumber || customerDetails?.businessAccountLedgerMasterId || '-'}</p>

                  <p className="font-bold">{refTitle} Name</p>
                  <p className="break-words whitespace-normal">: {customerDetails?.customerDisplayName || customerDetails?.personName || '-'}</p>

                  {(customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue || customerDetails?.otherDetails?.pan) && !data?.isSplit && (
                    <>
                      <p className="font-bold">{customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue ? 'GST No' : 'PAN No'}</p>
                      <p>: {customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue || customerDetails?.otherDetails?.pan || '-'}</p>
                    </>
                  )}

                  {data?.[date] && (
                    <>
                      <p className="font-bold">{dateTitle}</p>
                      <p>: {data?.[date] ? new Date(data?.[date]).toLocaleDateString('en-GB') : '-'}</p>
                    </>
                  )}

                  {showDueDate && data?.dueDate && (
                    <>
                      <p className="font-bold py-0.5">Due Date</p>
                      <p className="py-0.5">: {new Date(data?.dueDate).toLocaleDateString('en-GB')}</p>
                    </>
                  )}

                  <p className="font-bold">{refTitle} Contact No</p>
                  <p>: {customerDetails?.customerPhoneNumber || customerDetails?.phoneNo || '-'}</p>
                </div>
              </div>

              {/* Right — Company info */}
              <div className="flex lg:justify-end w-full lg:w-[55%]">
                <div className="lg:text-end">
                  {(data?.companyLogo || profile?.companyLogo) && <img src={data?.companyLogo || profile?.companyLogo} className="h-10 w-auto mb-1 ml-auto" alt="companylogo" id="company-logo" />}
                  <h1 className="text-[18px] font-bold">{profile?.name}</h1>
                  <div className="max-w-[355px]">
                    <p className="text-[12px]">{`${profile?.address?.street1 || ''}${profile?.address?.street2 ? `, ${profile?.address?.street2}` : ''}`}</p>
                  </div>
                  <p className="text-[12px]">
                    {profile?.address?.city || ''}
                    {profile?.address?.pinCode ? ` - ${profile?.address?.pinCode}` : ''}
                  </p>
                  <p className="text-[12px]">{profile?.address?.state || ''}</p>
                  {(data?.companyGstin || profile?.gstNumber) && !data?.isSplit && <p className="text-[12px]">GSTIN : {data?.companyGstin || profile?.gstNumber}</p>}
                  {profile?.panNumber && !data?.isSplit && <p className="text-[12px]">PAN No: {profile?.panNumber}</p>}
                  {profile?.contactPhone && <p className="text-[12px]">Contact No: {profile?.contactPhone}</p>}
                  {!isPortalOrder && <p className="text-[12px]">Branch Name: {data?.branchName || '-'}</p>}
                </div>
              </div>
            </div>

            {/* ── ADDRESS SECTION ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row border-gray-400">
              {/* Bill To */}
              <div className="flex-1 border-b border-l border-gray-400">
                <div className="px-2 py-1 border-t border-b border-gray-400 bg-gray-100">
                  <h3 className="font-bold text-[12px]">{billToText}</h3>
                </div>
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold max-w-[200px] whitespace-normal break-words leading-[1.3]">{customerDetails?.companyName}</p>
                  <>
                    <p className="text-xs leading-[1.3]">{customerDetails?.address?.billing?.address?.street1}</p>
                    <p className="text-xs leading-[1.3]">{customerDetails?.address?.billing?.address?.street2}</p>
                    <p className="text-xs leading-[1.3]">
                      {customerDetails?.address?.billing?.city}
                      {customerDetails?.address?.billing?.pinCode ? ` - ${customerDetails?.address?.billing?.pinCode}` : ''}
                    </p>
                    {customerDetails?.address?.billing?.state && customerDetails?.address?.billing?.country && (
                      <p className="text-xs leading-[1.3]">
                        {customerDetails?.address?.billing?.state} - {customerDetails?.address?.billing?.country}
                      </p>
                    )}
                  </>
                </div>
              </div>

              {/* Ship To */}
              <div className="flex-1 border-b border-l border-gray-400">
                <div className="px-2 py-1 border-t border-b border-gray-400 bg-gray-100">
                  <h3 className="font-bold text-[12px]">Ship To</h3>
                </div>
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold max-w-[200px] whitespace-normal break-words leading-[1.3]">
                    {isPurchaseModule ? data?.customerDisplayName || profile?.name : customerDetails?.companyName}
                  </p>
                  <p className="text-xs leading-[1.3]">{data?.shippingAddress?.address?.street1 || data?.shippingAddress?.street1 || ''}</p>
                  <p className="text-xs leading-[1.3]">{data?.shippingAddress?.address?.street2 || data?.shippingAddress?.street2 || ''}</p>
                  <p className="text-xs leading-[1.3]">
                    {data?.shippingAddress?.city || ''}
                    {data?.shippingAddress?.pinCode ? ` - ${data?.shippingAddress?.pinCode}` : ''}
                  </p>
                  {data?.shippingAddress?.state && (
                    <p className="text-xs leading-[1.3]">
                      {data?.shippingAddress?.state}
                      {data?.shippingAddress?.country ? `, ${data?.shippingAddress?.country}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Other Information */}
              <div className="flex-1 border-b border-l border-r border-gray-400">
                <div className="px-2 py-1 border-t border-b border-gray-400 bg-gray-100">
                  <h3 className="font-bold text-[12px]">Other Information</h3>
                </div>
                <div className="px-2 py-2">
                  {data?.reference && <p>Reference: {data?.reference}</p>}
                  {data?.batchNo && pageType !== pageTypes?.PURCHASE_ORDER && <p>Batch No: {renderBatchNumber(data.batchNo, data.itemBatchId)}</p>}
                  {data?.referenceNumber && <p>Reference Number: {data?.referenceNumber}</p>}
                  {data?.paymentTermsId?.name && <p>Payment Terms: {data?.paymentTermsId?.name}</p>}
                  {data?.eWayBill?.eWayBillNo && <p>E-Way Bill No: {data?.eWayBill?.eWayBillNo}</p>}
                  {data?.eWayBill?.transportMode && <p>Mode: {TRANSPORT_MODES[data?.eWayBill?.transportMode] || '-'}</p>}
                  {lrDetails?.lrNo && <p>LR No: {lrDetails.lrNo}</p>}
                  {lrDetails?.lrDate && <p>LR Date: {lrDetails.lrDate}</p>}
                  {lrDetails?.transporterName && <p>Transporter: {lrDetails.transporterName}</p>}
                  {(data?.eWayBill?.vehicleNumber || lrDetails?.vehicleNo) && <p>Vehicle No: {data?.eWayBill?.vehicleNumber || lrDetails?.vehicleNo}</p>}
                </div>
              </div>
            </div>

            {/* ── ITEMS TABLE ────────────────────────────────────────────────── */}
            <div className="mt-5">
              <table className="w-full table-fixed border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100 text-[11px]">
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[4%]">#</th>
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[9%] max-w-0 break-all whitespace-normal">Item Code</th>
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold uppercase tracking-wide max-w-0 break-words whitespace-normal">Description</th>
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[9%] max-w-0 break-all whitespace-normal">HSN/SAC</th>
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[9%] max-w-0 break-all whitespace-normal">Qty</th>
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[8%] max-w-0 break-all whitespace-normal">Unit Price</th>
                    {showItemDiscountColumn && <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[8%]">Discount</th>}
                    {!data?.isSplit && <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[8%]">Tax Rate(%)</th>}
                    <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[9%] max-w-0 break-all whitespace-normal">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {data?.items?.map((item, index) => {
                    const itemId = getItemId(item);
                    let itemRateForSplitDoc = data?.isSplit ? calculateItemRateForSplit(item) || 0 : 0;
                    let amount = item?.rate * item?.quantity;
                    if (data?.appliesTo === 'ITEM' && !isNaN(item?.discountConfig?.discountValue) && item?.discountConfig?.discountValue > 0) {
                      if (item?.discountConfig?.discountType === 'AMOUNT') {
                        amount = amount - parseFloat(item?.discountConfig?.discountValue || 0);
                      } else {
                        amount = amount - (amount * parseFloat(item?.discountConfig?.discountValue || 0)) / 100;
                      }
                    }
                    return (
                      <tr key={index} className="border-b border-gray-200 odd:bg-gray-50">
                        <td className="border border-gray-400 py-1 text-start px-1">{index + 1}</td>
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal">
                          {itemId ? (
                            <button
                              type="button"
                              onClick={() => handleItemCodeClick(item)}
                              className={`${itemLinkClassName} bg-transparent border-0 p-0 text-left max-w-full break-all whitespace-normal`}
                            >
                              {item?.itemNo}
                            </button>
                          ) : (
                            item?.itemNo
                          )}
                        </td>
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-words whitespace-normal">
                          <div>
                            <div className="break-words whitespace-normal">{item?.itemName}</div>
                            {item?.description && <div className="text-[10px] text-gray-500 mt-0.5 break-words whitespace-normal">({item?.description})</div>}
                          </div>
                        </td>
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal">{item?.hsnCode || 'N/A'}</td>
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal leading-tight">
                          <div>
                            <div className="break-all whitespace-normal">{item?.quantity}</div>
                            {getItemUnitName(item) && <div className="text-[10px] text-gray-500 mt-0.5 break-all whitespace-normal">{getItemUnitName(item)}</div>}
                          </div>
                        </td>
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal leading-tight">{data?.isSplit ? itemRateForSplitDoc : item?.rate}</td>
                        {showItemDiscountColumn && <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal">{formatItemDiscount(item?.discountConfig)}</td>}
                        {!data?.isSplit && <td className="border border-gray-400 py-1 text-start px-1">{formatGstForDisplay(item?.gst)}</td>}
                        <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal leading-tight">
                          {data?.isSplit ? itemRateForSplitDoc * item?.quantity : item?.rate && item?.quantity ? toDecimalString(amount) : ''}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Subtotal row */}
                  <tr>
                    <td className="border border-gray-400 py-1 px-1"></td>
                    <td className="border border-gray-400 py-1 px-1"></td>
                    <td className="border border-gray-400 py-1 px-1"></td>
                    <td className="border border-gray-400 py-1 px-1"></td>
                    <td className="border border-gray-400 py-1 px-1 text-xs font-medium max-w-0 break-all whitespace-normal leading-tight">{calculateItemQty(data?.items)}</td>
                    <td className="border border-gray-400 py-1 px-1"></td>
                    {showItemDiscountColumn && <td className="border border-gray-400 py-1 px-1"></td>}
                    {!data?.isSplit && <td className="border border-gray-400 py-1 px-1"></td>}
                    <td className="border border-gray-400 py-1 px-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── TAX CALCULATION + TOTALS ──────────────────────────────────── */}
            <div className="flex flex-col gap-y-2 lg:gap-y-0 lg:gap-x-2 lg:flex-row lg:justify-between mt-5">
              {/* Tax Calculation Table */}
              <div className="overflow-x-auto w-full lg:w-[65%]">
                {!data?.isSplit && (
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-[11px]">
                        <th className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">HSN/SAC</th>
                        <th className="border border-gray-400 px-1 py-1 font-bold text-right border-b uppercase tracking-wide">Qty</th>
                        <th className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">Taxable value</th>
                        {isIGST ? (
                          <th colSpan={2} className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">
                            IGST Tax
                          </th>
                        ) : (
                          <>
                            <th colSpan={2} className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">
                              CGST Tax
                            </th>
                            <th colSpan={2} className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">
                              SGST Tax
                            </th>
                          </>
                        )}
                        <th className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">Total Tax Amount</th>
                      </tr>
                      <tr className="bg-gray-100 text-[11px]">
                        <th className="border border-gray-400 px-1 py-1"></th>
                        <th className="border border-gray-400 px-1 py-1"></th>
                        <th className="border border-gray-400 px-1 py-1"></th>
                        {isIGST ? (
                          <>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Rate</th>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Amount</th>
                          </>
                        ) : (
                          <>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Rate</th>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Amount</th>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Rate</th>
                            <th className="border border-gray-400 px-1 py-1 font-medium">Amount</th>
                          </>
                        )}
                        <th className="border border-gray-400 px-1 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedHsnData?.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-400 px-1 py-1 text-xs">{item?.hsnCode || '-'}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{calculateItemQty(item?.items)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(item?.taxableValue)}</td>
                          {isIGST ? (
                            <>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstRateForTaxTable(item?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(Number(item?.taxAmount) || 0)}</td>
                            </>
                          ) : (
                            <>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(item?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString((Number(item?.taxAmount) || 0) / 2)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(item?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString((Number(item?.taxAmount) || 0) / 2)}</td>
                            </>
                          )}
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(Number(item?.taxAmount) || 0)}</td>
                        </tr>
                      ))}

                      {valueForChargeTaxTable?.amount > 0 && (
                        <tr>
                          <td className="border border-gray-400 px-1 py-1 text-xs">{valueForChargeTaxTable?.hsnCode || '-'}</td>
                          <td className="border border-gray-400 px-1 py-1"></td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(valueForChargeTaxTable?.amount)}</td>
                          {isIGST ? (
                            <>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstRateForTaxTable(valueForChargeTaxTable?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(Number(valueForChargeTaxTable?.taxAmount) || 0)}</td>
                            </>
                          ) : (
                            <>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(valueForChargeTaxTable?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">
                                {toDecimalString((Number(valueForChargeTaxTable?.taxAmount) || 0) / 2)}
                              </td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(valueForChargeTaxTable?.gst)}</td>
                              <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">
                                {toDecimalString((Number(valueForChargeTaxTable?.taxAmount) || 0) / 2)}
                              </td>
                            </>
                          )}
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(Number(valueForChargeTaxTable?.taxAmount) || 0)}</td>
                        </tr>
                      )}

                      {/* Total row */}
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-400 px-1 py-1 text-xs">Total</td>
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs">{calculateItemQty(data?.items)}</td>
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(hsnTaxableTotal)}</td>
                        {isIGST ? (
                          <>
                            <td className="border border-gray-400 px-1 py-1 text-center text-xs"></td>
                            <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(totalCalculations?.igst)}</td>
                          </>
                        ) : (
                          <>
                            <td className="border border-gray-400 px-1 py-1 text-center text-xs"></td>
                            <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(totalCalculations?.cgst)}</td>
                            <td className="border border-gray-400 px-1 py-1 text-center text-xs"></td>
                            <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(totalCalculations?.sgst)}</td>
                          </>
                        )}
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs max-w-0 break-all leading-tight">{toDecimalString(totalCalculations?.totalTax)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Totals Box */}
              <div className="w-full lg:w-[30%]">
                <div className="border border-gray-400 text-[12px]">
                  {!data?.isSplit && (
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%] min-w-0 flex-shrink">Basic Amount</span>
                      <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(itemsSubTotal)}</span>
                    </div>
                  )}

                  {data?.appliesTo === 'TRANSACTION' && !data?.isSplit && data?.discountConfig?.discountValue > 0 && (
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%] min-w-0 flex-shrink">{`Discount (${data?.discountConfig?.discountValue}${data?.discountConfig?.discountType === 'PERCENTAGE' ? '%' : data.currency.symbol})`}</span>
                      <span className="w-[40%] text-right min-w-0 flex-shrink break-all">
                        {data?.discountConfig?.discountValue && !isNaN(data?.discountConfig?.discountValue) && data?.discountConfig?.discountValue > 0
                          ? calculatediscountedValue(data?.items, data?.discountConfig?.discountType, data?.discountConfig?.discountValue)
                          : ''}
                      </span>
                    </div>
                  )}

                  {data?.additionalCharges
                    ?.filter(item => parseFloat(item?.amount || 0) !== 0)
                    ?.map(item => (
                      <div key={item?.name} className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                        <span className="font-bold w-[60%] min-w-0 flex-shrink">{`${item?.name} ${item?.taxRate ? `@${item?.taxRate}%` : ''}`}</span>
                        <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(parseFloat(item?.amount || 0))}</span>
                      </div>
                    ))}

                  {!data?.isSplit ? (
                    isIGST ? (
                      <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                        <span className="font-bold w-[60%] min-w-0 flex-shrink">IGST</span>
                        <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(totalCalculations?.igst)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                          <span className="font-bold w-[60%] min-w-0 flex-shrink">CGST</span>
                          <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(totalCalculations?.cgst)}</span>
                        </div>
                        <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                          <span className="font-bold w-[60%] min-w-0 flex-shrink">SGST</span>
                          <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(totalCalculations?.sgst)}</span>
                        </div>
                      </>
                    )
                  ) : null}

                  {!data?.isSplit && (
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%] min-w-0 flex-shrink">Total Tax</span>
                      <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(totalCalculations?.totalTax)}</span>
                    </div>
                  )}

                  {!data?.isSplit && data?.tax?.taxId && (
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%] min-w-0 flex-shrink">
                        {data.tax.type} {data.tax.paymentCode} ({data.tax.rate}%)
                      </span>
                      <span className="w-[40%] text-right min-w-0 flex-shrink break-all">
                        {data.tax.type === 'TDS' ? '- ' : '+ '}
                        {toDecimalString(data.tax.amount)}
                      </span>
                    </div>
                  )}

                  {data?.isRoundOff && data?.roundOffAmount !== 0 && (
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%] min-w-0 flex-shrink">Rounding</span>
                      <span className="w-[40%] text-right min-w-0 flex-shrink break-all">{toDecimalString(data?.roundOffAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start px-2 py-1 leading-tight">
                    <span className="font-bold w-[60%] min-w-0 flex-shrink">Document Total</span>
                    <span className="font-bold w-[40%] text-right min-w-0 flex-shrink break-all">
                      {data?.total ? formatAmount(data?.total, true, data?.currency) : data?.amount ? formatAmount(data?.amount, true, data?.currency) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BANK DETAILS ───────────────────────────────────────────────── */}
            {!isPortalOrder && !data?.isSplit && data?.bankAccountId?.accountName && (
              <div className="overflow-x-auto mt-5">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-[11px]">
                      <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide">Bank Name</th>
                      <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide">Account Code</th>
                      <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide">IFSC No</th>
                      <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide">Account Name</th>
                      <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide">Account No</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-xs">
                      <td className="border border-gray-400 py-1 text-start px-1">{data?.bankAccountId?.bankName || '-'}</td>
                      <td className="border border-gray-400 py-1 text-start px-1">{data?.bankAccountId?.accountCode || '-'}</td>
                      <td className="border border-gray-400 py-1 text-start px-1">{data?.bankAccountId?.ifsc || '-'}</td>
                      <td className="border border-gray-400 py-1 text-start px-1">{data?.bankAccountId?.accountName || '-'}</td>
                      <td className="border border-gray-400 py-1 text-start px-1">{data?.bankAccountId?.accountNumber || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Narration ───────────── */}
            {narrationText ? (
              <div className="mt-5">
                <p className="font-bold text-[12px] mb-1">Narration</p>
                <p className="text-xs">{narrationText}</p>
              </div>
            ) : null}

            {/* ── DISPATCH INFORMATION (Invoice only) ─────────────────────────── */}
            {pageType === pageTypes?.INVOICE && data?.dispatchDetails && (
              <div className="mt-5 border border-gray-400">
                <div className="px-3 py-2 border-b border-gray-400 bg-gray-100">
                  <h3 className="font-bold text-[12px] tracking-wide">Dispatch Information</h3>
                </div>
                <div className="px-3 py-3 grid grid-cols-2 gap-y-2 text-[12px]">
                  <p>
                    <span className="font-bold">Dispatch Mode :</span> {data?.dispatchDetails?.dispatchMode || '-'}
                  </p>
                  <p>
                    <span className="font-bold">Goods Booking Date :</span> {data?.dispatchDetails?.goodsBookingDate ? dayjs(data.dispatchDetails.goodsBookingDate).format('DD/MM/YYYY') : '-'}
                  </p>
                  <p>
                    <span className="font-bold">Approx Delivery Date :</span> {data?.dispatchDetails?.approxDeliveryDate ? dayjs(data.dispatchDetails.approxDeliveryDate).format('DD/MM/YYYY') : '-'}
                  </p>

                  {data?.dispatchDetails?.dispatchMode === 'Transport & Courier Service' && (
                    <>
                      <p>
                        <span className="font-bold">Transport Type :</span> {data?.dispatchDetails?.transportCourier?.transportType || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Transport & Courier :</span> {data?.dispatchDetails?.transportCourier?.transportId?.name || '-'}
                      </p>
                      <p>
                        <span className="font-bold">{data?.dispatchDetails?.transportCourier?.transportType === 'Transport' ? 'LR No' : 'Tracking Number'} :</span>{' '}
                        {data?.dispatchDetails?.transportCourier?.trackingNumber || '-'}
                      </p>
                      <p className="break-all">
                        <span className="font-bold">Tracking Link :</span> {data?.dispatchDetails?.transportCourier?.trackingLink || '-'}
                      </p>
                    </>
                  )}

                  {data?.dispatchDetails?.dispatchMode === 'Full Truck Load' && (
                    <>
                      <p>
                        <span className="font-bold">Truck Name & Type :</span> {data?.dispatchDetails?.truckLoad?.truckName || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Truck Number :</span> {data?.dispatchDetails?.truckLoad?.truckNumber || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Driver Name :</span> {data?.dispatchDetails?.truckLoad?.driverName || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Driver Contact :</span> {data?.dispatchDetails?.truckLoad?.driverContact || '-'}
                      </p>
                    </>
                  )}

                  {(data?.dispatchDetails?.dispatchMode === 'OurSelf Delivery' || data?.dispatchDetails?.dispatchMode === 'Pickup By Customer') && (
                    <>
                      <p>
                        <span className="font-bold">Delivery/Pickup Boy Name :</span> {data?.dispatchDetails?.selfDelivery?.deliveryBoyName || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Vehicle Number :</span> {data?.dispatchDetails?.selfDelivery?.vehicleNumber || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Driver Name :</span> {data?.dispatchDetails?.selfDelivery?.driverName || '-'}
                      </p>
                      <p>
                        <span className="font-bold">Driver Contact :</span> {data?.dispatchDetails?.selfDelivery?.driverContact || '-'}
                      </p>
                    </>
                  )}
                  {dispatchAttachments.map(attachment => (
                    <div key={attachment.label} className="col-span-2">
                      <p className="font-bold mb-1">{attachment.label} :</p>
                      <DisplayUploadedDocuments fileArray={attachment.files} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── FOOTER: Terms & Conditions + Authorized Signatory ──────────── */}
            {!isPortalOrder && (
              <div className="flex flex-col md:flex-row justify-between mt-5 pt-2">
                <div className="md:w-[60%]">
                  <p className="font-bold text-[12px] mb-1">Terms & Conditions:</p>
                  {data?.termsAndConditions && (
                    <ul className="space-y-0.5">
                      {data.termsAndConditions.split('\n').map((term, index) => (
                        <li key={index} className="text-[10px] leading-tight text-gray-800 break-words">
                          {term}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="md:w-[30%] flex flex-col items-center mt-4 md:mt-0">
                  <p className="text-[12px] mb-2">For {profile?.name}</p>
                  {data?.authorizedSignature && <img id="sign" alt="sign" className="h-[40px] mb-1" src={data?.authorizedSignature} />}
                  <p className="font-bold text-[12px]">Authorized Signatory</p>
                </div>
              </div>
            )}

            {/* ── E-WAY BILL FULL SECTION ────────────────────────────────────── */}
            {data?.eWayBill && (isEinvoicingAvailable || isEwayBillingAvailable) && (
              <div className="border-t border-gray-400 mt-4 pt-3 px-3 py-3">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-400 pb-3 mb-2">
                  <div>
                    <h3 className="text-[12px] font-bold mb-1 uppercase tracking-wide">e-Way Bill</h3>
                    <p className="text-[12px]">
                      <span className="font-medium">Doc No :</span> {data?.[numberId] || '-'}
                    </p>
                    <p className="text-[12px]">
                      <span className="font-medium">Date :</span> {data?.[date] ? dayjs(data?.[date]).format('DD/MM/YYYY') : '-'}
                    </p>
                    {data?.eInvoice?.irn && (
                      <>
                        <p className="text-[12px]">
                          <span className="font-medium">IRN :</span> {data?.eInvoice?.irn}
                        </p>
                        <p className="text-[12px]">
                          <span className="font-medium">Ack No :</span> {data?.eInvoice?.ackNo}
                        </p>
                        <p className="text-[12px]">
                          <span className="font-medium">Ack Date :</span> {dayjs(data?.eInvoice?.ackDate).format('DD/MM/YYYY') || '-'}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <div className="border border-gray-400 p-1 bg-white">
                      <QRCodeCanvas
                        value={`EWayBillNo:${data?.eWayBill?.eWayBillNo || '-'}|Date:${dayjs(data?.eWayBill?.eWayBillDate).format(
                          'DD-MMM-YY HH:mm:ss'
                        )}|TransporterID:${data?.eWayBill?.transporterId || '-'}`}
                        size={90}
                        includeMargin={false}
                        level="M"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 1: E-Way Bill Details */}
                <div className="mt-3 border-b border-gray-400 pb-3">
                  <h4 className="font-bold text-[12px] mb-2">1. E-Way Bill Details</h4>
                  <div className="grid grid-cols-2 gap-y-[2px] text-[12px]">
                    <p>
                      <span className="font-medium">e-Way Bill No :</span> {data?.eWayBill?.eWayBillNo || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Generated Date :</span> {dayjs(data?.eWayBill?.eWayBillDate).format('DD-MMM-YY hh:mm A') || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Mode :</span> {TRANSPORT_MODES[data?.eWayBill?.transportMode] || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Valid Upto :</span> {data?.eWayBill?.eWayBillExpiryDate ? dayjs(data?.eWayBill?.eWayBillExpiryDate).format('DD-MMM-YY hh:mm A') : '-'}
                    </p>
                    <p>
                      <span className="font-medium">Generated By :</span> {data?.companyGstin || profile?.gstNumber || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Supply Type :</span> {data?.eWayBill?.supplyType ? SUPPLY_TYPE_OPTIONS.find(o => o.value === data?.eWayBill?.supplyType)?.label : '-'}
                      {' - '}
                      {data?.eWayBill?.subSupplyType ? SUB_SUPPLY_TYPE_OPTIONS.find(o => o.value === data?.eWayBill?.subSupplyType)?.label : '-'}
                    </p>
                    <p>
                      <span className="font-medium">Approx Distance :</span> {data?.eWayBill?.distance ? `${data?.eWayBill?.distance} KM` : '-'}
                    </p>
                    <p>
                      <span className="font-medium">Status :</span> {E_WAY_BILL_STATUS[data?.eWayBill?.status]?.label || data?.eWayBill?.status || '-'}
                    </p>
                  </div>
                </div>

                {/* Section 2: Address Details */}
                <div className="mt-3 border-b border-gray-400 pb-3">
                  <h4 className="font-bold text-[12px] mb-2">2. Address Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* From */}
                    <div className="border border-gray-400 rounded">
                      <div className="bg-gray-100 font-bold text-[11px] px-2 py-1 border-b border-gray-400">From</div>
                      <div className="p-2 text-[12px]">
                        <p>{eWayBillMovement.from?.name}</p>
                        <p>GSTIN: {eWayBillMovement.from?.gstin || '-'}</p>
                        <p>{eWayBillMovement.from?.state}</p>
                      </div>
                    </div>
                    {/* To */}
                    <div className="border border-gray-400 rounded">
                      <div className="bg-gray-100 font-bold text-[11px] px-2 py-1 border-b border-gray-400">To</div>
                      <div className="p-2 text-[12px]">
                        <p>{eWayBillMovement.to?.name}</p>
                        <p>GSTIN: {eWayBillMovement.to?.gstin || '-'}</p>
                        <p>{eWayBillMovement.to?.state}</p>
                      </div>
                    </div>
                    {/* Dispatch From */}
                    <div className="border border-gray-400 rounded">
                      <div className="bg-gray-100 font-bold text-[11px] px-2 py-1 border-b border-gray-400">Dispatch From</div>
                      <div className="p-2 text-[12px]">
                        <p>{formatEWayBillAddress(eWayBillMovement.dispatchFrom)}</p>
                      </div>
                    </div>
                    {/* Ship To */}
                    <div className="border border-gray-400 rounded">
                      <div className="bg-gray-100 font-bold text-[11px] px-2 py-1 border-b border-gray-400">Ship To</div>
                      <div className="p-2 text-[12px]">
                        <p>{formatEWayBillAddress(eWayBillMovement.shipTo)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Goods Details */}
                <div className="mt-3 border-b border-gray-400 pb-3">
                  <h4 className="font-bold text-[12px] mb-2">3. Goods Details</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white text-[12px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-400 px-1 py-1 text-left font-bold">HSN Code</th>
                          <th className="border border-gray-400 px-1 py-1 text-left font-bold">Product Name & Desc</th>
                          <th className="border border-gray-400 px-1 py-1 text-right font-bold">Quantity</th>
                          <th className="border border-gray-400 px-1 py-1 text-right font-bold">Taxable Amt ({data.currency.symbol})</th>
                          <th className="border border-gray-400 px-1 py-1 text-right font-bold">Tax Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-400 px-1 py-1">{item?.hsnCode || 'N/A'}</td>
                            <td className="border border-gray-400 px-1 py-1">{item?.itemName || item?.description}</td>
                            <td className="border border-gray-400 px-1 py-1 text-right">
                              <div>
                                <div>{item?.quantity || '-'}</div>
                                {getItemUnitName(item) && <div className="text-[10px] text-gray-500">{getItemUnitName(item)}</div>}
                              </div>
                            </td>
                            <td className="border border-gray-400 px-1 py-1 text-right">{toDecimalString(item?.amount) || '0.00'}</td>
                            <td className="border border-gray-400 px-1 py-1 text-right">{item?.gst != null ? formatGstForDisplay(item.gst) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals summary */}
                  <div className="border-t border-b border-gray-400 py-1 mt-2 text-[12px]">
                    <div className="flex flex-wrap gap-x-6">
                      <p>
                        <span className="font-medium">Total Taxable Amt</span> :{' '}
                        <span className="font-bold">
                          {totalCalculations?.totalTaxablevalue?.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Other Amt</span> :{' '}
                        <span className="font-bold">
                          {(data?.roundOffAmount || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Total Inv Amt</span> :{' '}
                        <span className="font-bold">
                          {Math.round(totalCalculations?.total)?.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          }) || '0.00'}
                        </span>
                      </p>
                    </div>
                    {isIGST ? (
                      <p className="mt-1">
                        <span className="font-medium">IGST Amt</span> :{' '}
                        <span className="font-bold">
                          {totalCalculations?.igst?.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    ) : (
                      <div className="flex gap-x-6 mt-1">
                        <p>
                          <span className="font-medium">CGST Amt</span> :{' '}
                          <span className="font-bold">
                            {totalCalculations?.cgst?.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">SGST Amt</span> :{' '}
                          <span className="font-bold">
                            {totalCalculations?.sgst?.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Transportation Details */}
                <div className="mt-3 border-b border-gray-400 pb-3">
                  <h4 className="font-bold text-[12px] mb-2">4. Transportation Details</h4>
                  <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                    <p>
                      <span className="font-medium">Transporter ID :</span> {data?.eWayBill?.transporterId || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Transporter Name :</span> {data?.eWayBill?.transporterName || '-'}
                    </p>
                  </div>
                </div>

                {/* Section 5: Vehicle Details */}
                <div className="mt-3">
                  <h4 className="font-bold text-[12px] mb-2">5. Vehicle Details</h4>
                  {data?.eWayBill?.transportMode === '1' && (
                    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                      <p>
                        <span className="font-medium">Vehicle No :</span> {data?.eWayBill?.vehicleNumber || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Vehicle Type :</span> {data?.eWayBill?.vehicleType || '-'}
                      </p>
                    </div>
                  )}
                  {data?.eWayBill?.transportMode === '2' && (
                    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                      <p>
                        <span className="font-medium">Railway Receipt (RR) Number :</span> {data?.eWayBill?.railwayReceiptNumber || '-'}
                      </p>
                      <p>
                        <span className="font-medium">RR Date :</span> {dayjs(data?.eWayBill?.railwayReceiptDate).format('DD/MM/YYYY') || '-'}
                      </p>
                    </div>
                  )}
                  {data?.eWayBill?.transportMode === '3' && (
                    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                      <p>
                        <span className="font-medium">Airway Bill (AWB) Number :</span> {data?.eWayBill?.airwayBillNumber || '-'}
                      </p>
                      <p>
                        <span className="font-medium">AWB Date :</span> {dayjs(data?.eWayBill?.airwayBillDate).format('DD/MM/YYYY') || '-'}
                      </p>
                    </div>
                  )}
                  {data?.eWayBill?.transportMode === '4' && (
                    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
                      <p>
                        <span className="font-medium">Bill of Lading (BL) Number :</span> {data?.eWayBill?.seawayBillNumber || '-'}
                      </p>
                      <p>
                        <span className="font-medium">BL Date :</span> {dayjs(data?.eWayBill?.seawayBillDate).format('DD/MM/YYYY') || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Branding */}
          <div className="mt-5 flex items-center">
            <p className="text-[10px]">Powered by</p>
            <img src={brandingLogo} alt="brandingLogo" className="w-[90px]" />
          </div>
        </Card>
      </div>
      {viewItemDetail && (
        <ItemDrawerDetails
          viewItemDetail={viewItemDetail}
          setViewItemDetail={setViewItemDetail}
          itemData={selectedItemData}
          customerId={isPurchaseModule ? undefined : customerDetails?.id || customerDetails?._id}
          customerName={isPurchaseModule ? undefined : customerDetails?.customerDisplayName || customerDetails?.companyName}
          vendorId={isPurchaseModule ? customerDetails?.id || customerDetails?._id : undefined}
          vendorName={isPurchaseModule ? customerDetails?.customerDisplayName || customerDetails?.vendorDisplayName || customerDetails?.companyName : undefined}
          pageType={pageType}
        />
      )}
    </>
  );
};

export default SalesModuleDetailView;
