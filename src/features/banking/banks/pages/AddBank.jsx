import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import BackButton from '@/components/ui/button/BackButton';
import { Modal } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useBank, bankValidateSchema } from '@/features/banking/banks';
import { useCurrency } from '@/features/setting/currency/useCurrency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { RESOURCES } from '@/utils/jsonFile';
import { BANK_TYPES } from '@/utils/constants';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { colorPalette } from 'utils/theme';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddBank = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { submitLoading, bank, resetBank, getBankById, createBanking, updateBanking } = useBank();
  const bankData = bank;
  const { isViewOnly, divDrop, getDivDropDown, branchDrop, getBranchDropDown, divisionLoading, branchLoading } = useModulePermissions(RESOURCES.BANK);
  const { currencies, loading: currencyLoading, getCurrencies } = useCurrency();
  const { currencyId: baseCurrencyId } = useCompanyCurrency();
  const [selectedDivisionId, setSelectedDivisionId] = useState(bankData?.divisionId || '');

  const currencyOptions = useMemo(
    () =>
      (currencies || []).map(currency => ({
        value: currency._id,
        label: `${currency.symbol} - ${currency.name}`,
      })),
    [currencies]
  );

  useEffect(() => {
    if (isViewOnly) {
      navigate('/');
    }
  }, [isViewOnly, navigate]);

  const formikRef = useRef();
  const scrollToError = useScrollToError();

  const initialValues = useMemo(
    () => ({
      accountType: bankData?.accountType ?? location.state?.accountType ?? BANK_TYPES.BANK,
      accountName: bankData?.accountName ?? '',
      accountCode: bankData?.accountCode ?? '',
      currency: bankData?.currency?._id || baseCurrencyId || '',
      accountNumber: bankData?.accountNumber ?? '',
      bankName: bankData?.bankName ?? '',
      ifsc: bankData?.ifsc ?? '',
      description: bankData?.description ?? '',
      isPrimary: bankData ? bankData?.isPrimary : false,
      openingBalance: bankData?.openingBalance ?? '',
      branchId: bankData?.branchId ? bankData?.branchId : '',
      divisionId: bankData?.divisionId ? bankData?.divisionId : '',
      gstinUin: bankData?.gstinUin ?? '',
      branch: bankData?.branch ?? '',
    }),
    [bankData, baseCurrencyId]
  );

  // Comprehensive hook that handles all dirty form logic
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedDivisionId) {
      const payload = { divisionId: selectedDivisionId, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [selectedDivisionId]);

  useEffect(() => {
    const controller = new AbortController();
    getDivDropDown({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    getCurrencies({ pagination: false });
  }, [getCurrencies]);

  useEffect(() => {
    const controller = new AbortController();
    if (bankId) {
      getBankById({ bankId, signal: controller.signal });
    } else {
      resetBank();
    }
    return () => controller.abort();
  }, [bankId]);

  useEffect(() => {
    if (bank) {
      setSelectedDivisionId(bank?.divisionId);
    }
  }, [bank]);

  const saveBank = async payload => {
    try {
      if (bankId) {
        await updateBanking({ bankId, bankData: payload });
      } else {
        await createBanking(payload);
      }
      navigateAfterSave(-1);
    } catch {
      // slice handles toast
    }
  };

  const onFinish = async values => {
    if (submitLoading) return;
    const payload = {
      accountType: values.accountType,
      accountName: values.accountName,
      accountCode: values.accountCode,
      currency: values.currency,
      ...(values.accountType === BANK_TYPES.BANK && {
        accountNumber: values.accountNumber,
        ifsc: values.ifsc,
        bankName: values.bankName,
        branch: values.branch || '',
        gstinUin: values?.gstinUin || '',
      }),
      description: values.description,
      isPrimary: values.isPrimary,
      openingBalance: values.openingBalance,
      branchId: values?.branchId || null,
      divisionId: values?.divisionId || null,
    };

    // Only confirm when newly marking as primary (skip if already primary)
    const isBecomingPrimary = values.isPrimary && !bankData?.isPrimary;
    if (!isBecomingPrimary) {
      await saveBank(payload);
      return;
    }

    Modal.confirm({
      title: 'Confirm Primary Account',
      content: 'Are you sure you want to make this the primary account?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          await saveBank(payload);
        } finally {
          Modal.destroyAll();
        }
      },
      okButtonProps: {
        style: {
          backgroundColor: colorPalette.primary[500],
          borderColor: colorPalette.primary[500],
          color: '#fff',
        },
      },
    });
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{bankId ? `Edit ${bankData?.accountType || 'Bank'}` : 'Add Bank'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} validateOnChange={true} initialValues={initialValues} validationSchema={bankValidateSchema} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);

              return (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Bank details</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="text"
                          name="accountName"
                          label="Account Name"
                          placeholder="Enter Account Name"
                          value={values.accountName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.accountName}
                          touched={touched.accountName}
                          setFieldValue={setFieldValue}
                          required={true}
                          disabled={values.accountType === BANK_TYPES.PETTY_CASH}
                        />
                        <CustomInput
                          type="text"
                          name="accountCode"
                          label="Account Code"
                          placeholder="Enter Account Code"
                          value={values.accountCode}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.accountCode}
                          touched={touched.accountCode}
                          setFieldValue={setFieldValue}
                        />
                        <CustomInput
                          type="select"
                          name="currency"
                          label="Currency"
                          placeholder="Select Currency"
                          value={values.currency}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.currency}
                          touched={touched.currency}
                          setFieldValue={setFieldValue}
                          selectOptions={currencyOptions}
                          loading={currencyLoading}
                          required={true}
                          disabled={bankId}
                        />
                      </div>
                      {values.accountType === BANK_TYPES.BANK && (
                        <>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                            <CustomInput
                              type="text"
                              name="bankName"
                              label="Bank Name"
                              placeholder="Enter Bank Name"
                              value={values.bankName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.bankName}
                              touched={touched.bankName}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput
                              type="text"
                              name="branch"
                              label="Bank branch"
                              placeholder="Enter Bank Branch"
                              value={values.branch}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.branch}
                              touched={touched.branch}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput
                              type="text"
                              name="gstinUin"
                              label="GSTIN/UIN"
                              placeholder="Enter GSTIN/UIN"
                              value={values.gstinUin}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.gstinUin}
                              touched={touched.gstinUin}
                              setFieldValue={setFieldValue}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                            <CustomInput
                              type="text"
                              name="accountNumber"
                              label="Account Number"
                              placeholder="Enter Account Number"
                              value={values.accountNumber}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.accountNumber}
                              touched={touched.accountNumber}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput
                              type="text"
                              name="ifsc"
                              label="IFSC"
                              placeholder="Enter IFSC Code"
                              value={values.ifsc}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.ifsc}
                              touched={touched.ifsc}
                              setFieldValue={setFieldValue}
                            />
                          </div>
                        </>
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="text"
                          name="openingBalance"
                          label="Opening Balance"
                          placeholder="Enter Opening Balance"
                          value={values.openingBalance}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.openingBalance}
                          touched={touched.openingBalance}
                          setFieldValue={setFieldValue}
                        />
                        <CustomInput
                          type="select"
                          name="divisionId"
                          label="Division"
                          placeholder="Select Division"
                          value={values?.divisionId}
                          onBlur={handleBlur}
                          errorMessage={errors.divisionId}
                          touched={touched.divisionId}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={divisionSelectColumnHeader}
                          selectOptions={buildDivisionSelectOptions(divDrop)}
                          onChange={e => {
                            setFieldValue('divisionId', e);
                            setSelectedDivisionId(e);
                            setFieldValue('branchId', null);
                            dispatch(resetBranch());
                          }}
                          allowClear={true}
                          loading={divisionLoading}
                        />
                        <CustomInput
                          type="select"
                          name="branchId"
                          label="Branch"
                          placeholder="Select Branch"
                          value={values?.branchId}
                          onBlur={handleBlur}
                          errorMessage={errors.branchId}
                          touched={touched.branchId}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={branchSelectColumnHeader}
                          selectOptions={buildBranchSelectOptions(branchDrop)}
                          onChange={e => {
                            setFieldValue('branchId', e);
                          }}
                          disabled={!values.divisionId}
                          allowClear={true}
                          loading={branchLoading}
                        />
                      </div>
                      {/* Notes */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="textarea"
                          name="description"
                          label="Description"
                          placeholder="Enter Description"
                          value={values.description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.description}
                          touched={touched.description}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="checkbox"
                          name="isPrimary"
                          CheckboxName="Make this primary"
                          value={values.isPrimary}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.isPrimary}
                          touched={touched.isPrimary}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      loading={submitLoading}
                      text="Save"
                      onClick={async () => {
                        const validationErrors = await formikRef.current.validateForm();

                        if (Object.keys(validationErrors).length > 0) {
                          setTouched(errorsToTouched(validationErrors));
                          const firstErrorField = Object.keys(validationErrors)[0];
                          scrollToError(firstErrorField, validationErrors);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default AddBank;
