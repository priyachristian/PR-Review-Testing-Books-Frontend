import { colorPalette } from '@/utils/theme';

const StatTile = ({ icon, label, value, suffix, caption, subCaption, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left bg-white rounded-lg p-3 border transition-colors ${onClick ? 'cursor-pointer' : 'cursor-default'} ${selected ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
    style={selected ? { boxShadow: `0 0 0 1.5px ${colorPalette.primary[500]}` } : undefined}
  >
    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${colorPalette.primary[500]}14`, color: colorPalette.primary[500] }}>
      {icon}
    </div>
    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-lg font-bold text-gray-900 leading-tight mt-0.5">
      {value} {suffix && <span className="text-[11px] font-normal text-gray-400">{suffix}</span>}
    </div>
    {caption && <div className="text-[11px] text-gray-400 mt-0.5">{caption}</div>}
    {subCaption && <div className="text-[11px] text-gray-400 mt-0.5">{subCaption}</div>}
  </button>
);

export default StatTile;
