import Toast from '@/components/ui/common/Toast';

const getFirstErrorMessage = obj => {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') return item;
        const nested = getFirstErrorMessage(item);
        if (nested) return nested;
      }
    } else if (typeof val === 'object' && val !== null) {
      const nested = getFirstErrorMessage(val);
      if (nested) return nested;
    }
  }
  return null;
};

const useScrollToError = () => {
  const scrollToError = (id, errors, options = { behavior: 'smooth', block: 'center' }) => {
    const element = document.getElementById(id);
    const errorMessage = errors ? getFirstErrorMessage(errors) : null;
    Toast.error(errorMessage || 'Please fill all the required fields to proceed further');
    if (element) {
      element.scrollIntoView(options);
    }
  };

  return scrollToError;
};

export default useScrollToError;
