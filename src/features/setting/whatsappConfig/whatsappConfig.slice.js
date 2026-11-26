import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { whatsappConfigService } from './whatsappConfig.service';
import { normalizeAdminPhoneNumbers } from './whatsappConfig.schema';

const normalizeTemplate = template => {
  if (!template || typeof template !== 'object') return template;
  return {
    ...template,
    adminPhoneNumber: normalizeAdminPhoneNumbers(template.adminPhoneNumber),
  };
};

const normalizeWhatsappConfig = raw => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    templates: Array.isArray(raw.templates) ? raw.templates.map(normalizeTemplate) : [],
  };
};

const extractWhatsappPayload = payload => payload?.data?.whatsapp || payload?.data?.adminSummarySetting?.whatsapp || payload?.whatsapp || null;

const extractLastSummary = payload => payload?.data?.lastSummary || payload?.lastSummary || null;

const extractRecipientsLimit = payload => payload?.data?.whatsappRecipientsLimit || payload?.whatsappRecipientsLimit || null;

const withMeta = (config, lastSummary, recipientsLimit) => (config ? { ...config, lastSummary: lastSummary || null, recipientsLimit: recipientsLimit || null } : config);

const getWhatsappConfig = createAsyncThunk('whatsappConfig/getWhatsappConfig', whatsappConfigService.getWhatsappConfig);

const updateWhatsappConfig = createAsyncThunk('whatsappConfig/updateWhatsappConfig', whatsappConfigService.updateWhatsappConfig);

export const whatsappConfigSliceMethods = {
  getWhatsappConfig,
  updateWhatsappConfig,
};

export const whatsappConfigSlice = createSlice({
  name: 'whatsappConfig',
  initialState: {
    whatsappConfig: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    resetWhatsappConfig: state => {
      state.whatsappConfig = null;
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getWhatsappConfig.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWhatsappConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.whatsappConfig = withMeta(normalizeWhatsappConfig(extractWhatsappPayload(action.payload)), extractLastSummary(action.payload), extractRecipientsLimit(action.payload));
      })
      .addCase(getWhatsappConfig.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateWhatsappConfig.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateWhatsappConfig.fulfilled, (state, action) => {
        state.saving = false;
        // The update response doesn't necessarily carry lastSummary/recipientsLimit — keep what's already in state.
        const priorLastSummary = state.whatsappConfig?.lastSummary || null;
        const priorRecipientsLimit = state.whatsappConfig?.recipientsLimit || null;
        const fromResponse = normalizeWhatsappConfig(extractWhatsappPayload(action.payload));
        const next = fromResponse || (action.meta.arg?.whatsapp ? normalizeWhatsappConfig(action.meta.arg.whatsapp) : null);
        if (next) {
          state.whatsappConfig = withMeta(next, priorLastSummary, extractRecipientsLimit(action.payload) || priorRecipientsLimit);
        }
        Toast.success(action.payload?.message || 'WhatsApp configuration updated successfully');
      })
      .addCase(updateWhatsappConfig.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error?.message;
          Toast.error(state.error || 'Failed to update WhatsApp configuration');
        }
      });
  },
});

export const { resetWhatsappConfig } = whatsappConfigSlice.actions;
export default whatsappConfigSlice.reducer;
