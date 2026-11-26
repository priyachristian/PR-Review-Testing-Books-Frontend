import { useEffect, useMemo } from 'react';
import { useItemUnit } from './useItemUnit';

export const useItemUnitsDropdown = () => {
  const { itemUnitsDrop, dropLoading: itemUnitsDropLoading, getItemUnitsDrop } = useItemUnit();

  useEffect(() => {
    getItemUnitsDrop();
  }, [getItemUnitsDrop]);

  const itemUnitsOptions = useMemo(
    () =>
      (itemUnitsDrop || []).map(unit => ({
        value: unit._id || unit.id,
        label: unit.name,
        name: unit.name,
      })),
    [itemUnitsDrop]
  );

  return {
    itemUnitsDrop,
    itemUnitsDropLoading,
    itemUnitsOptions,
  };
};
