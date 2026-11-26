import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Tooltip, Popover } from '@/components/AntDComponent';

const stopPropagation = e => e.stopPropagation();

export const renderListNumberTag = (label, to, { key, linkClassName, tagClassName } = {}) => {
  const tag = (
    <Tag key={key} className={tagClassName || (to ? 'font-semibold cursor-pointer m-0' : 'font-semibold m-0')}>
      {label}
    </Tag>
  );
  return to ? (
    <Link key={key} to={to} onClick={stopPropagation} className={linkClassName}>
      {tag}
    </Link>
  ) : (
    tag
  );
};

const OverflowListCell = ({
  items,
  visibleCount = 1,
  emptyText = '',
  overflowIndicator,
  getKey = (item, index) => item?.id || item?._id || index,
  getLabel = item => item?.label ?? item?.name ?? '',
  getLink,
  tagClassName = 'font-semibold m-0',
  linkTagClassName = 'font-semibold cursor-pointer m-0',
  tooltipMaxWidth = 300,
  visibleTagMaxWidth = 200,
  linkInTooltip,
}) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return emptyText;

  const visible = list.slice(0, visibleCount);
  const hasMore = list.length > visibleCount;
  const remainingCount = list.length - visibleCount;
  const overlayItemsLinkable = linkInTooltip ?? Boolean(getLink);
  const indicatorLabel = typeof overflowIndicator === 'function' ? overflowIndicator(remainingCount) : (overflowIndicator ?? `+${remainingCount}`);

  const renderItem = (item, index, { linkable = false, truncate = false } = {}) => {
    const key = getKey(item, index);
    const label = getLabel(item, index);
    const shouldLink = linkable && typeof getLink === 'function';
    const to = shouldLink ? getLink(item, index) : null;
    const labelContent = truncate ? (
      <span className="block whitespace-nowrap" style={{ maxWidth: visibleTagMaxWidth }} title={label}>
        {label}
      </span>
    ) : (
      label
    );

    const widthClass = truncate ? 'shrink-0' : 'min-w-0 max-w-full shrink';

    return renderListNumberTag(labelContent, to, {
      key,
      linkClassName: truncate ? 'shrink-0' : 'min-w-0 shrink',
      tagClassName: to ? `${linkTagClassName} ${truncate ? '' : 'max-w-full'}` : `${tagClassName} ${widthClass}`,
    });
  };

  const overlayContent = (
    <div className="flex flex-wrap gap-1" style={{ maxWidth: tooltipMaxWidth }} role="presentation" onClick={stopPropagation}>
      {list.map((item, index) => renderItem(item, index, { linkable: overlayItemsLinkable }))}
    </div>
  );

  const overflowTrigger = (
    <Tag className={`${linkTagClassName} shrink-0`} onClick={stopPropagation}>
      {indicatorLabel}
    </Tag>
  );

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">{visible.map((item, index) => renderItem(item, index, { linkable: true, truncate: true }))}</div>
      {hasMore && (
        <span className="inline-flex shrink-0">
          {overlayItemsLinkable ? (
            <Popover trigger="hover" content={overlayContent}>
              {overflowTrigger}
            </Popover>
          ) : (
            <Tooltip title={overlayContent}>{overflowTrigger}</Tooltip>
          )}
        </span>
      )}
    </div>
  );
};

export default OverflowListCell;
