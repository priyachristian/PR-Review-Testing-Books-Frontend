import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { commentService } from './comment.service';

const addComment = createAsyncThunk('comment/addComment', commentService.addComment);

const initialState = {
  comment: null,
  submitLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    resetComment: state => {
      state.comment = null;
      state.error = null;
    },
    clearCommentError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addComment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.comment = action.payload?.data ?? action.payload;
        if (action.payload?.message) {
          Toast.success(action.payload.message);
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const commentSliceMethods = {
  addComment,
};

export const { resetComment, clearCommentError } = commentSlice.actions;
export default commentSlice.reducer;
