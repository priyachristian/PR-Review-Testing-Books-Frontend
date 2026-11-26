import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { directTaxSliceMethods, resetTaxSections as resetTaxSectionsAction } from './directTax.slice';

export const useDirectTax = () => {
  const dispatch = useDispatch();

  const { taxes, pagination, sections, taxesDrop, loading, droploading, submitLoading, error } = useSelector(state => state.directTax);

  const getTaxes = useCallback(async payload => await dispatch(directTaxSliceMethods.getTaxes(payload)), [dispatch]);

  const getTaxSections = useCallback(async payload => await dispatch(directTaxSliceMethods.getTaxSections(payload)), [dispatch]);

  const getTaxesDropdown = useCallback(async payload => await dispatch(directTaxSliceMethods.getTaxesDropdown(payload)), [dispatch]);

  const createTax = useCallback(async data => await dispatch(directTaxSliceMethods.createTax(data)), [dispatch]);

  const updateTax = useCallback(async ({ id, data }) => await dispatch(directTaxSliceMethods.updateTax({ id, data })), [dispatch]);

  const updateTaxStatus = useCallback(async payload => await dispatch(directTaxSliceMethods.updateTaxStatus(payload)), [dispatch]);

  const removeTax = useCallback(async payload => await dispatch(directTaxSliceMethods.removeTax(payload)), [dispatch]);

  const resetTaxSections = useCallback(() => dispatch(resetTaxSectionsAction()), [dispatch]);

  return {
    taxes,
    pagination,
    sections,
    taxesDrop,
    loading,
    droploading,
    submitLoading,
    error,
    getTaxes,
    getTaxSections,
    getTaxesDropdown,
    createTax,
    updateTax,
    updateTaxStatus,
    removeTax,
    resetTaxSections,
  };
};
