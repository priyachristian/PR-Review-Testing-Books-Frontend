import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { locationService } from './location.service';

const getCountries = createAsyncThunk('location/getCountries', locationService.getCountries, {
  condition: (_, { getState }) => {
    const { location } = getState();
    if (location.countries.length > 0) return false;
    if (location.loading.countries) return false;
    return true;
  },
});

const getStates = createAsyncThunk('location/getStates', locationService.getStates, {
  condition: (countryId, { getState }) => {
    const key = String(countryId || '');
    if (!key) return false;
    const { location } = getState();
    if (key in location.statesByCountryId) return false;
    if (location.loading.statesByCountryId[key]) return false;
    return true;
  },
});

const getCities = createAsyncThunk('location/getCities', locationService.getCities, {
  condition: (stateId, { getState }) => {
    const key = String(stateId || '');
    if (!key) return false;
    const { location } = getState();
    if (key in location.citiesByStateId) return false;
    if (location.loading.citiesByStateId[key]) return false;
    return true;
  },
});
const fetchStatesByCountryIso = createAsyncThunk('location/fetchStatesByCountryIso', locationService.fetchStatesByCountryIso);

const initialState = {
  countries: [],
  statesByCountryId: {},
  citiesByStateId: {},
  loading: {
    countries: false,
    statesByCountryId: {},
    citiesByStateId: {},
    statesByIsoCode: {},
  },
  statesByIsoCode: {},
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearLocationError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getCountries.pending, state => {
        state.loading.countries = true;
      })
      .addCase(getCountries.fulfilled, (state, action) => {
        state.loading.countries = false;
        state.countries = action.payload || [];
      })
      .addCase(getCountries.rejected, (state, action) => {
        state.loading.countries = false;
        state.error = action.error?.message || null;
        state.countries = [];
      })
      .addCase(getStates.pending, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) state.loading.statesByCountryId[key] = true;
      })
      .addCase(getStates.fulfilled, (state, action) => {
        const key = String(action.meta.arg || '');
        if (!key) return;
        state.loading.statesByCountryId[key] = false;
        state.statesByCountryId[key] = action.payload || [];
      })
      .addCase(getStates.rejected, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) {
          state.loading.statesByCountryId[key] = false;
          state.statesByCountryId[key] = [];
        }
        state.error = action.error?.message || null;
      })
      .addCase(getCities.pending, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) state.loading.citiesByStateId[key] = true;
      })
      .addCase(getCities.fulfilled, (state, action) => {
        const key = String(action.meta.arg || '');
        if (!key) return;
        state.loading.citiesByStateId[key] = false;
        state.citiesByStateId[key] = action.payload || [];
      })
      .addCase(getCities.rejected, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) {
          state.loading.citiesByStateId[key] = false;
          state.citiesByStateId[key] = [];
        }
        state.error = action.error?.message || null;
      })
      .addCase(fetchStatesByCountryIso.pending, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) state.loading.statesByIsoCode[key] = true;
      })
      .addCase(fetchStatesByCountryIso.fulfilled, (state, action) => {
        const key = String(action.meta.arg || '');
        if (!key) return;
        state.loading.statesByIsoCode[key] = false;
        state.statesByIsoCode[key] = action.payload || [];
      })
      .addCase(fetchStatesByCountryIso.rejected, (state, action) => {
        const key = String(action.meta.arg || '');
        if (key) {
          state.loading.statesByIsoCode[key] = false;
          state.statesByIsoCode[key] = [];
        }
        state.error = action.error?.message || null;
      });
  },
});

export const locationSliceMethods = {
  getCountries,
  getStates,
  getCities,
  fetchStatesByCountryIso,
};

export const { clearLocationError } = locationSlice.actions;
export default locationSlice.reducer;
