import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const getNotificationCount = withErrorHandling(async ({ companyId }) => {
  const response = await axiosConfig.get(API_ROUTES.NOTIFICATION.COUNT, {
    params: { companyId },
  });
  return response.data;
}, 'getNotificationCount');

const getNotifications = withErrorHandling(async ({ companyId, page = 1, limit = 15 }) => {
  const response = await axiosConfig.get(API_ROUTES.NOTIFICATION.LIST, {
    params: { companyId, page, limit },
  });
  return response.data;
}, 'getNotifications');

const getNotificationPreference = withErrorHandling(async ({ deviceId } = {}) => {
  const response = await axiosConfig.get(API_ROUTES.NOTIFICATION.PREFERENCE, {
    params: { deviceId },
  });
  return response.data;
}, 'getNotificationPreference');

const updateNotificationPreference = withErrorHandling(async ({ isNotificationEnabled, deviceId }) => {
  const response = await axiosConfig.patch(API_ROUTES.NOTIFICATION.PREFERENCE, { isNotificationEnabled, deviceId });
  return response.data;
}, 'updateNotificationPreference');

const markAllAsRead = withErrorHandling(async ({ companyId }) => {
  const response = await axiosConfig.patch(API_ROUTES.NOTIFICATION.MARK_ALL_READ, undefined, {
    params: { companyId },
  });
  return response.data;
}, 'markAllAsRead');

export const notificationService = {
  getNotificationCount,
  getNotifications,
  getNotificationPreference,
  updateNotificationPreference,
  markAllAsRead,
};
