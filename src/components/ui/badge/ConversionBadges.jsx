/**
 * Compact Conversion Badges Component
 * Shows "Converted To" and "Converted From" relationships
 */
const ConversionBadges = ({ convertedTo = [], convertedFrom = [], onConvertedToClick, onConvertedFromClick, convertedToLabel = 'Converted To', convertedFromLabel = 'Converted From' }) => {
  if (!convertedTo?.length && !convertedFrom?.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700">Document Flow</h3>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Converted To Badge */}
        {convertedTo?.length > 0 && (
          <button onClick={onConvertedToClick} className="w-full px-3 py-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors text-left">
            <div className="flex items-center justify-between gap-2">
              <span>{convertedToLabel}</span>
              <span className="text-blue-600 shrink-0 whitespace-nowrap">
                {convertedTo.length} {convertedTo.length === 1 ? 'doc' : 'docs'}
              </span>
            </div>
          </button>
        )}

        {/* Converted From Badge */}
        {convertedFrom?.length > 0 && (
          <button onClick={onConvertedFromClick} className="w-full px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors text-left">
            <div className="flex items-center justify-between gap-2">
              <span>{convertedFromLabel}</span>
              <span className="text-emerald-600 shrink-0 whitespace-nowrap">
                {convertedFrom.length} {convertedFrom.length === 1 ? 'doc' : 'docs'}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversionBadges;
