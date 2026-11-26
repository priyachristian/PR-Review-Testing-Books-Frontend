import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_SETTLEMENT_TYPE_OPTIONS, COMPLAINT_STATUS, settlementShowsCost, settlementShowsPieces } from '../../complaint.constants';
import { customerGotSchema } from '../../complaint.schema';

const SettlementChip = ({ option, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(option.value)}
    className="rounded-md border px-3 py-1.5 text-sm transition-colors"
    style={
      selected
        ? {
            backgroundColor: colorPalette.primary[500],
            borderColor: colorPalette.primary[500],
            color: '#ffffff',
          }
        : {
            backgroundColor: '#ffffff',
            borderColor: colorPalette.secondary[200],
            color: colorPalette.secondary[700],
          }
    }
  >
    {option.label}
  </button>
);

const getActionTaken = complaint => complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.ACTION_TAKEN.key)?.actionTaken || null;

const CustomerGotModal = ({ open, onClose, complaint, submitLoading = false, onSubmit }) => {
  const handleModalClose = () => onClose?.();

  const existing = useMemo(() => getActionTaken(complaint), [complaint]);

  const initialValues = useMemo(
    () => ({
      settlementType: existing?.settlementType || '',
      pieces: existing?.pieces ?? '',
      cost: existing?.costInRupees ?? '',
      summary: existing?.summary || '',
    }),
    [existing]
  );

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      resetForm();
      handleModalClose();
    } catch {
      // Slice already toasts the error; keep the modal open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen) handleModalClose();
      }}
      destroyOnClose
      width={560}
      title="What did the customer actually get?"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={customerGotSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, resetForm, isSubmitting }) => {
          const showPieces = settlementShowsPieces(values.settlementType);
          const showCost = settlementShowsCost(values.settlementType);

          return (
            <CustomForm onFinish={submitForm} layout="vertical">
              <p className="text-sm m-0 mb-4" style={{ color: colorPalette.secondary[600] }}>
                Record what they actually received so the case can move on.
              </p>

              <div className="mb-4" role="group" aria-labelledby="settlement-type-label">
                <div id="settlement-type-label" className="text-sm font-medium text-gray-800">
                  We gave them <span className="text-red-500">*</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {COMPLAINT_SETTLEMENT_TYPE_OPTIONS.map(option => (
                    <SettlementChip
                      key={option.value}
                      option={option}
                      selected={values.settlementType === option.value}
                      onSelect={value => {
                        setFieldValue('settlementType', value);
                        if (!settlementShowsPieces(value)) setFieldValue('pieces', '');
                        if (!settlementShowsCost(value)) setFieldValue('cost', '');
                      }}
                    />
                  ))}
                </div>
                {touched.settlementType && errors.settlementType ? <p className="text-red-500 text-xs mt-1 mb-0">{errors.settlementType}</p> : null}
              </div>

              {showPieces || showCost ? (
                <div className={`grid grid-cols-1 ${showPieces && showCost ? 'sm:grid-cols-2' : ''} gap-x-4`}>
                  {showPieces ? (
                    <CustomInput
                      type="number"
                      name="pieces"
                      label="How many pieces"
                      placeholder="0"
                      value={values.pieces}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.pieces}
                      touched={touched.pieces}
                      setFieldValue={setFieldValue}
                    />
                  ) : null}
                  {showCost ? (
                    <CustomInput
                      type="number"
                      name="cost"
                      label={
                        <span>
                          What it cost us <span className="text-gray-400 font-normal text-xs ml-1">rupees</span>
                        </span>
                      }
                      placeholder="0"
                      value={values.cost}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.cost}
                      touched={touched.cost}
                      setFieldValue={setFieldValue}
                      required
                    />
                  ) : null}
                </div>
              ) : null}

              <CustomInput
                type="textarea"
                name="summary"
                label="In a line"
                placeholder="Summarise what the customer got"
                rows={3}
                value={values.summary}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.summary}
                touched={touched.summary}
                setFieldValue={setFieldValue}
                required
              />

              <div className="flex gap-4 justify-end items-center pt-7">
                <CustomButton
                  className="px-7 py-4"
                  text="Cancel"
                  type="default"
                  disabled={submitLoading || isSubmitting}
                  onClick={() => {
                    resetForm();
                    handleModalClose();
                  }}
                />
                <CustomButton className="px-7 py-4" text="Save it" type="primary" loading={submitLoading || isSubmitting} onClick={submitForm} />
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default CustomerGotModal;
