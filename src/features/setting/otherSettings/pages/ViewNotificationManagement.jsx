import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal } from 'antd';

import { Card, Switch, Tooltip } from '@/components/AntDComponent';

import Icons from 'assets/icons/icon';
import { notificationSliceMethods } from '@/features/notifications/notification.slice';
import { PERMISSION_STATUS } from '@/utils/notificationPermission';

const ViewNotificationManagement = () => {
  const dispatch = useDispatch();
  const { isNotificationEnabled, preferenceLoading, systemPermissionStatus, permissionSyncing } = useSelector(state => state.notifications);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const isBlocked = systemPermissionStatus === PERMISSION_STATUS.BLOCKED;

  useEffect(() => {
    dispatch(notificationSliceMethods.getNotificationPreference());
  }, [dispatch]);

  const handleNotificationToggle = async checked => {
    if (!checked) {
      dispatch(notificationSliceMethods.updateNotificationPreference({ isNotificationEnabled: false }));
      return;
    }
    if ('Notification' in window && Notification.permission === 'denied') {
      setShowBlockedModal(true);
      return;
    }
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {
        /* ignore permission request failures */
      }
    }
    dispatch(notificationSliceMethods.enableNotificationsWithPermission());
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex items-center gap-3">
          <div className="bg-[#1677ff1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
            <Icons.BellOutlined className="text-[#1677ff] items-center text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Notification Management</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Control whether you receive real-time, push, and in-app notifications</p>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 shadow-sm">
        {isBlocked && (
          <div className="flex flex-col gap-2 rounded-lg border p-3 mb-4" style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
            <div className="flex items-center gap-2">
              <Icons.ExclamationCircleOutlined style={{ color: '#d48806', fontSize: 15 }} />
              <span className="font-semibold text-sm" style={{ color: '#d48806' }}>
                Notifications Blocked by Browser
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">Chrome has blocked notifications for this site. To re-enable:</p>
            <ol className="text-xs text-gray-600 leading-relaxed list-decimal list-inside space-y-1">
              <li>
                Click the <strong>🔒 lock icon</strong> in your browser&apos;s address bar
              </li>
              <li>
                Find <strong>Notifications</strong> and set it to <strong>Allow</strong>
              </li>
              <li>Reload the page</li>
            </ol>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[#030711] leading-tight">Enable Notifications</p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {isBlocked
                ? 'Blocked by Chrome — follow the steps above to re-enable'
                : isNotificationEnabled
                  ? 'You are currently receiving real-time and push notifications.'
                  : 'Notifications are disabled. You will not receive any real-time or push alerts.'}
            </p>
          </div>
          <Tooltip title={isBlocked ? 'Notifications blocked by browser' : isNotificationEnabled ? 'Disable notifications' : 'Enable notifications'}>
            <Switch checked={isNotificationEnabled && !isBlocked} loading={preferenceLoading || permissionSyncing} onChange={handleNotificationToggle} checkedChildren="On" unCheckedChildren="Off" />
          </Tooltip>
        </div>
      </Card>

      <Modal
        open={showBlockedModal}
        onCancel={() => setShowBlockedModal(false)}
        footer={
          <Button type="primary" onClick={() => setShowBlockedModal(false)}>
            Got it
          </Button>
        }
        title={
          <div className="flex items-center gap-2">
            <Icons.ExclamationCircleOutlined style={{ color: '#d48806', fontSize: 17 }} />
            <span>Notifications Blocked by Chrome</span>
          </div>
        }
        centered
        width={420}
      >
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Chrome has permanently blocked notifications for this site. The browser permission dialog cannot be opened — you need to re-enable it manually:
        </p>
        <ol className="space-y-3">
          {[
            {
              n: 1,
              text: (
                <span>
                  Click the <strong>🔒 lock icon</strong> in your browser&apos;s address bar
                </span>
              ),
            },
            {
              n: 2,
              text: (
                <span>
                  Find <strong>Notifications</strong> and set it to <strong>Allow</strong>
                </span>
              ),
            },
            {
              n: 3,
              text: (
                <span>
                  Press <kbd className="px-1 py-0.5 rounded border border-gray-300 text-xs font-mono bg-gray-50">F5</kbd> or click the browser&apos;s reload button
                </span>
              ),
            },
          ].map(s => (
            <li key={s.n} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#d48806' }}>
                {s.n}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{s.text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-lg p-3 text-xs text-gray-500 leading-relaxed" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          💡 After clicking Allow and reloading, come back here and turn the toggle ON.
        </div>
      </Modal>
    </div>
  );
};

export default ViewNotificationManagement;
