import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import { Tooltip } from '@/components/AntDComponent';
import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import AdditionalAddressContainer from '@/components/feedback/formModal/AdditionalAddressContainer';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import Toast from '@/components/ui/common/Toast';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PaginatedSelect from '@/components/forms/formInput/PaginatedSelect';
import RejectionItemTable from '@/features/rejections/bookRejections/components/RejectionItemTable';

// Hooks
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';
import { useItemMaster } from '@/features/allMaster/item';
import { useModuleConfig } from 'hooks/useModuleConfig';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from '@/hooks/useScrollToError';

// Extras
import { useRejectionOrder, rejectionOrderValidateSchema } from '@/features/rejections/bookRejections';
import Icons from 'assets/icons/icon';
import { resetBranch } from '@/features/allMaster/branch';
import { buildCustomerSelectOptions, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { RESOURCES } from '@/utils/jsonFile';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { colorPalette } from '@/utils/theme';
import { ADDRESS_TYPE, MODULE_NAMES } from '@/utils/constants';
import { REJECTION_STATUS } from '@/utils/dropdownEnums';
import { errorsToTouched } from '@/utils/util';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const toDayjs = date => (date ? dayjs(date) : null);
const refId = ref => (ref && typeof ref === 'object' ? ref._id : ref) || null;

export default function AddRejectionOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formikRef = useRef(null);
  const { rejectionId } = useParams();
  const isEdit = !!rejectionId;
  // Saved address of the order being edited; matched against the customer's address list once loaded.
  const savedAddressRef = useRef(null);
  const [editFetchDone, setEditFetchDone] = useState(false);
  const {
    submitLoading,
    createRejectionOrder,
    updateRejectionBooking,
    rejectionOrder,
    loading: orderLoading,
    getRejectionOrderById,
    resetRejectionOrder,
    fetchInvoiceDropdownPage,
    invoiceDropLoading,
  } = useRejectionOrder();
  const editOrder = isEdit && rejectionOrder?._id === rejectionId ? rejectionOrder : null;
  const { companyProfileSettings } = useProfile();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const initialAddressId = useRef(null);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig } = useModuleConfig();

  const { allItemDrop, allItemDropLoading } = useItemMaster();
  const scrollToError = useScrollToError();
  const { isViewOnly } = useModulePermissions(RESOURCES.REJECTION_ORDERS);

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [bookingConfig, setBookingConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    customerDropDownList,
    customerLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setSelectedCustomerId,
    setFromEntity,
    customerAddress,
    addressLoading,
    getCustomerAddress,
    resetCustomerAddress,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(null, RESOURCES.REJECTION_ORDERS, {
    enableBranchFirst: true,
    enableWarehouseFirst: true,
    moduleConfig,
  });

  const fetchCustomerAddress = customerId => {
    setSelectedAddress(null);
    initialAddressId.current = null;
    formikRef.current?.setFieldValue('addressId', null);
    getCustomerAddress({ customerId, addressType: ADDRESS_TYPE.BILLING });
  };

  const fetchInvoicePage = useCallback(
    async ({ page, limit, search, signal }) => {
      const customerId = formikRef.current?.values?.customerId;
      if (!customerId) return { options: [], hasMore: false };
      const res = await fetchInvoiceDropdownPage({ customerId, page, limit, search, signal });
      const results = Array.isArray(res?.data) ? res.data : [];
      const options = results.map(invoice => ({
        label: invoice.invoiceId || invoice._id,
        value: invoice._id,
        raw: invoice,
      }));
      const currentPage = res?.extras?.page ?? page;
      const totalPages = res?.extras?.totalPages ?? currentPage;
      return { options, hasMore: currentPage < totalPages };
    },
    [fetchInvoiceDropdownPage]
  );

  const initialValues = useMemo(() => {
    if (editOrder) {
      return {
        divisionId: refId(editOrder.divisionId),
        branchId: refId(editOrder.branchId),
        warehouseId: refId(editOrder.warehouseId),
        customerId: refId(editOrder.customerId),
        addressId: null,
        referenceInvoiceId: refId(editOrder.referenceInvoiceId),
        transport: editOrder.transport || '',
        transportName: editOrder.transportName || '',
        transportationDate: toDayjs(editOrder.transportationDate),
        arrivalDate: toDayjs(editOrder.arrivalDate),
        note: editOrder.note || '',
        rejectionOrderId: editOrder.rejectionOrderId || '',
        autoGenerate: true,
        items: (editOrder.items || []).map(item => ({
          id: item._id,
          itemId: refId(item.itemId),
          itemName: item.itemId?.itemName || '',
          itemNo: item.itemId?.itemNo || '',
          watt: item.wattage || '',
          booked: item.bookedQty,
          mfgDate: toDayjs(item.manufacturingDate),
        })),
        attachments: editOrder.attachments || [],
      };
    }
    return {
      divisionId: null,
      branchId: null,
      warehouseId: null,
      customerId: null,
      addressId: null,
      referenceInvoiceId: null,
      transport: '',
      transportName: '',
      transportationDate: null,
      arrivalDate: null,
      note: '',
      rejectionOrderId: '',
      autoGenerate: true,
      items: [{ id: 'x1', itemId: null, itemName: '', itemNo: '', watt: '', booked: '' }],
      attachments: [],
    };
  }, [editOrder]);

  const existingItemIds = useMemo(() => new Set((editOrder?.items || []).map(item => item._id)), [editOrder]);

  const submitBookingEdit = async values => {
    const payload = {
      referenceInvoiceId: values.referenceInvoiceId || null,
      address: {
        country: selectedAddress?.country || '',
        state: selectedAddress?.state || '',
        city: selectedAddress?.city || '',
      },
      transport: values.transport || '',
      transportName: values.transportName || '',
      transportationDate: values.transportationDate ? dayjs(values.transportationDate).format('YYYY-MM-DD') : null,
      arrivalDate: values.arrivalDate ? dayjs(values.arrivalDate).format('YYYY-MM-DD') : null,
      note: values.note || '',
      items: values.items
        .filter(i => i.itemId)
        .map(i => ({
          ...(existingItemIds.has(i.id) ? { _id: i.id } : {}),
          itemId: i.itemId,
          wattage: i.watt || '',
          bookedQty: Number(i.booked),
          manufacturingDate: i.mfgDate ? dayjs(i.mfgDate).format('YYYY-MM-DD') : null,
        })),
      attachments: Array.isArray(values.attachments) ? values.attachments.filter(Boolean) : values.attachments ? [values.attachments] : [],
    };
    const response = await updateRejectionBooking({ rejectionOrderId: rejectionId, data: payload });
    if (response?.meta?.requestStatus !== 'rejected') {
      navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.detail(rejectionId)}`);
    }
  };

  const onFinish = async values => {
    if (isEdit) return submitBookingEdit(values);
    const payload = {
      rejectionOrderId: values.rejectionOrderId,
      divisionId: values.divisionId,
      branchId: values.branchId,
      warehouseId: values.warehouseId,
      customerId: values.customerId,
      referenceInvoiceId: values.referenceInvoiceId || null,
      address: {
        country: selectedAddress?.country || '',
        state: selectedAddress?.state || '',
        city: selectedAddress?.city || '',
      },
      transport: values.transport || '',
      transportName: values.transportName || '',
      transportationDate: values.transportationDate ? dayjs(values.transportationDate).format('YYYY-MM-DD') : null,
      arrivalDate: values.arrivalDate ? dayjs(values.arrivalDate).format('YYYY-MM-DD') : null,
      note: values.note || '',
      items: values.items
        .filter(i => i.itemId)
        .map(i => ({
          itemId: i.itemId,
          wattage: i.watt,
          bookedQty: Number(i.booked),
          manufacturingDate: i.mfgDate ? dayjs(i.mfgDate).format('YYYY-MM-DD') : null,
        })),
      attachments: Array.isArray(values.attachments) ? values.attachments.filter(Boolean) : values.attachments ? [values.attachments] : [],
    };
    const response = await createRejectionOrder(payload);
    if (response?.meta?.requestStatus !== 'rejected') {
      resetRejectionOrder();
      navigate(`/${ADMIN_ROUTE_PATHS.rejections.root}`);
    }
  };

  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    setEditFetchDone(false);
    getRejectionOrderById({ rejectionOrderId: rejectionId, signal: controller.signal }).then(() => {
      if (!controller.signal.aborted) setEditFetchDone(true);
    });
    return () => {
      controller.abort();
      resetRejectionOrder();
    };
  }, [isEdit, rejectionId, getRejectionOrderById, resetRejectionOrder]);

  // Booking edit is Pending-only; the API enforces it too, this just avoids showing a form that cannot save.
  useEffect(() => {
    if (!editOrder) return;
    if (editOrder.status !== REJECTION_STATUS.PENDING.key) {
      Toast.error('A rejection order can only be edited while it is in Pending status');
      navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.detail(rejectionId)}`, { replace: true });
      return;
    }
    const divisionId = refId(editOrder.divisionId);
    const branchId = refId(editOrder.branchId);
    const warehouseId = refId(editOrder.warehouseId);
    const customerId = refId(editOrder.customerId);
    setFromEntity({ divisionId, branchId, warehouseId });
    setSelectedCustomerId(customerId);
    savedAddressRef.current = editOrder.address || null;
    setSelectedAddress(editOrder.address || null);
    if (customerId) getCustomerAddress({ customerId, addressType: ADDRESS_TYPE.BILLING });
    // Runs once per loaded order; the setters are stable hook callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOrder?._id]);

  useEffect(() => {
    if (isEdit) return undefined;
    const controller = new AbortController();
    getModuleConfig({
      moduleName: MODULE_NAMES.REJECTION_ORDER,
      signal: controller.signal,
    });
    return () => {
      resetModuleConfig();
      controller.abort();
    };
  }, [isEdit, getModuleConfig, resetModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setBookingConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (isEdit) return;
    if (bookingConfig) {
      if (bookingConfig.autoGenerate) {
        formikRef.current?.setFieldValue('rejectionOrderId', `${bookingConfig.prefix}${bookingConfig.nextNumber}`);
      } else {
        formikRef.current?.setFieldValue('rejectionOrderId', '');
      }
      formikRef.current?.setFieldValue('autoGenerate', bookingConfig.autoGenerate);
    }
  }, [isEdit, bookingConfig]);

  useEffect(() => {
    if (isEdit) return;
    const def = companyProfileSettings?.defaultConfiguration;
    if (!def?.divisionId) return;
    const currentValues = formikRef.current?.values;
    if (currentValues?.divisionId || currentValues?.branchId || currentValues?.warehouseId) return;
    formikRef.current?.setFieldValue('divisionId', def.divisionId);
    formikRef.current?.setFieldValue('branchId', def.branchId || null);
    formikRef.current?.setFieldValue('warehouseId', def.warehouseId || null);
    setFromEntity({ divisionId: def.divisionId, branchId: def.branchId, warehouseId: def.warehouseId });
    if (def.branchId) {
      setWarehouseRequiresCascade(true);
    }
    // setFromEntity intentionally omitted - this runs once on profile load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyProfileSettings]);

  useEffect(() => {
    if (moduleConfig?.defaultConfiguration?.branchId || companyProfileSettings?.defaultConfiguration?.branchId) {
      setWarehouseRequiresCascade(true);
    }
  }, [moduleConfig, companyProfileSettings, setWarehouseRequiresCascade]);

  useEffect(() => {
    if (customerAddress?.length > 0) {
      const saved = savedAddressRef.current;
      if (saved) {
        // First load in edit mode: keep the order's saved address instead of the customer default.
        savedAddressRef.current = null;
        const match = customerAddress.find(a => a?.city === saved.city && a?.state === saved.state && a?.country === saved.country);
        setSelectedAddress(match || saved);
        initialAddressId.current = match?._id || null;
        formikRef.current?.setFieldValue('addressId', match?._id || null);
        return;
      }
      const defaultAddress = customerAddress.find(a => a?.isDefault);
      const next = defaultAddress || customerAddress[0] || null;
      setSelectedAddress(next);
      initialAddressId.current = next?._id || null;
      formikRef.current?.setFieldValue('addressId', next?._id || null);
    }
  }, [customerAddress]);

  useEffect(() => {
    return () => {
      resetCustomerAddress();
    };
  }, [resetCustomerAddress]);

  if (isEdit && editFetchDone && !orderLoading && !editOrder) {
    return <NoFoundPage docType={MODULE_NAMES.REJECTION_ORDER} />;
  }

  return (
    <>
      {/* Fixed header */}
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <h1 className="text-[18px] font-semibold text-gray-900">{isEdit ? 'Edit Rejection' : 'Add Rejection'}</h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          {isEdit && (orderLoading || !editOrder) ? (
            <div className="flex justify-center py-20">
              <CustomLoader />
            </div>
          ) : (
            <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={rejectionOrderValidateSchema(bookingConfig?.autoGenerate)} onSubmit={onFinish}>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched, setTouched }) => (
                <CustomForm name="add-rejection" onFinish={handleSubmit}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Inventory context</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                        <CustomInput
                          type="select"
                          name="divisionId"
                          label="Division"
                          placeholder="Select Division"
                          value={values.divisionId}
                          loading={divisionLoading}
                          required
                          disabled={isEdit}
                          selectVariant="twoColumn"
                          columnSelectHeader={divisionSelectColumnHeader}
                          selectOptions={buildDivisionSelectOptions(divDrop)}
                          onBlur={handleBlur}
                          errorMessage={errors.divisionId}
                          touched={touched.divisionId}
                          setFieldValue={setFieldValue}
                          onChange={e => {
                            setFieldTouched('divisionId', false, false);
                            setFieldTouched('branchId', false, false);
                            setFieldTouched('warehouseId', false, false);
                            setWarehouseRequiresCascade(true);
                            setSelectedDivisionId(e || '');
                            setSelectedBranchId('');
                            setFieldValue('branchId', null, false);
                            setFieldValue('warehouseId', null, false);
                            setSelectedWarehouseId('');
                            setFieldValue('customerId', null, false);
                            setSelectedCustomerId(null);
                            dispatch(resetBranch());
                          }}
                        />
                        <CustomInput
                          type="select"
                          name="branchId"
                          label="Branch"
                          placeholder={getBranchSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.branchId}
                          loading={branchLoading}
                          required
                          disabled={isEdit || (warehouseRequiresCascade && !values.divisionId)}
                          selectVariant="twoColumn"
                          columnSelectHeader={branchSelectColumnHeader}
                          selectOptions={buildBranchSelectOptions(branchDrop)}
                          onBlur={handleBlur}
                          errorMessage={errors.branchId}
                          touched={touched.branchId}
                          setFieldValue={setFieldValue}
                          onChange={e =>
                            applyBranchSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              values,
                            })
                          }
                        />
                        <CustomInput
                          type="select"
                          name="warehouseId"
                          label="Warehouse"
                          placeholder={getWarehouseSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.warehouseId}
                          loading={warehouseLoading}
                          required
                          disabled={isEdit || (warehouseRequiresCascade && !values.branchId)}
                          selectVariant="twoColumn"
                          columnSelectHeader={warehouseSelectColumnHeader}
                          selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                          onBlur={handleBlur}
                          errorMessage={errors.warehouseId}
                          touched={touched.warehouseId}
                          setFieldValue={setFieldValue}
                          onChange={e =>
                            applyWarehouseSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              currentBranchId: values.branchId,
                              values,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Document details</h3>
                      <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                        {/* Customer + Booking + Address */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                          <div>
                            <CustomInput
                              type="select"
                              selectVariant="twoColumn"
                              columnSelectHeader={{ id: 'Customer ID', name: 'Customer Name' }}
                              name="customerId"
                              label="Customer Name"
                              placeholder="Select Customer Name"
                              value={values.customerId}
                              loading={customerLoading}
                              required
                              disabled={isEdit}
                              selectOptions={buildCustomerSelectOptions(customerDropDownList, values.branchId)}
                              {...customerSelectDropdownProps}
                              onBlur={handleBlur}
                              errorMessage={errors.customerId}
                              touched={touched.customerId}
                              setFieldValue={setFieldValue}
                              onChange={e => {
                                setFieldValue('customerId', e);
                                setSelectedCustomerId(e);
                                setFieldValue('referenceInvoiceId', null);
                                if (e) {
                                  fetchCustomerAddress(e);
                                } else {
                                  setSelectedAddress(null);
                                  setFieldValue('addressId', null);
                                }
                              }}
                            />
                            {values.customerId && (
                              <AdditionalAddressContainer
                                customerAddress={customerAddress}
                                addressLoading={addressLoading}
                                fetchCustomerAddress={fetchCustomerAddress}
                                selectedCustomer={values.customerId}
                                setFieldValue={setFieldValue}
                                selectedAddress={selectedAddress}
                                setSelectedAddress={setSelectedAddress}
                                showAddButton={true}
                                addressType={ADDRESS_TYPE.BILLING}
                              />
                            )}
                          </div>
                          <CustomInput
                            type="text"
                            name="rejectionOrderId"
                            label="Booking Number"
                            placeholder={bookingConfig?.autoGenerate ? 'Auto-generated' : 'Enter Booking Number'}
                            value={values.rejectionOrderId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.rejectionOrderId}
                            touched={touched.rejectionOrderId}
                            setFieldValue={setFieldValue}
                            disabled={isEdit || bookingConfig?.autoGenerate}
                            suffix={
                              !isEdit && (
                                <Tooltip title="Configure Booking Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500], cursor: 'pointer' }} onClick={() => setIsConfigModalVisible(true)} />
                                </Tooltip>
                              )
                            }
                            required
                          />
                          <PaginatedSelect
                            name="referenceInvoiceId"
                            label="Reference Invoice"
                            placeholder="Select invoice (optional)"
                            value={values.referenceInvoiceId}
                            disabled={!values.customerId}
                            allowClear
                            loading={invoiceDropLoading}
                            setFieldValue={setFieldValue}
                            fetchPage={fetchInvoicePage}
                            resetDeps={[values.customerId]}
                            initialOptions={editOrder?.referenceInvoiceId ? [{ label: editOrder.referenceInvoiceNo || 'Selected invoice', value: refId(editOrder.referenceInvoiceId) }] : []}
                            onChange={(invoiceId, option) => {
                              setFieldValue('referenceInvoiceId', invoiceId || null);
                              if (invoiceId) {
                                const selectedInvoice = option?.raw;
                                if (selectedInvoice?.items?.length) {
                                  const populatedItems = selectedInvoice.items
                                    .filter(invoiceItem => invoiceItem.itemId)
                                    .map((invoiceItem, index) => ({
                                      id: 'inv_' + index + '_' + Date.now(),
                                      itemId: invoiceItem.itemId,
                                      itemName: invoiceItem.itemName || '',
                                      itemNo: invoiceItem.itemNo || '',
                                      watt: '',
                                      booked: invoiceItem.quantity || '',
                                    }));
                                  if (!populatedItems.length) return;
                                  const nextItems = [...populatedItems, { id: 'x' + Date.now(), itemId: null, itemName: '', itemNo: '', watt: '', booked: '' }];
                                  // Don't silently discard manually-entered rows; confirm before overwriting.
                                  const hasManualItems = (values.items || []).some(item => item.itemId);
                                  if (hasManualItems) {
                                    ConfirmModal({
                                      title: 'Replace items?',
                                      content: 'Selecting this invoice will replace the items you have already added. Continue?',
                                      okText: 'Replace',
                                      cancelText: 'Keep mine',
                                      variant: 'warning',
                                      onOk: () => setFieldValue('items', nextItems),
                                    }).showModal();
                                  } else {
                                    setFieldValue('items', nextItems);
                                  }
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Logistics */}
                        <div className="pt-4">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                            <CustomInput
                              type="text"
                              name="transportName"
                              label="Transport Name"
                              placeholder="Enter transport name"
                              value={values.transportName}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput
                              type="text"
                              name="transport"
                              label="LR / Transport No."
                              placeholder="Enter LR / transport no."
                              value={values.transport}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput
                              type="date"
                              name="transportationDate"
                              label="Transportation Date"
                              value={values.transportationDate ? values.transportationDate : null}
                              onBlur={handleBlur}
                              setFieldValue={setFieldValue}
                            />
                            <CustomInput type="date" name="arrivalDate" label="Arrival Date" value={values.arrivalDate ? values.arrivalDate : null} onBlur={handleBlur} setFieldValue={setFieldValue} />
                            <CustomFileUpload
                              name="attachments"
                              label="LR Slip / Lorry Receipt"
                              value={values.attachments}
                              setFieldValue={setFieldValue}
                              onBlur={handleBlur}
                              errorMessage={errors.attachments}
                              touched={touched.attachments}
                              fileType="all"
                              compact
                              multiple={false}
                              maxSize={5}
                              maxFiles={1}
                            />
                          </div>
                        </div>
                        <div className="pt-4">
                          <CustomInput
                            type="textarea"
                            name="note"
                            label="Additional Note"
                            placeholder="Optional note"
                            value={values.note}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="w-96"
                            setFieldValue={setFieldValue}
                          />
                        </div>

                        {/* Items */}
                        <div className="pt-6">
                          <p className="text-[15px] font-semibold text-gray-800">
                            Items to be rejected <span className="text-gray-400 font-normal text-[13px]">(booked qty)</span>
                          </p>
                          <RejectionItemTable
                            values={values}
                            arr={values.items}
                            itemsDrop={allItemDrop}
                            itemsDropLoading={allItemDropLoading}
                            setFieldValue={setFieldValue}
                            errors={errors}
                            touched={touched}
                            handleBlur={handleBlur}
                            handleChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {values?.divisionId && values?.branchId && values?.warehouseId && (
                    <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
                      <CustomButton
                        className="px-8 py-4 min-w-[50px]"
                        type="primary"
                        text="Save"
                        loading={submitLoading}
                        disabled={submitLoading || isViewOnly}
                        onClick={async () => {
                          const errs = await formikRef.current.validateForm();
                          if (Object.keys(errs).length > 0) {
                            setTouched(errorsToTouched(errs));
                            const firstErrorField = Object.keys(errs)[0];
                            scrollToError(firstErrorField, errs);
                            return;
                          }
                          handleSubmit();
                        }}
                      />
                      <CustomButton
                        className="px-8 py-4"
                        type="default"
                        text="Cancel"
                        disabled={submitLoading}
                        onClick={() => navigate(isEdit ? `/${ADMIN_ROUTE_PATHS.rejections.build.detail(rejectionId)}` : `/${ADMIN_ROUTE_PATHS.rejections.root}`)}
                      />
                    </div>
                  )}
                </CustomForm>
              )}
            </Formik>
          )}
        </div>
      </div>
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={() => setIsConfigModalVisible(false)}
        loading={moduleConfigLoading}
        initialConfig={bookingConfig}
        title="Configure Booking Number Preferences"
        description="Auto-generating booking numbers can save your time. Would you like to change your current setting?"
        setConfigDetail={setBookingConfig}
        moduleName={MODULE_NAMES.REJECTION_ORDER}
      />
    </>
  );
}
