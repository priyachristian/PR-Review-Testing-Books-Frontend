import dayjs from 'dayjs';
import { PROBLEM_TYPES } from '@/features/complaint/problemList/problemList.constants';
import {
  COMPLAINT_CHANNEL_OPTIONS,
  COMPLAINT_CONTACT_CHANNEL,
  COMPLAINT_CURRENT_STEP_OPTIONS,
  COMPLAINT_DEPARTMENT_OPTIONS,
  COMPLAINT_EVIDENCE_TYPE,
  COMPLAINT_EVIDENCE_TYPE_OPTIONS,
  COMPLAINT_FIX_HELD_RESULT_OPTIONS,
  COMPLAINT_FORM_TYPE,
  COMPLAINT_FORM_TYPE_OPTIONS,
  COMPLAINT_LIST_STATUS,
  COMPLAINT_SETTLEMENT_TYPE_OPTIONS,
  COMPLAINT_SOURCE_PROBLEM_TYPE,
  COMPLAINT_STATUS,
  COMPLAINT_URGENCY_OPTIONS,
  COMPLAINT_WAITING_FOR_OPTIONS,
  COMPLAINT_WARRANTY_POSITION_OPTIONS,
  COMPLAINT_NOT_REAL_REASON_OPTIONS,
  EMPLOYEE_FORM_BRANCH,
  EVIDENCE_FIELD_CONFIG,
} from './complaint.constants';

export const getOptionLabel = (options = [], value) => options.find(option => option.value === value)?.label || value || '';

export const getComplaintStatusMeta = status => COMPLAINT_STATUS[status] || COMPLAINT_STATUS.NEW;

export const getComplaintListStatusMeta = status => COMPLAINT_LIST_STATUS[status] || COMPLAINT_LIST_STATUS.NEEDS_ACTION;

export const getFormTypeLabel = value => getOptionLabel(COMPLAINT_FORM_TYPE_OPTIONS, value);
export const getCurrentStepLabel = value => getOptionLabel(COMPLAINT_CURRENT_STEP_OPTIONS, value);
export const getContactChannelLabel = value => getOptionLabel(COMPLAINT_CHANNEL_OPTIONS, value);
export const getDepartmentLabel = value => getOptionLabel(COMPLAINT_DEPARTMENT_OPTIONS, value);
export const getUrgencyLabel = value => getOptionLabel(COMPLAINT_URGENCY_OPTIONS, value);
export const getEvidenceTypeLabel = value => getOptionLabel(COMPLAINT_EVIDENCE_TYPE_OPTIONS, value);
export const getWarrantyPositionLabel = value => getOptionLabel(COMPLAINT_WARRANTY_POSITION_OPTIONS, value);
export const getSettlementTypeLabel = value => getOptionLabel(COMPLAINT_SETTLEMENT_TYPE_OPTIONS, value);
export const getFixHeldResultLabel = value => getOptionLabel(COMPLAINT_FIX_HELD_RESULT_OPTIONS, value);
export const getWaitingReasonLabel = value => getOptionLabel(COMPLAINT_WAITING_FOR_OPTIONS, value);
export const getNotRealReasonLabel = value => getOptionLabel(COMPLAINT_NOT_REAL_REASON_OPTIONS, value);

export const getProblemTypeFromSource = source => COMPLAINT_SOURCE_PROBLEM_TYPE[source] || null;

/**
 * Resolve create-complaint formType from the selected problem path.
 * - Customer Issue root → CUSTOMER_ISSUE (Suggestion vs Complaint ignored)
 * - Employee Issue + "Person …" branch → PERSON_TO_PERSON
 * - Employee Issue + "Department …" branch → DEPARTMENT_TO_DEPARTMENT
 */
