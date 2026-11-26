import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { customerAppDashboardSliceMethods } from './customerAppDashboard.slice';

export const useCustomerAppDashboard = () => {
  const dispatch = useDispatch();
  const { stats, recentOrders, recentPayments, currency, loading, error } = useSelector(state => state.customerAppDashboard);

  const getDashboardData = useCallback(() => dispatch(customerAppDashboardSliceMethods.getDashboardData()), [dispatch]);

  return { stats, recentOrders, recentPayments, currency, loading, error, getDashboardData };
};
