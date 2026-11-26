import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks

// Extras
import { useItemMaster, addDropdownValidateSchema, addGroupDropdownValidateSchema } from '@/features/allMaster/item';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { MODULE_NAMES } from '@/utils/constants';

const AddDropDown = ({ modalOpen, setModalOpen }) => {
  const dispatch = useDispatch();
  const { itemUnit, createItemUnit, deleteItemUnit, getItemUnit } = useItemMaster();

  useEffect(() => {
    const controller = new AbortController();
    getItemUnit({ signal: controller.signal });
    return () => controller.abort();
  }, [dispatch, getItemUnit]);

  const initialValues = {
    name: '',
  };

  const handleDeleteItem = id => {
    deleteItemUnit({ itemUnitId: id });
  };

  const onFinish = async values => {
    const itemUnitDetails = {
      name: values.name,
    };
    const response = await createItemUnit(itemUnitDetails);
    if (response?.type?.endsWith('/fulfilled')) {
      setModalOpen(false);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Add Item Unit">
        <div>
          <Formik initialValues={initialValues} validationSchema={addDropdownValidateSchema} onSubmit={onFinish}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
              <CustomForm name="AddCustomField" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
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
                />
                <div className="grid gap-3 grid-cols-2 pt-5">
                  {itemUnit.map((data, index) => (
                    <div key={index} className="border hover:border-[--orange] rounded flex items-center justify-between p-1.5">
                      <div>{data.name}</div>
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleDeleteItem(data.id);
                          }
                        }}
                        className="hover:text-red-500 cursor-pointer"
                        onClick={() => handleDeleteItem(data.id)}
                      >
                        <Icons.DeleteOutlined />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 justify-center items-center pt-7">
                  <CustomButton className="px-7 py-4" text="Cancel" type="default" block onClick={() => setModalOpen(false)} />
                  <CustomButton className="px-7 py-4" text="Save" type="primary" block onClick={handleSubmit} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};

export default AddDropDown;

export const AddGroupDropDown = ({ modalOpen, setModalOpen, getList }) => {
  const dispatch = useDispatch();
  const { itemGroup, createItemGroup, deleteItemGroup, getItemGroup, loading, deleteLoading } = useItemGroup();
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const [itemGroupConfig, setItemGroupConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    getItemGroup({ signal: controller.signal });
    return () => controller.abort();
  }, [dispatch, getItemGroup]);

  useEffect(() => {
    if (!modalOpen) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.ITEMGROUP,
    });
    return () => controller.abort();
  }, [modalOpen, getModuleConfig]);

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
      itemGroupId: itemGroupConfig.autoGenerate ? `${itemGroupConfig.prefix}${itemGroupConfig.nextNumber}` : '',
      name: '',
    }),
    [itemGroupConfig]
  );

  const handleDeleteItem = async id => {
    if (deleteLoading) return;
    const response = await deleteItemGroup({ itemGroupId: id });
    if (response?.payload?.code === 1) {
      getItemGroup({});
      if (getList) getList();
    }
  };

  const onFinish = async (values, { resetForm }) => {
    if (loading) return;
    const itemUnitDetails = {
      itemGroupId: values.itemGroupId,
      name: values.name,
    };
    try {
      await createItemGroup(itemUnitDetails);
      setModalOpen(false);
      if (getList) getList();
      resetForm();
    } catch {
      // error already handled in slice
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Add Item Group">
        <div>
          <Formik initialValues={initialValues} validationSchema={addGroupDropdownValidateSchema} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
              <CustomForm name="AddCustomField" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
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
                />
                <div className="grid gap-3 grid-cols-2 pt-5">
                  {itemGroup?.map((data, index) => (
                    <div key={data.id || data._id || index} className="border hover:border-[--orange] rounded flex items-center justify-between p-1.5">
                      <div className="truncate pr-2" title={data.name}>
                        {data.name}
                      </div>
                      <button
                        type="button"
                        disabled={deleteLoading}
                        aria-disabled={deleteLoading}
                        className={`flex-shrink-0 bg-transparent border-0 p-0 ${deleteLoading ? 'cursor-not-allowed opacity-40 pointer-events-none' : 'hover:text-red-500 cursor-pointer'}`}
                        onClick={() => !deleteLoading && handleDeleteItem(data.id || data._id)}
                      >
                        <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                      </button>
                    </div>
                  ))}
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
                  <CustomButton className="px-7 py-4" text="Save" type="primary" loading={loading} onClick={handleSubmit} style={{ minWidth: 80 }} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};
