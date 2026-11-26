import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFormik } from 'formik';

// Components
import { Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { useLocationCascade } from '@/hooks/useLocationCascade';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useAccountLedger, accountLedgerValidateSchema } from '@/features/accountant/accountLedger';
import { shouldPreventNavigation, errorsToTouched } from '@/utils/util';
import { MODULE_NAMES } from '@/utils/constants';
import { accountLedgerInitialValues } from '@/utils/intialValueSetup';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const AddAccountLedger = () => {
  const { accountLedgerId } = useParams();
  const { accountLedger, createAccountLedger, updateAccountLedger, getAccountLedgerById, submitLoading, resetAccountLedger } = useAccountLedger();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [ledgerMasterConfig, setLedgerMasterConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  const scrollToError = useScrollToError();

  const onFinish = async values => {
    if (submitLoading) return;

    const result = accountLedgerId ? await updateAccountLedger({ accountLedgerId, accountLedgerData: values }) : await createAccountLedger(values);

    if (shouldPreventNavigation(result)) {
      return;
    }
    navigateAfterSave(-1);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  // Create a stable key for memoization based on account ledger ID or new form
  const accountLedgerKey = accountLedgerId ? accountLedger?._id || accountLedger?.id || accountLedgerId : 'new';

  const initialValues = useMemo(
    () => ({
      ...accountLedgerInitialValues(accountLedger),
    }),
    [accountLedgerKey, accountLedger] // Depend on both the key and the actual data to ensure recalculation when data loads
  );

  const formik = useFormik({
    initialValues,
    validationSchema: accountLedgerValidateSchema(ledgerMasterConfig?.autoGenerate),
    onSubmit: onFinish,
    enableReinitialize: true,
  });

  const loc = useLocationCascade({
    country: formik.values.country,
    state: formik.values.state,
    fieldPathPrefix: '',
    setFieldValue: formik.setFieldValue,
  });

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['businessAccountLedgerMasterId'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (moduleConfig) {
      setLedgerMasterConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (!accountLedgerId && ledgerMasterConfig) {
      const newLedgerMasterId = ledgerMasterConfig.autoGenerate ? `${ledgerMasterConfig.prefix}${ledgerMasterConfig.nextNumber}` : '';
      formik.setFieldValue('businessAccountLedgerMasterId', newLedgerMasterId);
    }
  }, [ledgerMasterConfig, accountLedgerId]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    if (accountLedgerId) {
      getAccountLedgerById({ accountLedgerId, signal: controller.signal });
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.ACCOUNT_PARTNER,
      });
    } else {
      getModuleConfig({
        ...payload,
        moduleName: MODULE_NAMES.ACCOUNT_PARTNER,
      });
    }
    return () => {
      resetAccountLedger();
      controller.abort();
    };
  }, [accountLedgerId]);

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  const handleCountryChange = val => {
    loc.onCountryChange(val);
  };

  const handleStateChange = val => {
    loc.onStateChange(val);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{accountLedgerId ? 'Edit Account Ledger' : 'Add Account Ledger'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="Add-Timesheet" onFinish={formik.handleSubmit} onFinishFailed={onFinishFailed}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Ledger details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                  <CustomInput
                    type="text"
                    name="businessAccountLedgerMasterId"
                    label="Ledger Master Number"
                    value={formik.values.businessAccountLedgerMasterId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.businessAccountLedgerMasterId}
                    touched={formik.touched.businessAccountLedgerMasterId}
                    setFieldValue={formik.setFieldValue}
                    placeholder="Enter Ledger Number"
                    disabled={ledgerMasterConfig?.autoGenerate || accountLedgerId}
                    suffix={
                      !accountLedgerId && (
                        <Tooltip title="Configure Ledger Master Number">
                          <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                        </Tooltip>
                      )
                    }
                    required
                  />
                  <CustomInput
                    type="text"
                    name="personName"
                    label="Ledger Name"
                    value={formik.values.personName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.personName}
                    touched={formik.touched.personName}
                    setFieldValue={formik.setFieldValue}
                    placeholder="Enter Ledger Name"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="text"
                    name="gstinUin"
                    label="GST Number"
                    value={formik.values.gstinUin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.gstinUin}
                    touched={formik.touched.gstinUin}
                    setFieldValue={formik.setFieldValue}
                    placeholder="Enter GST Number"
                  />
                  <CustomInput
                    type="text"
                    name="pan"
                    label="PAN"
                    placeholder="Enter PAN"
                    value={formik.values.pan}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.pan}
                    touched={formik.touched.pan}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="text"
                    name="phoneNo"
                    label="Phone No."
                    value={formik.values.phoneNo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.phoneNo}
                    touched={formik.touched.phoneNo}
                    setFieldValue={formik.setFieldValue}
                    placeholder="Enter Phone No."
                  />
                  <CustomInput
                    type="text"
                    name="email"
                    label="Email"
                    placeholder="Enter Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.email}
                    touched={formik.touched.email}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="textarea"
                    name="address"
                    label="Address"
                    placeholder="Enter Address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.address}
                    touched={formik.touched.address}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="select"
                    name="country"
                    label="Country"
                    placeholder="Select Country"
                    value={formik.values.country}
                    onChange={handleCountryChange}
                    onFocus={loc.handleCountryFocus}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.country}
                    touched={formik.touched.country}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={loc.countryOptions}
                    loading={loc.countriesLoading}
                    allowClear
                  />
                  <div className={loc.stateDisabled ? 'opacity-50' : ''}>
                    <CustomInput
                      type="select"
                      name="state"
                      label="State"
                      placeholder="Select State"
                      value={formik.values.state}
                      onChange={handleStateChange}
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
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
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
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={ledgerMasterConfig}
        title="Configure Account Ledger Number Preferences"
        description="Auto-generating account ledger numbers can save your time. Would you like to change your current setting?"
        setConfigDetail={setLedgerMasterConfig}
        moduleName={MODULE_NAMES.ACCOUNT_PARTNER}
      />
    </>
  );
};

export default AddAccountLedger;
