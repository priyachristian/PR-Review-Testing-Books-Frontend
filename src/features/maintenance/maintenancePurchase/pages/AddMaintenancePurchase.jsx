import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { FieldArray, FormikProvider, useFormik } from 'formik';

import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { Tooltip } from '@/components/AntDComponent';

import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { sparePartLabel } from '@/features/maintenance/machine';
import { useMaintenanceRequest } from '@/features/maintenance/maintenanceRequest';
import { useSparePart } from '@/features/maintenance/sparePart';
import { maintenancePurchaseValidateSchema, useMaintenancePurchase } from '@/features/maintenance/maintenancePurchase';
import { emptyPurchaseItem, firstPurchaseErrorFieldId, linkedRequestLabel, rateTotal, recordId } from '@/features/maintenance/maintenancePurchase/maintenancePurchase.utils';
import { formatAmount } from '@/utils/currency';
import { toApiDate } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';

const defaultInitialValues = {
  vendor: '',
  linkedMrId: null,
  expectedDelivery: null,
  partRequestId: null,
  items: [emptyPurchaseItem()],
};

const buildInitialValuesFromPartRequest = prefill => {
  if (!prefill) return defaultInitialValues;

  const requestedQty = prefill.requestedQty == null || prefill.requestedQty === '' ? '' : Number(prefill.requestedQty);

  return {
    ...defaultInitialValues,
    linkedMrId: prefill.linkedMrId || null,
    partRequestId: prefill.partRequestId || null,
    items: [
      {
        sparePartId: prefill.sparePartId || null,
        requestedQty: Number.isFinite(requestedQty) ? requestedQty : '',
        rate: '',
      },
    ],
  };
};

const buildPayload = values => {
  const payload = {
    vendor: values.vendor.trim(),
    items: (values.items || []).map(item => ({
      sparePartId: item.sparePartId,
      requestedQty: Number(item.requestedQty),
      rate: Number(item.rate),
    })),
  };

  if (values.linkedMrId) payload.linkedMrId = values.linkedMrId;
  if (values.expectedDelivery) payload.expectedDelivery = toApiDate(values.expectedDelivery);
  if (values.partRequestId) payload.partRequestId = values.partRequestId;

  return payload;
};

