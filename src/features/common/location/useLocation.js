import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { locationSliceMethods } from './location.slice';

export const useLocation = () => {
  const dispatch = useDispatch();
  const location = useSelector(state => state.location);

  const getCountries = useCallback(async () => dispatch(locationSliceMethods.getCountries()).unwrap(), [dispatch]);

  const getStates = useCallback(async countryId => dispatch(locationSliceMethods.getStates(countryId)).unwrap(), [dispatch]);

  const getCities = useCallback(async stateId => dispatch(locationSliceMethods.getCities(stateId)).unwrap(), [dispatch]);

  const fetchStatesByCountryIso = useCallback(async isoCode => dispatch(locationSliceMethods.fetchStatesByCountryIso(isoCode)).unwrap(), [dispatch]);

  return {
    ...location,
    getCountries,
    getStates,
    getCities,
    fetchStatesByCountryIso,
  };
};
