import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { useUser } from '@/features/setting/user/useUser';
import { mapUsersToSelectOptions, ensureOptionForValue } from '@/features/complaint/problemList/problemList.utils';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

import { escalateComplaintSchema } from '../../complaint.schema';

const INITIAL_VALUES = {
  personId: '',
  reason: '',
};

const EscalateComplaintModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    getUsersDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [open, getUsersDropdown]);

  const handleModalClose = () => onClose?.();

  const assignedToId = typeof complaint?.assignedTo === 'string' ? complaint.assignedTo : complaint?.assignedTo?._id || null;
  const assignedToName = typeof complaint?.assignedTo === 'object' ? complaint?.assignedTo?.name : null;

  const personOptions = useMemo(() => {
    const options = mapUsersToSelectOptions(usersDropdown);
    return ensureOptionForValue(options, assignedToId, assignedToName || 'Current assignee');
  }, [usersDropdown, assignedToId, assignedToName]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      resetForm();
      handleModalClose();
    } catch {
      // Slice already toasts the error; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen) handleModalClose();
      }}
      destroyOnClose
      width={520}
      title="Push it up to L1 — Department head"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={escalateComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Use this when it is stuck or the customer is angry.
            </p>

            <CustomInput
              type="select"
              name="personId"
              label="Hand it to"
              placeholder={usersDropdownLoading ? 'Loading people…' : 'Select person'}
              value={values.personId}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.personId}
              touched={touched.personId}
              setFieldValue={setFieldValue}
              selectOptions={personOptions}
              loading={usersDropdownLoading}
              required
            />

            <CustomInput
              type="textarea"
              name="reason"
              label="Why"
              placeholder="Why does this need a push from above?"
              rows={3}
              value={values.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.reason}
              touched={touched.reason}
              setFieldValue={setFieldValue}
              required
            />

            <div className="flex gap-4 justify-end items-center pt-7">
              <CustomButton
                className="px-7 py-4"
                text="Cancel"
                type="default"
                disabled={submitLoading || isSubmitting}
                onClick={() => {
                  resetForm();
                  handleModalClose();
                }}
              />
              <CustomButton className="px-7 py-4" text="Push it up" type="primary" icon={<Icons.RiseOutlined />} loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default EscalateComplaintModal;
