import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { divisionSliceMethods, resetDivision as resetDivisionAction, resetDivisionList as resetDivisionListAction } from './division.slice';

export const useDivision = () => {
  const dispatch = useDispatch();

  const { division, singleDivision, pagination, loading, submitLoading, deleteLoading } = useSelector(state => state.division);

  const getDivision = useCallback(
    async payload => {
      return await dispatch(divisionSliceMethods.getDivision(payload));
    },
    [dispatch]
  );

  const createDivision = useCallback(
    async divisionData => {
      return await dispatch(divisionSliceMethods.createDivision(divisionData)).unwrap();
    },
    [dispatch]
  );

  const updateDivision = useCallback(
    async ({ divisionId, divisionData }) => {
      return await dispatch(divisionSliceMethods.updateDivision({ divisionId, divisionData })).unwrap();
    },
    [dispatch]
  );

  const getDivisionById = useCallback(
    async payload => {
      return await dispatch(divisionSliceMethods.getDivisionById(payload));
    },
    [dispatch]
  );
  const resetDivision = useCallback(() => dispatch(resetDivisionAction()), [dispatch]);
  const resetDivisionList = useCallback(() => dispatch(resetDivisionListAction()), [dispatch]);
  const toggleDivisionStatus = useCallback(
    async payload => {
      return await dispatch(divisionSliceMethods.toggleDivisionStatus(payload));
    },
    [dispatch]
  );

  return {
    division,
    singleDivision,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    getDivision,
    createDivision,
    updateDivision,
    getDivisionById,
    resetDivision,
    resetDivisionList,
    toggleDivisionStatus,
  };
};
