import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { priceListService } from './priceList.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPriceList = createAsyncThunk('priceList/getPriceList', priceListService.getPriceList);

const createPriceList = createAsyncThunk('priceList/createPriceList', priceListService.createPriceList);

const updatePriceList = createAsyncThunk('priceList/updatePriceList', priceListService.updatePriceList);

const deletePriceData = createAsyncThunk('priceList/deletePriceData', priceListService.deletePriceData);

const getPriceListById = createAsyncThunk('priceList/getPriceListById', priceListService.getPriceListById);

const getPriceListDropdown = createAsyncThunk('priceList/getPriceListDropdown', priceListService.getPriceListDropdown);

export const priceListSlice = createSlice({
  name: 'priceList',
  initialState: {
    priceLists: [],
    priceList: null,
    priceListDrop: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    clearPrices: state => {
      state.prices = [];
    },
    resetPriceList: state => {
      state.priceList = null;
    },
    resetPriceListList: state => {
      state.priceLists = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetPriceListDrop: state => {
      state.priceListDrop = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getPriceList.pending, state => {
        state.loading = true;
      })
      .addCase(getPriceList.fulfilled, (state, action) => {
        state.loading = false;
        state.priceLists = action.payload;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getPriceList.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.priceLists = [];
          state.error = action.error.message;
        }
      })
      .addCase(createPriceList.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createPriceList.fulfilled, state => {
        state.submitLoading = false;
        // state.prices.push(action.payload);
        Toast.success('Price list created successfully');
      })
      .addCase(createPriceList.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updatePriceList.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updatePriceList.fulfilled, state => {
        state.submitLoading = false;
        // const index = state.prices.findIndex(price => price.id === action.payload.id);
        // if (index !== -1) {
        //   state.prices[index] = action.payload;
        // }
        Toast.success('Price updated successfully');
      })
      .addCase(updatePriceList.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deletePriceData.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deletePriceData.fulfilled, (state, action) => {
        state.deleteLoading = false;
        if (state.priceLists?.data) {
          state.priceLists.data = state.priceLists.data.filter(price => price.id !== action.meta.arg.priceListId);
        }
        Toast.success(action.payload.message || 'Price list deleted successfully');
      })
      .addCase(deletePriceData.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPriceListById.pending, state => {
        state.loading = true;
      })
      .addCase(getPriceListById.fulfilled, (state, action) => {
        state.loading = false;
        state.priceList = action.payload.data;
      })
      .addCase(getPriceListById.rejected, (state, action) => {
        state.loading = false;
        state.priceList = null;
        state.error = action.error.message;
      })
      .addCase(getPriceListDropdown.pending, state => {
        state.loading = true;
      })
      .addCase(getPriceListDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.priceListDrop = action.payload.data;
      })
      .addCase(getPriceListDropdown.rejected, state => {
        state.loading = false;
        state.priceListDrop = null;
      });
  },
});
export const priceListSliceMethods = {
  getPriceList,
  createPriceList,
  updatePriceList,
  deletePriceData,
  getPriceListById,
  getPriceListDropdown,
};
export const { clearPrices, resetPriceList, resetPriceListList, resetPriceListDrop } = priceListSlice.actions;
export default priceListSlice.reducer;
