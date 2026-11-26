import { useMemo } from 'react';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { toApiDate } from '@/utils/util';
import { raiseMaintenancePurchasePoSchema } from '../maintenancePurchase.schema';
import { useMaintenancePurchase } from '../useMaintenancePurchase';

const toDateValue = value => {
  if (!value) return null;
  const date = dayjs(value);
  return date.isValid() ? date : null;
};

const buildRaisePoPayload = (maintenancePurchaseId, values) => ({
  maintenancePurchaseId,
  vendor: values.vendor.trim(),
  expectedDelivery: toApiDate(values.expectedDelivery),
});

const RaiseMaintenancePurchasePoModal = ({ open, purchase, onClose, onSuccess }) => {
  const { raisePoLoading, raiseMaintenancePurchasePo } = useMaintenancePurchase();

  const initialValues = useMemo(
    () => ({
      vendor: '',
      expectedDelivery: toDateValue(purchase?.expectedDelivery),
    }),
    [purchase]
  );

  const handleSubmit = async values => {
    if (raisePoLoading) return;

    try {
      await raiseMaintenancePurchasePo(buildRaisePoPayload(purchase?.id || purchase?._id, values));
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
        if (!nextOpen && !raisePoLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={raisePoLoading}
      width={520}
      title="Raise Purchase Order"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={raiseMaintenancePurchasePoSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue, setFieldTouched }) => (
          <CustomForm name="raiseMaintenancePurchasePo" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">{purchase?.docNo ? <span className="font-semibold text-slate-900">{purchase.docNo}</span> : 'This purchase request'} will move to PO.</p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
              <CustomInput
                type="text"
                name="vendor"
                label="Vendor"
                placeholder="Enter vendor"
                value={values.vendor}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.vendor}
                touched={touched.vendor}
                setFieldValue={setFieldValue}
                required
              />
              <CustomInput
                type="date"
                name="expectedDelivery"
                label="Expected Delivery"
                placeholder="Select date"
                value={values.expectedDelivery}
                onBlur={handleBlur}
                errorMessage={errors.expectedDelivery}
                touched={touched.expectedDelivery}
                setFieldValue={setFieldValue}
                setFieldTouched={setFieldTouched}
                format="DD/MM/YYYY"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={raisePoLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Raise PO" type="primary" onClick={submitForm} loading={raisePoLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RaiseMaintenancePurchasePoModal;
