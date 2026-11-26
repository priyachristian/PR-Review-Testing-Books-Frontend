import { useEffect, useMemo, useRef } from 'react';
import { FieldArray, Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { Alert, Button, Spin, Tag } from '@/components/AntDComponent';

// Hooks
import { useConvert, resolveConversionLocationNames, resolveConversionVendor, normalizeEntityId } from 'hooks/useConvert';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useBranch } from '@/features/allMaster/branch/useBranch';
import { useItemMaster } from '@/features/allMaster/item/useItem';
import { useGRPO } from '@/features/purchase/grpo/useGRPO';
import { usePurchaseOrder } from '@/features/purchase/purchaseOrder/usePurchaseOrder';

// Extras
import Icons from 'assets/icons/icon';
import Toast from '@/components/ui/common/Toast';
import { PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES } from 'utils/constants';
import { getGstNumericRate } from '@/utils/gstDisplay';
import { getItemUnitName } from '@/utils/itemLineUnit';
import { convertToSelectionValidateSchema } from '@/utils/validationsSchema';
import { toDecimalString } from '@/utils/currency';
import { buildCustomerSelectOptions, vendorSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import BatchStockAvailabilityIndicator from '@/components/ui/badge/BatchStockAvailabilityIndicator';
import { useProfile } from '@/features/setting/profile/useProfile';

const ConvertToSelectionModal = ({ open, onClose, convertType, convertFrom = 'purchaseOrder' }) => {
  const {
    purchaseOrderDropForConvert,
    droploading,
    pendingItems,
    pendingItemLoading,
    getPurchaseOrderDropdownforConvert,
    getPendingItemsPurchaseOrder,
    resetPurchaseOrderDropForConvert,
    resetPendingItems,
  } = usePurchaseOrder();
  const {
    getGrpoDropdownForConvert,
    getPendingItemsGrpo,
    grpoDropForConvert,
    droploading: grpoDropLoading,
    pendingItemLoading: pendingItemLoadingGrpo,
    pendingItems: pendingItemsGrpo,
    resetGrpoDropForConvert,
    resetPendingItems: resetPendingItemsGrpo,
  } = useGRPO();
  const { handleConvertPurchaseOrder, handleConvertGRPO } = useConvert();
  const { vendorDropDown, getVendorDrop, loading } = useCustomer();
  const { divDrop, allBranchDrop, getDivDropDown, getAllBranchDropDown } = useBranch();
  const { getWarehouseDrop, allItemDrop, allItemDropLoading, getAllItemDrop } = useItemMaster();
  const { inventoryConfig, getInventoryConfig } = useProfile();
  const showBatchIndicator = inventoryConfig?.purchaseFlowStockAddSource === (convertType === 'GRPO' ? 'GRPO' : 'BILL');
  const formikRef = useRef(null);
  const updatedPendingItems = useMemo(() => {
    if (convertFrom === 'purchaseOrder') {
      return pendingItems?.map((x, index) => ({ ...x, uniqueId: `${x?.itemId}-${index}` })) ?? [];
    }
    if (convertFrom === 'GRPO') {
      return pendingItemsGrpo?.map((x, index) => ({ ...x, uniqueId: `${x?.itemId}-${index}` })) ?? [];
    }
    return [];
  }, [pendingItems, pendingItemsGrpo, convertFrom]);
  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getVendorDrop({ singal: controller.signal });
    getDivDropDown(payload);
    getAllBranchDropDown(payload);
    getInventoryConfig(payload);

    return () => {
      controller.abort();
      convertFrom === 'purchaseOrder' ? resetPurchaseOrderDropForConvert() : resetGrpoDropForConvert();
      convertFrom === 'purchaseOrder' ? resetPendingItems() : resetPendingItemsGrpo();
    };
  }, []);

  const fetchPurchaseOrderDropdown = async values => {
    if (convertFrom === 'purchaseOrder') {
      getPurchaseOrderDropdownforConvert({
        vendor: values,
        status: PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.toString(),
      });
    }
    if (convertFrom === 'GRPO') {
      getGrpoDropdownForConvert({ vendor: values });
    }
  };

  const fetchPendingItems = async values => {
    if (convertFrom === 'purchaseOrder') {
      getPendingItemsPurchaseOrder({ ids: values?.toString() });
    }
    if (convertFrom === 'GRPO') {
      getPendingItemsGrpo({ ids: values?.toString() });
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const onFinish = async values => {
    const hasInvalidQty = values?.items?.some(item => {
      const qty = Number(item?.quantity);

      if (!Number.isFinite(qty)) {
        return false;
      }

      return (item?.finalQty != null && qty > Number(item.finalQty)) || (item?.remainingQuantity != null && qty > Number(item.remainingQuantity));
    });

    if (hasInvalidQty) {
      Toast.warning('Quantity cannot be greater than the available quantity');
      return;
    }

    let findPurchaseOrder = purchaseOrderDropForConvert?.find(x => x?.id === values?.purchaseOrders?.[0]);

    let findGrpo = grpoDropForConvert?.find(x => x?._id === values?.grpoIds?.[0]);

    const resolveLocationNamesForSource = async source => {
      const branchId = normalizeEntityId(source?.branchId);
      let warehouseDropList = [];
      if (branchId) {
        const warehouseRes = await getWarehouseDrop({ branchId });
        warehouseDropList = warehouseRes?.payload?.data || [];
      }
      return resolveConversionLocationNames(source, {
        divDrop,
        branchDrop: allBranchDrop,
        warehouseDrop: warehouseDropList,
      });
    };

    const purchaseOrderLocationNames = findPurchaseOrder ? await resolveLocationNamesForSource(findPurchaseOrder) : {};
    const grpoLocationNames = findGrpo ? await resolveLocationNamesForSource(findGrpo) : {};

    const purchaseOrderVendor = resolveConversionVendor(findPurchaseOrder, values?.vendor, vendorDropDown);
    const grpoVendor = resolveConversionVendor(findGrpo, values?.vendor, vendorDropDown);

    let payloadData = {
      items: values?.items,
      subTotal: findPurchaseOrder?.subTotal,
      cgst: findPurchaseOrder?.cgst,
      sgst: findPurchaseOrder?.sgst,
      igst: findPurchaseOrder?.igst,
      totalTax: findPurchaseOrder?.totalTax,
      total: findPurchaseOrder?.total,
      divisionId: findPurchaseOrder?.divisionId ? findPurchaseOrder?.divisionId : null,
      branchId: findPurchaseOrder?.branchId ? findPurchaseOrder?.branchId : null,
      warehouseId: findPurchaseOrder?.warehouseId ? findPurchaseOrder?.warehouseId : null,
      ...purchaseOrderLocationNames,
      additionalCharges: findPurchaseOrder?.additionalCharges,
      vendor: purchaseOrderVendor,
      customerDisplayName: purchaseOrderVendor?.customerDisplayName,
      reference: findPurchaseOrder?.reference,
      paymentTermsId: findPurchaseOrder?.paymentTermsId,
      notes: findPurchaseOrder?.customerNotes,
      termsAndConditions: findPurchaseOrder?.termsAndConditions,
      attachments: findPurchaseOrder?.attachments,
      purchaseOrders: values?.purchaseOrderConvert,
      appliesTo: findPurchaseOrder?.appliesTo || '',
      isRoundOff: true,
    };

    let grpoPayloadData = {
      items: values?.items,
      subTotal: findGrpo?.subTotal,
      cgst: findGrpo?.cgst,
      sgst: findGrpo?.sgst,
      igst: findGrpo?.igst,
      totalTax: findGrpo?.totalTax,
      total: findGrpo?.total,
      divisionId: findGrpo?.divisionId ? findGrpo?.divisionId : null,
      branchId: findGrpo?.branchId ? findGrpo?.branchId : null,
      warehouseId: findGrpo?.warehouseId ? findGrpo?.warehouseId : null,
      ...grpoLocationNames,
      additionalCharges: findGrpo?.additionalCharges,
      vendor: grpoVendor,
      customerDisplayName: grpoVendor?.customerDisplayName,
      reference: findGrpo?.reference,
      paymentTermsId: findGrpo?.paymentTermsId,
      notes: findGrpo?.customerNotes,
      termsAndConditions: findGrpo?.termsAndConditions,
      attachments: findGrpo?.attachments,
      grpoIds: values?.grposConvert,
      appliesTo: findGrpo?.appliesTo || '',
      isRoundOff: true,
    };

    convertFrom === 'purchaseOrder'
      ? handleConvertPurchaseOrder(payloadData, convertType === 'GRPO' ? 'grpo' : 'bills')
      : handleConvertGRPO(grpoPayloadData, convertType === 'GRPO' ? 'grpo' : 'bills');
  };

  const initialValues = useMemo(
    () => ({
      vendor: '',
      purchaseOrderConvert: null,
      purchaseOrders: null,
      items: null,
      selectedItems: null,
    }),
    []
  );

  const calculateItemAmounts = (values, setFieldValue) => {
    const updatedItems = values.items.map(item => {
      const quantity = parseFloat(item.quantity || 1);
      const rate = parseFloat(item.rate || 0);
      const gst = getGstNumericRate(item.gst);
      const amount = quantity * rate;
      const taxAmount = (gst / 100) * amount;
      return {
        ...item,
        taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
        amount: amount ? toDecimalString(parseFloat(amount)) : 0,
        referenceType: item.referenceType || 'PurchaseOrder',
      };
    });
    setFieldValue('items', updatedItems);
  };

  useEffect(() => {
    if (convertFrom === 'GRPO') {
      formikRef.current?.setFieldValue(
        'items',
        pendingItemsGrpo?.length > 0
          ? pendingItemsGrpo?.map(item => ({
              ...item,
              finalQty: item.quantity,
              referenceType: 'GrpoOrder',
            }))
          : []
      );
    }
  }, [pendingItemsGrpo]);

  return (
    <CustomModal title={`Convert To ${convertType}`} width={800} modalOpen={open} setModalOpen={onClose}>
      <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={convertToSelectionValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => {
          const hasDeliveredItems = values?.items?.some(item => item?.deliveredQuantity > 0);
          const bulkConvertNote =
            convertFrom === 'purchaseOrder' && values?.purchaseOrders?.length > 1
              ? `Note: You are combining multiple Purchase Orders into one ${convertType}. Division, Branch, Warehouse, and Payment Terms will be taken from the first selected Purchase Order.`
              : convertFrom === 'GRPO' && convertType === 'Bill' && values?.grpoIds?.length > 1
                ? 'Note: You are combining multiple GRPOs into one Bill. Division, Branch, Warehouse, and Payment Terms will be taken from the first selected GRPO.'
                : null;

          return (
            <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div>
                <CustomInput
                  type="select"
                  name="vendor"
                  label="Vendor Name"
                  value={values?.vendor || undefined}
                  placeholder="Select Vendor Name"
                  onChange={e => {
                    setFieldValue('vendor', e);
                    setFieldValue('purchaseOrders', null);
                    setFieldValue('selectedItems', null);
                    setFieldValue('items', null);
                    if (e?.length > 0) {
                      fetchPurchaseOrderDropdown(e);
                    }
                  }}
                  onBlur={handleBlur}
                  errorMessage={errors.vendor}
                  touched={touched.vendor}
                  setFieldValue={setFieldValue}
                  selectVariant="twoColumn"
                  columnSelectHeader={vendorSelectColumnHeader}
                  selectOptions={buildCustomerSelectOptions(vendorDropDown).map(opt => {
                    const source = (vendorDropDown || []).find(v => String(v.id ?? v._id) === String(opt.value));
                    return { ...opt, value: source?._id ?? opt.value };
                  })}
                  notFoundContent={
                    loading ? (
                      <div className="text-center">
                        <Spin size="small" />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-2">No Data Found</div>
                    )
                  }
                  required={true}
                />
              </div>
              <div>
                {convertFrom === 'purchaseOrder' ? (
                  <CustomInput
                    type="select"
                    name="purchaseOrders"
                    label="Purchase Orders"
                    mode="multiple"
                    placeholder="Select Purchase Orders"
                    value={values.purchaseOrders}
                    onBlur={handleBlur}
                    onChange={e => {
                      setFieldValue('purchaseOrders', e);
                      let updatedPurchaseOrderForConvert = [];
                      let updatedSelectedItems = [];
                      let updatedItems = [];
                      e?.forEach(salesOrder => {
                        let findPurchaseOrder = purchaseOrderDropForConvert?.find(x => x?.id === salesOrder);

                        let findSelectedItems = values?.selectedItems?.filter(x => x?.includes(salesOrder));

                        let findItems = values?.items?.filter(x => x?.referenceId?.includes(salesOrder));

                        updatedPurchaseOrderForConvert.push({
                          purchaseOrderId: findPurchaseOrder?.id,
                          purchaseOrderNo: findPurchaseOrder?.purchaseOrderId,
                        });

                        if (findSelectedItems?.length > 0) {
                          updatedSelectedItems = [...updatedSelectedItems, ...findSelectedItems];
                        }

                        if (findItems?.length > 0) {
                          updatedItems = [...updatedItems, ...findItems];
                        }
                      });

                      setFieldValue('purchaseOrderConvert', updatedPurchaseOrderForConvert?.length > 0 ? updatedPurchaseOrderForConvert : null);
                      setFieldValue('selectedItems', updatedSelectedItems?.length > 0 ? updatedSelectedItems : null);
                      setFieldValue('items', updatedItems?.length > 0 ? updatedItems : null);

                      if (e?.length > 0) {
                        fetchPendingItems(e);
                        const warehouseId = purchaseOrderDropForConvert?.find(x => x?.id === e[0])?.warehouseId;
                        if (showBatchIndicator && warehouseId) getAllItemDrop({ warehouseId, isPurchasable: true });
                      }
                    }}
                    notFoundContent={
                      droploading ? (
                        <div className="text-center">
                          <Spin size="small" />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-2">No Data Found</div>
                      )
                    }
                    errorMessage={errors.purchaseOrders}
                    touched={touched.purchaseOrders}
                    setFieldValue={setFieldValue}
                    selectOptions={(purchaseOrderDropForConvert || []).map(option => ({
                      label: option.purchaseOrderId,
                      value: option.id,
                    }))}
                  />
                ) : (
                  <CustomInput
                    type="select"
                    name="grpoIds"
                    label="GRPOs"
                    mode="multiple"
                    placeholder="Select GRPOs"
                    value={values.grpoIds}
                    onBlur={handleBlur}
                    onChange={e => {
                      setFieldValue('grpoIds', e);
                      let updatedGrposForConvert = [];
                      let updatedSelectedItems = [];
                      let updatedItems = [];
                      e?.forEach(salesOrder => {
                        let findGrpo = grpoDropForConvert?.find(x => x?._id === salesOrder);

                        let findSelectedItems = values?.selectedItems?.filter(x => x?.includes(salesOrder));

                        let findItems = values?.items?.filter(x => x?.referenceId?.includes(salesOrder));
                        updatedGrposForConvert.push({
                          grpoId: findGrpo?._id,
                          grpoNo: findGrpo?.grpoOrderId,
                        });

                        if (findSelectedItems?.length > 0) {
                          updatedSelectedItems = [...updatedSelectedItems, ...findSelectedItems];
                        }

                        if (findItems?.length > 0) {
                          updatedItems = [...updatedItems, ...findItems];
                        }
                      });
                      setFieldValue('grposConvert', updatedGrposForConvert?.length > 0 ? updatedGrposForConvert : null);
                      setFieldValue('selectedItems', updatedSelectedItems?.length > 0 ? updatedSelectedItems : null);
                      setFieldValue('items', updatedItems?.length > 0 ? updatedItems : null);

                      if (e?.length > 0) {
                        fetchPendingItems(e);
                        const warehouseId = grpoDropForConvert?.find(x => x?._id === e[0])?.warehouseId;
                        if (showBatchIndicator && warehouseId) getAllItemDrop({ warehouseId, isPurchasable: true });
                      }
                    }}
                    notFoundContent={
                      grpoDropLoading ? (
                        <div className="text-center">
                          <Spin size="small" />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-2">No Data Found</div>
                      )
                    }
                    errorMessage={errors.grpoIds}
                    touched={touched.grpoIds}
                    setFieldValue={setFieldValue}
                    selectOptions={(grpoDropForConvert || []).map(option => ({
                      label: `${option.grpoOrderId} (${option?.purchaseOrders?.map(po => po?.purchaseOrderNo).join(', ')})`,
                      value: option._id,
                    }))}
                  />
                )}
              </div>
              {convertFrom === 'purchaseOrder' && (
                <div>
                  <CustomInput
                    type="select"
                    name="selectedItems"
                    label="Items"
                    mode="multiple"
                    placeholder="Select Items"
                    value={values.selectedItems}
                    onBlur={handleBlur}
                    onChange={e => {
                      const finalItems = [];
                      e?.forEach(item => {
                        let findItems = updatedPendingItems?.find(x => `${x.referenceId}-${x?.itemId}-${x?.uniqueId}` === item);
                        if (findItems) {
                          const quantity = parseFloat(findItems.remainingQuantity || findItems.quantity || 1);
                          const rate = parseFloat(findItems.rate || 0);
                          const gst = getGstNumericRate(findItems.gst);
                          const amount = quantity * rate;
                          const taxAmount = (gst / 100) * amount;
                          let obj = {
                            ...findItems,
                            finalQty: findItems.quantity,
                            quantity: findItems?.remainingQuantity || findItems?.quantity || 0,
                            taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                            amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                          };

                          finalItems.push({ ...obj, referenceType: 'PurchaseOrder' });
                        }
                      });
                      setFieldValue('items', finalItems);
                    }}
                    notFoundContent={
                      (convertFrom === 'purchaseOrder' && pendingItemLoading) || (convertFrom === 'GRPO' && pendingItemLoadingGrpo) ? (
                        <div className="text-center">
                          <Spin size="small" />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-2">No Data Found</div>
                      )
                    }
                    errorMessage={errors.selectedItems}
                    touched={touched.selectedItems}
                    setFieldValue={setFieldValue}
                    selectOptions={(updatedPendingItems || []).map(option => ({
                      label: `${option?.itemName} (${option?.referenceNo})`,
                      value: `${option.referenceId}-${option?.itemId}-${option?.uniqueId}`,
                    }))}
                  />
                </div>
              )}
              {bulkConvertNote && <Alert type="info" showIcon className="mt-3" message={bulkConvertNote} />}
              {values?.items?.length > 0 && (
                <div className="max-h-[300px] overflow-auto mt-3 w-full">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">{convertFrom === 'purchaseOrder' ? 'Purchase Order' : 'GRPO'}#</th>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Item</th>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Quantity</th>
                        {hasDeliveredItems && <th className="border px-2 py-1 bg-[#fafafa] text-start">Remaining Qty</th>}
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Rate</th>
                        {convertFrom == 'purchaseOrder' && <th className="border px-2 py-1 bg-[#fafafa] text-start">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <FieldArray name="items">
                        {() => (
                          <>
                            {values?.items?.map((item, index) => {
                              const unitName = getItemUnitName(item);
                              return (
                                <tr key={index}>
                                  <td className="w-full border text-start relative ">
                                    <div className="px-2 py-1 w-40">
                                      <Tag className="font-semibold">{item?.referenceNo}</Tag>
                                    </div>
                                  </td>
                                  <td className="w-full border text-start relative">
                                    <div className="flex items-center gap-1.5 pe-3">
                                      <input type="text" className="focus:outline-none px-2 py-1 min-w-0 flex-1" name={`items[${index}].itemName`} value={item.itemName} onBlur={handleBlur} readOnly />
                                      {showBatchIndicator && !allItemDropLoading && (
                                        <BatchStockAvailabilityIndicator
                                          item={allItemDrop?.find(
                                            stock => String(stock?._id || stock?.id) === String(item?.itemId) && (stock?.itemCategory?.isService === true || stock?.trackInventory === false)
                                          )}
                                        />
                                      )}
                                    </div>
                                  </td>

                                  <td className="w-full border text-center relative">
                                    <div className="flex items-center justify-center gap-1.5 px-2 py-1">
                                      <input
                                        type="text"
                                        className={`${convertFrom === 'purchaseOrder' ? 'item-table-input w-20' : 'focus:outline-none w-20'} px-2 py-1`}
                                        name={`items[${index}].quantity`}
                                        value={item.quantity}
                                        onChange={e => {
                                          const newValue = e.target.value;

                                          let updatedItems = values?.items.map((itm, i) => (i === index ? { ...itm, quantity: newValue } : itm));
                                          calculateItemAmounts({ ...values, items: updatedItems }, setFieldValue);
                                        }}
                                        readOnly={convertFrom === 'GRPO'}
                                        onBlur={handleBlur}
                                      />
                                      {unitName ? <span className="shrink-0 text-xs font-medium text-gray-600">{unitName}</span> : null}
                                    </div>
                                    {errors.items?.[index]?.quantity && touched.items?.[index]?.quantity && (
                                      <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].quantity}</div>
                                    )}
                                  </td>
                                  {hasDeliveredItems && (
                                    <td className="w-full border text-center relative">
                                      <div className="flex items-center justify-center gap-1.5 px-2 py-1">
                                        <input type="text" className="focus:outline-none w-16 px-2 py-1" value={item?.deliveredQuantity > 0 ? (item.remainingQuantity ?? '') : '-'} readOnly />
                                        {item?.deliveredQuantity > 0 && unitName ? <span className="shrink-0 text-xs font-medium text-gray-600">{unitName}</span> : null}
                                      </div>
                                    </td>
                                  )}
                                  <td className="w-full border text-start relative">
                                    <input type="text" className="focus:outline-none px-2 py-1" name={`items[${index}].rate`} value={item.rate} onBlur={handleBlur} readOnly />
                                  </td>
                                  {convertFrom == 'purchaseOrder' && (
                                    <td className="w-full border text-start relative">
                                      <Button
                                        className="text-red-500 text-base cursor-pointer w-max px-2 py-1 border-none"
                                        icon={<Icons.DeleteOutlined />}
                                        onClick={() => {
                                          const updatedItems = values?.items.filter((_, i) => i !== index);
                                          const updatedItemDropdown = values?.selectedItems?.filter(x => x !== `${item.referenceId}-${item?.itemId}-${item?.uniqueId}`);
                                          setFieldValue('selectedItems', updatedItemDropdown);
                                          setFieldValue('items', updatedItems);
                                        }}
                                      />
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </FieldArray>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end items-center gap-3 mt-4">
                <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={onClose} />
                <CustomButton className="px-8 py-4" type="primary" text={`Convert To ${convertType}`} onClick={handleSubmit} />
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default ConvertToSelectionModal;
