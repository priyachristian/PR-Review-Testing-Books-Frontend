import { Formik } from 'formik';
import * as Yup from 'yup';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { useInvoice } from '@/features/sales/invoice';

const AddTransport = ({ transportModalOpen, setTransportModalOpen, transportData, setEditTransportData }) => {
  const { createInvoiceTransport, createLoading, updateInvoiceTransport } = useInvoice();

  const initialValues = {
    name: transportData ? transportData.name : '',
    bookingOfficeAddress: transportData ? transportData.bookingOfficeAddress : '',
    gstNo: transportData ? transportData.gstNo : '',
    trackingLink: transportData ? transportData.trackingLink : '',
  };

  const transportValidateSchema = Yup.object().shape({
    name: Yup.string().required('Transport Name is required'),
    bookingOfficeAddress: Yup.string().required('Transport Address is required'),
  });

  const onFinish = async (values, { resetForm }) => {
    const transportData1 = {
      name: values.name,
      trackingLink: values.trackingLink,
      bookingOfficeAddress: values.bookingOfficeAddress,
      gstNo: values.gstNo,
    };
    try {
      if (transportData) {
        await updateInvoiceTransport({
          transportId: transportData.id,
          transportData: transportData1,
        });
      } else {
        await createInvoiceTransport(transportData1);
      }
      setTransportModalOpen(false);
      setEditTransportData(null);
      resetForm();
    } catch {
      // error already handled in slice
    }
  };
  const onFinishFailed = errorInfo => {
    console.log(errorInfo);
  };

  return (
    <div>
      <CustomModal
        modalOpen={transportModalOpen}
        setModalOpen={() => {
          setTransportModalOpen(false);
          setEditTransportData(null);
        }}
        width={400}
        title={transportData ? `Edit Transport Details` : 'Add Transport Details'}
      >
        <Formik initialValues={initialValues} validationSchema={transportValidateSchema} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <CustomForm name="Transport" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div className="space-y-2">
                <CustomInput
                  type="text"
                  name="name"
                  label="Transport & Courier Name"
                  placeholder="Enter Transport Name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.name}
                  touched={touched.name}
                  setFieldValue={setFieldValue}
                  required
                />
                <CustomInput
                  type="textarea"
                  name="bookingOfficeAddress"
                  label="Booking Office Address"
                  placeholder="Enter Address"
                  value={values.bookingOfficeAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.bookingOfficeAddress}
                  touched={touched.bookingOfficeAddress}
                  setFieldValue={setFieldValue}
                  required
                />
                <CustomInput
                  type="text"
                  name="gstNo"
                  label="GST Number"
                  placeholder="Enter GST Number"
                  value={values.gstNo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.gstNo}
                  touched={touched.gstNo}
                  setFieldValue={setFieldValue}
                />
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
              </div>
              <div className="flex items-center gap-4 justify-end pt-4">
                <CustomButton
                  type="default"
                  className="py-4 px-5"
                  disabled={createLoading}
                  onClick={() => {
                    setTransportModalOpen(false);
                    setEditTransportData(null);
                  }}
                  text="Cancel"
                />
                <CustomButton type="primary" className="py-4 px-7" onClick={handleSubmit} loading={createLoading} text="Save" style={{ minWidth: 80 }} />
              </div>
            </CustomForm>
          )}
        </Formik>
      </CustomModal>
    </div>
  );
};

export default AddTransport;
