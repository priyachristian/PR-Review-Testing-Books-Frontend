import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DEFAULT_CURRENCY } from '@/utils/constants';

export const useCompanyCurrency = () => {
  const baseCurrency = useSelector(state => state.auth?.signin?.company?.baseCurrency);

  const currency = useMemo(
    () => ({
      ...DEFAULT_CURRENCY,
      ...baseCurrency,
    }),
    [baseCurrency]
  );

  return {
    currency,
    currencyId: currency.id || currency._id,
    decimalPlaces: Number(currency.decimalPlaces),
    currencyCode: currency.code,
    currencyName: currency.name,
    currencySymbol: currency.symbol,
    currencyFormat: currency.format,
  };
};
