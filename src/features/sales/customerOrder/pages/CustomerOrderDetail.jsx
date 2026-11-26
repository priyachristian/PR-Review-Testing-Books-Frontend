// React
import { useEffect, useState } from 'react';

// Third Party
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Components
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import ConvertToSalesOrderModal from '@/components/feedback/formModal/ConvertToSalesOrderModal';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { ActionButtons, DocumentMetadata } from '@/components/ui';
import HistoryCommon from '@/components/dataDisplay/statCard/HistoryCommon';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import RejectionReasonModal from '../components/RejectionReasonModal';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';

// Hooks
import { useCustomerOrders } from '@/features/sales/customerOrder';
import { useProfile } from '@/features/setting/profile/useProfile';
import useModulePermissions from 'hooks/useModulePermissions';
import { resolveConversionCustomer } from 'hooks/useConvert';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { RESOURCES } from '@/utils/jsonFile';
import { generateSafeFileName } from '@/utils/pdfname';
import {
  BACKEND_ENUM,
  MODULE_NAMES,
  pageTypes,
  CUSTOMER_ORDER_STATUS,
  CUSTOMER_ORDER_STATUS_ACTIONS,
  CUSTOMER_ORDER_TYPE,
  CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getCustomerOrderType } from '../customerOrder.columns';

dayjs.extend(utc);

const CUSTOMER_ORDER_STATUS_CHANGE_RESTRICTED = [BACKEND_ENUM?.COMPLETED, BACKEND_ENUM?.REJECTED];

