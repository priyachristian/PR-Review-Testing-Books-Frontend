import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import { addDropdownValidateSchema } from '@/features/allMaster/item';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const AddSubItemGroupModal = ({ modalOpen, setModalOpen, getList }) => {
  const dispatch = useDispatch();
  const { subItemGroup, createSubItemGroup, deleteSubItemGroup, getSubItemGroup, loading, deleteLoading } = useSubItemGroup();

  useEffect(() => {
    const controller = new AbortController();
    getSubItemGroup({ signal: controller.signal });
    return () => controller.abort();
  }, [dispatch, getSubItemGroup]);

  const initialValues = { name: '' };

  const handleDeleteItem = async id => {
    if (deleteLoading) return;
    const response = await deleteSubItemGroup({ subItemGroupId: id });
    if (response?.payload?.code === 1 || response?.meta?.requestStatus === 'fulfilled') {
      getSubItemGroup({});
      if (getList) getList();
    }
  };

  const onFinish = async (values, { resetForm }) => {
    if (loading) return;
    try {
      await createSubItemGroup({ name: values.name });
      setModalOpen(false);
      if (getList) getList();
      resetForm();
    } catch (error) {
      console.error('Failed to create sub item group:', error);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Add Sub Item Group">
        <div>
          <Formik initialValues={initialValues} validationSchema={addDropdownValidateSchema} onSubmit={onFinish}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
              <CustomForm name="AddSubItemGroup" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
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
                <div className="grid gap-3 grid-cols-2 pt-5 max-h-60 overflow-y-auto">
                  {subItemGroup?.map((data, index) => {
                    const itemId = data.id || data._id;

                    return (
                      <div key={itemId || index} className="border hover:border-[--orange] rounded flex items-center justify-between p-1.5">
                        <div className="truncate pr-2" title={data.name}>
                          {data.name}
                        </div>
                        <button
                          type="button"
                          disabled={deleteLoading}
                          aria-disabled={deleteLoading}
                          className={`flex-shrink-0 bg-transparent border-0 p-0 ${deleteLoading ? 'cursor-not-allowed opacity-40 pointer-events-none' : 'hover:text-red-500 cursor-pointer'}`}
                          onClick={() => !deleteLoading && handleDeleteItem(itemId)}
                        >
                          <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 justify-end items-center pt-7">
                  <CustomButton
                    className="px-7 py-4"
                    text="Cancel"
                    type="default"
                    onClick={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                  />
                  <CustomButton className="px-7 py-4" text="Save" type="primary" onClick={handleSubmit} style={{ minWidth: 80 }} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};

export default AddSubItemGroupModal;
