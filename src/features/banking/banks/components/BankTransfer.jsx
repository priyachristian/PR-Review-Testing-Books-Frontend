import { useCallback, useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useBank, bankTransferValidateSchema, getCurrencies, calculateTransferAmount, getFieldConfig, getDefaultExchangeRate } from '../index';
import { formatAmount } from '@/utils/currency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';

const BankTransfer = ({ modalOpen, setModalOpen, bankDetail, getList }) => {
  const { updateBankLoading, banking, bankTransfer, getBankDropDown, bankDropdown } = useBank();
  const { accountDrop, getAccounts } = useChartOfAccounts();
  const { currencyId: baseCurrencyId, currencyCode: baseCurrencyCode } = useCompanyCurrency();

  const initialValues = useMemo(
    () => ({
      fromAccountId: bankDetail?.id,
      toAccountId: null,
      isCrossCurrency: false,
      amount: '',
      currencyPrice: '',
      transferAmount: '',
      date: dayjs(),
    }),
    [bankDetail?.id]
  );

  // A bank is an account: the banking list is keyed by the same account id.
  const findBankByAccountId = useCallback(
    accountId => (banking || []).find(bank => bank.id === accountId) || (bankDropdown || []).find(bank => bank.id === accountId) || null,
    [banking, bankDropdown]
  );

  const fromAccountOptions = useMemo(
    () =>
      (banking || []).map(bank => ({
        label: bank.bankName ? `${bank.bankName} ${bank.accountNumber ? `(${bank.accountNumber.slice(-4)})` : ''}`.trim() : bank.accountName,
        value: bank.id,
      })),
    [banking]
  );

  const onFinish = useCallback(
    async values => {
      const fromBank = findBankByAccountId(values.fromAccountId);
      if (!fromBank || !values.toAccountId) return;

      const toBank = findBankByAccountId(values.toAccountId);
      const { isSameCurrency } = getCurrencies(fromBank, toBank || fromBank, baseCurrencyCode);

      try {
        await bankTransfer({
          fromAccountId: values.fromAccountId,
          toAccountId: values.toAccountId,
          amount: parseFloat(values.transferAmount) || 0,
          fromAmount: isSameCurrency ? undefined : parseFloat(values.amount),
          exchangeRate: isSameCurrency ? 1 : parseFloat(values.currencyPrice),
          date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
        });
        getList();
        setModalOpen(false);
      } catch {
        // error already handled in slice
      }
    },
    [findBankByAccountId, bankTransfer, getList, setModalOpen, baseCurrencyCode]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const controller = new AbortController();
    getBankDropDown({ signal: controller.signal });
    getAccounts({ signal: controller.signal, type: 'PAYMENT', excludeAccountId: bankDetail?.id });
    return () => controller.abort();
  }, [modalOpen, bankDetail?.id, getBankDropDown, getAccounts]);

  return (
    <Formik initialValues={initialValues} validationSchema={bankTransferValidateSchema} onSubmit={onFinish} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
        const fromBank = findBankByAccountId(values.fromAccountId);
        const toBank = findBankByAccountId(values.toAccountId);
        const targetBank = values.toAccountId ? toBank || fromBank : null;
        const fieldConfig = getFieldConfig(fromBank, targetBank, values.currencyPrice, baseCurrencyCode);

        return (
          <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} width={500} title={<div className="text-lg font-semibold">Bank Transfer</div>}>
            {fromBank && (
              <div className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-md mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fromBank.accountName || '-'}</p>
                  <p className="text-xs text-gray-500">{fromBank.currency?.code || '-'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-semibold text-green-600">{formatAmount(fromBank.availableBalance ?? 0, true, fromBank.currency)}</p>
                </div>
              </div>
            )}

            <CustomForm name="Bank Transfer" onFinish={handleSubmit}>
              <CustomInput
                type="select"
                name="fromAccountId"
                label="From Account"
                className="mb-2"
                placeholder="Select Bank"
                value={values.fromAccountId}
                onBlur={handleBlur}
                errorMessage={errors.fromAccountId}
                touched={touched.fromAccountId}
                setFieldValue={setFieldValue}
                required
                selectOptions={fromAccountOptions}
                onChange={value => {
                  setFieldValue('fromAccountId', value);
                  setFieldValue('toAccountId', null);
                  setFieldValue('isCrossCurrency', false);
                  setFieldValue('amount', '');
                  setFieldValue('currencyPrice', '');
                  setFieldValue('transferAmount', '');
                }}
                disabled
              />
              <CustomInput
                type="account"
                name="toAccountId"
                label="To Account"
                className="mb-2"
                placeholder="Select Account"
                value={values.toAccountId}
                onBlur={handleBlur}
                errorMessage={errors.toAccountId}
                touched={touched.toAccountId}
                setFieldValue={setFieldValue}
                required
                selectOptions={accountDrop.PAYMENT}
                onChange={value => {
                  const fromBank = findBankByAccountId(values.fromAccountId);
                  const toBank = findBankByAccountId(value);
                  const { isSameCurrency } = getCurrencies(fromBank, toBank || fromBank, baseCurrencyCode);
                  setFieldValue('toAccountId', value || null);
                  setFieldValue('isCrossCurrency', Boolean(value && !isSameCurrency));
                  setFieldValue('amount', '');
                  setFieldValue('currencyPrice', value ? getDefaultExchangeRate(fromBank, toBank, baseCurrencyId) : '');
                  setFieldValue('transferAmount', '');
                }}
              />

              <CustomInput
                type="date"
                name="date"
                label="Date"
                className="mb-2"
                placeholder="Select Date"
                value={values.date ? values.date : null}
                onBlur={handleBlur}
                errorMessage={errors.date}
                touched={touched.date}
                setFieldValue={setFieldValue}
                required
              />

              {fieldConfig.showAmount && fromBank && toBank && (
                <CustomInput
                  type="text"
                  name="amount"
                  label={`Amount (${fieldConfig.fromCurrency})`}
                  className="mb-2"
                  placeholder={`Enter Amount in ${fieldConfig.fromCurrency}`}
                  value={values.amount}
                  onChange={e => {
                    handleChange(e);
                    if (fieldConfig.isAutoCalculate) setFieldValue('transferAmount', calculateTransferAmount(e.target.value, values.currencyPrice, fieldConfig.fromCurrency, fieldConfig.toCurrency));
                  }}
                  onBlur={handleBlur}
                  errorMessage={errors.amount}
                  touched={touched.amount}
                  setFieldValue={setFieldValue}
                  required
                />
              )}

              {fieldConfig.showCurrencyPrice && fromBank && toBank && (
                <CustomInput
                  type="text"
                  name="currencyPrice"
                  label={fieldConfig.exchangeRateLabel}
                  className="mb-2"
                  placeholder="Enter Exchange Rate"
                  value={values.currencyPrice}
                  onChange={e => {
                    handleChange(e);
                    if (fieldConfig.isAutoCalculate) setFieldValue('transferAmount', calculateTransferAmount(values.amount, e.target.value, fieldConfig.fromCurrency, fieldConfig.toCurrency));
                  }}
                  onBlur={handleBlur}
                  errorMessage={errors.currencyPrice}
                  touched={touched.currencyPrice}
                  setFieldValue={setFieldValue}
                  required
                />
              )}

              <CustomInput
                type="text"
                name="transferAmount"
                label={`Transfer Amount (${(targetBank || fromBank)?.currency?.code || baseCurrencyCode})`}
                placeholder={`Enter Transfer Amount in ${(targetBank || fromBank)?.currency?.code || baseCurrencyCode}`}
                value={values.transferAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.transferAmount}
                touched={touched.transferAmount}
                setFieldValue={setFieldValue}
                required
                disabled={fieldConfig.isAutoCalculate && fieldConfig.showAmount && fieldConfig.showCurrencyPrice}
              />
              <div className="flex gap-3 justify-end pt-4">
                <CustomButton className="px-6 py-2" text="Cancel" type="default" onClick={() => setModalOpen(false)} />
                <CustomButton className="px-6 py-2" text="Transfer" type="primary" loading={updateBankLoading} onClick={handleSubmit} style={{ minWidth: 100 }} />
              </div>
            </CustomForm>
          </CustomModal>
        );
      }}
    </Formik>
  );
};

export default BankTransfer;
