import CustomInput from '@/components/forms/formInput/CustomInput';
import { useLocationCascade } from '@/hooks/useLocationCascade';

const WarehouseAddressFields = ({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
  const loc = useLocationCascade({
    country: values.country,
    state: values.state,
    fieldPathPrefix: '',
    setFieldValue,
  });

  const fieldProps = name => ({
    name,
    value: values[name],
    onBlur: handleBlur,
    errorMessage: errors[name],
    touched: touched[name],
    setFieldValue,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <h3 className="text-[15px] font-semibold text-gray-900 m-0">Address</h3>
      <p className="m-0 mb-3 text-xs text-gray-500">Needed to use this warehouse in an internal stock transfer.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
        <CustomInput type="text" label="Warehouse Address" placeholder="Street 1" onChange={handleChange} {...fieldProps('street1')} />
        <CustomInput type="text" label=" " placeholder="Street 2" onChange={handleChange} {...fieldProps('street2')} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-5">
        <div className="grid grid-cols-2 gap-5">
          <CustomInput
            type="select"
            label="Country"
            placeholder="Select Country"
            onChange={loc.onCountryChange}
            onFocus={loc.handleCountryFocus}
            selectOptions={loc.countryOptions}
            loading={loc.countriesLoading}
            {...fieldProps('country')}
          />
          <div className={loc.stateDisabled ? 'opacity-50' : ''}>
            <CustomInput
              type="select"
              label="State"
              placeholder="State/Union Territory"
              onChange={loc.onStateChange}
              selectOptions={loc.stateOptions}
              loading={loc.statesLoading}
              disabled={loc.stateDisabled}
              {...fieldProps('state')}
            />
          </div>
          <div className={loc.cityDisabled ? 'opacity-50' : ''}>
            <CustomInput
              type="select"
              label="City"
              placeholder="City"
              onChange={loc.onCityChange}
              selectOptions={loc.cityOptions}
              loading={loc.citiesLoading}
              disabled={loc.cityDisabled}
              {...fieldProps('city')}
            />
          </div>
          <CustomInput type="text" label="Pin Code" placeholder="Pin Code" maxLength={6} onChange={handleChange} {...fieldProps('pinCode')} />
        </div>
      </div>
    </div>
  );
};

export default WarehouseAddressFields;
