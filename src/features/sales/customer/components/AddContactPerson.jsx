import React from 'react';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { useCustomer, addBusinessPartnerTeam, contactPersonValidateSchema } from '@/features/sales/customer';

const getInitialValues = editingRecord => ({
  firstName: editingRecord?.firstName ?? '',
  lastName: editingRecord?.lastName ?? '',
  mobileNo: editingRecord?.mobileNo != null ? String(editingRecord.mobileNo) : '',
  email: editingRecord?.email ?? '',
  workPhone: editingRecord?.workPhone != null ? String(editingRecord.workPhone) : '',
  department: editingRecord?.department ?? '',
  authorityPower: editingRecord?.authorityPower ?? '',
});

const AddContactPerson = ({ setModalOpen, modalOpen, editingRecord, setEditingRecord, onUpdateBusinessPartner, onSubmit, submitLoading = false }) => {
  const initialValues = getInitialValues(editingRecord);
  const dispatch = useDispatch();
  const { businessPartner } = useCustomer();
  const partnerList = businessPartner ?? [];
  const isEdit = Boolean(editingRecord);

  const onFinish = async values => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      mobileNo: values.mobileNo,
      email: values.email,
      workPhone: values.workPhone,
      department: values.department,
      authorityPower: values.authorityPower,
    };
    if (onSubmit) {
      const shouldClose = await onSubmit(payload);
      if (shouldClose === false) return;
      setEditingRecord?.(null);
      setModalOpen(false);
      return;
    }
    if (isEdit) {
      onUpdateBusinessPartner?.(editingRecord.key, payload);
      setEditingRecord?.(null);
    } else {
      dispatch(addBusinessPartnerTeam([...partnerList, payload]));
    }
    setModalOpen(false);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <Formik initialValues={initialValues} validationSchema={contactPersonValidateSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
          <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title={isEdit ? 'Edit Contact Person' : 'Add Contact Person'}>
            <div className="pt-5">
              <CustomForm name="AddContactPerson" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="grid grid-cols-2 gap-x-5">
                  <CustomInput
                    type="text"
                    name="firstName"
                    label="First Name"
                    placeholder="Enter First Name"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.firstName}
                    touched={touched.firstName}
                    setFieldValue={setFieldValue}
                    required={true}
                  />
                  <CustomInput
                    type="text"
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter Last Name"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.lastName}
                    touched={touched.lastName}
                    setFieldValue={setFieldValue}
                    required={true}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-5 pt-5">
                  <CustomInput
                    type="phone"
                    name="mobileNo"
                    label="Mobile Number"
                    placeholder="Enter Mobile"
                    value={values.mobileNo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.mobileNo}
                    touched={touched.mobileNo}
                    setFieldValue={setFieldValue}
                    required={true}
                    maxLength={10}
                  />
                  <CustomInput
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="Enter Email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.email}
                    touched={touched.email}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-5 pt-5">
                  <CustomInput
                    type="number"
                    name="workPhone"
                    label="Work Phone"
                    placeholder="Enter Phone"
                    value={values.workPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.workPhone}
                    touched={touched.workPhone}
                    setFieldValue={setFieldValue}
                  />
                  <CustomInput
                    type="text"
                    name="department"
                    label="Department"
                    placeholder="Enter Department"
                    value={values.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.department}
                    touched={touched.department}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="pt-5">
                  <CustomInput
                    type="text"
                    name="authorityPower"
                    label="Authority & Power"
                    placeholder="Enter Authority"
                    value={values.authorityPower}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.authorityPower}
                    touched={touched.authorityPower}
                    setFieldValue={setFieldValue}
                  />
                </div>
                <div className="flex gap-4 justify-end items-center pt-7">
                  <CustomButton
                    className="px-7 py-4"
                    text="Cancel"
                    type="default"
                    onClick={() => {
                      setModalOpen(false);
                      setEditingRecord?.(null);
                    }}
                  />
                  <CustomButton className="px-7 py-4" text={isEdit ? 'Update' : 'Add'} type="primary" loading={submitLoading} onClick={handleSubmit} />
                </div>
              </CustomForm>
            </div>
          </CustomModal>
        )}
      </Formik>
    </div>
  );
};

export default AddContactPerson;
