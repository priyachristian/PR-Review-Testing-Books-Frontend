import { useState } from 'react';

import { TEMPLATE_META } from '../whatsappTemplates';
import TemplateConfigCard from './TemplateConfigCard';
import TemplateConfigModal from './TemplateConfigModal';

const TemplatesConfigSection = ({ config, onSave, saving, maxPhones = 0, planEnabled = true, isCustomPlan = false, onPlanAction }) => {
  const [activeKey, setActiveKey] = useState(null);
  const activeTemplate = TEMPLATE_META.find(t => t.key === activeKey) || null;

  const handleTemplateConfigure = key => {
    if (!planEnabled) {
      onPlanAction?.();
      return;
    }

    setActiveKey(key);
  };

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <p className="text-sm font-semibold text-[#030711] mb-1">Report templates</p>
      <p className="text-xs text-[#6b7280] mb-4">Preview each report below. Configure a template to set phone numbers and schedules — each is sent independently.</p>

      <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
        {TEMPLATE_META.map(t => (
          <TemplateConfigCard key={t.key} template={t} config={config} maxPhones={maxPhones} planEnabled={planEnabled} isCustomPlan={isCustomPlan} onConfigure={() => handleTemplateConfigure(t.key)} />
        ))}
      </div>

      {activeTemplate ? (
        <TemplateConfigModal
          open={Boolean(activeKey)}
          setOpen={next => setActiveKey(next ? activeKey : null)}
          template={activeTemplate}
          config={config}
          onSave={onSave}
          saving={saving}
          maxPhones={maxPhones}
          planEnabled={planEnabled}
        />
      ) : null}
    </div>
  );
};

export default TemplatesConfigSection;
