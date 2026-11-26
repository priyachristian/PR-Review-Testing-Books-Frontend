import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { qualityService } from './quality.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getQuality = createAsyncThunk('quality/getQuality', qualityService.getQuality);

const createQuality = createAsyncThunk('quality/createQuality', qualityService.createQuality);

const updateQuality = createAsyncThunk('quality/updateQuality', qualityService.updateQuality);

const getQualityById = createAsyncThunk('quality/getQualityById', qualityService.getQualityById);

const deleteQuality = createAsyncThunk('quality/deleteQuality', qualityService.deleteQuality);

export const qualitySlice = createSlice({
  name: 'quality',
  initialState: {
    quality: [],
    singleQuality: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    customeTests: [],
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    addCustomerTests: (state, action) => {
      if (!state.customeTests) {
        state.customeTests = [];
      }
      state.customeTests.push(action.payload);
    },
    deleteCustomerTests: (state, action) => {
      state.customeTests.splice(action.payload, 1);
    },
    setCustomeTests: (state, action) => {
      state.customeTests = action.payload;
    },
    resetCustomerTests: state => {
      state.customeTests = [];
    },
    resetQuality: state => {
      state.singleQuality = null;
    },
    resetQualityList: state => {
      state.quality = [];
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
      .addCase(getQuality.pending, state => {
        state.loading = true;
      })
      .addCase(getQuality.fulfilled, (state, action) => {
        state.loading = false;
        state.quality = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getQuality.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.quality = [];
          state.error = action.error.message;
        }
      })
      .addCase(createQuality.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createQuality.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createQuality.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateQuality.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateQuality.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateQuality.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })

      .addCase(getQualityById.pending, state => {
        state.loading = true;
      })
      .addCase(getQualityById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleQuality = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getQualityById.rejected, (state, action) => {
        state.loading = false;
        state.singleQuality = null;
        state.error = action.error.message;
      })
      .addCase(deleteQuality.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteQuality.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteQuality.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const qualitySliceMethods = {
  getQuality,
  createQuality,
  updateQuality,
  getQualityById,
  deleteQuality,
};
export const { addCustomerTests, deleteCustomerTests, resetCustomerTests, setCustomeTests, resetQuality, resetQualityList } = qualitySlice.actions;
export default qualitySlice.reducer;
