// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusBadge from '../../ui/badge/StatusBadge';

// Extras
import { MODULE_NAMES_LABELS } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';

const FIELD_LABEL_MAP = {
  // Quote fields
  quoteId: 'Quote ID',
  quoteNumber: 'Quote Number',
  quoteDate: 'Quote Date',
  // Sales Order fields
  orderId: 'Sales Order ID',
  orderNumber: 'Sales Order Number',
  orderDate: 'Sales Order Date',
  expectedShipmentDate: 'Expected Shipment Date',
  // Invoice fields
  invoiceId: 'Invoice ID',
  invoiceNumber: 'Invoice Number',
  invoiceDate: 'Invoice Date',
  dueDate: 'Due Date',
  // Delivery Challan fields
  challanId: 'Delivery Challan ID',
  challanNumber: 'Delivery Challan Number',
  challanDate: 'Delivery Challan Date',
  // Purchase Order fields
  purchaseOrderId: 'Purchase Order ID',
  purchaseOrderNumber: 'Purchase Order Number',
  purchaseOrderDate: 'Purchase Order Date',
  deliveryDate: 'Delivery Date',
  // Bill fields
  billId: 'Bill ID',
  billNumber: 'Bill Number',
  billDate: 'Bill Date',
  // GRPO fields
  grpoOrderId: 'GRPO Order ID',
  grpoOrderNumber: 'GRPO Order Number',
  grpoDate: 'GRPO Date',
  // Payment fields
  paymentReceivedId: 'Payment Received ID',
  paymentMadeId: 'Payment Made ID',
  paymentDate: 'Payment Date',
  paymentMode: 'Payment Mode',
  amountReceived: 'Amount Received',
  paymentMade: 'Payment Made',
  // Rejection Order fields
  rejectionOrderId: 'Rejection Order ID',
  arrivalDate: 'Arrival Date',
  // Production Order fields
  productionOrderCode: 'Production Order No',
  productionOrderId: 'Production Order ID',
  productionDate: 'Production Date',
  itemName: 'Item',
  // Expense fields
  expenseId: 'Expense#',
  expenseAccountName: 'Expense Account',
  // Complaint fields
  complaintNo: 'Complaint No',
  complaintTitle: 'Problem',
  // Spare part fields
  code: 'Code',
  name: 'Name',
  category: 'Category',
  uom: 'UOM',
  // Machine fields
  location: 'Location',
  process: 'Process',
  // Manual Journal fields
  manualJournalId: 'Journal#',
  vchNo: 'VCH NO',
  // Account Ledger fields
  businessAccountLedgerMasterId: 'Account Ledger#',
  personName: 'Ledger Name',
  gstinUin: 'GST',
  // Credit Note fields
  creditNoteId: 'Credit Note ID',
  creditNoteNumber: 'Credit Note Number',
  creditNoteDate: 'Credit Note Date',
  debitNoteId: 'Debit Note ID',
  debitNoteNumber: 'Debit Note Number',
  debitNoteDate: 'Debit Note Date',
  // Common fields
  firstName: 'First Name',
  lastName: 'Last Name',
  mobileNo: 'Mobile No',
  email: 'Email Address',
  workPhone: 'Work Phone',
  department: 'Department',
  authorityPower: 'Authority & Power',
  customerName: 'Customer Name',
  customerDisplayName: 'Customer Display Name',
  customerNumber: 'Customer Number',
  vendorName: 'Vendor Name',
  vendorDisplayName: 'Vendor Display Name',
  vendorNumber: 'Vendor Number',
  companyName: 'Company Name',
  total: 'Total Amount',
  totalAmount: 'Total Amount',
  balanceAmount: 'Balance Due',
  availableBalance: 'Available Balance',
  status: 'Status',
  reference: 'Reference',
  referenceNumber: 'Reference Number',
  subject: 'Subject',
  notes: 'Notes',
  description: 'Description',
};

