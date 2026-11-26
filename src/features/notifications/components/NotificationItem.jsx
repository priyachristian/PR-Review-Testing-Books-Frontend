import Icons from 'assets/icons/icon';
import { getNotificationRoute } from '../utils/notificationNavigator';
import { formatTimeAgo } from '../utils/notification.utils';
import { colorPalette } from 'utils/theme';

const DETAIL_VALUE_CLASS = 'text-[13px] font-medium text-gray-900 leading-5';
const DETAIL_SECONDARY_CLASS = 'text-[13px] text-gray-600 leading-5';
const DETAIL_META_CLASS = 'text-[11px] text-gray-500';

const NotificationItem = ({ notification, onClick }) => {
  const isNavigable = !!getNotificationRoute(notification);

  return (
    <div
      role={isNavigable ? 'button' : undefined}
      tabIndex={isNavigable ? 0 : undefined}
      onClick={() => onClick(notification)}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && isNavigable) {
          e.preventDefault();
          onClick(notification);
        }
      }}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
        isNavigable ? 'cursor-pointer hover:bg-blue-50/60' : 'cursor-default'
      } ${!notification.isRead ? 'bg-blue-50/30' : 'bg-white'}`}
    >
      <div className="flex-shrink-0 mt-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: notification.isRead ? colorPalette.neutral[300] : colorPalette.primary[500] }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`${DETAIL_VALUE_CLASS} truncate ${notification.isRead ? 'font-medium text-gray-700' : 'font-semibold'}`}>{notification.title}</p>
        <p className={`${DETAIL_SECONDARY_CLASS} line-clamp-2 mt-0.5`}>{notification.body}</p>
        <span className={`${DETAIL_META_CLASS} mt-1 block`}>{formatTimeAgo(notification.createdAt, notification.id)}</span>
      </div>

      {isNavigable && (
        <div className="flex-shrink-0 mt-1">
          <Icons.RightOutlined style={{ fontSize: 10, color: colorPalette.neutral[400] }} />
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
