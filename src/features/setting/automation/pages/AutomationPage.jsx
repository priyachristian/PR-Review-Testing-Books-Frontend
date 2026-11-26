import { useEffect, useState } from 'react';

import { Card, Form, Radio, Spin, Switch } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';

import { useProfile } from '@/features/setting/profile/useProfile';
import { useUser } from '@/features/setting/user/useUser';
import useModulePermissions from 'hooks/useModulePermissions';
import { PERMISSION_MESSAGES } from '@/utils/constants';

import Icons from 'assets/icons/icon';

const AUTO_PAY_SCOPES = {
  ALL_BRANCHES: 'ALL_BRANCHES',
  BRANCH_WISE: 'BRANCH_WISE',
};

const DEFAULT_MODULE_CONFIG = {
  isEnabled: false,
  scope: AUTO_PAY_SCOPES.ALL_BRANCHES,
};

const resolveScope = scope => (scope === AUTO_PAY_SCOPES.BRANCH_WISE ? AUTO_PAY_SCOPES.BRANCH_WISE : AUTO_PAY_SCOPES.ALL_BRANCHES);

const toFormValues = config => ({
  invoiceEnabled: Boolean(config?.invoice?.isEnabled ?? DEFAULT_MODULE_CONFIG.isEnabled),
  invoiceScope: resolveScope(config?.invoice?.scope),
  billEnabled: Boolean(config?.bill?.isEnabled ?? DEFAULT_MODULE_CONFIG.isEnabled),
  billScope: resolveScope(config?.bill?.scope),
});

const ModuleAutoPaySection = ({ title, description, enabledField, scopeField, form, canEdit }) => {
  const isEnabled = Form.useWatch(enabledField, form);
  const scope = Form.useWatch(scopeField, form);

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="text-base font-semibold text-[#030711] leading-none mb-1">{title}</h4>
          <p className="text-xs text-[#6b7280] font-medium m-0">{description}</p>
        </div>
        <Form.Item name={enabledField} valuePropName="checked" className="mb-0">
          <Switch disabled={!canEdit} checkedChildren="On" unCheckedChildren="Off" />
        </Form.Item>
      </div>

      <Form.Item
        name={scopeField}
        label={isEnabled ? <span className="font-medium text-sm leading-none text-[#030711]">Scope</span> : null}
        rules={[{ required: true, message: 'Please select a scope' }]}
        className={isEnabled ? 'mb-0' : 'mb-0 hidden'}
        preserve
      >
        <Radio.Group disabled={!canEdit}>
          <div className="flex flex-col gap-2">
            <Radio value={AUTO_PAY_SCOPES.ALL_BRANCHES}>All Branches</Radio>
            <Radio value={AUTO_PAY_SCOPES.BRANCH_WISE}>Branch Wise</Radio>
          </div>
        </Radio.Group>
      </Form.Item>

      {isEnabled ? (
        <p className="text-xs text-[#6b7280] mt-3 mb-0">
          {scope === AUTO_PAY_SCOPES.BRANCH_WISE
            ? 'Advances are applied only when the document branch matches the advance payment branch.'
            : 'Advances from any branch can be applied to the document.'}
        </p>
      ) : null}
    </div>
  );
};

const AutomationPage = () => {
  const { getAutoPayConfig, updateAutoPayConfig, autoPayConfig, autoPayConfigFetching, autoPayConfigLoading } = useProfile();
  const { accessRoles } = useUser();
  const [form] = Form.useForm();
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const { isViewOnly } = useModulePermissions();
  const canEdit = accessRoles?.role?.toLowerCase() === 'admin';
  const canSave = canEdit && !isViewOnly;
  const isLoading = autoPayConfigFetching || !hasAttemptedLoad;
  const showForm = !isLoading && autoPayConfig != null;
  const showLoadError = !isLoading && autoPayConfig == null;

  useEffect(() => {
    const controller = new AbortController();
    getAutoPayConfig({ signal: controller.signal }).finally(() => setHasAttemptedLoad(true));
    return () => controller.abort();
  }, [getAutoPayConfig]);

  useEffect(() => {
    if (!autoPayConfig) return;
    form.setFieldsValue(toFormValues(autoPayConfig));
  }, [autoPayConfig, form]);

  const handleSubmit = async values => {
    if (!canSave) return;
    if (!autoPayConfig) return;

    try {
      await updateAutoPayConfig({
        payload: {
          invoice: {
            isEnabled: Boolean(values.invoiceEnabled),
            scope: resolveScope(values.invoiceScope),
          },
          bill: {
            isEnabled: Boolean(values.billEnabled),
            scope: resolveScope(values.billScope),
          },
        },
      });
    } catch (error) {
      console.error('Error in updateAutoPayConfig:', error);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-[#f2e5ff] flex justify-center items-center w-10 h-10 rounded-lg p-2 shrink-0">
              <Icons.SyncOutlined className="text-[#6b26d9] text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Automation</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Automatically apply available advances when invoices are sent or bills are opened, including on create</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 border-t-0 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spin />
          </div>
        ) : showLoadError ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#6b7280] mb-4">Failed to load Auto Pay configuration. Please try again.</p>
            <PermissionButton
              canAccess
              type="primary"
              text="Retry"
              onClick={() => {
                setHasAttemptedLoad(false);
                getAutoPayConfig({}).finally(() => setHasAttemptedLoad(true));
              }}
            />
          </div>
        ) : showForm ? (
          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={toFormValues(autoPayConfig)} disabled={!canSave}>
            <ModuleAutoPaySection
              title="Invoice Auto Pay"
              description="Apply customer advances when an invoice is created as Sent or moves from Draft to Sent"
              enabledField="invoiceEnabled"
              scopeField="invoiceScope"
              form={form}
              canEdit={canSave}
            />

            <div className="border-t border-gray-100 my-6" />

            <ModuleAutoPaySection
              title="Bill Auto Pay"
              description="Apply vendor advances when a bill is created as Open or moves from Draft to Open"
              enabledField="billEnabled"
              scopeField="billScope"
              form={form}
              canEdit={canSave}
            />

            <div className="flex justify-end mt-6">
              <PermissionButton
                canAccess={canEdit && autoPayConfig}
                isViewOnly={isViewOnly}
                tooltipTitle={isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !canEdit || !autoPayConfig ? PERMISSION_MESSAGES.NO_PERMISSION : undefined}
                type="primary"
                text="Save Changes"
                onClick={canSave && autoPayConfig ? () => form.submit() : undefined}
                loading={autoPayConfigLoading}
              />
            </div>
          </Form>
        ) : null}
      </Card>
    </div>
  );
};

export default AutomationPage;
