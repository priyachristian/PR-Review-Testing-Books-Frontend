import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { sidebarService } from './sidebarService';

const getSidebar = createAsyncThunk('sidebar/getSidebar', sidebarService.getSidebar);

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: {
    sidebarDrop: [],
    sideloading: true,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getSidebar.pending, state => {
        state.sideloading = true;
      })
      .addCase(getSidebar.fulfilled, (state, action) => {
        state.sideloading = false;
        state.sidebarDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSidebar.rejected, (state, action) => {
        state.sideloading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const sidebarSliceMethods = { getSidebar };
export default sidebarSlice.reducer;
