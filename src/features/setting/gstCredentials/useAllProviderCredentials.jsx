import { useCallback, useState } from 'react';
import { message } from 'antd';
import { providerCredentialsService } from './providerCredentials.service';

export const useAllProviderCredentials = () => {
  const [credentialsList, setCredentialsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const getAllCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await providerCredentialsService.getAllProviderCredentials();
      const list = response?.data ?? [];
      setCredentialsList(list);
      return list;
    } catch (error) {
      setCredentialsList([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCredentials = useCallback(async (platformName, { username, password, isUpdate }) => {
    setSaving(true);
    try {
      const response = isUpdate
        ? await providerCredentialsService.updateProviderCredentials(platformName, { username, password })
        : await providerCredentialsService.createProviderCredentials(platformName, { username, password });
      setCredentialsList(prev => {
        const saved = response?.data;
        if (!saved) return prev;
        const existingIndex = prev.findIndex(item => item.platformName === platformName);
        if (existingIndex === -1) return [...prev, saved];
        return prev.map((item, index) => (index === existingIndex ? saved : item));
      });
      message.success(response?.message || 'Credentials saved successfully');
      return { success: true };
    } catch (error) {
      message.error(typeof error === 'string' ? error : error?.message || 'Failed to save credentials');
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, []);

  const removeCredentials = useCallback(async platformName => {
    setSaving(true);
    try {
      await providerCredentialsService.deleteProviderCredentials(platformName);
      setCredentialsList(prev => prev.filter(item => item.platformName !== platformName));
      message.success('Credentials deleted successfully');
      return { success: true };
    } catch (error) {
      message.error(typeof error === 'string' ? error : error?.message || 'Failed to delete credentials');
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, []);

  const revealPassword = useCallback(async platformName => {
    setRevealing(true);
    try {
      const revealed = await providerCredentialsService.revealProviderCredentials(platformName);
      return { success: true, password: revealed?.password ?? '' };
    } catch (error) {
      message.error(typeof error === 'string' ? error : error?.message || 'Failed to reveal password');
      return { success: false };
    } finally {
      setRevealing(false);
    }
  }, []);

  return { credentialsList, loading, saving, revealing, getAllCredentials, saveCredentials, removeCredentials, revealPassword };
};
