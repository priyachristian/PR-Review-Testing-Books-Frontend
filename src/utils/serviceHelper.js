export const isCanceledRequestError = error => error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED' || error?.message === 'canceled';

// Returns an axios config fragment carrying the abort signal only when it's a valid AbortSignal.
// Use directly for a signal-only config, or spread alongside other config: { params, ...withAbortSignal(signal) }.
export const withAbortSignal = signal => (signal instanceof AbortSignal ? { signal } : {});

export const withErrorHandling =
  (fn, context = '') =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (isCanceledRequestError(error)) {
        throw error;
      }
      console.error(context ? `Error in ${context}:` : 'Error:', error);
      // If already a plain string (thrown by a nested withErrorHandling), re-throw as-is
      if (typeof error === 'string') throw error;
      throw error?.response?.data?.message || error?.message || "We couldn't complete this action. Please try again, or contact support if the problem continues.";
    }
  };
