import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { processService } from './process.service';

const getProcesses = createAsyncThunk('process/getProcesses', processService.getProcesses);

const addProcess = createAsyncThunk('process/addProcess', processService.addProcess);

const updateProcess = createAsyncThunk('process/updateProcess', processService.updateProcess);

const getProcessDropdown = createAsyncThunk('process/getProcessDropdown', processService.getProcessDropdown);

const deleteProcess = createAsyncThunk('process/deleteProcess', processService.deleteProcess);

export const processSlice = createSlice({
  name: 'process',
  initialState: {
    processes: [],
    processDrop: null,
    loading: false,
    submitLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
  },
  reducers: {
    resetProcess: state => {
      state.processes = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetProcessDrop: state => {
      state.processDrop = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProcesses.pending, state => {
        state.loading = true;
      })
      .addCase(getProcesses.fulfilled, (state, action) => {
        state.loading = false;
        state.processes = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getProcesses.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.processes = [];
          state.error = action.error.message;
        }
      })
      .addCase(addProcess.pending, state => {
        state.submitLoading = true;
      })
      .addCase(addProcess.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload.message);
      })
      .addCase(addProcess.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateProcess.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateProcess.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload.message);
      })
      .addCase(updateProcess.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getProcessDropdown.pending, state => {
        state.loading = true;
      })
      .addCase(getProcessDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.processDrop = action.payload.data;
      })
      .addCase(getProcessDropdown.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.processDrop = null;
          state.error = action.error.message;
        }
      })
      .addCase(deleteProcess.fulfilled, (_, action) => {
        Toast.success(action.payload.message);
      })
      .addCase(deleteProcess.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const processSliceMethods = {
  getProcesses,
  addProcess,
  updateProcess,
  getProcessDropdown,
  deleteProcess,
};
export const { resetProcess, resetProcessDrop } = processSlice.actions;
export default processSlice.reducer;
