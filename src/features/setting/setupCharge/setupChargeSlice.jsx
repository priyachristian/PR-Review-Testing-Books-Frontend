import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { setupChargeService } from './setupChargeService';

const getCompany = createAsyncThunk('setupcharge/getCompany', setupChargeService.getCompany);

const createSetupCharge = createAsyncThunk('setupcharge/createSetupCharge', setupChargeService.createSetupCharge);

const updateSetupCharge = createAsyncThunk('setupcharge/updateSetupCharge', setupChargeService.updateSetupCharge);

const deleteSetupCharge = createAsyncThunk('setupcharge/deleteSetupCharge', setupChargeService.deleteSetupCharge);

export const setupChargeSlice = createSlice({
  name: 'setupcharge',
  initialState: {
    company: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCompany.pending, state => {
        state.loading = true;
      })
      .addCase(getCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.company = action.payload;
      })
      .addCase(getCompany.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          state.company = null;
          Toast.error(state.error);
        }
      })

      .addCase(createSetupCharge.pending, state => {
        state.loading = true;
      })
      .addCase(createSetupCharge.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSetupCharge.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })

      .addCase(updateSetupCharge.pending, state => {
        state.loading = true;
      })
      .addCase(updateSetupCharge.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateSetupCharge.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })

      .addCase(deleteSetupCharge.pending, state => {
        state.loading = true;
      })
      .addCase(deleteSetupCharge.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteSetupCharge.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const setupChargeSliceMethods = {
  createSetupCharge,
  updateSetupCharge,
  getCompany,
  deleteSetupCharge,
};
export default setupChargeSlice.reducer;