const AddMaintenancePurchase = () => {
  const location = useLocation();
  const { submitLoading, createMaintenancePurchase } = useMaintenancePurchase();
  const { sparePartDropdown, dropdownLoading: sparePartDropdownLoading, getSparePartDropdown } = useSparePart();
  const { maintenanceRequestDropdown, dropdownLoading: maintenanceRequestDropdownLoading, getMaintenanceRequestDropdown } = useMaintenanceRequest();
  const scrollToError = useScrollToError();
  const fromPartRequest = location.state?.fromPartRequest;
  const isFromPartRequest = Boolean(fromPartRequest);
  const initialValues = useMemo(() => buildInitialValuesFromPartRequest(fromPartRequest), [fromPartRequest]);
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const sparePartOptions = useMemo(
    () =>
      (sparePartDropdown || [])
        .map(part => ({
          value: recordId(part),
          label: sparePartLabel(part),
        }))
        .filter(option => option.value),
    [sparePartDropdown]
  );

  const maintenanceRequestOptions = useMemo(
    () =>
      (maintenanceRequestDropdown || [])
        .map(request => ({
          value: recordId(request),
          label: linkedRequestLabel(request),
        }))
        .filter(option => option.value),
    [maintenanceRequestDropdown]
  );

  const onFinish = async values => {
    if (submitLoading) return;

    try {
      await createMaintenancePurchase(buildPayload(values));
      navigateAfterSave('/maintenance-purchase');
    } catch {
      // The slice already shows the error toast.
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: maintenancePurchaseValidateSchema,
    onSubmit: onFinish,
  });

  useEffect(() => {
    const controller = new AbortController();
    getSparePartDropdown({ signal: controller.signal });
    getMaintenanceRequestDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [getSparePartDropdown, getMaintenanceRequestDropdown]);

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  return (
    <FormikProvider value={formik}>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{isFromPartRequest ? 'Raise PR' : 'Add Maintenance Purchase'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="addMaintenancePurchase" onFinish={formik.handleSubmit}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Purchase details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  {isFromPartRequest ? <CustomInput type="text" name="partRequestNo" label="Part Request No" value={fromPartRequest?.partRequestNo || '-'} disabled /> : null}
                  <CustomInput
                    type="text"
                    name="vendor"
                    label="Vendor"
                    placeholder="Enter vendor"
                    value={formik.values.vendor}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.vendor}
                    touched={formik.touched.vendor}
                    setFieldValue={formik.setFieldValue}
                    required
                  />
                  <CustomInput
                    type="select"
                    name="linkedMrId"
                    label="Linked MR"
                    placeholder="Select maintenance request"
                    value={formik.values.linkedMrId}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.linkedMrId}
                    touched={formik.touched.linkedMrId}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={maintenanceRequestOptions}
                    loading={maintenanceRequestDropdownLoading}
                    allowClear={!isFromPartRequest}
                    showSearch
                    disabled={isFromPartRequest}
                  />
                  <CustomInput
                    type="date"
                    name="expectedDelivery"
                    label="Expected Delivery"
                    placeholder="Select date"
                    value={formik.values.expectedDelivery}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.expectedDelivery}
                    touched={formik.touched.expectedDelivery}
                    setFieldValue={formik.setFieldValue}
                    setFieldTouched={formik.setFieldTouched}
                    format="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div id="items" className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Items</h3>
                <FieldArray name="items">
                  {({ push, remove }) => {
                    const items = formik.values.items || [];
                    const selectedSparePartIds = items.map(item => item?.sparePartId).filter(Boolean);
                    const addItemDisabled = !sparePartDropdownLoading && sparePartOptions.length > 0 && items.length >= sparePartOptions.length;
                    const addItemTooltip = addItemDisabled ? `You can add only ${sparePartOptions.length} items` : '';
                    const sparePartOptionsForRow = index => sparePartOptions.filter(option => option.value === items[index]?.sparePartId || !selectedSparePartIds.includes(option.value));

                    return (
                      <div>
                        {items.length ? (
                          <div className="overflow-hidden rounded-md border border-gray-200">
                            <div className="wear-part-grid border-b border-gray-200 bg-gray-50 px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <span className="ant-form-item-required" />
                                Spare Part
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <span className="ant-form-item-required" />
                                Quantity
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <span className="ant-form-item-required" />
                                Rate
                              </div>
                              <div />
                            </div>
                            {items.map((_, index) => (
                              <div key={`purchase-item-${index}`} className={index > 0 ? 'border-t border-gray-200' : ''}>
                                <div className="wear-part-grid px-3 py-3">
                                  <CustomInput
                                    type="select"
                                    name={`items.${index}.sparePartId`}
                                    placeholder="Select spare part"
                                    value={items[index]?.sparePartId}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.items?.[index]?.sparePartId}
                                    touched={formik.touched.items?.[index]?.sparePartId}
                                    setFieldValue={formik.setFieldValue}
                                    selectOptions={sparePartOptionsForRow(index)}
                                    loading={sparePartDropdownLoading}
                                    aria-label={`Item ${index + 1} spare part`}
                                    allowClear={!isFromPartRequest}
                                    showSearch
                                    disabled={isFromPartRequest}
                                    required
                                  />
                                  <CustomInput
                                    type="number"
                                    name={`items.${index}.requestedQty`}
                                    placeholder="Enter quantity"
                                    decimalPlaces={0}
                                    min={1}
                                    value={items[index]?.requestedQty}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.items?.[index]?.requestedQty}
                                    touched={formik.touched.items?.[index]?.requestedQty}
                                    setFieldValue={formik.setFieldValue}
                                    aria-label={`Item ${index + 1} quantity`}
                                    disabled={isFromPartRequest}
                                    required
                                  />
                                  <CustomInput
                                    type="number"
                                    name={`items.${index}.rate`}
                                    placeholder="Enter rate"
                                    decimalPlaces={2}
                                    min={0}
                                    value={items[index]?.rate}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.items?.[index]?.rate}
                                    touched={formik.touched.items?.[index]?.rate}
                                    setFieldValue={formik.setFieldValue}
                                    aria-label={`Item ${index + 1} rate`}
                                    required
                                  />
                                  <div className="flex h-[34px] items-center justify-center">
                                    {!isFromPartRequest ? (
                                      <button type="button" className="flex h-[34px] items-center text-xl cursor-pointer" onClick={() => remove(index)} aria-label={`Remove item ${index + 1}`}>
                                        <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="wear-part-grid border-t border-gray-200 bg-gray-50 px-3 py-2.5">
                              <div className="col-span-2 text-sm font-semibold text-gray-700 text-right pr-2">Total</div>
                              <div className="text-sm font-semibold text-gray-900">{formatAmount(rateTotal(items))}</div>
                              <div />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 m-0">No items added.</p>
                        )}
                        {typeof formik.errors.items === 'string' ? <p className="mt-2 mb-0 text-sm text-red-500">{formik.errors.items}</p> : null}
                        {!isFromPartRequest ? (
                          <Tooltip title={addItemTooltip}>
                            <span className={`mt-3 inline-flex ${addItemDisabled ? 'cursor-not-allowed' : ''}`}>
                              <CustomButton
                                type="primary"
                                htmlType="button"
                                disabled={addItemDisabled}
                                onClick={() => {
                                  if (addItemDisabled) return;
                                  push(emptyPurchaseItem());
                                }}
                                text={
                                  <div className="flex gap-1 text-xs items-center">
                                    <Icons.PlusCircleOutlined className="text-xs" />
                                    <div>Add Item</div>
                                  </div>
                                }
                              />
                            </span>
                          </Tooltip>
                        ) : null}
                      </div>
                    );
                  }}
                </FieldArray>
              </div>
            </div>
            <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
              <CustomButton
                className="px-8 py-4 min-w-[50px]"
                type="primary"
                htmlType="button"
                text="Save"
                loading={submitLoading}
                onClick={async () => {
                  await formik.setTouched(
                    {
                      vendor: true,
                      linkedMrId: true,
                      expectedDelivery: true,
                      items: (formik.values.items || []).map(() => ({ sparePartId: true, requestedQty: true, rate: true })),
                    },
                    false
                  );
                  const errors = await formik.validateForm();
                  if (Object.keys(errors).length > 0) {
                    scrollToError(firstPurchaseErrorFieldId(errors), errors);
                    return;
                  }
                  formik.handleSubmit();
                }}
              />
              <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={() => handleNavigation('/maintenance-purchase')} />
            </div>
          </CustomForm>
        </div>
      </div>
    </FormikProvider>
  );
};

export default AddMaintenancePurchase;
