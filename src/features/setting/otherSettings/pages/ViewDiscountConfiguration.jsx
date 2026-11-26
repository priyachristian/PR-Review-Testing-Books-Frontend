import React, { useEffect } from 'react';
import { Formik } from 'formik';

import { Card } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

import { RESOURCES } from '@/utils/jsonFile';
import { PERMISSION_MESSAGES } from 'utils/constants';
import { discountValidationSchema } from '@/utils/validationsSchema';
import Icons from 'assets/icons/icon';

const ViewDiscountConfiguration = () => {
  const { companyProfileSettings, getCompanyProfileSettings, updateDiscountConfig, discountConfigLoading } = useProfile();
  const { useDiscountConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.discountConfig);
  const canEdit = useDiscountConfig?.edit && !isViewOnly;
  const configTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useDiscountConfig?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  useEffect(() => {
    getCompanyProfileSettings({});
  }, [getCompanyProfileSettings]);

  const initialDiscountValues = {
    isEnabled: companyProfileSettings?.discountConfig?.isEnabled || false,
    appliesTo: companyProfileSettings?.discountConfig?.appliesTo || '',
  };

  const onFinishDiscount = async values => {
    if (!canEdit) return;
    const payload = {
      isEnabled: values?.isEnabled,
      appliesTo: values?.appliesTo,
    };
    await updateDiscountConfig({ discountConfig: payload });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  if (!useDiscountConfig?.view) {
    return null;
  }

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex items-center gap-3">
          <div className="bg-[#7c3bed1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
            <Icons.ApartmentOutlined className="text-[#7c3bed] items-center text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Discount Configuration</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium ">Configure Discount for the company</p>
          </div>
        </div>
      </div>
      <Card className="rounded-none border border-gray-200 shadow-sm">
        <Formik initialValues={initialDiscountValues} validationSchema={discountValidationSchema} onSubmit={onFinishDiscount} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
            return (
              <CustomForm name="Default-Configuration" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CustomInput
                    type="checkbox"
                    name="isEnabled"
                    label=""
                    CheckboxName="Enable Discount for the company"
                    value={values.isEnabled}
                    onChange={e => {
                      setFieldValue('isEnabled', e?.target?.checked);
                      setFieldValue('appliesTo', '');
                    }}
                    onBlur={handleBlur}
                    errorMessage={errors.isEnabled}
                    touched={touched.isEnabled}
                    setFieldValue={setFieldValue}
                    disabled={!canEdit}
                  />
                </div>
                {values.isEnabled && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                    <CustomInput
                      type="select"
                      name="appliesTo"
                      label="Discount Applies On"
                      placeholder="Select Discount Applies On"
                      value={values?.appliesTo || null}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.appliesTo}
                      touched={touched.appliesTo}
                      setFieldValue={setFieldValue}
                      selectOptions={[
                        { value: 'ITEM', label: 'Item Level' },
                        { value: 'TRANSACTION', label: 'Transaction Level' },
                      ]}
                      required
                      disabled={!canEdit}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <PermissionButton
                    canAccess={useDiscountConfig?.edit}
                    isViewOnly={isViewOnly}
                    tooltipTitle={configTooltip}
                    className="px-6 py-2"
                    type="primary"
                    text="Save Configuration"
                    icon={<Icons.CheckOutlined className="h-4 w-4" />}
                    onClick={canEdit ? handleSubmit : undefined}
                    loading={discountConfigLoading}
                  />
                </div>
              </CustomForm>
            );
          }}
        </Formik>
      </Card>
    </div>
  );
};

export default ViewDiscountConfiguration;
