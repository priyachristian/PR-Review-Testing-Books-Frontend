import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Components
import AddTransport from './AddTransport';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { useInvoice, clearInvoiceDispatch } from '@/features/sales/invoice';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { toApiDate } from '@/utils/util';

const formatDate = isoString => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const TransportInvoice = ({ modalOpen, setModalOpen, selectedInvoice, setSelectedInvoice, fetchInvoices, clearSelection }) => {
  const {
    invoiceTransport,
    getInvoiceTransport,
    droploading,
    invoiceDispatch,
    getInvoiceDispatch,
    createInvoiceDispatch,
    updateInvoiceDispatch,
    invoiceDispatchLoading,
    dispatchLoading,
    dispatchDeleteLoading,
    removeDispatchInvoice,
  } = useInvoice();
  const [transportModalOpen, setTransportModalOpen] = useState(false);
  const [editTransportData, setEditTransportData] = useState(null);
  const invoiceDispatchId = selectedInvoice?.invoiceDispatchId;
  const dispatch = useDispatch();
  const selectedInvoiceId = selectedInvoice?.id || selectedInvoice?._id;

  // Clear Redux state when selectedInvoice changes and there's no dispatchId
  useEffect(() => {
    if (selectedInvoiceId && !invoiceDispatchId) {
      dispatch(clearInvoiceDispatch());
    }
  }, [selectedInvoiceId, invoiceDispatchId, dispatch]);

  useEffect(() => {
    if (invoiceDispatchId && selectedInvoiceId) {
      getInvoiceDispatch(invoiceDispatchId);
      getInvoiceTransport({});
    }
  }, [invoiceDispatchId, selectedInvoiceId]);

  // Only use invoiceDispatch data if invoiceDispatchId exists, otherwise use empty defaults
  const initialValues = useMemo(() => {
    // If there's no invoiceDispatchId, return empty defaults (don't use Redux state)
    if (!invoiceDispatchId) {
      return {
        invoiceId: '',
        dispatchMode: 'Transport & Courier Service',
        goodsBookingDate: dayjs(),
        approxDeliveryDate: dayjs(),
        transportType: 'Transport',
        transportId: null,
        trackingNumber: '',
        trackingLink: '',
        bookingCopyImage: '',
        truckName: '',
        truckNumber: '',
        driverName: '',
        driverContact: '',
        truck_goodsImage: '',
        deliveryBoyName: '',
        vehicleNumber: '',
        selfDriverName: '',
        selfDriverContact: '',
        vehicle_goodsImage: '',
      };
    }

    // If there's an invoiceDispatchId, use invoiceDispatch from Redux
    return {
      invoiceId: invoiceDispatch?.invoiceId || '',
      dispatchMode: invoiceDispatch?.dispatchMode || 'Transport & Courier Service',
      goodsBookingDate: invoiceDispatch?.goodsBookingDate ? dayjs(invoiceDispatch.goodsBookingDate) : dayjs(),
      approxDeliveryDate: invoiceDispatch?.approxDeliveryDate ? dayjs(invoiceDispatch.approxDeliveryDate) : dayjs(),
      transportType: invoiceDispatch?.transportCourier?.transportType || 'Transport',
      transportId: invoiceDispatch?.transportCourier?.transportId?.id || null,
      trackingNumber: invoiceDispatch?.transportCourier?.trackingNumber || '',
      trackingLink: invoiceDispatch?.transportCourier?.trackingLink || '',
      bookingCopyImage: invoiceDispatch?.transportCourier?.bookingCopyImage || '',
      truckName: invoiceDispatch?.truckLoad?.truckName || '',
      truckNumber: invoiceDispatch?.truckLoad?.truckNumber || '',
      driverName: invoiceDispatch?.truckLoad?.driverName || '',
      driverContact: invoiceDispatch?.truckLoad?.driverContact || '',
      truck_goodsImage: invoiceDispatch?.truckLoad?.truck_goodsImage || '',
      deliveryBoyName: invoiceDispatch?.selfDelivery?.deliveryBoyName || '',
      vehicleNumber: invoiceDispatch?.selfDelivery?.vehicleNumber || '',
      selfDriverName: invoiceDispatch?.selfDelivery?.driverName || '',
      selfDriverContact: invoiceDispatch?.selfDelivery?.driverContact || '',
      vehicle_goodsImage: invoiceDispatch?.selfDelivery?.vehicle_goodsImage || '',
    };
  }, [invoiceDispatchId, invoiceDispatch]);

  const transportValidateSchema = Yup.object().shape({
    dispatchMode: Yup.string()
      .oneOf(['Transport & Courier Service', 'Full Truck Load', 'OurSelf Delivery', 'Pickup By Customer'], 'Please select a dispatch mode')
      .required('Dispatch mode is required'),
    transportType: Yup.string().when('dispatchMode', {
      is: 'Transport & Courier Service',
      then: schema => schema.oneOf(['Transport', 'Courier'], 'Please select a transport type').required('Transport type is required'),
      otherwise: schema => schema.notRequired(),
    }),
    transportId: Yup.string()
      .nullable()
      .when('dispatchMode', {
        is: 'Transport & Courier Service',
        then: schema => schema.required('Please select transport & courier'),
        otherwise: schema => schema.notRequired(),
      }),
  });

  const onFinish = async values => {
    const isTransport = values.dispatchMode === 'Transport & Courier Service';
    const isTruckLoad = values.dispatchMode === 'Full Truck Load';
    const isSelfDelivery = values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer';
    const transportData = {
      ...(!invoiceDispatchId && { invoiceId: selectedInvoiceId }),
      dispatchMode: values.dispatchMode,
      goodsBookingDate: toApiDate(values.goodsBookingDate),
      approxDeliveryDate: toApiDate(values.approxDeliveryDate),

      transportCourier: isTransport
        ? {
            transportType: values.transportType,
            transportId: values.transportId,
            trackingNumber: values.trackingNumber,
            trackingLink: values.trackingLink,
            bookingCopyImage: values.bookingCopyImage,
          }
        : {},

      truckLoad: isTruckLoad
        ? {
            truckName: values.truckName,
            truckNumber: values.truckNumber,
            driverName: values.driverName,
            driverContact: values.driverContact,
            truck_goodsImage: values.truck_goodsImage,
          }
        : {},

      selfDelivery: isSelfDelivery
        ? {
            deliveryBoyName: values.deliveryBoyName,
            vehicleNumber: values.vehicleNumber,
            driverName: values.selfDriverName,
            driverContact: values.selfDriverContact,
            vehicle_goodsImage: values.vehicle_goodsImage,
          }
        : {},
    };

    if (invoiceDispatchId) {
      await updateInvoiceDispatch({
        dispatchId: invoiceDispatchId,
        dispatchData: transportData,
      });
    } else {
      await createInvoiceDispatch({
        dispatchData: transportData,
      });
    }
    fetchInvoices?.();

    setModalOpen(false);
    setSelectedInvoice(null);
    dispatch(clearInvoiceDispatch());

    if (clearSelection) {
      clearSelection();
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('errorInfo', errorInfo);
  };

  const handleDeleteDispatch = async () => {
    await removeDispatchInvoice({ dispatchId: selectedInvoice?.invoiceDispatchId });

    fetchInvoices?.();

    setModalOpen(false);
    setSelectedInvoice(null);
    dispatch(clearInvoiceDispatch());

    if (clearSelection) {
      clearSelection();
    }
  };

  return (
    <div>
      <CustomModal
        modalOpen={modalOpen}
        setModalOpen={() => {
          setModalOpen(false);
          setSelectedInvoice(null);
          dispatch(clearInvoiceDispatch());
        }}
        width={700}
        title="Add Invoice Dispatch Details"
      >
        {dispatchLoading ? (
          <div className="flex justify-center items-center h-[600px]">
            <CustomLoader />
          </div>
        ) : (
          <Formik key={selectedInvoiceId || 'new-invoice'} initialValues={initialValues} validationSchema={transportValidateSchema} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched }) => (
              <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div>
                  <div className="grid grid-cols-2 items-center gap-x-7">
                    <div>
                      <p>
                        <strong>Invoice No:</strong> {selectedInvoice?.invoiceId}
                      </p>
                      <p>
                        <strong>Invoice Date:</strong> {formatDate(selectedInvoice?.invoiceDate)}
                      </p>
                      <p>
                        <strong>Customer Name:</strong> {selectedInvoice?.customerId?.customerDisplayName || selectedInvoice?.customerDisplayName || selectedInvoice?.customerName || '-'}
                      </p>
                    </div>
                    <div className="pe-7">
                      <CustomInput
                        name="dispatchMode"
                        label="Dispatch Mode"
                        type="radio"
                        required
                        value={values.dispatchMode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.dispatchMode}
                        touched={touched.dispatchMode}
                        setFieldValue={setFieldValue}
                        radioOptions={[
                          {
                            value: 'Transport & Courier Service',
                            label: 'Transport & Courier Service',
                          },
                          { value: 'Full Truck Load', label: 'Full Truck Load' },
                          { value: 'OurSelf Delivery', label: 'OurSelf Delivery' },
                          { value: 'Pickup By Customer', label: 'Pickup By Customer' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-4 mt-4 grid grid-cols-2 gap-x-7 gap-y-3">
                    {values.dispatchMode === 'Transport & Courier Service' && (
                      <CustomInput
                        name="transportType"
                        label="Transport Type"
                        type="radio"
                        required={true}
                        value={values.transportType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.transportType}
                        touched={touched.transportType}
                        setFieldValue={setFieldValue}
                        radioOptions={[
                          { value: 'Transport', label: 'Transport' },
                          { value: 'Courier', label: 'Courier' },
                        ]}
                      />
                    )}
                    {values.dispatchMode === 'Transport & Courier Service' && (
                      <div className="flex items-start gap-x-2">
                        <div className="w-full max-w-[300px]">
                          <CustomInput
                            type="select"
                            name="transportId"
                            label="Transport & Courier"
                            placeholder="Select Transport & Courier"
                            value={values.transportId}
                            onBlur={handleBlur}
                            required
                            errorMessage={errors.transportId}
                            touched={touched.transportId}
                            setFieldValue={setFieldValue}
                            editButton={true}
                            onChange={value => {
                              setFieldValue('transportId', value || '');
                              const selectedTransport = invoiceTransport.find(item => item.id === value);
                              if (selectedTransport?.trackingLink) {
                                setFieldValue('trackingLink', selectedTransport.trackingLink);
                              } else {
                                setFieldValue('trackingLink', '');
                              }
                            }}
                            loading={droploading}
                            onFocus={() => getInvoiceTransport({})}
                            selectOptions={invoiceTransport?.map(item => ({
                              value: item.id,
                              label: item.name,
                              onEdit: () => {
                                setEditTransportData(item);
                                setTransportModalOpen(true);
                              },
                            }))}
                          />
                        </div>
                        <Icons.PlusCircleOutlined
                          style={{ color: colorPalette.primary[500] }}
                          onClick={() => {
                            setEditTransportData(null);
                            setTransportModalOpen(true);
                          }}
                          className="text-primary text-xl cursor-pointer w-max py-1.5 mt-7"
                        />
                      </div>
                    )}
                    {values.dispatchMode === 'Transport & Courier Service' && (
                      <>
                        <CustomInput
                          type="text"
                          name="trackingNumber"
                          label="Tracking Number"
                          placeholder="Enter Tracking Number"
                          value={values.trackingNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.trackingNumber}
                          touched={touched.trackingNumber}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {values.dispatchMode === 'Transport & Courier Service' && (
                      <>
                        <CustomInput
                          type="text"
                          name="trackingLink"
                          label="Tracking Link"
                          placeholder="Enter Tracking Link"
                          value={values.trackingLink}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.trackingLink}
                          touched={touched.trackingLink}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {values.dispatchMode === 'Full Truck Load' && (
                      <>
                        <CustomInput
                          type="text"
                          name="truckName"
                          label="Truck Name & Type"
                          placeholder="Enter Truck Name & Type"
                          value={values.truckName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.truckName}
                          touched={touched.truckName}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {values.dispatchMode === 'Full Truck Load' && (
                      <>
                        <CustomInput
                          type="text"
                          name="truckNumber"
                          label="Truck Number"
                          placeholder="Enter Truck Number"
                          value={values.truckNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.truckNumber}
                          touched={touched.truckNumber}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {values.dispatchMode === 'Full Truck Load' && (
                      <>
                        <CustomInput
                          type="text"
                          name="driverName"
                          label="Truck Driver Name"
                          placeholder="Enter Truck Driver Name"
                          value={values.driverName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.driverName}
                          touched={touched.driverName}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {values.dispatchMode === 'Full Truck Load' && (
                      <>
                        <CustomInput
                          type="text"
                          name="driverContact"
                          label="Truck Driver Contact Number"
                          placeholder="Enter Driver Contact Number"
                          value={values.driverContact}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.driverContact}
                          touched={touched.driverContact}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {(values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer') && (
                      <>
                        <CustomInput
                          type="text"
                          name="deliveryBoyName"
                          label="Delivery Or Pickup Boy Name"
                          placeholder="Enter Delivery Or Pickup Boy Name"
                          value={values.deliveryBoyName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.deliveryBoyName}
                          touched={touched.deliveryBoyName}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {(values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer') && (
                      <>
                        <CustomInput
                          type="text"
                          name="vehicleNumber"
                          label="Vehical Number"
                          placeholder="Enter Vehical Number"
                          value={values.vehicleNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.vehicleNumber}
                          touched={touched.vehicleNumber}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {(values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer') && (
                      <>
                        <CustomInput
                          type="text"
                          name="selfDriverName"
                          label="Vehical Driver Name"
                          placeholder="Enter Driver Name"
                          value={values.selfDriverName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.selfDriverName}
                          touched={touched.selfDriverName}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    {(values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer') && (
                      <>
                        <CustomInput
                          type="text"
                          name="selfDriverContact"
                          label="Delivery Or Pickup Boy Contact Number"
                          placeholder="Enter Contact Number"
                          value={values.selfDriverContact}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.selfDriverContact}
                          touched={touched.selfDriverContact}
                          setFieldValue={setFieldValue}
                        />
                      </>
                    )}
                    <CustomInput
                      type="date"
                      name="goodsBookingDate"
                      label="Goods Booking Date"
                      value={values.goodsBookingDate ? values.goodsBookingDate : null}
                      setFieldValue={setFieldValue}
                      setFieldTouched={setFieldTouched}
                      onBlur={handleBlur}
                      errorMessage={errors.goodsBookingDate}
                      touched={touched.goodsBookingDate}
                      placeholder="Select Date"
                      format="YYYY-MM-DD"
                    />
                    <CustomInput
                      type="date"
                      name="approxDeliveryDate"
                      label="Approx Delivery Date"
                      value={values.approxDeliveryDate ? values.approxDeliveryDate : null}
                      setFieldValue={setFieldValue}
                      setFieldTouched={setFieldTouched}
                      onBlur={handleBlur}
                      errorMessage={errors.approxDeliveryDate}
                      touched={touched.approxDeliveryDate}
                      placeholder="Select Date"
                      format="YYYY-MM-DD"
                    />
                    {values.dispatchMode === 'Transport & Courier Service' && (
                      <CustomFileUpload
                        name="bookingCopyImage"
                        label="Attach Booking Copy"
                        value={values.bookingCopyImage}
                        setFieldValue={setFieldValue}
                        onBlur={handleBlur}
                        errorMessage={errors.bookingCopyImage}
                        touched={touched.bookingCopyImage}
                        fileType="all"
                        multiple={true}
                        maxSize={5}
                        maxFiles={1}
                      />
                    )}
                    {values.dispatchMode === 'Full Truck Load' && (
                      <CustomFileUpload
                        name="truck_goodsImage"
                        label="Truck & Goods Image"
                        value={values.truck_goodsImage}
                        setFieldValue={setFieldValue}
                        onBlur={handleBlur}
                        errorMessage={errors.truck_goodsImage}
                        touched={touched.truck_goodsImage}
                        fileType="all"
                        multiple={true}
                        maxSize={5}
                        maxFiles={3}
                      />
                    )}
                    {(values.dispatchMode === 'OurSelf Delivery' || values.dispatchMode === 'Pickup By Customer') && (
                      <CustomFileUpload
                        name="vehicle_goodsImage"
                        label="Vehical & Goods Image"
                        value={values.vehicle_goodsImage}
                        setFieldValue={setFieldValue}
                        onBlur={handleBlur}
                        errorMessage={errors.vehicle_goodsImage}
                        touched={touched.vehicle_goodsImage}
                        fileType="all"
                        multiple={true}
                        maxSize={5}
                        maxFiles={3}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 justify-end pt-4">
                    <CustomButton
                      type="default"
                      className="py-4 px-5"
                      onClick={() => {
                        setModalOpen(false);
                        setSelectedInvoice(null);
                        dispatch(clearInvoiceDispatch());
                      }}
                      text="Cancel"
                      disabled={dispatchDeleteLoading || invoiceDispatchLoading}
                    />
                    {selectedInvoice?.invoiceDispatchId && (
                      <CustomButton
                        danger
                        type="default"
                        className="py-4 px-7"
                        onClick={() => handleDeleteDispatch()}
                        text="Delete"
                        loading={dispatchDeleteLoading}
                        disabled={invoiceDispatchLoading}
                      />
                    )}
                    <CustomButton
                      type="primary"
                      className="py-4 px-7"
                      onClick={handleSubmit}
                      text={`${invoiceDispatchId ? 'Update' : 'Save'}`}
                      loading={invoiceDispatchLoading}
                      disabled={dispatchDeleteLoading || invoiceDispatchLoading}
                    />
                  </div>
                </div>
              </CustomForm>
            )}
          </Formik>
        )}
      </CustomModal>
      <AddTransport transportModalOpen={transportModalOpen} setTransportModalOpen={setTransportModalOpen} transportData={editTransportData} setEditTransportData={setEditTransportData} />
    </div>
  );
};

export default TransportInvoice;
