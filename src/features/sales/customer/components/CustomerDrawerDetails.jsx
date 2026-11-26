import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Components
import { Button, Drawer, Tabs, Tooltip } from '@/components/AntDComponent';
import CustomerDrawerDetailsSkeleton from './CustomerDrawerDetailsSkeleton';
import DetailField from '@/components/ui/common/DetailField';

// Hooks

// Extras
import { useCustomer } from '@/features/sales/customer';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { formatAverageDaysToPayment } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import { appendNavigationState, buildNavigationState } from '@/utils/navigationHistory';
import { RESTRICTION_DOCUMENT_LABELS } from '@/utils/constants';

const formatStreetAddress = address => {
  const street1 = address?.address?.street1;
  const street2 = address?.address?.street2;
  if (!street1 && !street2) return undefined;
  return `${street1 || ''} ${street2 || ''}`.trim();
};

const AddressFields = ({ address }) => (
  <div className="mt-1 space-y-3">
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
      <DetailField label="Attention" value={address?.attention} />
      <DetailField label="Country / Region" value={address?.country} />
      <DetailField label="Address" value={formatStreetAddress(address)} />
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
      <DetailField label="City" value={address?.city} />
      <DetailField label="State" value={address?.state} />
      <DetailField label="Pin Code" value={address?.pinCode} />
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
      <DetailField label="Fax Number" value={address?.faxNumber} />
      <DetailField label="Phone Number" value={address?.phone} />
    </div>
  </div>
);

