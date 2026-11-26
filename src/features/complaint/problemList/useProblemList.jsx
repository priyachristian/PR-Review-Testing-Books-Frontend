import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { problemListSliceMethods, resetProblemList as resetProblemListAction, resetProblemDetail as resetProblemDetailAction } from './problemList.slice';

export const useProblemList = () => {
  const dispatch = useDispatch();

  const { tree, problem, create, update, remove, loading, submitLoading, deleteLoading, error, message } = useSelector(state => state.problemList);

  const getProblemList = useCallback(payload => dispatch(problemListSliceMethods.getProblemList(payload)), [dispatch]);

  const getProblemListById = useCallback(payload => dispatch(problemListSliceMethods.getProblemListById(payload)), [dispatch]);

  const createProblemList = useCallback(data => dispatch(problemListSliceMethods.createProblemList(data)).unwrap(), [dispatch]);

  const updateProblemList = useCallback(({ id, data }) => dispatch(problemListSliceMethods.updateProblemList({ id, data })).unwrap(), [dispatch]);

  const deleteProblemList = useCallback(payload => dispatch(problemListSliceMethods.deleteProblemList(payload)).unwrap(), [dispatch]);

  const resetProblemList = useCallback(() => dispatch(resetProblemListAction()), [dispatch]);

  const resetProblemDetail = useCallback(() => dispatch(resetProblemDetailAction()), [dispatch]);

  return {
    tree,
    problem,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    error,
    message,
    getProblemList,
    getProblemListById,
    createProblemList,
    updateProblemList,
    deleteProblemList,
    resetProblemList,
    resetProblemDetail,
  };
};
