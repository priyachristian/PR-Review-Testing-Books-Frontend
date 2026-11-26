import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icons from 'assets/icons/icon';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import { notificationSliceMethods, resetNotifications } from '../notification.slice';
import { getNotificationRoute } from '../utils/notificationNavigator';
import { useAuth } from 'hooks/useAuth';
import { colorPalette } from 'utils/theme';
import NotificationItem from './NotificationItem';
import { SkeletonList } from './NotificationItemSkeleton';

const DETAIL_VALUE_CLASS = 'text-[13px] font-medium text-gray-900 leading-5';
const DETAIL_META_CLASS = 'text-[11px] text-gray-500';

const NotificationPanel = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { notifications, loading, scrollLoading, pagination } = useSelector(state => state.notifications);
  const isFetchingRef = useRef(false);

  const loadNotifications = useCallback(
    (page = 1) => {
      if (companyId) {
        dispatch(notificationSliceMethods.getNotifications({ companyId, page, limit: 10 }));
      }
    },
    [companyId, dispatch]
  );

  useEffect(() => {
    if (!companyId) return;
    dispatch(resetNotifications());
    dispatch(notificationSliceMethods.getNotifications({ companyId, page: 1, limit: 10 })).then(() => {
      dispatch(notificationSliceMethods.markAllAsRead({ companyId }));
    });
  }, []);

  useEffect(() => {
    if (!loading && !scrollLoading) {
      isFetchingRef.current = false;
    }
  }, [loading, scrollLoading]);

  const handleScroll = useCallback(
    e => {
      if (isFetchingRef.current || loading || scrollLoading) return;
      if (pagination.page >= pagination.totalPages) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 80) {
        isFetchingRef.current = true;
        loadNotifications(pagination.page + 1);
      }
    },
    [loading, scrollLoading, pagination, loadNotifications]
  );

  const handleNotificationClick = notification => {
    const route = getNotificationRoute(notification);
    onClose();
    if (route) {
      navigate(`/${route}`);
    }
  };

  const hasMore = pagination.page < pagination.totalPages;

  return (
    <div style={{ width: 380, maxWidth: '95vw' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ background: colorPalette.neutral[50] }}>
        <div className="flex items-center gap-2">
          <Icons.BellOutlined style={{ fontSize: 15, color: colorPalette.primary[500] }} />
          <span className="text-[14px] font-semibold text-gray-900">Notifications</span>
          {pagination.totalResults > 0 && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: colorPalette.primary[50], color: colorPalette.primary[600] }}>
              {pagination.totalResults}
            </span>
          )}
        </div>
        <CloseIconButton onClick={onClose} />
      </div>

      <div onScroll={handleScroll} style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading && notifications.length === 0 ? (
          <SkeletonList count={5} />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: colorPalette.neutral[100] }}>
              <Icons.BellOutlined style={{ fontSize: 20, color: colorPalette.neutral[400] }} />
            </div>
            <p className={DETAIL_VALUE_CLASS}>No notifications yet</p>
            <p className={`${DETAIL_META_CLASS} mt-1 text-center`}>You&apos;re all caught up</p>
          </div>
        ) : (
          <>
            {notifications.map(notification => (
              <NotificationItem key={notification.id} notification={notification} onClick={handleNotificationClick} />
            ))}
            {scrollLoading && <SkeletonList count={3} />}
            {!hasMore && !scrollLoading && notifications.length > 0 && (
              <div className="flex justify-center py-3 border-t border-gray-50">
                <span className={DETAIL_META_CLASS}>All caught up</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
