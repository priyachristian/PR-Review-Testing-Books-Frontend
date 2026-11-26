// Components
import { Button, Drawer } from '@/components/AntDComponent';
import CloseIconButton from '@/components/ui/button/CloseIconButton';

// Extras
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

// Grouped section inside the filter drawer (e.g. When / What / Who / Where).
export const FilterSection = ({ title, children, columns = 2 }) => (
  <div className="space-y-2">
    {title && (
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">{title}</p>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    )}
    <div className={columns === 1 ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2'}>{children}</div>
  </div>
);

// Toolbar trigger button with the active-filter count badge (shown only when filters are active).
export const FilterButton = ({ count = 0, onClick, label = 'Filters' }) => (
  <Button type="primary" icon={<Icons.FilterOutlined />} onClick={onClick}>
    {label}
    {count > 0 && (
      <span
        className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold leading-none"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#fff' }}
      >
        {count}
      </span>
    )}
  </Button>
);

// Right-side filter drawer following the DocumentConfigSheet convention.
const FilterDrawer = ({ open, onClose, onApply, onReset, children, title = 'Filters', width, applyLabel = 'Apply Filters', resetLabel = 'Reset' }) => {
  const resolvedWidth = width ?? (typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 640);

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icons.FilterOutlined style={{ color: colorPalette.primary[500] }} />
            <span>{title}</span>
          </div>
          <CloseIconButton onClick={onClose} />
        </div>
      }
      placement="right"
      closable={false}
      maskClosable
      onClose={onClose}
      open={open}
      width={resolvedWidth}
      styles={{ body: { padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      <div className="flex flex-col flex-1 gap-3">
        <div className="flex-1 space-y-4 overflow-y-auto">{children}</div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button onClick={onReset}>{resetLabel}</Button>
          <Button type="primary" icon={<Icons.FilterOutlined />} onClick={onApply}>
            {applyLabel}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default FilterDrawer;
