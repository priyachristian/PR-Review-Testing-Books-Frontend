import { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useModuleConfig } from '@/hooks/useModuleConfig';

// Extras
import { useProcess, processValidateSchema } from '@/features/allMaster/process';
import { MODULE_NAMES } from '@/utils/constants';

const ProcessForm = ({ modalOpen, isEdit, handleModalClose, editingProcess, onFormSubmit }) => {
  const { submitLoading, addProcess, updateProcess } = useProcess();
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const [processConfig, setProcessConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  useEffect(() => {
    if (!modalOpen || isEdit) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.PROCESS,
    });
    return () => controller.abort();
  }, [modalOpen, isEdit, getModuleConfig]);

  useEffect(() => {
    if (!moduleConfig) return;
    setProcessConfig({
      autoGenerate: moduleConfig?.useCustomPrefix ?? true,
      prefix: moduleConfig?.prefix ?? '',
      nextNumber: moduleConfig?.nextSequence ?? '',
    });
  }, [moduleConfig]);

  const initialValues = useMemo(
    () => ({
      processId: isEdit && editingProcess ? editingProcess.processId : processConfig.autoGenerate ? `${processConfig.prefix}${processConfig.nextNumber}` : '',
      name: isEdit && editingProcess ? editingProcess.name : '',
    }),
    [isEdit, editingProcess, processConfig]
  );

  const onFinish = async values => {
    if (submitLoading) return;
    const payload = {
      processId: values.processId,
      name: values.name,
    };
    const action = isEdit ? await updateProcess({ id: editingProcess.id, name: values.name }) : await addProcess(payload);

    if (action?.payload) {
      onFormSubmit();
      handleModalClose();
    }
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) handleModalClose();
      }}
      destroyOnClose={true}
      title={isEdit ? 'Edit Process' : 'Add Process'}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={processValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm onFinish={handleSubmit} layout="vertical">
            <CustomInput
              type="text"
              name="processId"
              label="Process Code"
              className="mb-2"
              value={values.processId}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.processId}
              touched={touched.processId}
              setFieldValue={setFieldValue}
              disabled
            />
            <CustomInput
              type="text"
              className="pt-3 pb-4"
              name="name"
              label="Process Name"
              placeholder="Enter Process Name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
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
                  handleModalClose();
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

export default ProcessForm;
