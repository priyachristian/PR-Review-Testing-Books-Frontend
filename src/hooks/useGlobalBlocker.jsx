import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';

// Components
import { App } from '@/components/AntDComponent';
import { UnsavedChangesModal } from '@/components/feedback/confirmModal/UnsavedChangesModal';

// Global blocker manager - singleton pattern
class BlockerManager {
  constructor() {
    this.dirtyForms = new Set();
    this.listeners = new Set();
  }

  register(formId) {
    this.dirtyForms.add(formId);
    this.notifyListeners();
  }

  unregister(formId) {
    this.dirtyForms.delete(formId);
    this.notifyListeners();
  }

  isAnyDirty() {
    return this.dirtyForms.size > 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    const isDirty = this.isAnyDirty();
    this.listeners.forEach(listener => listener(isDirty));
  }

  clear() {
    this.dirtyForms.clear();
    this.notifyListeners();
  }
}

const blockerManager = new BlockerManager();

// Export blockerManager so forms can directly clear it when needed
export { blockerManager };

// Hook to use the global blocker
export const useGlobalBlocker = () => {
  const { modal } = App.useApp();
  const [isAnyFormDirty, setIsAnyFormDirty] = useState(false);
  const blockerStateRef = useRef(null);
  const modalInstanceRef = useRef(null);

  // Subscribe to global dirty state
  useEffect(() => {
    const unsubscribe = blockerManager.subscribe(setIsAnyFormDirty);
    setIsAnyFormDirty(blockerManager.isAnyDirty());
    return unsubscribe;
  }, []);

  // Create single blocker that checks global state
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isAnyFormDirty && currentLocation.pathname !== nextLocation.pathname);

  // Handle blocked navigation
  useEffect(() => {
    // If blocker is blocked but no forms are dirty, automatically proceed
    if (blocker.state === 'blocked' && !isAnyFormDirty) {
      blockerStateRef.current = null;
      blocker.proceed();
      return;
    }

    if (blocker.state === 'blocked' && blockerStateRef.current !== 'blocked') {
      blockerStateRef.current = 'blocked';

      modalInstanceRef.current = modal.confirm(
        UnsavedChangesModal({
          modalInstanceRef,
          onConfirm: () => {
            blockerManager.clear();
            blockerStateRef.current = null;
            blocker.proceed();
          },
          onCancel: () => {
            blockerStateRef.current = null;
            blocker.reset();
          },
        })
      );
    } else if (blocker.state !== 'blocked') {
      blockerStateRef.current = null;
    }
  }, [blocker, modal, isAnyFormDirty]);

  return { blockerManager };
};

// Hook for individual forms to register their dirty state
export const useFormBlocker = (isDirty, formIdRef) => {
  useEffect(() => {
    if (!formIdRef?.current) return;

    const formId = formIdRef.current;

    if (isDirty) {
      blockerManager.register(formId);
    } else {
      blockerManager.unregister(formId);
    }

    return () => {
      blockerManager.unregister(formId);
    };
  }, [isDirty, formIdRef]);
};

export default useGlobalBlocker;
