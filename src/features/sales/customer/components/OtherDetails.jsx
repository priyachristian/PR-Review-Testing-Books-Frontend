import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import ShowErrorsOnParentSubmit from '@/components/forms/ShowErrorsOnParentSubmit';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { useCurrency } from '@/features/setting/currency/useCurrency';

// Extras
import { addOtherDetails, otherDetailsValidateSchema, useCustomer } from '@/features/sales/customer';
import { Tooltip } from 'antd';
import { usePriceList } from '@/features/allMaster/priceList';
import { buildPriceListSelectOptions, priceListSelectColumnHeader } from '@/utils/tableSelectDropdown/priceListSelectDropdown';

export function priceListToId(priceList) {
  if (priceList == null || priceList === '') return null;
  if (typeof priceList === 'object') {
    return priceList._id ?? priceList.id ?? null;
  }
  return priceList;
}

const OtherDetails = React.memo(({ updateAttachments, isCustomerOrderAppAvailable, isEdit = false, isVendorPage = false, parentSubmitCount = 0 }) => {
  const dispatch = useDispatch();
  const { otherDetails, customerDetail } = useCustomer();
  const { priceListDrop, getPriceListDropdown, resetPriceListDrop, loading: priceListDropLoading } = usePriceList();
  const { currencies, loading: currencyLoading, getCurrencies } = useCurrency();
  const { currencyId: baseCurrencyId } = useCompanyCurrency();
  const currencyOptions = useMemo(() => {
    if (isEdit) {
      const currency = customerDetail?.otherDetails?.currency;
      return currency ? [{ value: String(currency._id), label: `${currency.symbol} - ${currency.name}` }] : [];
    }
    return (currencies || []).map(currency => ({
      value: String(currency._id),
      label: `${currency.symbol} - ${currency.name}`,
    }));
  }, [isEdit, customerDetail?.otherDetails?.currency, currencies]);

  const formikRef = useRef();
  const prevFormValuesRef = useRef(null);
  const fileAttachmentsRef = useRef([]); // Store File objects locally

  const initialValues = useMemo(() => {
    const urlAttachments = otherDetails?.document || [];
    const fileAttachments = fileAttachmentsRef.current || [];
    const allAttachments = [...fileAttachments, ...urlAttachments];
    return {
      gstTreatment: otherDetails ? otherDetails?.gstTreatment : null,
      gstinUin: otherDetails ? otherDetails?.gstinUin : null,
      importExportCountry: otherDetails ? otherDetails?.importExportCountry : null,
      importExportCode: otherDetails ? otherDetails?.importExportCode : null,
      taxPreference: otherDetails ? otherDetails?.taxPreference : 'Taxable',
      pan: otherDetails ? otherDetails?.pan : '',
      currency: priceListToId(otherDetails?.currency) || baseCurrencyId || null,
      priceList: otherDetails ? priceListToId(otherDetails?.priceList) : null,
      includePriceListItemOnly: isVendorPage ? false : otherDetails ? !!otherDetails?.includePriceListItemOnly : false,
      enablePortal: isVendorPage ? false : otherDetails ? otherDetails?.enablePortal : false,
      attachments: allAttachments,
    };
  }, [otherDetails, baseCurrencyId, isVendorPage]);

  // Comprehensive hook that handles all dirty form logic
  const { updateFormValues } = useFormDirtyState(initialValues);

  useEffect(() => {
    if (isEdit) return;
    getCurrencies({ pagination: false });
  }, [getCurrencies, isEdit]);

  useEffect(() => {
    const controller = new AbortController();
    getPriceListDropdown({ signal: controller.signal });
    return () => {
      resetPriceListDrop();
      controller.abort();
    };
  }, [dispatch]);

  const dispatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        // Separate File objects from URL strings
        const fileAttachments = Array.isArray(values.attachments) ? values.attachments.filter(att => att instanceof File) : [];
        const urlAttachments = Array.isArray(values.attachments) ? values.attachments.filter(att => typeof att === 'string') : [];

        // Store File objects locally and in parent component
        fileAttachmentsRef.current = fileAttachments;
        if (updateAttachments) {
          updateAttachments(fileAttachments);
        }

        // Store only URL strings in Redux (File objects can't be serialized)
        const details = {
          ...values,
          priceList: priceListToId(values.priceList),
          gstinUin: values.gstTreatment === 'Registered Business Regular' ? (values?.gstinUin ? values?.gstinUin : '') : '',
          enablePortal: isVendorPage ? false : isCustomerOrderAppAvailable ? values.enablePortal : false,
          includePriceListItemOnly: isVendorPage ? false : !!values.includePriceListItemOnly,
          document: urlAttachments, // Only URLs, Files are stored in ref
        };

        dispatch(addOtherDetails(details));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch, updateAttachments, isCustomerOrderAppAvailable, isVendorPage]
  );

  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, []);

  // Apply external Redux updates (edit load, GST prefill) without reinitializing on every keystroke
  useEffect(() => {
    if (!formikRef.current || !otherDetails) return;
    if (JSON.stringify(initialValues) === JSON.stringify(prevFormValuesRef.current)) return;
    formikRef.current.setValues(initialValues);
    prevFormValuesRef.current = initialValues;
  }, [otherDetails, initialValues]);

  return (
    <div className="pb-28 relative">
      <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={otherDetailsValidateSchema}>
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, validateForm, setTouched }) => {
          dispatchOnFormChanges(values);
          updateFormValues(values);
          return (
            <CustomForm name="other-details">
              <ShowErrorsOnParentSubmit parentSubmitCount={parentSubmitCount} validateForm={validateForm} setTouched={setTouched} />
              <div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="select"
                    name="gstTreatment"
                    label="GST Treatment"
                    placeholder="Select GST Type"
                    value={values.gstTreatment}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.gstTreatment}
                    touched={touched.gstTreatment}
                    setFieldValue={setFieldValue}
                    selectOptions={[
                      {
                        value: 'Registered Business Regular',
                        label: 'Registered Business Regular',
                      },
                      {
                        value: 'Unregistered Business Regular',
                        label: 'Unregistered Business Regular',
                      },
                      { value: 'Export', label: 'Export' },
                    ]}
                    required={true}
                  />
                  {values.gstTreatment === 'Registered Business Regular' && (
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
                      required={true}
                    />
                  )}
                  {values.gstTreatment === 'Export' && (
                    <>
                      <CustomInput
                        type="select"
                        name="importExportCountry"
                        label="Country"
                        placeholder="Select Country"
                        value={values.importExportCountry || undefined}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.importExportCountry}
                        touched={touched.importExportCountry}
                        setFieldValue={setFieldValue}
                        selectOptions={[
                          { value: 'Nepal', label: 'Nepal' },
                          { value: 'China', label: 'China' },
                        ]}
                        showSearch
                      />
                      <CustomInput
                        type="text"
                        name="importExportCode"
                        label="Import-Export Code"
                        placeholder="Enter Import-Export Code"
                        value={values.importExportCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.importExportCode}
                        touched={touched.importExportCode}
                        setFieldValue={setFieldValue}
                      />
                    </>
                  )}
                </div>
                <div className="pt-2 w-max">
                  <CustomInput
                    name="taxPreference"
                    label="Tax Preference"
                    type="radio"
                    value={values.taxPreference}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.taxPreference}
                    touched={touched.taxPreference}
                    setFieldValue={setFieldValue}
                    radioOptions={[
                      { value: 'Taxable', label: 'Taxable' },
                      { value: 'Tax Exempt', label: 'Tax Exempt' },
                    ]}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <CustomInput
                    type="text"
                    name="pan"
                    label="PAN"
                    placeholder="Enter PAN"
                    value={values.pan}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.pan}
                    touched={touched.pan}
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
                    disabled={isEdit}
                  />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                  <div>
                    <CustomInput
                      type="select"
                      name="priceList"
                      label="Price List"
                      placeholder="Select Price List"
                      value={values.priceList}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.priceList}
                      touched={touched.priceList}
                      setFieldValue={setFieldValue}
                      selectVariant="twoColumn"
                      columnSelectHeader={priceListSelectColumnHeader}
                      selectOptions={buildPriceListSelectOptions(priceListDrop)}
                      loading={priceListDropLoading}
                      allowClear={true}
                    />
                    {!isVendorPage && (
                      <CustomInput
                        type="checkbox"
                        name="includePriceListItemOnly"
                        CheckboxName="Include Price List Item Only"
                        value={values.includePriceListItemOnly}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.includePriceListItemOnly}
                        touched={touched.includePriceListItemOnly}
                        setFieldValue={setFieldValue}
                      />
                    )}
                  </div>
                </div>
                {/* Hard hidden without the customer portal (CUSTOMER_ORDER) plan feature. */}
                {!isVendorPage && isCustomerOrderAppAvailable && (
                  <div className="pt-2 flex gap-5 items-end">
                    <Tooltip title="Allow Portal App access for this customer">
                      <div>
                        <CustomInput
                          type="checkbox"
                          name="enablePortal"
                          label="Enable Portal?"
                          CheckboxName="Allow Portal App access for this customer"
                          value={values.enablePortal}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.enablePortal}
                          touched={touched.enablePortal}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </Tooltip>
                  </div>
                )}
                <div className="grid md:grid-cols-1 lg:grid-cols-3 lg:gap-x-7 items-start pt-2">
                  <CustomFileUpload
                    name="attachments"
                    label="Attach Documents"
                    value={values.attachments}
                    setFieldValue={setFieldValue}
                    onBlur={handleBlur}
                    errorMessage={errors.attachments}
                    touched={touched.attachments}
                    fileType="all"
                    multiple={true}
                    maxSize={5}
                    maxFiles={3}
                  />
                </div>
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </div>
  );
});

OtherDetails.displayName = 'OtherDetails';

export default OtherDetails;
