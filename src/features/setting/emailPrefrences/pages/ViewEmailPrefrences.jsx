import React, { useEffect, useState } from 'react';

import { Alert, Card, Switch } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';

import { useEmailPreferences } from '@/features/setting/emailPrefrences/useEmailPreferences';

import { useEmailConfig } from '@/features/setting/emailConfig/useEmailConfig';
import Toast from '@/components/ui/common/Toast';

import Icons from 'assets/icons/icon';
import { MODULE_NAMES } from '@/utils/constants';

const EMAIL_CONFIG_REQUIRED = 'Configure and enable email in Settings > Email config before turning on Email Send.';

const SALES_DOCUMENTS = [
  { id: MODULE_NAMES.QUOTATION, label: 'Quotation' },
  { id: MODULE_NAMES.SALES_ORDER, label: 'Sales Order' },
  { id: MODULE_NAMES.DELIVERY_CHALLAN, label: 'Delivery Challan' },
  { id: MODULE_NAMES.INVOICE, label: 'Invoice' },
  { id: MODULE_NAMES.DISPATCH, label: 'Dispatch' },
  { id: MODULE_NAMES.CREDIT_NOTE, label: 'Credit Note' },
];

const PURCHASE_DOCUMENTS = [
  { id: MODULE_NAMES.PURCHASE_ORDER, label: 'Purchase Order' },
  { id: MODULE_NAMES.GRPO, label: 'GRPO' },
  { id: MODULE_NAMES.BILL, label: 'Bill' },
  { id: MODULE_NAMES.DEBIT_NOTE, label: 'Debit Note' },
];

const DOCUMENT_SECTIONS = [
  { id: 'sales', title: 'Sales Documents', documents: SALES_DOCUMENTS },
  { id: 'purchase', title: 'Purchase Documents', documents: PURCHASE_DOCUMENTS },
];

const ALL_DOCUMENTS = DOCUMENT_SECTIONS.flatMap(section => section.documents);

const buildPreferencesMap = moduleEmailConfig => {
  const preferencesByModule = (moduleEmailConfig || []).reduce((acc, item) => {
    if (item?.moduleName) {
      acc[item.moduleName] = {
        isEnabled: Boolean(item.isEnabled),
        isWhatsAppEnabled: Boolean(item.isWhatsAppEnabled),
      };
    }
    return acc;
  }, {});

  return ALL_DOCUMENTS.reduce(
    (acc, doc) => ({
      ...acc,
      [doc.id]: preferencesByModule[doc.id] || {
        isEnabled: false,
        isWhatsAppEnabled: false,
      },
    }),
    {}
  );
};

const DocumentPreferencesTable = ({ documents, preferences, onToggle, isBusy, emailStatus }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="grid grid-cols-[1fr_120px_120px] items-center bg-gray-50 border-b border-gray-200 px-4 py-2.5">
      <span className="text-xs font-semibold text-[#374151]">Document</span>
      <span className="text-xs font-semibold text-[#374151] text-center">Email Send</span>
      <span className="text-xs font-semibold text-[#374151] text-center">WhatsApp Send</span>
    </div>

    {documents.map((doc, index) => (
      <div key={doc.id} className={`grid grid-cols-[1fr_120px_120px] items-center px-4 py-3 ${index < documents.length - 1 ? 'border-b border-gray-100' : ''}`}>
        <span className="text-sm text-[#030711]">{doc.label}</span>
        <div className="flex justify-center">
          <Switch
            disabled={isBusy || emailStatus === 'checking' || emailStatus === 'error'}
            checked={emailStatus === 'configured' && preferences[doc.id]?.isEnabled}
            onChange={checked => onToggle(doc.id, 'isEnabled', checked)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>
        <div className="flex justify-center">
          <Switch
            disabled={isBusy}
            checked={preferences[doc.id]?.isWhatsAppEnabled}
            onChange={checked => onToggle(doc.id, 'isWhatsAppEnabled', checked)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
        </div>
      </div>
    ))}
  </div>
);

const ViewEmailPrefrences = () => {
  const { moduleEmailConfig, loading, saving, getModuleEmailConfig, updateModuleEmailConfig } = useEmailPreferences();
  const { getEmailConfig } = useEmailConfig();
  const [emailStatus, setEmailStatus] = useState('checking');
  const [preferences, setPreferences] = useState(() => buildPreferencesMap([]));

  useEffect(() => {
    const controller = new AbortController();
    setEmailStatus('checking');
    getModuleEmailConfig({ signal: controller.signal });
    getEmailConfig({ signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (result.meta.requestStatus !== 'fulfilled') {
        setEmailStatus('error');
        return;
      }
      const { isEmailEnabled, emailConfiguration: smtp } = result.payload.data;
      setEmailStatus(isEmailEnabled && smtp?.smtpHost && smtp?.smtpPort && smtp?.username && smtp?.hasPassword ? 'configured' : 'missing');
    });
    return () => controller.abort();
  }, [getModuleEmailConfig, getEmailConfig]);

  useEffect(() => {
    const next = buildPreferencesMap(moduleEmailConfig);
    if (emailStatus === 'missing') {
      Object.values(next).forEach(preference => {
        preference.isEnabled = false;
      });
    }
    setPreferences(next);
  }, [moduleEmailConfig, emailStatus]);

  const handleToggle = (moduleName, preferenceName, checked) => {
    if (preferenceName === 'isEnabled' && checked && emailStatus !== 'configured') {
      Toast.warning(EMAIL_CONFIG_REQUIRED);
      return;
    }
    setPreferences(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [preferenceName]: checked,
      },
    }));
  };

  const handleSave = async () => {
    if (isBusy) return;
    if (emailStatus !== 'configured' && Object.values(preferences).some(preference => preference.isEnabled)) {
      Toast.warning(EMAIL_CONFIG_REQUIRED);
      return;
    }
    await updateModuleEmailConfig({
      moduleEmailConfig: ALL_DOCUMENTS.map(doc => ({
        moduleName: doc.id,
        isEnabled: Boolean(preferences[doc.id]?.isEnabled),
        isWhatsAppEnabled: Boolean(preferences[doc.id]?.isWhatsAppEnabled),
      })),
    });
  };

  const isBusy = loading || saving || emailStatus === 'checking' || emailStatus === 'error';

  return (
    <div>
      <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#1677ff1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.MailOutlined className="text-[#1677ff] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Email and Whatsapp Preferences</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure when sales and purchase documents are sent by email and whatsapp.</p>
            </div>
          </div>
          <CustomButton type="primary" text="Save" onClick={handleSave} loading={saving} disabled={isBusy} className="w-full sm:w-auto shrink-0" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {emailStatus === 'missing' && <Alert type="warning" showIcon message="Email configuration required" description={EMAIL_CONFIG_REQUIRED} className="mx-4 mt-4" />}
        {emailStatus === 'error' && (
          <Alert type="error" showIcon message="Unable to check email configuration" description="Reload this page to try again before changing preferences." className="mx-4 mt-4" />
        )}
        {DOCUMENT_SECTIONS.map(section => (
          <Card key={section.id} className="rounded-none border border-gray-200 shadow-sm" loading={loading}>
            <h4 className="text-sm font-semibold text-[#030711] mb-4">{section.title}</h4>
            <DocumentPreferencesTable documents={section.documents} preferences={preferences} onToggle={handleToggle} isBusy={isBusy} emailStatus={emailStatus} />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewEmailPrefrences;
