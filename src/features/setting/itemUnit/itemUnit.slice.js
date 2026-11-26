import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { itemUnitService } from './itemUnit.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemUnits = createAsyncThunk('itemUnit/getItemUnits', itemUnitService.getItemUnits);
const getItemUnitsDrop = createAsyncThunk('itemUnit/getItemUnitsDrop', itemUnitService.getItemUnitsDrop);

const createItemUnit = createAsyncThunk('itemUnit/createItemUnit', async (data, { rejectWithValue }) => {
  try {
    return await itemUnitService.createItemUnit(data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateItemUnit = createAsyncThunk('itemUnit/updateItemUnit', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await itemUnitService.updateItemUnit(id, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

export const itemUnitSlice = createSlice({
  name: 'itemUnit',
  initialState: {
    itemUnits: [],
    itemUnitsDrop: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    loading: false,
    dropLoading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetItemUnit: state => {
      state.itemUnits = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.error = null;
    },
    resetItemUnitsDrop: state => {
      state.itemUnitsDrop = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItemUnits.pending, state => {
        state.loading = true;
      })
      .addCase(getItemUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.itemUnits = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getItemUnits.rejected, (state, action) => {
        // Keep the list intact on an aborted request (fast tab/search switches) so it does not flash empty.
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.loading = false;
          state.itemUnits = [];
          state.error = action.error.message;
        }
      })
      .addCase(getItemUnitsDrop.pending, state => {
        state.dropLoading = true;
      })
      .addCase(getItemUnitsDrop.fulfilled, (state, action) => {
        state.dropLoading = false;
        state.itemUnitsDrop = action.payload.data?.result || [];
      })
      .addCase(getItemUnitsDrop.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.dropLoading = false;
          state.itemUnitsDrop = [];
          state.error = action.error.message;
        }
      })
      .addCase(createItemUnit.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createItemUnit.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(createItemUnit.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updateItemUnit.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateItemUnit.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(updateItemUnit.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      });
  },
});

export const itemUnitSliceMethods = {
  getItemUnits,
  getItemUnitsDrop,
  createItemUnit,
  updateItemUnit,
};
export const { resetItemUnit, resetItemUnitsDrop } = itemUnitSlice.actions;
export default itemUnitSlice.reducer;
