/** True when the SPA is serving the public PDF preview (mobile WebView or Puppeteer). */
export const isPdfPreviewRoute = () => {
  try {
    return window.location.pathname.startsWith('/pdf-preview');
  } catch {
    return false;
  }
};
