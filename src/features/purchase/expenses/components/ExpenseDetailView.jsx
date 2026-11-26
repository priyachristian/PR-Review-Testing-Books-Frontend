import { useEffect } from 'react';
import { Card } from '@/components/AntDComponent';
import { formatAmount, toDecimalString } from '@/utils/currency';
import { formatGstForDisplay, formatGstHalfRateForTaxTable, formatGstRateForTaxTable } from '@/utils/gstDisplay';

const ExpenseDetailView = ({ data, profile }) => {
  const party = data?.party;
  const refTitle = party?.Role?.isVendor ? 'Vendor' : 'Customer';
  const partyTaxId = party?.otherDetails?.gstinUin || party?.otherDetails?.registeredBusinessValue || party?.otherDetails?.pan;
  const isIgst = data?.taxSplit === 'IGST';

  // An old expense has one account and amount and no lines.
  const lines = data?.lines?.length ? data.lines : [{ accountName: data?.expenseAccount?.accountName || data?.expenseAccountName, baseAmount: data?.total, taxAmount: 0, gst: 'none' }];

  // Group tax rows by HSN/SAC and GST rate.
  const taxRows = lines.reduce((rows, line) => {
    const hsnCode = line.hsnCode || '-';
    const row = rows.find(item => item.hsnCode === hsnCode && item.gst === line.gst);

    if (row) {
      row.taxableValue += Number(line.baseAmount) || 0;
      row.taxAmount += Number(line.taxAmount) || 0;
    } else {
      rows.push({
        hsnCode,
        gst: line.gst,
        taxableValue: Number(line.baseAmount) || 0,
        taxAmount: Number(line.taxAmount) || 0,
      });
    }

    return rows;
  }, []);

  const totalTax = Number(data?.totalTax) || 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row justify-between text-[#111827]">
      <Card className="w-full my-container">
        <div className="border border-gray-400 bg-white p-3 text-[12px] leading-[1.35]">
          {/* ── HEADER: Voucher details (left) + Company info (right) ─────── */}
          <div className="flex flex-col lg:flex-row gap-2 items-start py-2 px-3 border-b border-gray-400 mb-2">
            <div className="w-full lg:w-[45%]">
              <h2 className="text-[15px] font-bold mt-8 mb-2 pt-1 pb-1 border-t border-b border-gray-400 uppercase tracking-wide">Expenses</h2>
              <div className="grid grid-cols-[44.5%_60%] gap-y-[6px] text-gray-800 text-[12px]">
                <p className="font-bold">Expenses No</p>
                <p>: {data?.expenseId || '-'}</p>

                <p className="font-bold">{refTitle} No</p>
                <p>: {party?.customerNumber || '-'}</p>

                <p className="font-bold">{refTitle} Name</p>
                <p className="break-words whitespace-normal">: {party?.customerDisplayName || party?.personName || '-'}</p>

                {partyTaxId && (
                  <>
                    <p className="font-bold">{party?.otherDetails?.gstinUin || party?.otherDetails?.registeredBusinessValue ? 'GST No' : 'PAN No'}</p>
                    <p>: {partyTaxId}</p>
                  </>
                )}

                <p className="font-bold">Date</p>
                <p>: {data?.date ? new Date(data.date).toLocaleDateString('en-GB') : '-'}</p>

                <p className="font-bold">Paid Through</p>
                <p>: {data?.paidThroughAccountId?.accountName || '-'}</p>

                {data?.invoiceNo && (
                  <>
                    <p className="font-bold">Invoice No</p>
                    <p>: {data.invoiceNo}</p>
                  </>
                )}

                {data?.invoiceDate && (
                  <>
                    <p className="font-bold">Invoice Date</p>
                    <p>: {new Date(data.invoiceDate).toLocaleDateString('en-GB')}</p>
                  </>
                )}

                {data?.supplierGstin && (
                  <>
                    <p className="font-bold">Supplier GSTIN</p>
                    <p>: {data.supplierGstin}</p>
                  </>
                )}

                <p className="font-bold">{refTitle} Contact No</p>
                <p>: {party?.customerPhoneNumber || party?.phoneNo || '-'}</p>
              </div>
            </div>

            <div className="flex lg:justify-end w-full lg:w-[55%]">
              <div className="lg:text-end">
                {(data?.companyLogo || profile?.companyLogo) && <img src={data?.companyLogo || profile?.companyLogo} className="h-10 w-auto mb-1 ml-auto" alt="companylogo" />}
                <h1 className="text-[18px] font-bold">{profile?.name}</h1>
                <div className="max-w-[355px]">
                  <p className="text-[12px]">{`${profile?.address?.street1 || ''}${profile?.address?.street2 ? `, ${profile?.address?.street2}` : ''}`}</p>
                </div>
                <p className="text-[12px]">
                  {profile?.address?.city || ''}
                  {profile?.address?.pinCode ? ` - ${profile?.address?.pinCode}` : ''}
                </p>
                <p className="text-[12px]">{profile?.address?.state || ''}</p>
                {(data?.companyGstin || profile?.gstNumber) && <p className="text-[12px]">GSTIN : {data?.companyGstin || profile?.gstNumber}</p>}
                {profile?.panNumber && <p className="text-[12px]">PAN No: {profile?.panNumber}</p>}
                {profile?.contactPhone && <p className="text-[12px]">Contact No: {profile?.contactPhone}</p>}
                <p className="text-[12px]">Branch Name: {data?.branchName || '-'}</p>
              </div>
            </div>
          </div>

          {/* ── LINES TABLE ────────────────────────────────────────────────── */}
          <div className="mt-5">
            <table className="w-full table-fixed border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 text-[11px]">
                  <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[4%]">#</th>
                  <th className="border border-gray-400 py-1 text-start px-1 font-bold uppercase tracking-wide max-w-0 break-words whitespace-normal">Description</th>
                  <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[12%] max-w-0 break-all whitespace-normal">HSN/SAC</th>
                  <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[12%]">Tax Rate(%)</th>
                  <th className="border border-gray-400 py-1 text-start px-1 font-bold border-b uppercase tracking-wide w-[14%] max-w-0 break-all whitespace-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {lines.map((line, index) => (
                  <tr key={index} className="border-b border-gray-200 odd:bg-gray-50">
                    <td className="border border-gray-400 py-1 text-start px-1">{index + 1}</td>
                    <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-words whitespace-normal">
                      <div className="break-words whitespace-normal">{line.accountName}</div>
                      {line.description && <div className="text-[10px] text-gray-500 mt-0.5 break-words whitespace-normal">({line.description})</div>}
                    </td>
                    <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal">{line.hsnCode || 'N/A'}</td>
                    <td className="border border-gray-400 py-1 text-start px-1">{formatGstForDisplay(line.gst)}</td>
                    <td className="border border-gray-400 py-1 text-start px-1 max-w-0 break-all whitespace-normal leading-tight">{toDecimalString(line.baseAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── TAX SUMMARY + TOTALS ──────────────────────────────────────── */}
          <div className="flex flex-col gap-y-2 lg:gap-y-0 lg:gap-x-2 lg:flex-row lg:justify-between mt-5">
            <div className="overflow-x-auto w-full lg:w-[65%]">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100 text-[11px]">
                    <th className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">HSN/SAC</th>
                    <th className="border border-gray-400 px-1 py-1 font-bold border-b uppercase tracking-wide">Taxable value</th>
                    {isIgst ? (
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
                    <th className="border border-gray-400 px-1 py-1 font-medium">Rate</th>
                    <th className="border border-gray-400 px-1 py-1 font-medium">Amount</th>
                    {!isIgst && (
                      <>
                        <th className="border border-gray-400 px-1 py-1 font-medium">Rate</th>
                        <th className="border border-gray-400 px-1 py-1 font-medium">Amount</th>
                      </>
                    )}
                    <th className="border border-gray-400 px-1 py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {taxRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-400 px-1 py-1 text-xs">{row.hsnCode}</td>
                      <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(row.taxableValue)}</td>
                      {isIgst ? (
                        <>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstRateForTaxTable(row.gst)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(row.taxAmount)}</td>
                        </>
                      ) : (
                        <>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(row.gst)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(row.taxAmount / 2)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{formatGstHalfRateForTaxTable(row.gst)}</td>
                          <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(row.taxAmount / 2)}</td>
                        </>
                      )}
                      <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(row.taxAmount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-400 px-1 py-1 text-xs">Total</td>
                    <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(data?.subTotal ?? data?.total)}</td>
                    {isIgst ? (
                      <>
                        <td className="border border-gray-400 px-1 py-1"></td>
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(data?.igst)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-400 px-1 py-1"></td>
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(data?.cgst)}</td>
                        <td className="border border-gray-400 px-1 py-1"></td>
                        <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(data?.sgst)}</td>
                      </>
                    )}
                    <td className="border border-gray-400 px-1 py-1 text-right text-xs">{toDecimalString(totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="w-full lg:w-[30%]">
              <div className="border border-gray-400 text-[12px]">
                <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                  <span className="font-bold w-[60%]">Basic Amount</span>
                  <span className="w-[40%] text-right break-all">{toDecimalString(data?.subTotal ?? data?.total)}</span>
                </div>
                {isIgst ? (
                  <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                    <span className="font-bold w-[60%]">IGST</span>
                    <span className="w-[40%] text-right break-all">{toDecimalString(data?.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%]">CGST</span>
                      <span className="w-[40%] text-right break-all">{toDecimalString(data?.cgst)}</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                      <span className="font-bold w-[60%]">SGST</span>
                      <span className="w-[40%] text-right break-all">{toDecimalString(data?.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                  <span className="font-bold w-[60%]">Total Tax</span>
                  <span className="w-[40%] text-right break-all">{toDecimalString(totalTax)}</span>
                </div>
                {data?.tax?.taxId && (
                  <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                    <span className="font-bold w-[60%]">
                      {data.tax.type} {data.tax.paymentCode} ({data.tax.rate}%)
                    </span>
                    <span className="w-[40%] text-right break-all">
                      {data.tax.type === 'TDS' ? '- ' : '+ '}
                      {toDecimalString(data.tax.amount)}
                    </span>
                  </div>
                )}
                {data?.isRoundOff && data?.roundOffAmount !== 0 && (
                  <div className="flex justify-between items-start border-b border-gray-400 px-2 py-1 leading-tight">
                    <span className="font-bold w-[60%]">Rounding</span>
                    <span className="w-[40%] text-right break-all">{toDecimalString(data.roundOffAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-start px-2 py-1 leading-tight">
                  <span className="font-bold w-[60%]">Document Total</span>
                  <span className="font-bold w-[40%] text-right break-all">{formatAmount(data?.total || 0, true, data?.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {data?.notes && (
            <div className="mt-5">
              <p className="font-bold text-[12px] mb-1">Narration</p>
              <p className="text-xs">{data.notes}</p>
            </div>
          )}

          {/* ── FOOTER: Terms & Conditions + Authorized Signatory ──────────── */}
          <div className="flex justify-between items-start mt-5">
            <div className="w-[60%]">
              <p className="font-bold text-[12px] mb-1">Terms & Conditions:</p>
              {data?.termsAndConditions && <p className="text-xs whitespace-pre-wrap">{data.termsAndConditions}</p>}
            </div>
            <div className="text-center">
              <p className="text-[12px] mb-1">For {profile?.name}</p>
              {data?.authorizedSignature && <img alt="sign" className="h-[40px] mb-1 mx-auto" src={data.authorizedSignature} />}
              <p className="font-bold text-[12px]">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExpenseDetailView;
