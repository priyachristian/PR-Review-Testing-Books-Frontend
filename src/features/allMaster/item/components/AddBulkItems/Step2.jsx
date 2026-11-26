import { useMemo } from 'react';
import { Select, Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { getRequiredBulkItemMappingIds, ITEM_ROLE_FIELD_IDS, itemMappingFields } from './data';

function Step2({ file, mapping, setMapping, setErrors, errors }) {
  const options = useMemo(() => {
    return file?.columns?.map(item => ({ value: item, label: item })) || [];
  }, [file]);

  const requiredIds = useMemo(() => getRequiredBulkItemMappingIds(mapping), [mapping]);

  const handleMappingChange = (fieldId, selectedColumn) => {
    setMapping(prev => {
      const nextMapping = { ...prev };
      if (selectedColumn) {
        nextMapping[fieldId] = selectedColumn;
      } else {
        delete nextMapping[fieldId];
      }
      return nextMapping;
    });

    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[fieldId];

      // Clearing a role flag also clears its dependent-field mapping errors.
      itemMappingFields.forEach(field => {
        if (field.requiredWhen === fieldId && !selectedColumn) {
          delete newErrors[field.id];
        }
      });

      // Selecting any role field clears the shared "at least one role" errors.
      if (selectedColumn && ITEM_ROLE_FIELD_IDS.includes(fieldId)) {
        ITEM_ROLE_FIELD_IDS.forEach(roleFieldId => {
          delete newErrors[roleFieldId];
        });
      }

      return newErrors;
    });
  };

  const renderFieldLabel = field => {
    const isRequired = requiredIds.has(field.id);
    const label = (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
        {field.label}
        {isRequired && <span className="text-red-500">*</span>}
        {field.tooltip && (
          <Tooltip placement="top" title={field.tooltip}>
            <span className="inline-flex">
              <Icons.InfoCircleOutlined className="text-xs text-gray-400 cursor-help" />
            </span>
          </Tooltip>
        )}
      </span>
    );

    return label;
  };

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Item Details</h3>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-100 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">ABSS BOOKS FIELD</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">IMPORTED FILE HEADERS</span>
        </div>

        <div className="max-h-[calc(100vh-26rem)] overflow-y-auto">
          {itemMappingFields.map(field => {
            const isRequired = requiredIds.has(field.id);

            return (
              <div key={field.id} className="grid grid-cols-2 items-center gap-4 border-b border-gray-100 px-4 py-2 last:border-b-0">
                {renderFieldLabel(field)}
                <div>
                  <Select
                    placeholder="Select"
                    className="w-full"
                    options={options}
                    onChange={value => handleMappingChange(field.id, value)}
                    value={mapping[field.id] || undefined}
                    status={errors[field.id] ? 'error' : ''}
                    showSearch
                    allowClear={!isRequired}
                  />
                  {errors[field.id] && <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Step2;
