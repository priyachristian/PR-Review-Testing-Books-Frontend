import Icons from 'assets/icons/icon';
import { Button } from '@/components/AntDComponent';
import FilterInput from '@/components/forms/formInput/FilterInput';
import { colorPalette } from '@/utils/theme';
import { filterInputEnum } from '@/utils/constants';
import { countProblems } from '../problemList.utils';

const ProblemTreeNode = ({ node, depth, selectedId, expandedIds, onToggleExpand, onSelect }) => {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const childCount = countProblems(node.children || []);

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="w-full flex items-center gap-1 py-1.5 pr-2 text-left rounded-md transition-colors"
        style={{
          paddingLeft: `${8 + depth * 16}px`,
          backgroundColor: isSelected ? colorPalette.primary[50] : 'transparent',
          color: isSelected ? colorPalette.primary[700] : colorPalette.secondary[800],
        }}
        onMouseEnter={e => {
          if (!isSelected) e.currentTarget.style.backgroundColor = colorPalette.secondary[50];
        }}
        onMouseLeave={e => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          role="button"
          tabIndex={hasChildren ? 0 : -1}
          className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-xs"
          style={{ color: colorPalette.secondary[500], visibility: hasChildren ? 'visible' : 'hidden' }}
          onClick={e => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
          onKeyDown={e => {
            if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
              e.stopPropagation();
              onToggleExpand(node.id);
            }
          }}
        >
          {isExpanded ? <Icons.DownOutlined /> : <Icons.RightOutlined />}
        </span>

        <span className="flex-1 truncate text-sm font-medium" title={node.name}>
          {node.name}
          {!node.isActive && (
            <span className="ml-1 text-xs font-normal" style={{ color: colorPalette.secondary[400] }}>
              (off)
            </span>
          )}
        </span>

        {(node.childCount > 0 || childCount > 0) && (
          <span className="text-xs shrink-0 ml-2" style={{ color: colorPalette.secondary[400] }}>
            {node.childCount > 0 ? node.childCount : childCount}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <ProblemTreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} expandedIds={expandedIds} onToggleExpand={onToggleExpand} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProblemTreePanel = ({ tree, filter, setFilter, onSearch, onClear, selectedId, expandedIds, onToggleExpand, onSelect }) => {
  const totalCount = countProblems(tree);

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-[22px] border-b w-full shrink-0" style={{ borderColor: colorPalette.secondary[200] }}>
        <div className="flex-1 min-w-0">
          <FilterInput type={filterInputEnum.SEARCH} name="search" placeHolder="Find a problem" value={filter?.search} setFilter={setFilter} onSerch={onSearch} onClear={onClear} searchFullWidth />
        </div>
        <Button type="primary" onClick={onSearch}>
          Apply
        </Button>
        <span className="text-sm whitespace-nowrap shrink-0 hidden sm:inline" style={{ color: colorPalette.secondary[500] }}>
          {totalCount} in all
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-2 pl-2 pr-3 sm:pr-10 w-full">
        {tree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: colorPalette.secondary[500] }}>
            No problems match your search.
          </div>
        ) : (
          tree.map(node => <ProblemTreeNode key={node.id} node={node} depth={0} selectedId={selectedId} expandedIds={expandedIds} onToggleExpand={onToggleExpand} onSelect={onSelect} />)
        )}
      </div>
    </div>
  );
};

export default ProblemTreePanel;
