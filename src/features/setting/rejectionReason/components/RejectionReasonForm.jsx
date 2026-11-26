import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { rejectionReasonValidateSchema } from '@/features/setting/rejectionReason/rejectionReason.schema';
import { useRejectionReason } from '@/features/setting/rejectionReason';

const RejectionReasonForm = ({ modalOpen, isEdit, handleModalClose, editingReason, onFormSubmit }) => {
  const { submitLoading, dropLoading, rejectionReasonsDrop, createRejectionReason, updateRejectionReason, getRejectionReasonsDrop } = useRejectionReason();

  useEffect(() => {
    if (!modalOpen) return;
    getRejectionReasonsDrop();
  }, [modalOpen, getRejectionReasonsDrop]);

  const initialValues = useMemo(() => {
    const parentReasonId = editingReason?.parentReasonId;
    const resolvedParentReasonId = parentReasonId && typeof parentReasonId === 'object' ? parentReasonId._id || parentReasonId.id || null : parentReasonId || null;

    return {
      name: isEdit && editingReason ? editingReason.name : '',
      description: isEdit && editingReason ? editingReason.description || '' : '',
      parentReasonId: isEdit && editingReason ? resolvedParentReasonId : null,
    };
  }, [isEdit, editingReason, modalOpen]);

  const parentOptions = useMemo(
    () =>
      (rejectionReasonsDrop || [])
        .filter(r => {
          const isSelf = isEdit && (r._id || r.id) === (editingReason?._id || editingReason?.id);
          const hasParent = Boolean(r.parentReasonId);
          return !isSelf && !hasParent;
        })
        .map(r => ({ label: r.name, value: r._id || r.id })),
    [rejectionReasonsDrop, isEdit, editingReason]
  );

  const onSubmit = async values => {
    const payload = {
      name: values.name?.trim(),
      description: values.description?.trim() || undefined,
      parentReasonId: values.parentReasonId || null,
    };
    const action = isEdit ? await updateRejectionReason({ id: editingReason._id || editingReason.id, data: payload }) : await createRejectionReason(payload);

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
      title={isEdit ? 'Edit Rejection Reason' : 'Add Rejection Reason'}
    >
      <Formik initialValues={initialValues} validationSchema={rejectionReasonValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="RejectionReasonForm" onFinish={handleSubmit}>
            <CustomInput
              type="text"
              name="name"
              label="Reason Name"
              placeholder="e.g. Physical Damage"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.name}
              touched={touched.name}
              setFieldValue={setFieldValue}
              required
            />
            <div className="mt-2">
              <CustomInput
                type="text"
                name="description"
                label="Description"
                placeholder="Optional description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.description}
                touched={touched.description}
                setFieldValue={setFieldValue}
              />
            </div>
            <div className="mt-2">
              <CustomInput
                type="select"
                name="parentReasonId"
                label="Parent Reason"
                placeholder="Select parent reason (optional)"
                value={values.parentReasonId}
                onChange={value => setFieldValue('parentReasonId', value)}
                onBlur={handleBlur}
                errorMessage={errors.parentReasonId}
                touched={touched.parentReasonId}
                setFieldValue={setFieldValue}
                selectOptions={parentOptions}
                loading={dropLoading}
                allowClear
              />
            </div>
            <div className="flex gap-3 justify-end items-center pt-2">
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

export default RejectionReasonForm;