export const resolveComplaintFormType = (path = []) => {
  const root = path[0];
  if (!root) return null;

  if (root.problemType === PROBLEM_TYPES.CUSTOMER_ISSUE) {
    return COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE;
  }

  if (root.problemType === PROBLEM_TYPES.INTERNAL_EMPLOYEE_ISSUE) {
    const branch = path[1];
    const name = String(branch?.name || '')
      .toUpperCase()
      .replace(/[→\-_/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (name.includes(EMPLOYEE_FORM_BRANCH.PERSON)) {
      return COMPLAINT_FORM_TYPE.PERSON_TO_PERSON;
    }
    if (name.includes(EMPLOYEE_FORM_BRANCH.DEPARTMENT)) {
      return COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT;
    }

    return COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT;
  }

  return null;
};

export const getProblemListIdFromPath = (path = []) => {
  const leaf = path[path.length - 1];
  return leaf?.id || leaf?._id || null;
};

export const getInitialEvidenceValues = (requiredAttachments = []) => {
  const evidence = {};
  requiredAttachments.forEach(key => {
    if (key === COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY) {
      evidence[key] = { itemId: null, quantity: null };
    } else if (key === COMPLAINT_EVIDENCE_TYPE.DATE || key === COMPLAINT_EVIDENCE_TYPE.PHOTO) {
      evidence[key] = null;
    } else if (key === COMPLAINT_EVIDENCE_TYPE.AMOUNT || key === COMPLAINT_EVIDENCE_TYPE.TRANSPORT) {
      evidence[key] = null;
    } else {
      evidence[key] = null;
    }
  });
  return evidence;
};

export const getCreateComplaintInitialValues = ({ formType, requiredAttachments = [], currentUserId = null } = {}) => {
  const base = {
    title: '',
    notes: '',
    raisedBy: currentUserId || null,
    attachments: [],
    photos: [],
    evidence: getInitialEvidenceValues(requiredAttachments),
  };

  if (formType === COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT) {
    return { ...base, fromDepartment: null, againstDepartment: null };
  }

  if (formType === COMPLAINT_FORM_TYPE.PERSON_TO_PERSON) {
    return { ...base, againstPersonId: null };
  }

  if (formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE) {
    return {
      ...base,
      customerId: null,
      contactChannel: COMPLAINT_CONTACT_CHANNEL.PHONE_CALL,
    };
  }

  return base;
};

const idOf = value => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || value.id || null;
};

const asUrlList = (list = []) => (Array.isArray(list) ? list.filter(item => typeof item === 'string' && item) : []);

const mapEvidenceItemToFormValue = (type, item) => {
  if (!item) return undefined;

  if (type === COMPLAINT_EVIDENCE_TYPE.INVOICE) return idOf(item.invoiceId);
  if (type === COMPLAINT_EVIDENCE_TYPE.BILL) return idOf(item.billId);
  if (type === COMPLAINT_EVIDENCE_TYPE.SALES_PERSON) return idOf(item.salesPersonId);
  if (type === COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY) {
    return {
      itemId: idOf(item.itemId),
      quantity: item.quantity != null ? item.quantity : null,
    };
  }
  if (type === COMPLAINT_EVIDENCE_TYPE.DATE) return item.date ? dayjs(item.date) : null;
  if (type === COMPLAINT_EVIDENCE_TYPE.BATCH) return item.batchNumber ?? null;
  if (type === COMPLAINT_EVIDENCE_TYPE.AMOUNT) return item.amount ?? null;
  if (type === COMPLAINT_EVIDENCE_TYPE.TRANSPORT) return item.value ?? null;
  if (type === COMPLAINT_EVIDENCE_TYPE.PHOTO) {
    if (item.fileUrl || item.fileName) {
      return { fileName: item.fileName || null, fileUrl: item.fileUrl || null, isExisting: true };
    }
    return null;
  }
  return null;
};

/** Prefill create-form values from a complaint detail payload. */
export const mapComplaintToFormValues = (complaint, requiredAttachments = []) => {
  const formType = complaint?.formType;
  const base = getCreateComplaintInitialValues({
    formType,
    requiredAttachments,
    currentUserId: idOf(complaint?.raisedBy),
  });

  if (!complaint) return base;

  const evidence = { ...base.evidence };
  const evidenceList = Array.isArray(complaint.evidence) ? complaint.evidence : [];

  requiredAttachments.forEach(type => {
    const item = evidenceList.find(entry => entry?.type === type);
    const mapped = mapEvidenceItemToFormValue(type, item);
    if (mapped !== undefined) evidence[type] = mapped;
  });

  return {
    ...base,
    title: complaint.title || '',
    notes: complaint.notes || '',
    raisedBy: idOf(complaint.raisedBy),
    attachments: asUrlList(complaint.attachments),
    photos: asUrlList(complaint.photos),
    evidence,
    ...(formType === COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT
      ? {
          fromDepartment: complaint.fromDepartment || null,
          againstDepartment: complaint.againstDepartment || null,
        }
      : {}),
    ...(formType === COMPLAINT_FORM_TYPE.PERSON_TO_PERSON
      ? {
          againstPersonId: idOf(complaint.againstPersonId),
        }
      : {}),
    ...(formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE
      ? {
          customerId: idOf(complaint.customerId),
          contactChannel: complaint.contactChannel || COMPLAINT_CONTACT_CHANNEL.PHONE_CALL,
        }
      : {}),
  };
};

/** Seed options for PaginatedSelect so edit mode shows current invoice/bill labels. */
export const getEvidenceSelectOptions = (complaint = {}) => {
  const options = {};
  const evidenceList = Array.isArray(complaint.evidence) ? complaint.evidence : [];

  const invoice = evidenceList.find(entry => entry?.type === COMPLAINT_EVIDENCE_TYPE.INVOICE);
  const invoiceId = idOf(invoice?.invoiceId);
  if (invoiceId) {
    options[COMPLAINT_EVIDENCE_TYPE.INVOICE] = [
      {
        value: invoiceId,
        label: invoice.invoiceId?.invoiceId || invoice.invoiceId?.invoiceNumber || invoiceId,
      },
    ];
  }

  const bill = evidenceList.find(entry => entry?.type === COMPLAINT_EVIDENCE_TYPE.BILL);
  const billId = idOf(bill?.billId);
  if (billId) {
    options[COMPLAINT_EVIDENCE_TYPE.BILL] = [
      {
        value: billId,
        label: bill.billId?.billId || bill.billId?.billNumber || billId,
      },
    ];
  }

  return options;
};

export const getComplaintDocumentDetails = complaint =>
  complaint
    ? {
        complaintNo: complaint.complaintNo,
        complaintTitle: complaint.title,
        status: complaint.currentStep || complaint.status,
        customerName: complaint.customerId?.customerName || complaint.customerName || undefined,
      }
    : null;

const toApiDate = value => {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
};

/** Normalize form media value into File objects and/or existing URL strings. */
const normalizeMediaList = value => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map(item => {
      if (typeof item === 'string' && item) return item;
      if (item instanceof File) return item;
      if (item?.originFileObj instanceof File) return item.originFileObj;
      if (typeof item?.fileUrl === 'string' && item.fileUrl) return item.fileUrl;
      if (typeof item?.url === 'string' && item.url) return item.url;
      return null;
    })
    .filter(Boolean);
};

