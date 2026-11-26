import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { useUser } from '@/features/setting/user/useUser';
import { mapUsersToSelectOptions, ensureOptionForValue } from '@/features/complaint/problemList/problemList.utils';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_DEPARTMENT_OPTIONS } from '../../complaint.constants';
import { assignComplaintSchema } from '../../complaint.schema';
import { getDepartmentLabel } from '../../complaint.utils';

const AssignComplaintModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    getUsersDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [open, getUsersDropdown]);

  const assignedToId = typeof complaint?.assignedTo === 'string' ? complaint.assignedTo : complaint?.assignedTo?._id || null;
  const assignedToName = typeof complaint?.assignedTo === 'object' ? complaint?.assignedTo?.name : null;

  const personOptions = useMemo(() => {
    const options = mapUsersToSelectOptions(usersDropdown);
    return ensureOptionForValue(options, assignedToId, assignedToName || 'Current assignee');
  }, [usersDropdown, assignedToId, assignedToName]);

  const suggestion = useMemo(() => {
    const department = complaint?.department || '';
    const person = assignedToId || '';
    const personName = assignedToName || personOptions.find(option => option.value === person)?.label || '';
    const departmentLabel = getDepartmentLabel(department) || 'This department';

    return {
      department,
      person,
      reason: '',
      departmentNote: department ? `${departmentLabel} handles this kind of problem` : '',
      personName,
    };
  }, [complaint?.department, assignedToName, assignedToId, personOptions]);

  const initialValues = {
    department: suggestion.department,
    person: suggestion.person,
    reason: suggestion.reason,
  };

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
      title="Who will handle this?"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={assignComplaintSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => {
          const selectedPerson = personOptions.find(option => option.value === values.person) || null;

          const applySuggestion = () => {
            setFieldValue('department', suggestion.department);
            setFieldValue('person', suggestion.person);
            setFieldValue('reason', suggestion.reason);
          };

          return (
            <CustomForm onFinish={submitForm} layout="vertical">
              <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
                Pick a person. Nothing moves until someone owns it.
              </p>

              {suggestion.department && suggestion.person ? (
                <button type="button" onClick={applySuggestion} className="w-full text-left rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 mb-4 transition-colors hover:bg-blue-100/70">
                  <div className="text-sm font-semibold text-blue-700">Use the usual person — {suggestion.personName || 'selected person'}</div>
                  {suggestion.departmentNote ? <div className="text-xs text-gray-500 mt-0.5">{suggestion.departmentNote}</div> : null}
                </button>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <CustomInput
                  type="select"
                  name="department"
                  label="Department"
                  placeholder="Select department"
                  value={values.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.department}
                  touched={touched.department}
                  setFieldValue={setFieldValue}
                  selectOptions={COMPLAINT_DEPARTMENT_OPTIONS}
                  required
                />
                <CustomInput
                  type="select"
                  name="person"
                  label="Person"
                  placeholder={usersDropdownLoading ? 'Loading people…' : 'Select person'}
                  value={values.person}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.person}
                  touched={touched.person}
                  setFieldValue={setFieldValue}
                  selectOptions={personOptions}
                  loading={usersDropdownLoading}
                  required
                />
              </div>

              <CustomInput
                type="text"
                name="reason"
                label="Why this person"
                placeholder="Why should this person handle it?"
                value={values.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.reason}
                touched={touched.reason}
                setFieldValue={setFieldValue}
                required
              />

              {selectedPerson ? (
                <p className="text-sm m-0 mt-1" style={{ color: colorPalette.secondary[500] }}>
                  Giving this to {selectedPerson.label}.
                </p>
              ) : null}

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
                <CustomButton className="px-7 py-4" text="Give it to them" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default AssignComplaintModal;
