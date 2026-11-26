import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { manPowerConfigService } from './manPower.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getWorker = createAsyncThunk('manPowerConfig/getWorker', manPowerConfigService.getWorker);

const getWorkerDropdown = createAsyncThunk('manPowerConfig/getWorkerDropdown', manPowerConfigService.getWorkerDropdown);

const createWorker = createAsyncThunk('manPowerConfig/createWorker', manPowerConfigService.createWorker);

const updateWorker = createAsyncThunk('manPowerConfig/updateWorker', manPowerConfigService.updateWorker);

const deleteWorker = createAsyncThunk('manPowerConfig/deleteWorker', manPowerConfigService.deleteWorker);

export const manPowerConfigSliceMethods = {
  getWorker,
  getWorkerDropdown,
  createWorker,
  updateWorker,
  deleteWorker,
};

export const manPowerConfigSlice = createSlice({
  name: 'manPowerConfig',
  initialState: {
    worker: [],
    workerDropdown: [],
    createWorkers: null,
    update: null,
    saveLoading: false,
    loading: false,
    dropdownLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
  },
  reducers: {
    resetWorkerList: state => {
      state.worker = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getWorker.pending, state => {
        state.loading = true;
      })
      .addCase(getWorker.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.worker = action.payload.data;
      })
      .addCase(getWorker.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          state.worker = null;
          Toast.error(state.error);
        }
      })
      .addCase(getWorkerDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getWorkerDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.workerDropdown = action.payload.data;
      })
      .addCase(getWorkerDropdown.rejected, (state, action) => {
        state.dropdownLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          state.workerDropdown = null;
          Toast.error(state.error);
        }
      })
      .addCase(createWorker.pending, state => {
        state.saveLoading = true;
      })
      .addCase(createWorker.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.createWorkers = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createWorker.rejected, (state, action) => {
        state.saveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateWorker.pending, state => {
        state.saveLoading = true;
      })
      .addCase(updateWorker.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateWorker.rejected, (state, action) => {
        state.saveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteWorker.fulfilled, (state, action) => {
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteWorker.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const { resetWorkerList } = manPowerConfigSlice.actions;
export default manPowerConfigSlice.reducer;
