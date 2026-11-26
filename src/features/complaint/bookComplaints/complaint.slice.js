import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { complaintService } from './complaint.service';

const toRejectValue = error => (typeof error === 'string' ? { message: error } : error?.response?.data || { message: error?.message || 'Something went wrong' });

const isComplaintEntity = data => Boolean(data && (data._id || data.id) && (data.complaintNo != null || data.currentStep != null));

const getComplaintFromPayload = payload => {
  const data = payload?.data;
  return isComplaintEntity(data) ? data : null;
};

const getComplaints = createAsyncThunk('complaint/getComplaints', complaintService.getComplaints);
const getComplaintById = createAsyncThunk('complaint/getComplaintById', complaintService.getComplaintById);
const getComplaintDropdown = createAsyncThunk('complaint/getComplaintDropdown', complaintService.getComplaintDropdown);

const createComplaint = createAsyncThunk('complaint/createComplaint', async (data, { rejectWithValue }) => {
  try {
    return await complaintService.createComplaint(data);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const updateComplaint = createAsyncThunk('complaint/updateComplaint', async ({ complaintId, data }, { rejectWithValue }) => {
  try {
    return await complaintService.updateComplaint({ complaintId, data });
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const deleteComplaint = createAsyncThunk('complaint/deleteComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.deleteComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const assignComplaint = createAsyncThunk('complaint/assignComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.assignComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const replyComplaint = createAsyncThunk('complaint/replyComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.replyComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const startProgress = createAsyncThunk('complaint/startProgress', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.startProgress(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const setWarranty = createAsyncThunk('complaint/setWarranty', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.setWarranty(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const setRootCause = createAsyncThunk('complaint/setRootCause', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.setRootCause(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const setStopGap = createAsyncThunk('complaint/setStopGap', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.setStopGap(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const recordProgress = createAsyncThunk('complaint/recordProgress', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.recordProgress(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const setSettlement = createAsyncThunk('complaint/setSettlement', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.setSettlement(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const approveSettlement = createAsyncThunk('complaint/approveSettlement', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.approveSettlement(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const completeAction = createAsyncThunk('complaint/completeAction', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.completeAction(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const verifyComplaint = createAsyncThunk('complaint/verifyComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.verifyComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const closeComplaint = createAsyncThunk('complaint/closeComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.closeComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const reopenComplaint = createAsyncThunk('complaint/reopenComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.reopenComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const handToSomeone = createAsyncThunk('complaint/handToSomeone', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.handToSomeone(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const setWaiting = createAsyncThunk('complaint/setWaiting', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.setWaiting(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const escalateComplaint = createAsyncThunk('complaint/escalateComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.escalateComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const markNotReal = createAsyncThunk('complaint/markNotReal', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.markNotReal(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const linkComplaint = createAsyncThunk('complaint/linkComplaint', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.linkComplaint(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const skipStep = createAsyncThunk('complaint/skipStep', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.skipStep(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const addTeamNote = createAsyncThunk('complaint/addTeamNote', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.addTeamNote(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const addTeamTask = createAsyncThunk('complaint/addTeamTask', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.addTeamTask(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const updateTeamTask = createAsyncThunk('complaint/updateTeamTask', async (payload, { rejectWithValue }) => {
  try {
    return await complaintService.updateTeamTask(payload);
  } catch (error) {
    return rejectWithValue(toRejectValue(error));
  }
});

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
};

const initialStatusCounts = {
  needsAction: 0,
  goingOn: 0,
  onHold: 0,
  finished: 0,
};

const applyMutationSuccess = (state, action, fallbackMessage) => {
  state.submitLoading = false;
  const complaint = getComplaintFromPayload(action.payload);
  if (complaint) {
    state.complaint = complaint;
  }
  state.message = action.payload?.message;
  Toast.success(state.message || fallbackMessage);
};

const applyMutationRejected = (state, action) => {
  state.submitLoading = false;
  state.error = action.payload;
  Toast.error(action.payload?.message || 'Something went wrong');
};

export const complaintSlice = createSlice({
  name: 'complaint',
  initialState: {
    complaints: [],
    complaint: null,
    pagination: initialPagination,
    statusCounts: initialStatusCounts,
    customerCount: null,
    internalCount: null,
    create: null,
    update: null,
    remove: null,
    loading: false,
    complaintDropLoading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    resetComplaint: state => {
      state.complaint = null;
      state.create = null;
      state.update = null;
      state.remove = null;
      state.error = null;
      state.message = null;
    },
    resetComplaints: state => {
      state.complaints = [];
      state.pagination = { ...initialPagination };
      state.statusCounts = { ...initialStatusCounts };
      state.customerCount = null;
      state.internalCount = null;
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getComplaints.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = action.payload?.data || [];
        const extras = action.payload?.extras || {};
        state.pagination = {
          page: extras.page ?? initialPagination.page,
          limit: extras.limit ?? initialPagination.limit,
          totalPages: extras.totalPages ?? initialPagination.totalPages,
          totalResults: extras.totalResults ?? initialPagination.totalResults,
        };
        if (extras.statusCounts) {
          state.statusCounts = extras.statusCounts;
        }
        if (extras.customerCount != null) {
          state.customerCount = extras.customerCount;
        }
        if (extras.internalCount != null) {
          state.internalCount = extras.internalCount;
        }
      })
      .addCase(getComplaints.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        state.complaints = [];
        state.error = action.error.message;
        Toast.error(state.error);
      })
      .addCase(getComplaintById.pending, state => {
        // Keep existing detail during refresh so the page does not go empty.
        if (!state.complaint) state.loading = true;
        state.error = null;
      })
      .addCase(getComplaintById.fulfilled, (state, action) => {
        state.loading = false;
        state.complaint = getComplaintFromPayload(action.payload);
      })
      .addCase(getComplaintById.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        if (!state.complaint) {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getComplaintDropdown.pending, state => {
        state.complaintDropLoading = true;
      })
      .addCase(getComplaintDropdown.fulfilled, state => {
        state.complaintDropLoading = false;
      })
      .addCase(getComplaintDropdown.rejected, state => {
        state.complaintDropLoading = false;
      })
      .addCase(createComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload?.message;
        Toast.success(state.message || 'Complaint created successfully');
      })
      .addCase(createComplaint.rejected, applyMutationRejected)
      .addCase(updateComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        const complaint = getComplaintFromPayload(action.payload);
        if (complaint) {
          state.complaint = complaint;
        }
        state.message = action.payload?.message;
        Toast.success(state.message || 'Complaint updated successfully');
      })
      .addCase(updateComplaint.rejected, applyMutationRejected)
      .addCase(deleteComplaint.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteComplaint.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload;
        Toast.success(action.payload?.message || 'Complaint deleted successfully');
      })
      .addCase(deleteComplaint.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
        Toast.error(action.payload?.message || 'Something went wrong');
      })
      .addCase(assignComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(assignComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaint assigned successfully'))
      .addCase(assignComplaint.rejected, applyMutationRejected)
      .addCase(replyComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(replyComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Reply recorded successfully'))
      .addCase(replyComplaint.rejected, applyMutationRejected)
      .addCase(startProgress.pending, state => {
        state.submitLoading = true;
      })
      .addCase(startProgress.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Progress started successfully'))
      .addCase(startProgress.rejected, applyMutationRejected)
      .addCase(setWarranty.pending, state => {
        state.submitLoading = true;
      })
      .addCase(setWarranty.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Warranty updated successfully'))
      .addCase(setWarranty.rejected, applyMutationRejected)
      .addCase(setRootCause.pending, state => {
        state.submitLoading = true;
      })
      .addCase(setRootCause.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Root cause saved successfully'))
      .addCase(setRootCause.rejected, applyMutationRejected)
      .addCase(setStopGap.pending, state => {
        state.submitLoading = true;
      })
      .addCase(setStopGap.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Stop-gap action saved successfully'))
      .addCase(setStopGap.rejected, applyMutationRejected)
      .addCase(recordProgress.pending, state => {
        state.submitLoading = true;
      })
      .addCase(recordProgress.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Progress recorded successfully'))
      .addCase(recordProgress.rejected, applyMutationRejected)
      .addCase(setSettlement.pending, state => {
        state.submitLoading = true;
      })
      .addCase(setSettlement.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Settlement saved successfully'))
      .addCase(setSettlement.rejected, applyMutationRejected)
      .addCase(approveSettlement.pending, state => {
        state.submitLoading = true;
      })
      .addCase(approveSettlement.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Settlement approved successfully'))
      .addCase(approveSettlement.rejected, applyMutationRejected)
      .addCase(completeAction.pending, state => {
        state.submitLoading = true;
      })
      .addCase(completeAction.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Action completed successfully'))
      .addCase(completeAction.rejected, applyMutationRejected)
      .addCase(verifyComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(verifyComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaint verified successfully'))
      .addCase(verifyComplaint.rejected, applyMutationRejected)
      .addCase(closeComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(closeComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaint closed successfully'))
      .addCase(closeComplaint.rejected, applyMutationRejected)
      .addCase(reopenComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(reopenComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaint reopened successfully'))
      .addCase(reopenComplaint.rejected, applyMutationRejected)
      .addCase(handToSomeone.pending, state => {
        state.submitLoading = true;
      })
      .addCase(handToSomeone.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Handed to selected person successfully'))
      .addCase(handToSomeone.rejected, applyMutationRejected)
      .addCase(setWaiting.pending, state => {
        state.submitLoading = true;
      })
      .addCase(setWaiting.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Waiting status updated successfully'))
      .addCase(setWaiting.rejected, applyMutationRejected)
      .addCase(escalateComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(escalateComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaint escalated successfully'))
      .addCase(escalateComplaint.rejected, applyMutationRejected)
      .addCase(markNotReal.pending, state => {
        state.submitLoading = true;
      })
      .addCase(markNotReal.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Marked as not a real complaint'))
      .addCase(markNotReal.rejected, applyMutationRejected)
      .addCase(linkComplaint.pending, state => {
        state.submitLoading = true;
      })
      .addCase(linkComplaint.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Complaints linked successfully'))
      .addCase(linkComplaint.rejected, applyMutationRejected)
      .addCase(skipStep.pending, state => {
        state.submitLoading = true;
      })
      .addCase(skipStep.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Step skipped successfully'))
      .addCase(skipStep.rejected, applyMutationRejected)
      .addCase(addTeamNote.pending, state => {
        state.submitLoading = true;
      })
      .addCase(addTeamNote.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Team note added successfully'))
      .addCase(addTeamNote.rejected, applyMutationRejected)
      .addCase(addTeamTask.pending, state => {
        state.submitLoading = true;
      })
      .addCase(addTeamTask.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Team task added successfully'))
      .addCase(addTeamTask.rejected, applyMutationRejected)
      .addCase(updateTeamTask.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateTeamTask.fulfilled, (state, action) => applyMutationSuccess(state, action, 'Team task updated successfully'))
      .addCase(updateTeamTask.rejected, applyMutationRejected);
  },
});

export const complaintSliceMethods = {
  getComplaints,
  getComplaintById,
  getComplaintDropdown,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  replyComplaint,
  startProgress,
  setWarranty,
  setRootCause,
  setStopGap,
  recordProgress,
  setSettlement,
  approveSettlement,
  completeAction,
  verifyComplaint,
  closeComplaint,
  reopenComplaint,
  handToSomeone,
  setWaiting,
  escalateComplaint,
  markNotReal,
  linkComplaint,
  skipStep,
  addTeamNote,
  addTeamTask,
  updateTeamTask,
};

export const { resetComplaint, resetComplaints } = complaintSlice.actions;
export default complaintSlice.reducer;
