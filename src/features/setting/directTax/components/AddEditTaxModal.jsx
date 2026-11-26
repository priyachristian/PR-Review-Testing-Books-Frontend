import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { Tooltip } from '@/components/AntDComponent';
import { directTaxValidateSchema } from '@/features/setting/directTax/directTax.schema';
import { useDirectTax } from '@/features/setting/directTax';

const AddEditTaxModal = ({ modalOpen, isEdit, type, editingTax, handleModalClose, onFormSubmit }) => {
  const { sections, droploading, submitLoading, getTaxSections, createTax, updateTax, resetTaxSections } = useDirectTax();

  const initialValues = useMemo(
    () => ({
      taxName: isEdit && editingTax ? editingTax.taxName : '',
      taxRate: isEdit && editingTax ? editingTax.taxRate : '',
      sectionId: isEdit && editingTax ? editingTax.sectionId : null,
      startDate: isEdit && editingTax ? dayjs(editingTax.startDate) : null,
      endDate: isEdit && editingTax?.endDate ? dayjs(editingTax.endDate) : null,
    }),
    [isEdit, editingTax, modalOpen]
  );

  useEffect(() => {
    if (modalOpen) getTaxSections({ type });
    return () => resetTaxSections();
  }, [modalOpen]);

  const sectionOptions = useMemo(
    () =>
      sections?.map(section => ({
        value: section.id,
        label: `${section.paymentCode} - ${section.sectionNo} - ${section.name}`,
        tooltip: section.description,
      })),
    [sections]
  );

  const renderSectionOption = option => {
    const section = sections.find(item => item.id === option.value);
    return (
      <Tooltip title={section.description} placement="right">
        <div className="flex flex-col py-0.5 leading-tight whitespace-normal">
          <span className="font-semibold">
            {section.paymentCode} - {section.sectionNo} - {section.name}
          </span>
          <span className="text-xs text-gray-500">{section.description}</span>
          {section.oldSectionNo && <span className="text-xs text-gray-500">Earlier: {section.oldSectionNo}</span>}
        </div>
      </Tooltip>
    );
  };

  const onSubmit = async values => {
    const data = {
      taxName: values.taxName?.trim(),
      taxRate: Number(values.taxRate),
      sectionId: values.sectionId,
      startDate: values.startDate.format('YYYY-MM-DD'),
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
    };
    const action = isEdit ? await updateTax({ id: editingTax.id, data }) : await createTax({ ...data, type });

    if (action?.meta?.requestStatus !== 'rejected') {
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
      destroyOnClose
      width={520}
      title={`${isEdit ? 'Edit' : 'Add'} ${type} Tax`}
    >
      <Formik initialValues={initialValues} validationSchema={directTaxValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="AddEditTaxModal" onFinish={handleSubmit}>
            <CustomInput
              type="text"
              name="taxName"
              label="Tax Name"
              placeholder="Enter tax name"
              value={values.taxName}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.taxName}
              touched={touched.taxName}
              setFieldValue={setFieldValue}
              required
            />
            <div className="mt-2">
              <CustomInput
                type="number"
                name="taxRate"
                label="Rate (%)"
                placeholder="Enter rate"
                value={values.taxRate}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.taxRate}
                touched={touched.taxRate}
                setFieldValue={setFieldValue}
                min={0}
                max={100}
                required
              />
            </div>
            <div className="mt-2">
              <CustomInput
                type="select"
                name="sectionId"
                label="Section"
                placeholder="Select section"
                value={values.sectionId}
                selectOptions={sectionOptions}
                optionRender={renderSectionOption}
                loading={droploading}
                popupMatchSelectWidth={false}
                onBlur={handleBlur}
                errorMessage={errors.sectionId}
                touched={touched.sectionId}
                setFieldValue={setFieldValue}
                required
              />
            </div>
            <p className="mt-3 mb-1 text-sm font-semibold text-gray-800">Applicable Period</p>
            <div className="grid grid-cols-2 gap-3">
              <CustomInput
                type="date"
                name="startDate"
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={values.startDate}
                onBlur={handleBlur}
                errorMessage={errors.startDate}
                touched={touched.startDate}
                setFieldValue={setFieldValue}
                required
              />
              <CustomInput
                type="date"
                name="endDate"
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={values.endDate}
                onBlur={handleBlur}
                errorMessage={errors.endDate}
                touched={touched.endDate}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="flex gap-3 justify-end items-center pt-4">
              <CustomButton
                text="Cancel"
                type="default"
                disabled={submitLoading}
                onClick={() => {
                  resetForm();
                  handleModalClose();
                }}
              />
              <CustomButton text="Save" type="primary" loading={submitLoading} onClick={handleSubmit} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AddEditTaxModal;
