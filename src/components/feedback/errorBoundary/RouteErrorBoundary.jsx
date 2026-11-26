import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import ErrorFallback from './ErrorFallback';

const RouteErrorBoundary = () => {
  const error = useRouteError();

  useEffect(() => {
    const isChunkLoadError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError' ||
      (error?.stack && error.stack.includes('Failed to fetch dynamically imported module'));

    if (isChunkLoadError) {
      const CHUNK_ERROR_KEY = 'chunkLoadErrorReloadAttempted';
      const attempted = sessionStorage.getItem(CHUNK_ERROR_KEY);

      if (!attempted) {
        sessionStorage.setItem(CHUNK_ERROR_KEY, '1');
        window.location.reload();
      }
    }

    console.error('Route error caught:', error);
  }, [error]);

  // For chunk errors that are about to reload, we can show a simple loading state or nothing
  const isChunkLoadError =
    error?.message?.includes('Failed to fetch dynamically imported module') || error?.message?.includes('Loading chunk') || error?.message?.includes('Importing a module script failed');

  if (isChunkLoadError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Updating application...</p>
      </div>
    );
  }

  return <ErrorFallback />;
};

export default RouteErrorBoundary;
