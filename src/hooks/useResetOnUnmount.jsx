import { useEffect } from 'react';

export const useResetOnUnmount = resetFns => {
  useEffect(() => {
    return () => {
      const functions = Array.isArray(resetFns) ? resetFns : [resetFns];
      functions.forEach(fn => {
        if (typeof fn === 'function') {
          fn();
        }
      });
    };
  }, []);
};

// // example :
// // useResetOnUnmount(() => resetAnalytics());
// // " OR "
// // useResetOnUnmount([() => resetAnalytics(), () => resetOther()]);
