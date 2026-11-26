import { useCallback } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import PaginatedSelect from '@/components/forms/formInput/PaginatedSelect';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_LINK_CONNECTION_OPTIONS } from '../../complaint.constants';
import { linkComplaintSchema } from '../../complaint.schema';
import { useComplaintDropdown } from '../../useComplaintDropdown';

const INITIAL_VALUES = {
  connectionType: '',
  linkedComplaintId: '',
};

const LinkComplaintModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const { fetchComplaintPage, complaintDropLoading } = useComplaintDropdown();
  const currentComplaintId = complaint?._id || complaint?.id || null;

  const fetchLinkableComplaintPage = useCallback(
    async ({ page, limit, search, signal } = {}) => {
      const result = await fetchComplaintPage({ page, limit, search, signal });
      const options = (result?.options || []).filter(option => option.value !== currentComplaintId);
      return { ...result, options };
    },
    [fetchComplaintPage, currentComplaintId]
  );

  const handleModalClose = () => onClose?.();

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
      width={560}
      title="Link another complaint"
    >
      <Formik enableReinitialize initialValues={INITIAL_VALUES} validationSchema={linkComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
              Same bad batch, same issue — link them so it counts as one problem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <CustomInput
                type="select"
                name="connectionType"
                label="How are they connected"
                placeholder="Select connection"
                value={values.connectionType}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.connectionType}
                touched={touched.connectionType}
                setFieldValue={setFieldValue}
                selectOptions={COMPLAINT_LINK_CONNECTION_OPTIONS}
                required
              />
              <PaginatedSelect
                name="linkedComplaintId"
                label="Which complaint"
                required
                placeholder={complaintDropLoading ? 'Loading complaints…' : 'Select complaint'}
                value={values.linkedComplaintId}
                allowClear
                loading={complaintDropLoading}
                setFieldValue={setFieldValue}
                fetchPage={fetchLinkableComplaintPage}
                resetDeps={[currentComplaintId]}
                onBlur={handleBlur}
                touched={touched.linkedComplaintId}
                errorMessage={errors.linkedComplaintId}
              />
            </div>

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
              <CustomButton className="px-7 py-4" text="Link them" type="primary" icon={<Icons.LinkOutlined />} loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default LinkComplaintModal;