/** Build evidence[] from form values for requiredAttachments (except PHOTO — use photos[]). */
export const buildEvidencePayload = (evidenceValues = {}, requiredAttachments = []) => {
  const evidence = [];

  requiredAttachments.forEach(type => {
    if (type === COMPLAINT_EVIDENCE_TYPE.PHOTO) return;

    const raw = evidenceValues?.[type];
    const config = EVIDENCE_FIELD_CONFIG[type];
    if (!config) return;

    if (type === COMPLAINT_EVIDENCE_TYPE.INVOICE) {
      if (raw) evidence.push({ type, invoiceId: raw });
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.BILL) {
      if (raw) evidence.push({ type, billId: raw });
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.SALES_PERSON) {
      if (raw) evidence.push({ type, salesPersonId: raw });
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY) {
      if (raw?.itemId) {
        evidence.push({
          type,
          itemId: raw.itemId,
          quantity: raw.quantity != null && raw.quantity !== '' ? Number(raw.quantity) : null,
        });
      }
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.DATE) {
      const date = toApiDate(raw);
      if (date) evidence.push({ type, date });
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.BATCH) {
      if (raw != null && String(raw).trim() !== '') {
        evidence.push({ type, batchNumber: String(raw).trim() });
      }
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.AMOUNT) {
      if (raw != null && raw !== '') evidence.push({ type, amount: Number(raw) });
      return;
    }
    if (type === COMPLAINT_EVIDENCE_TYPE.TRANSPORT) {
      if (raw != null && raw !== '') evidence.push({ type, value: String(raw) });
    }
  });

  return { evidence };
};

