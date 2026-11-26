import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { completeWorkSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const FAULT_CATEGORIES = [
  { label: 'Mechanical', value: 'MECHANICAL' },
  { label: 'Electrical', value: 'ELECTRICAL' },
  { label: 'Hydraulic', value: 'HYDRAULIC' },
  { label: 'Pneumatic', value: 'PNEUMATIC' },
  { label: 'Software', value: 'SOFTWARE' },
  { label: 'Operator Error', value: 'OPERATOR_ERROR' },
  { label: 'Wear And Tear', value: 'WEAR_AND_TEAR' },
  { label: 'Other', value: 'OTHER' },
];

const completeWorkInitialValues = {
  workDone: '',
  faultCategory: null,
  subCause: '',
  preventiveAction: '',
  laborHours: '',
  vendorCost: '',
};

const optionalText = value => {
  const text = value?.trim();
  return text || undefined;
};

const optionalNumber = value => {
  if (value === '' || value == null) return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
};

const buildCompletePayload = (maintenanceRequestId, values) => {
  const faultCategory = values.faultCategory || undefined;
  const subCause = optionalText(values.subCause);
  const preventiveAction = optionalText(values.preventiveAction);
  const laborHours = optionalNumber(values.laborHours);
  const vendorCost = optionalNumber(values.vendorCost);

  return {
    maintenanceRequestId,
    workDone: values.workDone.trim(),
    ...(faultCategory ? { faultCategory } : {}),
    ...(subCause ? { subCause } : {}),
    ...(preventiveAction ? { preventiveAction } : {}),
    ...(laborHours !== undefined ? { laborHours } : {}),
    ...(vendorCost !== undefined ? { vendorCost } : {}),
  };
};

const optionalLabel = text => (
  <span>
    {text} <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
  </span>
);

const CompleteWorkModal = ({ open, request, onClose, onSuccess }) => {
  const { completeLoading, completeMaintenanceRequest } = useMaintenanceRequest();

  const handleSubmit = async values => {
    if (completeLoading) return;

    try {
      await completeMaintenanceRequest(buildCompletePayload(request?.id || request?._id, values));
      onSuccess?.();
      onClose();
    } catch {
      // The slice already shows the error toast.
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen && !completeLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={completeLoading}
      width={640}
      title="Mark Completed"
    >
      <Formik initialValues={completeWorkInitialValues} validationSchema={completeWorkSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="completeMaintenanceRequest" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'This request'} will move to Completed.</p>
            <CustomInput
              type="textarea"
              name="workDone"
              label="Work Done"
              placeholder="What was done"
              rows={3}
              value={values.workDone}
              onBlur={handleBlur}
              errorMessage={errors.workDone}
              touched={touched.workDone}
              setFieldValue={setFieldValue}
              required
            />
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <CustomInput
                type="select"
                name="faultCategory"
                label={optionalLabel('Fault Category')}
                placeholder="Select category"
                value={values.faultCategory}
                onBlur={handleBlur}
                errorMessage={errors.faultCategory}
                touched={touched.faultCategory}
                setFieldValue={setFieldValue}
                selectOptions={FAULT_CATEGORIES}
                allowClear
              />
              <CustomInput
                type="text"
                name="subCause"
                label={optionalLabel('Sub Cause')}
                placeholder="Enter sub cause"
                value={values.subCause}
                onBlur={handleBlur}
                errorMessage={errors.subCause}
                touched={touched.subCause}
                setFieldValue={setFieldValue}
              />
              <CustomInput
                type="number"
                name="laborHours"
                label={optionalLabel('Labor Hours')}
                placeholder="Enter hours"
                decimalPlaces={2}
                min={0}
                value={values.laborHours}
                onBlur={handleBlur}
                errorMessage={errors.laborHours}
                touched={touched.laborHours}
                setFieldValue={setFieldValue}
              />
              <CustomInput
                type="number"
                name="vendorCost"
                label={optionalLabel('Vendor Cost')}
                placeholder="Enter cost"
                decimalPlaces={2}
                min={0}
                value={values.vendorCost}
                onBlur={handleBlur}
                errorMessage={errors.vendorCost}
                touched={touched.vendorCost}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="mt-3">
              <CustomInput
                type="textarea"
                name="preventiveAction"
                label={optionalLabel('Preventive Action')}
                placeholder="What should prevent this next time"
                rows={2}
                value={values.preventiveAction}
                onBlur={handleBlur}
                errorMessage={errors.preventiveAction}
                touched={touched.preventiveAction}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={completeLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Mark Completed" type="primary" onClick={submitForm} loading={completeLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default CompleteWorkModal;
