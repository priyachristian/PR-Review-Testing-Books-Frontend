import { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

// Hooks
import { useModuleConfig } from '@/hooks/useModuleConfig';

// Extras
import { workerValidateSchema } from '@/features/allMaster/manPower';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { MODULE_NAMES } from '@/utils/constants';

const AddWorkerModal = ({ visible, onClose, refreshWorkers, createWorker, workerData, updateWorker, submitLoading }) => {
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const [manPowerConfig, setManPowerConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const isEdit = !!workerData;

  useEffect(() => {
    if (!visible || isEdit) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.MANPOWER,
    });
    return () => controller.abort();
  }, [visible, isEdit, getModuleConfig]);

  useEffect(() => {
    if (!moduleConfig) return;
    setManPowerConfig({
      autoGenerate: moduleConfig?.useCustomPrefix ?? true,
      prefix: moduleConfig?.prefix ?? '',
      nextNumber: moduleConfig?.nextSequence ?? '',
    });
  }, [moduleConfig]);

  const initialValues = useMemo(
    () => ({
      workerNo: workerData?.workerNo || (manPowerConfig.autoGenerate ? `${manPowerConfig.prefix}${manPowerConfig.nextNumber}` : ''),
      workerName: workerData?.workerName || '',
      perHourSalary: workerData?.perHourSalary ?? '',
      departmentName: workerData?.departmentName || '',
    }),
    [workerData, manPowerConfig]
  );

  const onFinish = async values => {
    if (submitLoading) return;

    if (isEdit) {
      await updateWorker({
        id: workerData.id,
        workerData: {
          workerName: values.workerName,
          perHourSalary: values.perHourSalary,
          departmentName: values.departmentName,
        },
      });
    } else {
      const payload = {
        workerNo: values.workerNo,
        workerName: values.workerName,
        perHourSalary: values.perHourSalary,
        departmentName: values.departmentName,
      };
      await createWorker(payload);
    }

    refreshWorkers();
    onClose();
  };

  return (
    <CustomModal
      modalOpen={visible}
      setModalOpen={open => {
        if (!open) onClose();
      }}
      destroyOnClose={true}
      title={isEdit ? 'Edit Worker' : 'Add Worker'}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={workerValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm onFinish={handleSubmit} layout="vertical">
            <CustomInput
              type="text"
              name="workerNo"
              label="Worker Code"
              className="mb-2"
              placeholder="Auto-generated Worker Code"
              value={values.workerNo}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.workerNo}
              touched={touched.workerNo}
              setFieldValue={setFieldValue}
              disabled
            />
            <CustomInput
              type="text"
              name="workerName"
              label="Worker Name"
              className="mb-2"
              placeholder="Enter Worker Name"
              value={values.workerName}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.workerName}
              touched={touched.workerName}
              setFieldValue={setFieldValue}
              required={true}
            />
            <CustomInput
              type="text"
              name="departmentName"
              label="Department Name"
              className="mb-2"
              placeholder="Enter Department Name"
              value={values.departmentName}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.departmentName}
              touched={touched.departmentName}
              setFieldValue={setFieldValue}
            />
            <CustomInput
              type="number"
              name="perHourSalary"
              label="Salary Per Hour (₹)"
              placeholder="Enter hourly salary"
              min={0}
              value={values.perHourSalary}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.perHourSalary}
              touched={touched.perHourSalary}
              setFieldValue={setFieldValue}
              required={true}
            />
            <div className="flex gap-4 justify-end items-center pt-7">
              <CustomButton
                className="px-7 py-4"
                text="Cancel"
                type="default"
                disabled={submitLoading}
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              />
              <CustomButton className="px-7 py-4" text="Save" type="primary" loading={submitLoading} onClick={handleSubmit} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AddWorkerModal;
