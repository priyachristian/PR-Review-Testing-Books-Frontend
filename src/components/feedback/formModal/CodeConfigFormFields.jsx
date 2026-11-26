import { Input, Radio } from '@/components/AntDComponent';
import { DOCUMENT_CONFIG_SHEET } from '@/utils/jsonFile';

const CodeConfigFormFields = ({
  value,
  onChange,
  showDescription = true,
  /** Explicit override; otherwise resolved from `resource` via `DOCUMENT_CONFIG_SHEET`. */
  description,
  resource = null,
  disabled = false,
  className = '',
}) => {
  const sheetCopy = resource ? DOCUMENT_CONFIG_SHEET[resource] : null;
  const resolvedDescription = description ?? sheetCopy?.codeNumberDescription ?? 'Auto-generating numbers can save your time. Would you like to change your current setting?';

  const currentValue = {
    autoGenerate: value?.autoGenerate ?? true,
    prefix: value?.prefix ?? '',
    nextNumber: value?.nextNumber ?? '',
  };

  const setConfigValue = patch => onChange({ ...currentValue, ...patch });

  return (
    <div className={className}>
      {showDescription && <p className="text-gray-600 mb-4">{resolvedDescription}</p>}
      <Radio.Group
        value={currentValue.autoGenerate}
        onChange={e => {
          e.preventDefault();
          setConfigValue({ autoGenerate: e.target.value });
        }}
        className="flex flex-col gap-4"
        disabled={disabled}
      >
        <Radio value={true}>Auto-generate numbers</Radio>
        {currentValue.autoGenerate && (
          <div className="ml-6 flex gap-4 items-center">
            <div>
              <div className="mb-1">Prefix</div>
              <Input value={currentValue.prefix} onChange={e => setConfigValue({ prefix: e.target.value })} style={{ width: 100 }} disabled={disabled} />
            </div>
            <div>
              <div className="mb-1">Next Number</div>
              <Input value={currentValue.nextNumber} onChange={e => setConfigValue({ nextNumber: e.target.value })} style={{ width: 150 }} disabled={disabled} />
            </div>
          </div>
        )}
        <Radio value={false}>Add number manually for this entry</Radio>
      </Radio.Group>
    </div>
  );
};

export default CodeConfigFormFields;
