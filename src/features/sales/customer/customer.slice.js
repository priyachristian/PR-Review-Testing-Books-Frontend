import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { customerMasterService } from './customer.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const fetchOpeningBalancePaymentHistory = createAsyncThunk('customerMaster/fetchOpeningBalancePaymentHistory', customerMasterService.getOpeningBalanceTransactionHistory);

const createCustomer = createAsyncThunk('customerMaster/createCustomer', customerMasterService.createCustomer);

const updateCustomerData = createAsyncThunk('customerMaster/updateCustomerData', customerMasterService.updateCustomerData);

const documentUpload = createAsyncThunk('customerMaster/documentUpload', customerMasterService.documentUpload);

const getCustomer = createAsyncThunk('customerMaster/getCustomer', customerMasterService.getCustomer);

const getCustomerExports = createAsyncThunk('customerMaster/getCustomerExports', customerMasterService.getCustomerExports);

const getCustomerDrop = createAsyncThunk('customerMaster/getCustomerDrop', customerMasterService.getCustomerDrop);

const getVendorDrop = createAsyncThunk('customerMaster/getVendorDrop', customerMasterService.getVendorDrop);

const createBulkCustomers = createAsyncThunk('customerMaster/createBulkCustomers', customerMasterService.createBulkCustomers);

const verifyBulkCustomers = createAsyncThunk('customerMaster/verifyBulkCustomers', customerMasterService.verifyBulkCustomers);

const createBulkOpeningBalance = createAsyncThunk('customerMaster/createBulkOpeningBalance', customerMasterService.addBulkOpeningBalance);

const verifyBulkOpeningBalance = createAsyncThunk('customerMaster/verifyBulkOpeningBalance', customerMasterService.verifyBulkOpeningBalance);

const getCustomerById = createAsyncThunk('customerMaster/getCustomerById', customerMasterService.getCustomerById);

const getCustomerDropList = createAsyncThunk('customerMaster/getCustomerDropList', customerMasterService.getCustomerDropList);

const getVendorDropList = createAsyncThunk('customerMaster/getVendorDropList', customerMasterService.getVendorDropList);

const getAllCustomersDropList = createAsyncThunk('customerMaster/getAllCustomersDropList', customerMasterService.getAllCustomersDropList);

const getPortalCustomers = createAsyncThunk('customerMaster/getPortalCustomers', customerMasterService.getPortalCustomers);

const getCustomerBriefDetail = createAsyncThunk('customerMaster/getCustomerBriefDetail', customerMasterService.getCustomerBriefDetail);

const getCustomerAddress = createAsyncThunk('customerMaster/getCustomerAddress', customerMasterService.getCustomerAddress);

const addCustomerAddress = createAsyncThunk('customerMaster/addCustomerAddress', customerMasterService.addCustomerAddress);

const updateCustomerAddress = createAsyncThunk('customerMaster/updateCustomerAddress', customerMasterService.updateCustomerAddress);

const toggleAddressStatus = createAsyncThunk('customerMaster/toggleAddressStatus', customerMasterService.toggleAddressStatus);

const getCustomerAnalysis360 = createAsyncThunk('customerMaster/getCustomerAnalysis360', customerMasterService.getCustomerAnalysis360);

const getCustomerCreditDashboard = createAsyncThunk('customerMaster/getCustomerCreditDashboard', customerMasterService.getCustomerCreditDashboard);

const toggleCustomerStatus = createAsyncThunk('customerMaster/toggleCustomerStatus', customerMasterService.toggleCustomerStatus);

const resendPortalInvite = createAsyncThunk('customerMaster/resendPortalInvite', customerMasterService.resendPortalInvite);

const acceptCustomerVerification = createAsyncThunk('customerMaster/acceptCustomerVerification', customerMasterService.acceptCustomerVerification);

const rejectCustomerVerification = createAsyncThunk('customerMaster/rejectCustomerVerification', customerMasterService.rejectCustomerVerification);

const deleteCustomer = createAsyncThunk('customerMaster/deleteCustomer', customerMasterService.deleteCustomer);

const getBusinessPartnerTeam = createAsyncThunk('customerMaster/getBusinessPartnerTeam', customerMasterService.getBusinessPartnerTeam);

const createBusinessPartnerTeam = createAsyncThunk('customerMaster/createBusinessPartnerTeam', customerMasterService.createBusinessPartnerTeam);

const updateBusinessPartnerTeam = createAsyncThunk('customerMaster/updateBusinessPartnerTeam', customerMasterService.updateBusinessPartnerTeam);

const deleteBusinessPartnerTeam = createAsyncThunk('customerMaster/deleteBusinessPartnerTeam', customerMasterService.deleteBusinessPartnerTeam);

