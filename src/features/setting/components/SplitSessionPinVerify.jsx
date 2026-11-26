import React from 'react';
import { useDispatch } from 'react-redux';
import { Input } from 'antd';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { setSplitSession } from 'features/common/commonSlice';
import { sessionConfigValidateSchema } from '@/utils/validationsSchema';

const SplitSessionPinVerify = ({ modalOpen, handleModalClose }) => {
  const dispatch = useDispatch();
  const { sessionPinLoading, verifySplitSessionPin } = useProfile();
  const modalBodyRef = React.useRef(null);

  const initialValues = {
    pinNo: '',
  };

  const onFinish = async values => {
    const result = await verifySplitSessionPin({ pinNo: values?.pinNo });

    if (result?.extras) {
      localStorage.setItem('splitSession', Date.now().toString());
      dispatch(setSplitSession(true));
      handleModalClose();
    }
  };

  const onFinishFailed = () => {};

  React.useEffect(() => {
    if (!modalOpen) return;
    const timer = setTimeout(() => {
      modalBodyRef.current?.querySelector('input')?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [modalOpen]);

  return (
    <>
      <CustomModal
        modalOpen={modalOpen}
        setModalOpen={open => {
          if (!open) handleModalClose();
        }}
        afterOpenChange={open => {
          if (open) modalBodyRef.current?.querySelector('input')?.focus();
        }}
        title="Session PIN Verification"
        width={520}
      >
        <div ref={modalBodyRef} className="mt-2">
          <p className="text-base mb-3">Enter PIN to activate session</p>
          <Formik initialValues={initialValues} validationSchema={sessionConfigValidateSchema} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
              <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="flex flex-col items-start gap-y-2">
                  <Input.OTP
                    name="pinNo"
                    value={values.pinNo}
                    onChange={val => setFieldValue('pinNo', val)}
                    onBlur={handleBlur}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    length={4}
                    className={`custom-otp font-normal ${errors.pinNo && touched.pinNo ? 'border border-red-500' : ''}`}
                  />
                  {errors.pinNo && touched.pinNo && <div className="text-red-500 text-sm">{errors.pinNo}</div>}
                </div>
                <div className="flex justify-end w-full mt-5">
                  <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" onClick={handleSubmit} loading={sessionPinLoading} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </CustomModal>
    </>
  );
};

export default SplitSessionPinVerify;
