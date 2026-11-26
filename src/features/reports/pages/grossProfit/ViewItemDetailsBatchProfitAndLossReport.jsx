import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PageHeader from '@/components/ui/common/PageHeader';

// Extras
import { useReport, ItemDetailsBatchProfitAndLossColumns } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

const PRIMARY = colorPalette.primary[500];

const Breadcrumb = ({ items, onNavigate }) => (
  <div className="py-1">
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
          {idx < items.length - 1 ? (
            <button className="font-medium hover:underline transition-colors" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
              {item}
            </button>
          ) : (
            <span className="font-semibold text-gray-800">{item}</span>
          )}
        </span>
      ))}
    </div>
  </div>
);

const ViewItemDetailsBatchProfitAndLossReport = () => {
  const navigate = useNavigate();
  const { itemId, documentId } = useParams();
  const { profitAndLossBatchItemDetails, loading, getProfitAndLossBatchItemDetails, pagination } = useReport();

  useEffect(() => {
    const controller = new AbortController();
    getProfitAndLossBatchItemDetails({ itemId, documentId, signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [itemId, documentId]);

  const handleNavigate = () => {
    if (profitAndLossBatchItemDetails?.documentType === 'INVOICE') {
      navigate(`/invoices/${profitAndLossBatchItemDetails?.documentId}`);
    } else {
      navigate(`/delivery-challans/${profitAndLossBatchItemDetails?.documentId}`);
    }
  };

  const itemLabel = profitAndLossBatchItemDetails?.item?.itemName
    ? `${profitAndLossBatchItemDetails?.item?.itemName}${profitAndLossBatchItemDetails?.item?.itemNo ? ` (${profitAndLossBatchItemDetails?.item?.itemNo})` : ''}`
    : 'Item';

  const breadcrumbItems = ['Reports', 'Gross Profit', itemLabel, profitAndLossBatchItemDetails?.documentNo || 'Document'];
  const handleBreadcrumbNavigate = idx => {
    if (idx === 0) navigate('/reports');
    if (idx === 1) navigate('/reports/gross-profit');
    if (idx === 2) navigate(`/reports/gross-profit/item/${profitAndLossBatchItemDetails?.item?.itemId}`);
  };

  return (
    <div className="-m-4">
      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <CustomLoader />
        </div>
      ) : (
        <div>
          <div className="sticky-page-header bg-white border-b">
            <div className="bg-white px-4 py-2 border-b">
              <Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
            </div>

            <div className="container-spacing py-3 md:py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                  <div className="flex-1 min-w-0">
                    <PageHeader
                      loading={loading}
                      title={`${profitAndLossBatchItemDetails?.documentNo} | ${profitAndLossBatchItemDetails?.item?.itemName} (${profitAndLossBatchItemDetails?.item?.itemNo})`}
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
                    View ({profitAndLossBatchItemDetails?.documentNo})
                  </Tag>
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <CustomTable columns={ItemDetailsBatchProfitAndLossColumns} data={profitAndLossBatchItemDetails?.item?.batches} loading={loading} pagination={false} rowKey="id" size="small" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewItemDetailsBatchProfitAndLossReport;
