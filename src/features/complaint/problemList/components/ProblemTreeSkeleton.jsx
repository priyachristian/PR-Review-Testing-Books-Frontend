import { colorPalette } from '@/utils/theme';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const TreeRowSkeleton = ({ depth = 0, nameWidth = '45%' }) => (
  <div className="w-full flex items-center gap-1 py-1.5 pr-2" style={{ paddingLeft: `${8 + depth * 16}px` }}>
    <S w={14} h={14} className="shrink-0" />
    <S w={nameWidth} h={14} />
    <S w={16} h={12} className="shrink-0 ml-auto" />
  </div>
);

const TREE_ROWS = [
  { depth: 0, nameWidth: '55%' },
  { depth: 1, nameWidth: '48%' },
  { depth: 1, nameWidth: '40%' },
  { depth: 0, nameWidth: '42%' },
  { depth: 1, nameWidth: '36%' },
  { depth: 1, nameWidth: '38%' },
  { depth: 0, nameWidth: '50%' },
  { depth: 1, nameWidth: '44%' },
];

const ProblemTreeSkeleton = () => (
  <>
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-[22px] border-b w-full shrink-0" style={{ borderColor: colorPalette.secondary[200] }}>
        <div className="flex-1 min-w-0">
          <S w="100%" h={32} className="rounded-md" />
        </div>
        <S w={64} h={32} className="rounded-md shrink-0" />
        <S w={56} h={14} className="shrink-0 hidden sm:block" />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden py-2 pl-2 pr-3 sm:pr-10 w-full">
        {TREE_ROWS.map((row, i) => (
          <TreeRowSkeleton key={i} depth={row.depth} nameWidth={row.nameWidth} />
        ))}
      </div>
    </div>
  </>
);

export default ProblemTreeSkeleton;
