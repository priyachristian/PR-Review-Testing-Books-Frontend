import { useMemo } from 'react';
import { Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { baseCurrencyValidateSchema } from '@/features/setting/currency/currency.schema';
import { CURRENCY_DECIMAL_OPTIONS, CURRENCY_FORMAT_OPTIONS } from '@/utils/constants';

const AddEditCurrencyModal = ({ modalOpen, setModalOpen, initialCurrency, title, onSubmit, saving = false, codeDisabled = false }) => {
  const initialValues = useMemo(
    () => ({
      code: initialCurrency?.code ?? '',
      symbol: initialCurrency?.symbol ?? '',
      name: initialCurrency?.name ?? '',
      decimalPlaces: Number(initialCurrency?.decimalPlaces ?? 2),
      format: initialCurrency?.format ?? CURRENCY_FORMAT_OPTIONS[0]?.value,
      exchangeRate: initialCurrency?.exchangeRate ?? '',
    }),
    [initialCurrency, modalOpen]
  );

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={nextOpen => {
        if (!nextOpen) setModalOpen(false);
      }}
      destroyOnClose
      width={560}
      title={<span className="text-base font-semibold text-[#030711]">{title}</span>}
    >
      <Formik initialValues={initialValues} validationSchema={baseCurrencyValidateSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
          <CustomForm name="AddEditCurrencyModal" onFinish={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                type="text"
                name="code"
                label="Currency Code"
                placeholder="Enter currency code"
                value={values.code}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.code}
                touched={touched.code}
                setFieldValue={setFieldValue}
                required
                disabled={codeDisabled}
              />
              <CustomInput
                type="text"
                name="symbol"
                label="Currency Symbol"
                placeholder="Enter currency symbol"
                value={values.symbol}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.symbol}
                touched={touched.symbol}
                setFieldValue={setFieldValue}
                required
              />
            </div>
            <div className="mt-2">
              <CustomInput
                type="text"
                name="name"
                label="Currency Name"
                placeholder="Enter currency name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.name}
                touched={touched.name}
                setFieldValue={setFieldValue}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <CustomInput
                type="select"
                name="decimalPlaces"
                label="Decimal Places"
                placeholder="Select"
                value={values.decimalPlaces}
                onChange={v => setFieldValue('decimalPlaces', v)}
                onBlur={handleBlur}
                errorMessage={errors.decimalPlaces}
                touched={touched.decimalPlaces}
                setFieldValue={setFieldValue}
                selectOptions={CURRENCY_DECIMAL_OPTIONS}
                disabled={true}
              />
              <CustomInput
                type="select"
                name="format"
                label="Format"
                placeholder="Select format"
                value={values.format}
                onChange={v => setFieldValue('format', v)}
                onBlur={handleBlur}
                errorMessage={errors.format}
                touched={touched.format}
                setFieldValue={setFieldValue}
                selectOptions={CURRENCY_FORMAT_OPTIONS}
              />
            </div>
            {!initialCurrency?.isBaseCurrency && (
              <div className="mt-2">
                <CustomInput
                  type="number"
                  name="exchangeRate"
                  label="Exchange Rate"
                  value={values.exchangeRate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.exchangeRate}
                  touched={touched.exchangeRate}
                  setFieldValue={setFieldValue}
                  min={0}
                  placeholder="Enter exchange rate"
                />
              </div>
            )}
            <div className="flex gap-4 justify-end items-center pt-7">
              <CustomButton
                className="px-7 py-4"
                text="Cancel"
                type="default"
                disabled={saving}
                onClick={() => {
                  resetForm();
                  setModalOpen(false);
                }}
              />
              <CustomButton className="px-7 py-4" text="Save" type="primary" onClick={handleSubmit} loading={saving} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default AddEditCurrencyModal;
