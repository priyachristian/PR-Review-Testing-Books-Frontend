import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Components
import { App as AntdApp } from '@/components/AntDComponent';
import ErrorBoundary from '@/components/feedback/errorBoundary/ErrorBoundary';
import ErrorFallback from '@/components/feedback/errorBoundary/ErrorFallback';
import ThemeProvider from '@/components/ui/common/ThemeProvider';
import App from './App';

// Extras
import { setAxiosStore } from './app/axiosConfig';
import { persistor, store } from './app/store';
import { colorPalette } from './utils/theme';
import { initGA4 } from './utils/ga4Config';
import { isPdfPreviewRoute } from './utils/pdfPreviewRoute';
import '@/styles/index.css';
import '@/styles/Custom.css';
import './utils/consoleConfig';

setAxiosStore(store);
initGA4();
document.documentElement.style.setProperty('--primary-500', colorPalette.primary[500]);
document.documentElement.style.setProperty('--primary-600', colorPalette.primary[600]);
document.documentElement.style.setProperty('--heading', colorPalette.heading);

const root = ReactDOM.createRoot(document.getElementById('root'));

// Puppeteer PDF generation must not wait on redux-persist rehydration.
const appTree = (
  <ThemeProvider>
    <AntdApp>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <App />
      </ErrorBoundary>
    </AntdApp>
  </ThemeProvider>
);

root.render(
  <Provider store={store}>
    {isPdfPreviewRoute() ? (
      appTree
    ) : (
      <PersistGate loading={null} persistor={persistor}>
        {appTree}
      </PersistGate>
    )}
  </Provider>
);
