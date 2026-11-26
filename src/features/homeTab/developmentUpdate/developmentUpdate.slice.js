import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { developmentUpdateService } from './developmentUpdate.service';

const getDevelopmentUpdate = createAsyncThunk('developmentUpdate/getDevelopmentUpdate', developmentUpdateService.getDevelopmentUpdate);

export const developmentUpdateSlice = createSlice({
  name: 'developmentUpdate',
  initialState: {
    developmentUpdate: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetDevelopmentUpdate: state => {
      state.developmentUpdate = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getDevelopmentUpdate.pending, state => {
        state.loading = true;
      })
      .addCase(getDevelopmentUpdate.fulfilled, (state, action) => {
        state.loading = false;
        state.developmentUpdate = action.payload.data;
      })
      .addCase(getDevelopmentUpdate.rejected, state => {
        state.loading = false;
        state.developmentUpdate = null;
      });
  },
});
export const { resetDevelopmentUpdate } = developmentUpdateSlice.actions;

export default developmentUpdateSlice.reducer;

export const developmentUpdateSliceMethods = {
  getDevelopmentUpdate,
};
