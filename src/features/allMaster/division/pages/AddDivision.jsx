import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useFormik } from 'formik';

// Components
import { Select } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { useLocationCascade } from '@/hooks/useLocationCascade';

// Hooks
import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Extras
import { useDivision, divisionValidateSchema } from '@/features/allMaster/division';
import { errorsToTouched } from '@/utils/util';

const AddDivision = () => {
  const { divId } = useParams();
  const location = useLocation();
  const { loading, submitLoading, singleDivision, createDivision, updateDivision, getDivisionById, resetDivision } = useDivision();
  const divisionData = singleDivision;
  const scrollToError = useScrollToError();

  const initialValues = useMemo(
    () => ({
      name: divisionData ? divisionData.name : '',
      street1: divisionData ? divisionData.address?.street1 : '',
      street2: divisionData ? divisionData.address?.street2 : '',
      country: divisionData?.address?.country ?? '',
      city: divisionData ? divisionData.address?.city : '',
      state: divisionData ? divisionData.address?.state : null,
      pinCode: divisionData ? divisionData.address?.pinCode : '',
      email: divisionData ? divisionData.contactEmail : '',
      number: divisionData ? divisionData.contactPhone : '',
    }),
    [divisionData]
  );

  // Comprehensive hook that handles all dirty form logic
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const onFinish = async values => {
    if (submitLoading) return;
    const divisionData = {
      name: values.name,
      address: {
        street1: values.street1,
        street2: values.street2,
        country: values.country,
        city: values.city,
        state: values.state,
        pinCode: values.pinCode,
      },
      contactEmail: values.email,
      contactPhone: values.number,
    };
    const result = divId ? await updateDivision({ divisionId: divId, divisionData }) : await createDivision(divisionData);
    const targetId = divId || result?.data?.division?.id || result?.data?.division?._id;

    if (targetId) {
      navigateAfterSave(`/division/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: divisionValidateSchema,
    onSubmit: onFinish,
  });

  const loc = useLocationCascade({
    country: formik.values.country,
    state: formik.values.state,
    fieldPathPrefix: '',
    setFieldValue: formik.setFieldValue,
  });

  useEffect(() => {
    const controller = new AbortController();
    if (divId) {
      getDivisionById({ divisionId: divId, signal: controller.signal });
    } else {
      resetDivision();
    }

    return () => {
      resetDivision();
      controller.abort();
    };
  }, [divId]);

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  if (divId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold text-gray-900">{divId ? 'Edit Division' : 'Add Division'}</h1>
              {divId && divisionData?.divisionCode ? (
                <span className="inline-flex items-center rounded-md bg-blue-50 text-primary border border-blue-200 px-2 py-1 text-xs font-medium">{divisionData.divisionCode}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="adddivision" onFinish={formik.handleSubmit} onFinishFailed={onFinishFailed}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Basic details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="text"
                    name="name"
                    label="Division Name"
                    placeholder="Enter Division Name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.name}
                    touched={formik.touched.name}
                    setFieldValue={formik.setFieldValue}
                    required={true}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Address</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 items-end gap-y-5">
                  <CustomInput
                    type="text"
                    name="street1"
                    label="Head Office Address"
                    placeholder="Address Line 1"
                    value={formik.values.street1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.street1}
                    touched={formik.touched.street1}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="text"
                    name="street2"
                    label=""
                    placeholder="Address Line 2"
                    value={formik.values.street2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.street2}
                    touched={formik.touched.street2}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="select"
                    name="country"
                    label="Country"
                    placeholder="Select Country"
                    value={formik.values.country}
                    onChange={loc.onCountryChange}
                    onFocus={loc.handleCountryFocus}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.country}
                    touched={formik.touched.country}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={loc.countryOptions}
                    loading={loc.countriesLoading}
                    allowClear
                  />
                  <div className={`filter-input ${loc.stateDisabled ? 'opacity-50' : ''}`}>
                    <CustomInput
                      type="select"
                      name="state"
                      label="State"
                      placeholder="Select State"
                      value={formik.values.state}
                      onChange={loc.onStateChange}
                      onBlur={formik.handleBlur}
                      errorMessage={formik.errors.state}
                      touched={formik.touched.state}
                      setFieldValue={formik.setFieldValue}
                      selectOptions={loc.stateOptions}
                      loading={loc.statesLoading}
                      disabled={loc.stateDisabled}
                      allowClear
                    />
                  </div>
                  <div className={loc.cityDisabled ? 'opacity-50' : ''}>
                    <CustomInput
                      type="select"
                      name="city"
                      label="City"
                      placeholder="Select City"
                      value={formik.values.city}
                      onChange={loc.onCityChange}
                      onBlur={formik.handleBlur}
                      errorMessage={formik.errors.city}
                      touched={formik.touched.city}
                      setFieldValue={formik.setFieldValue}
                      selectOptions={loc.cityOptions}
                      loading={loc.citiesLoading}
                      disabled={loc.cityDisabled}
                      allowClear
                    />
                  </div>
                  <CustomInput
                    type="text"
                    name="pinCode"
                    label=""
                    placeholder="Enter Pincode"
                    value={formik.values.pinCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.pinCode}
                    touched={formik.touched.pinCode}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Contact</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.email}
                    touched={formik.touched.email}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="number"
                    name="number"
                    label="Phone Number"
                    placeholder="Enter phone number"
                    value={formik.values.number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.number}
                    touched={formik.touched.number}
                    setFieldValue={formik.setFieldValue}
                    addonBefore={
                      <div className="phone-selection">
                        <Select defaultValue="+91">
                          <Select.Option value="+91">+91</Select.Option>
                        </Select>
                      </div>
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
              <CustomButton
                className="px-8 py-4 min-w-[50px]"
                type="primary"
                text="Save"
                loading={submitLoading}
                onClick={async () => {
                  let errors = await formik.validateForm();

                  if (Object.keys(errors).length > 0) {
                    formik.setTouched(errorsToTouched(errors));
                    const firstErrorField = Object.keys(errors)[0];
                    scrollToError(firstErrorField, errors);
                    return;
                  }
                  formik.handleSubmit();
                }}
              />
              <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
            </div>
          </CustomForm>
        </div>
      </div>
    </>
  );
};

export default AddDivision;
