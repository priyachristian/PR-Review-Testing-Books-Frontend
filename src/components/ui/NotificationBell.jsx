import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Button, Popover, Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { notificationSliceMethods } from '@/features/notifications/notification.slice';
import NotificationPanel from '@/features/notifications/components/NotificationPanel';
import { useAuth } from 'hooks/useAuth';
import { useCustomerSocket } from '@/hooks/useCustomerSocket';

const NotificationBell = ({ tooltipPlacement }) => {
  const dispatch = useDispatch();
  const { companyId } = useAuth();
  const { unreadCount } = useSelector(state => state.notifications);
  const [open, setOpen] = useState(false);

  useCustomerSocket();

  const fetchCount = useCallback(() => {
    if (companyId) {
      dispatch(notificationSliceMethods.getNotificationCount({ companyId }));
    }
  }, [companyId, dispatch]);

  // Fetch the unread count once on mount so the badge is populated immediately.
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const panelContent = <NotificationPanel onClose={() => setOpen(false)} />;

  return (
    <Popover
      content={panelContent}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      arrow={false}
      destroyTooltipOnHide
      overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      overlayStyle={{ zIndex: 1050 }}
    >
      <Tooltip title="Notifications" placement={tooltipPlacement}>
        <Badge count={unreadCount} size="small" overflowCount={99} offset={[-3, 3]} styles={{ indicator: { fontSize: 10, minWidth: 16, height: 16, lineHeight: '16px', padding: '0 4px' } }}>
          <Button
            type="text"
            size="middle"
            icon={<Icons.BellOutlined style={{ fontSize: '14px' }} className="sm:text-[16px]" />}
            className="!h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md flex items-center justify-center !text-gray-600 hover:!text-gray-900 hover:!bg-white"
          />
        </Badge>
      </Tooltip>
    </Popover>
  );
};

export default NotificationBell;
