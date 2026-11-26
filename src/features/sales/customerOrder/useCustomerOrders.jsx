// React
import { useCallback } from 'react';

// Third Party
import { useDispatch, useSelector } from 'react-redux';

// Redux
import { customerOrderSliceMethods, resetCustomerOrder as resetCustomerOrderAction, resetCustomerOrders as resetCustomerOrdersAction } from '@/features/sales/customerOrder/customerOrder.slice';

export const useCustomerOrders = () => {
  const dispatch = useDispatch();

  const { customerOrders, customerOrder, pagination, remove, loading, submitLoading, error } = useSelector(state => state.customerOrder);

  const getCustomerOrders = useCallback(
    async payload => {
      const response = await dispatch(customerOrderSliceMethods.getCustomerOrders(payload));
      return response;
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      const response = await dispatch(customerOrderSliceMethods.updateStatus(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getCustomerOrderById = useCallback(
    async payload => {
      const response = await dispatch(customerOrderSliceMethods.getCustomerOrderById(payload));
      return response;
    },
    [dispatch]
  );

  const resetCustomerOrder = useCallback(() => dispatch(resetCustomerOrderAction()), [dispatch]);
  const resetCustomerOrders = useCallback(() => dispatch(resetCustomerOrdersAction()), [dispatch]);

  return {
    customerOrders,
    customerOrder,
    pagination,
    remove,
    loading,
    submitLoading,
    error,
    getCustomerOrders,
    updateStatus,
    getCustomerOrderById,
    resetCustomerOrder,
    resetCustomerOrders,
  };
};
