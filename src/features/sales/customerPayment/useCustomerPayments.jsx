// React
import { useCallback } from 'react';

// Third Party
import { useDispatch, useSelector } from 'react-redux';

// Redux
import {
  customerPaymentSliceMethods,
  resetCustomerPayment as resetCustomerPaymentAction,
  resetCustomerPayments as resetCustomerPaymentsAction,
} from '@/features/sales/customerPayment/customerPayment.slice';

export const useCustomerPayments = () => {
  const dispatch = useDispatch();

  const { customerPayments, customerPayment, pagination, loading, submitLoading, error } = useSelector(state => state.customerPayment);

  const getCustomerPayments = useCallback(
    async payload => {
      const response = await dispatch(customerPaymentSliceMethods.getCustomerPayments(payload));
      return response;
    },
    [dispatch]
  );

  const getCustomerPaymentById = useCallback(
    async payload => {
      const response = await dispatch(customerPaymentSliceMethods.getCustomerPaymentById(payload));
      return response;
    },
    [dispatch]
  );

  const rejectCustomerPayment = useCallback(
    async payload => {
      const response = await dispatch(customerPaymentSliceMethods.rejectCustomerPayment(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const recordCustomerPayment = useCallback(
    async payload => {
      const response = await dispatch(customerPaymentSliceMethods.recordCustomerPayment(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const resetCustomerPayment = useCallback(() => dispatch(resetCustomerPaymentAction()), [dispatch]);
  const resetCustomerPayments = useCallback(() => dispatch(resetCustomerPaymentsAction()), [dispatch]);

  return {
    customerPayments,
    customerPayment,
    pagination,
    loading,
    submitLoading,
    error,
    getCustomerPayments,
    getCustomerPaymentById,
    rejectCustomerPayment,
    recordCustomerPayment,
    resetCustomerPayment,
    resetCustomerPayments,
  };
};
