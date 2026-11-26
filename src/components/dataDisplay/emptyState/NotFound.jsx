import { Link, useNavigate } from 'react-router-dom';
import Icons from '@/assets/icons/icon';
import logo from '@/assets/images/ABSS-LOGO.png';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-xl text-center">
        <Link to="/home" className="inline-block mb-8">
          <img src={logo} alt="ABSS" className="h-10 w-auto object-contain" />
        </Link>

        <h1 className="text-7xl sm:text-8xl font-bold mb-3" style={{ color: colorPalette.primary[500] }}>
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Oops! This page doesn't exist.</h2>
        <p className="text-sm sm:text-base text-slate-500 leading-6 max-w-md mx-auto mb-8">The page you're looking for may have been moved, deleted, or the link might be incorrect.</p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <CustomButton text="Go to Dashboard" type="primary" size="large" icon={<Icons.HomeOutlined />} onClick={() => navigate(ADMIN_ROUTE_PATHS.home)} />

          <CustomButton text="Visit ABSS Website" type="default" size="large" icon={<Icons.GlobalOutlined />} href="https://abss.ai" target="_blank" rel="noopener noreferrer" />
        </div>

        <div className="mt-7">
          <CustomButton text="Go back to previous page" type="text" icon={<Icons.ArrowLeftOutlined />} onClick={() => navigate(-1)} className="custom-button-plain" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
