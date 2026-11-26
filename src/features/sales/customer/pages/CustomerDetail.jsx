import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import BackButton from '@/components/ui/button/BackButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ApplyOpeningBalanceCreditModal from '@/components/feedback/formModal/ApplyOpeningBalanceCreditModal';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomInput from '@/components/forms/formInput/CustomInput';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';
import { Button, Collapse, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { ActionButtons, DetailField } from '@/components/ui';
import CustomerDetailSkeleton from '../components/CustomerDetailSkeleton';
import AddContactPerson from '../components/AddContactPerson';
import Icons from 'assets/icons/icon';
// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { CommentHistory } from '@/features/common/comment';
import { useInvoice } from '@/features/sales/invoice/useInvoice';
import { useBill } from '@/features/purchase/bills/useBill';

// Extras
import {
  useCustomer,
  openingBalancePaymentHistoryColumns,
  buildBusinessPartnerTeamBody,
  getBusinessPartnerTeamMemberDetails,
  getCustomerDocumentDetails,
  isCustomerLinkedToVendor,
  isVendorLinkedToCustomer,
} from '@/features/sales/customer';
import { colorPalette } from '@/utils/theme';
import { useProfile } from '@/features/setting/profile/useProfile';
import { RESOURCES } from '@/utils/jsonFile';
import { formatAmount } from '@/utils/currency';
import {
  ADDITIONAL_FEATURES,
  CONTACT_TYPE,
  CUSTOMER_VERIFICATION_STATUS,
  FEATURE_NAMES,
  MODULE_NAMES,
  PARTY_ACCOUNT_TYPES,
  PARTY_ACCOUNT_TYPE_LABELS,
  RESTRICTION_DOCUMENT_LABELS,
  PERMISSION_MESSAGES,
} from '@/utils/constants';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { CUSTOMER_DETAIL_TABS } from '@/utils/tabs';
import { dateFormateForUi } from 'utils/services';
import Toast from '@/components/ui/common/Toast';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { readNavigationState, stripNavigationStateParam } from '@/utils/navigationHistory';

const TRANSACTION_COUNT_FIELDS = [
  { key: 'quote', label: 'Quote', path: `/${ADMIN_ROUTE_PATHS.quotes.root}` },
  { key: 'salesOrder', label: 'Sales Order', path: `/${ADMIN_ROUTE_PATHS.salesOrders.root}` },
  { key: 'deliveryChallan', label: 'Delivery Challan', path: `/${ADMIN_ROUTE_PATHS.deliveryChallans.root}` },
  { key: 'invoice', label: 'Invoice', path: `/${ADMIN_ROUTE_PATHS.invoices.root}` },
  { key: 'paymentReceived', label: 'Payment Received', path: `/${ADMIN_ROUTE_PATHS.paymentsReceived.root}` },
  { key: 'creditNote', label: 'Credit Note', path: `/${ADMIN_ROUTE_PATHS.creditNotes.root}` },
  { key: 'purchaseOrder', label: 'Purchase Order', path: `/${ADMIN_ROUTE_PATHS.purchaseOrders.root}` },
  { key: 'grpoOrder', label: 'GRPO', path: `/${ADMIN_ROUTE_PATHS.grpo.root}` },
  { key: 'bill', label: 'Bill', path: `/${ADMIN_ROUTE_PATHS.bills.root}` },
  { key: 'paymentMade', label: 'Payment Made', path: `/${ADMIN_ROUTE_PATHS.paymentsMade.root}` },
  { key: 'debitNote', label: 'Debit Note', path: `/${ADMIN_ROUTE_PATHS.debitNotes.root}` },
  { key: 'expense', label: 'Expense', path: `/${ADMIN_ROUTE_PATHS.expenses.root}` },
];

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

const Transaction = ({ transactionData, contactId }) => {
  const navigate = useNavigate();
  const [openingBalanceActiveKeys, setOpeningBalanceActiveKeys] = useState([]);

  const handleOpenTransactionList = path => {
    if (!path || !contactId) return;
    window.open(`${path}?customerId=${contactId}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpeningBalancePaymentRowClick = record => {
    const creditNoteRef = record?.entry?.creditNote?._id;
    if (creditNoteRef) {
      navigate(`/credit-notes/${creditNoteRef}`);
      return;
    }
    const debitNoteRef = record?.entry?.debitNote?._id;
    if (debitNoteRef) {
      navigate(`/debit-notes/${debitNoteRef}`);
      return;
    }
    const invoiceRef = record?.entry?.invoice?._id;
    if (invoiceRef) {
      navigate(`/invoices/${invoiceRef}`);
      return;
    }
    const billRef = record?.entry?.bill?._id;
    if (billRef) {
      navigate(`/bills/${billRef}`);
      return;
    }
    const paymentReceivedRef = record?.entry?.paymentReceived?._id ?? record?.entry?.paymentReceivedId;
    if (paymentReceivedRef) {
      navigate(`/payments-received/${paymentReceivedRef}`);
      return;
    }
    const paymentMadeRef = record?.entry?.paymentMade?._id ?? record?.entry?.paymentMadeId;
    if (paymentMadeRef) {
      navigate(`/payments-made/${paymentMadeRef}`);
    }
  };

  const countItems = TRANSACTION_COUNT_FIELDS.reduce((acc, { key, label, path }) => {
    const count = Number(transactionData?.[key]) || 0;
    if (count > 0) {
      acc.push({ key, label, path, count });
    }
    return acc;
  }, []);

  const openingBalanceHistory = Array.isArray(transactionData?.openingBalancePaymentHistory) ? transactionData.openingBalancePaymentHistory : [];
  const openingBalanceCollapseItems =
    openingBalanceHistory.length > 0
      ? [
          {
            key: 'OpeningBalancePayments',
            label: `Opening balance payments (${openingBalanceHistory.length})`,
            children: (
              <CustomTable
                columns={openingBalancePaymentHistoryColumns}
                data={openingBalanceHistory}
                loading={false}
                pagination={false}
                scroll={{ x: 'max-content' }}
                dynamicScrollY={false}
                className="my-2"
                onRowClick={handleOpeningBalancePaymentRowClick}
              />
            ),
          },
        ]
      : [];

  const hasTransactions = countItems.length > 0 || openingBalanceCollapseItems.length > 0;

  return (
    <div className="my-container container-spacing space-y-3">
      {hasTransactions ? (
        <>
          {countItems.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {countItems.map((item, index) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${index > 0 ? 'border-t border-gray-200' : ''} ${item.path ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                  onClick={item.path ? () => handleOpenTransactionList(item.path) : undefined}
                  role={item.path ? 'button' : undefined}
                  tabIndex={item.path ? 0 : undefined}
                  onKeyDown={
                    item.path
                      ? e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenTransactionList(item.path);
                          }
                        }
                      : undefined
                  }
                >
                  <span className="text-sm font-medium text-gray-800">{`${item.label} (${item.count})`}</span>
                  {item.path && <Icons.ExportOutlined style={{ color: colorPalette.primary[500] }} />}
                </div>
              ))}
            </div>
          )}
          {openingBalanceCollapseItems.length > 0 && (
            <Collapse
              expandIconPosition="end"
              activeKey={openingBalanceActiveKeys}
              onChange={keys => setOpeningBalanceActiveKeys(Array.isArray(keys) ? keys : keys ? [keys] : [])}
              items={openingBalanceCollapseItems}
            />
          )}
        </>
      ) : (
        <p className="text-center">No Transaction found</p>
      )}
    </div>
  );
};

const CustomerDetail = () => {
  const { isSplitSessionActive, isSplitWise, useModuleCustomerMaster, useModuleVendor, isViewOnly } = useModulePermissions(RESOURCES?.CUSTOMER_MASTER);
  const { useModuleGeneralLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER);
  const isVendorPage = window.location.href.includes('vendors');
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loading,
    customerDetail,
    getCustomerById,
    resetCustomer,
    toggleAddressStatus,
    toggleCustomerStatus,
    submitLoading,
    deleteLoading,
    deleteCustomer,
    resendPortalInvite,
    resendInviteLoading,
    acceptCustomerVerification,
    rejectCustomerVerification,
    acceptVerificationLoading,
    rejectVerificationLoading,
    getBusinessPartnerTeam,
    createBusinessPartnerTeam,
    updateBusinessPartnerTeam,
    deleteBusinessPartnerTeam,
  } = useCustomer();
  const { activeFeatures } = useProfile();
  const isCustomerOrderAppAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const { autoMapOpeningBalanceToInvoices, autoMapOpeningBalanceLoading: autoMapOpeningBalanceInvoicesLoading } = useInvoice();
  const { autoMapOpeningBalanceToBills, autoMapOpeningBalanceLoading: autoMapOpeningBalanceBillsLoading } = useBill();
  const [addtionalAddress, setAddtionalAddress] = useState([]);
  const addressQueue = useRef([]);

  const [activeKey, setActiveKey] = useState(CUSTOMER_DETAIL_TABS.OVERVIEW);
  const didRestoreNavigationState = useRef(false);

  const [showApplyCreditModal, setShowApplyCreditModal] = useState(false);
  const [showAutoMapModal, setShowAutoMapModal] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamPerson, setEditingTeamPerson] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [verificationDropdownOpen, setVerificationDropdownOpen] = useState(false);
  const deleteModal = useConfirmModal();
  const teamDeleteModal = useConfirmModal();
  const canAddComment = isVendorPage ? useModuleVendor?.canEdit : useModuleCustomerMaster?.canEdit;
  const hasAvailableCredits =
    customerDetail?.hasAvailableCredits != null ? Boolean(customerDetail.hasAvailableCredits) : (customerDetail?.branch || []).some(branchRow => Number(branchRow?.openingBalance) < 0);
  const autoMapLoading = isVendorPage ? autoMapOpeningBalanceBillsLoading : autoMapOpeningBalanceInvoicesLoading;
  const customerCurrency = customerDetail?.otherDetails?.currency;

  const { totalOpeningBalance, totalCurrentBalance } = useMemo(() => {
    const rows = customerDetail?.branch || [];
    return {
      totalOpeningBalance: rows.reduce((sum, r) => sum + (Number(r?.openingBalance) || 0), 0),
      totalCurrentBalance: rows.reduce((sum, r) => sum + (Number(r?.currentBalance) || 0), 0),
    };
  }, [customerDetail?.branch]);
  const handleToggleAddressStatus = async record => {
    if (addressQueue.current.includes(record?._id)) return;
    addressQueue.current.push(record?._id);
    await toggleAddressStatus({ addressId: record?._id });
    let updatedAddress = addtionalAddress.map(item => {
      if (item?._id === record?._id) {
        return { ...item, isActive: !record?.isActive };
      }
      return item;
    });
    setAddtionalAddress(updatedAddress);
    addressQueue.current = addressQueue.current.filter(id => id !== record?._id);
  };

  const handleAutoMapOpeningBalance = async () => {
    const payload = {
      ...(isSplitSessionActive && isSplitWise ? { isSplit: true } : {}),
      ...(isVendorPage ? { vendorId: customerId } : { customerId }),
    };

    if (isVendorPage) {
      await autoMapOpeningBalanceToBills(payload);
    } else {
      await autoMapOpeningBalanceToInvoices(payload);
    }

    setShowAutoMapModal(false);
    await getCustomerById({
      customerId,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  const refreshBusinessPartnerTeam = async () => {
    try {
      await getBusinessPartnerTeam({ customerId });
    } catch {
      return;
    }
  };

  const canEditTeam = (isVendorPage ? useModuleVendor?.edit : useModuleCustomerMaster?.edit) && !isViewOnly;
  const canDeleteTeam = (isVendorPage ? useModuleVendor?.delete : useModuleCustomerMaster?.delete) && !isViewOnly;
  const teamBlockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

  const handleSubmitTeamPerson = async values => {
    if (!canEditTeam) return false;
    const body = buildBusinessPartnerTeamBody(values);
    try {
      if (editingTeamPerson?._id) {
        await updateBusinessPartnerTeam({ customerId, businessPartnerTeamId: editingTeamPerson._id, ...body });
      } else {
        await createBusinessPartnerTeam({ customerId, ...body });
      }
    } catch {
      return false;
    }
    await refreshBusinessPartnerTeam();
  };

  const confirmDeleteTeamPerson = async () => {
    if (!canDeleteTeam) return;
    const record = teamDeleteModal.payload;
    if (!record?._id) return;
    try {
      await deleteBusinessPartnerTeam({ customerId, businessPartnerTeamId: record._id });
      teamDeleteModal.close();
    } catch {
      return;
    }
    await refreshBusinessPartnerTeam();
  };

  const businessPartnerTeamColumns = [
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName' },
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName' },
    { title: 'Mobile No', dataIndex: 'mobileNo', key: 'mobileNo' },
    { title: 'Email Address', dataIndex: 'email', key: 'email' },
    { title: 'Work Phone', dataIndex: 'workPhone', key: 'workPhone' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Authority & Power', dataIndex: 'authorityPower', key: 'authorityPower' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Tooltip title={canEditTeam ? 'Edit Contact Person' : teamBlockedTooltip}>
            <Icons.EditOutlined
              className={canEditTeam ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEditTeam ? 'pointer' : 'not-allowed' }}
              onClick={
                canEditTeam
                  ? () => {
                      setEditingTeamPerson(record);
                      setTeamModalOpen(true);
                    }
                  : undefined
              }
            />
          </Tooltip>
          <Tooltip title={canDeleteTeam ? 'Delete Contact Person' : teamBlockedTooltip}>
            <Icons.DeleteOutlined
              className={canDeleteTeam ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDeleteTeam ? 'pointer' : 'not-allowed' }}
              onClick={canDeleteTeam && !submitLoading ? () => teamDeleteModal.open(record) : undefined}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const businessPartnerTeamData = (customerDetail?.businessPartnerTeam || [])?.map((person, index) => ({
    key: person?._id || person?.id || index,
    _id: person?._id || person?.id,
    firstName: person.firstName,
    lastName: person.lastName,
    mobileNo: person.mobileNo,
    email: person.email,
    workPhone: person.workPhone,
    department: person.department,
    authorityPower: person.authorityPower,
  }));

  const branchColumns = [
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: isActive => (isActive ? 'Yes' : 'No'),
    },
    {
      title: 'Division',
      dataIndex: 'divisionId',
      key: 'divisionId',
      render: divisionId => divisionId?.name,
    },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: branchId => branchId?.name,
    },
    { title: 'Code', dataIndex: 'branchCode', key: 'branchCode' },
    {
      title: 'Current Balance',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      render: v => formatAmount(Number(v), true, customerCurrency),
    },
    {
      title: 'Opening Balance',
      dataIndex: 'openingBalance',
      key: 'openingBalance',
      render: v => formatAmount(Number(v), true, customerCurrency),
    },
    ...(customerDetail?.useBranchCreditLimit
      ? [
          {
            title: 'Credit Limit',
            dataIndex: 'creditLimit',
            key: 'creditLimit',
          },
        ]
      : []),
    ...(customerDetail?.useBranchCreditLimit
      ? [
          {
            title: 'Restriction Document',
            dataIndex: 'restrictedModule',
            key: 'restrictedModule',
            render: restrictedModule => restrictedModule?.map(item => RESTRICTION_DOCUMENT_LABELS[item] || item).join(', '),
          },
        ]
      : []),

    ...(customerDetail?.useBranchPaymentTerms
      ? [
          {
            title: 'Payment Terms',
            dataIndex: 'paymentTermsId',
            key: 'paymentTermsId',
            render: paymentTermsId => paymentTermsId?.name || '-',
          },
        ]
      : []),
    ...(customerDetail?.useBranchPaymentTerms
      ? [
          {
            title: 'Restriction Payment Terms Document',
            dataIndex: 'restrictedPaymentTermsModule',
            key: 'restrictedPaymentTermsModule',
            render: restrictedPaymentTermsModule => restrictedPaymentTermsModule?.map(item => RESTRICTION_DOCUMENT_LABELS[item] || item).join(', '),
          },
        ]
      : []),
  ];

  const additionalShippingAddressColumns = [
    {
      title: 'Attention',
      dataIndex: 'attention',
      key: 'attention',
    },
    {
      title: 'Country / Region',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Address',
      key: 'address',
      render: record => `${record?.address?.street1 || ''} ${record?.address?.street2 || ''}`.trim(),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
    },
    {
      title: 'Pin Code',
      dataIndex: 'pinCode',
      key: 'pinCode',
    },
    {
      title: 'Fax Number',
      dataIndex: 'faxNumber',
      key: 'faxNumber',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Active',
      key: 'isActive',
      render: record => {
        return (
          <CustomInput
            type="checkbox"
            name={`${record?._id}`}
            label=""
            CheckboxName=""
            value={record.isActive}
            onChange={() => {
              handleToggleAddressStatus(record);
            }}
            disabled={addressQueue.current.includes(record?._id)}
          />
        );
      },
    },
  ];

  const OverviewTab = () => {
    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField
                label="BP Primary Contact Name"
                value={`${customerDetail?.bpPrimaryContactName?.firstName || ''} ${customerDetail?.bpPrimaryContactName?.lastName || ''}`.trim()}
                truncate={false}
                valueClassName="break-words"
              />
              <DetailField label="Business Partner Type" value={customerDetail?.businessPartnerType} />
              <DetailField label="Company Name" value={customerDetail?.companyName} truncate={false} valueClassName="break-words" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label={isVendorPage ? 'Vendor Display Name' : 'Customer Display Name'} value={customerDetail?.customerDisplayName} truncate={false} valueClassName="break-words" />
              <DetailField
                label="Account Type"
                value={
                  PARTY_ACCOUNT_TYPE_LABELS[customerDetail?.accountType] || PARTY_ACCOUNT_TYPE_LABELS[isVendorPage ? PARTY_ACCOUNT_TYPES.ACCOUNTS_PAYABLE : PARTY_ACCOUNT_TYPES.ACCOUNTS_RECEIVABLE]
                }
              />
              <DetailField label="Email" value={customerDetail?.bpEmail} />
              <DetailField label={isVendorPage ? 'Vendor Phone Number' : 'Customer Phone Number'} value={customerDetail?.customerPhoneNumber} />
            </div>
            {!isVendorPage && customerDetail?.verificationStatus && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                <DetailField label="Verification Status">
                  <StatusBadge status={customerDetail.verificationStatus} value={CUSTOMER_VERIFICATION_STATUS?.[customerDetail.verificationStatus] || customerDetail.verificationStatus} />
                </DetailField>
                <DetailField label="Request ID" value={customerDetail?.verificationRequestId} />
                <DetailField label="Submitted On" value={customerDetail?.verificationSubmittedAt ? dateFormateForUi(customerDetail.verificationSubmittedAt) : '-'} />
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              {!isVendorPage && <DetailField label="Created From" value={customerDetail?.appName} />}
              {isVendorPage ? (
                <>
                  <DetailField label="Is Linked Customer" value={customerDetail?.isLinkedToVendor || customerDetail?.customerId ? 'Yes' : 'No'} />
                  {(customerDetail?.isLinkedToVendor || customerDetail?.customerId) && (
                    <DetailField label="Linked Customer Name" valueClassName="break-words">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="min-w-0 break-words">{customerDetail?.linkedCustomerName || '-'}</span>
                        {customerDetail?.linkedCustomerNumber && customerDetail?.customerId && (
                          <Link to={`/customer-master/${customerDetail.customerId}`}>
                            <Tag className="font-semibold m-0 cursor-pointer">{customerDetail.linkedCustomerNumber}</Tag>
                          </Link>
                        )}
                      </div>
                    </DetailField>
                  )}
                </>
              ) : (
                <>
                  <DetailField label="Is Linked Vendor" value={customerDetail?.isLinkedToVendor || customerDetail?.vendorId ? 'Yes' : 'No'} />
                  {(customerDetail?.isLinkedToVendor || customerDetail?.vendorId) && (
                    <DetailField label="Linked Vendor Name" valueClassName="break-words">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="min-w-0 break-words">{customerDetail?.linkedVendorName || '-'}</span>
                        {customerDetail?.linkedVendorNumber && customerDetail?.vendorId && (
                          <Link to={`/vendors/${customerDetail.vendorId}`}>
                            <Tag className="font-semibold m-0 cursor-pointer">{customerDetail.linkedVendorNumber}</Tag>
                          </Link>
                        )}
                      </div>
                    </DetailField>
                  )}
                </>
              )}
            </div>
            <DetailField label="Remarks" value={customerDetail?.remarks} truncate={false} valueClassName="whitespace-pre-wrap break-words" />
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Other Details</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="GST Treatment" value={customerDetail?.otherDetails?.gstTreatment} />
              {customerDetail?.otherDetails?.gstTreatment?.toLowerCase() === 'export' && (
                <>
                  <DetailField label="Export Country" value={customerDetail?.otherDetails?.importExportCountry} />
                  <DetailField label="Import Export Code" value={customerDetail?.otherDetails?.importExportCode} />
                </>
              )}
              <DetailField label="GSTIN/UIN" value={customerDetail?.otherDetails?.gstinUin} />
              <DetailField label="Tax Preference" value={customerDetail?.otherDetails?.taxPreference} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="PAN" value={customerDetail?.otherDetails?.pan} />
              <DetailField label="TDS / TCS Applicable" value={(isVendorPage ? customerDetail?.isVendorDirectTax : customerDetail?.isCustomerDirectTax) ? 'Yes' : 'No'} />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField
                label="Currency"
                value={
                  customerDetail?.otherDetails?.currency
                    ? `${customerDetail.otherDetails.currency.symbol} - ${customerDetail.otherDetails.currency.code} (${customerDetail.otherDetails.currency.name})`
                    : '-'
                }
              />
              <DetailField
                label="Price List"
                value={typeof customerDetail?.otherDetails?.priceList === 'object' && customerDetail?.otherDetails?.priceList != null ? customerDetail.otherDetails.priceList.priceListName : undefined}
              />
              {!isVendorPage && <DetailField label="Include Price List Item Only" value={customerDetail?.otherDetails?.includePriceListItemOnly ? 'Yes' : 'No'} />}
            </div>

            {!isVendorPage && isCustomerOrderAppAvailable && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                <DetailField label="Enable Portal" value={customerDetail?.otherDetails?.enablePortal ? 'Yes' : 'No'} />
              </div>
            )}

            <DetailField label="Documents">
              <DisplayUploadedDocuments fileArray={customerDetail?.otherDetails?.document} />
            </DetailField>
          </div>
        </div>
      </div>
    );
  };

  const AddressTab = () => (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Address</p>

        <div className="mt-2">
          <p className="font-bold text-base">Billing Address</p>
          <AddressFields address={customerDetail?.address?.billing} />
        </div>

        <div className="mt-7">
          <p className="font-bold text-base">Shipping Address</p>
          <AddressFields address={customerDetail?.address?.shipping} />
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Additional Address</p>

        <CustomTable columns={additionalShippingAddressColumns} data={addtionalAddress} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
      </div>
    </div>
  );

  const BusinessPartnerTeamTab = () => (
    <div className="my-container container-spacing">
      <div className="flex items-center justify-between gap-3 pb-2">
        <p className="font-bold text-lg">Business Partner Team</p>
        <PermissionButton
          canAccess={canEditTeam}
          isViewOnly={isViewOnly}
          type="primary"
          className="px-4 py-4 shrink-0"
          text="Add Business Partner Team"
          icon={<Icons.PlusCircleOutlined />}
          onClick={
            canEditTeam
              ? () => {
                  setEditingTeamPerson(null);
                  setTeamModalOpen(true);
                }
              : undefined
          }
        />
      </div>

      <CustomTable columns={businessPartnerTeamColumns} data={businessPartnerTeamData} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
    </div>
  );

  const BranchTab = () => (
    <div id="branch" className="my-container container-spacing scroll-mt-20">
      <p className="font-bold text-lg pb-2">Branch</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3 mb-3">
        <DetailField label="Branch Wise Credit Limit" value={customerDetail?.useBranchCreditLimit ? 'Yes' : 'No'} />
        {!customerDetail?.useBranchCreditLimit && (
          <>
            <DetailField label="Credit Limit" value={customerDetail?.creditLimit} />
            <DetailField label="Restriction Document" value={customerDetail?.restrictedModule?.map(item => RESTRICTION_DOCUMENT_LABELS[item] || item).join(', ')} />
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3 mb-3">
        <DetailField label="Branch Wise Payment Terms" value={customerDetail?.useBranchPaymentTerms ? 'Yes' : 'No'} />
        {!customerDetail?.useBranchPaymentTerms && (
          <>
            <DetailField label="Payment Terms" value={customerDetail?.paymentTermsId?.name} />
            <DetailField label="Restriction Payment Terms Document" value={customerDetail?.restrictedPaymentTermsModule?.map(item => RESTRICTION_DOCUMENT_LABELS[item] || item).join(', ')} />
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3 mb-3">
        <DetailField label="Total Current Balance" value={formatAmount(totalCurrentBalance, true, customerCurrency)} />
        <DetailField label="Total Opening Balance" value={formatAmount(totalOpeningBalance, true, customerCurrency)} />
      </div>
      <CustomTable columns={branchColumns} data={customerDetail?.branch || []} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
    </div>
  );

  const items = [
    {
      key: CUSTOMER_DETAIL_TABS.OVERVIEW,
      label: 'Overview',
      children: <OverviewTab />,
    },
    {
      key: CUSTOMER_DETAIL_TABS.ADDRESS,
      label: 'Address',
      children: <AddressTab />,
    },
    {
      key: CUSTOMER_DETAIL_TABS.BRANCH,
      label: 'Branch',
      children: <BranchTab />,
    },
    {
      key: CUSTOMER_DETAIL_TABS.BUSINESS_PARTNER_TEAM,
      label: 'Business Partner Team',
      children: <BusinessPartnerTeamTab />,
    },
    {
      key: CUSTOMER_DETAIL_TABS.TRANSACTIONS,
      label: 'Transactions',
      children: <Transaction transactionData={customerDetail} contactId={customerId} />,
    },
    ...(customerDetail?.customerId
      ? [
          {
            key: CUSTOMER_DETAIL_TABS.SALES_TRANSACTIONS,
            label: `Sales Transactions`,
            children: <Transaction transactionData={customerDetail?.linkedCustomerData} contactId={customerDetail?.customerId} />,
          },
        ]
      : []),
    ...(customerDetail?.vendorId
      ? [
          {
            key: CUSTOMER_DETAIL_TABS.PURCHASE_TRANSACTIONS,
            label: `Purchase Transactions`,
            children: <Transaction transactionData={customerDetail?.linkedVendorData} contactId={customerDetail?.vendorId} />,
          },
        ]
      : []),
    {
      key: CUSTOMER_DETAIL_TABS.HISTORY,
      label: 'History',
      children: (
        <CommentHistory
          moduleName={isVendorPage ? MODULE_NAMES.VENDOR : MODULE_NAMES.CUSTOMER}
          referenceId={customerId}
          commentHistory={customerDetail?.commentHistory}
          canAddComment={canAddComment}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  useEffect(() => {
    if (didRestoreNavigationState.current) return;
    const navigationState = readNavigationState(location.search);
    if (!navigationState) return;

    didRestoreNavigationState.current = true;
    navigate(stripNavigationStateParam(location), {
      replace: true,
      state: {
        ...location.state,
        ...navigationState,
      },
    });
  }, [location, navigate]);

  useEffect(() => {
    setActiveKey(CUSTOMER_DETAIL_TABS.OVERVIEW);
  }, [customerId]);

  useEffect(() => {
    if (!customerDetail) return;
    const hiddenTab = (activeKey === CUSTOMER_DETAIL_TABS.SALES_TRANSACTIONS && !customerDetail.customerId) || (activeKey === CUSTOMER_DETAIL_TABS.PURCHASE_TRANSACTIONS && !customerDetail.vendorId);
    if (hiddenTab) {
      setActiveKey(CUSTOMER_DETAIL_TABS.OVERVIEW);
    }
  }, [customerDetail, activeKey]);

  useEffect(() => {
    const controller = new AbortController();
    if (customerId) {
      getCustomerById({
        customerId,
        signal: controller.signal,
        isSplit: isSplitSessionActive && isSplitWise ? true : false,
      });
    }
    return () => {
      resetCustomer();
      controller.abort();
    };
  }, [customerId, isSplitSessionActive]);

  const handleRefresh = async () => {
    await getCustomerById({
      customerId,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  const canEdit = isVendorPage ? useModuleVendor?.edit : useModuleCustomerMaster?.edit;
  const canDelete = isVendorPage ? useModuleVendor?.delete : useModuleCustomerMaster?.delete;
  const canEditAction = canEdit && !isViewOnly;
  const canDeleteAction = canDelete && !isViewOnly;
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const isActive = customerDetail?.isActive;

  const handleEditClick = () => {
    const path = isVendorPage ? `/vendors/${customerId}/edit` : `/customer-master/${customerId}/edit`;
    navigate(path, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleCopyToVendor = () => {
    if (isCustomerLinkedToVendor(customerDetail)) {
      Toast.error('This customer is already linked to a vendor.');
      return;
    }
    if (!useModuleVendor?.create) {
      Toast.error("You don't have permission to create a vendor.");
      return;
    }
    navigate('/vendors/new', {
      state: {
        copyFromCustomerId: customerId,
      },
    });
  };

  const handleCopyToCustomer = () => {
    if (isVendorLinkedToCustomer(customerDetail)) {
      Toast.error('This vendor is already linked to a customer.');
      return;
    }
    if (!useModuleCustomerMaster?.create) {
      Toast.error("You don't have permission to create a customer.");
      return;
    }
    navigate('/customer-master/new', {
      state: {
        copyFromVendorId: customerId,
      },
    });
  };

  const handleDeleteClick = () => {
    if (deleteLoading) return;
    deleteModal.open(customerDetail);
  };

  const handleDelete = async () => {
    const result = await deleteCustomer({
      customerId,
      isCustomer: !isVendorPage,
      isVendor: isVendorPage,
    });
    if (result?.payload) {
      deleteModal.close();
      navigate(isVendorPage ? '/vendors' : '/customer-master');
    }
  };

  const handleMarkAsStatus = async () => {
    await toggleCustomerStatus({
      customerId,
      isActive: !isActive,
      isCustomer: !isVendorPage,
      isVendor: isVendorPage,
    });
    await getCustomerById({
      customerId,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  const handleResendPortalInvite = async () => {
    await resendPortalInvite({ customerId });
  };

  const handleAcceptVerification = async () => {
    await acceptCustomerVerification({ customerId });
    await getCustomerById({
      customerId,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  const handleRejectVerification = async () => {
    await rejectCustomerVerification({ customerId });
    await getCustomerById({
      customerId,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  useEffect(() => {
    if (customerDetail) {
      setAddtionalAddress(customerDetail?.address?.additionalShippingAddresses || []);
    }
  }, [customerDetail]);

  useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!customerDetail || !sectionId) return;

    if (sectionId === CUSTOMER_DETAIL_TABS.BRANCH) {
      setActiveKey(CUSTOMER_DETAIL_TABS.BRANCH);
    }

    const timer = setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    return () => clearTimeout(timer);
  }, [customerDetail, location.hash]);

  if (loading) {
    return <CustomerDetailSkeleton isVendorPage={isVendorPage} />;
  }

  if (!customerDetail) {
    return <NoFoundPage docType={isVendorPage ? MODULE_NAMES.VENDOR : MODULE_NAMES.CUSTOMER} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col min-w-0">
              <Tooltip title={customerDetail?.companyName || ''}>
                <h1 className="text-[18px] font-semibold text-gray-900 truncate max-w-[400px]">{customerDetail?.companyName || ''}</h1>
              </Tooltip>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{customerDetail?.customerNumber}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={customerDetail?.isActive} value={customerDetail?.isActive ? 'Active' : 'Inactive'} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            <PermissionButton canAccess={!!useModuleGeneralLedger?.canView} type="default" size="middle" onClick={() => navigate(`/reports/ledger?customerId=${customerId}`)} className="shrink-0">
              General Ledger
            </PermissionButton>
            {!isVendorPage && (
              <Button type="primary" size="middle" onClick={() => navigate(`/customer-master/${customerId}/360-view`)} className="shrink-0">
                360 View
              </Button>
            )}
            {hasAvailableCredits && (
              <>
                <Button type="default" size="middle" onClick={() => setShowAutoMapModal(true)} loading={autoMapLoading} className="shrink-0">
                  Auto Map Opening Balance
                </Button>
                <Button type="default" size="middle" onClick={() => setShowApplyCreditModal(true)} className="shrink-0">
                  Pay Against {isVendorPage ? FEATURE_NAMES.bill : FEATURE_NAMES.invoices}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            <Dropdown
              placement="bottom"
              trigger={['click']}
              disabled={!canEditAction}
              open={canEditAction && statusDropdownOpen}
              onOpenChange={flag => {
                if (!canEditAction) return;
                setStatusDropdownOpen(flag);
              }}
              dropdownRender={() => (
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                  <div className="px-2 py-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                  </div>
                  <StatusConfirmPopover
                    isActive={isActive}
                    onConfirm={handleMarkAsStatus}
                    onCloseDropdown={() => setStatusDropdownOpen(false)}
                    label={`Mark as ${isActive ? 'Inactive' : 'Active'}`}
                    icon={
                      isActive ? <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} /> : <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />
                    }
                    placement="left"
                    confirmMessage={
                      <p className="text-sm font-medium text-gray-800 leading-relaxed">
                        Are you sure you want to mark this {isVendorPage ? 'vendor' : 'customer'} as{' '}
                        <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                      </p>
                    }
                  />
                </div>
              )}
            >
              <Tooltip title={canEditAction ? '' : blockedTooltip} placement="left">
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled={!canEditAction || submitLoading} block>
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : `Mark ${isVendorPage ? 'Vendor' : 'Customer'} As`}
                  </Button>
                </span>
              </Tooltip>
            </Dropdown>
            {/* Portal actions are hard hidden without the customer portal (CUSTOMER_ORDER) plan feature. */}
            {!isVendorPage && isCustomerOrderAppAvailable && customerDetail?.portalEnabled && !customerDetail?.portalAccepted && (
              <PermissionButton
                canAccess={!!canEdit}
                isViewOnly={isViewOnly}
                disabled={resendInviteLoading}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                icon={<Icons.SendOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={handleResendPortalInvite}
              >
                {resendInviteLoading ? <CustomLoader variant="button" text="Sending..." /> : 'Resend Invite'}
              </PermissionButton>
            )}
            {!isVendorPage && isCustomerOrderAppAvailable && customerDetail?.verificationStatus === 'PENDING' && (
              <Dropdown
                placement="bottom"
                trigger={['click']}
                disabled={!canEditAction}
                open={canEditAction && verificationDropdownOpen}
                onOpenChange={flag => {
                  if (!canEditAction) return;
                  setVerificationDropdownOpen(flag);
                }}
                dropdownRender={() => (
                  <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                    <div className="px-2 py-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Verification Actions :</div>
                    </div>
                    <StatusConfirmPopover
                      onConfirm={handleAcceptVerification}
                      onCloseDropdown={() => setVerificationDropdownOpen(false)}
                      label="Accept Verification"
                      icon={<Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />}
                      variant="success"
                      placement="left"
                      confirmMessage={
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">Approve this customer&apos;s verification request? They will be able to place orders once approved.</p>
                      }
                    />
                    <StatusConfirmPopover
                      onConfirm={handleRejectVerification}
                      onCloseDropdown={() => setVerificationDropdownOpen(false)}
                      label="Reject Verification"
                      icon={<Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />}
                      variant="danger"
                      placement="left"
                      confirmMessage={<p className="text-sm font-medium text-gray-800 leading-relaxed">Reject this customer&apos;s verification request? This cannot be undone from here.</p>}
                    />
                  </div>
                )}
              >
                <Tooltip title={canEditAction ? '' : blockedTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled={!canEditAction || acceptVerificationLoading || rejectVerificationLoading} block>
                      {acceptVerificationLoading || rejectVerificationLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Verify Customer'}
                    </Button>
                  </span>
                </Tooltip>
              </Dropdown>
            )}
            {!isVendorPage && useModuleVendor?.create && (
              <PermissionButton
                canAccess={!!useModuleVendor?.create}
                isViewOnly={isViewOnly}
                type="default"
                icon={<Icons.CopyOutlined />}
                className="px-4 py-2 w-full"
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                block
                onClick={useModuleVendor?.create && !isViewOnly ? handleCopyToVendor : undefined}
              >
                Copy to Vendor
              </PermissionButton>
            )}
            {isVendorPage && useModuleCustomerMaster?.create && (
              <PermissionButton
                canAccess={!!useModuleCustomerMaster?.create}
                isViewOnly={isViewOnly}
                type="default"
                icon={<Icons.CopyOutlined />}
                className="px-4 py-2 w-full"
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                block
                onClick={useModuleCustomerMaster?.create && !isViewOnly ? handleCopyToCustomer : undefined}
              >
                Copy to Customer
              </PermissionButton>
            )}
            <PermissionButton
              canAccess={!!canEdit}
              isViewOnly={isViewOnly}
              type="default"
              icon={<Icons.EditOutlined />}
              className="px-4 py-2 w-full"
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              block
              onClick={canEditAction ? handleEditClick : undefined}
            >
              Edit
            </PermissionButton>
            <PermissionButton
              canAccess={!!canDelete}
              isViewOnly={isViewOnly}
              disabled={deleteLoading}
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              type="default"
              danger
              icon={<Icons.DeleteOutlined />}
              className="px-4 py-2 w-full"
              block
              onClick={canDeleteAction ? handleDeleteClick : undefined}
            >
              {deleteLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Delete'}
            </PermissionButton>
          </ActionButtons>
        </div>
      </div>
      {showApplyCreditModal && (
        <ApplyOpeningBalanceCreditModal
          modalOpen={showApplyCreditModal}
          onClose={() => setShowApplyCreditModal(false)}
          mode={isVendorPage ? CONTACT_TYPE.VENDOR : CONTACT_TYPE.CUSTOMER}
          contactDetails={customerDetail}
          isSplit={isSplitSessionActive && isSplitWise}
          fetchData={async () => {
            await getCustomerById({
              customerId,
              isSplit: isSplitSessionActive && isSplitWise,
            });
          }}
        />
      )}
      {showAutoMapModal && (
        <CustomModal
          modalOpen={showAutoMapModal}
          setModalOpen={open => {
            if (!open && !autoMapLoading) setShowAutoMapModal(false);
          }}
          width={560}
          title={`Auto Map Opening Balance to ${isVendorPage ? 'Bills' : 'Invoices'}`}
        >
          <div className="text-sm text-gray-700">
            <p className="text-gray-600 mb-3">
              The system will automatically map available opening balance credit for this <span className="font-medium text-gray-800">{isVendorPage ? 'vendor' : 'customer'}</span> to open{' '}
              {isVendorPage ? 'bills' : 'invoices'}.
            </p>
            <p className="text-gray-600 mb-4 pl-0.5 leading-relaxed">
              Documents are matched by <span className="font-medium text-gray-800">due date</span> (oldest first).
            </p>
            <div className="flex justify-end gap-2 mt-6 pt-1">
              <Button disabled={autoMapLoading} onClick={() => setShowAutoMapModal(false)}>
                Cancel
              </Button>
              <Button type="primary" loading={autoMapLoading} onClick={handleAutoMapOpeningBalance}>
                Confirm
              </Button>
            </div>
          </div>
        </CustomModal>
      )}
      <AddContactPerson
        modalOpen={teamModalOpen}
        setModalOpen={setTeamModalOpen}
        editingRecord={editingTeamPerson}
        setEditingRecord={setEditingTeamPerson}
        onSubmit={handleSubmitTeamPerson}
        submitLoading={submitLoading}
      />
      <DocumentConfirmModal
        modal={teamDeleteModal}
        docType={MODULE_NAMES.CONTACT_PERSON}
        onConfirm={confirmDeleteTeamPerson}
        loading={submitLoading}
        getDocumentDetails={getBusinessPartnerTeamMemberDetails}
      />
      <DocumentConfirmModal
        modal={deleteModal}
        docType={isVendorPage ? MODULE_NAMES.VENDOR : MODULE_NAMES.CUSTOMER}
        onConfirm={handleDelete}
        loading={deleteLoading}
        getDocumentDetails={customer => getCustomerDocumentDetails(customer, isVendorPage)}
      />
    </>
  );
};

export default CustomerDetail;
