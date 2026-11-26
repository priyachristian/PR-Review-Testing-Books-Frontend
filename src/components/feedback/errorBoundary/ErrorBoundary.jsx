import React from 'react';

// Extras
import { clearFiltersForRoute, getFilterKeyForRoute } from '@/utils/filterRouteMapping';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      filtersCleared: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error caught by ErrorBoundary:', error, info);

    // Auto-reload on chunk load failure (happens after deployment when cached HTML references old chunks)
    const isChunkLoadError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      const CHUNK_ERROR_KEY = 'chunkLoadErrorReloadAttempted';
      const attempted = sessionStorage.getItem(CHUNK_ERROR_KEY);
      if (!attempted) {
        sessionStorage.setItem(CHUNK_ERROR_KEY, '1');
        window.location.reload();
        return;
      }
    }

    // Get current route pathname
    const pathname = window.location.pathname;

    // Try to clear filters for the current page
    const filterKey = getFilterKeyForRoute(pathname);

    if (filterKey) {
      const cleared = clearFiltersForRoute(pathname);

      if (cleared) {
        console.log(`Successfully cleared filters for page: ${pathname}`);
        this.setState({
          filtersCleared: true,
        });
      }
    } else {
      console.log(`No filters configured for route: ${pathname}`);
    }
  }

  render() {
    if (this.state.hasError) {
      // Clone the fallback element and pass additional props
      return React.cloneElement(this.props.fallback, {
        filtersCleared: this.state.filtersCleared,
      });
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
