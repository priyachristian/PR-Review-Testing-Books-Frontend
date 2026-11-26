import { useEffect, useState } from 'react';

// Components
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import Icons from '@/assets/icons/icon';
import { Button, Drawer, Skeleton, Tabs, Tooltip } from '@/components/AntDComponent';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import { CLOSE_ICON_BUTTON_CLASS } from '@/components/ui/button/CloseIconButton';

const DETAIL_LABEL_CLASS = 'block font-semibold text-[#64748b] text-[10px] tracking-[0.06em] uppercase';
const DETAIL_VALUE_CLASS = 'text-[13px] font-medium text-[#1e293b] leading-5 truncate';

/**
 * Common drawer shell for drill-down "breakdown" views (e.g. an item's sales broken down by
 * state / customer). Header shows the entity's icon + name + a compact strip of basic details +
 * a link to the entity's own detail page; body renders the given tabs.
 *
 * Reusable across item-wise / state-wise / customer-wise breakdown drawers — keep this
 * presentational (no data fetching) so each caller owns its own data source.
 */
const BreakdownDrawer = ({
  open,
  onClose,
  icon,
  title,
  titleFallback = 'Details',
  basicDetails = [],
  basicDetailsLoading = false,
  viewEntityLabel,
  onViewEntity,
  tabs = [],
  activeTabKey,
  onTabChange,
  width = 800,
  expandable = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!open) setIsExpanded(false);
  }, [open]);

  return (
    <Drawer
      closable={false}
      title={
        <div className="w-full py-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                {icon}
                <Tooltip title={title}>
                  <span className={`ml-2 text-base font-bold text-gray-900 truncate cursor-default ${isExpanded ? 'max-w-[50vw]' : 'max-w-[280px]'}`}>{title || titleFallback}</span>
                </Tooltip>
              </div>
              {onViewEntity && (
                <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={onViewEntity} className="flex items-center shrink-0">
                  {viewEntityLabel || 'View Details'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {expandable && (
                <Tooltip title={isExpanded ? 'Default width' : 'Full width'}>
                  <Button
                    type="text"
                    className={CLOSE_ICON_BUTTON_CLASS}
                    icon={isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={() => setIsExpanded(v => !v)}
                    aria-label={isExpanded ? 'Collapse drawer' : 'Expand drawer'}
                  />
                </Tooltip>
              )}
              <CloseIconButton onClick={onClose} />
            </div>
          </div>

          {(basicDetailsLoading || basicDetails.length > 0) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-gray-100">
              {basicDetailsLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} active title={false} paragraph={{ rows: 1, width: 90 }} className="!w-[90px]" />)
                : basicDetails.map(field => (
                    <div key={field.label} className="min-w-0">
                      <span className={DETAIL_LABEL_CLASS}>{field.label}</span>
                      <p className={DETAIL_VALUE_CLASS}>{field.value ?? '-'}</p>
                    </div>
                  ))}
            </div>
          )}
        </div>
      }
      onClose={onClose}
      open={open}
      maskClosable
      width={expandable && isExpanded ? '100%' : width}
      rootClassName="breakdown-drawer"
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: { padding: '0px', background: '#f8fafc', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
        header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
      }}
    >
      {tabs.length > 1 ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-3">
          <Tabs className="breakdown-drawer-tabs flex-1 min-h-0" items={tabs} activeKey={activeTabKey} onChange={onTabChange} />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pt-3 pb-3">
          {tabs[0]?.label && <h3 className="text-sm font-bold text-gray-800 mb-3 shrink-0">{tabs[0].label}</h3>}
          <div className="flex-1 min-h-0 overflow-hidden">{tabs[0]?.children}</div>
        </div>
      )}
    </Drawer>
  );
};

export default BreakdownDrawer;
