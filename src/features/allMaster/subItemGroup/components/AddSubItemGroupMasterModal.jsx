import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import { addDropdownValidateSchema } from '@/features/allMaster/item';

const AddSubItemGroupMasterModal = ({ showModal, setModalOpen, subItemGroup, onSuccess }) => {
  const { createSubItemGroup, updateSubItemGroup, loading } = useSubItemGroup();

  const isEdit = Boolean(subItemGroup);

  const initialValues = useMemo(
    () => ({
      subItemGroupNo: subItemGroup?.subItemGroupNo || '',
      name: subItemGroup?.name || '',
    }),
    [subItemGroup]
  );

  const onFinish = async values => {
    if (loading) return;
    try {
      if (subItemGroup) {
        const result = await updateSubItemGroup({ subItemGroupId: subItemGroup?.id || subItemGroup?._id, name: values.name });
        if (!result?.payload) return;
      } else {
        await createSubItemGroup({ name: values.name });
      }
      setModalOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save sub item group:', error);
    }
  };

  return (
    <CustomModal
      modalOpen={showModal}
      setModalOpen={open => {
        if (!open) setModalOpen(false);
      }}
      destroyOnClose={true}
      title={subItemGroup ? 'Edit Sub Item Group' : 'Add Sub Item Group'}
    >
      <Formik initialValues={initialValues} enableReinitialize validationSchema={addDropdownValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
          <CustomForm name="SubItemGroupMaster" onFinish={handleSubmit}>
            {isEdit && (
              <CustomInput
                type="text"
                name="subItemGroupNo"
                label="Sub Item Group Number"
                placeholder="Sub Item Group Number"
                className="mb-2"
                value={values.subItemGroupNo}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.subItemGroupNo}
                touched={touched.subItemGroupNo}
                setFieldValue={setFieldValue}
                disabled
              />
            )}
            <CustomInput
              type="text"
              name="name"
              label="Sub Item Group Name"
              placeholder="Enter Sub Item Group Name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
              setFieldValue={setFieldValue}
              required={true}
            />
            <div className="flex items-center gap-4 pt-4 justify-end">
              <CustomButton className="px-8 py-3" type="default" text="Cancel" onClick={() => setModalOpen(false)} />
              <CustomButton className="px-8 py-3" type="primary" text="Save" loading={loading} onClick={handleSubmit} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AddSubItemGroupMasterModal;
