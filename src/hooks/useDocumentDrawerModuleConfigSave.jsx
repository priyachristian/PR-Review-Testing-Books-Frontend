import { useCallback, useEffect, useRef, useState } from 'react';

import Toast from '@/components/ui/common/Toast';

const useDocumentDrawerModuleConfigSave = ({
  isDrawerOpen,
  moduleConfig,
  setModuleConfig,
  formikRef,
  formFieldName = 'termsAndConditions',
  abortRef,
  onClose,
  persist,
  refreshModuleConfig,
  errorMessage = 'Failed to update configuration',
}) => {
  const [drawerCodeConfig, setDrawerCodeConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [drawerSaveLoading, setDrawerSaveLoading] = useState(false);
  const previousDrawerOpen = useRef(false);

  useEffect(() => {
    if (!isDrawerOpen) {
      previousDrawerOpen.current = false;
      return;
    }
    setDrawerCodeConfig({
      autoGenerate: moduleConfig.autoGenerate ?? true,
      prefix: moduleConfig.prefix ?? '',
      nextNumber: moduleConfig.nextNumber ?? '',
    });
    previousDrawerOpen.current = true;
  }, [isDrawerOpen, moduleConfig]);

  const handleDrawerSave = useCallback(
    async data => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;
      const terms = data.termsAndConditions ?? '';
      setDrawerSaveLoading(true);

      try {
        await persist({ signal, number: drawerCodeConfig, terms });

        if (formikRef?.current) {
          formikRef.current.setFieldValue(formFieldName, terms);
        }

        setModuleConfig({
          autoGenerate: drawerCodeConfig.autoGenerate,
          prefix: drawerCodeConfig.prefix,
          nextNumber: drawerCodeConfig.nextNumber,
          termsandConditions: terms,
        });

        if (refreshModuleConfig) {
          await refreshModuleConfig({ signal });
        }

        onClose();
      } catch (error) {
        if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') return;
        if (!error?.message) {
          Toast.error(errorMessage);
        }
      } finally {
        setDrawerSaveLoading(false);
      }
    },
    [abortRef, drawerCodeConfig, errorMessage, formFieldName, formikRef, onClose, persist, refreshModuleConfig, setModuleConfig]
  );

  return {
    drawerCodeConfig,
    setDrawerCodeConfig,
    handleDrawerSave,
    drawerSaveLoading,
  };
};

export default useDocumentDrawerModuleConfigSave;
