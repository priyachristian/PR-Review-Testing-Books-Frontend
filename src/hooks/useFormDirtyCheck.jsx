import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { App } from '@/components/AntDComponent';
import { UnsavedChangesModal } from '@/components/feedback/confirmModal/UnsavedChangesModal';

// Hooks
import { useFormBlocker, blockerManager } from '@/hooks/useGlobalBlocker';

/**
 * Hook to track form dirty state and handle unsaved changes warnings
 * Uses global blocker manager to coordinate with other forms
 *
 * @param {boolean} isDirty - Whether the form has unsaved changes
 * @param {Function} onReset - Optional callback to reset dirty state when user confirms leaving
 * @returns {Object} - { handleNavigation: Function to manually navigate, resetDirty: Function to reset dirty state }
 */
const useFormDirtyCheck = (isDirty, onReset) => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const isDirtyRef = useRef(isDirty);
  const resetCallbackRef = useRef(onReset);
  const formIdRef = useRef(`form-${Math.random().toString(36).substr(2, 9)}`);
  const modalInstanceRef = useRef(null);

  // Keep refs in sync
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    resetCallbackRef.current = onReset;
  }, [onReset]);

  // Register this form's dirty state with global blocker manager
  useFormBlocker(isDirty, formIdRef);

  // Handle page reload warning
  useEffect(() => {
    const handleBeforeUnload = event => {
      if (isDirtyRef.current) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Manual navigation function (for Cancel button, etc.)
  const handleNavigation = useCallback(
    path => {
      if (isDirtyRef.current) {
        modalInstanceRef.current = modal.confirm(
          UnsavedChangesModal({
            modalInstanceRef,
            onConfirm: () => {
              // Reset dirty state if callback provided
              if (resetCallbackRef.current) {
                resetCallbackRef.current();
              }
              isDirtyRef.current = false;
              // Clear the blocker manager to prevent duplicate modal from useGlobalBlocker
              blockerManager.clear();
              navigate(path);
            },
          })
        );
        return;
      }
      navigate(path);
    },
    [navigate, modal]
  );

  // Function to reset dirty state manually
  const resetDirty = useCallback(() => {
    isDirtyRef.current = false;
    if (resetCallbackRef.current) {
      resetCallbackRef.current();
    }
  }, []);

  return { handleNavigation, resetDirty, formIdRef };
};

export default useFormDirtyCheck;
