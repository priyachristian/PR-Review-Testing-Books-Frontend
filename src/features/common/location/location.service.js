import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const statesByCountryId = new Map();
const citiesByStateId = new Map();

function unwrapList(res) {
  const list = res.data?.data;
  return Array.isArray(list) ? list : [];
}

let countriesCache;
let countriesPromise;

const loadCountries = async () => {
  if (countriesCache) return countriesCache;
  if (countriesPromise) return countriesPromise;

  countriesPromise = (async () => {
    const res = await axiosConfig.get(API_ROUTES.ABSS_ADMIN_PUBLIC.COUNTRIES);
    const list = unwrapList(res);
    countriesCache = list;
    return list;
  })().finally(() => {
    countriesPromise = null;
  });

  return countriesPromise;
};

const getStates = async countryId => {
  if (!countryId) return [];
  const key = String(countryId);
  if (statesByCountryId.has(key)) return statesByCountryId.get(key);

  const res = await axiosConfig.get(API_ROUTES.ABSS_ADMIN_PUBLIC.STATES, {
    params: { countryId: key },
  });
  const list = unwrapList(res);
  statesByCountryId.set(key, list);
  return list;
};

const getCities = async stateId => {
  if (!stateId) return [];
  const key = String(stateId);
  if (citiesByStateId.has(key)) return citiesByStateId.get(key);

  const res = await axiosConfig.get(API_ROUTES.ABSS_ADMIN_PUBLIC.CITIES, {
    params: { stateId: key },
  });
  const list = unwrapList(res);
  citiesByStateId.set(key, list);
  return list;
};

const fetchStatesByCountryIso = async isoCode => {
  if (!isoCode) return [];
  const countries = await loadCountries();
  const country = countries.find(c => c.isoCode === isoCode);
  const id = country?._id || country?.id;
  if (!id) return [];
  return getStates(id);
};

export function clearLocationServiceCaches() {
  countriesCache = undefined;
  countriesPromise = null;
  statesByCountryId.clear();
  citiesByStateId.clear();
}

export const locationService = {
  getCountries: withErrorHandling(loadCountries, 'location.getCountries'),
  getStates: withErrorHandling(getStates, 'location.getStates'),
  getCities: withErrorHandling(getCities, 'location.getCities'),
  fetchStatesByCountryIso: withErrorHandling(fetchStatesByCountryIso, 'location.fetchStatesByCountryIso'),
};
