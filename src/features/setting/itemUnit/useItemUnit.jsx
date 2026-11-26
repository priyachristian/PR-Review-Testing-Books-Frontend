import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { itemUnitSliceMethods, resetItemUnit as resetItemUnitAction, resetItemUnitsDrop as resetItemUnitsDropAction } from './itemUnit.slice';

export const useItemUnit = () => {
  const dispatch = useDispatch();

  const { itemUnits, itemUnitsDrop, pagination, create, update, loading, dropLoading, submitLoading, error } = useSelector(state => state.itemUnit);

  const getItemUnits = useCallback(async payload => await dispatch(itemUnitSliceMethods.getItemUnits(payload)), [dispatch]);

  const getItemUnitsDrop = useCallback(async payload => await dispatch(itemUnitSliceMethods.getItemUnitsDrop(payload)), [dispatch]);

  const createItemUnit = useCallback(async data => await dispatch(itemUnitSliceMethods.createItemUnit(data)), [dispatch]);

  const updateItemUnit = useCallback(async ({ id, data }) => await dispatch(itemUnitSliceMethods.updateItemUnit({ id, data })), [dispatch]);

  const resetItemUnit = useCallback(() => dispatch(resetItemUnitAction()), [dispatch]);

  const resetItemUnitsDrop = useCallback(() => dispatch(resetItemUnitsDropAction()), [dispatch]);

  return {
    itemUnits,
    itemUnitsDrop,
    pagination,
    create,
    update,
    loading,
    dropLoading,
    submitLoading,
    error,
    getItemUnits,
    getItemUnitsDrop,
    createItemUnit,
    updateItemUnit,
    resetItemUnit,
    resetItemUnitsDrop,
  };
};
