import { useEffect, useMemo } from 'react';
import { usePaymentTerm } from './usePaymentTerm';

export const usePaymentTermsDropdown = () => {
  const { paymentTermsDrop, dropLoading: paymentTermsDropLoading, getPaymentTermsDrop } = usePaymentTerm();

  useEffect(() => {
    getPaymentTermsDrop();
  }, [getPaymentTermsDrop]);

  const defaultPaymentTerm = useMemo(() => paymentTermsDrop?.find(term => term.isDefault) || null, [paymentTermsDrop]);

  const defaultPaymentTermsId = defaultPaymentTerm?.id || null;

  const paymentTermsOptions = useMemo(
    () =>
      (paymentTermsDrop || []).map(term => ({
        value: term.id,
        label: term.name,
      })),
    [paymentTermsDrop]
  );

  return {
    paymentTermsDrop,
    paymentTermsDropLoading,
    paymentTermsOptions,
    defaultPaymentTerm,
    defaultPaymentTermsId,
  };
};
