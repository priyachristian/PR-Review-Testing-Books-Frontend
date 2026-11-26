import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  customerMasterSliceMethods,
  resetCustomer as resetCustomerAction,
  resetCustomerDropDown as resetCustomerDropDownAction,
  resetVendorDropDown as resetVendorDropDownAction,
  resetCustomerDropDownList as resetCustomerDropDownListAction,
  resetVendorDropDownList as resetVendorDropDownListAction,
  resetAllCustomersDropDownList as resetAllCustomersDropDownListAction,
  resetCustomerBriefDetail as resetCustomerBriefDetailAction,
  resetCustomerMaster as resetCustomerMasterAction,
  resetCustomerAddress as resetCustomerAddressAction,
  resetAnalysis360 as resetAnalysis360Action,
  resetCustomerCreditDashboard as resetCustomerCreditDashboardAction,
} from '@/features/sales/customer/customer.slice';

export const useCustomer = () => {
  const dispatch = useDispatch();

  const {
    customerDropDown,
    customerDetail,
    vendorDropDown,
    allCustomersDropDown,
    customerDropDownList,
    vendorDropDownList,
    allCustomersDropDownList,
    portalCustomers,
    customerBriefDetail,
    otherDetails,
    address,
    businessPartner,
    branches,
    customerMaster,
    customerMasterExports,
    customerAddress,
    pagination,
    file,
    document,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    exportLoading,
    addressLoading,
    resendInviteLoading,
    acceptVerificationLoading,
    rejectVerificationLoading,
    error,
    openingBalancePaymentHistory,
    analysis360,
    analysis360Loading,
    customerCreditDashboard,
    customerCreditDashboardLoading,
  } = useSelector(state => state.customerMaster);

  const getCustomer = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomer(payload)).unwrap();
    },
    [dispatch]
  );

  const getCustomerExports = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerExports(payload)).unwrap();
    },
    [dispatch]
  );

  const getCustomerDrop = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerDrop(payload));
    },
    [dispatch]
  );

  const getVendorDrop = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getVendorDrop(payload));
    },
    [dispatch]
  );

  const documentUpload = useCallback(
    async fileData => {
      return await dispatch(customerMasterSliceMethods.documentUpload(fileData));
    },
    [dispatch]
  );

  const createCustomer = useCallback(
    async customerData => {
      return await dispatch(customerMasterSliceMethods.createCustomer(customerData)).unwrap();
    },
    [dispatch]
  );

  const updateCustomerData = useCallback(
    async ({ customerId, customerData }) => {
      return await dispatch(customerMasterSliceMethods.updateCustomerData({ customerId, customerData })).unwrap();
    },
    [dispatch]
  );

  const getCustomerById = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerById(payload));
    },
    [dispatch]
  );

  const fetchOpeningBalancePaymentHistory = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.fetchOpeningBalancePaymentHistory(payload));
    },
    [dispatch]
  );

  const resetCustomer = useCallback(() => dispatch(resetCustomerAction()), [dispatch]);

  const resetCustomerDropDown = useCallback(() => dispatch(resetCustomerDropDownAction()), [dispatch]);

  const resetVendorDropDown = useCallback(() => dispatch(resetVendorDropDownAction()), [dispatch]);

  const getCustomerDropList = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerDropList(payload));
    },
    [dispatch]
  );

  const resetCustomerDropDownList = useCallback(() => dispatch(resetCustomerDropDownListAction()), [dispatch]);

  const getVendorDropList = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getVendorDropList(payload));
    },
    [dispatch]
  );

  const resetVendorDropDownList = useCallback(() => dispatch(resetVendorDropDownListAction()), [dispatch]);

  const getAllCustomersDropList = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getAllCustomersDropList(payload));
    },
    [dispatch]
  );

  const getPortalCustomers = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getPortalCustomers(payload));
    },
    [dispatch]
  );

  const resetAllCustomersDropDownList = useCallback(() => dispatch(resetAllCustomersDropDownListAction()), [dispatch]);

  const getCustomerBriefDetail = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerBriefDetail(payload));
    },
    [dispatch]
  );

  const resetCustomerBriefDetail = useCallback(() => dispatch(resetCustomerBriefDetailAction()), [dispatch]);

  const resetCustomerMaster = useCallback(() => dispatch(resetCustomerMasterAction()), [dispatch]);

  const getCustomerAddress = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerAddress(payload));
    },
    [dispatch]
  );

  const resetCustomerAddress = useCallback(() => dispatch(resetCustomerAddressAction()), [dispatch]);

  const getCustomerAnalysis360 = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerAnalysis360(payload));
    },
    [dispatch]
  );

  const resetAnalysis360 = useCallback(() => dispatch(resetAnalysis360Action()), [dispatch]);

  const resetCustomerCreditDashboard = useCallback(() => dispatch(resetCustomerCreditDashboardAction()), [dispatch]);

  const getCustomerCreditDashboard = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getCustomerCreditDashboard(payload));
    },
    [dispatch]
  );

  const addCustomerAddress = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.addCustomerAddress(payload)).unwrap();
    },
    [dispatch]
  );

  const updateCustomerAddress = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.updateCustomerAddress(payload)).unwrap();
    },
    [dispatch]
  );

  const toggleAddressStatus = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.toggleAddressStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const toggleCustomerStatus = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.toggleCustomerStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const resendPortalInvite = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.resendPortalInvite(payload)).unwrap();
    },
    [dispatch]
  );

  const acceptCustomerVerification = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.acceptCustomerVerification(payload)).unwrap();
    },
    [dispatch]
  );

  const rejectCustomerVerification = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.rejectCustomerVerification(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteCustomer = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.deleteCustomer(payload));
    },
    [dispatch]
  );

  const getBusinessPartnerTeam = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.getBusinessPartnerTeam(payload)).unwrap();
    },
    [dispatch]
  );

  const createBusinessPartnerTeam = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.createBusinessPartnerTeam(payload)).unwrap();
    },
    [dispatch]
  );

  const updateBusinessPartnerTeam = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.updateBusinessPartnerTeam(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteBusinessPartnerTeam = useCallback(
    async payload => {
      return await dispatch(customerMasterSliceMethods.deleteBusinessPartnerTeam(payload)).unwrap();
    },
    [dispatch]
  );

  const createBulkCustomers = useCallback(
    async customerData => {
      return await dispatch(customerMasterSliceMethods.createBulkCustomers(customerData)).unwrap();
    },
    [dispatch]
  );

  return {
    customerDropDown,
    customerDetail,
    vendorDropDown,
    allCustomersDropDown,
    customerDropDownList,
    vendorDropDownList,
    allCustomersDropDownList,
    portalCustomers,
    customerBriefDetail,
    otherDetails,
    address,
    businessPartner,
    branches,
    customerMaster,
    customerMasterExports,
    customerAddress,
    pagination,
    file,
    document,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    exportLoading,
    addressLoading,
    resendInviteLoading,
    acceptVerificationLoading,
    rejectVerificationLoading,
    error,
    openingBalancePaymentHistory,
    analysis360,
    analysis360Loading,
    customerCreditDashboard,
    customerCreditDashboardLoading,
    getCustomer,
    getCustomerExports,
    getCustomerDrop,
    getVendorDrop,
    documentUpload,
    createCustomer,
    updateCustomerData,
    createBulkCustomers,
    getCustomerById,
    fetchOpeningBalancePaymentHistory,
    resetCustomer,
    resetCustomerDropDown,
    resetVendorDropDown,
    getCustomerDropList,
    resetCustomerDropDownList,
    getVendorDropList,
    resetVendorDropDownList,
    getAllCustomersDropList,
    getPortalCustomers,
    resetAllCustomersDropDownList,
    getCustomerBriefDetail,
    resetCustomerBriefDetail,
    resetCustomerMaster,
    getCustomerAddress,
    resetCustomerAddress,
    addCustomerAddress,
    updateCustomerAddress,
    getCustomerAnalysis360,
    resetAnalysis360,
    getCustomerCreditDashboard,
    resetCustomerCreditDashboard,
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
};
