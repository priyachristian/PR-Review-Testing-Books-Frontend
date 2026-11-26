import { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useModuleConfig } from '@/hooks/useModuleConfig';
import { salesOrderTagValidateSchema, useSalesOrderTag } from '@/features/allMaster/salesOrderTag';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { RESOURCES } from '@/utils/jsonFile';
import { TAG_COLORS } from '@/utils/dropdownEnums';

const defaultTagColorHex = TAG_COLORS.find(c => c.label === 'Gray')?.value ?? '#6B7280';

const AddSalesOrderTagModal = ({ showModal, setModalOpen, salesOrderTag, searchParams }) => {
  const { createSalesOrderTag, getSalesOrderTag, updateSalesOrderTag, saveLoading } = useSalesOrderTag();
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const [tagConfig, setTagConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  useEffect(() => {
    if (!showModal || salesOrderTag) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: RESOURCES.SALES_ORDER_TAG,
    });
    return () => controller.abort();
  }, [showModal, salesOrderTag]);

  useEffect(() => {
    if (!moduleConfig) return;
    setTagConfig({
      autoGenerate: moduleConfig?.useCustomPrefix ?? true,
      prefix: moduleConfig?.prefix ?? '',
      nextNumber: moduleConfig?.nextSequence ?? '',
    });
  }, [moduleConfig]);

  const colorSelectOptions = useMemo(
    () =>
      TAG_COLORS.map(({ label, value }) => ({
        value,
        label: (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: value }} />
            <span>{label}</span>
          </span>
        ),
      })),
    []
  );

  const initialValues = useMemo(
    () => ({
      tagId: salesOrderTag?.tagId || (tagConfig.autoGenerate ? `${tagConfig.prefix}${tagConfig.nextNumber}` : ''),
      name: salesOrderTag?.name || '',
      color: salesOrderTag?.color || defaultTagColorHex,
    }),
    [salesOrderTag, tagConfig]
  );

  const onFinish = async values => {
    if (saveLoading) return;

    let result;
    if (salesOrderTag) {
      result = await updateSalesOrderTag({
        salesOrderTagId: salesOrderTag?.id ?? salesOrderTag?._id,
        name: values.name,
        color: values.color,
      });
    } else {
      result = await createSalesOrderTag({
        tagId: values.tagId,
        name: values.name,
        color: values.color,
      });
    }

    const success = result?.code === 1;

    if (success) {
      setModalOpen(false);
      const controller = new AbortController();
      getSalesOrderTag({
        signal: controller.signal,
        page: parseInt(searchParams.get('page')) || 1,
        limit: parseInt(searchParams.get('limit')) || DEFAULT_PAGE_SIZE,
        search: searchParams.get('search') || '',
        appName: searchParams.get('appName') || '',
      }).catch(() => {});
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
            <span className="text-base font-semibold text-[#030711]">{salesOrderTag ? 'Edit Sales Order Tag' : 'Add Sales Order Tag'}</span>
          </div>
        </div>
      }
    >
      <div>
        <Formik initialValues={initialValues} validationSchema={salesOrderTagValidateSchema} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
            <CustomForm name="AddSalesOrderTag" onFinish={handleSubmit}>
              <CustomInput
                type="text"
                name="tagId"
                label="Tag Code"
                placeholder="Auto-generated tag code"
                className="mb-2"
                value={values.tagId}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.tagId}
                touched={touched.tagId}
                setFieldValue={setFieldValue}
                disabled
              />
              <CustomInput
                type="text"
                name="name"
                label="Name"
                placeholder="Enter Name"
                className="mb-2"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.name}
                touched={touched.name}
                setFieldValue={setFieldValue}
                required
              />
              <CustomInput
                type="select"
                name="color"
                label="Color"
                placeholder="Select color"
                value={values.color}
                onBlur={handleBlur}
                errorMessage={errors.color}
                touched={touched.color}
                setFieldValue={setFieldValue}
                selectOptions={colorSelectOptions}
                required
              />
              <div className="flex gap-4 justify-end items-center pt-7">
                <CustomButton
                  className="px-7 py-4"
                  text="Cancel"
                  type="default"
                  disabled={saveLoading}
                  onClick={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                />
                <CustomButton className="px-7 py-4" text="Save" type="primary" htmlType="button" loading={saveLoading} onClick={() => handleSubmit()} />
              </div>
            </CustomForm>
          )}
        </Formik>
      </div>
    </CustomModal>
  );
};

export default AddSalesOrderTagModal;
