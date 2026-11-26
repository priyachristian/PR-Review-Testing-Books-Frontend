import { useDispatch, useSelector } from 'react-redux';
import {
  salesDashboardSliceMethods,
  resetSummary,
  resetStateWise,
  resetStateGraph,
  resetOrderTrend,
  resetOrderStatus,
  resetCustomerWise,
  resetItemWise,
  resetCityWise,
  resetCustomers,
  resetCustomerInvoices,
  resetNonOrderCustomers,
  resetNonOrderCustomerList,
  resetItemStateBreakdown,
  resetItemCustomerBreakdown,
  resetCustomerItemBreakdown,
  resetStateItemBreakdown,
  resetStateCustomerBreakdown,
  resetItemDetails,
  resetCustomerDetails,
  resetAll,
} from '@/features/dashboard/salesDashboard/salesDashboardSlice';

export const useSalesDashboard = () => {
  const dispatch = useDispatch();

  const {
    summary,
    stateWise,
    stateGraph,
    orderTrend,
    orderStatus,
    customerWise,
    itemWise,
    cityWise,
    customers,
    inactiveCustomers,
    userDropdown,
    customerInvoices,
    nonOrderCustomers,
    nonOrderCustomerList,
    itemGroupAnalytics,
    itemStateBreakdown,
    itemCustomerBreakdown,
    customerItemBreakdown,
    stateItemBreakdown,
    stateCustomerBreakdown,
    itemDetails,
    customerDetails,
    summaryLoading,
    stateWiseLoading,
    stateGraphLoading,
    orderTrendLoading,
    orderStatusLoading,
    customerWiseLoading,
    itemWiseLoading,
    cityWiseLoading,
    customersLoading,
    inactiveCustomersLoading,
    userDropdownLoading,
    customerInvoicesLoading,
    nonOrderCustomersLoading,
    nonOrderCustomerListLoading,
    itemGroupAnalyticsLoading,
    itemStateBreakdownLoading,
    itemStateBreakdownScrollLoading,
    itemCustomerBreakdownLoading,
    itemCustomerBreakdownScrollLoading,
    customerItemBreakdownLoading,
    customerItemBreakdownScrollLoading,
    stateItemBreakdownLoading,
    stateItemBreakdownScrollLoading,
    stateCustomerBreakdownLoading,
    stateCustomerBreakdownScrollLoading,
  } = useSelector(state => state.salesDashboard);

  const getSummary = payload => dispatch(salesDashboardSliceMethods.getSummary(payload));
  const getStateWise = payload => dispatch(salesDashboardSliceMethods.getStateWise(payload));
  const getStateGraph = payload => dispatch(salesDashboardSliceMethods.getStateGraph(payload));
  const getOrderTrend = payload => dispatch(salesDashboardSliceMethods.getOrderTrend(payload));
  const getOrderStatus = payload => dispatch(salesDashboardSliceMethods.getOrderStatus(payload));
  const getCustomerWise = payload => dispatch(salesDashboardSliceMethods.getCustomerWise(payload));
  const getItemWise = payload => dispatch(salesDashboardSliceMethods.getItemWise(payload));
  const getCityWise = payload => dispatch(salesDashboardSliceMethods.getCityWise(payload));
  const getCustomers = payload => dispatch(salesDashboardSliceMethods.getCustomers(payload));
  const getInactiveCustomers = payload => dispatch(salesDashboardSliceMethods.getInactiveCustomers(payload));
  const getNonOrderCustomers = payload => dispatch(salesDashboardSliceMethods.getNonOrderCustomers(payload));
  const getNonOrderCustomerList = payload => dispatch(salesDashboardSliceMethods.getNonOrderCustomerList(payload));
  const getUserDropdown = payload => dispatch(salesDashboardSliceMethods.getUserDropdown(payload));
  const getCustomerInvoices = payload => dispatch(salesDashboardSliceMethods.getCustomerInvoices(payload));
  const getItemGroupAnalytics = payload => dispatch(salesDashboardSliceMethods.getItemGroupAnalytics(payload));
  const getItemWiseDetails = payload => dispatch(salesDashboardSliceMethods.getItemWiseDetails(payload));
  const getCustomerWiseDetails = payload => dispatch(salesDashboardSliceMethods.getCustomerWiseDetails(payload));
  const getStateWiseDetails = payload => dispatch(salesDashboardSliceMethods.getStateWiseDetails(payload));

  return {
    // Data
    summary,
    stateWise,
    stateGraph,
    orderTrend,
    orderStatus,
    customerWise,
    itemWise,
    cityWise,
    customers,
    inactiveCustomers,
    userDropdown,
    customerInvoices,
    nonOrderCustomers,
    nonOrderCustomerList,
    itemGroupAnalytics,
    itemStateBreakdown,
    itemCustomerBreakdown,
    customerItemBreakdown,
    stateItemBreakdown,
    stateCustomerBreakdown,
    itemDetails,
    customerDetails,

    // Loading
    summaryLoading,
    stateWiseLoading,
    stateGraphLoading,
    orderTrendLoading,
    orderStatusLoading,
    customerWiseLoading,
    itemWiseLoading,
    cityWiseLoading,
    customersLoading,
    inactiveCustomersLoading,
    userDropdownLoading,
    customerInvoicesLoading,
    nonOrderCustomersLoading,
    nonOrderCustomerListLoading,
    itemGroupAnalyticsLoading,
    itemStateBreakdownLoading,
    itemStateBreakdownScrollLoading,
    itemCustomerBreakdownLoading,
    itemCustomerBreakdownScrollLoading,
    customerItemBreakdownLoading,
    customerItemBreakdownScrollLoading,
    stateItemBreakdownLoading,
    stateItemBreakdownScrollLoading,
    stateCustomerBreakdownLoading,
    stateCustomerBreakdownScrollLoading,

    // Actions
    getSummary,
    getStateWise,
    getStateGraph,
    getOrderTrend,
    getOrderStatus,
    getCustomerWise,
    getItemWise,
    getCityWise,
    getCustomers,
    getInactiveCustomers,
    getNonOrderCustomers,
    getNonOrderCustomerList,
    getUserDropdown,
    getCustomerInvoices,
    getItemGroupAnalytics,
    getItemWiseDetails,
    getCustomerWiseDetails,
    getStateWiseDetails,

    // Resets
    resetSummary: () => dispatch(resetSummary()),
    resetStateWise: () => dispatch(resetStateWise()),
    resetStateGraph: () => dispatch(resetStateGraph()),
    resetOrderTrend: () => dispatch(resetOrderTrend()),
    resetOrderStatus: () => dispatch(resetOrderStatus()),
    resetCustomerWise: () => dispatch(resetCustomerWise()),
    resetItemWise: () => dispatch(resetItemWise()),
    resetCityWise: () => dispatch(resetCityWise()),
    resetCustomers: () => dispatch(resetCustomers()),
    resetCustomerInvoices: () => dispatch(resetCustomerInvoices()),
    resetNonOrderCustomers: () => dispatch(resetNonOrderCustomers()),
    resetNonOrderCustomerList: () => dispatch(resetNonOrderCustomerList()),
    resetItemStateBreakdown: () => dispatch(resetItemStateBreakdown()),
    resetItemCustomerBreakdown: () => dispatch(resetItemCustomerBreakdown()),
    resetCustomerItemBreakdown: () => dispatch(resetCustomerItemBreakdown()),
    resetStateItemBreakdown: () => dispatch(resetStateItemBreakdown()),
    resetStateCustomerBreakdown: () => dispatch(resetStateCustomerBreakdown()),
    resetItemDetails: () => dispatch(resetItemDetails()),
    resetCustomerDetails: () => dispatch(resetCustomerDetails()),
    resetAll: () => dispatch(resetAll()),
  };
};
