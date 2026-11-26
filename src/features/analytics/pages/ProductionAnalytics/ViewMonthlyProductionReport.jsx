import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Space, Tooltip } from 'antd';

import { Button, Select, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Toast from '@/components/ui/common/Toast';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { PRODUCTION_MODULE_STATUS } from '@/utils/constants';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useMonthlyProductionReport } from '@/features/analytics/useMonthlyProductionReport';
import { toDecimalString } from '@/utils/currency';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => ({ value: CURRENT_YEAR - i, label: String(CURRENT_YEAR - i) }));

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DETAIL_VIEWS = { ORDERS: 'orders', BY_ITEM: 'by_item' };

const YEAR_FILTER_CONFIG = {
  year: {
    label: 'Year',
    format: value => value,
    clear: (setFilter, updateUrlParams) => {
      updateUrlParams({ year: null });
    },
  },
};

const summaryExportColumns = () => [
  { title: 'Month', getExportValue: r => r.monthLabel || '' },
  { title: 'Orders', getExportValue: r => r.orders ?? 0 },
  { title: 'Planned Qty', getExportValue: r => r.plannedQty ?? 0 },
  { title: 'Complete Qty', getExportValue: r => r.completeQty ?? 0 },
  { title: 'FG Rejected', getExportValue: r => r.fgRejectionQty ?? 0 },
  { title: 'FG Rejection %', getExportValue: r => r.fgRejectionPct ?? 0 },
];

const orderExportColumns = () => [
  { title: 'Production Order No', getExportValue: r => r.productionOrderCode || '' },
  { title: 'Item Code', getExportValue: r => r.itemCode || '' },
  { title: 'Item Name', getExportValue: r => r.itemName || '' },
  { title: 'Planned Qty', getExportValue: r => r.plannedQty ?? 0 },
  { title: 'Produced Qty', getExportValue: r => r.producedQty ?? 0 },
  { title: 'Pending Qty', getExportValue: r => r.pendingQty ?? 0 },
  { title: 'FG Submitted', getExportValue: r => r.fgSubmittedQty ?? 0 },
  { title: 'FG Rejected', getExportValue: r => r.fgRejectedQty ?? 0 },
  { title: 'FG Rejection %', getExportValue: r => r.fgRejectionPct ?? 0 },
  { title: 'Status', getExportValue: r => PRODUCTION_MODULE_STATUS?.[r.status] || r.status || '' },
];

const byItemExportColumns = () => [
  { title: 'Item Code', getExportValue: r => r.itemCode || '' },
  { title: 'Item Name', getExportValue: r => r.itemName || '' },
  { title: 'Orders', getExportValue: r => r.orders ?? 0 },
  { title: 'Planned Qty', getExportValue: r => r.plannedQty ?? 0 },
  { title: 'Produced Qty', getExportValue: r => r.producedQty ?? 0 },
  { title: 'Pending Qty', getExportValue: r => r.pendingQty ?? 0 },
  { title: 'FG Submitted', getExportValue: r => r.fgSubmittedQty ?? 0 },
  { title: 'FG Rejected', getExportValue: r => r.fgRejectedQty ?? 0 },
  { title: 'FG Rejection %', getExportValue: r => r.fgRejectionPct ?? 0 },
];

const KpiCard = ({ label, value, suffix = '', icon, loading }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex flex-col items-start justify-between gap-2 mb-2">
      <div className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: colorPalette.primary[500] }}>
        {icon}
      </div>
    </div>
    <div className="space-y-0.5">
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{label}</p>
      {loading ? (
        <div className="h-6 w-20 bg-gray-100 animate-pulse rounded" />
      ) : (
        <p className="text-lg sm:text-lg font-bold text-gray-900 leading-tight break-words cursor-default">
          {value ?? 0}
          {suffix}
        </p>
      )}
    </div>
  </div>
);

