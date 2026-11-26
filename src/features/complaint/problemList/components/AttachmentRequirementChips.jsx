import { ATTACHMENT_OPTIONS } from '../problemList.constants';
import { colorPalette } from '@/utils/theme';

const AttachmentRequirementChips = ({ value = [], onChange, disabled = false }) => {
  const selected = new Set(value);

  const toggle = optionValue => {
    if (disabled) return;
    const next = selected.has(optionValue) ? value.filter(v => v !== optionValue) : [...value, optionValue];
    onChange?.(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ATTACHMENT_OPTIONS.map(option => {
        const isSelected = selected.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(option.value)}
            className="px-3 py-1.5 rounded-md text-sm border transition-colors"
            style={{
              borderColor: isSelected ? colorPalette.primary[500] : colorPalette.secondary[300],
              backgroundColor: isSelected ? colorPalette.primary[50] : '#fff',
              color: isSelected ? colorPalette.primary[700] : colorPalette.secondary[700],
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default AttachmentRequirementChips;
