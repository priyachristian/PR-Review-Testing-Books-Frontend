import { formatDiscountConfigForDisplay } from '@/utils/services';

const DiscountConfigChangeContent = ({ previousConfig, newConfig }) => {
  const previous = formatDiscountConfigForDisplay(previousConfig);
  const newFormatted = formatDiscountConfigForDisplay(newConfig);

  return (
    <div className="text-sm text-gray-700 space-y-2 mt-1">
      <p className="text-gray-600">This document was saved with a different discount configuration. Do you want to apply the current company settings?</p>
      <div>
        <span className="text-gray-500">Previous: </span>
        {previous}
      </div>
      <div>
        <span className="text-gray-500">New: </span>
        <span style={{ color: 'var(--primary-500)' }}>{newFormatted}</span>
      </div>
    </div>
  );
};

export default DiscountConfigChangeContent;
