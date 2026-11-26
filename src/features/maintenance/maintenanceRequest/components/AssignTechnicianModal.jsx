import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { useUser } from '@/features/setting/user/useUser';
import { assignTechnicianSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const ASSIGN_MODES = [
  { label: 'Internal', value: 'internal' },
  { label: 'Vendor', value: 'vendor' },
];

const assignTechnicianInitialValues = {
  assigneeId: null,
  mode: 'internal',
  targetAt: null,
  estimatedHours: '',
};

const buildAssignPayload = (maintenanceRequestId, values) => {
  const estimatedHours = values.estimatedHours === '' || values.estimatedHours == null ? null : Number(values.estimatedHours);

  return {
    maintenanceRequestId,
    assigneeId: values.assigneeId,
    mode: values.mode,
    targetAt: dayjs(values.targetAt).format('YYYY-MM-DD'),
    ...(estimatedHours ? { estimatedHours } : {}),
  };
};

const AssignTechnicianModal = ({ open, request, onClose, onSuccess }) => {
  const { assignLoading, assignMaintenanceRequest } = useMaintenanceRequest();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    getUsersDropdown({ signal: controller.signal });

    return () => controller.abort();
  }, [open, getUsersDropdown]);

  const technicianOptions = useMemo(
    () =>
      (usersDropdown || []).map(user => ({
        value: user.id || user._id,
        label: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '',
      })),
    [usersDropdown]
  );

  const handleSubmit = async values => {
    if (assignLoading) return;

    try {
      await assignMaintenanceRequest(buildAssignPayload(request?.id || request?._id, values));
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
        if (!nextOpen && !assignLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={assignLoading}
      width={560}
      title="Assign Technician"
    >
      <Formik initialValues={assignTechnicianInitialValues} validationSchema={assignTechnicianSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="assignTechnician" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'This request'} will move to Assigned.</p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <CustomInput
                type="select"
                name="assigneeId"
                label="Technician"
                placeholder="Select technician"
                value={values.assigneeId}
                onBlur={handleBlur}
                errorMessage={errors.assigneeId}
                touched={touched.assigneeId}
                setFieldValue={setFieldValue}
                selectOptions={technicianOptions}
                loading={usersDropdownLoading}
                required
                allowClear
              />
              <CustomInput
                type="select"
                name="mode"
                label="Mode"
                placeholder="Select mode"
                value={values.mode}
                onBlur={handleBlur}
                errorMessage={errors.mode}
                touched={touched.mode}
                setFieldValue={setFieldValue}
                selectOptions={ASSIGN_MODES}
                required
              />
              <CustomInput
                type="date"
                name="targetAt"
                label="Target Date"
                placeholder="Select date"
                value={values.targetAt}
                onBlur={handleBlur}
                errorMessage={errors.targetAt}
                touched={touched.targetAt}
                setFieldValue={setFieldValue}
                format="DD/MM/YYYY"
                required
              />
              <CustomInput
                type="number"
                name="estimatedHours"
                label={
                  <span>
                    Estimated Hours <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                  </span>
                }
                placeholder="Enter hours"
                decimalPlaces={0}
                min={1}
                value={values.estimatedHours}
                onBlur={handleBlur}
                errorMessage={errors.estimatedHours}
                touched={touched.estimatedHours}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={assignLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Assign" type="primary" onClick={submitForm} loading={assignLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AssignTechnicianModal;
