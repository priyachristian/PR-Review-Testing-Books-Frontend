import React, { useState } from 'react';

// Components
import { Table, Pagination, Tooltip, Select } from '@/components/AntDComponent';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

// Extras
import { colorPalette } from 'utils/theme';
import { DEFAULT_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from '@/utils/pagination';
import { getTitleText, resolveColumnWidth, TruncatedCell } from '@/utils/tableColumns';
import { renderTableSkeletonCell } from '@/utils/tableSkeleton';
import OverflowListCell from './OverflowListCell';
import ResizableTitle from './ResizableTitle';

const CustomTable = ({
  columns,
  data,
  loading,
  bordered = false,
  pagination,
  tableId,
  customStyle,
  onRowClick,
  onChange,
  rowClassName,
  className = '',
  title,
  subtitle,
  showHeader = true,
  // Row selection props
  columnActions,
  expandable,
  dynamicScrollY = true,
  compactOnDesktop = false,
  scrollYOffset = 109,
  scroll: scrollProp,
  adjustScrollForTallHeader = false,
  isPaginationFixed = true,
  paginationClassName,
  showQuickJumper = true,
  onColumnResize,
}) => {
  const wrapperRef = React.useRef(null);
  const [tableHeight, setTableHeight] = useState(429);
  const selectionRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(true);

  const paginationProvided = pagination !== undefined && pagination !== null && pagination !== false;

  const normalizedPagination = paginationProvided
    ? {
        ...pagination,
        current: pagination.current ?? 1,
        pageSize: Number(pagination.pageSize) || DEFAULT_PAGE_SIZE,
        total: Number(pagination.total) || 0,
        onChange: pagination.onChange || (() => {}),
      }
    : null;

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      setIsTablet(window.innerWidth <= 1186);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resolvedDynamicScrollY = compactOnDesktop ? isMobile : dynamicScrollY;

  const handlePaginationChange = (page, pageSize) => {
    if (normalizedPagination?.onChange) {
      normalizedPagination.onChange(page, pageSize);
    }
  };

  const mergedColumns = React.useMemo(() => {
    if (!columns) return [];

    let columnData = [
      ...columns.map(column => {
        const titleText = getTitleText(column.title);
        const normalizedTitle = String(titleText || '')
          .trim()
          .toLowerCase();
        const isActionColumn = normalizedTitle === 'action' || normalizedTitle === 'actions';
        let columnWidth = resolveColumnWidth(column);

        // Lock width so Ant Design / table-layout:fixed cannot redistribute leftover scroll space.
        const lockedWidthStyle = {
          width: columnWidth,
          minWidth: columnWidth,
          maxWidth: columnWidth,
        };

        return {
          ...column,
          width: columnWidth,
          ...(isActionColumn && {
            fixed: 'right',
            sorter: false,
            align: 'center',
            className: ['shadow', 'custom-table-action-column', column.className].filter(Boolean).join(' '),
          }),
          onHeaderCell: col => {
            const existingHeader = column.onHeaderCell ? column.onHeaderCell(col) : {};
            return {
              ...existingHeader,
              width: col.width,
              onResize: onColumnResize ? onColumnResize(col.dataIndex || col.key) : undefined,
              style: {
                ...existingHeader?.style,
                ...lockedWidthStyle,
                ...(isActionColumn && { borderLeft: '1px solid #eaecf0' }),
              },
            };
          },
          ...(column.render
            ? {}
            : column.overflowList
              ? {
                  render: value => <OverflowListCell items={value} {...column.overflowList} />,
                }
              : column.dataIndex
                ? {
                    render: value => <TruncatedCell value={value} getPopupContainer={() => wrapperRef.current || document.body} />,
                  }
                : {}),
          onCell: record => {
            const existingOnCell = column.onCell ? column.onCell(record) : {};
            const disableEllipsis = column.ellipsis === false || Boolean(column.overflowList);
            return {
              ...existingOnCell,
              style: {
                ...existingOnCell?.style,
                ...lockedWidthStyle,
                ...(disableEllipsis ? { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
                ...(isActionColumn && { borderLeft: '1px solid #f0f0f0' }),
              },
            };
          },
          title: (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase whitespace-nowrap">{column.title}</span>
              {column.tooltip && (
                <Tooltip title={column.tooltip} getPopupContainer={() => wrapperRef.current || document.body}>
                  <div className="w-3.5 h-3.5 rounded-full bg-slate-200 flex items-center justify-center cursor-help hover:bg-slate-300">
                    <span className="text-[9px] text-slate-500 font-semibold">?</span>
                  </div>
                </Tooltip>
              )}
            </div>
          ),
        };
      }),
    ];

    if (columnActions) {
      const actionCol = columnActions();
      if (actionCol) {
        columnData.push({
          ...actionCol,
          className: ['custom-table-action-column', actionCol.className].filter(Boolean).join(' '),
          onHeaderCell: () => {
            const existing = actionCol.onHeaderCell ? actionCol.onHeaderCell() : {};
            return { ...existing, style: { ...existing?.style, borderLeft: '1px solid #eaecf0' } };
          },
          onCell: record => {
            const existing = actionCol.onCell ? actionCol.onCell(record) : {};
            return { ...existing, style: { ...existing?.style, borderLeft: '1px solid #f0f0f0' } };
          },
        });
      }
    }

    return columnData;
  }, [columns, data, columnActions]);

  // Skeleton only on initial load (no existing data); page-change uses normal spinner
  const showSkeleton = loading && (!data || data.length === 0);
  const showSpinner = loading && data && data.length > 0;
  const showPaginationSkeleton = showSkeleton && paginationProvided && normalizedPagination.total === 0;
  const shouldRenderPagination = paginationProvided && (normalizedPagination.total > 0 || showPaginationSkeleton);
  const normalizedPageSize = Number(normalizedPagination?.pageSize) || DEFAULT_PAGE_SIZE;
  const normalizedCurrentPage = Math.max(1, Number(normalizedPagination?.current) || 1);
  const skeletonInfoStart = (normalizedCurrentPage - 1) * normalizedPageSize + 1;
  const skeletonInfoEnd = normalizedCurrentPage * normalizedPageSize;
  const skeletonPageButtons = React.useMemo(() => {
    if (isMobile) return [normalizedCurrentPage];
    return Array.from({ length: 3 }, (_, idx) => normalizedCurrentPage + idx);
  }, [isMobile, normalizedCurrentPage]);

  const skeletonRowCount = normalizedPagination?.pageSize || DEFAULT_PAGE_SIZE;

  const skeletonData = React.useMemo(() => Array.from({ length: skeletonRowCount }, (_, i) => ({ _skeletonId: `skeleton-${i}` })), [skeletonRowCount]);

  const skeletonColumns = React.useMemo(
    () =>
      mergedColumns.map(col => ({
        ...col,
        sorter: false,
        onCell: () => ({
          style: {
            width: col.width,
            minWidth: col.width,
            maxWidth: col.width,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }),
        render: () => renderTableSkeletonCell(col),
      })),
    [mergedColumns]
  );

  // Exact sum so columns keep their widths (Math.max(800, …) used to stretch them).
  const dynamicScrollX = React.useMemo(() => {
    if (mergedColumns.length === 0) return 'max-content';

    return mergedColumns.reduce((total, col) => total + (Number(col.width) || 150), 0);
  }, [mergedColumns]);

  const resolvedScroll = React.useMemo(() => {
    const resolveX = x => {
      if (x === 'max-content' || x === true || x === undefined) return dynamicScrollX;
      return x;
    };

    if (!scrollProp && !resolvedDynamicScrollY) return undefined;
    if (!scrollProp) return { x: dynamicScrollX, y: tableHeight };

    return {
      ...scrollProp,
      x: resolveX(scrollProp.x),
      ...(scrollProp.y != null ? { y: scrollProp.y } : resolvedDynamicScrollY ? { y: tableHeight } : {}),
    };
  }, [scrollProp, resolvedDynamicScrollY, dynamicScrollX, tableHeight]);

  React.useEffect(() => {
    if (!resolvedDynamicScrollY) {
      setNeedsScroll(false);
      return;
    }
    let timeout = null;
    const updateHeight = () => {
      try {
        const top = wrapperRef.current?.getBoundingClientRect()?.top || 0;
        // const available = Math.floor(
        //   window.innerHeight -
        //     top -
        //     (scrollYOffset || 160) -
        //     (selectionRef?.current?.getBoundingClientRect()?.height || 0),
        // );

        const hasPagination = paginationProvided && normalizedPagination.total > 0;

        const adjustedOffset = hasPagination
          ? (scrollYOffset || 160) - (selectionRef?.current?.getBoundingClientRect()?.height || 0)
          : Math.max((scrollYOffset || 160) - (selectionRef?.current?.getBoundingClientRect()?.height || 0) - 59, 25);

        // Opt-in only. Default tables keep the original body height.
        // scroll.y is the body, so a stacked header otherwise extends under the fixed pagination.
        let extraHeaderHeight = 0;
        if (adjustScrollForTallHeader) {
          const headerEl = wrapperRef.current?.querySelector('.ant-table-header') || wrapperRef.current?.querySelector('.ant-table-thead');
          const headerHeight = headerEl?.getBoundingClientRect()?.height || 0;
          extraHeaderHeight = headerHeight > 56 ? headerHeight - 40 : 0;
        }

        const available = Math.floor(window.innerHeight - top - adjustedOffset - extraHeaderHeight + 11);
        setTableHeight(Math.max(150, available));
        const body = wrapperRef.current?.querySelector('.ant-table-body');
        if (body) {
          const hasOverflow = body.scrollHeight > body.clientHeight + 5;
          setNeedsScroll(hasOverflow);
        }
      } catch (e) {
        setTableHeight(429);
      }
    };

    updateHeight();
    const raf = adjustScrollForTallHeader ? requestAnimationFrame(updateHeight) : null;
    const headerEl = adjustScrollForTallHeader ? wrapperRef.current?.querySelector('.ant-table-header') || wrapperRef.current?.querySelector('.ant-table-thead') : null;
    const headerObserver = headerEl && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateHeight()) : null;
    if (headerEl && headerObserver) headerObserver.observe(headerEl);

    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateHeight, 100);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
      headerObserver?.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [resolvedDynamicScrollY, scrollYOffset, adjustScrollForTallHeader, data, wrapperRef?.current?.getBoundingClientRect(), selectionRef?.current?.getBoundingClientRect()]);

  const tableLoading = React.useMemo(() => {
    if (typeof loading === 'boolean') {
      return {
        spinning: loading,
        indicator: <CustomLoader variant="spinner" className="py-3" />,
      };
    }

    if (loading && typeof loading === 'object') {
      return {
        ...loading,
        indicator: loading.indicator || <CustomLoader variant="spinner" className="py-3" />,
      };
    }

    return loading;
  }, [loading]);

  return (
    <div ref={wrapperRef} className={`bg-white  overflow-hidden ${className}`}>
      {/* Table Header */}
      {showHeader && (title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-white">
          {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}

      {/* Table Content */}
      <div className="relative">
        <style>{`
          ${
            !needsScroll && resolvedDynamicScrollY
              ? `
            .custom-table-no-scroll .ant-table-body {
              overflow-y: hidden !important;
            }
            .custom-table-no-scroll .ant-table-body::-webkit-scrollbar {
              display: none;
            }
            .custom-table-no-scroll .ant-table-ping-right .ant-table-cell-fix-right-first::after {
              box-shadow: none !important
              border-left: 1px solid #e5e7eb !important;
            }
            .custom-table-no-scroll .ant-table-cell-fix-right {
              right: 0 !important;
            }
          `
              : ''
          }
          .skeleton-row td {
            cursor: default !important;
            pointer-events: none;
          }
          .skeleton-row:hover > td {
            background: inherit !important;
            transform: none !important;
            box-shadow: none !important;
          }
          .custom-table .ant-table-column-sorter {
            display: inline-flex;
            align-items: center;
            height: 12px;
            line-height: 12px;
            font-size: 10px;
          }
          .custom-table .ant-table-column-sorter .anticon {
            font-size: 10px;
            line-height: 10px;
          }
          .custom-table .ant-table-column-sorters {
            align-items: center;
            min-height: 20px;
          }
          .custom-table .ant-table-thead > tr > th {
            padding-top: 10px !important;
            padding-bottom: 10px !important;
          }
        `}</style>
        <Table
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          key={`table-${mergedColumns.length}`}
          className={`custom-table border-[1px] ${!needsScroll && resolvedDynamicScrollY ? 'custom-table-no-scroll' : ''} ${customStyle}`}
          rowClassName={(record, index) => {
            if (showSkeleton) {
              return `skeleton-row ${index % 2 === 0 ? 'row-alt-white' : 'row-alt-gray'}`;
            }
            const customClass = typeof rowClassName === 'function' ? rowClassName(record, index) : rowClassName || '';
            return `${customClass} ${index % 2 === 0 ? 'row-alt-white' : 'row-alt-gray'} ${onRowClick ? 'cursor-pointer' : ''}`.trim();
          }}
          pagination={false}
          rowKey={showSkeleton ? record => record._skeletonId : tableId ? (typeof tableId === 'function' ? tableId : record => record?.[tableId] || record?._id || record?.id) : undefined}
          onRow={record => {
            if (showSkeleton) return {};
            return {
              onClick: event => {
                const target = event.target;
                const actionCell =
                  target.closest('.custom-table-action-column') ||
                  target.closest('a') ||
                  target.closest('button') ||
                  target.closest('.ant-btn') ||
                  target.closest('.ant-switch') ||
                  target.closest('[role="button"]') ||
                  target.closest('.ant-table-selection-column');

                if (onRowClick && !actionCell) {
                  onRowClick(record);
                }
              },
              style: {
                cursor: onRowClick ? 'pointer' : 'default',
              },
            };
          }}
          loading={showSpinner ? tableLoading : false}
          columns={showSkeleton ? skeletonColumns : mergedColumns}
          onChange={onChange}
          dataSource={showSkeleton ? skeletonData : data}
          size="small"
          bordered={bordered}
          tableLayout="fixed"
          scroll={resolvedScroll}
          id={tableId}
          // rowSelection={rowSelection}
          expandable={expandable}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center justify-center py-10 px-6">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">No records found</p>
                <p className="text-xs text-gray-400">Try adjusting your filters or search criteria.</p>
              </div>
            ),
          }}
        />
      </div>

      {/* Enhanced Pagination */}
      {shouldRenderPagination && (
        <>
          {isPaginationFixed ? (
            <div
              className={`flex flex-col fixed fixed-pagination sm:flex-row !z-50 sm:items-center justify-between gap-1 py-[8.8px] px-2 ps-4 border-t border-l border-gray-200 bg-white ${paginationClassName}`}
            >
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                {/* Pagination */}
                <div className="w-full sm:w-auto">
                  {showPaginationSkeleton ? (
                    <div className="flex items-center gap-2">
                      <div className="h-[39px] w-[80px] rounded-[0.25rem] border border-[#1E3A561A] bg-white p-2">
                        <div className="skeleton-shimmer h-full w-full rounded" />
                      </div>
                      {skeletonPageButtons.map(page => (
                        <div key={`fixed-pagination-skeleton-page-${page}`} className="h-8 w-8 rounded-md border border-[#1E3A561A] bg-white p-1.5">
                          <div className="skeleton-shimmer h-full w-full rounded" />
                        </div>
                      ))}
                      <div className="h-9 w-[80px] rounded-[0.25rem] border border-[#1E3A561A] bg-white p-2">
                        <div className="skeleton-shimmer h-full w-full rounded" />
                      </div>
                    </div>
                  ) : (
                    <Pagination
                      current={normalizedPagination.current}
                      pageSize={normalizedPagination.pageSize}
                      total={normalizedPagination.total}
                      showSizeChanger={false}
                      // showQuickJumper={!isTablet ? true : false}
                      onChange={handlePaginationChange}
                      className="custom-pagination"
                      size="default"
                      itemRender={(page, type, originalElement) => {
                        if (type === 'prev') {
                          return (
                            <button className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                              <span className="text-[#1E3A56]  font-normal text-[22px] -mt-[3px] mr-2">‹</span>
                              <span className="text-[#1E3A56] font-normal text-[14px]">Back</span>
                            </button>
                          );
                        }

                        // Replace ONLY the Next button
                        if (type === 'next') {
                          return (
                            <button className="flex items-center justify-center gap-1 px-3 h-9 -mt-[3px] w-[80.2px] rounded-[0.25rem] border border-[#1E3A561A] bg-white">
                              <span className="text-[#1E3A56] font-normal text-[14px]">Next</span>
                              <span className="text-[#1E3A56] font-normal text-[22px] -mt-[3px] ml-2">›</span>
                            </button>
                          );
                        }
                        if (type === 'page') {
                          const isActive = page === pagination.current;
                          return (
                            <button
                              style={{
                                borderRadius: 6,
                                padding: '4px 12px',
                                minWidth: 35,
                                height: 30,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isActive ? 'white' : 'inherit',
                              }}
                            >
                              {page}
                            </button>
                          );
                        }
                        return originalElement;
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-7 w-full sm:w-auto">
                {/* Page size dropdown */}
                <div className="flex pagination-select items-center gap-2 text-sm text-[#1E3A56]">
                  <span>Result per page</span>
                  {showPaginationSkeleton ? (
                    <div className="h-8 w-16 rounded-md border border-[#1E3A561A] bg-white p-1.5">
                      <div className="skeleton-shimmer h-full w-full rounded" />
                    </div>
                  ) : (
                    <Select
                      value={normalizedPagination.pageSize}
                      className="py-0.5"
                      onChange={e => handlePaginationChange(1, parseInt(e))}
                      getPopupContainer={() => wrapperRef.current || document.body}
                    >
                      {TABLE_PAGE_SIZE_OPTIONS.map(n => (
                        <Select.Option key={n} value={n}>
                          {n}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                </div>
                {/* Showing Entries Info */}
                <div className="text-center sm:text-left mr-5">
                  {showPaginationSkeleton ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-[#1E3A56]">{skeletonInfoStart}</span>
                      <span className="text-sm text-[#1E3A56]">-</span>
                      <span className="text-sm text-[#1E3A56]">{skeletonInfoEnd}</span>
                      <span className="text-sm text-[#1E3A56]">of</span>
                      <div className="skeleton-shimmer h-4 w-12 rounded" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center sm:justify-start items-center text-sm text-[#1E3A56] font-normal leading-[20px] gap-1">
                      <span className="">{(normalizedPagination.current - 1) * normalizedPagination.pageSize + 1}</span>
                      <span>-</span>
                      <span className="">{Math.min(normalizedPagination.current * normalizedPagination.pageSize, normalizedPagination.total)}</span>
                      <span>of</span>
                      <span className="">{normalizedPagination.total}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-2 py-3.5 ps-4 border-t border-gray-200 bg-white">
              <div className="text-center sm:text-left">
                {showPaginationSkeleton ? (
                  <div className="flex items-center gap-1 justify-center sm:justify-start">
                    <span className="text-sm text-gray-600">{skeletonInfoStart}</span>
                    <span className="text-sm text-gray-600">-</span>
                    <span className="text-sm text-gray-600">{skeletonInfoEnd}</span>
                    <span className="text-sm text-gray-600">of</span>
                    <div className="skeleton-shimmer h-4 w-12 rounded" />
                    <span className="text-sm text-gray-600">entries</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center sm:justify-start items-center text-sm text-gray-600 gap-1">
                    <span className="font-semibold text-gray-900">{(normalizedPagination.current - 1) * normalizedPagination.pageSize + 1}</span>
                    <span>-</span>
                    <span className="font-semibold text-gray-900">{Math.min(normalizedPagination.current * normalizedPagination.pageSize, normalizedPagination.total)}</span>
                    <span>of</span>
                    <span className="font-semibold text-gray-900">{normalizedPagination.total}</span>
                    <span>entries</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center pagination-select gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  {showPaginationSkeleton ? (
                    <div className="h-8 w-16 rounded-md border border-[#1E3A561A] bg-white p-1.5">
                      <div className="skeleton-shimmer h-full w-full rounded" />
                    </div>
                  ) : (
                    <Select
                      value={normalizedPagination.pageSize}
                      className="py-0.5"
                      onChange={e => handlePaginationChange(1, parseInt(e))}
                      getPopupContainer={() => wrapperRef.current || document.body}
                    >
                      {TABLE_PAGE_SIZE_OPTIONS.map(n => (
                        <Select.Option key={n} value={n}>
                          {n}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                  <span>per page</span>
                </div>

                <div className="w-full sm:w-auto">
                  {showPaginationSkeleton ? (
                    <div className="flex items-center gap-2">
                      {skeletonPageButtons.map(page => (
                        <div key={`non-fixed-pagination-skeleton-page-${page}`} className="h-10 w-10 rounded-md border border-[#1E3A561A] bg-white p-2">
                          <div className="skeleton-shimmer h-full w-full rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Pagination
                      current={normalizedPagination.current}
                      pageSize={normalizedPagination.pageSize}
                      total={normalizedPagination.total}
                      showSizeChanger={false}
                      showQuickJumper={!isTablet ? showQuickJumper : false}
                      onChange={handlePaginationChange}
                      className="custom-pagination"
                      size="default"
                      itemRender={(page, type, originalElement) => {
                        if (isMobile) {
                          if (type === 'prev' || type === 'next') {
                            return originalElement;
                          }
                          if (type === 'page') {
                            const isActive = page === pagination.current;
                            return isActive ? (
                              <button
                                style={{
                                  backgroundColor: isActive ? colorPalette.primary[500] : '',
                                  borderRadius: 6,
                                  padding: '6px 12px',
                                  minWidth: 40,
                                  height: 40,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isActive ? 'white' : 'inherit',
                                }}
                              >
                                {page}
                              </button>
                            ) : null;
                          }
                          return null;
                        }
                        if (type === 'page') {
                          const isActive = page === normalizedPagination.current;
                          return (
                            <button
                              style={{
                                borderRadius: 6,
                                padding: '6px 12px',
                                minWidth: 40,
                                height: 40,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isActive ? 'white' : 'inherit',
                              }}
                            >
                              {page}
                            </button>
                          );
                        }

                        return originalElement;
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomTable;
