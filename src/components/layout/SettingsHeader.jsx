import { useEffect, useState } from 'react';
import { Button, Layout } from 'antd';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';

// Components
import SessionTimer from '../ui/common/SessionTimer';
import MaintenanceCountdownTimer from '../ui/common/MaintenanceCountdownTimer';

// Hooks
import { useAuth } from 'hooks/useAuth';

// Extras
import Icons from '@/assets/icons/icon';
import logo from '@/assets/images/ABSS-LOGO.png';

const { Header } = Layout;

const SettingsHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDetailPage = location.pathname !== '/setting';

  return (
    <Header className="settings-topbar-fixed px-2 sm:px-3 md:px-4 flex items-center justify-between gap-2" style={{ top: 'var(--app-top-offset, 0px)' }}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
        <NavLink to="/home" className="flex items-center h-[57px] min-w-0 px-4 border-r border-gray-200 bg-white flex-shrink-0" style={{ width: 220 }}>
          <img
            src={logo}
            alt="ABSS"
            className="object-contain transition-opacity duration-300"
            style={{
              height: isMobile ? 40 : 60,
              width: isMobile ? 140 : '100%',
            }}
          />
        </NavLink>

        {isDetailPage && (
          <button
            type="button"
            onClick={() => navigate('/setting')}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 ms-1"
          >
            <LeftOutlined style={{ fontSize: 11 }} />
          </button>
        )}

        <div className="flex items-start flex-col leading-none gap-0.5 ms-1 flex-shrink-0">
          <div className="text-[14px] text-gray-500">Settings</div>
          <div className="text-[11px] lg:text-[14px] text-gray-800 font-semibold">
            {signin?.user?.firstName} {signin?.user?.lastName}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 mr-3">
        <MaintenanceCountdownTimer variant="compact" />
        <SessionTimer />
        <Button type="default" icon={<Icons.CloseOutlined />} iconPosition="start" onClick={() => navigate('/home')}>
          Close
        </Button>
      </div>
    </Header>
  );
};

export default SettingsHeader;
