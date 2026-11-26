import { useCallback, useEffect, useRef, useState } from 'react';

// Components
import CustomTable from './CustomTable';
import { Spin } from '@/components/AntDComponent';

const MIN_HEIGHT = 200;
const BOTTOM_PADDING = 24;
const TABLE_HEAD_HEIGHT = 40;
const SCROLL_LOADING_HEIGHT = 44;

/**
 * Scroll-to-load-more table (no page-number pagination). Sizes the table body to its container
 * and fetches the next page once the user nears the bottom of the table body. Table headers stay
 * fixed via scroll.y; only rows scroll. Pass `maxHeight` to override the computed body height.
 */
const InfiniteScrollTable = ({ columns, data, loading, scrollLoading, hasMore, onLoadMore, rowKey, tableId, onChange, maxHeight }) => {
  const isFetchingRef = useRef(false);
  const containerRef = useRef(null);
  const [bodyScrollY, setBodyScrollY] = useState(maxHeight || 420);

  useEffect(() => {
    if (!loading && !scrollLoading) {
      isFetchingRef.current = false;
    }
  }, [loading, scrollLoading]);

  useEffect(() => {
    if (maxHeight) {
      setBodyScrollY(maxHeight);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      let containerHeight = rect.height;

      if (containerHeight < MIN_HEIGHT) {
        containerHeight = Math.max(MIN_HEIGHT, window.innerHeight - (rect.top || 0) - BOTTOM_PADDING);
      }

      const reservedBottom = scrollLoading ? SCROLL_LOADING_HEIGHT : 0;
      setBodyScrollY(Math.max(MIN_HEIGHT, Math.floor(containerHeight - TABLE_HEAD_HEIGHT - reservedBottom)));
    };

    measure();
    const timer = setTimeout(measure, 300);

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [maxHeight, scrollLoading]);

  const tryLoadMore = useCallback(() => {
    if (isFetchingRef.current || loading || scrollLoading || !hasMore) return;
    isFetchingRef.current = true;
    onLoadMore();
  }, [loading, scrollLoading, hasMore, onLoadMore]);

  const getTableBody = () => containerRef.current?.querySelector('.ant-table-body');

  // A taller container can fit a page's worth of rows without ever overflowing, so the near-bottom
  // scroll trigger below would never fire. Keep loading pages until either the content overflows
  // (scroll takes over) or the server says there's nothing left.
  useEffect(() => {
    if (isFetchingRef.current || loading || scrollLoading || !hasMore) return;
    const body = getTableBody();
    if (body && body.scrollHeight <= body.clientHeight + 4) {
      tryLoadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, scrollLoading, hasMore, bodyScrollY]);

  useEffect(() => {
    const body = getTableBody();
    const header = containerRef.current?.querySelector('.ant-table-header');
    if (!body) return;

    const handleScroll = () => {
      if (header) header.scrollLeft = body.scrollLeft;

      if (isFetchingRef.current || loading || scrollLoading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = body;
      if (scrollHeight - scrollTop <= clientHeight + 80) {
        tryLoadMore();
      }
    };

    body.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => body.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, scrollLoading, hasMore, bodyScrollY, data?.length, tryLoadMore]);

  return (
    <div ref={containerRef} className="h-full min-h-0 flex flex-col overflow-hidden">
      <CustomTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={false}
        dynamicScrollY={false}
        tableId={tableId}
        scroll={{ y: bodyScrollY }}
        onChange={onChange}
        {...(rowKey ? { rowKey } : {})}
      />
      {scrollLoading && (
        <div className="flex justify-center py-3 shrink-0">
          <Spin size="small" />
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollTable;
