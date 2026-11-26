import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { useSparePart } from '@/features/maintenance/sparePart';
import { sparePartLabel } from '../spareStockLedger.utils';
import { ADJUSTMENT_TYPES, buildStockAdjustmentPayload, getStockAdjustmentInitialValues, stockAdjustmentSchema } from '../spareStockLedger.schema';
import { useSpareStockLedger } from '../useSpareStockLedger';

const StockAdjustmentModal = ({ open, onClose, onSuccess }) => {
  const { sparePartDropdown, dropdownLoading: sparePartDropdownLoading, getSparePartDropdown } = useSparePart();
  const { submitLoading, createAdjustment } = useSpareStockLedger();

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    getSparePartDropdown({ signal: controller.signal });

    return () => controller.abort();
  }, [open, getSparePartDropdown]);

  const initialValues = useMemo(() => getStockAdjustmentInitialValues(), [open]);

  const sparePartOptions = useMemo(
    () =>
      (sparePartDropdown || []).map(part => ({
        value: part.id || part._id,
        label: sparePartLabel(part) || part.name || part.code || '',
      })),
    [sparePartDropdown]
  );

  const handleSubmit = async values => {
    if (submitLoading) return;

    try {
      await createAdjustment(buildStockAdjustmentPayload(values));
      onSuccess?.();
      onClose();
    } catch {
      // The slice already shows the error toast.
    }
  };

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={nextOpen => {
        if (!nextOpen && !submitLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={submitLoading}
      width={560}
      title="Stock Adjustment"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={stockAdjustmentSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, setFieldTouched }) => (
          <CustomForm name="stockAdjustment" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">Increase or decrease spare part stock. Decrease cannot take stock below zero.</p>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <CustomInput
                type="select"
                name="sparePartId"
                label="Spare Part"
                placeholder="Select spare part"
                value={values.sparePartId}
                onBlur={handleBlur}
                errorMessage={errors.sparePartId}
                touched={touched.sparePartId}
                setFieldValue={setFieldValue}
                selectOptions={sparePartOptions}
                loading={sparePartDropdownLoading}
                required
                allowClear
                showSearch
              />
              <CustomInput
                type="select"
                name="adjustmentType"
                label="Adjustment Type"
                placeholder="Select type"
                value={values.adjustmentType}
                onBlur={handleBlur}
                errorMessage={errors.adjustmentType}
                touched={touched.adjustmentType}
                setFieldValue={setFieldValue}
                selectOptions={ADJUSTMENT_TYPES}
                required
              />
              <CustomInput
                type="number"
                name="qty"
                label="Quantity"
                placeholder="Enter quantity"
                decimalPlaces={4}
                min={0}
                value={values.qty}
                onBlur={handleBlur}
                errorMessage={errors.qty}
                touched={touched.qty}
                setFieldValue={setFieldValue}
                required
              />
              <CustomInput
                type="date"
                name="date"
                label="Date"
                placeholder="Select date"
                value={values.date}
                onBlur={handleBlur}
                errorMessage={errors.date}
                touched={touched.date}
                setFieldValue={setFieldValue}
                setFieldTouched={setFieldTouched}
                format="DD/MM/YYYY"
              />
            </div>

            <div className="mt-3">
              <CustomInput
                type="textarea"
                name="remarks"
                label="Remarks"
                placeholder="Enter reason for adjustment"
                rows={3}
                value={values.remarks}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.remarks}
                touched={touched.remarks}
                setFieldValue={setFieldValue}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={submitLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Adjust Stock" type="primary" onClick={submitForm} loading={submitLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default StockAdjustmentModal;
