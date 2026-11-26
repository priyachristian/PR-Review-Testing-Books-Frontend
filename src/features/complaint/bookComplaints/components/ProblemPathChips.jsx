import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const ProblemPathChips = ({ path = [], onChipClick, onStartAgain, readOnly = false }) => {
  if (!path.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex flex-wrap items-center gap-2">
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        const chipClassName = `px-2.5 py-1 rounded text-sm font-medium border transition-colors ${
          isLast ? 'border-transparent text-white' : 'border-gray-200 bg-white text-gray-700'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:border-gray-300'}`;

        return (
          <div key={node.id || node._id || `${node.name}-${index}`} className="inline-flex items-center gap-2">
            {index > 0 && <Icons.RightOutlined style={{ fontSize: 10, color: colorPalette.secondary[400] }} />}
            {readOnly ? (
              <span className={chipClassName} style={isLast ? { backgroundColor: colorPalette.primary[500] } : undefined}>
                {node.name}
              </span>
            ) : (
              <button type="button" onClick={() => onChipClick?.(index)} className={chipClassName} style={isLast ? { backgroundColor: colorPalette.primary[500] } : undefined}>
                {node.name}
              </button>
            )}
          </div>
        );
      })}
      {!readOnly ? (
        <button type="button" onClick={onStartAgain} className="text-sm font-medium bg-transparent border-0 cursor-pointer p-0 ml-1" style={{ color: colorPalette.primary[600] }}>
          Start again
        </button>
      ) : null}
    </div>
  );
};

export default ProblemPathChips;
