import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const getSidebar = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.SIDEBAR.BASE);
  return response.data;
}, 'getSidebar');

export const sidebarService = { getSidebar };
