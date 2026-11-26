import { useEffect } from 'react';

// Hooks
import useAnalytics from '@/hooks/useAnalytics';

const RouteWithTitle = ({ title, children }) => {
  useAnalytics(title);

  useEffect(() => {
    document.title = title ? `${title} | ABSS Books` : 'ABSS Books';
  }, [title]);

  return children;
};

export default RouteWithTitle;
