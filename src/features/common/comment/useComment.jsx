import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { commentSliceMethods } from './comment.slice';

export const useComment = () => {
  const dispatch = useDispatch();
  const { comment, submitLoading, error } = useSelector(state => state.comment);

  const addComment = useCallback(async payload => await dispatch(commentSliceMethods.addComment(payload)).unwrap(), [dispatch]);

  return {
    comment,
    submitLoading,
    error,
    addComment,
  };
};
