import { useCallback, useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useBank, bankTransactionValidateSchema, getCurrencies, calculateTransferAmount, getFieldConfig, getDefaultExchangeRate } from '../index';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { formatAmount } from '@/utils/currency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

const BankDepositWithdraw = ({ modalOpen, setModalOpen, bank, transactionType, onSuccess }) => {
  const { submitLoading, createBankTransaction, getBankDropDown, bankDropdown } = useBank();
  const { accountDrop, getAccounts } = useChartOfAccounts();
  const { currencyId: baseCurrencyId, currencyCode: baseCurrencyCode } = useCompanyCurrency();
  const isDeposit = transactionType === 'DEPOSIT';

  const initialValues = useMemo(
    () => ({
      counterAccountId: null,
      isCrossCurrency: false,
      amount: '',
      currencyPrice: '',
      transferAmount: '',
      date: dayjs(),
      transactionDescription: '',
    }),
    [transactionType, modalOpen]
  );

  const validationSchema = useMemo(() => bankTransactionValidateSchema(transactionType), [transactionType]);

  // Money leaves the counter account on a deposit and leaves the bank on a withdrawal.
  const getMovementBanks = useCallback(
    counterAccountId => {
      const counterBank = (bankDropdown || []).find(row => row.id === counterAccountId) || null;
      return isDeposit ? { fromBank: counterBank, toBank: bank } : { fromBank: bank, toBank: counterBank };
    },
    [bank, bankDropdown, isDeposit]
  );

  const onFinish = useCallback(
    async values => {
      if (!bank?.id) return;

      const { fromBank, toBank } = getMovementBanks(values.counterAccountId);
      const { isSameCurrency } = getCurrencies(fromBank, toBank, baseCurrencyCode);

      try {
        await createBankTransaction({
          amount: parseFloat(values.transferAmount) || 0,
          fromAmount: isSameCurrency ? undefined : parseFloat(values.amount),
          exchangeRate: isSameCurrency ? 1 : parseFloat(values.currencyPrice),
          transactionDescription: values.transactionDescription || '',
          date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : null,
          transactionType,
          ...(isDeposit ? { toAccountId: bank.id, fromAccountId: values.counterAccountId } : { fromAccountId: bank.id, toAccountId: values.counterAccountId }),
        });
        setModalOpen(false);
        onSuccess?.();
      } catch {
        // slice handles toast
      }
    },
    [bank?.id, createBankTransaction, getMovementBanks, isDeposit, onSuccess, setModalOpen, transactionType, baseCurrencyCode]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const controller = new AbortController();
    getAccounts({ signal: controller.signal, type: 'PAYMENT', excludeAccountId: bank?.id });
    getBankDropDown({ signal: controller.signal });
    return () => controller.abort();
  }, [modalOpen, bank?.id, getAccounts, getBankDropDown]);

  return (
    <Formik key={transactionType} initialValues={initialValues} validationSchema={validationSchema} onSubmit={onFinish} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
        const { fromBank, toBank } = getMovementBanks(values.counterAccountId);
        const fieldConfig = getFieldConfig(fromBank, toBank, values.currencyPrice, baseCurrencyCode);

        return (
          <CustomModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            destroyOnClose
            title={<div className="text-lg font-semibold">{isDeposit ? 'Deposit to Bank' : 'Withdraw from Bank'}</div>}
            width={500}
          >
            {bank && (
              <div className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-md mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{bank.accountName || '-'}</p>
                  <p className="text-xs text-gray-500">{bank.currency?.code || '-'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-semibold text-green-600">{formatAmount(bank.availableBalance ?? 0, true, bank.currency)}</p>
                </div>
              </div>
            )}

            <CustomForm name={isDeposit ? 'Bank Deposit' : 'Bank Withdraw'} onFinish={handleSubmit}>
              <CustomInput
                type="account"
                name="counterAccountId"
                label={isDeposit ? 'Deposit From' : 'Withdraw To'}
                className="mb-2"
                placeholder="Select Account"
                value={values.counterAccountId}
                onChange={value => {
                  const { fromBank, toBank } = getMovementBanks(value);
                  const { isSameCurrency } = getCurrencies(fromBank, toBank, baseCurrencyCode);
                  setFieldValue('counterAccountId', value || null);
                  setFieldValue('isCrossCurrency', Boolean(value && !isSameCurrency));
                  setFieldValue('amount', '');
                  setFieldValue('currencyPrice', value ? getDefaultExchangeRate(fromBank, toBank, baseCurrencyId) : '');
                  setFieldValue('transferAmount', '');
                }}
                onBlur={handleBlur}
                errorMessage={errors.counterAccountId}
                touched={touched.counterAccountId}
                setFieldValue={setFieldValue}
                selectOptions={accountDrop.PAYMENT}
                required
              />

              {fieldConfig.showAmount && (
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

              {fieldConfig.showCurrencyPrice && (
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
                label={`${isDeposit ? 'Deposit' : 'Withdraw'} Amount (${(toBank || bank)?.currency?.code || baseCurrencyCode})`}
                className="mb-2"
                placeholder={`Enter Amount in ${(toBank || bank)?.currency?.code || baseCurrencyCode}`}
                value={values.transferAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.transferAmount}
                touched={touched.transferAmount}
                setFieldValue={setFieldValue}
                required
                disabled={fieldConfig.isAutoCalculate && fieldConfig.showAmount && fieldConfig.showCurrencyPrice}
              />

              <CustomInput
                type="date"
                name="date"
                label="Date"
                className="mb-2"
                placeholder="Select date"
                value={values.date ? values.date : null}
                onBlur={handleBlur}
                errorMessage={errors.date}
                touched={touched.date}
                setFieldValue={setFieldValue}
                required
              />
              <CustomInput
                type="textarea"
                name="transactionDescription"
                label="Description / Note"
                placeholder="Add a note"
                value={values.transactionDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.transactionDescription}
                touched={touched.transactionDescription}
                setFieldValue={setFieldValue}
                required
              />
              <div className="flex justify-end gap-2 pt-4">
                <CustomButton className="px-6 py-2" text="Cancel" type="default" disabled={submitLoading} onClick={() => setModalOpen(false)} />
                <CustomButton className="px-6 py-2" text={isDeposit ? 'Deposit' : 'Withdraw'} type="primary" loading={submitLoading} onClick={handleSubmit} />
              </div>
            </CustomForm>
          </CustomModal>
        );
      }}
    </Formik>
  );
};

export default BankDepositWithdraw;
