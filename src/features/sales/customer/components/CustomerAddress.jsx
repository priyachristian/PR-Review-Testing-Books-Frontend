import { useEffect, useMemo } from 'react';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';

// Components
import { Select } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import ShowErrorsOnParentSubmit from '@/components/forms/ShowErrorsOnParentSubmit';

// Extras
import { useCustomer, addAddress, customerAddressValidateSchema } from '@/features/sales/customer';
import Icons from 'assets/icons/icon';
import { useLocationCascade } from '@/hooks/useLocationCascade';

const CustomerAddress = ({ parentSubmitCount = 0 }) => {
  const dispatch = useDispatch();

  const { address } = useCustomer();

  const billing = address?.billing;
  const shipping = address?.shipping;

  const initialValues = useMemo(
    () => ({
      billing: {
        attention: billing ? billing?.attention : '',
        country: billing ? billing?.country : null,
        address: {
          street1: billing ? billing?.address?.street1 : '',
          street2: billing ? billing?.address?.street2 : '',
        },
        city: billing ? billing?.city : '',
        state: billing ? billing?.state : null,
        pinCode: billing ? billing?.pinCode : '',
        faxNumber: billing ? billing?.faxNumber : '',
        phone: billing ? billing?.phone : '',
      },
      shipping: {
        attention: shipping ? shipping?.attention : '',
        country: shipping ? shipping?.country : null,
        address: {
          street1: shipping ? shipping?.address?.street1 : '',
          street2: shipping ? shipping?.address?.street2 : '',
        },
        city: shipping ? shipping?.city : '',
        state: shipping ? shipping?.state : null,
        pinCode: shipping ? shipping?.pinCode : '',
        faxNumber: shipping ? shipping?.faxNumber : '',
        phone: shipping ? shipping?.phone : '',
      },
    }),
    [address]
  );

  const copyBillingToShipping = (values, setFieldValue) => {
    const { billing } = values;

    Object.keys(billing).forEach(key => {
      setFieldValue(`shipping.${key}`, billing[key]);
    });
  };

  const formik = useFormik({
    initialValues,
    validationSchema: customerAddressValidateSchema,
  });

  const billingLoc = useLocationCascade({
    country: formik.values.billing.country,
    state: formik.values.billing.state,
    fieldPathPrefix: 'billing',
    setFieldValue: formik.setFieldValue,
  });

  const shippingLoc = useLocationCascade({
    country: formik.values.shipping.country,
    state: formik.values.shipping.state,
    fieldPathPrefix: 'shipping',
    setFieldValue: formik.setFieldValue,
  });

  useEffect(() => {
    dispatch(addAddress(formik.values));
  }, [formik.values, dispatch]);

  return (
    <div className="pb-28 relative">
      <CustomForm name="customer-address">
        <ShowErrorsOnParentSubmit parentSubmitCount={parentSubmitCount} validateForm={formik.validateForm} setTouched={formik.setTouched} />
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-2">
                <div className="text-lg font-semibold">Billing Address</div>
                <div className="pt-2">
                  <CustomInput
                    type="text"
                    name="billing.attention"
                    label="Attention"
                    placeholder="Enter Attention"
                    value={formik.values.billing.attention}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.attention}
                    touched={formik.touched.billing?.attention}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="select"
                    name="billing.country"
                    label="Country / Region"
                    placeholder="Select Country"
                    value={formik.values.billing.country}
                    onChange={billingLoc.onCountryChange}
                    onFocus={billingLoc.handleCountryFocus}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.country}
                    touched={formik.touched.billing?.country}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={billingLoc.countryOptions}
                    loading={billingLoc.countriesLoading}
                    allowClear
                  />
                </div>
                <div className={`pt-2 ${billingLoc.stateDisabled ? 'opacity-50' : ''}`}>
                  <CustomInput
                    type="select"
                    name="billing.state"
                    label="State"
                    placeholder="Select State"
                    value={formik.values.billing.state}
                    onChange={billingLoc.onStateChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.state}
                    touched={formik.touched.billing?.state}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={billingLoc.stateOptions}
                    loading={billingLoc.statesLoading}
                    disabled={billingLoc.stateDisabled}
                    allowClear
                  />
                </div>
                <div className={`pt-2 ${billingLoc.cityDisabled ? 'opacity-50' : ''}`}>
                  <CustomInput
                    type="select"
                    name="billing.city"
                    label="City"
                    placeholder="Select City"
                    value={formik.values.billing.city}
                    onChange={billingLoc.onCityChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.city}
                    touched={formik.touched.billing?.city}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={billingLoc.cityOptions}
                    loading={billingLoc.citiesLoading}
                    disabled={billingLoc.cityDisabled}
                    allowClear
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="textarea"
                    name="billing.address.street1"
                    label="Address"
                    placeholder="Street-1"
                    value={formik.values.billing.address.street1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.address?.street1}
                    touched={formik.touched.billing?.address?.street1}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-5">
                  <CustomInput
                    type="textarea"
                    name="billing.address.street2"
                    placeholder="Street-2"
                    value={formik.values.billing.address.street2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.address?.street2}
                    touched={formik.touched.billing?.address?.street2}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="text"
                    name="billing.pinCode"
                    label="Pin Code"
                    placeholder="Enter Pin Code"
                    value={formik.values.billing.pinCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.pinCode}
                    touched={formik.touched.billing?.pinCode}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="number"
                    name="billing.faxNumber"
                    label="Fax Number"
                    placeholder="Enter Fax Number"
                    value={formik.values.billing.faxNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.faxNumber}
                    touched={formik.touched.billing?.faxNumber}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="number"
                    name="billing.phone"
                    label="Phone Number"
                    placeholder="Enter Phone Number"
                    value={formik.values.billing.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.billing?.phone}
                    touched={formik.touched.billing?.phone}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              <div className="col-span-2">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Shipping Address</div>
                  <CustomButton
                    type="primary"
                    className="py-4 px-5"
                    text={
                      <div className="flex gap-2 items-center">
                        <Icons.PlusOutlined />
                        <div>Copy Billing Address</div>
                      </div>
                    }
                    onClick={() => copyBillingToShipping(formik.values, formik.setFieldValue)}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="text"
                    name="shipping.attention"
                    label="Attention"
                    placeholder="Enter Attention"
                    value={formik.values.shipping.attention}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.attention}
                    touched={formik.touched.shipping?.attention}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="select"
                    name="shipping.country"
                    label="Country / Region"
                    placeholder="Select Country"
                    value={formik.values.shipping.country}
                    onChange={shippingLoc.onCountryChange}
                    onFocus={shippingLoc.handleCountryFocus}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.country}
                    touched={formik.touched.shipping?.country}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={shippingLoc.countryOptions}
                    loading={shippingLoc.countriesLoading}
                    allowClear
                  />
                </div>
                <div className={`pt-2 ${shippingLoc.stateDisabled ? 'opacity-50' : ''}`}>
                  <CustomInput
                    type="select"
                    name="shipping.state"
                    label="State"
                    placeholder="Select State"
                    value={formik.values.shipping.state}
                    onChange={shippingLoc.onStateChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.state}
                    touched={formik.touched.shipping?.state}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={shippingLoc.stateOptions}
                    loading={shippingLoc.statesLoading}
                    disabled={shippingLoc.stateDisabled}
                    allowClear
                  />
                </div>
                <div className={`pt-2 ${shippingLoc.cityDisabled ? 'opacity-50' : ''}`}>
                  <CustomInput
                    type="select"
                    name="shipping.city"
                    label="City"
                    placeholder="Select City"
                    value={formik.values.shipping.city}
                    onChange={shippingLoc.onCityChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.city}
                    touched={formik.touched.shipping?.city}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={shippingLoc.cityOptions}
                    loading={shippingLoc.citiesLoading}
                    disabled={shippingLoc.cityDisabled}
                    allowClear
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="textarea"
                    name="shipping.address.street1"
                    label="Address"
                    placeholder="Street-1"
                    value={formik.values.shipping.address.street1}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.address?.street1}
                    touched={formik.touched.shipping?.address?.street1}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-5">
                  <CustomInput
                    type="textarea"
                    name="shipping.address.street2"
                    placeholder="Street-2"
                    value={formik.values.shipping.address.street2}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.address?.street2}
                    touched={formik.touched.shipping?.address?.street2}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="text"
                    name="shipping.pinCode"
                    label="Pin Code"
                    placeholder="Enter Pin Code"
                    value={formik.values.shipping.pinCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.pinCode}
                    touched={formik.touched.shipping?.pinCode}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="number"
                    name="shipping.faxNumber"
                    label="Fax Number"
                    placeholder="Enter Fax Number"
                    value={formik.values.shipping.faxNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.faxNumber}
                    touched={formik.touched.shipping?.faxNumber}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
                <div className="pt-2">
                  <CustomInput
                    type="number"
                    name="shipping.phone"
                    label="Phone Number"
                    placeholder="Enter Phone Number"
                    value={formik.values.shipping.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.shipping?.phone}
                    touched={formik.touched.shipping?.phone}
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
          </div>
        </div>
      </CustomForm>
    </div>
  );
};

export default CustomerAddress;
