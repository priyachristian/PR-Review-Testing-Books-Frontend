import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import useFormDirtyCheck from '@/hooks/useFormDirtyCheck';
import { blockerManager } from '@/hooks/useGlobalBlocker';

/**
 * Comprehensive hook that manages form dirty state and navigation blocking
 * Combines form value tracking, dirty state detection, and navigation blocking
 *
 * @param {Object} initialValues - The initial form values to compare against
 * @param {Array<string>|Function} options - Optional. Can be:
 *   - An array of field names to ignore when checking for dirty state (e.g., ['paymentId', 'paymentDate'])
 *   - A function to determine if form should be considered dirty: (currentValues, initialValues) => boolean
 * @returns {Object} - {
 *   isFormDirty: boolean,
 *   handleNavigation: Function to manually navigate (for Cancel button, etc.),
 *   resetDirty: Function to reset dirty state,
 *   navigateAfterSave: Function to navigate after successful save (bypasses blocker),
 *   updateFormValues: Function to update form values (call in Formik render)
 * }
 */
const useFormDirtyState = (initialValues, options = null) => {
  const navigate = useNavigate();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const initialValuesRef = useRef(null);
  const prevValuesStringRef = useRef('');
  const prevInitialValuesStringRef = useRef('');
  const isNavigatingAfterSaveRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update initial values ref when they actually change (content-wise, not just reference)
  useEffect(() => {
    try {
      const currentInitialValuesString = JSON.stringify(initialValues);
      // Only update if the actual content changed, not just the object reference
      if (currentInitialValuesString !== prevInitialValuesStringRef.current) {
        prevInitialValuesStringRef.current = currentInitialValuesString;
        initialValuesRef.current = initialValues;
        // Reset dirty state when initial values actually change (e.g., data loaded)
        setIsFormDirty(false);
        // Also reset form values to prevent stale comparisons
        setFormValues(null);
        // Reset navigation flag when initial values change (form reset or data reload)
        isNavigatingAfterSaveRef.current = false;
      }
    } catch (error) {
      // If JSON.stringify fails (e.g., circular reference), fall back to reference comparison
      if (initialValues !== initialValuesRef.current) {
        initialValuesRef.current = initialValues;
        setIsFormDirty(false);
        setFormValues(null);
        // Reset navigation flag when initial values change (form reset or data reload)
        isNavigatingAfterSaveRef.current = false;
      }
    }
  }, [initialValues]);

  // Helper function to exclude fields from object
  const excludeFields = (obj, fieldsToIgnore) => {
    if (!fieldsToIgnore || fieldsToIgnore.length === 0) return obj;
    const result = { ...obj };
    fieldsToIgnore.forEach(field => {
      delete result[field];
    });
    return result;
  };

  // Helper function to normalize null and undefined to be treated as the same
  const normalizeValue = val => {
    // Treat null and undefined as the same (both mean "not set")
    if (val === null || val === undefined) {
      return null;
    }
    return val;
  };

  // Helper function to normalize an object's values
  // Also ensures all keys from both objects are present (missing keys become null)
  const normalizeObject = (obj, allKeys = null) => {
    // Handle null/undefined objects
    if (!obj) {
      // If we have keys to process, create object with all keys as null
      if (allKeys && allKeys.length > 0) {
        const normalized = {};
        allKeys.forEach(key => {
          normalized[key] = null;
        });
        return normalized;
      }
      return obj;
    }
    const normalized = {};
    const keysToProcess = allKeys || Object.keys(obj);
    keysToProcess.forEach(key => {
      // If key doesn't exist in obj, treat it as null/undefined and normalize to null
      normalized[key] = normalizeValue(obj[key]);
    });
    return normalized;
  };

  // Track form dirty state - check when form values change
  useEffect(() => {
    if (formValues && initialValuesRef.current) {
      let isDirty;

      // Check if options is a function (custom dirty check)
      if (options && typeof options === 'function') {
        isDirty = options(formValues, initialValuesRef.current);
      }
      // Check if options is an array (fields to ignore)
      else if (Array.isArray(options) && options.length > 0) {
        // Exclude ignored fields from comparison
        const currentValuesFiltered = excludeFields(formValues, options);
        const initialValuesFiltered = excludeFields(initialValuesRef.current, options);
        // Get all keys from both objects to ensure consistent normalization
        const allKeys = new Set([...Object.keys(currentValuesFiltered || {}), ...Object.keys(initialValuesFiltered || {})]);
        // Normalize null/undefined values before comparison (using all keys)
        const currentNormalized = normalizeObject(currentValuesFiltered, Array.from(allKeys));
        const initialNormalized = normalizeObject(initialValuesFiltered, Array.from(allKeys));
        // Compare the filtered and normalized values
        isDirty = JSON.stringify(currentNormalized) !== JSON.stringify(initialNormalized);
      }
      // Default: compare all fields
      else {
        // Get all keys from both objects to ensure consistent normalization
        const allKeys = new Set([...Object.keys(formValues || {}), ...Object.keys(initialValuesRef.current || {})]);
        // Normalize null/undefined values before comparison (using all keys)
        const currentNormalized = normalizeObject(formValues, Array.from(allKeys));
        const initialNormalized = normalizeObject(initialValuesRef.current, Array.from(allKeys));
        isDirty = JSON.stringify(currentNormalized) !== JSON.stringify(initialNormalized);
      }

      setIsFormDirty(isDirty);
    }
  }, [formValues, options]);

  // Cleanup: Reset navigation flag on unmount as safety measure
  useEffect(() => {
    return () => {
      isNavigatingAfterSaveRef.current = false;
    };
  }, []);

  // Navigation blocking hook
  const { handleNavigation, resetDirty: resetDirtyFromHook } = useFormDirtyCheck(isFormDirty, () => {
    setIsFormDirty(false);
  });

  // Enhanced reset function that also clears form values
  const resetDirty = () => {
    setIsFormDirty(false);
    resetDirtyFromHook();
    // Clear form values to prevent stale comparisons
    setFormValues(null);
    prevValuesStringRef.current = '';
    isNavigatingAfterSaveRef.current = false;
  };

  // Function to navigate after successful save - ensures dirty state is cleared before navigation
  const navigateAfterSave = (path, options) => {
    // Set flag to prevent updateFormValues from updating during navigation
    isNavigatingAfterSaveRef.current = true;

    // Immediately reset dirty state synchronously
    setIsFormDirty(false);
    resetDirtyFromHook();
    setFormValues(null);
    prevValuesStringRef.current = '';

    // Clear ALL forms from blocker manager to ensure navigation isn't blocked
    // This is important because the blocker might have already decided to block
    blockerManager.clear();

    // Use requestAnimationFrame to ensure DOM and state updates are complete before navigation
    // Add a small delay to allow blocker state to propagate
    requestAnimationFrame(() => {
      // Delay navigation to ensure blocker state has fully updated
      setTimeout(() => {
        if (options) {
          navigate(path, options);
        } else {
          navigate(path);
        }
      }, 50);

      // Reset flag after navigation completes with a delay to ensure component has unmounted
      // This prevents the flag from being reset too early while component is still rendering
      // Total delay: 50ms (navigation) + 100ms (safety buffer) = 150ms
      setTimeout(() => {
        isNavigatingAfterSaveRef.current = false;
      }, 100);
    });
  };

  // Function to update form values (call this in Formik render)
  const updateFormValues = values => {
    // Skip updates if we're navigating after save to prevent dirty state from being set again
    if (isNavigatingAfterSaveRef.current) {
      return;
    }

    try {
      const currentValuesString = JSON.stringify(values);
      if (currentValuesString !== prevValuesStringRef.current) {
        prevValuesStringRef.current = currentValuesString;
        // Defer state update to avoid setting state during render
        // Using Promise.resolve().then() to defer to next microtask (same as original)
        Promise.resolve().then(() => {
          // Double-check flags before setting state (in case component unmounted or navigation started)
          if (!isNavigatingAfterSaveRef.current && isMountedRef.current) {
            setFormValues(values);
          }
        });
      }
    } catch (error) {
      // If JSON.stringify fails, skip update to avoid infinite loops
      // This prevents crashes but maintains functionality
      console.warn('useFormDirtyState: Failed to stringify form values', error);
    }
  };

  return {
    isFormDirty,
    handleNavigation,
    resetDirty,
    navigateAfterSave,
    updateFormValues,
  };
};

export default useFormDirtyState;
