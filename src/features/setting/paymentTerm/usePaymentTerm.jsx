import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { paymentTermSliceMethods, resetPaymentTerm as resetPaymentTermAction, resetPaymentTermsDrop as resetPaymentTermsDropAction } from './paymentTerm.slice';

export const usePaymentTerm = () => {
  const dispatch = useDispatch();

  const { paymentTerms, paymentTerm, paymentTermsDrop, pagination, create, update, remove, loading, dropLoading, submitLoading, error } = useSelector(state => state.paymentTerm);

  const getPaymentTerms = useCallback(async payload => await dispatch(paymentTermSliceMethods.getPaymentTerms(payload)), [dispatch]);

  const getPaymentTermsDrop = useCallback(async payload => await dispatch(paymentTermSliceMethods.getPaymentTermsDrop(payload)), [dispatch]);

  const createPaymentTerm = useCallback(async data => await dispatch(paymentTermSliceMethods.createPaymentTerm(data)), [dispatch]);

  const updatePaymentTerm = useCallback(async ({ id, data }) => await dispatch(paymentTermSliceMethods.updatePaymentTerm({ id, data })), [dispatch]);

  const updatePaymentTermStatus = useCallback(async payload => await dispatch(paymentTermSliceMethods.updatePaymentTermStatus(payload)), [dispatch]);

  const setDefaultPaymentTerm = useCallback(async payload => await dispatch(paymentTermSliceMethods.setDefaultPaymentTerm(payload)), [dispatch]);

  const getPaymentTermById = useCallback(async payload => await dispatch(paymentTermSliceMethods.getPaymentTermById(payload)), [dispatch]);

  const removePaymentTerm = useCallback(async payload => await dispatch(paymentTermSliceMethods.removePaymentTerm(payload)), [dispatch]);

  const resetPaymentTerm = useCallback(() => dispatch(resetPaymentTermAction()), [dispatch]);

  const resetPaymentTermsDrop = useCallback(() => dispatch(resetPaymentTermsDropAction()), [dispatch]);

  return {
    paymentTerms,
    paymentTerm,
    paymentTermsDrop,
    pagination,
    create,
    update,
    remove,
    loading,
    dropLoading,
    submitLoading,
    error,
    getPaymentTerms,
    getPaymentTermsDrop,
    createPaymentTerm,
    updatePaymentTerm,
    updatePaymentTermStatus,
    setDefaultPaymentTerm,
    getPaymentTermById,
    removePaymentTerm,
    resetPaymentTerm,
    resetPaymentTermsDrop,
  };
};
