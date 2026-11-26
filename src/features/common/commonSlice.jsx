import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSplitSessionActive: localStorage.getItem('splitSession') ? true : false,
  accessDenied: {
    show: false,
    message: null,
  },
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setSplitSession: (state, action) => {
      state.isSplitSessionActive = action.payload;
    },
    endSplitSession: state => {
      localStorage.removeItem('splitSession');
      state.isSplitSessionActive = false;
    },
    setAccessDenied: (state, action) => {
      state.accessDenied = {
        show: true,
        message: action.payload ?? null,
      };
    },
    clearAccessDenied: state => {
      state.accessDenied = { show: false, message: null };
    },
  },
});

export const { setSplitSession, endSplitSession, setAccessDenied, clearAccessDenied } = commonSlice.actions;
export default commonSlice.reducer;
