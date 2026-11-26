import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { useMachine } from '@/features/maintenance/machine';
import { useWarehouse } from '@/features/allMaster/warehouse/useWarehouse';
import { buildRaiseCallPayload, MAINTENANCE_REQUEST_PRIORITIES, MAINTENANCE_REQUEST_TYPES, raiseCallInitialValues, raiseCallValidateSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const RaiseCallModal = ({ open, onClose, onSuccess }) => {
  const { machineDropdown, dropdownLoading: machineDropdownLoading, getMachineDropdown } = useMachine();
  const { branchDrop, droploading: branchDropdownLoading, getBranchDropDown } = useWarehouse();
  const { submitLoading, createMaintenanceRequest } = useMaintenanceRequest();

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    getMachineDropdown({ signal: controller.signal });
    getBranchDropDown({ signal: controller.signal });

    return () => controller.abort();
  }, [open, getMachineDropdown, getBranchDropDown]);

  const machineOptions = useMemo(
    () =>
      (machineDropdown || []).map(machine => ({
        value: machine.id || machine._id,
        label: [machine.machineCode, machine.machineName].filter(Boolean).join(' - '),
      })),
    [machineDropdown]
  );

  const branchOptions = useMemo(
    () =>
      (branchDrop || []).map(branch => ({
        value: branch.id || branch._id,
        label: [branch.branchCode, branch.name].filter(Boolean).join(' - '),
      })),
    [branchDrop]
  );

  const handleSubmit = async values => {
    if (submitLoading) return;

    try {
      await createMaintenanceRequest(buildRaiseCallPayload(values));
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
        if (!nextOpen && !submitLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={submitLoading}
      width={640}
      title="Create Maintenance Request"
    >
      <Formik initialValues={raiseCallInitialValues} validationSchema={raiseCallValidateSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="raiseCall" onFinish={submitForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <CustomInput
                type="select"
                name="type"
                label="Type"
                placeholder="Select type"
                value={values.type}
                onBlur={handleBlur}
                errorMessage={errors.type}
                touched={touched.type}
                setFieldValue={setFieldValue}
                selectOptions={MAINTENANCE_REQUEST_TYPES}
                required
                allowClear
              />
              <CustomInput
                type="select"
                name="priority"
                label="Priority"
                placeholder="Select priority"
                value={values.priority}
                onBlur={handleBlur}
                errorMessage={errors.priority}
                touched={touched.priority}
                setFieldValue={setFieldValue}
                selectOptions={MAINTENANCE_REQUEST_PRIORITIES}
                required
                allowClear
              />
              <CustomInput
                type="select"
                name="machineId"
                label="Machine"
                placeholder="Select machine"
                value={values.machineId}
                onBlur={handleBlur}
                errorMessage={errors.machineId}
                touched={touched.machineId}
                setFieldValue={setFieldValue}
                selectOptions={machineOptions}
                loading={machineDropdownLoading}
                required
                allowClear
              />
              <CustomInput
                type="select"
                name="branchId"
                label="Branch"
                placeholder="Select branch"
                value={values.branchId}
                onBlur={handleBlur}
                errorMessage={errors.branchId}
                touched={touched.branchId}
                setFieldValue={setFieldValue}
                selectOptions={branchOptions}
                loading={branchDropdownLoading}
                required
                allowClear
              />
              <CustomInput
                type="number"
                name="slaHours"
                label="SLA Hours"
                placeholder="Enter SLA hours"
                decimalPlaces={0}
                min={1}
                value={values.slaHours}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.slaHours}
                touched={touched.slaHours}
                setFieldValue={setFieldValue}
              />
              <div className="pt-7">
                <CustomInput type="checkbox" name="isMachineStopped" label="" CheckboxName="Machine is stopped" value={values.isMachineStopped} onBlur={handleBlur} setFieldValue={setFieldValue} />
              </div>
            </div>
            <div className="mt-3">
              <CustomInput
                type="textarea"
                name="problemDescription"
                label="Problem"
                placeholder="Describe the problem"
                rows={3}
                value={values.problemDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.problemDescription}
                touched={touched.problemDescription}
                setFieldValue={setFieldValue}
                required
              />
            </div>
            <div className="flex gap-4 justify-end items-center pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={submitLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Save" type="primary" onClick={submitForm} loading={submitLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RaiseCallModal;
