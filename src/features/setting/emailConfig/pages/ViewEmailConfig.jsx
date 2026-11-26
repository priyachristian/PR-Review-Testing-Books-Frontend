import React, { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';
import { Tooltip } from '@/components/AntDComponent';

import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

import { useEmailConfig } from '@/features/setting/emailConfig/useEmailConfig';
import { emailConfigValidateSchema } from '@/features/setting/emailConfig/emailConfig.schema';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const EMAIL_PROVIDERS = [
  { label: 'Google', value: 'smtp.gmail.com', port: 587, secure: false },
  { label: 'Outlook', value: 'smtp.office365.com', port: 587, secure: false },
  { label: 'Yahoo', value: 'smtp.mail.yahoo.com', port: 587, secure: false },
  { label: 'Zoho', value: 'smtp.zoho.com', port: 587, secure: false },
  { label: 'iCloud', value: 'smtp.mail.me.com', port: 587, secure: false },
  { label: 'Amazon SES', value: 'email-smtp.amazonaws.com', port: 587, secure: false },
  { label: 'SendGrid', value: 'smtp.sendgrid.net', port: 587, secure: false },
  { label: 'Mailgun', value: 'smtp.mailgun.org', port: 587, secure: false },
  { label: 'Brevo', value: 'smtp-relay.brevo.com', port: 587, secure: false },
];

const HOST_NAME_OPTIONS = EMAIL_PROVIDERS.map(({ label, value }) => ({ label, value }));

const INITIAL_VALUES = {
  smtpHost: null,
  smtpPort: '',
  username: '',
  password: '',
  secure: false,
};

const getProviderLabel = smtpHost => EMAIL_PROVIDERS.find(item => item.value === smtpHost)?.label || '-';

const mapConfigToFormValues = emailConfiguration => {
  if (!emailConfiguration?.smtpHost) return INITIAL_VALUES;
  return {
    smtpHost: emailConfiguration.smtpHost || null,
    smtpPort: emailConfiguration.smtpPort ?? '',
    username: emailConfiguration.username || '',
    // Never round-trip the SMTP password: the backend no longer returns it, and we
    // must not prefill it. Blank means "keep the stored password" on submit.
    password: '',
    secure: Boolean(emailConfiguration.secure),
  };
};

const emailConfigColumns = () => [
  {
    title: 'Provider',
    key: 'provider',
    dataIndex: 'provider',
  },
  {
    title: 'Username',
    key: 'username',
    dataIndex: 'username',
  },
  {
    title: 'Port',
    key: 'smtpPort',
    dataIndex: 'smtpPort',
  },
];

export const SMTP_PASSWORD_STEPS = [
  {
    provider: 'Google',
    steps: [
      'Sign in to your Google Account.',
      'Enable 2-Step Verification.',
      'Open Google Account → Security → App Passwords.',
      'Select "Mail" as the app.',
      'Select "Other (Custom name)" and enter your application name.',
      'Click "Generate".',
      'Copy the generated 16-character App Password.',
      'Paste the App Password into the Password field.',
    ],
  },
  {
    provider: 'Outlook',
    steps: [
      'Sign in to your Microsoft Account.',
      'Enable Multi-Factor Authentication (MFA) if required.',
      'Generate an App Password from Security settings.',
      'Use the generated App Password in the Password field.',
    ],
  },
  {
    provider: 'Yahoo',
    steps: ['Sign in to your Yahoo Account.', 'Open Account Security.', 'Click "Generate App Password".', 'Copy the generated password.', 'Paste it into the Password field.'],
  },
  {
    provider: 'Zoho',
    steps: ['Sign in to your Zoho Account.', 'Navigate to Security → App Passwords.', 'Generate a new App Password.', 'Paste it into the Password field.'],
  },
  {
    provider: 'iCloud',
    steps: ['Sign in to your Apple ID.', 'Open Sign-In and Security.', 'Generate an App-Specific Password.', 'Use the generated password in the Password field.'],
  },
];

const EmailConfigForm = ({ initialValues, onSubmit, onCancel, onConfirmEmail, saving, testing, isEmailConfirmed, hasPassword }) => (
  <Formik enableReinitialize initialValues={initialValues} validationSchema={emailConfigValidateSchema(hasPassword)} onSubmit={onSubmit}>
    {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
      const handleProviderChange = smtpHost => {
        const provider = EMAIL_PROVIDERS.find(item => item.value === smtpHost);
        setFieldValue('smtpHost', smtpHost);
        if (provider) {
          setFieldValue('smtpPort', provider.port);
          setFieldValue('secure', provider.secure);
        }
      };

      return (
        <CustomForm name="email-config" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
            <CustomInput
              type="select"
              name="smtpHost"
              label="Host Name"
              placeholder="Select email provider"
              value={values.smtpHost}
              onBlur={handleBlur}
              setFieldValue={(_name, value) => handleProviderChange(value)}
              selectOptions={HOST_NAME_OPTIONS}
              errorMessage={errors.smtpHost}
              touched={touched.smtpHost}
              required
              allowClear
            />
            <CustomInput
              type="number"
              name="smtpPort"
              label="Port"
              placeholder="e.g. 587"
              value={values.smtpPort}
              onBlur={handleBlur}
              setFieldValue={(name, value) => setFieldValue(name, value === '' || value == null ? '' : Number(value))}
              errorMessage={errors.smtpPort}
              touched={touched.smtpPort}
              required
            />
            <CustomInput
              type="email"
              name="username"
              label="Username"
              placeholder="example@gmail.com"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              setFieldValue={setFieldValue}
              errorMessage={errors.username}
              touched={touched.username}
              required
            />
            <CustomInput
              type="password"
              name="password"
              label="Password"
              placeholder={hasPassword ? 'Leave blank to keep current password' : 'Enter app password / SMTP key'}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              setFieldValue={setFieldValue}
              errorMessage={errors.password}
              touched={touched.password}
              required={!hasPassword}
            />
            <CustomInput type="switch" name="secure" label="Secure" value={values.secure} onChange={handleChange} setFieldValue={setFieldValue} />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <CustomButton
              type="default"
              text="Confirm Email"
              onClick={() => {
                const smtpPort = Number(values.smtpPort);
                let secure = Boolean(values.secure);
                if (smtpPort !== 465 && secure) {
                  secure = false;
                  setFieldValue('secure', false);
                  Toast.warning('Secure is only allowed for port 465. Secure has been turned Off.');
                }
                onConfirmEmail({ ...values, smtpPort, secure });
              }}
              loading={testing}
              disabled={saving}
            />
            {onCancel ? <CustomButton type="default" text="Cancel" onClick={onCancel} disabled={saving || testing} /> : null}
            <CustomButton type="primary" text="Save" onClick={handleSubmit} loading={saving} disabled={!isEmailConfirmed} />
          </div>
        </CustomForm>
      );
    }}
  </Formik>
);

