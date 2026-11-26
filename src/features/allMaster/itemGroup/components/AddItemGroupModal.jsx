import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useItemGroup } from '@/features/allMaster/itemGroup';
import { addGroupDropdownValidateSchema } from '@/utils/validationsSchema';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { MODULE_NAMES } from '@/utils/constants';

const AddItemGroupModal = ({ showModal, setModalOpen, itemGroup, onSuccess }) => {
  const location = useLocation();
  const { createItemGroup, updateItemGroup, loading } = useItemGroup();
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const [itemGroupConfig, setItemGroupConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  useEffect(() => {
    if (!showModal || itemGroup) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.ITEMGROUP,
    });
    return () => controller.abort();
  }, [showModal, itemGroup, getModuleConfig]);

  useEffect(() => {
    if (!moduleConfig) return;
    setItemGroupConfig({
      autoGenerate: moduleConfig?.useCustomPrefix ?? true,
      prefix: moduleConfig?.prefix ?? '',
      nextNumber: moduleConfig?.nextSequence ?? '',
    });
  }, [moduleConfig]);

  const initialValues = useMemo(
    () => ({
      itemGroupId: itemGroup?.itemGroupId || itemGroup?.groupId || itemGroup?.id || (itemGroupConfig.autoGenerate ? `${itemGroupConfig.prefix}${itemGroupConfig.nextNumber}` : ''),
      name: itemGroup?.name || '',
    }),
    [itemGroup, itemGroupConfig]
  );

  const { navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const onFinish = async values => {
    if (loading) return;

    const itemUnitDetails = {
      itemGroupId: values.itemGroupId,
      name: values.name,
    };

    const result = itemGroup ? await updateItemGroup({ itemGroupId: itemGroup?.id || itemGroup?._id, name: values.name }) : await createItemGroup(itemUnitDetails);

    const saved = result?.payload?.data ?? result?.data;
    const targetId = itemGroup?.id || itemGroup?._id || saved?.id || saved?._id;

    setModalOpen(false);

    const detailsPath = `/item-group-master/${targetId}`;
    if (targetId && location.pathname === detailsPath) {
      onSuccess?.();
    } else if (targetId) {
      navigateAfterSave(detailsPath, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  return (
    <CustomModal
      modalOpen={showModal}
      setModalOpen={open => {
        if (!open) setModalOpen(false);
      }}
      destroyOnClose={true}
      title={
        <div className="flex justify-between items-start flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
          <div className="flex items-start gap-2">
            <span className="text-base font-semibold text-[#030711]">{itemGroup ? 'Edit Item Group' : 'Add Item Group'}</span>
          </div>
        </div>
      }
    >
      <div>
        <Formik initialValues={initialValues} validationSchema={addGroupDropdownValidateSchema} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => {
            updateFormValues(values);
            return (
              <CustomForm name="AddCustomField" onFinish={handleSubmit}>
                <CustomInput
                  type="text"
                  name="itemGroupId"
                  label="Item Group Id"
                  className="mb-2"
                  placeholder="Auto-generated Item Group Id"
                  value={values.itemGroupId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.itemGroupId}
                  touched={touched.itemGroupId}
                  setFieldValue={setFieldValue}
                  disabled
                />
                <CustomInput
                  type="text"
                  name="name"
                  label="Name"
                  placeholder="Enter Name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.name}
                  touched={touched.name}
                  setFieldValue={setFieldValue}
                  required
                />
                <div className="flex gap-4 justify-end items-center pt-7">
                  <CustomButton
                    className="px-7 py-4"
                    text="Cancel"
                    type="default"
                    disabled={loading}
                    onClick={() => {
                      resetForm();
                      setModalOpen(false);
                    }}
                  />
                  <CustomButton className="px-7 py-4" text="Save" type="primary" loading={loading} onClick={handleSubmit} />
                </div>
              </CustomForm>
            );
          }}
        </Formik>
      </div>
    </CustomModal>
  );
};

export default AddItemGroupModal;
