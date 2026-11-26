// Extras
import { colorPalette } from '@/utils/theme';

// Read-only chevron strip of the order's processes with the open one highlighted.
const ProcessStepper = ({ processes, activeIndex }) => (
  <div className="flex w-full items-center overflow-x-auto py-1">
    {processes.map((process, index) => {
      const isFirst = index === 0;
      const isLast = index === processes.length - 1;
      const isActive = index === activeIndex;

      let clipPath = 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)';
      if (isFirst) {
        clipPath = 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)';
      } else if (isLast) {
        clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)';
      }

      return (
        <div
          key={process._id || process.id || index}
          title={process.processName}
          className={`relative flex-1 min-w-[180px] max-w-[250px] h-11 flex items-center justify-center px-3 text-xs font-semibold ${!isFirst ? '-ml-2.5' : ''} ${
            isActive ? 'text-white z-10 shadow-sm' : 'bg-[#f1f5f9] text-gray-600 z-0'
          }`}
          style={{ clipPath, WebkitClipPath: clipPath, backgroundColor: isActive ? colorPalette.primary[500] : undefined }}
        >
          <span className="flex items-center gap-1.5 truncate px-2">
            {isActive ? <span className="h-2 w-2 rounded-full bg-white shrink-0" /> : null}
            <span className="truncate">{process.processName}</span>
          </span>
        </div>
      );
    })}
  </div>
);

export default ProcessStepper;