const DATE_FIELDS = new Set([
  'quoteDate',
  'orderDate',
  'expectedShipmentDate',
  'arrivalDate',
  'invoiceDate',
  'dueDate',
  'challanDate',
  'purchaseOrderDate',
  'deliveryDate',
  'billDate',
  'grpoDate',
  'paymentDate',
  'creditNoteDate',
  'debitNoteDate',
  'productionDate',
  'date',
]);

const AMOUNT_FIELDS = new Set(['total', 'totalAmount', 'balanceAmount', 'availableBalance', 'amountReceived', 'paymentMade', 'amount']);

const getFieldLabel = key => FIELD_LABEL_MAP[key] || key.replace(/([A-Z])/g, ' $1').trim();

const getFieldType = key => {
  if (DATE_FIELDS.has(key)) return 'date';
  if (AMOUNT_FIELDS.has(key)) return 'amount';
  if (key === 'status') return 'status';
  return 'text';
};

const getFieldValue = (value, fieldType = 'text') => {
  if (value === null || value === undefined || value === '') return null;

  switch (fieldType) {
    case 'date':
      return dateFormateForUi(value);
    case 'amount':
      return formatAmount(value);
    case 'currency':
      return formatAmount(value, true);
    case 'status':
      return <StatusBadge status={value} value={value} />;
    default:
      return value;
  }
};

export const DocumentConfirmModal = ({ modal, getDocumentDetails, ...modalProps }) => {
  if (!modal?.isOpen) return null;

  return (
    <CancelOrDeleteDocumentModal
      {...modalProps}
      showModal
      closeModal={modal.close}
      documentDetails={typeof getDocumentDetails === 'function' ? getDocumentDetails(modal.payload) : modalProps.documentDetails}
    />
  );
};

const CancelOrDeleteDocumentModal = ({ showModal, closeModal, docType, loading, documentDetails = null, mode = 'delete', onConfirm }) => {
  if (!showModal) return null;

  const docLabel = MODULE_NAMES_LABELS?.[docType] || 'document';
  const isStatusMode = mode === 'status';

  const resolvedTitle = isStatusMode ? `Mark ${docLabel} as Cancelled?` : `Are you sure you want to delete this ${docLabel}?`;
  const resolvedWarningMessage = isStatusMode
    ? `You are about to change this ${docLabel} status. This action cannot be undone.`
    : 'Deleting this document may affect other related documents in the system. This action cannot be undone.';
  const resolvedConfirmText = isStatusMode ? 'Yes, Proceed' : 'Delete';
  const resolvedConfirmButtonClassName = isStatusMode ? '' : 'delete-button';

  return (
    <div>
      <CustomModal modalOpen={showModal} setModalOpen={closeModal} width={500} title={resolvedTitle}>
        <div>
          {documentDetails && (
            <div className="py-3 px-4 bg-gray-50 rounded-md mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Document Details:</p>
              <div className="space-y-1 text-sm text-gray-600">
                {Object.entries(documentDetails).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;

                  const fieldType = getFieldType(key);
                  const fieldValue = getFieldValue(value, fieldType);
                  const fieldLabel = getFieldLabel(key);

                  if (!fieldValue) return null;

                  return (
                    <div key={key} className="flex justify-between gap-3">
                      <span className="shrink-0">{fieldLabel}:</span>
                      <span className="font-medium min-w-0 break-words text-right">{fieldValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`py-2 container-spacing rounded-md ${isStatusMode ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-100'}`}>
            <p className={`text-sm font-medium ${isStatusMode ? 'text-yellow-800' : 'text-red-800'}`}>Important Note:</p>
            <p className={`text-sm mt-1 ${isStatusMode ? 'text-yellow-700' : 'text-red-700'}`}>{resolvedWarningMessage}</p>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={closeModal} disabled={loading} style={{ minWidth: '100px', maxWidth: '100px' }} />
            <CustomButton
              className={`px-8 py-4 ${resolvedConfirmButtonClassName}`}
              type={isStatusMode ? 'primary' : 'default'}
              text={resolvedConfirmText}
              loading={loading}
              onClick={onConfirm}
              style={{
                minWidth: loading ? '140px' : '100px',
                ...(loading ? {} : { maxWidth: '100px' }),
              }}
            />
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default CancelOrDeleteDocumentModal;