export const customerMasterSlice = createSlice({
  name: 'customerMaster',
  initialState: {
    customerDetail: null,
    otherDetails: null,
    address: null,
    businessPartner: null,
    branches: null,
    customerMaster: [],
    customerMasterExports: [],
    portalCustomers: [],
    customerDropDown: [],
    customerDropDownList: null,
    vendorDropDown: [],
    vendorDropDownList: null,
    allCustomersDropDown: [],
    allCustomersDropDownList: null,
    customerBriefDetail: null,
    customerAddress: null,
    pagination: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    file: null,
    document: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    exportLoading: false,
    addressLoading: false,
    resendInviteLoading: false,
    acceptVerificationLoading: false,
    rejectVerificationLoading: false,
    error: null,
    openingBalancePaymentHistory: [],
    analysis360: null,
    analysis360Loading: false,
    customerCreditDashboard: null,
    customerCreditDashboardLoading: false,
  },
  reducers: {
    addOtherDetails: (state, action) => {
      state.otherDetails = action.payload;
    },
    addAddress: (state, action) => {
      state.address = action.payload;
    },
    addBusinessPartnerTeam: (state, action) => {
      state.businessPartner = action.payload ?? [];
    },
    addBranches: (state, action) => {
      state.branches = action.payload;
    },
    resetCustomer: state => {
      state.customerDetail = null;
      state.otherDetails = null;
      state.address = null;
      state.businessPartner = null;
      state.branches = null;
      state.openingBalancePaymentHistory = [];
    },
    resetCustomerDropDown: state => {
      state.customerDropDown = [];
    },
    resetVendorDropDown: state => {
      state.vendorDropDown = [];
    },
    resetCustomerDropDownList: state => {
      state.customerDropDownList = null;
    },
    resetVendorDropDownList: state => {
      state.vendorDropDownList = null;
    },
    resetAllCustomersDropDownList: state => {
      state.allCustomersDropDownList = null;
    },
    resetCustomerBriefDetail: state => {
      state.customerBriefDetail = null;
    },
    resetCustomerMaster: state => {
      state.customerMaster = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetCustomerAddress: state => {
      state.customerAddress = null;
    },
    resetAnalysis360: state => {
      state.analysis360 = null;
      state.analysis360Loading = false;
    },
    resetCustomerCreditDashboard: state => {
      state.customerCreditDashboard = null;
      state.customerCreditDashboardLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getCustomer.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customerMaster = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
          portalSummary: action.payload.extras?.portalSummary || { invited: 0, joinedViaCode: 0 },
        };
        state.message = action.payload.message;
      })
      .addCase(getCustomer.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.customerMaster = [];
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getCustomerExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.customerMasterExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCustomerExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerDrop.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerDrop.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDropDown = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCustomerDrop.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(getVendorDrop.pending, state => {
        state.loading = true;
      })
      .addCase(getVendorDrop.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorDropDown = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getVendorDrop.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(documentUpload.pending, state => {
        state.loading = true;
      })
      .addCase(documentUpload.fulfilled, (state, action) => {
        state.loading = false;
        state.document = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(documentUpload.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createCustomer.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCustomerData.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateCustomerData.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateCustomerData.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBulkCustomers.pending, state => {
        state.loading = true;
      })
      .addCase(createBulkCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBulkCustomers.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBulkOpeningBalance.pending, state => {
        state.loading = true;
      })
      .addCase(createBulkOpeningBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBulkOpeningBalance.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCustomerById.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDetail = action.payload.data;
      })
      .addCase(getCustomerById.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.customerDetail = null;
          state.error = action.error.message;
        }
      })
      .addCase(fetchOpeningBalancePaymentHistory.fulfilled, (state, action) => {
        const body = action.payload?.data;
        state.openingBalancePaymentHistory = body?.flatHistory ?? [];
      })
      .addCase(fetchOpeningBalancePaymentHistory.rejected, state => {
        state.openingBalancePaymentHistory = [];
      })
      .addCase(getCustomerDropList.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerDropList.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDropDownList = action.payload.data;
      })
      .addCase(getCustomerDropList.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.customerDropDownList = null;
          state.error = action.error.message;
        }
      })
      .addCase(getVendorDropList.pending, state => {
        state.loading = true;
      })
      .addCase(getVendorDropList.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorDropDownList = action.payload.data;
      })
      .addCase(getVendorDropList.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.vendorDropDownList = null;
          state.error = action.error.message;
        }
      })
      .addCase(getAllCustomersDropList.pending, state => {
        state.loading = true;
      })
      .addCase(getAllCustomersDropList.fulfilled, (state, action) => {
        state.loading = false;
        state.allCustomersDropDownList = action.payload.data;
      })
      .addCase(getAllCustomersDropList.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.allCustomersDropDownList = null;
          state.error = action.error.message;
        }
      })
      .addCase(getPortalCustomers.pending, state => {
        state.loading = true;
      })
      .addCase(getPortalCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.portalCustomers = action.payload.data || [];
      })
      .addCase(getPortalCustomers.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.portalCustomers = [];
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerBriefDetail.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerBriefDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.customerBriefDetail = action.payload.data;
      })
      .addCase(getCustomerBriefDetail.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.customerBriefDetail = null;
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerAddress.pending, state => {
        state.addressLoading = true;
      })
      .addCase(getCustomerAddress.fulfilled, (state, action) => {
        state.addressLoading = false;
        state.customerAddress = action.payload.data;
      })
      .addCase(getCustomerAddress.rejected, (state, action) => {
        state.addressLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.customerAddress = null;
          state.error = action.error.message;
        }
      })
      .addCase(addCustomerAddress.pending, state => {
        state.submitLoading = true;
      })
      .addCase(addCustomerAddress.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(addCustomerAddress.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCustomerAddress.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateCustomerAddress.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateCustomerAddress.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(toggleAddressStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleAddressStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleAddressStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCustomerAnalysis360.pending, state => {
        state.analysis360Loading = true;
      })
      .addCase(getCustomerAnalysis360.fulfilled, (state, action) => {
        state.analysis360Loading = false;
        state.analysis360 = action.payload.data;
      })
      .addCase(getCustomerAnalysis360.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.analysis360Loading = false;
          state.analysis360 = null;
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerCreditDashboard.pending, state => {
        state.customerCreditDashboardLoading = true;
      })
      .addCase(getCustomerCreditDashboard.fulfilled, (state, action) => {
        state.customerCreditDashboardLoading = false;
        state.customerCreditDashboard = action.payload.data;
      })
      .addCase(getCustomerCreditDashboard.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.customerCreditDashboardLoading = false;
          state.customerCreditDashboard = null;
        }
      })
      .addCase(toggleCustomerStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleCustomerStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleCustomerStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(resendPortalInvite.pending, state => {
        state.resendInviteLoading = true;
      })
      .addCase(resendPortalInvite.fulfilled, (state, action) => {
        state.resendInviteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message || 'Portal invite sent successfully');
      })
      .addCase(resendPortalInvite.rejected, (state, action) => {
        state.resendInviteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(acceptCustomerVerification.pending, state => {
        state.acceptVerificationLoading = true;
      })
      .addCase(acceptCustomerVerification.fulfilled, (state, action) => {
        state.acceptVerificationLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message || 'Customer verification accepted successfully');
      })
      .addCase(acceptCustomerVerification.rejected, (state, action) => {
        state.acceptVerificationLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectCustomerVerification.pending, state => {
        state.rejectVerificationLoading = true;
      })
      .addCase(rejectCustomerVerification.fulfilled, (state, action) => {
        state.rejectVerificationLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message || 'Customer verification rejected successfully');
      })
      .addCase(rejectCustomerVerification.rejected, (state, action) => {
        state.rejectVerificationLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteCustomer.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.customerMaster = (state.customerMaster || []).filter(item => item.id !== action.meta.arg.customerId);
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getBusinessPartnerTeam.fulfilled, (state, action) => {
        if (state.customerDetail) {
          state.customerDetail.businessPartnerTeam = action.payload?.data || [];
        }
      })
      .addCase(getBusinessPartnerTeam.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBusinessPartnerTeam.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createBusinessPartnerTeam.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBusinessPartnerTeam.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateBusinessPartnerTeam.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateBusinessPartnerTeam.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateBusinessPartnerTeam.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteBusinessPartnerTeam.pending, state => {
        state.submitLoading = true;
      })
      .addCase(deleteBusinessPartnerTeam.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteBusinessPartnerTeam.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const customerMasterSliceMethods = {
  createCustomer,
  updateCustomerData,
  documentUpload,
  getCustomer,
  createBulkCustomers,
  verifyBulkCustomers,
  createBulkOpeningBalance,
  verifyBulkOpeningBalance,
  getCustomerExports,
  getCustomerDrop,
  getVendorDrop,
  getCustomerById,
  fetchOpeningBalancePaymentHistory,
  getCustomerDropList,
  getVendorDropList,
  getAllCustomersDropList,
  getPortalCustomers,
  getCustomerBriefDetail,
  getCustomerAddress,
  addCustomerAddress,
  updateCustomerAddress,
  getCustomerAnalysis360,
  getCustomerCreditDashboard,
  toggleAddressStatus,
  toggleCustomerStatus,
  resendPortalInvite,
  acceptCustomerVerification,
  rejectCustomerVerification,
  deleteCustomer,
  getBusinessPartnerTeam,
  createBusinessPartnerTeam,
  updateBusinessPartnerTeam,
  deleteBusinessPartnerTeam,
};
export const {
  addOtherDetails,
  addAddress,
  addBusinessPartnerTeam,
  addBranches,
  deleteCustomerBranch,
  resetCustomerBranch,
  resetCustomer,
  resetCustomerDropDown,
  resetVendorDropDown,
  resetCustomerDropDownList,
  resetVendorDropDownList,
  resetAllCustomersDropDownList,
  resetCustomerBriefDetail,
  resetCustomerMaster,
  resetCustomerAddress,
  resetAnalysis360,
  resetCustomerCreditDashboard,
} = customerMasterSlice.actions;
export default customerMasterSlice.reducer;
