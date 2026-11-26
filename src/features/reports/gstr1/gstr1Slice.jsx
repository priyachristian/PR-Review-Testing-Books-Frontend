import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { gstr1Service } from './gstr1Service';

/**
 * Fetch GSTR-1 Summary
 */
export const fetchGstr1Summary = createAsyncThunk('gstr1/fetchSummary', gstr1Service.getGstr1Summary);

/**
 * GSTR-1 Slice
 * Stores full API response in state.data; no filtering. Component reads and manages structure.
 */
export const gstr1Slice = createSlice({
  name: 'gstr1',
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearGstr1Data: state => {
      state.data = {};
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGstr1Summary.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGstr1Summary.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.data ?? action.payload ?? {};
        state.error = null;
      })
      .addCase(fetchGstr1Summary.rejected, (state, action) => {
        const error = action.error || {};
        const isCanceled = error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.message === 'canceled' || action.meta?.aborted || error.isCanceled === true;

        if (isCanceled) {
          state.loading = false;
          return;
        }

        state.loading = false;
        state.error = error.message || 'Something went wrong';
        state.data = {};
      });
  },
});

export const gstr1SliceMethods = {
  fetchGstr1Summary,
};

export const { clearGstr1Data } = gstr1Slice.actions;

// Selectors
export const selectGstr1Data = state => state.gstr1.data;
export const selectGstr1Loading = state => state.gstr1.loading;
export const selectGstr1Error = state => state.gstr1.error;

export default gstr1Slice.reducer;
