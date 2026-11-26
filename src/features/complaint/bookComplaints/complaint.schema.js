import * as Yup from 'yup';
import { COMPLAINT_EVIDENCE_TYPE, COMPLAINT_FORM_TYPE, SETTLEMENT_SHOW_COST_ONLY, SETTLEMENT_SHOW_PIECES_AND_COST } from './complaint.constants';

const evidenceFieldSchema = key => {
  switch (key) {
    case COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY:
      return Yup.object()
        .shape({
          itemId: Yup.string().nullable().required('Please select an item'),
          quantity: Yup.number().typeError('Enter quantity').nullable().required('Enter quantity').moreThan(0, 'Quantity must be greater than 0'),
        })
        .required('Required');
    case COMPLAINT_EVIDENCE_TYPE.PHOTO:
      return Yup.mixed()
        .nullable()
        .required('Please upload a photo')
        .test('photo-present', 'Please upload a photo', value => {
          if (!value) return false;
          if (value instanceof File) return true;
          if (value?.originFileObj instanceof File) return true;
          if (Array.isArray(value) && value.some(item => item instanceof File || item?.originFileObj instanceof File)) return true;
          if (value?.isExisting && (value.fileUrl || value.fileName)) return true;
          return false;
        });
    case COMPLAINT_EVIDENCE_TYPE.DATE:
      return Yup.mixed().nullable().required('Please select a date');
    case COMPLAINT_EVIDENCE_TYPE.AMOUNT:
    case COMPLAINT_EVIDENCE_TYPE.TRANSPORT:
      return Yup.number().typeError('Enter a number').nullable().required('Required');
    default:
      return Yup.mixed().nullable().required('Required');
  }
};

export const buildCreateComplaintSchema = (formType, requiredAttachments = []) => {
  const photoRequired = requiredAttachments.includes(COMPLAINT_EVIDENCE_TYPE.PHOTO);
  const evidenceShape = {};
  requiredAttachments.forEach(key => {
    if (key === COMPLAINT_EVIDENCE_TYPE.PHOTO) return;
    evidenceShape[key] = evidenceFieldSchema(key);
  });

  const hasPhotos = value => {
    if (!value) return false;
    const list = Array.isArray(value) ? value : [value];
    return list.some(item => {
      if (!item) return false;
      if (item instanceof File) return true;
      if (item?.originFileObj instanceof File) return true;
      if (typeof item === 'string' && item) return true;
      if (item?.isExisting && (item.fileUrl || item.fileName)) return true;
      return false;
    });
  };

  const base = {
    title: Yup.string().trim().required('Please enter what the problem is'),
    notes: Yup.string().trim().nullable(),
    raisedBy: Yup.string().nullable().required('Please select who is raising / logging this'),
    attachments: Yup.array().nullable(),
    photos: photoRequired ? Yup.mixed().nullable().required('Please upload at least one photo').test('photos-present', 'Please upload at least one photo', hasPhotos) : Yup.array().nullable(),
    evidence: Yup.object().shape(evidenceShape),
  };

  if (formType === COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT) {
    return Yup.object().shape({
      ...base,
      fromDepartment: Yup.string().nullable().required('Please select the from department'),
      againstDepartment: Yup.string().nullable().required('Please select the against department'),
    });
  }

  if (formType === COMPLAINT_FORM_TYPE.PERSON_TO_PERSON) {
    return Yup.object().shape({
      ...base,
      againstPersonId: Yup.string().nullable().required('Please select who this is against'),
    });
  }

  if (formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE) {
    return Yup.object().shape({
      ...base,
      customerId: Yup.string().nullable().required('Please select a customer'),
      contactChannel: Yup.string().nullable().required('Please select how they told us'),
    });
  }

  return Yup.object().shape(base);
};

export const assignComplaintSchema = Yup.object().shape({
  department: Yup.string().required('Please select a department'),
  person: Yup.string().required('Please select a person'),
  reason: Yup.string().trim().required('Please say why this person'),
});

export const waitingOnSomeoneSchema = Yup.object().shape({
  waitingFor: Yup.string().required('Please select what you are waiting for'),
  note: Yup.string().trim().required('Please say why you are waiting'),
});

