import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

import { Card } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useUser } from '@/features/setting/user/useUser';

import { RESOURCES } from '@/utils/jsonFile';
import { PERMISSION_MESSAGES } from 'utils/constants';
import { shouldPreventNavigation } from '@/utils/util';
import Icons from 'assets/icons/icon';
import { resetBranch } from '@/features/allMaster/branch/branch.slice';
import { warehouseConfigValidateSchema } from '@/utils/validationsSchema';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const ViewDefaultOrganizationConfiguration = () => {
  const dispatch = useDispatch();
  const { companyProfileSettings, getCompanyProfileSettings } = useProfile();
  const { divDrop, getDivDropDown, branchDrop, getBranchDropDown, warehouseDrop, getWarehouseDrop } = useModulePermissions();
  const { defaultConfigLoading, saveDefaultConfiguration } = useUser();
  const [selectedDivisionId, setSelectedDivisionId] = useState();
  const { useDefaultOrganizationConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.defaultOrganizationConfig);
  const canEdit = useDefaultOrganizationConfig?.edit && !isViewOnly;
  const configTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useDefaultOrganizationConfig?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const initialValues = {
    divisionId: companyProfileSettings?.defaultConfiguration?.divisionId || null,
    branchId: companyProfileSettings?.defaultConfiguration?.branchId || null,
    warehouseId: companyProfileSettings?.defaultConfiguration?.warehouseId || null,
  };

  const handleReset = async () => {
    if (!canEdit) return;
    const payload = {
      divisionId: null,
      branchId: null,
      warehouseId: null,
    };
    const result = await saveDefaultConfiguration(payload);
    if (shouldPreventNavigation(result)) {
      return;
    }
    getCompanyProfileSettings({});
  };

  const onFinish = async values => {
    if (!canEdit) return;
    const payload = {
      divisionId: values?.divisionId,
      branchId: values?.branchId,
      warehouseId: values?.warehouseId,
    };
    const result = await saveDefaultConfiguration(payload);
    if (shouldPreventNavigation(result)) {
      return;
    }
    getCompanyProfileSettings({});
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  useEffect(() => {
    const controller = new AbortController();
    const dropdownPayload = { signal: controller.signal, isSplit: true };
    getDivDropDown(dropdownPayload);
    getWarehouseDrop(dropdownPayload);
    getCompanyProfileSettings({ signal: controller.signal });
    return () => controller.abort();
  }, [getDivDropDown, getWarehouseDrop, getCompanyProfileSettings]);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedDivisionId) {
      const payload = { divisionId: selectedDivisionId, signal: controller.signal };
      getBranchDropDown({ ...payload, isSplit: true });
    }
    return () => controller.abort();
  }, [selectedDivisionId, getBranchDropDown]);

  useEffect(() => {
    if (companyProfileSettings?.defaultConfiguration?.divisionId) {
      setSelectedDivisionId(companyProfileSettings?.defaultConfiguration?.divisionId);
    }
  }, [companyProfileSettings?.defaultConfiguration?.divisionId]);

  if (!useDefaultOrganizationConfig?.view) {
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
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Default Organization Configuration</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium ">Set default division, branch, and warehouse for new documents</p>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 shadow-sm">
        <Formik initialValues={initialValues} validationSchema={warehouseConfigValidateSchema} onSubmit={onFinish} enableReinitialize>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
            return (
              <CustomForm name="Default-Configuration" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Icons.InfoCircleOutlined className="text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-[#030711] text-sm mb-1">Configuration Guide</h4>
                      <p className="text-sm text-gray-600">
                        These settings will be automatically applied when creating new documents. You can still change them individually for each document if needed.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CustomInput
                    type="select"
                    name="divisionId"
                    label="Default Division"
                    placeholder="Select Division"
                    labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                    value={values.divisionId}
                    onBlur={handleBlur}
                    errorMessage={errors.divisionId}
                    touched={touched.divisionId}
                    setFieldValue={setFieldValue}
                    required={true}
                    selectVariant="twoColumn"
                    columnSelectHeader={divisionSelectColumnHeader}
                    selectOptions={buildDivisionSelectOptions(divDrop)}
                    onChange={e => {
                      setFieldValue('divisionId', e);
                      setSelectedDivisionId(e);
                      setFieldValue('branchId', null);
                      setFieldValue('warehouseId', null);
                      dispatch(resetBranch());
                    }}
                    disabled={!canEdit}
                  />
                  <CustomInput
                    type="select"
                    name="branchId"
                    label="Default Branch"
                    placeholder="Select Branch"
                    labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                    value={values.branchId}
                    onBlur={handleBlur}
                    errorMessage={errors.branchId}
                    touched={touched.branchId}
                    setFieldValue={setFieldValue}
                    required={true}
                    selectVariant="twoColumn"
                    columnSelectHeader={branchSelectColumnHeader}
                    selectOptions={buildBranchSelectOptions(branchDrop)}
                    onChange={e => {
                      setFieldValue('branchId', e);
                      setFieldValue('warehouseId', null);
                    }}
                    disabled={!canEdit || !values.divisionId}
                  />
                  <CustomInput
                    type="select"
                    name="warehouseId"
                    label="Default Warehouse"
                    placeholder="Select Warehouse"
                    labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                    value={values.warehouseId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.warehouseId}
                    touched={touched.warehouseId}
                    setFieldValue={setFieldValue}
                    required={true}
                    selectVariant="twoColumn"
                    columnSelectHeader={warehouseSelectColumnHeader}
                    selectOptions={buildWarehouseSelectOptions((warehouseDrop || []).filter(warehouse => warehouse?.branchId?.id === values?.branchId))}
                    disabled={!canEdit || !values.branchId}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <PermissionButton
                    canAccess={useDefaultOrganizationConfig?.edit}
                    isViewOnly={isViewOnly}
                    tooltipTitle={configTooltip}
                    className="px-6 py-2"
                    type="default"
                    text="Reset to None"
                    icon={<Icons.UndoOutlined className="h-4 w-4" />}
                    onClick={canEdit ? handleReset : undefined}
                    disabled={defaultConfigLoading || !companyProfileSettings?.defaultConfiguration?.divisionId}
                  />
                  <PermissionButton
                    canAccess={useDefaultOrganizationConfig?.edit}
                    isViewOnly={isViewOnly}
                    tooltipTitle={configTooltip}
                    className="px-6 py-2"
                    type="primary"
                    text="Save Configuration"
                    icon={<Icons.CheckOutlined className="h-4 w-4" />}
                    onClick={canEdit ? handleSubmit : undefined}
                    loading={defaultConfigLoading}
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

export default ViewDefaultOrganizationConfiguration;
