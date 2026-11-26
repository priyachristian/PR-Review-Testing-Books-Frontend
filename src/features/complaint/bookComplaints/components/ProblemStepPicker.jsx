import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { isLeafProblem } from '@/features/complaint/problemList/problemList.utils';

const ProblemOptionCard = ({ node, onClick }) => {
  const isLeaf = isLeafProblem(node);

  return (
    <button
      type="button"
      onClick={() => onClick(node)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white text-left cursor-pointer transition-colors hover:border-gray-300"
    >
      <span className="text-sm font-medium text-gray-900">{node.name}</span>
      <span className="inline-flex items-center gap-2 shrink-0">
        {isLeaf && (
          <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${colorPalette.primary[500]}14`, color: colorPalette.primary[600] }}>
            Last step
          </span>
        )}
        <Icons.RightOutlined style={{ fontSize: 12, color: colorPalette.secondary[400] }} />
      </span>
    </button>
  );
};

const ProblemStepPicker = ({ title, description, options = [], onSelect }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
    <h3 className="text-[15px] font-semibold text-gray-900 m-0">{title}</h3>
    {description && <p className="text-sm mt-1 mb-3 text-gray-500">{description}</p>}
    <div className={`grid gap-3 ${description ? '' : 'mt-3'} ${options.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
      {options.map(node => (
        <ProblemOptionCard key={node.id} node={node} onClick={onSelect} />
      ))}
    </div>
  </div>
);

export default ProblemStepPicker;
