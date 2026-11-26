import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card } from 'antd';
import { Formik } from 'formik';

import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import SplitSessionConfig from '../../components/SplitSessionConfig';

import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { branchConfigValidateSchema } from '@/utils/validationsSchema';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const SplitConfigPage = () => {
  const dispatch = useDispatch();
  const { divDrop, getDivDropDown, branchDrop, getBranchDropDown, warehouseDrop, getWarehouseDrop } = useModulePermissions();
  const { companyProfileSettings, getCompanyProfileSettings, branchConfigLoading, updateBranchConfig } = useProfile();
  const { useSplitConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.splitConfig);
  const canEdit = useSplitConfig?.edit && !isViewOnly;
  const saveTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useSplitConfig?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const [selectedDivisionId, setSelectedDivisionId] = useState();

  const initialValues = {
    divisionId: companyProfileSettings?.branchConfig?.divisionId || null,
    branchId: companyProfileSettings?.branchConfig?.branchId || null,
    warehouseId: companyProfileSettings?.branchConfig?.warehouseId || null,
    splitConfig: companyProfileSettings?.branchConfig?.splitConfig || false,
  };

  const onFinish = async values => {
    if (!canEdit) return;
    let payload = {
      divisionId: values?.divisionId || null,
      branchId: values?.branchId || null,
      warehouseId: values?.warehouseId || null,
      splitConfig: values?.splitConfig,
    };
    let result = await updateBranchConfig({ payload });
    if (result?.data) getCompanyProfileSettings({});
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };
    getDivDropDown({ ...payload, isSplit: true });
    getWarehouseDrop({ ...payload, isSplit: true });
    getCompanyProfileSettings(payload);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (selectedDivisionId) {
      const payload = { divisionId: selectedDivisionId, signal: controller.signal };
      getBranchDropDown({ ...payload, isSplit: true });
    }
    return () => controller.abort();
  }, [selectedDivisionId]);

  useEffect(() => {
    if (companyProfileSettings?.branchConfig?.divisionId) {
      setSelectedDivisionId(companyProfileSettings?.branchConfig?.divisionId);
    }
  }, [companyProfileSettings?.branchConfig?.divisionId]);

  return (
    <div>
      <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="bg-[#f2e5ff] flex justify-center items-center w-10 h-10 rounded-lg p-2 shrink-0">
            <Icons.BranchesOutlined className="text-[#6b26d9] text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Split Configuration</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure split and distribution settings</p>
          </div>
        </div>
      </div>
      <div>
        <Card className="rounded-none border border-t-0 border-gray-200 shadow-sm">
          <div>
            <Formik initialValues={initialValues} validationSchema={branchConfigValidateSchema} onSubmit={onFinish} enableReinitialize>
              {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
                <CustomForm name="Add-Timesheet" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                    <CustomInput
                      type="select"
                      name="divisionId"
                      label="Division"
                      placeholder="Select Division"
                      labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                      value={values.divisionId}
                      onBlur={handleBlur}
                      errorMessage={errors.divisionId}
                      touched={touched.divisionId}
                      setFieldValue={setFieldValue}
                      required={values.splitConfig}
                      allowClear={!values.splitConfig}
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
                      label="Branch"
                      placeholder="Select Branch"
                      labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                      value={values.branchId}
                      onBlur={handleBlur}
                      errorMessage={errors.branchId}
                      touched={touched.branchId}
                      setFieldValue={setFieldValue}
                      required={values.splitConfig}
                      allowClear={!values.splitConfig}
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
                      label="Warehouse"
                      placeholder="Select Warehouse"
                      labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                      value={values.warehouseId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.warehouseId}
                      touched={touched.warehouseId}
                      setFieldValue={setFieldValue}
                      required={values.splitConfig}
                      allowClear={!values.splitConfig}
                      selectVariant="twoColumn"
                      columnSelectHeader={warehouseSelectColumnHeader}
                      selectOptions={buildWarehouseSelectOptions((warehouseDrop || []).filter(warehouse => warehouse?.branchId?.id === values?.branchId))}
                      disabled={!canEdit || !values.branchId}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                    <CustomInput
                      type="switch"
                      name="splitConfig"
                      label="Split"
                      value={values.splitConfig}
                      onChange={checked => {
                        setFieldValue('splitConfig', checked);
                      }}
                      onBlur={handleBlur}
                      errorMessage={errors.splitConfig}
                      touched={touched.splitConfig}
                      setFieldValue={setFieldValue}
                      disabled={!canEdit}
                    />
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
                      loading={branchConfigLoading}
                    />
                  </div>
                </CustomForm>
              )}
            </Formik>
          </div>
        </Card>
      </div>
      <SplitSessionConfig pin={companyProfileSettings?.pinNo || ''} />
    </div>
  );
};

export default SplitConfigPage;
