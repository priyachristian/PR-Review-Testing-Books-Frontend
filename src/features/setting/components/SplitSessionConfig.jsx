import { useState } from 'react';
import { Input } from 'antd';
import { Formik } from 'formik';

// Components
import { Card } from '../../../components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { sessionConfigValidateSchema } from '@/utils/validationsSchema';

const SplitSessionConfig = ({ pin }) => {
  const { sessionPinLoading, createSplitSessionPin } = useProfile();
  const [showPin, setShowPin] = useState(false);
  const { useSplitConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.splitConfig);
  const canEdit = useSplitConfig?.edit && !isViewOnly;
  const saveTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useSplitConfig?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const initialValues = {
    pinNo: pin || '',
  };

  const onFinish = async values => {
    if (!canEdit) return;
    await createSplitSessionPin({ pinNo: values?.pinNo });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <Card
        className="rounded-none border border-gray-200 shadow-sm"
        title={
          <div className="flex items-center gap-3 py-3">
            <div className="bg-[#3b82f61a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.LockOutlined className="text-[#3b82f6] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Session Config</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium ">Manage session-related settings and PIN configurations here.</p>
            </div>
          </div>
        }
      >
        <div className="mt-5">
          {!showPin && (
            <PermissionButton
              canAccess={useSplitConfig?.edit}
              isViewOnly={isViewOnly}
              tooltipTitle={saveTooltip}
              className="px-8 py-4"
              type="primary"
              text="Click To Set PIN"
              onClick={canEdit ? () => setShowPin(true) : undefined}
            />
          )}
          {showPin && (
            <Formik initialValues={initialValues} validationSchema={sessionConfigValidateSchema} onSubmit={onFinish} enableReinitialize>
              {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="flex flex-col items-start gap-y-2">
                    <Input.OTP
                      name="pinNo"
                      value={values.pinNo}
                      onChange={val => setFieldValue('pinNo', val)}
                      onBlur={handleBlur}
                      length={4}
                      className={`custom-otp font-normal ${errors.pinNo && touched.pinNo ? 'border border-red-500' : ''}`}
                      disabled={!canEdit}
                    />
                    {errors.pinNo && touched.pinNo && <div className="text-red-500 text-sm">{errors.pinNo}</div>}
                  </div>
                  <div className="flex justify-end w-full mt-5">
                    <PermissionButton
                      canAccess={useSplitConfig?.edit}
                      isViewOnly={isViewOnly}
                      tooltipTitle={saveTooltip}
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      onClick={canEdit ? handleSubmit : undefined}
                      loading={sessionPinLoading}
                    />
                  </div>
                </CustomForm>
              )}
            </Formik>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SplitSessionConfig;
