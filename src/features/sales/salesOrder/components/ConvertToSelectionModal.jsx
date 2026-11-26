import { useEffect, useMemo, useRef } from 'react';
import { FieldArray, Formik } from 'formik';

// Components
import { Alert, Button, Spin, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import BatchStockAvailabilityIndicator from '@/components/ui/badge/BatchStockAvailabilityIndicator';
import { useProfile } from '@/features/setting/profile/useProfile';
import { isStockCheckedOn } from '@/utils/salesModuleUtils';

// Hooks
import { useConvert, resolveConversionLocationNames, resolveConversionCustomer, normalizeEntityId } from 'hooks/useConvert';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useBranch } from '@/features/allMaster/branch/useBranch';
import { useItemMaster } from '@/features/allMaster/item/useItem';
import { useDeliveryChallan } from '@/features/sales/deliveryChallan/useDeliveryChallan';
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';

// Extras
import Icons from 'assets/icons/icon';
import Toast from '@/components/ui/common/Toast';
import { getGstNumericRate } from '@/utils/gstDisplay';
import { getItemUnitName } from '@/utils/itemLineUnit';
import { calculateAmounts, isIGSTExists } from 'utils/services';
import { SALES_ORDER_CONVERSION_ALLOWED_STATUSES } from 'utils/constants';
import { convertToSelectionValidateSchema } from '@/utils/validationsSchema';
import { toDecimalString } from '@/utils/currency';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const ConvertToSelectionModal = ({ open, onClose, convertType, convertFrom = 'salesOrder' }) => {
  const { salesOrderDropForConvert, droploading, pendingItemLoading, pendingItems, getSalesOrderDropdownForConvert, getPendingItemsSalesOrder, resetSalesOrderDropConvert, resetPendingItems } =
    useSalesOrder();
  const {
    deliveryChallanDropForConvert,
    droploading: dcDropLoading,
    pendingItems: pendingItemsDeliveryChallan,
    pendingItemsLoading: pendingItemLoadingDeliveryChallan,
    getDeliveryChallanDropdownForConvert,
    resetDeliveryChallanDropConvert,
    getPendingItemsDeliveryChallan,
    resetPendingItems: resetPendingItemsDeliveryChallan,
  } = useDeliveryChallan();
  const { handleConvertSalesOrder, handleConvertDeliveryChallan } = useConvert();
  const { getCustomerDrop, customerDropDown, loading } = useCustomer();
  const { divDrop, allBranchDrop, getDivDropDown, getAllBranchDropDown } = useBranch();
  const { getWarehouseDrop, allItemDrop, allItemDropLoading, getAllItemDrop } = useItemMaster();
  const { inventoryConfig, getInventoryConfig } = useProfile();
  const showBatchIndicator = isStockCheckedOn(inventoryConfig, convertType === 'Delivery Challan' ? 'DELIVERY_CHALLAN' : 'INVOICE');
  const formikRef = useRef(null);
  const updatedPendingItems = useMemo(() => {
    if (convertFrom === 'salesOrder') {
      return pendingItems?.map((x, index) => ({ ...x, uniqueId: `${x?.itemId}-${index}` })) ?? [];
    }

    if (convertFrom === 'deliveryChallan') {
      return (
        pendingItemsDeliveryChallan?.map((x, index) => ({
          ...x,
          uniqueId: `${x?.itemId}-${index}`,
        })) ?? []
      );
    }

    return [];
  }, [pendingItems, pendingItemsDeliveryChallan, convertFrom]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getCustomerDrop({ singal: controller.signal });
    getDivDropDown(payload);
    getAllBranchDropDown(payload);
    getInventoryConfig(payload);

    return () => {
      controller.abort();
      convertFrom === 'salesOrder' ? resetSalesOrderDropConvert() : resetDeliveryChallanDropConvert();

      convertFrom === 'salesOrder' ? resetPendingItems() : resetPendingItemsDeliveryChallan();
    };
  }, []);

  useEffect(() => {
    if (convertFrom === 'deliveryChallan') {
      formikRef.current?.setFieldValue(
        'items',
        pendingItemsDeliveryChallan?.length > 0
          ? pendingItemsDeliveryChallan?.map(item => ({
              ...item,
              finalQty: item.quantity,
              referenceType: 'DeliveryChallan',
            }))
          : []
      );
    }
  }, [pendingItemsDeliveryChallan]);

  const fetchSalesDropdown = async values => {
    convertFrom === 'salesOrder'
      ? getSalesOrderDropdownForConvert({
          customerId: values,
          status: SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.toString(),
        })
      : getDeliveryChallanDropdownForConvert({ customerId: values });
  };

  const fetchPendingItems = async values => {
    convertFrom === 'salesOrder' ? getPendingItemsSalesOrder({ ids: values?.toString() }) : getPendingItemsDeliveryChallan({ ids: values?.toString() });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const onFinish = async values => {
    const hasInvalidQty =
      convertFrom !== 'salesOrder' &&
      values?.items?.some(item => {
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
    let findSalesOrder = salesOrderDropForConvert?.find(x => x?.id === values?.salesOrders?.[0]);
    let findDeliveryChallan = deliveryChallanDropForConvert?.find(x => x?._id === values?.deliveryChallanIds?.[0]);

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

    const salesOrderLocationNames = findSalesOrder ? await resolveLocationNamesForSource(findSalesOrder) : {};
    const deliveryChallanLocationNames = findDeliveryChallan ? await resolveLocationNamesForSource(findDeliveryChallan) : {};
    const salesOrderCustomer = resolveConversionCustomer(findSalesOrder, values?.customerId, customerDropDown);
    const deliveryChallanCustomer = resolveConversionCustomer(findDeliveryChallan, values?.customerId, customerDropDown);

    const discountConfig = findSalesOrder?.appliesTo ? { appliesTo: findSalesOrder.appliesTo } : undefined;

    const computed = calculateAmounts(
      {
        items: values?.items || [],
        additionalcharge: findSalesOrder?.additionalCharges || [],
        isRoundOff: true,
        taxContext: values?.taxContext,
        ...(findSalesOrder?.appliesTo === 'TRANSACTION' &&
          findSalesOrder?.discountConfig && {
            discountValue: findSalesOrder.discountConfig.discountValue,
            discountType: findSalesOrder.discountConfig.discountType,
          }),
      },
      () => {},
      discountConfig
    );

    const isIGST = values?.taxContext ? isIGSTExists(values.taxContext) : false;
    const totalTax = computed.totalTax ?? 0;
    const cgst = !isIGST ? toDecimalString(parseFloat(totalTax / 2)) : 0;
    const sgst = !isIGST ? toDecimalString(parseFloat(totalTax - cgst)) : 0;
    const igst = isIGST ? totalTax : 0;

    let payloadData = {
      items: computed.items,
      subTotal: toDecimalString(parseFloat(computed.subTotal ?? 0)),
      cgst: toDecimalString(cgst),
      sgst: toDecimalString(sgst),
      igst: toDecimalString(igst),
      totalTax: toDecimalString(totalTax),
      total: toDecimalString(parseFloat(computed.totalRounded ?? 0)),
      roundOffAmount: computed.roundOffAmount ?? 0,
      isRoundOff: true,
      divisionId: findSalesOrder?.divisionId ? findSalesOrder?.divisionId : null,
      branchId: findSalesOrder?.branchId ? findSalesOrder?.branchId : null,
      warehouseId: findSalesOrder?.warehouseId ? findSalesOrder?.warehouseId : null,
      ...salesOrderLocationNames,
      additionalCharges: findSalesOrder?.additionalCharges,
      customerId: salesOrderCustomer,
      customerDisplayName: salesOrderCustomer?.customerDisplayName,
      reference: findSalesOrder?.reference,
      paymentTermsId: findSalesOrder?.paymentTermsId,
      customerNotes: findSalesOrder?.customerNotes,
      termsAndConditions: findSalesOrder?.termsAndConditions,
      attachments: findSalesOrder?.attachments,
      salesOrders: values?.salesOrdersForDc,
      appliesTo: findSalesOrder?.appliesTo || '',
      ...(findSalesOrder?.appliesTo === 'TRANSACTION' &&
        findSalesOrder?.discountConfig && {
          discountConfig: findSalesOrder.discountConfig,
        }),
    };

    const deliveryChallanPayload = {
      _id: findDeliveryChallan?._id,
      id: findDeliveryChallan?._id,
      customerId: deliveryChallanCustomer,
      customerDisplayName: deliveryChallanCustomer?.customerDisplayName || findDeliveryChallan?.customerDisplayName || '',
      status: findDeliveryChallan?.status,
      subTotal: findDeliveryChallan?.subTotal,
      total: findDeliveryChallan?.total,
      customerNotes: findDeliveryChallan?.customerNotes || '',
      reference: findDeliveryChallan?.reference || '',
      subject: findDeliveryChallan?.subject || '',
      createdAt: findDeliveryChallan?.createdAt,
      updatedAt: findDeliveryChallan?.updatedAt,
      appliesTo: findDeliveryChallan?.appliesTo || '',
      isRoundOff: findDeliveryChallan?.isRoundOff ?? false,
      roundOffAmount: findDeliveryChallan?.roundOffAmount ?? 0,
      discountConfig: findDeliveryChallan?.discountConfig || null,
      warehouseId: findDeliveryChallan?.warehouseId,
      branchId: findDeliveryChallan?.branchId,
      divisionId: findDeliveryChallan?.divisionId,
      ...deliveryChallanLocationNames,
      paymentTermsId: findDeliveryChallan?.paymentTermsId,
      items: values?.items,
      cgst: findDeliveryChallan?.cgst || 0,
      sgst: findDeliveryChallan?.sgst || 0,
      igst: findDeliveryChallan?.igst || 0,
      totalTax: findDeliveryChallan?.totalTax || 0,
      additionalCharges: findDeliveryChallan?.additionalCharges || [],
      challanId: findDeliveryChallan?.challanId || '',
      challanDate: findDeliveryChallan?.challanDate,
      challanType: findDeliveryChallan?.challanType,
      addedBy: findDeliveryChallan?.addedBy,
      updatedBy: findDeliveryChallan?.updatedBy,
      deliveryChallanIds: values?.deliveryChallanForInvoice,
    };
    convertFrom === 'salesOrder'
      ? handleConvertSalesOrder(payloadData, convertType === 'Delivery Challan' ? 'deliveryChallan' : 'invoice')
      : handleConvertDeliveryChallan(deliveryChallanPayload, true);
  };

  const initialValues = useMemo(() => ({ salesOrdersForDc: null, salesOrders: null, items: null, selectedItems: null }), []);

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
        referenceType: item.referenceType || 'SalesOrder',
      };
    });
    setFieldValue('items', updatedItems);
  };

  return (
    <CustomModal title={`Convert To ${convertType}`} width={800} modalOpen={open} setModalOpen={onClose}>
      <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={convertToSelectionValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => {
          const hasDeliveredItems = values?.items?.some(item => item?.deliveredQuantity > 0);
          return (
            <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div>
                <CustomInput
                  type="select"
                  name="customerId"
                  label="Customer Name"
                  value={values.customerId}
                  onChange={e => {
                    setFieldValue('customerId', e);
                    setFieldValue('salesOrders', null);
                    setFieldValue('selectedItems', null);
                    setFieldValue('items', null);
                    if (e?.length > 0) {
                      fetchSalesDropdown(e);
                    }
                  }}
                  onBlur={handleBlur}
                  errorMessage={errors.customerId}
                  touched={touched.customerId}
                  setFieldValue={setFieldValue}
                  placeholder="Select Customer Name"
                  selectVariant="twoColumn"
                  columnSelectHeader={customerSelectColumnHeader}
                  selectOptions={buildCustomerSelectOptions(customerDropDown)}
                  notFoundContent={
                    loading ? (
                      <div className="flex justify-center items-center">
                        <CustomLoader size="small" />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-2">No Data Found</div>
                    )
                  }
                  required={true}
                />
              </div>
              <div>
                {convertFrom === 'salesOrder' ? (
                  <CustomInput
                    type="select"
                    name="salesOrders"
                    label="Sales Orders"
                    mode="multiple"
                    placeholder="Select Sales Orders"
                    value={values.salesOrders}
                    onBlur={handleBlur}
                    onChange={e => {
                      setFieldValue('salesOrders', e);
                      let updatedSalesOrdersForDc = [];
                      let updatedSelectedItems = [];
                      let updatedItems = [];
                      e?.forEach(salesOrder => {
                        let findSalesOrder = salesOrderDropForConvert?.find(x => x?.id === salesOrder);

                        let findSelectedItems = values?.selectedItems?.filter(x => x?.includes(salesOrder));

                        let findItems = values?.items?.filter(x => x?.referenceId?.includes(salesOrder));

                        updatedSalesOrdersForDc.push({
                          salesOrderId: findSalesOrder?.id,
                          salesOrderNo: findSalesOrder?.orderId,
                        });

                        if (findSelectedItems?.length > 0) {
                          updatedSelectedItems = [...updatedSelectedItems, ...findSelectedItems];
                        }

                        if (findItems?.length > 0) {
                          updatedItems = [...updatedItems, ...findItems];
                        }
                      });

                      setFieldValue('salesOrdersForDc', updatedSalesOrdersForDc?.length > 0 ? updatedSalesOrdersForDc : null);
                      setFieldValue('selectedItems', updatedSelectedItems?.length > 0 ? updatedSelectedItems : null);
                      setFieldValue('items', updatedItems?.length > 0 ? updatedItems : null);

                      if (e?.length > 0) {
                        fetchPendingItems(e);
                        const warehouseId = salesOrderDropForConvert?.find(x => x?.id === e[0])?.warehouseId;
                        if (showBatchIndicator && warehouseId) getAllItemDrop({ warehouseId, isSellable: true });
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
                    errorMessage={errors.salesOrders}
                    touched={touched.salesOrders}
                    setFieldValue={setFieldValue}
                    selectOptions={(salesOrderDropForConvert || []).map(option => ({
                      label: option.orderId,
                      value: option.id,
                    }))}
                  />
                ) : (
                  <CustomInput
                    type="select"
                    name="deliveryChallanIds"
                    label="Delivery Challans"
                    mode="multiple"
                    placeholder="Select Delivery Challans"
                    value={values.deliveryChallanIds}
                    onBlur={handleBlur}
                    onChange={e => {
                      setFieldValue('deliveryChallanIds', e);
                      let updatedDeliveryChallanForInvoice = [];
                      let updatedSelectedItems = [];
                      let updatedItems = [];
                      e?.forEach(deliveryChallan => {
                        let findDeliveryChallan = deliveryChallanDropForConvert?.find(x => x?._id === deliveryChallan);

                        let findSelectedItems = values?.selectedItems?.filter(x => x?.includes(deliveryChallan));

                        let findItems = values?.items?.filter(x => x?.referenceId?.includes(deliveryChallan));

                        updatedDeliveryChallanForInvoice.push({
                          deliveryChallanId: findDeliveryChallan?._id,
                          challanId: findDeliveryChallan?.challanId,
                        });

                        if (findSelectedItems?.length > 0) {
                          updatedSelectedItems = [...updatedSelectedItems, ...findSelectedItems];
                        }

                        if (findItems?.length > 0) {
                          updatedItems = [...updatedItems, ...findItems];
                        }
                      });

                      setFieldValue('deliveryChallanForInvoice', updatedDeliveryChallanForInvoice?.length > 0 ? updatedDeliveryChallanForInvoice : null);
                      setFieldValue('selectedItems', updatedSelectedItems?.length > 0 ? updatedSelectedItems : null);
                      setFieldValue('items', updatedItems?.length > 0 ? updatedItems : null);

                      if (e?.length > 0) {
                        fetchPendingItems(e);
                        const warehouseId = deliveryChallanDropForConvert?.find(x => x?._id === e[0])?.warehouseId;
                        if (showBatchIndicator && warehouseId) getAllItemDrop({ warehouseId, isSellable: true });
                      }
                    }}
                    notFoundContent={
                      dcDropLoading ? (
                        <div className="text-center">
                          <Spin size="small" />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-2">No Data Found</div>
                      )
                    }
                    errorMessage={errors.deliveryChallanIds}
                    touched={touched.deliveryChallanIds}
                    setFieldValue={setFieldValue}
                    selectOptions={(deliveryChallanDropForConvert || []).map(option => ({
                      label: `${option.challanId} (${option?.salesOrders?.map(so => so?.salesOrderNo).join(', ')})`,
                      value: option._id,
                    }))}
                  />
                )}
              </div>
              {convertFrom === 'salesOrder' && (
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
                          const quantity = parseFloat(findItems.remainingQuantity || 1);
                          const rate = parseFloat(findItems.rate || 0);
                          const gst = getGstNumericRate(findItems.gst);
                          const amount = quantity * rate;
                          const taxAmount = (gst / 100) * amount;

                          let obj = {
                            ...findItems,
                            finalQty: findItems.quantity,
                            quantity: convertFrom === 'salesOrder' ? findItems.remainingQuantity : convertFrom === 'deliveryChallan' ? findItems.quantity : 0,
                            taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                            amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                          };
                          finalItems.push({ ...obj, referenceType: 'SalesOrder' });
                        }
                      });

                      setFieldValue('items', finalItems);
                    }}
                    notFoundContent={
                      (convertFrom === 'salesOrder' && pendingItemLoading) || (convertFrom === 'deliveryChallan' && pendingItemLoadingDeliveryChallan) ? (
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
              {convertFrom === 'salesOrder' && convertType === 'Invoice' && values?.salesOrders?.length > 1 && (
                <Alert
                  type="info"
                  showIcon
                  className="mt-3"
                  message="Note: You are combining multiple Sales Orders into one Invoice. Division, Branch, Warehouse, and Payment Terms will be taken from the first selected Sales Order."
                />
              )}
              {values?.items?.length > 0 && (
                <div className="max-h-[300px] overflow-auto mt-3 w-full">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">{convertFrom === 'salesOrder' ? 'Sales Order#' : 'Delivery Challan#'}</th>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Item</th>
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Quantity</th>
                        {hasDeliveredItems && <th className="border px-2 py-1 bg-[#fafafa] text-start">Remaining Qty</th>}
                        <th className="border px-2 py-1 bg-[#fafafa] text-start">Rate</th>
                        {convertFrom === 'salesOrder' && <th className="border px-2 py-1 bg-[#fafafa] text-start">Action</th>}
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
                                          item={allItemDrop?.find(stock => String(stock?._id || stock?.id) === String(item?.itemId))}
                                          line={item}
                                          quantity={item.quantity}
                                        />
                                      )}
                                    </div>
                                  </td>

                                  <td className="w-full border text-center relative">
                                    <div className="flex items-center justify-center gap-1.5 px-2 py-1">
                                      <input
                                        type="text"
                                        className={`${convertFrom === 'salesOrder' ? 'item-table-input w-20' : 'focus:outline-none w-20'} px-2 py-1`}
                                        name={`items[${index}].quantity`}
                                        value={item.quantity}
                                        onChange={e => {
                                          const newValue = e.target.value;

                                          let updatedItems = values?.items.map((itm, i) => (i === index ? { ...itm, quantity: newValue } : itm));
                                          calculateItemAmounts({ ...values, items: updatedItems }, setFieldValue);
                                        }}
                                        readOnly={convertFrom === 'deliveryChallan'}
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
                                  {convertFrom === 'salesOrder' && (
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