const ViewEmailConfig = () => {
  const { emailConfiguration, loading, saving, testing, getEmailConfig, updateEmailConfig, testEmailConfig } = useEmailConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getEmailConfig({ signal: controller.signal });
    return () => controller.abort();
  }, [getEmailConfig]);

  const hasConfig = Boolean(emailConfiguration?.smtpHost);
  const showForm = !hasConfig || isEditing;

  const tableData = useMemo(() => {
    if (!emailConfiguration?.smtpHost) return [];
    return [
      {
        key: 'email-config',
        provider: getProviderLabel(emailConfiguration.smtpHost),
        username: emailConfiguration.username,
        smtpPort: emailConfiguration.smtpPort,
      },
    ];
  }, [emailConfiguration]);

  const columns = useMemo(() => emailConfigColumns(), []);

  const handleConfirmEmail = async values => {
    const emailConfiguration = {
      smtpHost: values.smtpHost,
      smtpPort: Number(values.smtpPort),
      secure: Boolean(values.secure),
      username: values.username,
    };
    // Only send the password when the user actually typed one; otherwise omit it so
    // the backend uses the stored password. Never send an empty password.
    if (values.password) emailConfiguration.password = values.password;

    const payload = await testEmailConfig(emailConfiguration);

    setIsEmailConfirmed(payload?.meta?.requestStatus === 'fulfilled');
  };

  const handleSubmit = async values => {
    const emailConfiguration = {
      smtpHost: values.smtpHost,
      smtpPort: Number(values.smtpPort),
      secure: Boolean(values.secure),
      username: values.username,
    };
    // Only send the password when the user actually typed one; otherwise omit it so
    // the backend keeps the stored password. Never send an empty password.
    if (values.password) emailConfiguration.password = values.password;

    await updateEmailConfig({
      isEmailEnabled: true,
      emailConfiguration,
    });
    setIsEditing(false);
    setIsEmailConfirmed(false);
  };

  const handleEdit = () => {
    setIsEmailConfirmed(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEmailConfirmed(false);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex items-center gap-3">
          <div className="bg-[#1677ff1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
            <Icons.MailOutlined className="text-[#1677ff] items-center text-xl" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Email Config</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure your email server connection settings</p>
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="bg-white shadow-sm border border-gray-200 border-t-0 px-4 py-4">
          <EmailConfigForm
            initialValues={mapConfigToFormValues(emailConfiguration)}
            onSubmit={handleSubmit}
            onCancel={hasConfig ? handleCancelEdit : undefined}
            onConfirmEmail={handleConfirmEmail}
            saving={saving}
            testing={testing}
            isEmailConfirmed={isEmailConfirmed}
            hasPassword={Boolean(emailConfiguration?.hasPassword)}
          />
        </div>
      ) : (
        <CustomTable
          columns={columns}
          data={tableData}
          loading={loading}
          isPaginationFixed={false}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 100,
            visible: true,
            render: () => (
              <Tooltip title="Edit email config">
                <Icons.EditOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={handleEdit} />
              </Tooltip>
            ),
          })}
        />
      )}

      <div className="mt-8 border-t pt-6 pl-4">
        <h3 className="text-base font-semibold mb-4">How to Generate an SMTP Password</h3>

        {SMTP_PASSWORD_STEPS.map(({ provider, steps }) => (
          <div key={provider} className="mb-6">
            <h4 className="font-medium text-primary mb-2">{provider}</h4>

            <ol className="list-decimal ml-5 space-y-1 text-sm text-gray-600">
              {steps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewEmailConfig;
