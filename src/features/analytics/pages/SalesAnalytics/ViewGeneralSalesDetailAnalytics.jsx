import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Button, Card } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Hooks

// Extras
import { useAnalytics } from '@/features/analytics';
import Icons from 'assets/icons/icon';
import { GENERAL_SALES_ANALYTICS_MODULE_LABELS } from 'utils/constants';
import { dateFormateForBackend } from 'utils/services';
import { formatAmount } from '@/utils/currency';

const getDefaultDateRange = () => {
  const today = dayjs().toDate();
  const lastMonth = dayjs().subtract(1, 'month').toDate();
  return [lastMonth, today];
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const ViewGeneralSalesDetailAnalytics = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(getDefaultDateRange);

  const { generalSalesAnalyticsById, generalSalesAnalyticsByIdLoading, generalSalesAnalyticsByIdError, pagination, getGeneralSalesAnalyticsById, resetGeneralSalesAnalyticsById } = useAnalytics();

  const handleDateRangeChange = dates => {
    if (!dates) {
      setDateRange(null);
      return;
    }
    if (Array.isArray(dates)) {
      setDateRange(dates.map(d => (d ? (d.toDate ? d.toDate() : d) : null)));
    } else {
      setDateRange(dates);
    }
  };

  const handlePresetChange = preset => {
    setSelectedPreset(preset);
  };

  useEffect(() => {
    if (!id) return;
    const startDate = appliedDateRange?.[0] ? dateFormateForBackend(appliedDateRange[0]) : null;
    const endDate = appliedDateRange?.[1] ? dateFormateForBackend(appliedDateRange[1]) : null;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : DEFAULT_PAGE;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : DEFAULT_LIMIT;
    const payload = {
      id,
      ...(startDate && endDate && startDate !== '-' && endDate !== '-' ? { startDate, endDate } : {}),
      page,
      limit,
    };
    getGeneralSalesAnalyticsById(payload);
    return () => {
      resetGeneralSalesAnalyticsById();
    };
  }, [id, getGeneralSalesAnalyticsById, resetGeneralSalesAnalyticsById, appliedDateRange, searchParams]);

  const handleClear = () => {
    setSelectedPreset('custom');
    setDateRange(null);
    setAppliedDateRange(null);
  };

  const handleFilter = () => {
    setAppliedDateRange(dateRange);
    setShowFilter(false);
  };

  const updateUrlParams = newParams => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value == null || value === '') params.delete(key);
        else params.set(key, String(value));
      });
      return params;
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const report = generalSalesAnalyticsById;
  const basisLabel = report?.reportBasis === 'ITEM_GROUP' ? 'Item Group' : 'Item';
  const columns = (report?.columns || []).map(col => ({
    title: col.title,
    dataIndex: col.key,
    key: col.key,
    render: val => (typeof val === 'number' ? val : (val ?? '—')),
  }));
  const tableData = (report?.data || []).map((row, idx) => ({
    ...row,
    key: row.basisName ?? idx,
    quoteAmount: formatAmount(row.quoteAmount),
    salesOrderAmount: formatAmount(row.salesOrderAmount),
    deliveryChallanAmount: formatAmount(row.deliveryChallanAmount),
  }));

  if (generalSalesAnalyticsByIdLoading) {
    return (
      <div className="flex flex-col -m-4">
        <div className="bg-white sticky-page-header px-4 py-3 border-b">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics/sales-orders/general-sales')} />
        </div>
        <div className="p-4">
          <CustomLoader />
        </div>
      </div>
    );
  }

  if (generalSalesAnalyticsByIdError || !report) {
    return (
      <div className="flex flex-col -m-4">
        <div className="bg-white sticky-page-header px-4 py-3 border-b flex items-center gap-2">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics/sales-orders/general-sales')} />
          <span className="text-gray-600">Analytics not found</span>
        </div>
        <div className="p-4">
          <Card>
            <p className="text-gray-600">This analytics may have been deleted or you do not have access.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col -m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics/sales-orders/general-sales')} />
          <p className="font-bold text-[1.125rem]">{report.reportName || 'Analytics'}</p>
        </div>
        <Button
          onClick={() => {
            setShowFilter(!showFilter);
          }}
        >
          {showFilter ? 'Hide Filters' : 'View Filters'}
        </Button>
      </div>

      {showFilter && (
        <div className="bg-white px-4 border-b space-y-3 filters-open">
          <div className="container-spacing bg-white">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="space-y-2">
                <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={handlePresetChange} dateRange={dateRange} setDateRange={handleDateRangeChange} />
              </div>
              <div className="flex-grow" />
              <div className="flex gap-3">
                <Button onClick={handleClear} className="p-[17px]">
                  Reset All
                </Button>
                <Button
                  type="primary"
                  icon={<Icons.FilterOutlined />}
                  size="middle"
                  className="p-[17px]"
                  onClick={handleFilter}
                  loading={generalSalesAnalyticsByIdLoading}
                  disabled={generalSalesAnalyticsByIdLoading}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-container container-spacing">
          <div>
            <span className="text-gray-500 text-sm">Basis</span>
            <p className="font-medium text-base">{basisLabel}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Created By</span>
            <p className="font-medium text-base">{report.createdBy || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Created</span>
            <p className="font-medium text-base">{report.createdAt ? dayjs(report.createdAt).format('DD MMM YYYY') : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-sm">Documents</span>
            <div className="font-medium text-base space-y-1">
              {(report.documents || []).length === 0 ? (
                <span>—</span>
              ) : (
                (report.documents || []).map(d => {
                  const label = GENERAL_SALES_ANALYTICS_MODULE_LABELS[d.module] || d.module;
                  return (
                    <div key={label} className="flex flex-wrap items-center gap-2">
                      <span>{label}</span>
                      {d.statuses?.map(status => (
                        <StatusBadge key={status} status={status} value={status} />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {columns.length === 0 || tableData.length === 0 ? (
          <p className="text-gray-500">No data available</p>
        ) : (
          <CustomTable
            columns={columns}
            data={tableData}
            paginationClassName="!left-0"
            pagination={{
              current: pagination?.page ?? DEFAULT_PAGE,
              pageSize: pagination?.limit ?? DEFAULT_LIMIT,
              total: pagination?.totalRecords ?? 0,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              onChange: handlePaginationChange,
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewGeneralSalesDetailAnalytics;
