import { DEFAULT_CURRENCY, FORMAT_LOCALE_MAP } from './constants';

let baseCurrency = { ...DEFAULT_CURRENCY };

export const setBaseCurrency = (currency = {}) => {
  baseCurrency = { ...DEFAULT_CURRENCY, ...currency };
};

export const getBaseCurrency = () => baseCurrency;

export const formatAmount = (amount, showSymbol = true, currencyConfig, decimalPlaces) => {
  const value = Number(amount);

  if (amount == null || Number.isNaN(value)) return '-';

  const currency = currencyConfig || baseCurrency;
  const decimals = decimalPlaces ?? 3;
  const factor = 10 ** decimals;
  const truncated = Math.trunc(value * factor) / factor;

  const formatted = new Intl.NumberFormat(FORMAT_LOCALE_MAP[currency?.format] || 'en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(truncated);

  return showSymbol ? `${currency?.symbol}${formatted}` : formatted;
};

export const formatAmountShort = (amount, showSymbol = true) => {
  if (amount == null || Number.isNaN(Number(amount))) return '-';

  const num = Number(amount);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const symbol = showSymbol ? baseCurrency.symbol || '' : '';
  const decimals = Number(baseCurrency.decimalPlaces ?? DEFAULT_CURRENCY.decimalPlaces);

  if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(decimals)} Cr`;
  if (abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(decimals)} L`;

  return formatAmount(num, showSymbol);
};

/** For form inputs — plain decimal string, no commas */
export const toDecimalString = value => Number(value || 0).toFixed(Number(baseCurrency?.decimalPlaces ?? 2));

/** For Yup / numeric fields — fixed decimal number */
export const toDecimalNumber = value => Number(toDecimalString(value));
