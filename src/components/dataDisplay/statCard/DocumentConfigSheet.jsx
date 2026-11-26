import { useState, useEffect, useRef } from 'react';
import { Drawer, Button, Input, Select, Spin } from '@/components/AntDComponent';
import CodeConfigFormFields from '@/components/feedback/formModal/CodeConfigFormFields';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { DOCUMENT_CONFIG_SHEET } from '@/utils/jsonFile';
import CloseIconButton from '@/components/ui/button/CloseIconButton';

const DocumentConfigSheet = ({
  open,
  onClose,
  onSave,
  title,
  resource = null,
  getTermsValue = null,
  showTermsAndConditions = true,
  termsAndConditionsValue = '',
  termsAndConditionsPlaceholder,
  customFields = [],
  loading = false,
  width = 500,
  extraContent = null,
  codeConfigValue = null,
  onCodeConfigChange = null,
  codeConfigDisabled,
}) => {
  const sheetCopy = resource ? DOCUMENT_CONFIG_SHEET[resource] : null;
  const drawerTitle = title ?? sheetCopy?.title ?? 'Configuration';
  const codeNumberTitle = sheetCopy?.codeNumberTitle ?? 'Number';
  const resolvedTermsPlaceholder = termsAndConditionsPlaceholder ?? sheetCopy?.termsAndConditionsPlaceholder ?? 'Enter Terms & Conditions';

  const hasCodeConfig = typeof onCodeConfigChange === 'function';
  const isCodeConfigDisabled = codeConfigDisabled !== undefined ? codeConfigDisabled : loading;
  const resolveTermsFromProps = () => (getTermsValue ? getTermsValue() : termsAndConditionsValue);
  const [termsAndConditions, setTermsAndConditions] = useState(() => resolveTermsFromProps());
  const [customFieldsState, setCustomFieldsState] = useState({});
  const isInitializedRef = useRef(false);

  const showConfigSpinner = loading && hasCodeConfig && !codeConfigValue?.prefix && !codeConfigValue?.nextNumber;
  useEffect(() => {
    if (open && !isInitializedRef.current && !loading) {
      setTermsAndConditions(resolveTermsFromProps());

      const initialState = {};
      customFields.forEach(field => {
        initialState[field.name] = field.value !== undefined ? field.value : '';
      });
      setCustomFieldsState(initialState);

      isInitializedRef.current = true;
    } else if (!open) {
      isInitializedRef.current = false;
    }
  }, [open, loading]);

  const handleCustomFieldChange = (fieldName, value) => {
    setCustomFieldsState(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSave = () => {
    if (onSave) {
      const saveData = {};
      if (showTermsAndConditions) {
        saveData.termsAndConditions = termsAndConditions;
      }
      Object.keys(customFieldsState).forEach(key => {
        saveData[key] = customFieldsState[key];
      });
      onSave(saveData);
    }
  };

  const handleClose = () => {
    setTermsAndConditions(resolveTermsFromProps());
    const initialState = {};
    customFields.forEach(field => {
      initialState[field.name] = field.value || '';
    });
    setCustomFieldsState(initialState);
    if (onClose) {
      onClose();
    }
  };

  const renderField = field => {
    const { name, type = 'text', placeholder, value, options = [], rows = 3, disabled = false, ...fieldProps } = field;
    const id = name;
    const fieldValue = customFieldsState[name] || value || '';
    const isFieldDisabled = typeof disabled === 'function' ? disabled(customFieldsState) : Boolean(disabled);

    switch (type) {
      case 'textarea':
        return (
          <Input.TextArea
            id={id}
            placeholder={placeholder}
            value={fieldValue}
            onChange={e => handleCustomFieldChange(name, e.target.value)}
            rows={rows}
            className="w-full"
            disabled={loading || isFieldDisabled}
            {...fieldProps}
          />
        );
      case 'select':
        return (
          <Select
            id={id}
            placeholder={placeholder}
            value={fieldValue}
            onChange={value => handleCustomFieldChange(name, value)}
            className="w-full"
            disabled={loading || isFieldDisabled}
            options={options}
            {...fieldProps}
          />
        );
      case 'number':
        return (
          <Input
            id={id}
            type="number"
            placeholder={placeholder}
            value={fieldValue}
            onChange={e => handleCustomFieldChange(name, e.target.value)}
            className="w-full"
            disabled={loading || isFieldDisabled}
            {...fieldProps}
          />
        );
      default:
        return (
          <Input
            id={id}
            placeholder={placeholder}
            value={fieldValue}
            onChange={e => handleCustomFieldChange(name, e.target.value)}
            className="w-full"
            disabled={loading || isFieldDisabled}
            {...fieldProps}
          />
        );
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} />
            <span>{drawerTitle}</span>
          </div>
          <CloseIconButton onClick={handleClose} />
        </div>
      }
      placement="right"
      closable={false}
      onClose={handleClose}
      open={open}
      width={width}
      maskClosable
      styles={{
        body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100%' },
      }}
    >
      <div className="flex flex-col flex-1 gap-4">
        <div className="flex-1 space-y-4">
          {showConfigSpinner ? (
            <div className="flex justify-center items-center min-h-[180px]">
              <Spin />
            </div>
          ) : (
            <>
              {extraContent}
              {hasCodeConfig && (
                <div>
                  <label htmlFor="code-number" className="block text-md text-gray-800 mb-1.5 font-semibold">
                    {codeNumberTitle}
                  </label>
                  <CodeConfigFormFields value={codeConfigValue} onChange={onCodeConfigChange} resource={resource} disabled={isCodeConfigDisabled} className="pb-1" />
                </div>
              )}

              {(!!extraContent || hasCodeConfig) && showTermsAndConditions && <div className="border-t border-gray-200" role="separator" />}

              {showTermsAndConditions && (
                <div>
                  <label htmlFor="terms-and-conditions" className="block text-md text-gray-800 mb-1.5 font-semibold">
                    Terms & Conditions
                  </label>
                  <Input.TextArea
                    id="terms-and-conditions"
                    placeholder={resolvedTermsPlaceholder}
                    value={termsAndConditions}
                    onChange={e => setTermsAndConditions(e.target.value)}
                    rows={6}
                    className="w-full"
                    disabled={loading}
                  />
                </div>
              )}

              {customFields.map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm text-gray-600 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            Save
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default DocumentConfigSheet;
