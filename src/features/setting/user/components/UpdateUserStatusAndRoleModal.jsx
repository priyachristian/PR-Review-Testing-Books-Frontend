import { useEffect } from 'react';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Hooks
import { useRole } from '@/features/setting/role/useRole';
import { useUser } from '@/features/setting/user/useUser';

// Extras
import { USER_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import { userStatus } from '@/utils/constants';
import { updateUserStatusAndRoleValidateSchema } from '@/utils/validationsSchema';

const UpdateUserStatusAndRoleModal = ({ setModalOpen, modalOpen, record, fetchUsers }) => {
  const { rolesDropdown, getRolesDropdown, resetRolesDropdown } = useRole();
  const { updateUserStatusAndRole } = useUser();

  const initialValues = {
    firstName: record?.user?.firstName || '',
    lastName: record?.user?.lastName || '',
    status: record?.status,
    roleId: record?.roleId,
  };

  useEffect(() => {
    getRolesDropdown({});

    return () => {
      resetRolesDropdown();
    };
  }, []);

  const onFinish = async (values, { setSubmitting, resetForm }) => {
    try {
      await updateUserStatusAndRole({ id: record?.user?._id, ...values });
      resetForm();
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status and role:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const getUserName = () => {
    if (!record?.user) return '-';
    const firstName = record.user.firstName || '';
    const lastName = record.user.lastName || '';
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : '-';
  };

  return (
    <div>
      <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Update User Status and Role" destroyOnClose={true}>
        {/* User Details Section */}
        {record && (
          <div className="py-3 px-4 bg-gray-50 rounded-md mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">User Details:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">{getUserName()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{record?.user?.email || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900">
                  <StatusBadge status={record?.status} value={record?.status?.toUpperCase()} />
                </span>
              </div>
              {record?.role?.role && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Role:</span>
                  <span className="font-medium text-gray-900">{record.role.role}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Formik initialValues={initialValues} validationSchema={updateUserStatusAndRoleValidateSchema} onSubmit={onFinish}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isSubmitting }) => (
            <CustomForm name="UpdateUserStatusAndRole" initialValues={{ remember: true }} onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <CustomInput
                    label="First Name"
                    name="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.firstName}
                    touched={touched.firstName}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="mb-4">
                  <CustomInput
                    label="Last Name"
                    name="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.lastName}
                    touched={touched.lastName}
                    setFieldValue={setFieldValue}
                  />
                </div>
              </div>
              <div className="mb-4">
                <CustomInput
                  label="Status"
                  name="status"
                  type="select"
                  placeholder="Select Status"
                  value={values.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.status}
                  touched={touched.status}
                  setFieldValue={setFieldValue}
                  disabled={record?.status === userStatus.PENDING}
                  selectOptions={USER_STATUS_OPTIONS(record?.status)}
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
                />
              </div>
              <div className="flex justify-end space-x-3 mt-3">
                <CustomButton className="px-7 py-4" text="Cancel" type="default" onClick={() => setModalOpen(false)} />
                <CustomButton className="px-7 py-4" type="primary" text="Update" loading={isSubmitting} style={{ minWidth: 90 }} onClick={handleSubmit} />
              </div>
            </CustomForm>
          )}
        </Formik>
      </CustomModal>
    </div>
  );
};

export default UpdateUserStatusAndRoleModal;
