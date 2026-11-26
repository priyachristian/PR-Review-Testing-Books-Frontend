import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { quotationConfigService } from './quotationConfig.service';

const getQuotationConfig = createAsyncThunk('quotationConfig/getQuotationConfig', quotationConfigService.getQuotationConfig);

const updateQuotationConfig = createAsyncThunk('quotationConfig/updateQuotationConfig', quotationConfigService.updateQuotationConfig);

export const quotationConfigSliceMethods = {
  getQuotationConfig,
  updateQuotationConfig,
};

export const quotationConfigSlice = createSlice({
  name: 'quotationConfig',
  initialState: {
    quotationConfig: null,
    quoteCloseReasons: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    resetQuotationConfig: state => {
      state.quotationConfig = null;
      state.quoteCloseReasons = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getQuotationConfig.pending, state => {
        state.loading = true;
        state.error = null;
        state.quoteCloseReasons = [];
      })
      .addCase(getQuotationConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.quotationConfig = action.payload?.data?.quotationConfig || null;
        const reasons = action.payload?.data?.quotationConfig?.quoteCloseReasons || [];
        state.quoteCloseReasons = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
      })
      .addCase(getQuotationConfig.rejected, (state, action) => {
        state.loading = false;
        state.quoteCloseReasons = [];

        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateQuotationConfig.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateQuotationConfig.fulfilled, (state, action) => {
        state.saving = false;
        const qc = action.payload?.data?.quotationConfig;
        if (qc) {
          state.quotationConfig = qc;
          const reasons = qc.quoteCloseReasons || [];
          state.quoteCloseReasons = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
        } else if (Array.isArray(action.meta.arg?.quoteCloseReasons)) {
          state.quoteCloseReasons = action.meta.arg.quoteCloseReasons.filter(Boolean);
        }
        Toast.success(action.payload?.message || 'Quotation configuration updated successfully');
      })
      .addCase(updateQuotationConfig.rejected, (state, action) => {
        state.saving = false;
        const msg = action.error?.message;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = msg;
          Toast.error(msg || 'Failed to update quotation configuration');
        }
      });
  },
});

export const { resetQuotationConfig } = quotationConfigSlice.actions;
export default quotationConfigSlice.reducer;
