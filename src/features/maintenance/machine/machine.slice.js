import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { machineService } from './machine.service';

const getMachines = createAsyncThunk('machine/getMachines', machineService.getMachines);

const getMachineById = createAsyncThunk('machine/getMachineById', machineService.getMachineById);

const getMachineDropdown = createAsyncThunk('machine/getMachineDropdown', machineService.getMachineDropdown);

const createMachine = createAsyncThunk('machine/createMachine', machineService.createMachine);

const updateMachine = createAsyncThunk('machine/updateMachine', machineService.updateMachine);

const deleteMachine = createAsyncThunk('machine/deleteMachine', machineService.deleteMachine);

const updateMachineStatus = createAsyncThunk('machine/updateMachineStatus', machineService.updateMachineStatus);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  totalActiveMachines: 0,
  totalCriticalityA: 0,
  totalUnderAMC: 0,
};

export const machineSlice = createSlice({
  name: 'machine',
  initialState: {
    machines: [],
    machine: null,
    machineDropdown: [],
    loading: false,
    detailLoading: false,
    dropdownLoading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetMachine: state => {
      state.machines = [];
      state.error = null;
      state.pagination = initialPagination;
    },
    resetMachineDropdown: state => {
      state.machineDropdown = [];
      state.error = null;
    },
    resetMachineDetail: state => {
      state.machine = null;
      state.detailLoading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMachines.pending, state => {
        state.loading = true;
      })
      .addCase(getMachines.fulfilled, (state, action) => {
        state.loading = false;
        state.machines = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
          totalActiveMachines: action.payload?.extras?.totalActiveMachines ?? 0,
          totalCriticalityA: action.payload?.extras?.totalCriticalityA ?? 0,
          totalUnderAMC: action.payload?.extras?.totalUnderAMC ?? 0,
        };
      })
      .addCase(getMachines.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.machines = [];
          state.error = action.error.message;
        }
      })
      .addCase(getMachineById.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getMachineById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.machine = action.payload?.data || null;
      })
      .addCase(getMachineById.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.detailLoading = false;
          state.machine = null;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Unable to load machine');
        }
      })
      .addCase(getMachineDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getMachineDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.machineDropdown = action.payload?.data || [];
      })
      .addCase(getMachineDropdown.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.dropdownLoading = false;
          state.machineDropdown = [];
          state.error = action.error.message;
        }
      })
      .addCase(createMachine.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createMachine.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Machine created successfully');
      })
      .addCase(createMachine.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Something went wrong');
      })
      .addCase(updateMachine.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateMachine.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Machine updated successfully');
      })
      .addCase(updateMachine.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Something went wrong');
      })
      .addCase(deleteMachine.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteMachine.fulfilled, (state, action) => {
        state.deleteLoading = false;
        Toast.success(action.payload?.message || 'Machine deleted successfully');
      })
      .addCase(deleteMachine.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.deleteLoading = false;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Something went wrong');
        }
      })
      .addCase(updateMachineStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateMachineStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Machine status updated successfully');
      })
      .addCase(updateMachineStatus.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Something went wrong');
        }
      });
  },
});

export const machineSliceMethods = {
  getMachines,
  getMachineById,
  getMachineDropdown,
  createMachine,
  updateMachine,
  deleteMachine,
  updateMachineStatus,
};

export const { resetMachine, resetMachineDropdown, resetMachineDetail } = machineSlice.actions;
export default machineSlice.reducer;
