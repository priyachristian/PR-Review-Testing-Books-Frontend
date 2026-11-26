import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from '@/features/common/location/useLocation';

function getRowId(row) {
  return row?._id || row?.id;
}

export function toLocationList(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function sameNames(current, next) {
  return current.length === next.length && current.every((name, index) => name === next[index]);
}

export function useMultiLocationFilters({ country, state, city, setFilter }) {
  const { countries, statesByCountryId, citiesByStateId, loading, getCountries, getStates, getCities } = useLocation();
  const isCountryApiCalled = useRef(false);

  const selectedCountries = useMemo(() => toLocationList(country), [country]);
  const selectedStates = useMemo(() => toLocationList(state), [state]);
  const selectedCities = useMemo(() => toLocationList(city), [city]);
  const countryKey = selectedCountries.join(',');
  const stateKey = selectedStates.join(',');

  const handleCountryFocus = useCallback(async () => {
    if (isCountryApiCalled.current) return;
    isCountryApiCalled.current = true;
    await getCountries();
  }, [getCountries]);

  useEffect(() => {
    if (!countryKey || isCountryApiCalled.current) return;
    isCountryApiCalled.current = true;
    getCountries();
  }, [countryKey, getCountries]);

  const selectedCountryIds = useMemo(() => {
    if (!countries.length || !selectedCountries.length) return [];
    const names = new Set(selectedCountries);
    return countries
      .filter(row => names.has(row.name))
      .map(row => String(getRowId(row) || ''))
      .filter(Boolean);
  }, [countries, selectedCountries]);

  const countryIdKey = selectedCountryIds.join(',');

  useEffect(() => {
    if (!countryIdKey) return;
    countryIdKey.split(',').forEach(id => getStates(id));
  }, [countryIdKey, getStates]);

  const stateRows = useMemo(() => {
    const rows = [];
    selectedCountryIds.forEach(id => {
      (statesByCountryId[id] || []).forEach(row => {
        if (row?.name) rows.push(row);
      });
    });
    return rows;
  }, [selectedCountryIds, statesByCountryId]);

  const statesReady =
    selectedCountries.length > 0 &&
    countries.length > 0 &&
    selectedCountryIds.length === selectedCountries.length &&
    selectedCountryIds.every(id => Object.prototype.hasOwnProperty.call(statesByCountryId, id));

  const selectedStateIds = useMemo(() => {
    if (!stateRows.length || !selectedStates.length) return [];
    const names = new Set(selectedStates);
    return stateRows
      .filter(row => names.has(row.name))
      .map(row => String(getRowId(row) || ''))
      .filter(Boolean);
  }, [stateRows, selectedStates]);

  const stateIdKey = selectedStateIds.join(',');

  useEffect(() => {
    if (!stateIdKey) return;
    stateIdKey.split(',').forEach(id => getCities(id));
  }, [stateIdKey, getCities]);

  const stateOptions = useMemo(() => {
    const seen = new Set();
    return stateRows
      .filter(row => {
        if (seen.has(row.name)) return false;
        seen.add(row.name);
        return true;
      })
      .map(row => ({ label: row.name, value: row.name }));
  }, [stateRows]);

  const countryOptions = useMemo(() => countries.map(row => ({ label: row.name, value: row.name })), [countries]);

  const cityOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    selectedStateIds.forEach(id => {
      (citiesByStateId[id] || []).forEach(row => {
        if (!row?.name || seen.has(row.name)) return;
        seen.add(row.name);
        options.push({ label: row.name, value: row.name });
      });
    });
    return options;
  }, [selectedStateIds, citiesByStateId]);

  const knownStateNames = useMemo(() => new Set(stateRows.map(row => row.name)), [stateRows]);
  const citiesReady =
    statesReady &&
    selectedStates.length > 0 &&
    selectedStates.every(name => knownStateNames.has(name)) &&
    selectedStateIds.length > 0 &&
    selectedStateIds.every(id => Object.prototype.hasOwnProperty.call(citiesByStateId, id));

  useEffect(() => {
    if (!countryKey) {
      if (!stateKey && !selectedCities.length) return;
      setFilter(prev => {
        if (!toLocationList(prev.state).length && !toLocationList(prev.city).length) return prev;
        return { ...prev, state: '', city: '' };
      });
      return;
    }

    if (!statesReady) return;
    const nextStates = selectedStates.filter(name => knownStateNames.has(name));
    if (sameNames(selectedStates, nextStates)) return;
    setFilter(prev => ({ ...prev, state: nextStates.length ? nextStates : '' }));
  }, [countryKey, stateKey, selectedStates, selectedCities.length, statesReady, knownStateNames, setFilter]);

  useEffect(() => {
    if (!stateKey) {
      if (!selectedCities.length) return;
      setFilter(prev => (toLocationList(prev.city).length ? { ...prev, city: '' } : prev));
      return;
    }

    if (!citiesReady) return;
    const validCities = new Set(cityOptions.map(option => option.value));
    const nextCities = selectedCities.filter(name => validCities.has(name));
    if (sameNames(selectedCities, nextCities)) return;
    setFilter(prev => ({ ...prev, city: nextCities.length ? nextCities : '' }));
  }, [stateKey, selectedCities, citiesReady, cityOptions, setFilter]);

  return {
    countryOptions,
    stateOptions,
    cityOptions,
    stateDisabled: selectedCountries.length === 0,
    cityDisabled: selectedStates.length === 0,
    countriesLoading: !!loading.countries,
    statesLoading: selectedCountryIds.some(id => loading.statesByCountryId[id]),
    citiesLoading: selectedStateIds.some(id => loading.citiesByStateId[id]),
    handleCountryFocus,
  };
}
