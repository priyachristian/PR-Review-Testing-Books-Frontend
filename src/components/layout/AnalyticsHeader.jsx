import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Layout, Tooltip } from 'antd';

// Components
import SessionTimer from '../ui/common/SessionTimer';
import MaintenanceCountdownTimer from '../ui/common/MaintenanceCountdownTimer';
import SplitSessionPinVerify from '@/features/setting/components/SplitSessionPinVerify';

// Hooks
import { useAuth } from 'hooks/useAuth';
import { getRealtimeSocket, onRealtimeSocketChange } from '@/hooks/realtimeSocket';

// Extras
import Icons from '@/assets/icons/icon';
import logo from '@/assets/images/ABSS-LOGO.png';
import { COMPANY_FEATURE } from 'utils/constants';
import { endSplitSession } from 'features/common/commonSlice';

const { Header } = Layout;

const AnalyticsHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const { signin, setIsViewOnly } = useAuth();
  const [showVerifySessionPinModal, setShowVerifySessionPinModal] = useState(false);

  const isSplitWise = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE);

  const handleCloseVerifySessionPinModal = () => {
    setShowVerifySessionPinModal(false);
  };

  const handleActiveSession = () => {
    setShowVerifySessionPinModal(true);
  };

  const handleDeactivateSession = () => {
    dispatch(endSplitSession());
  };

  useEffect(() => {
    const attach = socket => {
      if (!socket) return undefined;

      const handleSubscription = payload => {
        if (!payload?.canLoggedIn && payload?.status === 'inactive') {
          window.location.href = import.meta.env.VITE_ACCOUNT_URL;
        } else if (payload?.canLoggedIn && payload?.status === 'inactive') {
          setIsViewOnly(true);
        } else if (payload?.canLoggedIn && payload?.status !== 'inactive') {
          setIsViewOnly(false);
        }
      };

      socket.on('SUBSCRIPTION', handleSubscription);
      return () => socket.off('SUBSCRIPTION', handleSubscription);
    };

    let detach = attach(getRealtimeSocket());
    const unsubscribe = onRealtimeSocketChange(socket => {
      detach?.();
      detach = attach(socket);
    });

    return () => {
      detach?.();
      unsubscribe();
    };
  }, [setIsViewOnly]);

  return (
    <>
      <Header className="bg-white pe-4  h-[57px] sm:pe-6 p-0 flex items-center justify-between sticky top-0 z-20 w-full shadow-sm border-b border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          <NavLink to="/home" className="flex items-center h-[57px] min-w-0 px-4 border-r border-gray-200 bg-white flex-shrink-0" style={{ width: 220 }}>
            <img src={logo} alt="ABSS" className="object-contain transition-opacity duration-300" style={{ height: 60, width: '100%' }} />
          </NavLink>

          <div className="flex items-start flex-col leading-none gap-0.5 ms-1 flex-shrink-0">
            <div className="text-[13px] font-semibold text-gray-800">All Analytics</div>
            <div className="text-[11px] text-gray-500">
              {signin?.user?.firstName} {signin?.user?.lastName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
          <MaintenanceCountdownTimer variant="compact" />
          <SessionTimer />
          {isSplitWise && (
            <Tooltip title={isSplitSessionActive ? 'Deactivate Session' : 'Activate Session'}>
              <Button type="default" icon={<Icons.PoweroffOutlined />} onClick={isSplitSessionActive ? handleDeactivateSession : handleActiveSession} className="sm:flex items-center">
                {isSplitSessionActive ? 'Deactivate Session' : 'Active Session'}
              </Button>
            </Tooltip>
          )}
          <Button type="default" icon={<Icons.CloseOutlined />} iconPosition="start" onClick={() => navigate('/home')}>
            Close Analytics
          </Button>
        </div>
      </Header>
      {showVerifySessionPinModal && <SplitSessionPinVerify modalOpen={showVerifySessionPinModal} handleModalClose={handleCloseVerifySessionPinModal} />}
    </>
  );
};

export default AnalyticsHeader;
