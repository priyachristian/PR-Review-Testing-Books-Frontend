import { toDecimalString } from '@/utils/currency';

export const getCurrencies = (fromBank, toBank, baseCurrencyCode) => {
  const fromCurrency = fromBank?.currency?.code || baseCurrencyCode;
  const toCurrency = toBank?.currency?.code || baseCurrencyCode;
  return { fromCurrency, toCurrency, isSameCurrency: fromCurrency === toCurrency };
};

const getRateToBase = (bank, baseCurrencyId) => {
  const currency = bank?.currency;
  const currencyId = currency?.id || currency?._id;
  if (!currencyId || String(currencyId) === String(baseCurrencyId)) return 1;
  return Number(currency.exchangeRate) || 1;
};

export const getDefaultExchangeRate = (fromBank, toBank, baseCurrencyId) => {
  const rate = getRateToBase(fromBank, baseCurrencyId) / getRateToBase(toBank, baseCurrencyId);
  return Math.round(rate * 1000000) / 1000000;
};

export const calculateTransferAmount = (amount, exchangeRate, fromCurrency, toCurrency) => {
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return '';
  if (fromCurrency === toCurrency) return toDecimalString(amt);
  const rate = parseFloat(exchangeRate);
  if (!rate || rate <= 0) return '';
  return toDecimalString(amt * rate);
};

export const getFieldConfig = (fromBank, toBank, currencyPrice, baseCurrencyCode) => {
  const base = { showAmount: false, showCurrencyPrice: false, isAutoCalculate: false, exchangeRateLabel: 'Exchange Rate', exchangeRateHelperText: '' };
  if (!fromBank || !toBank) return base;

  const { fromCurrency, toCurrency, isSameCurrency } = getCurrencies(fromBank, toBank, baseCurrencyCode);
  if (isSameCurrency) return { ...base, fromCurrency, toCurrency };

  return {
    showAmount: true,
    showCurrencyPrice: true,
    isAutoCalculate: true,
    fromCurrency,
    toCurrency,
    exchangeRateLabel: `Exchange Rate (1 ${fromCurrency} = ? ${toCurrency})`,
    exchangeRateHelperText: currencyPrice ? `1 ${fromCurrency} = ${currencyPrice} ${toCurrency}` : '',
  };
};
