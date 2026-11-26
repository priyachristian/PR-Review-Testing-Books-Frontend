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
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useBranch, branchValidateSchema } from '@/features/allMaster/branch';
import { RESOURCES } from '@/utils/jsonFile';
import { buildDivisionSelectOptions, divisionSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddBranch = () => {
  const { brId } = useParams();
  const location = useLocation();
  const { loading, singleBranch, submitLoading, updateBranch, createBranch, getBranchById, resetBranch } = useBranch();
  const { divDrop, getDivDropDown, divisionLoading } = useModulePermissions(RESOURCES.BRANCH);
  const branchData = singleBranch;
  const scrollToError = useScrollToError();

  const initialValues = useMemo(
    () => ({
      divisionName: branchData ? branchData?.divisionId?.id : null,
      branchname: branchData ? branchData?.name : '',
      street1: branchData ? branchData?.address?.street1 : '',
      street2: branchData ? branchData?.address?.street2 : '',
      country: branchData?.address?.country ?? '',
      city: branchData ? branchData?.address?.city : '',
      pincode: branchData ? branchData?.address?.pinCode : '',
      state: branchData ? branchData?.address?.state : null,
      phone: branchData ? branchData?.address?.phone : '',
      firstName: branchData ? branchData?.branchManager?.firstName : '',
      lastName: branchData ? branchData?.branchManager?.lastName : '',
      email: branchData ? branchData?.branchManager?.contactEmail : '',
      number: branchData ? branchData?.branchManager?.contactPhone : '',
      gstin: branchData ? branchData?.gstin : '',
    }),
    [branchData]
  );

  // Comprehensive hook that handles all dirty form logic
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const onFinish = async values => {
    if (submitLoading) return;
    const branchData = {
      ...(!brId && { divisionId: values.divisionName }),
      name: values.branchname,
      address: {
        street1: values.street1,
        street2: values.street2,
        country: values.country,
        city: values.city,
        state: values.state,
        pinCode: values.pincode,
        phone: values.phone,
      },
      branchManager: {
        firstName: values.firstName,
        lastName: values.lastName,
        contactEmail: values.email,
        contactPhone: values.number,
      },
      gstin: values.gstin,
    };

    const result = brId ? await updateBranch({ branchId: brId, branchData }) : await createBranch(branchData);
    const saved = result?.data?.branch;
    const targetId = brId || saved?.id || saved?._id;

    if (targetId) {
      navigateAfterSave(`/branch/${targetId}`, {
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
    validationSchema: branchValidateSchema,
    onSubmit: onFinish,
  });

  const loc = useLocationCascade({
    country: formik.values.country,
    state: formik.values.state,
    fieldPathPrefix: '',
    setFieldValue: formik.setFieldValue,
  });

  useEffect(() => {
    if (brId) return;
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getDivDropDown(payload);
    return () => controller.abort();
  }, [brId]);

  useEffect(() => {
    const controller = new AbortController();

    if (brId) {
      getBranchById({ branchId: brId, signal: controller.signal });
    } else {
      resetBranch();
    }

    return () => {
      resetBranch();
      controller.abort();
    };
  }, [brId]);

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  if (brId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold text-gray-900">{brId ? 'Edit Branch' : 'Add Branch'}</h1>
              {brId && branchData?.branchCode ? (
                <span className="inline-flex items-center rounded-md bg-blue-50 text-primary border border-blue-200 px-2 py-1 text-xs font-medium">{branchData.branchCode}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="division/new" onFinish={formik.handleSubmit} onFinishFailed={onFinishFailed}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Basic details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  {!brId ? (
                    <CustomInput
                      type="select"
                      name="divisionName"
                      label="Division Name"
                      placeholder="Select Division"
                      value={formik.values.divisionName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      errorMessage={formik.errors.divisionName}
                      touched={formik.touched.divisionName}
                      setFieldValue={formik.setFieldValue}
                      disabled={!!brId}
                      selectVariant="twoColumn"
                      columnSelectHeader={divisionSelectColumnHeader}
                      selectOptions={buildDivisionSelectOptions(divDrop)}
                      loading={divisionLoading}
                      required={true}
                    />
                  ) : (
                    <CustomInput type="text" name="divisionName" label="Division Name" value={branchData?.divisionId?.name} disabled />
                  )}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="text"
                    name="branchname"
                    label="Branch Name"
                    placeholder="Enter branch Name"
                    value={formik.values.branchname}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.branchname}
                    touched={formik.touched.branchname}
                    setFieldValue={formik.setFieldValue}
                    required={true}
                  />
                  <CustomInput
                    type="text"
                    name="gstin"
                    label="GSTIN"
                    placeholder="GSTIN"
                    value={formik.values.gstin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.gstin}
                    touched={formik.touched.gstin}
                    required={true}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Address</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="text"
                    name="street1"
                    label="Branch Address"
                    placeholder="Street 1"
                    value={formik.values.street1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.street1}
                    touched={formik.touched.street1}
                    setFieldValue={formik.setFieldValue}
                    required={true}
                  />
                  <CustomInput
                    type="text"
                    name="street2"
                    label="Branch Address"
                    placeholder="Street 2"
                    value={formik.values.street2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.street2}
                    touched={formik.touched.street2}
                    setFieldValue={formik.setFieldValue}
                    required={true}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-5">
                  <div className="grid grid-cols-2 gap-5">
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
                      required={true}
                    />
                    <div className={loc.stateDisabled ? 'opacity-50' : ''}>
                      <CustomInput
                        type="select"
                        name="state"
                        label="State"
                        placeholder="State/Union Territory"
                        value={formik.values.state}
                        onChange={loc.onStateChange}
                        onBlur={formik.handleBlur}
                        errorMessage={formik.errors.state}
                        touched={formik.touched.state}
                        setFieldValue={formik.setFieldValue}
                        selectOptions={loc.stateOptions}
                        loading={loc.statesLoading}
                        disabled={loc.stateDisabled}
                        required={true}
                      />
                    </div>
                    <div className={loc.cityDisabled ? 'opacity-50' : ''}>
                      <CustomInput
                        type="select"
                        name="city"
                        label="City"
                        placeholder="City"
                        value={formik.values.city}
                        onChange={loc.onCityChange}
                        onBlur={formik.handleBlur}
                        errorMessage={formik.errors.city}
                        touched={formik.touched.city}
                        setFieldValue={formik.setFieldValue}
                        selectOptions={loc.cityOptions}
                        loading={loc.citiesLoading}
                        disabled={loc.cityDisabled}
                        required={true}
                      />
                    </div>
                    <CustomInput
                      type="text"
                      name="pincode"
                      label="Pin Code"
                      placeholder="Pin Code"
                      value={formik.values.pincode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      errorMessage={formik.errors.pincode}
                      touched={formik.touched.pincode}
                      setFieldValue={formik.setFieldValue}
                      required={true}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-5">
                  <CustomInput
                    type="number"
                    name="phone"
                    label="Phone Number"
                    placeholder="Phone Number"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.phone}
                    touched={formik.touched.phone}
                    setFieldValue={formik.setFieldValue}
                    required={true}
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
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Branch manager</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="text"
                    name="firstName"
                    label="Branch Manager"
                    placeholder="First Name"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.firstName}
                    touched={formik.touched.firstName}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="text"
                    name="lastName"
                    label=" "
                    placeholder="Last Name"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.lastName}
                    touched={formik.touched.lastName}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                  <CustomInput
                    type="number"
                    name="number"
                    label=""
                    placeholder="Enter Number"
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
                  <CustomInput
                    type="email"
                    name="email"
                    label=""
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.email}
                    touched={formik.touched.email}
                    setFieldValue={formik.setFieldValue}
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

export default AddBranch;
