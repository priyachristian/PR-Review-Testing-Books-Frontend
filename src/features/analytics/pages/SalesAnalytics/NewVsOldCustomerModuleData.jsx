import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';

// Extras
import { moduleDataDeliveryChallansColumn, moduleDataInvoicesColumn, moduleDataPaymentsColumn, moduleDataSalesOrdersColumn } from '@/features/analytics';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const MODULE_CONFIG = {
  salesOrders: {
    title: 'Sales Orders',
    getColumns: moduleDataSalesOrdersColumn,
    detailPath: id => `/sales-orders/${id}`,
  },
  deliveryChallans: {
    title: 'Delivery Challans',
    getColumns: moduleDataDeliveryChallansColumn,
    detailPath: id => `/delivery-challans/${id}`,
  },
  invoices: {
    title: 'Invoices',
    getColumns: moduleDataInvoicesColumn,
    detailPath: id => `/invoices/${id}`,
  },
  payments: {
    title: 'Payments',
    getColumns: moduleDataPaymentsColumn,
    detailPath: id => `/payment-in/${id}`,
  },
};

const getModuleNameFromPath = () => {
  const parts = window.location.pathname.split('/');
  const baseIdx = parts.indexOf('new-vs-old-customer');
  return baseIdx !== -1 ? parts[baseIdx + 1] : null;
};

const NewVsOldCustomerModuleData = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getNewVsOldCustomerReportModuleData, moduleDataLoading, newVsOldCustomerReportModuleData } = useSalesOrder();

  const customerId = sessionStorage.getItem('analyticsCustomerId') || '';
  const page = parseInt(searchParams.get('page'), 10) || DEFAULT_PAGE;
  const limit = parseInt(searchParams.get('limit'), 10) || DEFAULT_PAGE_SIZE;
  const moduleName = useMemo(getModuleNameFromPath, []);
  const moduleConfig = MODULE_CONFIG[moduleName] ?? null;

  useEffect(() => {
    if (!customerId || !moduleConfig) return;
    getNewVsOldCustomerReportModuleData({ customerId, moduleName, page, limit });
  }, [customerId, moduleName, page, limit, getNewVsOldCustomerReportModuleData, moduleConfig]);

  const extras = newVsOldCustomerReportModuleData?.extras ?? {};
  const tableData = newVsOldCustomerReportModuleData?.data ?? [];
  const columns = useMemo(() => moduleConfig?.getColumns?.() ?? [], [moduleConfig]);
  const customerData = { id: extras.customerId, customerDisplayName: extras.customerName };

  const handlePaginationChange = (nextPage, pageSize) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: nextPage, limit: pageSize });
  };

  const handleRowClick = record => {
    if (!record?._id || !moduleConfig) return;
    navigate(moduleConfig.detailPath(record._id));
  };

  return (
    <div>
      <style>{`
        .customer-detail-override > div:first-child {
          position: relative !important;
          top: 0 !important;
          right: 0 !important;
          transform: none !important;
        }
      `}</style>
      <div className="bg-white px-4 py-2 border-b border-gray-200 -m-4 relative">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PageHeader title={moduleConfig?.title ?? 'Module Data'} totalRecord={extras.totalRecord ?? 0} totalAmount={extras.totalAmount ?? 0} />
          {extras.customerName && (
            <div className="flex-shrink-0 customer-detail-override">
              <CustomerBasicDetail customerData={customerData} />
            </div>
          )}
        </div>
      </div>

      <div className="-m-4 mt-4">
        <CustomTable
          columns={columns}
          data={tableData}
          loading={moduleDataLoading}
          pagination={{
            current: page,
            pageSize: limit,
            total: extras.pagination?.totalResults ?? 0,
            onChange: handlePaginationChange,
          }}
          paginationClassName="!left-0"
          tableId="_id"
          dynamicScrollY={false}
          scroll={{ x: 'max-content' }}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

export default NewVsOldCustomerModuleData;
