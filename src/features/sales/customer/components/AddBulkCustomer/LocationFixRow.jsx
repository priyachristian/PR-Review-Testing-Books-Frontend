import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/AntDComponent';
import { useLocation } from '@/features/common/location/useLocation';

const getRowId = row => row?._id || row?.id;

/**
 * Cascading Country → State → City selectors for one address type on a verify record.
 * level: 'country' | 'state' | 'city'
 */
const LocationFixRow = ({ level, addressType, existingCountry, existingState, appliedLocation, onApply }) => {
  const { countries, statesByCountryId, citiesByStateId, loading, getCountries, getStates, getCities } = useLocation();

  const [country, setCountry] = useState(appliedLocation?.country || (level === 'country' ? null : existingCountry || null));
  const [state, setState] = useState(appliedLocation?.state || (level === 'city' ? existingState || null : null));
  const [city, setCity] = useState(appliedLocation?.city || null);

  useEffect(() => {
    getCountries();
  }, [getCountries]);

  const selectedCountryId = useMemo(() => {
    if (!countries.length || !country) return '';
    const row = countries.find(c => c.name === country);
    const id = getRowId(row);
    return id ? String(id) : '';
  }, [countries, country]);

  const states = useMemo(() => (selectedCountryId ? statesByCountryId[selectedCountryId] || [] : []), [selectedCountryId, statesByCountryId]);

  const selectedStateId = useMemo(() => {
    if (!states.length || !state) return '';
    const row = states.find(s => s.name === state);
    const id = getRowId(row);
    return id ? String(id) : '';
  }, [states, state]);

  const cities = useMemo(() => (selectedStateId ? citiesByStateId[selectedStateId] || [] : []), [selectedStateId, citiesByStateId]);

  useEffect(() => {
    if (!selectedCountryId) return;
    getStates(selectedCountryId);
  }, [selectedCountryId, getStates]);

  useEffect(() => {
    if (!selectedStateId) return;
    getCities(selectedStateId);
  }, [selectedStateId, getCities]);

  const countryOptions = useMemo(() => countries.map(c => ({ label: c.name, value: c.name })), [countries]);
  const stateOptions = useMemo(() => states.map(s => ({ label: s.name, value: s.name })), [states]);
  const cityOptions = useMemo(() => cities.map(c => ({ label: c.name, value: c.name })), [cities]);

  const showCountry = level === 'country';
  const showState = level === 'country' || level === 'state';
  const showCity = true;

  const handleCountryChange = value => {
    setCountry(value || null);
    setState(null);
    setCity(null);
  };

  const handleStateChange = value => {
    setState(value || null);
    setCity(null);
  };

  const handleCityChange = value => {
    const nextCity = value || null;
    setCity(nextCity);

    if (!nextCity) return;

    const resolvedCountry = level === 'country' ? country : existingCountry;
    const resolvedState = level === 'city' ? existingState : state;

    if ((showCountry && !resolvedCountry) || (showState && !resolvedState)) return;

    onApply?.({
      country: resolvedCountry,
      state: resolvedState,
      city: nextCity,
    });
  };

  const addressLabel = addressType === 'billing' ? 'Billing' : 'Shipping';

  return (
    <div className="space-y-2 rounded-md border border-amber-100 bg-white/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{addressLabel} address</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {showCountry && (
          <Select
            placeholder="Select country"
            className="w-full"
            options={countryOptions}
            loading={!!loading.countries}
            showSearch
            optionFilterProp="label"
            value={country || undefined}
            onChange={handleCountryChange}
          />
        )}
        {showState && (
          <Select
            placeholder="Select state"
            className="w-full"
            options={stateOptions}
            loading={!!loading.statesByCountryId[selectedCountryId]}
            showSearch
            optionFilterProp="label"
            disabled={!country}
            value={state || undefined}
            onChange={handleStateChange}
          />
        )}
        {showCity && (
          <Select
            placeholder="Select city"
            className="w-full"
            options={cityOptions}
            loading={!!loading.citiesByStateId[selectedStateId]}
            showSearch
            optionFilterProp="label"
            disabled={!state}
            value={city || undefined}
            onChange={handleCityChange}
          />
        )}
      </div>
      {level === 'state' && existingCountry && <p className="text-xs text-gray-500">Country: {existingCountry}</p>}
      {level === 'city' && (
        <p className="text-xs text-gray-500">
          {existingCountry}
          {existingState ? ` / ${existingState}` : ''}
        </p>
      )}
    </div>
  );
};

export default LocationFixRow;
