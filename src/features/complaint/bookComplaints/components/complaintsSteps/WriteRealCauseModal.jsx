import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { useUser } from '@/features/setting/user/useUser';
import { mapUsersToSelectOptions, ensureOptionForValue } from '@/features/complaint/problemList/problemList.utils';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_STATUS } from '../../complaint.constants';
import { writeRealCauseSchema } from '../../complaint.schema';

const WHY_FIELDS = [
  { name: 'why1', number: 1, placeholder: 'Why did this happen?' },
  { name: 'why2', number: 2, placeholder: 'Why is that?' },
  { name: 'why3', number: 3, placeholder: 'And why is that?' },
  { name: 'why4', number: 4, placeholder: 'Keep going (optional)' },
  { name: 'why5', number: 5, placeholder: 'One more if needed (optional)' },
];

const SectionLabel = ({ children, hint }) => (
  <div className="mb-2.5">
    <p className="text-sm font-semibold m-0" style={{ color: colorPalette.secondary[900] }}>
      {children}
    </p>
    {hint ? (
      <p className="text-xs m-0 mt-0.5" style={{ color: colorPalette.secondary[500] }}>
        {hint}
      </p>
    ) : null}
  </div>
);

const getInProgress = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.IN_PROGRESS.key)?.inProgress || null;

const WriteRealCauseModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    getUsersDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [open, getUsersDropdown]);

  const handleModalClose = () => onClose?.();

  const existing = useMemo(() => getInProgress(complaint), [complaint]);

  const ensureByPersonId = typeof existing?.ensureByPersonId === 'string' ? existing.ensureByPersonId : existing?.ensureByPersonId?._id || null;
  const ensureByPersonName = typeof existing?.ensureByPersonId === 'object' ? existing?.ensureByPersonId?.name : null;

  const personOptions = useMemo(() => {
    const options = mapUsersToSelectOptions(usersDropdown);
    return ensureOptionForValue(options, ensureByPersonId, ensureByPersonName || 'Selected person');
  }, [usersDropdown, ensureByPersonId, ensureByPersonName]);

  const initialValues = useMemo(() => {
    const whys = Array.isArray(existing?.whys) ? existing.whys : [];
    return {
      why1: whys[0] || '',
      why2: whys[1] || '',
      why3: whys[2] || '',
      why4: whys[3] || '',
      why5: whys[4] || '',
      realCause: existing?.realCause || '',
      fixThisOne: existing?.immediateFix || '',
      neverRepeats: existing?.preventiveAction || '',
      ownerId: ensureByPersonId || '',
      byWhen: existing?.ensureByDate ? dayjs(existing.ensureByDate) : null,
    };
  }, [existing, ensureByPersonId]);

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
      width={740}
      title="Why did this really happen?"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={writeRealCauseSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => (
          <CustomForm onFinish={submitForm} layout="vertical">
            <p className="text-sm m-0 mb-5 leading-5" style={{ color: colorPalette.secondary[600] }}>
              Keep asking why until the answer is a gap in our system, not a person&apos;s mistake. Three levels at least.
            </p>

            <div className="space-y-5">
              <section>
                <SectionLabel hint="Fill at least the first three">The five whys</SectionLabel>
                <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 pt-3 pb-1">
                  <div className="space-y-0 [&_.ant-form-item]:!mb-2.5 [&_.ant-form-item]:!pb-0">
                    {WHY_FIELDS.map(field => (
                      <div key={field.name} className="flex items-start gap-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-[34px] shrink-0 text-xs font-semibold" style={{ color: colorPalette.secondary[500] }}>
                          {field.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <CustomInput
                            type="text"
                            name={field.name}
                            label={false}
                            placeholder={field.placeholder}
                            value={values[field.name]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors[field.name]}
                            touched={touched[field.name]}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.whys && (touched.why1 || touched.why2 || touched.why3 || touched.why4 || touched.why5) ? (
                    <p className="text-sm m-0 mb-2.5 ml-8" style={{ color: colorPalette.error[600] }}>
                      {errors.whys}
                    </p>
                  ) : null}
                </div>
              </section>

              <section>
                <CustomInput
                  type="textarea"
                  name="realCause"
                  label="So the real cause is"
                  placeholder="What is the real cause?"
                  rows={2}
                  value={values.realCause}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.realCause}
                  touched={touched.realCause}
                  setFieldValue={setFieldValue}
                  required
                />
              </section>

              <section>
                <SectionLabel>What we do about it</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1">
                  <CustomInput
                    type="textarea"
                    name="fixThisOne"
                    label="What we did to fix this one"
                    placeholder="What did we do for this case?"
                    rows={3}
                    value={values.fixThisOne}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.fixThisOne}
                    touched={touched.fixThisOne}
                    setFieldValue={setFieldValue}
                    required
                  />
                  <CustomInput
                    type="textarea"
                    name="neverRepeats"
                    label="What we changed so it never repeats"
                    placeholder="What did we change in the system?"
                    rows={3}
                    value={values.neverRepeats}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.neverRepeats}
                    touched={touched.neverRepeats}
                    setFieldValue={setFieldValue}
                    required
                  />
                </div>
              </section>

              <section>
                <SectionLabel>Who owns the follow-through</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1">
                  <CustomInput
                    type="select"
                    name="ownerId"
                    label="Who will make sure of it"
                    placeholder={usersDropdownLoading ? 'Loading people…' : 'Select person'}
                    value={values.ownerId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.ownerId}
                    touched={touched.ownerId}
                    setFieldValue={setFieldValue}
                    selectOptions={personOptions}
                    loading={usersDropdownLoading}
                    required
                  />
                  <CustomInput
                    type="date"
                    name="byWhen"
                    label="By when"
                    placeholder="Select date"
                    value={values.byWhen}
                    onBlur={handleBlur}
                    errorMessage={errors.byWhen}
                    touched={touched.byWhen}
                    setFieldValue={setFieldValue}
                    format="DD/MM/YYYY"
                    required
                  />
                </div>
              </section>
            </div>

            <div className="flex gap-3 justify-end items-center pt-6 mt-1 border-t border-gray-100">
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
              <CustomButton className="px-7 py-4" text="Save it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default WriteRealCauseModal;