const buildPhotoEvidenceItem = photos => {
  const media = normalizeMediaList(photos);
  if (!media.length) return null;

  const firstFile = media.find(item => item instanceof File);
  const firstUrl = media.find(item => typeof item === 'string');

  return {
    type: COMPLAINT_EVIDENCE_TYPE.PHOTO,
    fileName: firstFile?.name || (firstUrl ? firstUrl.split('/').pop() : null),
    fileUrl: firstUrl || null,
  };
};

/**
 * Build POST /complaints body (JSON or multipart via attachments[] + photos[]).
 */
export const buildCreateComplaintPayload = ({ values, formType, problemListId, requiredAttachments = [] }) => {
  const { evidence } = buildEvidencePayload(values?.evidence, requiredAttachments);
  const attachments = normalizeMediaList(values?.attachments).filter(item => item instanceof File);
  const photos = normalizeMediaList(values?.photos).filter(item => item instanceof File);

  if (requiredAttachments.includes(COMPLAINT_EVIDENCE_TYPE.PHOTO)) {
    const photoEvidence = buildPhotoEvidenceItem(values?.photos);
    if (photoEvidence) evidence.push(photoEvidence);
  }

  const payload = {
    formType,
    problemListId,
    title: String(values?.title || '').trim(),
    notes: String(values?.notes || '').trim(),
    raisedBy: values?.raisedBy || null,
    evidence,
  };

  if (attachments.length) {
    payload.attachments = attachments;
  }

  if (photos.length) {
    payload.photos = photos;
  }

  if (formType === COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT) {
    payload.fromDepartment = values?.fromDepartment || null;
    payload.againstDepartment = values?.againstDepartment || null;
  }

  if (formType === COMPLAINT_FORM_TYPE.PERSON_TO_PERSON) {
    payload.againstPersonId = values?.againstPersonId || null;
  }

  if (formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE) {
    payload.customerId = values?.customerId || null;
    payload.contactChannel = values?.contactChannel || null;
  }

  return payload;
};

/**
 * Build PUT /complaints/:id body.
 * Backend allows: title, notes, raisedBy, urgency, evidence, attachments, photos.
 * Media lists may mix existing URL strings and new File objects.
 */
export const buildUpdateComplaintPayload = ({ values, requiredAttachments = [] } = {}) => {
  const { evidence } = buildEvidencePayload(values?.evidence, requiredAttachments);
  const attachments = normalizeMediaList(values?.attachments);
  const photos = normalizeMediaList(values?.photos);

  if (requiredAttachments.includes(COMPLAINT_EVIDENCE_TYPE.PHOTO)) {
    const photoEvidence = buildPhotoEvidenceItem(values?.photos);
    if (photoEvidence) evidence.push(photoEvidence);
  }

  const payload = {
    title: String(values?.title || '').trim(),
    notes: String(values?.notes || '').trim(),
    raisedBy: values?.raisedBy,
    evidence,
    attachments,
    photos,
  };

  if (values?.urgency) {
    payload.urgency = values.urgency;
  }

  return payload;
};
