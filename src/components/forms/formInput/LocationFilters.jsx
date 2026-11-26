import FilterInput from '@/components/forms/formInput/FilterInput';
import { useMultiLocationFilters } from 'hooks/useMultiLocationFilters';
import { filterInputEnum } from '@/utils/constants';
import { ADDRESS_TYPE_OPTIONS } from '@/utils/dropdownEnums';

function formatLocationTag(value) {
  return value?.split(',').filter(Boolean).join(', ') || null;
}

export function getLocationFilterTags({ includeAddressType = true } = {}) {
  const tags = {
    country: {
      label: 'Country',
      format: formatLocationTag,
      clear: (setFilter, updateUrlParams) => {
        setFilter(prev => ({ ...prev, country: '', state: '', city: '' }));
        updateUrlParams({ country: null, state: null, city: null });
      },
    },
    state: {
      label: 'State',
      format: formatLocationTag,
      clear: (setFilter, updateUrlParams) => {
        setFilter(prev => ({ ...prev, state: '', city: '' }));
        updateUrlParams({ state: null, city: null });
      },
    },
    city: {
      label: 'City',
      format: formatLocationTag,
      clear: (setFilter, updateUrlParams) => {
        setFilter(prev => ({ ...prev, city: '' }));
        updateUrlParams({ city: null });
      },
    },
  };

  if (includeAddressType) {
    tags.addressType = {
      label: 'Address Type',
      format: value => ADDRESS_TYPE_OPTIONS.find(option => option.value === value)?.label || value,
      clear: (setFilter, updateUrlParams) => {
        setFilter(prev => ({ ...prev, addressType: '' }));
        updateUrlParams({ addressType: null });
      },
    };
  }

  return tags;
}

const LocationFilters = ({ filter, setFilter, showAddressType = true }) => {
  const locationFilters = useMultiLocationFilters({
    country: filter?.country,
    state: filter?.state,
    city: filter?.city,
    setFilter,
  });

  return (
    <div className="contents">
      {showAddressType && (
        <div className="space-y-2">
          <FilterInput
            type={filterInputEnum?.SELECT}
            name={'addressType'}
            label={'Address Type'}
            placeHolder={'Select Address Type'}
            selectionOptions={ADDRESS_TYPE_OPTIONS}
            value={filter?.addressType}
            setFilter={setFilter}
            allowClear={true}
          />
        </div>
      )}
      <div className="space-y-2">
        <FilterInput
          type={filterInputEnum?.SELECT}
          mode="multiple"
          name={'country'}
          label={'Country'}
          placeHolder={'Select Country'}
          selectionOptions={locationFilters.countryOptions}
          value={filter?.country}
          setFilter={setFilter}
          allowClear={true}
          loading={locationFilters.countriesLoading && !locationFilters.countryOptions.length}
          onFocus={locationFilters.handleCountryFocus}
        />
      </div>
      <div className="space-y-2">
        <FilterInput
          type={filterInputEnum?.SELECT}
          mode="multiple"
          name={'state'}
          label={'State'}
          placeHolder={'Select State'}
          selectionOptions={locationFilters.stateOptions}
          value={filter?.state}
          setFilter={setFilter}
          allowClear={true}
          disabled={locationFilters.stateDisabled}
          loading={locationFilters.statesLoading && !locationFilters.stateOptions.length}
        />
      </div>
      <div className="space-y-2">
        <FilterInput
          type={filterInputEnum?.SELECT}
          mode="multiple"
          name={'city'}
          label={'City'}
          placeHolder={'Select City'}
          selectionOptions={locationFilters.cityOptions}
          value={filter?.city}
          setFilter={setFilter}
          allowClear={true}
          disabled={locationFilters.cityDisabled}
          loading={locationFilters.citiesLoading && !locationFilters.cityOptions.length}
        />
      </div>
    </div>
  );
};

export default LocationFilters;
