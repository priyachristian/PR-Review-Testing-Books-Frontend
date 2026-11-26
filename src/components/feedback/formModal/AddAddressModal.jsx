import { useFormik } from 'formik';

// Components
import { Select } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useLocationCascade } from '@/hooks/useLocationCascade';

// Extras
import { addAddressValidateSchema } from '@/utils/validationsSchema';
import { ADDRESS_TYPE } from '@/utils/constants';

const AddAddressModal = ({ modalOpen, setModalOpen, customerId, getlist, addressDetail, handleClose, isProfileAddress = false, addressType = ADDRESS_TYPE.SHIPPING }) => {
  const { submitLoading: customerSubmitLoading, addCustomerAddress, updateCustomerAddress } = useCustomer();
  const { loading: profileLoading, addProfileAddress, updateProfileAddress } = useProfile();

  const submitLoading = isProfileAddress ? profileLoading : customerSubmitLoading;

  const initialValues = {
    attention: addressDetail?.attention || '',
    country: addressDetail?.country || null,
    address: {
      street1: addressDetail?.address?.street1 || addressDetail?.street1 || '',
      street2: addressDetail?.address?.street2 || addressDetail?.street2 || '',
    },
    city: addressDetail?.city || '',
    state: addressDetail?.state || null,
    pinCode: addressDetail?.pinCode || '',
    faxNumber: addressDetail?.faxNumber || '',
    phone: addressDetail?.phone || '',
  };

  const onFinish = async values => {
    if (submitLoading) return;
    try {
      if (isProfileAddress) {
        let payload = {
          ...values,
        };
        payload.street1 = values.address.street1;
        payload.street2 = values.address.street2;
        delete payload.address;
        delete payload.attention;
        if (addressDetail) {
          await updateProfileAddress({
            addressId: addressDetail?._id,
            isDefault: addressDetail?.isDefault || false,
            ...payload,
          });
        } else {
          await addProfileAddress({
            ...payload,
          });
        }
      } else {
        if (addressDetail) {
          await updateCustomerAddress({
            addressId: addressDetail?._id,
            isDefault: addressDetail?.isDefault || false,
            addressType,
            ...values,
          });
        } else {
          await addCustomerAddress({
            customerId,
            addressType,
            ...values,
          });
        }
      }
      if (getlist) getlist();
      setModalOpen(false);
      handleClose();
    } catch {
      // error already handled in slice
    }
  };

  const onFinishFailed = errorInfo => {
    console.log(errorInfo);
  };

  const formik = useFormik({
    initialValues,
    validationSchema: addAddressValidateSchema,
    onSubmit: onFinish,
  });

  const loc = useLocationCascade({
    country: formik.values.country,
    state: formik.values.state,
    fieldPathPrefix: '',
    setFieldValue: formik.setFieldValue,
  });

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      width={700}
      title={
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">{`${addressDetail ? 'Edit' : 'Add'} Address`}</span>
        </div>
      }
    >
      <CustomForm name="customer-address" onFinish={formik.handleSubmit} onFinishFailed={onFinishFailed}>
        <div>
          <div className="grid grid-cols-2 gap-5">
            {!isProfileAddress && (
              <CustomInput
                type="text"
                name="attention"
                label="Attention"
                placeholder="Enter Attention"
                value={formik.values.attention}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                errorMessage={formik.errors?.attention}
                touched={formik.touched?.attention}
                setFieldValue={formik.setFieldValue}
              />
            )}
            <CustomInput
              type="select"
              name="country"
              label="Country / Region"
              placeholder="Select Country"
              value={formik.values.country}
              onFocus={loc.handleCountryFocus}
              onChange={loc.onCountryChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.country}
              touched={formik.touched?.country}
              setFieldValue={formik.setFieldValue}
              selectOptions={loc.countryOptions}
              loading={loc.countriesLoading}
              required={true}
            />
          </div>
          <div className="grid grid-cols-2 gap-5 pt-2">
            <div className={`${loc.stateDisabled ? 'opacity-50' : ''}`}>
              <CustomInput
                type="select"
                name="state"
                label="State"
                placeholder="Select State"
                value={formik.values.state}
                onChange={loc.onStateChange}
                onBlur={formik.handleBlur}
                errorMessage={formik.errors?.state}
                touched={formik.touched?.state}
                setFieldValue={formik.setFieldValue}
                selectOptions={loc.stateOptions}
                loading={loc.statesLoading}
                disabled={loc.stateDisabled}
                required={true}
              />
            </div>
            <div className={`${loc.cityDisabled ? 'opacity-50' : ''}`}>
              <CustomInput
                type="select"
                name="city"
                label="City"
                placeholder="Select City"
                value={formik.values.city}
                onChange={loc.onCityChange}
                onBlur={formik.handleBlur}
                errorMessage={formik.errors?.city}
                touched={formik.touched?.city}
                setFieldValue={formik.setFieldValue}
                selectOptions={loc.cityOptions}
                loading={loc.citiesLoading}
                disabled={loc.cityDisabled}
                required={true}
              />
            </div>
          </div>
          <div className="pt-2">
            <CustomInput
              type="textarea"
              name="address.street1"
              label="Address"
              placeholder="Street-1"
              value={formik.values.address.street1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.address?.street1}
              touched={formik.touched?.address?.street1}
              setFieldValue={formik.setFieldValue}
              required={true}
            />
          </div>
          <div className={formik.errors.address?.street1 && formik.touched.address?.street1 ? 'mt-5' : 'pt-2'}>
            <CustomInput
              type="textarea"
              name="address.street2"
              placeholder="Street-2"
              value={formik.values.address.street2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.address?.street2}
              touched={formik.touched?.address?.street2}
              setFieldValue={formik.setFieldValue}
            />
          </div>
          <div className="grid grid-cols-2 gap-5 pt-2">
            <CustomInput
              type="text"
              name="pinCode"
              label="Pin Code"
              placeholder="Enter Pin Code"
              value={formik.values.pinCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.pinCode}
              touched={formik.touched?.pinCode}
              setFieldValue={formik.setFieldValue}
              required={true}
            />
            <CustomInput
              type="number"
              name="faxNumber"
              label="Fax Number"
              placeholder="Enter Fax Number"
              value={formik.values.faxNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.faxNumber}
              touched={formik.touched?.faxNumber}
              setFieldValue={formik.setFieldValue}
            />
          </div>
          <div className="grid grid-cols-2 gap-5 pt-2">
            <CustomInput
              type="number"
              name="phone"
              label="Phone Number"
              placeholder="Enter Phone Number"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              errorMessage={formik.errors?.phone}
              touched={formik.touched?.phone}
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
        <div className="flex justify-end items-center gap-5 mt-5 w-full">
          <CustomButton
            className="px-8 py-4"
            type="default"
            text="Cancel"
            disabled={submitLoading}
            onClick={() => {
              setModalOpen(false);
              handleClose();
            }}
          />
          <CustomButton className="px-4 py-4" type="primary" text="Save" loading={submitLoading} onClick={formik.handleSubmit} style={{ minWidth: 80 }} />
        </div>
      </CustomForm>
    </CustomModal>
  );
};

export default AddAddressModal;
