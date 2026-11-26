import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Extras
import { trackPageView } from '@/utils/ga4Config';

const useAnalytics = title => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`, title);
  }, [location.pathname, location.search, title]);
};

export default useAnalytics;
