import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button, Progress, Tag, Skeleton } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import { useDashboard } from '@/features/dashboard';
import { formatAmountShort, formatAmount, toDecimalString } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const PRIMARY = colorPalette.primary[500];

const getRisk = pct => {
  if (pct >= 100) return { label: 'Critical', hex: '#ef4444' };
  if (pct >= 90) return { label: 'High', hex: '#f97316' };
  if (pct >= 70) return { label: 'Warning', hex: '#eab308' };
  return { label: 'Safe', hex: '#22c55e' };
};

const formatUtilRate = rate => {
  if (!rate) return '0%';
  if (rate < 0.01) return '< 0.01%';
  if (rate < 0.1) return '< 0.1%';
  if (rate < 10) return `${toDecimalString(rate)}%`;
  return `${toDecimalString(rate)}%`;
};

const VARIANT_COLORS = {
  default: { bg: 'rgba(23,133,182,0.08)', text: PRIMARY, bar: PRIMARY },
  danger: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444', bar: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', bar: '#f59e0b' },
  success: { bg: 'rgba(34,197,94,0.08)', text: '#16a34a', bar: '#16a34a' },
};

const KpiCard = ({ icon, title, displayValue, subValue, progressValue, variant = 'default', loading }) => {
  const c = VARIANT_COLORS[variant] || VARIANT_COLORS.default;
  return (
    <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="p-2 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg, color: c.text }}>
          {icon}
        </div>
        {subValue && !loading && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 tabular-nums">{subValue}</span>}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1 truncate">{title}</p>
        {loading ? (
          <div className="ds-shimmer h-6 w-20 mt-1" />
        ) : (
          <p className="text-sm sm:text-base font-bold leading-tight truncate" style={{ color: variant === 'default' ? '#111827' : c.text }}>
            {displayValue}
          </p>
        )}
        {progressValue != null && !loading && (
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progressValue, 100)}%`, backgroundColor: c.bar }} />
          </div>
        )}
      </div>
    </div>
  );
};

const CreditLimitDashboard = () => {
  const {
    creditOverview: overview,
    creditUtilization,
    overLimitCustomers: alertsRes,
    creditOverviewLoading: overviewLoading,
    creditUtilizationLoading: utilLoading,
    overLimitCustomersLoading: alertsLoading,
    getCreditOverview,
    getCreditUtilization,
    getOverLimitCustomers,
  } = useDashboard();

  const [searchParams, setSearchParams] = useSearchParams();
  const utilPage = parseInt(searchParams.get('page')) || 1;
  const utilLimit = parseInt(searchParams.get('limit')) || 10;
  const sortBy = searchParams.get('sortBy') || 'utilizationPercent:desc';
  const aPage = parseInt(searchParams.get('aPage')) || 1;
  const aLimit = parseInt(searchParams.get('aLimit')) || 10;
  const aSortBy = searchParams.get('aSortBy') || 'crossedSinceDays:desc';
  const currentTab = searchParams.get('tab') || 'customer';
  const currentView = searchParams.get('view') || 'less';
  const isCustomer = currentTab === 'customer';
  const isVendor = currentTab === 'vendor';
  const isUtilViewAll = currentView === 'all' || currentView === 'utilization';
  const isAlertsViewAll = currentView === 'alerts';

  const overviewControllerRef = useRef(null);
  const utilControllerRef = useRef(null);
  const alertsControllerRef = useRef(null);

  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const utilizationData = creditUtilization?.data || [];
  const totalResults = creditUtilization?.extras?.totalResults || 0;
  const alertsDataList = alertsRes?.data || [];
  const totalAlerts = alertsRes?.extras?.totalResults ?? alertsDataList.length;

  const openCustomerDrawer = (id, displayName) => {
    setSelectedCustomer({ id, customerDisplayName: displayName });
    setViewCustomerDetail(true);
  };

  const updateUrlParams = updates => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
      else params.delete(key);
    });
    setSearchParams(params);
  };

  const fetchOverview = () => {
    if (overviewControllerRef.current) overviewControllerRef.current.abort();
    const controller = new AbortController();
    overviewControllerRef.current = controller;
    getCreditOverview({ isCustomer, isVendor, signal: controller.signal });
  };

  const toggleUtilViewAll = () => {
    const newView = isUtilViewAll ? 'less' : 'utilization';
    updateUrlParams({ view: newView, limit: newView === 'less' ? 10 : utilLimit, page: 1 });
  };

  const toggleAlertsViewAll = () => {
    const newView = isAlertsViewAll ? 'less' : 'alerts';
    updateUrlParams({ view: newView, aLimit: newView === 'less' ? 10 : aLimit, aPage: 1 });
  };

  useEffect(() => {
    fetchOverview();
  }, [currentTab]);

  useEffect(() => {
    if (isAlertsViewAll) return;
    if (utilControllerRef.current) utilControllerRef.current.abort();
    const controller = new AbortController();
    utilControllerRef.current = controller;
    getCreditUtilization({ page: utilPage, limit: utilLimit, sortBy, isCustomer, isVendor, signal: controller.signal });
  }, [utilPage, utilLimit, sortBy, currentTab, isAlertsViewAll]);

  useEffect(() => {
    if (isUtilViewAll) return;
    if (alertsControllerRef.current) alertsControllerRef.current.abort();
    const controller = new AbortController();
    alertsControllerRef.current = controller;
    getOverLimitCustomers({ page: aPage, limit: aLimit, sortBy: aSortBy, isCustomer, isVendor, signal: controller.signal });
  }, [aPage, aLimit, aSortBy, currentTab, isUtilViewAll]);

  useEffect(() => {
    return () => {
      overviewControllerRef.current?.abort();
      utilControllerRef.current?.abort();
      alertsControllerRef.current?.abort();
    };
  }, []);

  const getSortOrder = (field, current) => {
    if (!current) return null;
    const [f, order] = current.split(':');
    return f === field ? (order === 'asc' ? 'ascend' : 'descend') : null;
  };

  const utilColumns = [
    {
      title: isCustomer ? 'Customer #' : 'Vendor #',
      dataIndex: 'customerNumber',
      key: 'customerNumber',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('customerNumber', sortBy),
      render: val => <Tag className="font-semibold text-xs">{val}</Tag>,
    },
    {
      title: isCustomer ? 'Customer' : 'Vendor',
      dataIndex: 'customer',
      key: 'customer',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('customer', sortBy),
    },
    {
      title: 'Credit Limit',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('creditLimit', sortBy),
      render: val => <span className="text-gray-700 tabular-nums">{formatAmount(val)}</span>,
    },
    {
      title: 'Utilized',
      dataIndex: 'utilized',
      key: 'utilized',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('utilized', sortBy),
      render: val => <span className="text-gray-700 tabular-nums">{formatAmount(val)}</span>,
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('available', sortBy),
      render: val => <span className={`tabular-nums font-medium ${val < 0 ? 'text-red-500' : 'text-gray-700'}`}>{formatAmount(val)}</span>,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilizationPercent',
      key: 'utilizationPercent',
      width: 150,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('utilizationPercent', sortBy),
      render: (_, record) => {
        const pct = record.utilizationPercent || 0;
        const risk = getRisk(pct);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-[60px]">
              <Progress percent={Math.min(pct, 100)} showInfo={false} size="small" strokeColor={risk.hex} trailColor="#f1f5f9" className="m-0" />
            </div>
            <span className="text-xs font-bold w-9 text-right tabular-nums" style={{ color: risk.hex }}>
              {toDecimalString(pct)}%
            </span>
          </div>
        );
      },
    },
    {
      title: 'Risk',
      key: 'risk',
      align: 'center',
      width: 90,
      render: (_, record) => {
        const risk = getRisk(record?.utilizationPercent || 0);
        return <StatusBadge accentHex={risk.hex} value={risk.label} />;
      },
    },
    {
      title: 'Last Payment',
      dataIndex: 'lastPayment',
      key: 'lastPayment',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('lastPayment', sortBy),
      render: val => (val ? <span className="text-gray-500 text-xs">{dateFormateForUi(val)}</span> : null),
    },
  ];

  const alertsColumns = [
    {
      title: isCustomer ? 'Cust #' : 'Vendor #',
      dataIndex: 'customerNumber',
      key: 'customerNumber',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('customerNumber', aSortBy),
      render: val => <Tag className="font-semibold text-xs">{val}</Tag>,
    },
    {
      title: isCustomer ? 'Customer' : 'Vendor',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('customerName', aSortBy),
      render: (_, record) => <span className="font-medium text-gray-900 text-sm">{record.customerName}</span>,
    },
    {
      title: 'Exceeded',
      dataIndex: 'crossedAmount',
      key: 'crossedAmount',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('crossedAmount', aSortBy),
      render: val => <span className="text-red-500 font-semibold tabular-nums">{formatAmount(val)}</span>,
    },
    {
      title: 'Overdue Amt',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      render: (val, record) =>
        record.overdueCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-orange-600 font-semibold tabular-nums">{formatAmount(val)}</span>
            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-600 px-1 py-0.5 rounded font-bold leading-none">{record.overdueCount}</span>
          </div>
        ) : null,
    },
    {
      title: 'Utilization',
      dataIndex: 'utilizationPercentage',
      key: 'utilizationPercentage',
      width: 140,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('utilizationPercentage', aSortBy),
      render: val => {
        const pct = val || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-[50px]">
              <Progress percent={Math.min(pct, 100)} showInfo={false} size="small" strokeColor="#ef4444" trailColor="#fee2e2" className="m-0" />
            </div>
            <span className="text-xs font-bold w-10 text-right text-red-600 tabular-nums">{toDecimalString(pct)}%</span>
          </div>
        );
      },
    },
    {
      title: 'Days Over',
      dataIndex: 'crossedSinceDays',
      key: 'crossedSinceDays',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('crossedSinceDays', aSortBy),
      render: val => (val != null ? <span className="font-bold text-orange-600 tabular-nums">{val}d</span> : null),
    },
    {
      title: 'Latest Due',
      dataIndex: ['latestInvoice', 'dueDate'],
      key: 'dueDate',
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: getSortOrder('latestInvoice.dueDate', aSortBy),
      render: val => (val ? <span className="text-gray-500 text-xs">{dateFormateForUi(val)}</span> : null),
    },
  ];

  const utilPagination = isUtilViewAll
    ? {
        current: utilPage,
        pageSize: utilLimit,
        total: totalResults,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: (page, pageSize) => updateUrlParams({ page, limit: pageSize }),
        onShowSizeChange: (_c, size) => updateUrlParams({ page: 1, limit: size }),
      }
    : false;

  const alertsPagination = isAlertsViewAll
    ? {
        current: aPage,
        pageSize: aLimit,
        total: totalAlerts,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: (page, pageSize) => updateUrlParams({ aPage: page, aLimit: pageSize }),
        onShowSizeChange: (_c, size) => updateUrlParams({ aPage: 1, aLimit: size }),
      }
    : false;

  const handleUtilTableChange = (pagination, _f, sorter) => {
    let sortParam = sortBy;
    if (sorter?.field && sorter?.order) {
      sortParam = `${sorter.field}:${sorter.order === 'ascend' ? 'asc' : 'desc'}`;
    }
    updateUrlParams({ page: pagination?.current || utilPage, limit: pagination?.pageSize || utilLimit, sortBy: sortParam });
  };

  const handleAlertsTableChange = (pagination, _f, sorter) => {
    let sortParam = aSortBy;
    if (sorter?.field && sorter?.order) {
      const field = Array.isArray(sorter.field) ? sorter.field.join('.') : sorter.field;
      sortParam = `${field}:${sorter.order === 'ascend' ? 'asc' : 'desc'}`;
    }
    updateUrlParams({ aPage: pagination?.current || aPage, aLimit: pagination?.pageSize || aLimit, aSortBy: sortParam });
  };

  const utilizationRate = overview?.utilizationRate ?? 0;
  const withCreditLimitCount = overview ? (overview.totalCount ?? 0) - (overview.noCreditLimitCount ?? 0) : 0;

  const kpiCards = [
    {
      icon: <Icons.WalletOutlined className="text-base" />,
      title: `Total ${isCustomer ? 'Credit' : 'Limit'} Assigned`,
      displayValue: overview ? formatAmountShort(overview.totalCredit) : '—',
      subValue: overview ? `${withCreditLimitCount} accounts` : null,
      variant: 'default',
    },
    {
      icon: <Icons.BarChartOutlined className="text-base" />,
      title: 'Total Outstanding',
      displayValue: overview ? formatAmountShort(overview.totalUtilized || 0) : '—',
      variant: 'default',
    },
    {
      icon: <Icons.DashboardOutlined className="text-base" />,
      title: 'Portfolio Utilization',
      displayValue: overview ? formatUtilRate(utilizationRate) : '—',
      progressValue: utilizationRate,
      variant: utilizationRate >= 90 ? 'danger' : utilizationRate >= 70 ? 'warning' : 'success',
    },
    {
      icon: <Icons.CheckCircleOutlined className="text-base" />,
      title: `Available ${isCustomer ? 'Credit' : 'Limit'}`,
      displayValue: overview ? formatAmountShort(overview.totalRemaining) : '—',
      variant: 'success',
    },
    {
      icon: <Icons.WarningOutlined className="text-base" />,
      title: 'Over-Limit Accounts',
      displayValue: overview ? String(overview.overLimitCount) : '—',
      subValue: withCreditLimitCount ? `of ${withCreditLimitCount}` : null,
      variant: (overview?.overLimitCount || 0) > 0 ? 'danger' : 'default',
    },
    {
      icon: <Icons.InfoCircleOutlined className="text-base" />,
      title: 'No Credit Limit Set',
      displayValue: overview ? String(overview.noCreditLimitCount ?? 0) : '—',
      subValue: overview?.totalCount ? `of ${overview.totalCount}` : null,
      variant: (overview?.noCreditLimitCount || 0) > 0 ? 'warning' : 'default',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-l border-gray-200">
        {kpiCards.map((card, i) => (
          <KpiCard key={i} loading={overviewLoading} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 items-start">
        {!isAlertsViewAll && (
          <div className={`${isUtilViewAll ? 'lg:col-span-3 xl:col-span-4' : 'lg:col-span-2 xl:col-span-3'} bg-white border-x border-b border-gray-200 p-4 sm:p-5 transition-all duration-300 h-fit`}>
            <div className="flex items-center gap-2 mb-1">
              {isUtilViewAll && <Button onClick={toggleUtilViewAll} icon={<Icons.ArrowLeftOutlined />} className="flex items-center justify-center hover:bg-gray-100 bg-gray-50" type="text" />}
              <div className="flex flex-1 justify-between items-center">
                <h2 className="text-sm font-bold text-gray-900">
                  Credit Utilization
                  <span className="ml-1.5 text-xs font-semibold text-gray-400 tabular-nums">({totalResults})</span>
                </h2>
                {!isUtilViewAll && (
                  <Button size="small" onClick={toggleUtilViewAll}>
                    View All
                  </Button>
                )}
              </div>
            </div>
            <div className={`overflow-x-auto ${isUtilViewAll ? 'pb-16' : ''}`}>
              <CustomTable
                columns={utilColumns}
                data={utilizationData}
                loading={utilLoading}
                rowKey="customerNumber"
                pagination={utilPagination}
                dynamicScrollY={false}
                tableId="creditUtilization"
                scroll={{ x: true }}
                onChange={handleUtilTableChange}
                onRowClick={record => openCustomerDrawer(record.customerId, record.customer)}
              />
            </div>
          </div>
        )}

        {!isUtilViewAll && (
          <div
            className={`${isAlertsViewAll ? 'lg:col-span-3 xl:col-span-4' : 'lg:col-span-1'} bg-white border-x border-b border-gray-200 lg:border-l-0 flex flex-col ${isAlertsViewAll ? 'h-fit' : 'h-[650px]'} transition-all duration-300`}
          >
            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {isAlertsViewAll && <Button onClick={toggleAlertsViewAll} icon={<Icons.ArrowLeftOutlined />} className="flex items-center justify-center hover:bg-gray-100 bg-gray-50" type="text" />}
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                    <Icons.WarningOutlined className="text-sm" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    Over-Limit Alerts
                    <span className="ml-1 text-xs font-semibold text-gray-400 tabular-nums">({totalAlerts})</span>
                  </span>
                </div>
              </div>
              {!isAlertsViewAll && (
                <Button size="small" onClick={toggleAlertsViewAll}>
                  View All
                </Button>
              )}
            </div>

            <div className={`flex-1 ${!isAlertsViewAll ? 'overflow-y-auto' : 'bg-white p-4 sm:p-5'}`}>
              {isAlertsViewAll ? (
                <div className="overflow-x-auto pb-16">
                  <CustomTable
                    columns={alertsColumns}
                    data={alertsDataList}
                    loading={alertsLoading}
                    rowKey="customerNumber"
                    pagination={alertsPagination}
                    dynamicScrollY={false}
                    tableId="overLimitAlerts"
                    scroll={{ x: true }}
                    onChange={handleAlertsTableChange}
                    onRowClick={record => openCustomerDrawer(record.customerId, record.customerName)}
                  />
                </div>
              ) : (
                <div className="p-2.5 space-y-2">
                  {alertsLoading ? (
                    [1, 2, 3].map(key => (
                      <div key={key} className="bg-white border border-gray-100 rounded-lg p-3">
                        <Skeleton active avatar={{ shape: 'circle', size: 'small' }} title={{ width: '55%' }} paragraph={{ rows: 2, width: ['100%', '65%'] }} />
                      </div>
                    ))
                  ) : alertsDataList.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      <Icons.CheckCircleOutlined className="text-2xl mb-2 text-green-400" />
                      <p>No over-limit alerts</p>
                    </div>
                  ) : (
                    alertsDataList.map((alert, idx) => {
                      const hasOverdue = (alert.overdueCount || 0) > 0;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left bg-white border border-gray-100 rounded-lg relative overflow-hidden hover:border-red-200 hover:shadow-sm transition-all duration-150"
                          onClick={() => openCustomerDrawer(alert.customerId, alert.customerName)}
                        >
                          <div className="absolute top-0 left-0 w-[3px] h-full bg-red-500 rounded-l-lg" />
                          <div className="pl-3 pr-3 pt-2.5 pb-2">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 uppercase border border-red-100">
                                {alert.customerName?.substring(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-xs leading-tight truncate" title={alert.customerName}>
                                  {alert.customerName}
                                </p>
                                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{alert.customerNumber}</p>
                              </div>
                              {hasOverdue && (
                                <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-600 leading-none">
                                  {alert.overdueCount} OVERDUE
                                </span>
                              )}
                            </div>
                            <div className={`grid ${hasOverdue ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-2.5 p-2 bg-red-50/60 rounded border border-red-50`}>
                              <div>
                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Exceeded</p>
                                <p className="text-xs font-bold text-red-600 tabular-nums leading-tight">{formatAmountShort(alert.crossedAmount)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Days Over</p>
                                <p className="text-xs font-bold text-orange-600 tabular-nums leading-tight">{alert.crossedSinceDays != null ? `${alert.crossedSinceDays}d` : '—'}</p>
                              </div>
                              {hasOverdue && (
                                <div>
                                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Overdue</p>
                                  <p className="text-xs font-bold text-orange-500 tabular-nums leading-tight">{formatAmountShort(alert.overdueAmount)}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Utilization</span>
                                <span className="text-[10px] font-bold text-red-600 tabular-nums">{toDecimalString(alert.utilizationPercentage)}%</span>
                              </div>
                              <Progress percent={Math.min(alert.utilizationPercentage || 0, 100)} showInfo={false} size="small" strokeColor="#ef4444" trailColor="#fee2e2" className="m-0" />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={selectedCustomer} isVendor={isVendor} />}
    </div>
  );
};

export default CreditLimitDashboard;
