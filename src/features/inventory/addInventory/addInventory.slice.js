import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { inventoryLogsService } from './addInventory.service';

const getInventoryLogs = createAsyncThunk('inventoryLogs/getInventoryLogs', inventoryLogsService.getInventoryLogs);

const inventoryLogsSlice = createSlice({
  name: 'inventoryLogs',
  initialState: {
    inventoryLogs: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetInventoryLogs: state => {
      state.inventoryLogs = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(getInventoryLogs.pending, state => {
      state.loading = true;
    });
    builder.addCase(getInventoryLogs.rejected, (state, action) => {
      if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
        state.loading = false;
        state.error = action.payload || action.error.message;
      }
    });
    builder.addCase(getInventoryLogs.fulfilled, (state, action) => {
      state.inventoryLogs = action.payload;
      state.loading = false;
    });
  },
});

export const { resetInventoryLogs } = inventoryLogsSlice.actions;
export default inventoryLogsSlice.reducer;
export const inventoryLogsSliceMethods = {
  getInventoryLogs,
};
