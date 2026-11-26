import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { problemListService } from './problemList.service';

const getProblemList = createAsyncThunk('problemList/getProblemList', problemListService.getProblemList);
const getProblemListById = createAsyncThunk('problemList/getProblemListById', problemListService.getProblemListById);

const createProblemList = createAsyncThunk('problemList/createProblemList', async (data, { rejectWithValue }) => {
  try {
    return await problemListService.createProblemList(data);
  } catch (error) {
    return rejectWithValue(typeof error === 'string' ? { message: error } : error?.response?.data || { message: error?.message || 'Something went wrong' });
  }
});

const updateProblemList = createAsyncThunk('problemList/updateProblemList', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await problemListService.updateProblemList({ id, data });
  } catch (error) {
    return rejectWithValue(typeof error === 'string' ? { message: error } : error?.response?.data || { message: error?.message || 'Something went wrong' });
  }
});

const deleteProblemList = createAsyncThunk('problemList/deleteProblemList', async (payload, { rejectWithValue }) => {
  try {
    return await problemListService.deleteProblemList(payload);
  } catch (error) {
    return rejectWithValue(typeof error === 'string' ? { message: error } : error?.response?.data || { message: error?.message || 'Something went wrong' });
  }
});

export const problemListSlice = createSlice({
  name: 'problemList',
  initialState: {
    tree: [],
    problem: null,
    create: null,
    update: null,
    remove: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    resetProblemList: state => {
      state.tree = [];
      state.problem = null;
      state.create = null;
      state.update = null;
      state.remove = null;
      state.error = null;
      state.message = null;
    },
    resetProblemDetail: state => {
      state.problem = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProblemList.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProblemList.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload?.data || [];
      })
      .addCase(getProblemList.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        state.tree = [];
        state.error = action.error.message;
        Toast.error(state.error);
      })
      .addCase(getProblemListById.pending, state => {
        state.loading = true;
      })
      .addCase(getProblemListById.fulfilled, (state, action) => {
        state.loading = false;
        state.problem = action.payload?.data || null;
      })
      .addCase(getProblemListById.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        state.problem = null;
        state.error = action.error.message;
      })
      .addCase(createProblemList.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createProblemList.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload?.message;
        Toast.success(state.message || 'Problem created successfully');
      })
      .addCase(createProblemList.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action.payload?.message || 'Something went wrong');
      })
      .addCase(updateProblemList.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateProblemList.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload?.message;
        Toast.success(state.message || 'Problem updated successfully');
      })
      .addCase(updateProblemList.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action.payload?.message || 'Something went wrong');
      })
      .addCase(deleteProblemList.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteProblemList.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload;
        Toast.success(action.payload?.message || 'Problem deleted successfully');
      })
      .addCase(deleteProblemList.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
        Toast.error(action.payload?.message || 'Something went wrong');
      });
  },
});

export const problemListSliceMethods = {
  getProblemList,
  getProblemListById,
  createProblemList,
  updateProblemList,
  deleteProblemList,
};

export const { resetProblemList, resetProblemDetail } = problemListSlice.actions;
export default problemListSlice.reducer;