const CustomerDrawerDetails = ({ viewCustomerDetail, setViewCustomerDetail, customerData, onBack, isVendor }) => {
  const location = useLocation();
  const { getCustomerBriefDetail, customerBriefDetail, resetCustomerBriefDetail, loading } = useCustomer();

  useEffect(() => {
    const controller = new AbortController();

    if (customerData?.id) {
      getCustomerBriefDetail({
        customerId: customerData?.id,
        signal: controller.signal,
      });
    }
    return () => {
      resetCustomerBriefDetail();
      controller.abort();
    };
  }, [customerData?.id]);

  const outstandingReceivable = customerBriefDetail?.branch?.reduce((total, branch) => total + (branch?.currentBalance || 0), 0);

  const renderAddressSection = (title, address) => (
    <div className="mt-2">
      <p className="font-bold text-base">{title}</p>
      <AddressFields address={address} />
    </div>
  );

  const renderBranchDetails = () => {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Branch</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm bg-white border border-gray-200">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Division</th>
                <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Branch</th>
                {customerBriefDetail?.useBranchCreditLimit && <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Credit Limit</th>}
                <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Current Balance</th>
                <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Opening Balance</th>
                {customerBriefDetail?.useBranchCreditLimit && <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Restriction Document</th>}
                {customerBriefDetail?.useBranchPaymentTerms && <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Payment Terms</th>}
                {customerBriefDetail?.useBranchPaymentTerms && (
                  <th className="py-2 px-2 text-left font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Restriction Payment Terms Document</th>
                )}
              </tr>
            </thead>
            <tbody>
              {customerBriefDetail?.branch?.map(item => (
                <tr key={item?.branchId?._id} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 max-w-[140px]">
                    <Tooltip title={item?.divisionId?.name || '-'} placement="topLeft">
                      <span className="block truncate">{item?.divisionId?.name || '-'}</span>
                    </Tooltip>
                  </td>
                  <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 max-w-[140px]">
                    <Tooltip title={item?.branchId?.name || '-'} placement="topLeft">
                      <span className="block truncate">{item?.branchId?.name || '-'}</span>
                    </Tooltip>
                  </td>
                  {customerBriefDetail?.useBranchCreditLimit && (
                    <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 whitespace-nowrap">{formatAmount(item?.creditLimit, true, customerBriefDetail?.currency)}</td>
                  )}
                  <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 whitespace-nowrap">{formatAmount(item?.currentBalance, true, customerBriefDetail?.currency)}</td>
                  <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 whitespace-nowrap">{formatAmount(item?.openingBalance, true, customerBriefDetail?.currency)}</td>
                  {customerBriefDetail?.useBranchCreditLimit && (
                    <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 max-w-[180px]">
                      <Tooltip title={item?.restrictedModule?.length > 0 ? item?.restrictedModule?.map(m => RESTRICTION_DOCUMENT_LABELS[m] || m).join(', ') : '-'} placement="topLeft">
                        <span className="block truncate">{item?.restrictedModule?.length > 0 ? item?.restrictedModule?.map(m => RESTRICTION_DOCUMENT_LABELS[m] || m).join(', ') : '-'}</span>
                      </Tooltip>
                    </td>
                  )}
                  {customerBriefDetail?.useBranchPaymentTerms && (
                    <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 max-w-[120px]">
                      <Tooltip title={item?.paymentTermsId?.name || '-'} placement="topLeft">
                        <span className="block truncate">{item?.paymentTermsId?.name || '-'}</span>
                      </Tooltip>
                    </td>
                  )}
                  {customerBriefDetail?.useBranchPaymentTerms && (
                    <td className="py-2 px-2 text-[13px] font-medium text-[#1e293b] leading-5 max-w-[180px]">
                      <Tooltip
                        title={item?.restrictedPaymentTermsModule?.length > 0 ? item?.restrictedPaymentTermsModule?.map(m => RESTRICTION_DOCUMENT_LABELS[m] || m).join(', ') : '-'}
                        placement="topLeft"
                      >
                        <span className="block truncate">
                          {item?.restrictedPaymentTermsModule?.length > 0 ? item?.restrictedPaymentTermsModule?.map(m => RESTRICTION_DOCUMENT_LABELS[m] || m).join(', ') : '-'}
                        </span>
                      </Tooltip>
                    </td>
                  )}
                </tr>
              ))}
              {(!customerBriefDetail?.branch || customerBriefDetail?.branch?.length === 0) && (
                <tr>
                  <td className="py-3 px-2 text-center text-gray-500" colSpan={7}>
                    No branch found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const Overview = () => {
    return (
      <div className="space-y-3">
        {/* General Information */}
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>
          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Company Name" value={customerBriefDetail?.companyName} />
              <DetailField label="Customer Display Name" value={customerData?.customerDisplayName} />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Email" value={customerBriefDetail?.bpEmail} />
              <DetailField label="Phone" value={customerBriefDetail?.customerPhoneNumber} />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Financials</p>
          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Outstanding Receivable" value={formatAmount(outstandingReceivable, true, customerBriefDetail?.currency)} />
              <DetailField label="Unused Credit" value={formatAmount(customerBriefDetail?.unusedCredit, true, customerBriefDetail?.currency)} />
              {!customerBriefDetail?.useBranchCreditLimit && <DetailField label="Credit Limit" value={formatAmount(customerBriefDetail?.creditLimit)} />}
            </div>
          </div>
        </div>

        {/* Payment Analytics — customers only, not vendors */}
        {!isVendor && (
          <div className="my-container container-spacing">
            <p className="font-bold text-lg">Payment Analytics</p>
            <div className="mt-2 grid md:grid-cols-2 gap-y-3">
              <DetailField
                label="Avg Invoice to Payment Days"
                labelSuffix={
                  <Tooltip
                    placement="top"
                    title={
                      <div className="space-y-1 text-xs normal-case tracking-normal font-normal">
                        <p className="font-semibold">Simple Average</p>
                        <p>Formula: Total days across all paid invoices ÷ Number of paid invoices</p>
                        <p className="mt-1 font-semibold">Why it matters</p>
                        <p>Shows the typical payment cycle. Use it to set collection timelines and flag customers who consistently pay late.</p>
                      </div>
                    }
                  >
                    <Icons.InfoCircleOutlined className="text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" />
                  </Tooltip>
                }
                value={formatAverageDaysToPayment(customerBriefDetail?.averageDaysToPayment) !== '' ? `${formatAverageDaysToPayment(customerBriefDetail?.averageDaysToPayment)} days` : undefined}
              />
              <DetailField
                label="Weighted Avg Days to Payment"
                labelSuffix={
                  <Tooltip
                    placement="top"
                    title={
                      <div className="space-y-1 text-xs normal-case tracking-normal font-normal">
                        <p className="font-semibold">Weighted Average</p>
                        <p>Formula: Σ(days × invoice amount) ÷ Σ(invoice amount)</p>
                        <p className="mt-1 font-semibold">Why it matters</p>
                        <p>Larger invoices carry more weight. A customer who delays big invoices shows a higher weighted average — a stronger signal of actual credit risk.</p>
                      </div>
                    }
                  >
                    <Icons.InfoCircleOutlined className="text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" />
                  </Tooltip>
                }
                value={
                  formatAverageDaysToPayment(customerBriefDetail?.weightedAvgDaysToPayment) !== '' ? `${formatAverageDaysToPayment(customerBriefDetail?.weightedAvgDaysToPayment)} days` : undefined
                }
              />
            </div>
          </div>
        )}

        {/* Credit & Terms */}
        {(!customerBriefDetail?.useBranchCreditLimit || !customerBriefDetail?.useBranchPaymentTerms) && (
          <div className="my-container container-spacing">
            <p className="font-bold text-lg">Credit &amp; Terms</p>
            <div className="mt-2 space-y-3">
              {!customerBriefDetail?.useBranchCreditLimit && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                  <DetailField
                    label="Restriction Document"
                    value={customerBriefDetail?.restrictedModule?.length > 0 ? customerBriefDetail.restrictedModule.map(i => RESTRICTION_DOCUMENT_LABELS[i] || i).join(', ') : undefined}
                  />
                </div>
              )}
              {!customerBriefDetail?.useBranchPaymentTerms && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                  <DetailField label="Payment Terms" value={customerBriefDetail?.paymentTermsId?.name} />
                  <DetailField
                    label="Restriction Payment Terms Document"
                    value={
                      customerBriefDetail?.restrictedPaymentTermsModule?.length > 0
                        ? customerBriefDetail.restrictedPaymentTermsModule.map(i => RESTRICTION_DOCUMENT_LABELS[i] || i).join(', ')
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Address = () => {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Address</p>

        {renderAddressSection('Billing Address', customerBriefDetail?.address?.billing)}

        <div className="mt-7">{renderAddressSection('Shipping Address', customerBriefDetail?.address?.shipping)}</div>
      </div>
    );
  };

  return (
    <div className="font-sans">
      <Drawer
        closable={false}
        title={
          <div className="flex items-center justify-between gap-4 w-full py-2">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                <Icons.UserOutlined style={{ color: colorPalette.primary[500] }} />

                <Tooltip title={customerData?.customerDisplayName}>
                  <span className="ml-2 text-base font-bold text-gray-900 truncate max-w-[250px] cursor-pointer">{customerData?.customerDisplayName || 'Details'}</span>
                </Tooltip>
              </div>
              <Button
                type="default"
                size="middle"
                icon={<Icons.ExportOutlined style={{ color: colorPalette.primary[500] }} />}
                onClick={() => {
                  if (customerData?.id) {
                    const basePath = isVendor ? 'vendors' : 'customer-master';
                    const detailPath = appendNavigationState(`/${basePath}/${customerData.id}`, buildNavigationState(location));
                    window.open(detailPath, '_blank', 'noopener,noreferrer');
                  }
                  setViewCustomerDetail(false);
                  if (onBack) {
                    onBack();
                  }
                }}
                className="flex items-center justify-center shrink-0"
              >
                View More Details
              </Button>
            </div>
            <CloseIconButton onClick={() => setViewCustomerDetail(false)} />
          </div>
        }
        onClose={() => setViewCustomerDetail(false)}
        open={viewCustomerDetail}
        maskClosable={true}
        width={800}
        styles={{
          body: { padding: '0px', background: '#f8fafc' },
          header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb' },
        }}
      >
        {loading ? (
          <CustomerDrawerDetailsSkeleton />
        ) : (
          <div className="px-4 py-3">
            <Tabs
              defaultActiveKey="1"
              items={[
                {
                  key: '1',
                  label: 'Overview',
                  children: (
                    <div className="space-y-6">
                      <Overview />
                      {renderBranchDetails()}
                    </div>
                  ),
                },
                { key: '2', label: 'Address', children: <Address /> },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomerDrawerDetails;
