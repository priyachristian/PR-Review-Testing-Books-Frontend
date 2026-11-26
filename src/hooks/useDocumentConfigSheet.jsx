import { useState, useCallback, useEffect } from 'react';
import { useModuleConfig } from './useModuleConfig';
import Toast from '@/components/ui/common/Toast';

const useDocumentConfigSheet = ({ moduleName, moduleConfig, formikRef = null, formFieldName = 'termsAndConditions', onSuccess, onError, errorMessage = 'Failed to update Terms & Conditions' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [configData, setConfigData] = useState({
    termsAndConditions: '',
  });
  const { updateModuleConfig, loading } = useModuleConfig();

  const handleOpen = useCallback(() => {
    if (formikRef?.current) {
      const currentValues = formikRef.current.values;
      setConfigData({
        termsAndConditions: currentValues?.[formFieldName] || moduleConfig?.termsandConditions || '',
      });
    } else {
      setConfigData({
        termsAndConditions: moduleConfig?.termsandConditions || '',
      });
    }
    setIsOpen(true);
  }, [formikRef, moduleConfig, formFieldName]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) return;
    setConfigData({
      termsAndConditions: moduleConfig?.termsandConditions || '',
    });
  }, [isOpen, moduleConfig?.termsandConditions]);

  const handleSave = useCallback(
    async data => {
      try {
        await updateModuleConfig({
          moduleName,
          moduleConfig: {
            termsandConditions: data.termsAndConditions,
          },
        });

        if (formikRef?.current) {
          formikRef.current.setFieldValue(formFieldName, data.termsAndConditions);
        }

        setConfigData({
          termsAndConditions: data.termsAndConditions,
        });

        if (onSuccess) {
          onSuccess(data);
        }

        setIsOpen(false);
      } catch (error) {
        console.error('Error updating terms and conditions:', error);
        const errorMsg = error?.message || errorMessage;
        Toast.error(errorMsg);

        if (onError) {
          onError(error);
        }
      }
    },
    [moduleName, updateModuleConfig, formikRef, formFieldName, errorMessage, onSuccess, onError]
  );

  const getTermsAndConditionsValue = useCallback(() => {
    return configData.termsAndConditions || moduleConfig?.termsandConditions || '';
  }, [configData, moduleConfig]);

  return {
    // State
    isOpen,
    configData,
    loading,
    // Handlers
    handleOpen,
    handleClose,
    handleSave,
    setIsOpen,
    // Utilities
    getTermsAndConditionsValue,
  };
};

export default useDocumentConfigSheet;
