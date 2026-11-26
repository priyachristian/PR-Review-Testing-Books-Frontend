import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import dayjs from 'dayjs';

import { DetailField } from '@/components/ui';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import { colorPalette } from '@/utils/theme';
import { formatAmount } from '@/utils/currency';

import { ATTACHMENT_FIELD_LABELS, COMPLAINT_EVIDENCE_TYPE, COMPLAINT_SOURCE, COMPLAINT_SOURCE_PROBLEM_TYPE } from '../complaint.constants';
import { getContactChannelLabel, getDepartmentLabel } from '../complaint.utils';

const deadlineColor = tone => {
  if (tone === 'late') return colorPalette.error[500];
  if (tone === 'ok') return colorPalette.success[600];
  return undefined;
};

const formatDeadlineDuration = dueDate => {
  if (!dueDate) return null;
  const due = dayjs(dueDate);
  if (!due.isValid()) return null;

  const totalHours = Math.max(0, Math.abs(due.diff(dayjs(), 'hour')));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts = [];

  if (days > 0) parts.push(days === 1 ? '1 day' : `${days} days`);
  if (hours > 0 || days === 0) parts.push(hours === 1 ? '1 hour' : `${hours} hours`);

  return `${parts.join(' ')} left`;
};

const joinDetail = (...parts) => parts.filter(Boolean).join(' · ') || null;

const MetaField = ({ label, value, detail, valueStyle }) => (
  <DetailField label={label}>
    <p className="truncate" style={valueStyle}>
      {value || '-'}
    </p>
    {detail ? <p className="text-xs font-normal text-gray-500 truncate">{detail}</p> : null}
  </DetailField>
);

const MediaSection = ({ label, urls }) => {
  if (!Array.isArray(urls) || urls.length === 0) return null;

  return (
    <DetailField label={label}>
      <div className="mt-1">
        <AttachMentDetails data={{ attachments: urls }} />
      </div>
    </DetailField>
  );
};

const salesPersonLabel = salesPersonId => {
  if (!salesPersonId) return null;
  if (typeof salesPersonId === 'object') return salesPersonId.name || salesPersonId.email || null;
  return null;
};

/** Build display fields + photo URLs from evidence[] — only entries that exist with a usable value. */
const buildEvidenceDisplay = (evidence = []) => {
  const fields = [];
  const photoUrls = [];

  if (!Array.isArray(evidence)) return { fields, photoUrls };

  evidence.forEach(item => {
    if (!item?.type) return;

    switch (item.type) {
      case COMPLAINT_EVIDENCE_TYPE.INVOICE: {
        const value = item.invoiceId?.invoiceId || item.invoiceId?.invoiceNumber || null;
        if (value) fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.INVOICE, value });
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY: {
        const value = item.itemId?.itemName || item.itemId?.itemNo || null;
        const detail = item.quantity != null ? `${item.quantity} pieces` : null;
        if (value || detail) fields.push({ key: item.type, label: 'Item', value: value || detail, detail: value ? detail : null });
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.BATCH: {
        if (item.batchNumber) fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.BATCH, value: renderBatchNumber(item.batchNumber) });
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.TRANSPORT: {
        if (item.value != null && item.value !== '') {
          fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.TRANSPORT, value: String(item.value) });
        }
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.BILL: {
        const value = item.billId?.billId || item.billId?.billNumber || null;
        if (value) fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.BILL, value });
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.AMOUNT: {
        if (item.amount != null && item.amount !== '') {
          fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.AMOUNT, value: formatAmount(item.amount) });
        }
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.SALES_PERSON: {
        const value = salesPersonLabel(item.salesPersonId);
        if (value) fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.SALES_PERSON, value });
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.DATE: {
        if (item.date && dayjs(item.date).isValid()) {
          fields.push({ key: item.type, label: ATTACHMENT_FIELD_LABELS.DATE, value: dayjs(item.date).format('DD/MM/YYYY') });
        }
        break;
      }
      case COMPLAINT_EVIDENCE_TYPE.PHOTO: {
        if (item.fileUrl) photoUrls.push(item.fileUrl);
        break;
      }
      default:
        break;
    }
  });

  return { fields, photoUrls };
};

const ComplaintSummaryCard = ({ complaint }) => {
  if (!complaint) return null;

  const pathLabel = (complaint.problemPath || []).join(' > ');
  const createdAt = complaint.createdAt ? dayjs(complaint.createdAt).format('DD/MM/YYYY') : null;

  const customer = complaint.customerId;
  const assignee = complaint.assignedTo;
  const isCustomerIssue = complaint.problemType === COMPLAINT_SOURCE_PROBLEM_TYPE[COMPLAINT_SOURCE.CUSTOMER];

  const { fields: evidenceFields, photoUrls: evidencePhotoUrls } = buildEvidenceDisplay(complaint.evidence);

  const attachments = Array.isArray(complaint.attachments) ? complaint.attachments.filter(Boolean) : [];
  const photos = [...new Set([...(Array.isArray(complaint.photos) ? complaint.photos.filter(Boolean) : []), ...evidencePhotoUrls])];
  const hasMedia = attachments.length > 0 || photos.length > 0;

  return (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">{complaint.title || '-'}</p>
      {pathLabel ? <p className="text-sm text-gray-500 mt-0.5">{pathLabel}</p> : null}
      {complaint.notes ? <p className="text-[13px] text-gray-700 mt-2 leading-5">{complaint.notes}</p> : null}

      <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-y-3">
          {isCustomerIssue ? <MetaField label="Customer" value={customer?.customerName} detail={joinDetail(customer?.city, customer?.phoneNumber)} /> : null}
          <MetaField label="Came in" value={createdAt} detail={getContactChannelLabel(complaint.contactChannel)} />
          <MetaField label="With" value={assignee?.name} detail={getDepartmentLabel(complaint.department)} />
          <MetaField label="Deadline" value={formatDeadlineDuration(complaint.dueDate)} valueStyle={{ color: deadlineColor(complaint.deadlineTone) }} />
          {evidenceFields.map(field => (
            <MetaField key={field.key} label={field.label} value={field.value} detail={field.detail} />
          ))}
        </div>

        {complaint.jobCardNumber ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-y-3">
            <MetaField label="Job card" value={complaint.jobCardNumber} detail={complaint.jobCardNote} />
          </div>
        ) : null}

        {hasMedia ? (
          <div className="grid md:grid-cols-2 gap-y-3 gap-x-4">
            <MediaSection label="Attachments" urls={attachments} />
            <MediaSection label="Photos" urls={photos} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ComplaintSummaryCard;
