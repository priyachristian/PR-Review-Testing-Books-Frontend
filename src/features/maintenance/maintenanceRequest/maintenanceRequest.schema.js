import * as Yup from 'yup';

export const MAINTENANCE_REQUEST_TYPES = [
  { label: 'Breakdown', value: 'BREAKDOWN' },
  { label: 'Preventive', value: 'PREVENTIVE' },
];

export const MAINTENANCE_REQUEST_PRIORITIES = [
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Normal', value: 'NORMAL' },
];

export const MAINTENANCE_REQUEST_STATUSES = [
  { label: 'Raised', value: 'RAISED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const typeValues = MAINTENANCE_REQUEST_TYPES.map(item => item.value);
const priorityValues = MAINTENANCE_REQUEST_PRIORITIES.map(item => item.value);

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

export const raiseCallInitialValues = {
  type: null,
  priority: null,
  machineId: null,
  branchId: null,
  slaHours: '',
  problemDescription: '',
  isMachineStopped: false,
};

export const raiseCallValidateSchema = Yup.object({
  type: Yup.string().oneOf(typeValues, 'Please select a type').required('Please select a type'),
  priority: Yup.string().oneOf(priorityValues, 'Please select a priority').required('Please select a priority'),
  machineId: Yup.string().required('Please select a machine'),
  branchId: Yup.string().required('Please select a branch'),
  slaHours: Yup.number().transform(emptyNumberToNull).nullable().typeError('Enter a valid number').integer('Must be a whole number').min(1, 'Must be at least 1'),
  problemDescription: Yup.string().trim().required('Please enter the problem'),
  isMachineStopped: Yup.boolean(),
});

export const buildRaiseCallPayload = values => {
  const payload = {
    type: values.type,
    priority: values.priority,
    machineId: values.machineId,
    branchId: values.branchId,
    problemDescription: values.problemDescription.trim(),
    isMachineStopped: Boolean(values.isMachineStopped),
  };

  if (values.slaHours !== '' && values.slaHours != null) {
    payload.slaHours = Number(values.slaHours);
  }

  return payload;
};

export const approveRequestSchema = Yup.object({
  remark: Yup.string().trim(),
});

export const rejectRequestSchema = Yup.object({
  rejectReason: Yup.string().trim().required('Please enter a reject reason'),
});

export const assignTechnicianSchema = Yup.object({
  assigneeId: Yup.string().required('Please select a technician'),
  mode: Yup.string().oneOf(['internal', 'vendor'], 'Please select a mode').required('Please select a mode'),
  targetAt: Yup.mixed().nullable().required('Please select a target date'),
  estimatedHours: Yup.number().transform(emptyNumberToNull).nullable().typeError('Enter a valid number').integer('Must be a whole number').min(1, 'Must be at least 1'),
});

const faultCategories = ['MECHANICAL', 'ELECTRICAL', 'HYDRAULIC', 'PNEUMATIC', 'SOFTWARE', 'OPERATOR_ERROR', 'WEAR_AND_TEAR', 'OTHER'];

const optionalNumber = Yup.number().transform(emptyNumberToNull).nullable().typeError('Enter a valid number').min(0, 'Must be 0 or more');

export const completeWorkSchema = Yup.object({
  workDone: Yup.string().trim().required('Please enter the work done'),
  faultCategory: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .oneOf([null, ...faultCategories], 'Please select a fault category'),
  subCause: Yup.string().trim(),
  preventiveAction: Yup.string().trim(),
  laborHours: optionalNumber,
  vendorCost: optionalNumber,
});

export const closeRequestSchema = Yup.object({
  closeRemark: Yup.string().trim(),
  isFirstTimeFix: Yup.boolean(),
});

export const requestPartSchema = Yup.object({
  sparePartId: Yup.string().required('Please select a spare part'),
  requestedQty: Yup.number()
    .transform(emptyNumberToNull)
    .nullable()
    .typeError('Enter a valid number')
    .integer('Must be a whole number')
    .moreThan(0, 'Must be greater than 0')
    .required('Please enter the quantity'),
});