export const escalateComplaintSchema = Yup.object().shape({
  personId: Yup.string().required('Please select who to escalate to'),
  reason: Yup.string().trim().required('Please say why this needs a push'),
});

export const linkComplaintSchema = Yup.object().shape({
  connectionType: Yup.string().required('Please select how they are connected'),
  linkedComplaintId: Yup.string().required('Please select a complaint to link'),
});

export const notRealComplaintSchema = Yup.object().shape({
  reason: Yup.string().required('Please select why this is not a real complaint'),
  note: Yup.string().trim().nullable(),
});

export const replyToCustomerSchema = Yup.object().shape({
  channel: Yup.string().required('Please select how you are telling them'),
  message: Yup.string().trim().required('Please say what you are telling them'),
  proof: Yup.mixed().nullable(),
});

export const moveToInProgressSchema = Yup.object().shape({
  whatHappened: Yup.string().trim().required('Please say what happened'),
});

export const moveToActionTakenSchema = Yup.object().shape({
  whatHappened: Yup.string().trim().required('Please say what happened'),
});

export const warrantyCheckSchema = Yup.object().shape({
  position: Yup.string().required('Please select where it stands'),
  why: Yup.string().trim().required('Please say why'),
});

export const writeRealCauseSchema = Yup.object()
  .shape({
    why1: Yup.string().trim().nullable(),
    why2: Yup.string().trim().nullable(),
    why3: Yup.string().trim().nullable(),
    why4: Yup.string().trim().nullable(),
    why5: Yup.string().trim().nullable(),
    realCause: Yup.string().trim().required('Please write the real cause'),
    fixThisOne: Yup.string().trim().required('Please say what we did to fix this one'),
    neverRepeats: Yup.string().trim().required('Please say what we changed so it never repeats'),
    ownerId: Yup.string().required('Please select who will make sure of it'),
    byWhen: Yup.mixed().nullable().required('Please select by when'),
  })
  .test('at-least-three-whys', 'Please fill at least three why levels', function validateWhys(values) {
    const filled = [values?.why1, values?.why2, values?.why3, values?.why4, values?.why5].filter(why => Boolean(why?.trim())).length;
    if (filled >= 3) return true;
    return this.createError({ path: 'whys', message: 'Please fill at least three why levels' });
  });

export const stopGapActionSchema = Yup.object().shape({
  whatYouDid: Yup.string().trim().required('Please say what you did'),
});

export const customerGotSchema = Yup.object().shape({
  settlementType: Yup.string().required('Please select what we gave them'),
  pieces: Yup.number()
    .nullable()
    .when('settlementType', {
      is: type => SETTLEMENT_SHOW_PIECES_AND_COST.includes(type),
      then: schema => schema.typeError('Enter how many pieces').required('Enter how many pieces').moreThan(0, 'Must be greater than 0'),
      otherwise: schema => schema.nullable(),
    }),
  cost: Yup.number()
    .nullable()
    .when('settlementType', {
      is: type => SETTLEMENT_SHOW_PIECES_AND_COST.includes(type) || SETTLEMENT_SHOW_COST_ONLY.includes(type),
      then: schema => schema.typeError('Enter the cost').required('Enter what it cost us').min(0, 'Cost cannot be negative'),
      otherwise: schema => schema.nullable(),
    }),
  summary: Yup.string().trim().required('Please write a one-line summary'),
});

export const moveToVerifiedSchema = Yup.object().shape({
  whatHappened: Yup.string().trim().required('Please say what happened'),
});

export const fixHeldSchema = Yup.object().shape({
  result: Yup.string().required('Please select whether it worked'),
  howKnow: Yup.string().trim().required('Please say how you know'),
});

export const closeComplaintSchema = Yup.object().shape({
  howItEnded: Yup.string().trim().required('Please say how it ended'),
  customerRating: Yup.number().nullable().min(1, 'Please rate the customer happiness').max(5),
});

export const reopenComplaintSchema = Yup.object().shape({
  reason: Yup.string().required('Please select why you are opening it again'),
  note: Yup.string().trim().nullable(),
});

export const skipStepSchema = Yup.object().shape({
  skipReason: Yup.string().trim().required('Please say why you are skipping this step'),
});
