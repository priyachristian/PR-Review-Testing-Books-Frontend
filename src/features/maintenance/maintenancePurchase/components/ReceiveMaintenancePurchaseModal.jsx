import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { receiveMaintenancePurchaseSchema } from '../maintenancePurchase.schema';
import { orderedQtyValue, receivedQtyValue, remainingReceiveQty, sparePartIdValue, sparePartName } from '../maintenancePurchase.utils';
import { useMaintenancePurchase } from '../useMaintenancePurchase';

const buildReceiveItems = purchase =>
  (Array.isArray(purchase?.items) ? purchase.items : [])
    .map(item => {
      const sparePartId = sparePartIdValue(item);
      if (!sparePartId) return null;

      const remainingQty = remainingReceiveQty(item);
      if (!Number.isFinite(remainingQty) || remainingQty <= 0) return null;

      const orderedQty = orderedQtyValue(item);
      const receivedSoFar = receivedQtyValue(item);

      return {
        sparePartId,
        partName: sparePartName(item) || sparePartId,
        orderedQty: Number.isFinite(orderedQty) ? orderedQty : null,
        receivedSoFar,
        remainingQty,
        receiveNow: remainingQty,
      };
    })
    .filter(Boolean);

const buildReceivePayload = (maintenancePurchaseId, values) => ({
  maintenancePurchaseId,
  items: (values.items || [])
    .map(item => {
      const receivedQty = Number(item.receiveNow);
      if (!Number.isFinite(receivedQty) || receivedQty <= 0) return null;
      return {
        sparePartId: item.sparePartId,
        receivedQty,
      };
    })
    .filter(Boolean),
});

const ReceiveMaintenancePurchaseModal = ({ open, purchase, onClose, onSuccess }) => {
  const { receiveLoading, receiveMaintenancePurchase } = useMaintenancePurchase();

  const initialValues = useMemo(() => ({ items: buildReceiveItems(purchase) }), [purchase]);

  const handleSubmit = async values => {
    if (receiveLoading) return;

    try {
      await receiveMaintenancePurchase(buildReceivePayload(purchase?.id || purchase?._id, values));
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
        if (!nextOpen && !receiveLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={receiveLoading}
      width={720}
      title="Receive Goods"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={receiveMaintenancePurchaseSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="receiveMaintenancePurchase" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">Received quantity is added to spare part stock and posted to the ledger.</p>

            {values.items?.length ? (
              <div className="rounded-md border border-gray-200">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(90px,0.7fr)_minmax(110px,0.9fr)_minmax(130px,1fr)] gap-x-3 rounded-t-md border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Part</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ordered</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Received so far</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <span className="ant-form-item-required" />
                    Receive now
                  </div>
                </div>
                <div className={values.items.length > 6 ? 'max-h-[360px] overflow-y-auto' : undefined}>
                  {values.items.map((item, index) => (
                    <div key={item.sparePartId || index} className={index > 0 ? 'border-t border-gray-200' : ''}>
                      <div className="grid grid-cols-[minmax(0,2fr)_minmax(90px,0.7fr)_minmax(110px,0.9fr)_minmax(130px,1fr)] gap-x-3 items-start px-3 pt-3 pb-5">
                        <div className="flex min-h-[34px] items-center text-sm text-gray-900 break-words">{item.partName}</div>
                        <div className="flex min-h-[34px] items-center text-sm text-gray-700">{item.orderedQty ?? '-'}</div>
                        <div className="flex min-h-[34px] items-center text-sm text-gray-700">{item.receivedSoFar ?? 0}</div>
                        <CustomInput
                          type="number"
                          name={`items.${index}.receiveNow`}
                          placeholder="Enter quantity"
                          decimalPlaces={0}
                          min={0}
                          max={item.remainingQty || undefined}
                          value={item.receiveNow}
                          onBlur={handleBlur}
                          errorMessage={errors.items?.[index]?.receiveNow}
                          touched={touched.items?.[index]?.receiveNow}
                          setFieldValue={setFieldValue}
                          aria-label={`Item ${index + 1} receive now quantity`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-0 text-sm text-gray-500">No remaining items to receive.</p>
            )}

            {typeof errors.items === 'string' ? <p className="mt-2 mb-0 text-sm text-red-500">{errors.items}</p> : null}

            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={receiveLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Confirm Receipt" type="primary" onClick={submitForm} loading={receiveLoading} disabled={!values.items?.length} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ReceiveMaintenancePurchaseModal;
