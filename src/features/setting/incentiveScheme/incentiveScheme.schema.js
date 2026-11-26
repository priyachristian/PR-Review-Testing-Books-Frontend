import * as Yup from 'yup';
import dayjs from 'dayjs';
import { CALC_METHOD_OPTIONS, DOC_TYPE_OPTIONS } from '@/utils/constants';

const VALID_DOC_TYPES = DOC_TYPE_OPTIONS.map(option => option.value);
const VALID_CALC_METHODS = CALC_METHOD_OPTIONS.map(option => option.value);
const VALID_INCENTIVE_TYPES = ['PERCENTAGE', 'FIXED'];
const VALID_STATUSES = ['DRAFT', 'ACTIVE'];

const toNumber = o => (o === '' || o == null ? undefined : Number(o));
const toNumberOrZero = o => (o === '' || o == null ? 0 : Number(o));
const toNumberOrNull = o => (o === '' || o == null ? null : Number(o));

const docTypeSchema = Yup.object({
  docType: Yup.string().oneOf(VALID_DOC_TYPES, 'Select a valid document type').required('Select document type'),
  calcMethod: Yup.string().oneOf(VALID_CALC_METHODS, 'Select a valid calc method').default('PER_DOC_AMOUNT'),
  incentiveType: Yup.string().oneOf(VALID_INCENTIVE_TYPES, 'Select a valid type').default('PERCENTAGE'),
  incentiveValue: Yup.number().transform(toNumberOrZero).typeError('Enter incentive value').min(0, 'Incentive value must be at least 0').default(0),
  allocatedBudget: Yup.number().transform(toNumberOrZero).typeError('Enter allocated budget').min(0, 'Allocated budget must be at least 0').default(0),
  itemGroups: Yup.array().of(Yup.string()).default([]),
  items: Yup.array().of(Yup.string()).default([]),
}).test('doc-type-config', '', function (value) {
  const { docType, calcMethod, itemGroups, items } = value || {};

  if (docType === 'PAYMENT_RECEIVED' && calcMethod !== 'PER_DOC_AMOUNT') {
    return this.createError({
      path: `${this.path}.calcMethod`,
      message: 'PAYMENT_RECEIVED supports only PER_DOC_AMOUNT calculation.',
    });
  }

  if (calcMethod === 'PER_ITEM_GROUP' && (!itemGroups || itemGroups.length === 0)) {
    return this.createError({
      path: `${this.path}.itemGroups`,
      message: 'Please select at least one Item Group when Calculation Method is PER_ITEM_GROUP.',
    });
  }

  if (calcMethod !== 'PER_ITEM_GROUP' && itemGroups?.length) {
    return this.createError({
      path: `${this.path}.itemGroups`,
      message: 'Item Groups can only be selected when Calculation Method is PER_ITEM_GROUP.',
    });
  }

  if (calcMethod === 'PER_ITEM' && (!items || items.length === 0)) {
    return this.createError({
      path: `${this.path}.items`,
      message: 'Please select at least one Item when Calculation Method is PER_ITEM.',
    });
  }

  if (calcMethod !== 'PER_ITEM' && items?.length) {
    return this.createError({
      path: `${this.path}.items`,
      message: 'Items can only be selected when Calculation Method is PER_ITEM.',
    });
  }

  return true;
});

export const getIncentiveSchemeValidateSchema = (isEdit = false) =>
  Yup.object({
    name: Yup.string().trim().required('Scheme name is required'),
    totalBudget: Yup.number().transform(toNumber).typeError('Enter total budget').min(0, 'Total budget must be at least 0').required('Total budget is required'),
    dateRange: Yup.array()
      .nullable()
      .min(2, 'Select scheme period')
      .required('Select scheme period')
      .test('end-after-start', 'End date must be on or after start date', value => {
        if (!value?.[0] || !value?.[1]) return true;
        return new Date(value[1]) >= new Date(value[0]);
      })
      .test('end-not-past', 'End date cannot be in the past', value => {
        if (isEdit || !value?.[1]) return true;
        return !dayjs(value[1]).startOf('day').isBefore(dayjs().startOf('day'));
      }),
    docTypes: Yup.array().of(docTypeSchema).min(1, 'Add at least one document type').required('Add at least one document type'),
    assignedUsers: Yup.array().of(Yup.string()).default([]),
    perUserBudgetCap: Yup.number().nullable().transform(toNumberOrNull).typeError('Enter per-user budget cap').min(0, 'Per-user budget cap must be at least 0'),
    alertThreshold: Yup.number()
      .transform((v, o) => (o === '' || o == null ? 80 : Number(o)))
      .typeError('Enter alert threshold')
      .min(1, 'Alert threshold must be at least 1')
      .max(100, 'Alert threshold cannot exceed 100')
      .default(80),
    status: Yup.string().oneOf(VALID_STATUSES),
  }).test('budget-allocation', '', function (values) {
    const { totalBudget, docTypes, perUserBudgetCap } = values || {};
    const budget = Number(totalBudget) || 0;

    const totalAllocatedBudget = (docTypes || []).reduce((sum, doc) => sum + (Number(doc?.allocatedBudget) || 0), 0);

    if (totalAllocatedBudget > budget) {
      return this.createError({
        path: 'docTypes',
        message: `Total allocated budget (${totalAllocatedBudget}) cannot exceed total budget (${budget}).`,
      });
    }

    if (perUserBudgetCap != null && Number(perUserBudgetCap) > budget) {
      return this.createError({
        path: 'perUserBudgetCap',
        message: `Per user budget cap (${perUserBudgetCap}) cannot exceed total budget (${budget}).`,
      });
    }

    return true;
  });

export const incentiveSchemeValidateSchema = getIncentiveSchemeValidateSchema(false);
