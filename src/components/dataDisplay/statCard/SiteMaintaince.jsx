import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import logo from '@/assets/images/ABSS-LOGO.png';

const SiteMaintaince = () => {
  const { isMaintenanceModeActive, maintenanceModeMessage, tokenLoading } = useMaintenanceMode();

  const fallbackMessage = 'Our website is currently undergoing scheduled maintenance to bring you a better experience. We appreciate your patience and understanding';

  if (tokenLoading && !isMaintenanceModeActive) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <img src={logo} alt="logo" className="w-[150px] animate-bounce" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="flex flex-col items-center text-center max-w-2xl">
        <div>
          <img src={logo} alt="logo" className="h-[80px]" />
        </div>

        <h1 className="text-3xl font-bold mb-6 text-black">🚧 We'll Be Back Soon!</h1>
        <p className="text-lg font-medium mb-6 text-black">{isMaintenanceModeActive && maintenanceModeMessage ? maintenanceModeMessage : fallbackMessage}</p>
        <p className="text-lg font-bold text-black">— The ABSS Team</p>
      </div>
    </div>
  );
};

export default SiteMaintaince;
