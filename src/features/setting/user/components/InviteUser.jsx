import { useEffect } from 'react';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useRole } from '@/features/setting/role/useRole';
import { useUser } from '@/features/setting/user/useUser';

// Extras
import { inviteUserValidateSchema } from '@/utils/validationsSchema';

const InviteUser = ({ setModalOpen, modalOpen }) => {
  const { getRolesDropdown, rolesDropdown, resetRolesDropdown } = useRole();
  const { getUsers, inviteUser } = useUser();

  const initialValues = {
    email: '',
    roleId: null,
  };

  useEffect(() => {
    getRolesDropdown();
    return () => {
      resetRolesDropdown();
    };
  }, [getRolesDropdown, resetRolesDropdown]);

  const onFinish = async (values, { setSubmitting, resetForm }) => {
    try {
      await inviteUser({ ...values, type: 'send' });
      resetForm();
      setModalOpen(false);
      getUsers();
    } catch {
      // error already handled in slice
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Invite User">
        <Formik initialValues={initialValues} validationSchema={inviteUserValidateSchema} onSubmit={onFinish}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isSubmitting }) => (
            <CustomForm name="InviteUser" initialValues={{ remember: true }} onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div className="mb-4">
                <CustomInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.email}
                  touched={touched.email}
                  setFieldValue={setFieldValue}
                  required={true}
                />
              </div>
              <div className="mb-4">
                <CustomInput
                  label="Role"
                  name="roleId"
                  type="select"
                  placeholder="Select Role"
                  value={values.roleId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.roleId}
                  touched={touched.roleId}
                  setFieldValue={setFieldValue}
                  selectOptions={
                    rolesDropdown?.map(role => ({
                      label: role.role,
                      value: role._id,
                    })) || []
                  }
                  required={true}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-3">
                <CustomButton className="px-7 py-4" text="Cancel" type="default" onClick={() => setModalOpen(false)} disabled={isSubmitting} />
                <CustomButton className="px-7 py-4" type="primary" text="Invite" loading={isSubmitting} onClick={handleSubmit} style={{ minWidth: 80 }} />
              </div>
            </CustomForm>
          )}
        </Formik>
      </CustomModal>
    </div>
  );
};

export default InviteUser;
