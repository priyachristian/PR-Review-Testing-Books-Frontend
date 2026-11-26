import { useCallback, useState } from 'react';

export const useConfirmModal = () => {
  const [payload, setPayload] = useState(null);

  const open = useCallback(nextPayload => {
    setPayload(nextPayload ?? true);
  }, []);

  const close = useCallback(() => {
    setPayload(null);
  }, []);

  return {
    isOpen: payload != null,
    payload,
    open,
    close,
  };
};