const Section = ({ title, children, extra }) => (
  <div className="bg-white border border-gray-200">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      {extra}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const EmptyState = ({ text = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <Icons.InboxOutlined style={{ fontSize: 36 }} />
    <p className="mt-2 text-sm">{text}</p>
  </div>
);

const RejectionBar = ({ pct }) => {
  const value = Number(pct ?? 0);
  const barColor = value === 0 ? 'bg-green-500' : value < 5 ? 'bg-yellow-500' : 'bg-red-500';
  const pillColor = value === 0 ? 'bg-green-50 text-green-700' : value < 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pillColor}`}>{toDecimalString(value)}%</span>
    </div>
  );
};

const summaryColumns = onMonthClick => [
  {
    title: 'Month',
    dataIndex: 'monthLabel',
    key: 'monthLabel',
    render: (text, record) => (
      <button className="text-sm font-medium hover:underline" style={{ color: colorPalette.primary[500] }} onClick={() => onMonthClick(record.month)}>
        {text}
      </button>
    ),
  },
  { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'right' },
  { title: 'Planned Qty', dataIndex: 'plannedQty', key: 'plannedQty', align: 'right' },
  { title: 'Complete Qty', dataIndex: 'completeQty', key: 'completeQty', align: 'right' },
  { title: 'FG Rejected', dataIndex: 'fgRejectionQty', key: 'fgRejectionQty', align: 'right' },
  {
    title: 'FG Rejection %',
    dataIndex: 'fgRejectionPct',
    key: 'fgRejectionPct',
    render: v => <RejectionBar pct={v} />,
    width: 150,
  },
];

const detailOrderColumns = () => [
  {
    title: 'Production Order No',
    dataIndex: 'productionOrderCode',
    key: 'productionOrderCode',
    render: (code, record) =>
      code ? (
        <Link to={`/production-orders/${record._id}`}>
          <Tag className="font-semibold">{code}</Tag>
        </Link>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Code',
    dataIndex: 'itemCode',
    key: 'itemCode',
    render: (code, record) =>
      code ? (
        <Link to={`/item-master/${record.itemId}`}>
          <Tag className="font-semibold">{code}</Tag>
        </Link>
      ) : (
        '-'
      ),
  },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', ellipsis: true },
  { title: 'Planned Qty', dataIndex: 'plannedQty', key: 'plannedQty', align: 'right' },
  { title: 'Produced Qty', dataIndex: 'producedQty', key: 'producedQty', align: 'right' },
  { title: 'Pending Qty', dataIndex: 'pendingQty', key: 'pendingQty', align: 'right' },
  { title: 'FG Submitted', dataIndex: 'fgSubmittedQty', key: 'fgSubmittedQty', align: 'right' },
  { title: 'FG Rejected', dataIndex: 'fgRejectedQty', key: 'fgRejectedQty', align: 'right', render: v => v ?? 0 },
  {
    title: 'FG Rejection %',
    dataIndex: 'fgRejectionPct',
    key: 'fgRejectionPct',
    render: v => <RejectionBar pct={v} />,
    width: 150,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: v => <StatusBadge status={v} value={PRODUCTION_MODULE_STATUS?.[v] || v} />,
  },
];

const detailByItemColumns = onItemClick => [
  {
    title: 'Item Code',
    dataIndex: 'itemCode',
    key: 'itemCode',
    render: (code, record) =>
      code ? (
        <Link to={`/item-master/${record.itemId}`}>
          <Tag className="font-semibold">{code}</Tag>
        </Link>
      ) : (
        '-'
      ),
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    render: (text, record) => (
      <button className="text-sm font-medium hover:underline" style={{ color: colorPalette.primary[500] }} onClick={() => onItemClick(record)}>
        {text}
      </button>
    ),
  },
  { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'right' },
  { title: 'Planned Qty', dataIndex: 'plannedQty', key: 'plannedQty', align: 'right' },
  { title: 'Produced Qty', dataIndex: 'producedQty', key: 'producedQty', align: 'right' },
  { title: 'Pending Qty', dataIndex: 'pendingQty', key: 'pendingQty', align: 'right' },
  { title: 'FG Submitted', dataIndex: 'fgSubmittedQty', key: 'fgSubmittedQty', align: 'right' },
  { title: 'FG Rejected', dataIndex: 'fgRejectedQty', key: 'fgRejectedQty', align: 'right', render: v => v ?? 0 },
  {
    title: 'FG Rejection %',
    dataIndex: 'fgRejectionPct',
    key: 'fgRejectionPct',
    render: v => <RejectionBar pct={v} />,
    width: 150,
  },
];

const ItemOrdersDrilldown = ({ item, allOrders, loading, onBack }) => {
  const itemOrders = (allOrders || []).filter(o => String(o.itemId) === String(item.itemId));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={onBack} />
        <div>
          <p className="font-semibold text-gray-800">{item.itemName}</p>
          {item.itemCode ? (
            <Link to={`/item-master/${item.itemId}`}>
              <Tag className="font-semibold">{item.itemCode}</Tag>
            </Link>
          ) : null}
        </div>
      </div>
      <Section title={`Production Orders — ${item.itemName}`}>
        <CustomTable
          columns={detailOrderColumns()}
          data={itemOrders}
          loading={loading}
          rowKey={r => r._id?.toString() || r.productionOrderCode}
          pagination={false}
          scroll={{ x: 1000 }}
          locale={{ emptyText: <EmptyState text="No production orders for this item" /> }}
        />
      </Section>
    </div>
  );
};

const ViewMonthlyProductionReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const year = parseInt(searchParams.get('year')) || CURRENT_YEAR;
  const monthParam = parseInt(searchParams.get('month')) || null;
  const [filterYear, setFilterYear] = useState(year);

  const [detailView, setDetailView] = useState(DETAIL_VIEWS.ORDERS);
  const [drilldownItem, setDrilldownItem] = useState(null);
  const [allMonthOrders, setAllMonthOrders] = useState([]);
  const [allMonthOrdersLoading, setAllMonthOrdersLoading] = useState(false);

  const summaryControllerRef = useRef(null);
  const ordersControllerRef = useRef(null);
  const byItemControllerRef = useRef(null);
  const allOrdersControllerRef = useRef(null);
  const containerRef = useRef(null);

  const {
    summary,
    summaryLoading,
    detailOrders,
    detailOrdersKpis,
    detailOrdersPagination,
    detailOrdersLoading,
    detailByItem,
    detailByItemPagination,
    detailByItemLoading,
    getSummary,
    getDetailOrders,
    getDetailByItem,
    resetAll,
    resetOrders,
    resetByItem,
  } = useMonthlyProductionReport();

  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || DEFAULT_PAGE_SIZE;

  useResetOnUnmount(resetAll);

  const updateUrlParams = useCallback(
    newParams => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (monthParam) return;
    summaryControllerRef.current?.abort();
    summaryControllerRef.current = new AbortController();
    getSummary({ year, signal: summaryControllerRef.current.signal });
    return () => summaryControllerRef.current?.abort();
  }, [year, monthParam]);

  useEffect(() => {
    if (monthParam) return;
    resetOrders();
    resetByItem();
    setAllMonthOrders([]);
  }, [monthParam]);

  useEffect(() => {
    if (!monthParam || detailView !== DETAIL_VIEWS.ORDERS) return;

    ordersControllerRef.current?.abort();
    ordersControllerRef.current = new AbortController();
    getDetailOrders({ year, month: monthParam, page, limit, signal: ordersControllerRef.current.signal });

    return () => ordersControllerRef.current?.abort();
  }, [monthParam, year, detailView, page, limit]);

  useEffect(() => {
    if (!monthParam || detailView !== DETAIL_VIEWS.BY_ITEM) return;

    byItemControllerRef.current?.abort();
    byItemControllerRef.current = new AbortController();
    getDetailByItem({ year, month: monthParam, page, limit, signal: byItemControllerRef.current.signal });

    return () => byItemControllerRef.current?.abort();
  }, [monthParam, year, detailView, page, limit]);

  const fetchAllOrdersForDrilldown = useCallback(() => {
    if (!monthParam) return;
    allOrdersControllerRef.current?.abort();
    allOrdersControllerRef.current = new AbortController();
    setAllMonthOrdersLoading(true);
    getDetailOrders({ year, month: monthParam, pagination: false, signal: allOrdersControllerRef.current.signal })
      .then(action => {
        const data = action?.payload?.data || [];
        setAllMonthOrders(data);
      })
      .finally(() => setAllMonthOrdersLoading(false));
  }, [monthParam, year, getDetailOrders]);

  useEffect(() => {
    return () => {
      byItemControllerRef.current?.abort();
      allOrdersControllerRef.current?.abort();
    };
  }, []);

  const handleMonthClick = month => {
    updateUrlParams({ month, page: 1, limit: DEFAULT_PAGE_SIZE });
    setDetailView(DETAIL_VIEWS.ORDERS);
    setDrilldownItem(null);
    setAllMonthOrders([]);
  };

  const handleBackToSummary = () => {
    updateUrlParams({ month: null, page: null, limit: null });
    setDrilldownItem(null);
    setAllMonthOrders([]);
  };

  const handleItemClick = item => {
    setDrilldownItem(item);
    if (!allMonthOrders.length) fetchAllOrdersForDrilldown();
  };

  const handleBackToItemList = () => {
    setDrilldownItem(null);
  };

  const handleDetailViewChange = view => {
    setDetailView(view);
    setDrilldownItem(null);
    updateUrlParams({ page: 1 });
  };

  const handlePaginationChange = (nextPage, pageSize) => {
    updateUrlParams({ page: nextPage, limit: pageSize });
  };

  const handleApplyFilter = () => {
    updateUrlParams({ year: filterYear !== CURRENT_YEAR ? filterYear : null, month: null, page: null, limit: null });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterYear(CURRENT_YEAR);
    updateUrlParams({ year: null, month: null, page: null, limit: null });
    setShowFilter(false);
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('year')].filter(Boolean).length;
  };

  const selectedMonthLabel = monthParam ? MONTH_NAMES[monthParam - 1] : null;
  const kpis = monthParam ? detailOrdersKpis : summary?.kpis;
  const activeDetailLoading = detailView === DETAIL_VIEWS.BY_ITEM ? detailByItemLoading : detailOrdersLoading;
  const kpiLoading = monthParam ? activeDetailLoading && !detailOrdersKpis : summaryLoading;

  const exportContext = useMemo(() => {
    if (!monthParam) {
      return {
        key: 'summary',
        entityPlural: 'Monthly Summary',
        defaultFileName: `Monthly_Production_Summary_${year}`,
        sheetName: 'Monthly Summary',
        hasData: (summary?.months || []).length > 0,
      };
    }
    if (detailView === DETAIL_VIEWS.BY_ITEM) {
      return {
        key: 'by_item',
        entityPlural: 'Item Wise Report',
        defaultFileName: `Monthly_Production_Item_Wise_${selectedMonthLabel}_${year}`.replace(/\s+/g, '_'),
        sheetName: 'Item Wise',
        hasData: (detailByItem || []).length > 0 || detailByItemPagination.totalResults > 0,
      };
    }
    return {
      key: 'orders',
      entityPlural: 'Production Orders',
      defaultFileName: `Monthly_Production_Orders_${selectedMonthLabel}_${year}`.replace(/\s+/g, '_'),
      sheetName: 'Production Orders',
      hasData: (detailOrders || []).length > 0 || detailOrdersPagination.totalResults > 0,
    };
  }, [monthParam, year, detailView, summary?.months, detailByItem, detailByItemPagination.totalResults, detailOrders, detailOrdersPagination.totalResults, selectedMonthLabel]);

  const handleExport = async ({ fileName }) => {
    setExportLoading(true);
    const controller = new AbortController();
    try {
      let rows = [];
      let columns = [];

      if (exportContext.key === 'summary') {
        rows = summary?.months || [];
        columns = summaryExportColumns();
      } else if (exportContext.key === 'by_item') {
        const action = await getDetailByItem({ year, month: monthParam, pagination: false, signal: controller.signal });
        rows = action?.payload?.data || [];
        columns = byItemExportColumns();
      } else {
        const action = await getDetailOrders({ year, month: monthParam, pagination: false, signal: controller.signal });
        rows = action?.payload?.data || [];
        columns = orderExportColumns();
      }

      if (!rows.length) {
        Toast.warning('No data available to export.');
        return;
      }

      await downloadExcelExport({
        exportData: buildExportRows(rows, columns),
        sheetName: exportContext.sheetName,
        fileName: resolveExportFileName(fileName, exportContext.defaultFileName),
      });
      setShowExportModal(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      console.error('Export error:', error);
      Toast.error('Failed to export. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="-m-4 bg-white">
      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          {monthParam ? (
            <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={handleBackToSummary} />
          ) : (
            <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics')} />
          )}
          <p className="font-bold text-[1.125rem]">
            Monthly Production Report
            {selectedMonthLabel && (
              <span className="ml-2 text-base font-normal text-gray-500">
                — {selectedMonthLabel} {year}
              </span>
            )}
          </p>
          {!monthParam && (
            <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
              <Tooltip title="Month-wise breakdown of production orders, planned vs completed quantity, FG submissions and rejections." placement="right">
                <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
              </Tooltip>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <Space>
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
            <Button icon={<Icons.FileExcelOutlined />} onClick={() => setShowExportModal(true)} disabled={!exportContext.hasData || exportLoading}>
              Export
            </Button>
          </Space>
        </div>
      </div>

      <FilterDrawer open={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} onReset={handleResetFilter}>
        <FilterSection title="When" columns={1}>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-600">Year</p>
            <Select value={filterYear} onChange={setFilterYear} options={YEAR_OPTIONS} className="w-full" getPopupContainer={() => containerRef.current || document.body} />
          </div>
        </FilterSection>
      </FilterDrawer>

      <CommonFilterTags
        filterClassName="!mb-0 border-t"
        searchParams={searchParams}
        setFilter={() => {}}
        updateUrlParams={updateUrlParams}
        handleClear={handleResetFilter}
        handleResetFilters={handleResetFilter}
        dateKeys={{ startDateKey: '__none__', endDateKey: '__none__', singleDateKey: '__none__' }}
        extraFilters={YEAR_FILTER_CONFIG}
      />

      <div className="px-4 pb-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-gray-200">
          <KpiCard label="Total Orders" value={kpis?.totalOrders} icon={<Icons.FileTextOutlined style={{ fontSize: 20 }} />} loading={kpiLoading} />
          <KpiCard label="Planned Qty" value={kpis?.totalPlanned} icon={<Icons.ProfileOutlined style={{ fontSize: 20 }} />} loading={kpiLoading} />
          <KpiCard label="Completed Qty" value={kpis?.totalComplete} icon={<Icons.CheckCircleOutlined style={{ fontSize: 20 }} />} loading={kpiLoading} />
          <KpiCard label="FG Rejected" value={kpis?.totalRejection} icon={<Icons.CloseCircleOutlined style={{ fontSize: 20 }} />} loading={kpiLoading} />
          <KpiCard
            label={monthParam ? 'Rejection %' : 'Avg Rejection %'}
            value={toDecimalString(monthParam ? kpis?.rejectionPct : kpis?.avgRejectionPct)}
            suffix="%"
            icon={<Icons.WarningOutlined style={{ fontSize: 20 }} />}
            loading={kpiLoading}
          />
        </div>

        {!monthParam && (
          <Section title={`Month-wise Summary — ${year}`} extra={<span className="text-xs text-gray-400">Click a month to drill down</span>}>
            <CustomTable
              columns={summaryColumns(handleMonthClick)}
              data={summary?.months || []}
              loading={summaryLoading}
              rowKey={r => r.month}
              pagination={false}
              scroll={{ x: 700 }}
              locale={{ emptyText: <EmptyState text="No production data for the selected year" /> }}
            />
          </Section>
        )}

        {monthParam && (
          <>
            <div className="flex gap-2">
              <CustomButton type={detailView === DETAIL_VIEWS.ORDERS ? 'primary' : 'default'} text="Production Wise" onClick={() => handleDetailViewChange(DETAIL_VIEWS.ORDERS)} />
              <CustomButton type={detailView === DETAIL_VIEWS.BY_ITEM ? 'primary' : 'default'} text="Item Wise" onClick={() => handleDetailViewChange(DETAIL_VIEWS.BY_ITEM)} />
            </div>

            {detailView === DETAIL_VIEWS.ORDERS && (
              <Section title="Production Orders">
                <CustomTable
                  columns={detailOrderColumns()}
                  data={detailOrders}
                  loading={detailOrdersLoading}
                  rowKey={r => r._id?.toString() || r.productionOrderCode}
                  paginationClassName="!left-0"
                  pagination={{
                    current: page,
                    pageSize: limit,
                    total: detailOrdersPagination.totalResults,
                    onChange: handlePaginationChange,
                  }}
                  scroll={{ x: 1000 }}
                  locale={{ emptyText: <EmptyState text="No production orders for this month" /> }}
                />
              </Section>
            )}

            {detailView === DETAIL_VIEWS.BY_ITEM &&
              (drilldownItem ? (
                <ItemOrdersDrilldown item={drilldownItem} allOrders={allMonthOrders} loading={allMonthOrdersLoading} onBack={handleBackToItemList} />
              ) : (
                <Section title="Item-wise Summary" extra={<span className="text-xs text-gray-400">Click an item to see its production orders</span>}>
                  <CustomTable
                    columns={detailByItemColumns(handleItemClick)}
                    data={detailByItem}
                    loading={detailByItemLoading}
                    rowKey={r => r.itemId?.toString() || r.itemName}
                    paginationClassName="!left-0"
                    pagination={{
                      current: page,
                      pageSize: limit,
                      total: detailByItemPagination.totalResults,
                      onChange: handlePaginationChange,
                    }}
                    scroll={{ x: 800 }}
                    locale={{ emptyText: <EmptyState text="No item-wise data for this month" /> }}
                  />
                </Section>
              ))}
          </>
        )}
      </div>

      <ExportDataModal
        modalOpen={showExportModal}
        setModalOpen={setShowExportModal}
        entityPlural={exportContext.entityPlural}
        defaultFileName={exportContext.defaultFileName}
        exportLoading={exportLoading}
        onExport={handleExport}
        formName="export-monthly-production-report"
      />
    </div>
  );
};

export default ViewMonthlyProductionReport;
