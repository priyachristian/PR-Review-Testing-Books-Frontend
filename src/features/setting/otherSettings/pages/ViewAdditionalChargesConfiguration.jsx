import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Popconfirm, Tag, Tooltip } from 'antd';
import { Formik } from 'formik';

import { Checkbox } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useSetupCharge } from 'hooks/useSetupCharge';

import { RESOURCES } from '@/utils/jsonFile';
import { CHARGE_MODULE_CONFIG, PERMISSION_MESSAGES } from 'utils/constants';
import { colorPalette } from 'utils/theme';
import { chargesValidationSchema } from '@/utils/validationsSchema';
import Icons from 'assets/icons/icon';

const ModuleConfigForm = ({ modalOpen, editData, handleModalClose, getList }) => {
  const { loading, createSetupCharge, updateSetupCharge } = useSetupCharge();
  const { activeFeatures } = useProfile();
  const formikSubmitRef = useRef(null);
  const { useAdditionalChargesConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.additionalChargesConfig);
  const canChangeCharge = !isViewOnly && (useAdditionalChargesConfig?.update || useAdditionalChargesConfig?.add);
  const saveTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAdditionalChargesConfig?.update || !useAdditionalChargesConfig?.add ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const initialValues = useMemo(
    () => ({
      name: editData?.name || '',
      modules: editData?.modules || [],
      isActive: editData?.isActive || false,
      isTaxable: editData?.isTaxable || false,
      taxRate: 18,
    }),
    [editData]
  );

  const onFinish = async values => {
    if (!canChangeCharge) return;
    const payload = {
      name: values?.name,
      modules: values?.modules,
      isActive: values?.isActive,
      isTaxable: values?.isTaxable,
      ...(values?.isTaxable && { taxRate: values?.taxRate }),
    };

    let response = '';
    if (editData?.name) {
      const chargeDataPayload = {
        name: values?.name,
        modules: values?.modules,
        isActive: values?.isActive,
        isTaxable: values?.isTaxable,
        ...(values?.isTaxable && { taxRate: values?.taxRate }),
      };
      response = await updateSetupCharge({
        chargeData: chargeDataPayload,
        chargeName: editData?.name,
      });
    } else {
      response = await createSetupCharge(payload);
    }

    if (response?.data) {
      getList();
      handleModalClose();
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) handleModalClose();
      }}
      title={
        <div className="flex items-start gap-2">
          {editData?.name ? <Icons.EditOutlined className="text-lg text-[#030711] mt-1" /> : <Icons.PlusOutlined className="text-lg text-[#030711] mt-1" />}
          <div>
            <span className="text-lg font-semibold text-[#030711]">{editData?.name ? 'Edit Setup Charge' : 'Add Setup Charge'}</span>
            <p className="text-sm text-[#6b7280] font-medium mt-0.5">{editData?.name ? 'Update the setup charge configuration.' : 'Configure a new additional charge for your modules.'}</p>
          </div>
        </div>
      }
    >
      <Formik validateOnChange={true} initialValues={initialValues} validationSchema={chargesValidationSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
          formikSubmitRef.current = handleSubmit;
          return (
            <div className="mt-6">
              <CustomForm name="Add-Setup-charge" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <CustomInput
                  type="text"
                  name="name"
                  label="Charge Name"
                  placeholder="Enter Charge Name"
                  labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                  className="font-normal h-10 rounded-md"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.name}
                  touched={touched.name}
                  setFieldValue={setFieldValue}
                  required={true}
                  disabled={!canChangeCharge}
                />
                <div className="mt-3">
                  <CustomInput
                    type="select"
                    name="modules"
                    label="Modules"
                    mode="multiple"
                    labelClassName="leading-none font-medium text-sm text-[#030711] mb-1"
                    className="font-normal"
                    value={values.modules}
                    onChange={e => {
                      setFieldValue('modules', e);
                    }}
                    onBlur={handleBlur}
                    errorMessage={errors.modules}
                    touched={touched.modules}
                    setFieldValue={setFieldValue}
                    placeholder="Select Modules"
                    selectOptions={CHARGE_MODULE_CONFIG(activeFeatures)}
                    required={true}
                    disabled={!canChangeCharge}
                  />
                </div>
                <CustomInput
                  type="checkbox"
                  name="isActive"
                  CheckboxName="isActive"
                  value={values.isActive}
                  errorMessage={errors.isActive}
                  touched={touched.isActive}
                  setFieldValue={setFieldValue}
                  checkboxClassName="text-[#030711] font-semibold"
                  disabled={!canChangeCharge}
                />
                <CustomInput
                  type="checkbox"
                  name="isTaxable"
                  CheckboxName="isTaxable"
                  value={values.isTaxable}
                  errorMessage={errors.isTaxable}
                  touched={touched.isTaxable}
                  setFieldValue={setFieldValue}
                  checkboxClassName="text-[#030711] font-medium text-[14px]"
                  disabled={!canChangeCharge}
                />
                {values?.isTaxable && (
                  <div className="mt-3">
                    <CustomInput
                      type="text"
                      name="taxRate"
                      label="Tax Rate in (%)"
                      placeholder="Enter Tax Rate"
                      value={values.taxRate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.taxRate}
                      touched={touched.taxRate}
                      setFieldValue={setFieldValue}
                      required={true}
                      disabled
                    />
                  </div>
                )}
              </CustomForm>
              <div className="flex justify-end gap-2 mt-4">
                <Button key="cancel" onClick={handleModalClose}>
                  Cancel
                </Button>
                <PermissionButton
                  key="submit"
                  canAccess={useAdditionalChargesConfig?.update || useAdditionalChargesConfig?.add}
                  isViewOnly={isViewOnly}
                  tooltipTitle={saveTooltip}
                  type="primary"
                  icon={editData?.name ? <Icons.EditOutlined /> : <Icons.PlusOutlined />}
                  text={editData?.name ? 'Update Setup Charge' : 'Add Setup Charge'}
                  onClick={
                    canChangeCharge && !loading
                      ? () => {
                          formikSubmitRef.current?.();
                        }
                      : undefined
                  }
                  loading={loading}
                />
              </div>
            </div>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

const ViewAdditionalChargesConfiguration = () => {
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const { companyProfileSettings, getCompanyProfileSettings, loading } = useProfile();
  const { deleteSetupCharge } = useSetupCharge();
  const { useAdditionalChargesConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.additionalChargesConfig);

  const canAdd = useAdditionalChargesConfig?.add && !isViewOnly;
  const canUpdate = useAdditionalChargesConfig?.update && !isViewOnly;
  const canDelete = useAdditionalChargesConfig?.delete && !isViewOnly;
  const editTooltip = canUpdate ? 'Edit Charge' : isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const deleteTooltip = canDelete ? 'Delete Charge' : isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

  const handleEdit = record => {
    if (!canUpdate) return;
    setEditData(record);
    setShowAddChargeModal(true);
  };

  const handleDelete = async record => {
    if (!canDelete) return;
    const response = await deleteSetupCharge({ chargeName: record?.name });
    if (response?.data) {
      getCompanyChargesDetails();
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Modules',
      dataIndex: 'modules',
      key: 'modules',
      render: modules => modules?.map(item => <Tag key={item}>{item}</Tag>),
    },
    {
      title: 'Taxable',
      dataIndex: 'isTaxable',
      key: 'isTaxable',
      render: isTaxable => <Checkbox checked={isTaxable} disable className="text-white" />,
    },
    {
      title: 'Tax in (%)',
      dataIndex: 'taxRate',
      key: 'taxRate',
    },
    {
      title: 'Actions',
      key: 'edit',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Tooltip title={editTooltip}>
            <Icons.EditOutlined
              style={{ fontSize: 17, color: colorPalette.primary[500] }}
              className={canUpdate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              onClick={canUpdate ? () => handleEdit(record) : undefined}
            />
          </Tooltip>
          {canDelete ? (
            <Tooltip title={deleteTooltip}>
              <Popconfirm title="Delete Charge" description="Are you sure you want to delete this charge?" onConfirm={() => handleDelete(record)} okText="Yes" cancelText="No">
                <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500] }} className="cursor-pointer" />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title={deleteTooltip}>
              <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500] }} className="opacity-40 cursor-not-allowed" />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const getCompanyChargesDetails = () => {
    getCompanyProfileSettings({});
  };

  useEffect(() => {
    getCompanyChargesDetails();
  }, [getCompanyProfileSettings]);

  const handleModalClose = () => {
    setShowAddChargeModal(false);
    setEditData(null);
  };

  if (!useAdditionalChargesConfig?.view) {
    return null;
  }

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#16a2491a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.DollarOutlined className="text-[#16a249] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Additional Charges Configuration</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure additional charges that can be applied to various modules like quotes, invoices, and sales orders</p>
            </div>
          </div>
          <PermissionButton
            canAccess={useAdditionalChargesConfig?.add}
            isViewOnly={isViewOnly}
            type="primary"
            text="Add Additional Charge"
            icon={<Icons.PlusCircleOutlined />}
            onClick={canAdd ? () => setShowAddChargeModal(true) : undefined}
            className="w-full sm:w-auto"
            wrapperClassName="w-full sm:w-auto inline-block"
          />
        </div>
      </div>
      <CustomTable columns={columns} data={companyProfileSettings?.additionalChargesConfig} loading={loading} />

      {showAddChargeModal && !isViewOnly && (editData ? useAdditionalChargesConfig?.update : useAdditionalChargesConfig?.add) && (
        <ModuleConfigForm modalOpen={showAddChargeModal} setModalOpen={setShowAddChargeModal} handleModalClose={handleModalClose} editData={editData} getList={getCompanyChargesDetails} />
      )}
    </div>
  );
};

export default ViewAdditionalChargesConfiguration;
