import dayjs from 'dayjs';
import * as Yup from 'yup';

export const MACHINE_CRITICALITY = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
];

export const MACHINE_STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export const MACHINE_AMC_OPTIONS = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export const MACHINE_PM_TASK_TYPES = [
  { label: 'Lube', value: 'LUBE' },
  { label: 'Clean', value: 'CLEAN' },
  { label: 'Electrical', value: 'ELEC' },
  { label: 'Mechanical', value: 'MECH' },
  { label: 'Safety', value: 'SAFETY' },
];

const criticalityValues = MACHINE_CRITICALITY.map(item => item.value);
const taskTypeValues = MACHINE_PM_TASK_TYPES.map(item => item.value);

const emptyNumberToNull = (value, originalValue) => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) return null;
  return value;
};

const optionalWholeNumber = Yup.number().transform(emptyNumberToNull).nullable().typeError('Enter a valid number').integer('Must be a whole number').min(0, 'Must be 0 or more');

export const machineValidateSchema = Yup.object({
  machineName: Yup.string().trim().required('Please enter the machine name'),
  location: Yup.string().trim().required('Please enter the location'),
  process: Yup.string().trim().required('Please enter the process'),
  criticality: Yup.string().oneOf(criticalityValues, 'Please select a criticality').required('Please select a criticality'),
  hasAMC: Yup.boolean(),
  pmFrequencyDays: optionalWholeNumber,
  lastPMDate: Yup.mixed().nullable(),
  nextPMDueDate: Yup.mixed()
    .nullable()
    .test('after-last-pm', 'Next PM due date must be on or after the last PM date', function validateNextPm(value) {
      const { lastPMDate } = this.parent;
      if (!value || !lastPMDate) return true;
      return !dayjs(value).isBefore(dayjs(lastPMDate), 'day');
    }),
  pmTasks: Yup.array().of(
    Yup.object({
      taskType: Yup.string().nullable().oneOf(taskTypeValues, 'Please select a task type').required('Please select a task type'),
      description: Yup.string().trim().nullable(),
      isRequired: Yup.boolean(),
    })
  ),
  wearParts: Yup.array().of(
    Yup.object({
      sparePartId: Yup.string().nullable().required('Please select a spare part'),
      avgLifeHours: optionalWholeNumber.required('Please enter average life hours'),
      uom: Yup.string()
        .nullable()
        .test('uom-required', 'Please select a unit', function validateUom(value) {
          if (!this.parent?.sparePartId) return true;
          return Boolean(value);
        }),
    })
  ),
});
