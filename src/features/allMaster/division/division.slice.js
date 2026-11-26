import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
// import { createDiv, delDivision, fetchDivision, updateDiv } from "./divisionService";
import Toast from '@/components/ui/common/Toast';
import { divisionService } from './division.service';

const getDivision = createAsyncThunk('division/getDivision', divisionService.getDivision);

const deleteDivision = createAsyncThunk('division/deleteDivision', divisionService.deleteDivision);

const createDivision = createAsyncThunk('division/createDivision', divisionService.createDivision);

const updateDivision = createAsyncThunk('division/updateDivision', divisionService.updateDivision);

const getDivisionById = createAsyncThunk('division/getDivisionById', divisionService.getDivisionById);

const toggleDivisionStatus = createAsyncThunk('division/toggleDivisionStatus', divisionService.toggleDivisionStatus);

export const divisionSlice = createSlice({
  name: 'division',
  initialState: {
    division: [],
    singleDivision: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    delete: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    resetDivision: state => {
      state.singleDivision = null;
    },
    resetDivisionList: state => {
      state.division = [];
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
      .addCase(getDivision.pending, state => {
        state.loading = true;
      })
      .addCase(getDivision.fulfilled, (state, action) => {
        state.loading = false;
        state.division = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload;
      })
      .addCase(getDivision.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.division = [];
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(deleteDivision.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteDivision.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.delete = action.payload.result;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteDivision.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createDivision.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createDivision.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload.result;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createDivision.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateDivision.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateDivision.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload.result;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateDivision.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getDivisionById.pending, state => {
        state.loading = true;
      })
      .addCase(getDivisionById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleDivision = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getDivisionById.rejected, (state, action) => {
        state.loading = false;
        state.singleDivision = null;
        state.error = action.error.message;
      })
      .addCase(toggleDivisionStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleDivisionStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleDivisionStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export default divisionSlice.reducer;
export const { resetDivision, resetDivisionList } = divisionSlice.actions;
export const divisionSliceMethods = {
  getDivision,
  deleteDivision,
  createDivision,
  updateDivision,
  getDivisionById,
  toggleDivisionStatus,
};
