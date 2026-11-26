import { useEffect, useState } from 'react';

// Components
import { Input, Radio } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useModuleConfig } from 'hooks/useModuleConfig';
import { DOCUMENT_CONFIG_SHEET } from '@/utils/jsonFile';

const CodeConfigModal = ({ isVisible, onCancel, initialConfig, loading, resource = null, title, description, setConfigDetail, moduleName, maxLength = null }) => {
  const [localConfig, setLocalConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const { updateModuleConfig } = useModuleConfig();
  const sheetCopy = resource ? DOCUMENT_CONFIG_SHEET[resource] : null;
  const modalTitle = title || sheetCopy?.codeConfigModalTitle || 'Configure Number Preferences';
  const modalDescription = description || sheetCopy?.codeNumberDescription || 'Auto-generating numbers can save your time. Would you like to change your current setting?';

  // Update localConfig when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setLocalConfig(initialConfig);
    }
  }, [initialConfig]);

  const generatedLength = `${localConfig.prefix || ''}${localConfig.nextNumber || ''}`.length;
  const lengthError =
    maxLength && localConfig.autoGenerate && generatedLength > maxLength
      ? `Prefix and next number together generate a ${generatedLength}-character number, but the GST portal accepts a maximum of ${maxLength}. Please shorten the prefix or the number.`
      : '';

  const handleUpdateModuleConfig = async () => {
    if (lengthError) return;

    const configData = {
      useCustomPrefix: localConfig.autoGenerate,
      prefix: localConfig.prefix,
      nextSequence: localConfig.nextNumber,
    };

    await updateModuleConfig({
      moduleName,
      moduleConfig: configData,
    });

    setConfigDetail(localConfig);
    onCancel();
  };

  return (
    <CustomModal
      modalOpen={isVisible}
      setModalOpen={open => {
        if (!open) onCancel();
      }}
      destroyOnClose={false}
      title={modalTitle}
      width={500}
    >
      <div className="py-4">
        <p className="text-gray-600 mb-4">{modalDescription}</p>
        <Radio.Group
          disabled={loading}
          value={localConfig.autoGenerate}
          onChange={e => {
            e.preventDefault();
            setLocalConfig(prev => ({ ...prev, autoGenerate: e.target.value }));
          }}
          className="flex flex-col gap-4"
        >
          <Radio disabled={loading} value={true}>
            Auto-generate numbers
          </Radio>
          {localConfig.autoGenerate && (
            <div className="ml-6">
              <div className="flex gap-4 items-center">
                <div>
                  <div className="mb-1">Prefix</div>
                  <Input value={localConfig.prefix} onChange={e => setLocalConfig(prev => ({ ...prev, prefix: e.target.value }))} style={{ width: 130 }} status={lengthError ? 'error' : ''} />
                </div>
                <div>
                  <div className="mb-1">Next Number</div>
                  <Input value={localConfig.nextNumber} onChange={e => setLocalConfig(prev => ({ ...prev, nextNumber: e.target.value }))} style={{ width: 150 }} status={lengthError ? 'error' : ''} />
                </div>
              </div>
              {lengthError && <div className="mt-2 text-red-500 text-sm">{lengthError}</div>}
            </div>
          )}
          <Radio value={false}>Add number manually for this entry</Radio>
        </Radio.Group>
      </div>
      <div className="flex gap-4 justify-end">
        <CustomButton key="cancel" type="default" text="Cancel" disabled={loading} onClick={onCancel} />
        <CustomButton key="save" type="primary" text="Save" loading={loading} disabled={Boolean(lengthError)} onClick={handleUpdateModuleConfig} />
      </div>
    </CustomModal>
  );
};

export default CodeConfigModal;
