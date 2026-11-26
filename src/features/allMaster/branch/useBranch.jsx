import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { branchSliceMethods, resetBranch as resetBranchAction, resetBranchList as resetBranchListAction } from './branch.slice';

export const useBranch = () => {
  const dispatch = useDispatch();

  const { branch, singleBranch, divDrop, allBranchDrop, pagination, loading, submitLoading, deleteLoading, droploading } = useSelector(state => state.branch);

  const getBranch = useCallback(
    async payload => {
      return await dispatch(branchSliceMethods.getBranch(payload));
    },
    [dispatch]
  );

  const getDivDropDown = useCallback(
    async payload => {
      return await dispatch(branchSliceMethods.getDivDropDown(payload));
    },
    [dispatch]
  );

  const updateBranch = useCallback(
    async ({ branchId, branchData }) => {
      return await dispatch(branchSliceMethods.updateBranch({ branchId, branchData })).unwrap();
    },
    [dispatch]
  );

  const createBranch = useCallback(
    async branchData => {
      return await dispatch(branchSliceMethods.createBranch(branchData)).unwrap();
    },
    [dispatch]
  );

  const getBranchById = useCallback(
    async payload => {
      return await dispatch(branchSliceMethods.getBranchById(payload));
    },
    [dispatch]
  );

  const resetBranch = useCallback(() => dispatch(resetBranchAction()), [dispatch]);
  const resetBranchList = useCallback(() => dispatch(resetBranchListAction()), [dispatch]);
  const toggleBranchStatus = useCallback(
    async payload => {
      return await dispatch(branchSliceMethods.toggleBranchStatus(payload));
    },
    [dispatch]
  );

  const getAllBranchDropDown = useCallback(
    async payload => {
      return await dispatch(branchSliceMethods.getAllBranchDropDown(payload));
    },
    [dispatch]
  );

  return {
    branch,
    singleBranch,
    divDrop,
    allBranchDrop,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    getBranch,
    getDivDropDown,
    updateBranch,
    createBranch,
    getBranchById,
    resetBranch,
    resetBranchList,
    toggleBranchStatus,
    getAllBranchDropDown,
  };
};