const CustomerOrderDetail = () => {
  const { customerOrderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);

  const { customerOrder, loading, submitLoading, resetCustomerOrder, getCustomerOrderById, updateStatus } = useCustomerOrders();
  const orderData = customerOrder;
  const { useModuleCustomerOrder, useModuleSalesOrder, isViewOnly } = useModulePermissions(RESOURCES.CUSTOMER_ORDER);
  const { profile, getProfile } = useProfile();

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (customerOrderId) {
      getCustomerOrderById({ customerOrderId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetCustomerOrder();
    };
  }, [customerOrderId, getCustomerOrderById, resetCustomerOrder]);

  const handleRefresh = async () => {
    await getCustomerOrderById({ customerOrderId });
  };

  const handleConvertToSalesOrder = async values => {
    const response = await getCustomerOrderById({
      customerOrderId: orderData?._id || customerOrderId,
      branchId: values.branchId,
    });
    const fullOrder = response?.payload?.data || orderData;

    const payload = {
      customerId: resolveConversionCustomer(fullOrder),
      items: (fullOrder?.items || []).map(item => ({
        ...item,
        sampleMinQty: undefined,
        sampleMaxQty: undefined,
        itemId: item?.itemId,
        itemName: item?.itemName || '',
        itemNo: item?.itemNo || '',
        hsnCode: item?.hsnCode || '',
        itemUnit: item?.itemUnitId?.name || item?.itemUnit || '',
        gst: item?.gst || '0',
      })),
      subTotal: fullOrder?.subTotal,
      cgst: fullOrder?.cgst,
      sgst: fullOrder?.sgst,
      igst: fullOrder?.igst,
      totalTax: fullOrder?.totalTax,
      total: fullOrder?.total,
      additionalCharges: fullOrder?.additionalCharges,
      addressId: fullOrder?.addressId || null,
      isRoundOff: fullOrder?.isRoundOff || false,
      roundOffAmount: fullOrder?.roundOffAmount || 0,
      reference: fullOrder?.reference,
      customerNotes: fullOrder?.customerNotes,
      divisionId: values.divisionId,
      divisionName: values.divisionName,
      branchId: values.branchId,
      branchName: values.branchName,
      warehouseId: values.warehouseId,
      warehouseName: values.warehouseName,
      customerOrderId: fullOrder?._id,
      customerOrderNo: fullOrder?.customerOrderId,
      sampleCatalogId: fullOrder?.sampleCatalogId || null,
      paymentTermsId: fullOrder?.paymentTermsId,
    };

    navigate('/sales-orders/new', {
      state: {
        salesOrderData: payload,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async (id, status, rejectionReason) => {
    await updateStatus({ customerOrderId: id, status, rejectionReason });
    getCustomerOrderById({ customerOrderId: id });
  };

  const handleRejectOrder = async rejectionReason => {
    await handleUpdateStatus(orderData?.id || orderData?._id, BACKEND_ENUM?.REJECTED, rejectionReason);
    setRejectionModal(false);
  };

  // Draft orders are still with the customer, so they have no actions.
  const getStatusActions = (status, order) =>
    (CUSTOMER_ORDER_STATUS_ACTIONS[getCustomerOrderType(order)]?.[status] || []).map(next => ({
      key: `markAs${next}`,
      label: `Mark As ${CUSTOMER_ORDER_STATUS?.[next]}`,
      onClick: () => (next === BACKEND_ENUM?.REJECTED ? setRejectionModal(true) : handleUpdateStatus(order?.id || order?._id, next)),
    }));

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF data={orderData} billingAddress={orderData?.customerId?.address?.billing} shippingAddress={orderData?.shippingAddress} profile={profile} pageType={pageTypes.CUSTOMER_ORDER} />
    );
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  if (loading) return <DetailPageSkeleton />;
  if (!customerOrder) return <NoFoundPage docType={MODULE_NAMES?.CUSTOMER_ORDER} />;

  const dropDownItems = getStatusActions(orderData?.status, orderData);
  const isSampleOrder = getCustomerOrderType(orderData) === 'SAMPLE';
  const statusAllowsMark = !CUSTOMER_ORDER_STATUS_CHANGE_RESTRICTED.includes(orderData?.status) && dropDownItems?.length > 0;
  const canOpenMark = useModuleCustomerOrder?.edit && !isViewOnly && statusAllowsMark;
  const customerData = {
    id: orderData?.customerId?._id,
    customerDisplayName: orderData?.customerId?.customerDisplayName,
  };

  const tabItems = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={orderData} profile={profile} pageType={pageTypes?.CUSTOMER_ORDER} />,
    },
    {
      key: '2',
      label: 'History',
      children: <HistoryCommon data={orderData?.commentHistory} />,
    },
  ];

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} text="Updating customer order status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Customer Order Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{orderData?.customerOrderId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={orderData?.status} value={CUSTOMER_ORDER_STATUS?.[orderData?.status]} />
                {isSampleOrder && (
                  <>
                    <span className="text-gray-400">•</span>
                    <Tag className="m-0">{CUSTOMER_ORDER_TYPE.SAMPLE}</Tag>
                    <span className="text-sm text-gray-600">{[orderData?.catalogCode, orderData?.catalogName].filter(Boolean).join(' - ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {orderData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink
              document={
                <ShowPDF data={orderData} billingAddress={orderData?.customerId?.address?.billing} shippingAddress={orderData?.shippingAddress} profile={profile} pageType={pageTypes.CUSTOMER_ORDER} />
              }
              fileName={generateSafeFileName(orderData, 'customerOrderId')}
            >
              {({ loading: pdfLoading }) => (
                <Button type="default" size="middle" icon={<Icons.DownloadOutlined className="mr-2" />} disabled={pdfLoading} className="flex items-center">
                  Download
                </Button>
              )}
            </PDFDownloadLink>
            <Button type="default" size="middle" icon={<Icons.PrinterOutlined className="mr-2" />} onClick={handlePrint} className="flex items-center">
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']} disabled={!canOpenMark} open={canOpenMark ? undefined : false}>
              <Tooltip
                title={
                  isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCustomerOrder?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : !statusAllowsMark
                        ? `Cannot change status in current status - ${CUSTOMER_ORDER_STATUS?.[orderData?.status] || orderData?.status || '-'}.`
                        : 'Mark Order As'
                }
                placement="left"
              >
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled={!canOpenMark || submitLoading} block>
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Order As'}
                  </Button>
                </span>
              </Tooltip>
            </Dropdown>
            {useModuleSalesOrder?.create !== undefined && (
              <PermissionButton
                canAccess={useModuleSalesOrder?.create}
                isViewOnly={isViewOnly}
                disabled={!CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(orderData?.status) || submitLoading}
                tooltipTitle={
                  isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleSalesOrder?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : !CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(orderData?.status)
                        ? `Cannot convert to Sales Order its current status - ${CUSTOMER_ORDER_STATUS?.[orderData?.status] || orderData?.status || '-'}.`
                        : 'Convert to Sales Order'
                }
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                className="w-full flex items-center gap-2"
                icon={<Icons.SwapOutlined />}
                block
                onClick={
                  useModuleSalesOrder?.create && CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(orderData?.status) && !isViewOnly && !submitLoading ? () => setConvertModal(true) : undefined
                }
              >
                Convert to Sales Order
              </PermissionButton>
            )}
          </ActionButtons>
          <DocumentMetadata data={orderData} showCreatedFrom={true} />
        </div>
      </div>

      <RejectionReasonModal
        open={rejectionModal}
        idValue={orderData?.customerOrderId}
        status={BACKEND_ENUM?.REJECTED}
        statusLabelMap={CUSTOMER_ORDER_STATUS}
        idLabel="Order No"
        onCancel={() => setRejectionModal(false)}
        onSubmit={handleRejectOrder}
        reasons={[]}
        loading={submitLoading}
      />

      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}

      <ConvertToSalesOrderModal
        open={convertModal}
        onClose={() => setConvertModal(false)}
        onSubmit={handleConvertToSalesOrder}
        orderNo={orderData?.customerOrderId}
        customerName={orderData?.customerId?.customerDisplayName}
      />
    </>
  );
};

export default CustomerOrderDetail;
