import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// Components
import { Tag, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PageHeader from '@/components/ui/common/PageHeader';

// Extras
import { useReport, CustomerProfitAndLoseColumns } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { GROSS_PROFIT_TABS } from '@/utils/tabs';

const PRIMARY = colorPalette.primary[500];

const Breadcrumb = ({ items, onNavigate }) => (
  <div className="bg-white border-b border-gray-200 px-4 py-2 sm:px-6">
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
          {idx < items.length - 1 ? (
            <button className="font-medium hover:underline transition-colors" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
              {item}
            </button>
          ) : (
            <Tooltip title={item} placement="bottomLeft">
              <span className="font-semibold text-gray-800 truncate max-w-[180px] inline-block align-bottom">{item}</span>
            </Tooltip>
          )}
        </span>
      ))}
    </div>
  </div>
);

const ViewCustomerProfitAndLossReport = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { customerProfitAndLose, loading, getCustomerProfitAndLose, pagination } = useReport();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (customerId) {
      const payload = {
        customerId,
        page: searchParams?.get('page') || 1,
        limit: searchParams?.get('limit') || pagination?.limit,
      };
      getCustomerProfitAndLose(payload);
    }
  }, [customerId, searchParams]);

  const updateUrlParams = newParams => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      return params;
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleViewCustomerDetailsClick = documentId => {
    navigate(`/reports/gross-profit/customer-details/${documentId?.documentId}`);
  };

  const handleNavigate = () => {
    if (customerProfitAndLose?.customer?.Role?.isCustomer) {
      navigate(`/customer-master/${customerProfitAndLose?.customer?.customerId}`);
    } else {
      navigate(`/vendors/${customerProfitAndLose?.customer?.customerId}`);
    }
  };

  const breadcrumbItems = ['Reports', 'Gross Profit', customerProfitAndLose?.customer?.customerDisplayName || 'Customer'];
  const handleBreadcrumbNavigate = idx => {
    if (idx === 0) navigate('/reports');
    if (idx === 1) navigate(`/reports/gross-profit?tab=${GROSS_PROFIT_TABS.CUSTOMER_WISE}`);
  };

  return (
    <div className="-m-4">
      <div>
        <div className="sticky-page-header bg-white">
          <div className="bg-white py-2 -ml-2">
            <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
          </div>

          <div className="container-spacing py-3 md:py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <CustomButton type="default" className="flex-shrink-0" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate(`/reports/gross-profit?tab=${GROSS_PROFIT_TABS.CUSTOMER_WISE}`)} />
                <div className="flex-1 min-w-0">
                  <PageHeader
                    loading={loading}
                    title={
                      <Tooltip title={customerProfitAndLose?.customer?.customerDisplayName} placement="bottomLeft">
                        <span className="truncate inline-block max-w-[250px]">{customerProfitAndLose?.customer?.customerDisplayName}</span>
                      </Tooltip>
                    }
                    rightStats={[
                      { label: 'Total Revenue', value: formatAmount(pagination?.summary?.totalRevenue || 0) },
                      { label: 'Total Profit', value: formatAmount(pagination?.summary?.totalNetProfit || 0) },
                      { label: 'Profit Margin', value: `${pagination?.summary?.profitMarginPercentage || 0}%` },
                    ]}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 self-start xl:self-center">
                <Tag className="font-semibold cursor-pointer" color="blue" onClick={handleNavigate}>
                  View Customer
                </Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <CustomTable
          columns={CustomerProfitAndLoseColumns}
          data={customerProfitAndLose?.customer?.documents}
          loading={loading}
          onRowClick={handleViewCustomerDetailsClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalRecords,
            onChange: handlePaginationChange,
          }}
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default ViewCustomerProfitAndLossReport;
