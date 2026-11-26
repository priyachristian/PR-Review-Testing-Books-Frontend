import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { sparePartLabel } from '@/features/maintenance/machine/machine.utils';
import { useSparePart } from '@/features/maintenance/sparePart/useSparePart';
import { requestPartSchema } from '../maintenanceRequest.schema';
import { useMaintenanceRequest } from '../useMaintenanceRequest';

const requestPartInitialValues = {
  sparePartId: null,
  requestedQty: '',
};

const buildRequestPartPayload = (maintenanceRequestId, values) => ({
  maintenanceRequestId,
  sparePartId: values.sparePartId,
  requestedQty: Number(values.requestedQty),
});

const RequestPartModal = ({ open, request, onClose, onSuccess }) => {
  const { requestPartLoading, requestMaintenanceRequestPart } = useMaintenanceRequest();
  const { sparePartDropdown, dropdownLoading, getSparePartDropdown } = useSparePart();

  useEffect(() => {
    if (!open) return undefined;

    const controller = new AbortController();
    getSparePartDropdown({ signal: controller.signal });

    return () => controller.abort();
  }, [open, getSparePartDropdown]);

  const sparePartOptions = useMemo(
    () =>
      (sparePartDropdown || [])
        .map(part => ({
          value: part.id || part._id,
          label: sparePartLabel(part),
        }))
        .filter(option => option.value),
    [sparePartDropdown]
  );

  const handleSubmit = async values => {
    if (requestPartLoading) return;

    try {
      await requestMaintenanceRequestPart(buildRequestPartPayload(request?.id || request?._id, values));
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
        if (!nextOpen && !requestPartLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={requestPartLoading}
      width={520}
      title="Request Parts"
    >
      <Formik initialValues={requestPartInitialValues} validationSchema={requestPartSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="requestMaintenancePart" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">Request a spare part for {request?.mrNo ? <span className="font-semibold text-slate-900">{request.mrNo}</span> : 'this request'}.</p>
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
                loading={dropdownLoading}
                required
                allowClear
              />
              <CustomInput
                type="number"
                name="requestedQty"
                label="Quantity"
                placeholder="Enter quantity"
                decimalPlaces={0}
                min={1}
                value={values.requestedQty}
                onBlur={handleBlur}
                errorMessage={errors.requestedQty}
                touched={touched.requestedQty}
                setFieldValue={setFieldValue}
                required
              />
            </div>
            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={requestPartLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Request Parts" type="primary" onClick={submitForm} loading={requestPartLoading} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default RequestPartModal;
