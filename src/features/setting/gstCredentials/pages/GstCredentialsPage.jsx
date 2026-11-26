import { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';
import { Card, Empty } from 'antd';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from '@/assets/icons/icon';
import { useAllProviderCredentials } from '../useAllProviderCredentials';
import { providerCredentialsValidateSchema } from '../providerCredentials.schema';
import { providerCredentialsColumns } from '../providerCredentials.columns';
import { PROVIDER_OPTIONS, getProviderOption } from '../providerCredentials.constants';
import GstRegistrationGuide from '../components/GstRegistrationGuide';

const GstCredentialsPage = () => {
  const { credentialsList, loading, saving, revealing, getAllCredentials, saveCredentials, removeCredentials, revealPassword } = useAllProviderCredentials();
  const [formMode, setFormMode] = useState(null); // null | { platformName, isUpdate }
  const [revealedByPlatform, setRevealedByPlatform] = useState({});

  useEffect(() => {
    getAllCredentials();
  }, [getAllCredentials]);

  const configuredPlatforms = useMemo(() => new Set(credentialsList.map(item => item.platformName)), [credentialsList]);
  const availablePlatformOptions = useMemo(() => PROVIDER_OPTIONS.filter(option => !configuredPlatforms.has(option.value)), [configuredPlatforms]);

  const handleReveal = async platformName => {
    if (revealedByPlatform[platformName] !== undefined) {
      setRevealedByPlatform(prev => {
        const next = { ...prev };
        delete next[platformName];
        return next;
      });
      return;
    }
    const result = await revealPassword(platformName);
    if (result.success) setRevealedByPlatform(prev => ({ ...prev, [platformName]: result.password }));
  };

  const handleDelete = async platformName => {
    await removeCredentials(platformName);
  };

  const columns = providerCredentialsColumns({
    onEdit: platformName => setFormMode({ platformName, isUpdate: true }),
    onDelete: handleDelete,
    onReveal: handleReveal,
    revealing,
    revealedByPlatform,
  });

  const showTable = !formMode && (loading || credentialsList.length > 0);

  const editingCredential = formMode?.isUpdate ? credentialsList.find(item => item.platformName === formMode.platformName) : null;
  const selectedProviderOption = getProviderOption(formMode?.platformName);

  const initialValues = {
    platformName: formMode?.platformName ?? null,
    username: editingCredential?.username ?? '',
    password: '',
  };

  const handleSubmit = async values => {
    const result = await saveCredentials(values.platformName, {
      username: values.username?.trim(),
      password: values.password?.trim(),
      isUpdate: Boolean(formMode?.isUpdate),
    });
    if (result.success) setFormMode(null);
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#e8f4fc] flex justify-center items-center w-10 h-10 rounded-lg shrink-0">
              <Icons.LockOutlined className="text-[#1E3A56] text-lg" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#030711] tracking-tight leading-tight">GST portal credentials</h3>
              <p className="text-xs text-[#6b7280]">Portal logins used to generate e-invoices and e-way bills.</p>
            </div>
          </div>

          {!formMode && availablePlatformOptions.length > 0 && (
            <CustomButton
              icon={<Icons.PlusCircleOutlined style={{ fontSize: 14 }} />}
              text="Add Credentials"
              type="primary"
              className="w-full sm:w-auto shrink-0"
              onClick={() => setFormMode({ platformName: null, isUpdate: false })}
              disabled={loading}
            />
          )}
        </div>
      </div>

      {showTable ? (
        <CustomTable
          columns={columns}
          data={credentialsList.map(item => ({ ...item, key: item.id || item.platformName }))}
          loading={loading}
          tableId="key"
          pagination={false}
          dynamicScrollY={false}
          isPaginationFixed={false}
        />
      ) : (
        <Card className="rounded-none border border-gray-200 shadow-sm mt-0">
          {formMode ? (
            <div className="py-1">
              {selectedProviderOption?.value === undefined && <GstRegistrationGuide />}

              <Formik initialValues={initialValues} validationSchema={providerCredentialsValidateSchema(Boolean(formMode.isUpdate))} onSubmit={handleSubmit} enableReinitialize>
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm, setFieldValue }) => {
                  return (
                    <CustomForm name="GstCredentialsForm" onFinish={submitForm}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <CustomInput
                          type="select"
                          name="platformName"
                          label="Platform"
                          placeholder="Select a provider"
                          value={values.platformName}
                          selectOptions={formMode.isUpdate ? PROVIDER_OPTIONS : availablePlatformOptions}
                          onChange={value => setFieldValue('platformName', value)}
                          onBlur={handleBlur}
                          setFieldValue={setFieldValue}
                          disabled={formMode.isUpdate}
                          errorMessage={errors.platformName}
                          touched={touched.platformName}
                          required
                        />

                        <CustomInput
                          type="text"
                          name="username"
                          label="Portal username"
                          placeholder="Enter portal username"
                          value={values.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.username}
                          touched={touched.username}
                          setFieldValue={setFieldValue}
                          required
                        />

                        <div>
                          <CustomInput
                            type="password"
                            name="password"
                            label="Portal password"
                            placeholder={formMode.isUpdate ? 'Leave blank to keep current password' : 'Enter portal password'}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.password}
                            touched={touched.password}
                            setFieldValue={setFieldValue}
                            required={!formMode.isUpdate}
                          />
                          {formMode.isUpdate && !errors.password && <p className="text-xs text-[#6b7280] mt-1">Leave blank to keep the current password. The saved password is never shown here.</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <CustomButton text={saving ? 'Saving...' : 'Save'} type="primary" className="px-5" disabled={saving || !values.platformName} onClick={submitForm} />
                        <CustomButton text="Cancel" type="default" className="px-5" onClick={() => setFormMode(null)} disabled={saving} />
                      </div>
                    </CustomForm>
                  );
                }}
              </Formik>
            </div>
          ) : (
            <div className="py-1">
              <GstRegistrationGuide />
              <Empty description="No GST portal credentials configured" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default GstCredentialsPage;
