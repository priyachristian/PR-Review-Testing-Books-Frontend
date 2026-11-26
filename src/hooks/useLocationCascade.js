import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useLocation } from '@/features/common/location/useLocation';

function fieldPath(prefix, field) {
  return prefix ? `${prefix}.${field}` : field;
}

function getRowId(row) {
  return row?._id || row?.id;
}

export function useLocationCascade({ country, state, fieldPathPrefix = '', setFieldValue }) {
  const p = useCallback(f => fieldPath(fieldPathPrefix, f), [fieldPathPrefix]);
  const { countries, statesByCountryId, citiesByStateId, loading, getCountries, getStates, getCities } = useLocation();

  const isCountryApiCalled = useRef(false);

  const handleCountryFocus = useCallback(async () => {
    if (isCountryApiCalled.current) return;

    isCountryApiCalled.current = true;

    await getCountries();
  }, [getCountries]);

  // In edit/pre-fill mode the country is already set before the user ever
  // focuses the dropdown, so handleCountryFocus never fires.  Kick off the
  // load here so that the state → city cascade can resolve.
  useEffect(() => {
    if (country && !isCountryApiCalled.current) {
      isCountryApiCalled.current = true;
      getCountries();
    }
  }, [country, getCountries]);

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

  // Fetch states when country selection changes
  useEffect(() => {
    if (!selectedCountryId) return;
    getStates(selectedCountryId);
  }, [selectedCountryId]);

  // Fetch cities when state selection changes
  useEffect(() => {
    if (!selectedStateId) return;
    getCities(selectedStateId);
  }, [selectedStateId]);

  const countryOptions = useMemo(() => countries.map(c => ({ label: c.name, value: c.name })), [countries]);
  const stateOptions = useMemo(() => states.map(s => ({ label: s.name, value: s.name })), [states]);
  const cityOptions = useMemo(() => cities.map(c => ({ label: c.name, value: c.name })), [cities]);

  const stateDisabled = !country;
  const cityDisabled = !country || !state;

  const onCountryChange = useCallback(
    val => {
      const name = val || null;
      setFieldValue(p('country'), name, false);
      setFieldValue(p('state'), null, false);
      setFieldValue(p('city'), '', false);
    },
    [setFieldValue, p]
  );

  const onStateChange = useCallback(
    val => {
      const name = val || null;
      setFieldValue(p('state'), name, false);
      setFieldValue(p('city'), '', false);
    },
    [setFieldValue, p]
  );

  const onCityChange = useCallback(
    val => {
      const v = val || '';
      setFieldValue(p('city'), v, false);
    },
    [setFieldValue, p]
  );

  return {
    countryOptions,
    stateOptions,
    cityOptions,
    stateDisabled,
    cityDisabled,
    countriesLoading: !!loading.countries,
    statesLoading: !!loading.statesByCountryId[selectedCountryId],
    citiesLoading: !!loading.citiesByStateId[selectedStateId],
    handleCountryFocus,
    onCountryChange,
    onStateChange,
    onCityChange,
  };
}
