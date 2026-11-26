import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sidebarSliceMethods } from '@/features/common/sidebar/sidebarSlice';

export const useSidebar = () => {
  const dispatch = useDispatch();

  const { sidebarDrop, sideloading, error } = useSelector(state => state.sidebar);

  const getSidebar = useCallback(async payload => await dispatch(sidebarSliceMethods.getSidebar(payload)), [dispatch]);

  return { sidebarDrop, sideloading, error, getSidebar };
};
