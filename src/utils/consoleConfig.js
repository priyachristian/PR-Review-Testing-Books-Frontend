/**
 * Global console config: suppress console.log, console.error, and console.warn
 * in production so dev logs don't appear for end users.
 * Import this once at app entry (e.g. index.js) before any other code.
 */
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  const noop = () => {};
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = noop;
  console.error = noop;
  console.warn = noop;

  // Optional: keep a way to restore for debugging (e.g. in browser console)
  if (typeof window !== 'undefined') {
    window.__restoreConsole = () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }
}
