import { useMemo } from 'react';
import { Select } from '@/components/AntDComponent';
import { getPartnerMappingFields } from './data';

function Step2({ file, mapping, setMapping, setErrors, errors, isVendorPage = false }) {
  const mappingFields = useMemo(() => getPartnerMappingFields(isVendorPage), [isVendorPage]);
  const options = useMemo(() => {
    return file?.columns?.map(item => ({ value: item, label: item })) || [];
  }, [file]);

  const handleMappingChange = (fieldId, selectedColumn) => {
    setMapping(prev => ({ ...prev, [fieldId]: selectedColumn }));

    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (selectedColumn) {
        delete newErrors[fieldId];
      }
      return newErrors;
    });
  };

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{isVendorPage ? 'Vendor' : 'Customer'} Details</h3>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-100 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">ABSS BOOKS FIELD</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">IMPORTED FILE HEADERS</span>
        </div>

        <div className="max-h-[calc(100vh-26rem)] overflow-y-auto">
          {mappingFields.map(field => (
            <div key={field.id} className="grid grid-cols-2 items-center gap-4 border-b border-gray-100 px-4 py-2 last:border-b-0">
              <span className="text-sm gap-1 flex font-medium text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </span>
              <div>
                <Select
                  placeholder="Select"
                  className="w-full"
                  options={options}
                  onChange={value => handleMappingChange(field.id, value)}
                  value={mapping[field.id] || undefined}
                  status={errors[field.id] ? 'error' : ''}
                  showSearch
                  allowClear={!field.required}
                />
                {errors[field.id] && <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Step2;
