import { useMemo } from 'react';
import { Formik } from 'formik';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { approveMaintenancePurchaseSchema } from '../maintenancePurchase.schema';
import { sparePartIdValue, sparePartName } from '../maintenancePurchase.utils';
import { useMaintenancePurchase } from '../useMaintenancePurchase';

const buildApproveItems = purchase =>
  (Array.isArray(purchase?.items) ? purchase.items : [])
    .map(item => {
      const sparePartId = sparePartIdValue(item);
      if (!sparePartId) return null;

      const requestedQty = Number(item?.requestedQty);
      return {
        sparePartId,
        partName: sparePartName(item) || sparePartId,
        requestedQty: Number.isFinite(requestedQty) ? requestedQty : null,
        approvedQty: Number.isFinite(requestedQty) ? requestedQty : '',
      };
    })
    .filter(Boolean);

const buildApprovePayload = (maintenancePurchaseId, values) => ({
  maintenancePurchaseId,
  items: (values.items || []).map(item => ({
    sparePartId: item.sparePartId,
    approvedQty: Number(item.approvedQty),
  })),
});

const ApproveMaintenancePurchaseModal = ({ open, purchase, onClose, onSuccess }) => {
  const { approveLoading, approveMaintenancePurchase } = useMaintenancePurchase();

  const initialValues = useMemo(() => ({ items: buildApproveItems(purchase) }), [purchase]);

  const handleSubmit = async values => {
    if (approveLoading) return;

    try {
      await approveMaintenancePurchase(buildApprovePayload(purchase?.id || purchase?._id, values));
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
        if (!nextOpen && !approveLoading) onClose();
      }}
      destroyOnClose
      closeIconDisabled={approveLoading}
      width={640}
      title="Approve Purchase Request"
    >
      <Formik enableReinitialize initialValues={initialValues} validationSchema={approveMaintenancePurchaseSchema} onSubmit={handleSubmit}>
        {({ values, errors, touched, handleBlur, handleSubmit: submitForm, setFieldValue }) => (
          <CustomForm name="approveMaintenancePurchase" onFinish={submitForm}>
            <p className="mb-4 text-sm text-slate-600">
              {purchase?.docNo ? <span className="font-semibold text-slate-900">{purchase.docNo}</span> : 'This purchase request'} will move to Approved. Set the approved quantity for each item.
            </p>

            {values.items?.length ? (
              <div className="rounded-md border border-gray-200">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(100px,0.8fr)_minmax(140px,1fr)] gap-x-3 rounded-t-md border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Part</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Requested</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <span className="ant-form-item-required" />
                    Approved Qty
                  </div>
                </div>
                <div className={values.items.length > 6 ? 'max-h-[360px] overflow-y-auto' : undefined}>
                  {values.items.map((item, index) => (
                    <div key={item.sparePartId || index} className={index > 0 ? 'border-t border-gray-200' : ''}>
                      <div className="grid grid-cols-[minmax(0,2fr)_minmax(100px,0.8fr)_minmax(140px,1fr)] gap-x-3 items-start px-3 pt-3 pb-5">
                        <div className="flex min-h-[34px] items-center text-sm text-gray-900 break-words">{item.partName}</div>
                        <div className="flex min-h-[34px] items-center text-sm text-gray-700">{item.requestedQty ?? '-'}</div>
                        <CustomInput
                          type="number"
                          name={`items.${index}.approvedQty`}
                          placeholder="Enter quantity"
                          decimalPlaces={0}
                          min={1}
                          max={item.requestedQty || undefined}
                          value={item.approvedQty}
                          onBlur={handleBlur}
                          errorMessage={errors.items?.[index]?.approvedQty}
                          touched={touched.items?.[index]?.approvedQty}
                          setFieldValue={setFieldValue}
                          aria-label={`Item ${index + 1} approved quantity`}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-0 text-sm text-gray-500">No items available to approve.</p>
            )}

            {typeof errors.items === 'string' ? <p className="mt-2 mb-0 text-sm text-red-500">{errors.items}</p> : null}

            <div className="flex items-center justify-end gap-4 pt-6">
              <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={approveLoading} onClick={onClose} />
              <CustomButton className="px-7 py-4" text="Approve" type="primary" onClick={submitForm} loading={approveLoading} disabled={!values.items?.length} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default ApproveMaintenancePurchaseModal;
