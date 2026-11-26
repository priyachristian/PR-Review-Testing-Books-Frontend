// React
import { useEffect, useMemo, useState } from 'react';

// Third Party
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import { Popconfirm, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import SampleCatalogDetailSkeleton from '../components/SampleCatalogDetailSkeleton';
import SampleCatalogPortalActivationModal from '../components/SampleCatalogPortalActivationModal';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { ActionButtons, DetailField, DocumentMetadata } from '@/components/ui';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useSampleCatalogs, sampleCatalogDetailItemsColumn } from '@/features/sales/sampleCatalog';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { RESOURCES } from '@/utils/jsonFile';
import { MODULE_NAMES, SAMPLE_CATALOG_STATUS, SAMPLE_CATALOG_VISIBILITY, confirmModalEnum } from 'utils/constants';
import { dateFormateForUi } from 'utils/services';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const SampleCatalogDetail = () => {
  const { sampleCatalogId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  // Items to turn on in the customer portal before the catalog can be activated.
  const [portalActivation, setPortalActivation] = useState(null);
  const { sampleCatalog, loading, submitLoading, getSampleCatalogById, updateSampleCatalogStatus, resetSampleCatalog } = useSampleCatalogs();
  const { useModuleSampleCatalog, isViewOnly } = useModulePermissions(RESOURCES.SAMPLE_CATALOG);

  useEffect(() => {
    const controller = new AbortController();
    if (sampleCatalogId) getSampleCatalogById({ sampleCatalogId, signal: controller.signal });
    return () => {
      controller.abort();
      resetSampleCatalog();
    };
  }, [sampleCatalogId, getSampleCatalogById, resetSampleCatalog]);

  const unitRows = useMemo(
    () =>
      (sampleCatalog?.items || []).flatMap(line =>
        line.units.map((unit, unitIndex) => ({
          rowKey: `${line.id}-${unit.itemUnitId}`,
          itemName: line.itemName,
          itemNo: line.itemNo,
          rowSpan: unitIndex === 0 ? line.units.length : 0,
          ...unit,
        }))
      ),
    [sampleCatalog]
  );

  if (loading && !sampleCatalog) return <SampleCatalogDetailSkeleton />;
  if (!sampleCatalog) return <NoFoundPage docType={MODULE_NAMES?.SAMPLE_CATALOG} />;

  const isActive = sampleCatalog.status === 'ACTIVE';
  const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
  const canEdit = !!useModuleSampleCatalog?.edit;
  const activationBlocked = !isActive && unitRows.length === 0;
  const statusActionLabel = isActive ? 'Deactivate' : 'Activate';

  const handleStatusChange = async (activateItemPortal = false) => {
    try {
      const result = await updateSampleCatalogStatus({ sampleCatalogId, status: nextStatus, activateItemPortal });
      setPortalActivation(result?.activationRequired || null);
    } catch {
      // The slice already shows the backend message.
    }
  };

  const handleEditClick = () =>
    navigate(`/${ADMIN_ROUTE_PATHS.sampleCatalogs.build.edit(sampleCatalogId)}`, {
      state: { prevFrom: location.pathname, historyStack: [...(location.state?.historyStack || []), location.pathname] },
    });

  const BasicInfo = () => (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Basic Information</p>
        <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
          <DetailField label="Catalog Name" value={sampleCatalog.name} truncate={false} valueClassName="break-words" />
          <DetailField label="Catalog Code">
            <Tag className="font-semibold">{sampleCatalog.catalogCode}</Tag>
          </DetailField>
          <DetailField label="Visibility" value={SAMPLE_CATALOG_VISIBILITY?.[sampleCatalog.visibility]} />
          <DetailField label="Start Date" value={dateFormateForUi(sampleCatalog.startDate)} />
          <DetailField label="End Date" value={dateFormateForUi(sampleCatalog.endDate)} />
          <DetailField label="Total Items" value={sampleCatalog.items.length} />
          <DetailField label="Description" value={sampleCatalog.description} className="md:col-span-2 lg:col-span-3" truncate={false} valueClassName="break-words" />
          {sampleCatalog.visibility === 'SELECTED_CUSTOMERS' && (
            <DetailField label={`Selected Customers (${sampleCatalog.customers.length})`} className="md:col-span-2 lg:col-span-3">
              <div className="flex flex-wrap gap-1 pt-1">
                {sampleCatalog.customers.map(customer => (
                  <Tooltip key={customer.id} title="View customer details">
                    <Tag className="cursor-pointer" icon={<Icons.UserOutlined />} onClick={() => setDrawerCustomer({ id: customer.id, customerDisplayName: customer.name })}>
                      {customer.name}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </DetailField>
          )}
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Catalog Items ({sampleCatalog.items.length})</p>
        <CustomTable columns={sampleCatalogDetailItemsColumn()} data={unitRows} pagination={false} tableId="rowKey" scroll={{ x: 'max-content' }} dynamicScrollY={false} />
      </div>
    </div>
  );

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} text="Updating sample catalog status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Sample Catalog Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{sampleCatalog.catalogCode}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={sampleCatalog.status} value={SAMPLE_CATALOG_STATUS?.[sampleCatalog.status]} />
              </div>
            </div>
          </div>
          <DocumentRefreshButton onRefresh={() => getSampleCatalogById({ sampleCatalogId })} />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={[{ key: '1', label: 'Overview', children: <BasicInfo /> }]} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            <PermissionButton canAccess={canEdit} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" icon={<Icons.EditOutlined />} block onClick={handleEditClick}>
              Edit
            </PermissionButton>
            <Popconfirm
              title={`${statusActionLabel} Sample Catalog`}
              description={isActive ? 'Customers will no longer be able to order from this catalog.' : 'Eligible customers will be able to order from this catalog.'}
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleStatusChange()}
              disabled={!canEdit || isViewOnly || activationBlocked}
            >
              <PermissionButton
                canAccess={canEdit}
                isViewOnly={isViewOnly}
                disabled={submitLoading || activationBlocked}
                tooltipTitle={activationBlocked ? 'Add at least one item before activating' : undefined}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger={isActive}
                icon={isActive ? <Icons.StopOutlined /> : <Icons.CheckCircleOutlined />}
                block
              >
                {statusActionLabel}
              </PermissionButton>
            </Popconfirm>
          </ActionButtons>
          <DocumentMetadata data={sampleCatalog} />
        </div>
      </div>

      <SampleCatalogPortalActivationModal
        activation={portalActivation}
        okText={confirmModalEnum.SAMPLE_CATALOG_PORTAL_ACTIVATION.OK_TEXT_STATUS}
        loading={submitLoading}
        onConfirm={() => handleStatusChange(true)}
        onCancel={() => setPortalActivation(null)}
      />
      {drawerCustomer && <CustomerDrawerDetails viewCustomerDetail={Boolean(drawerCustomer)} setViewCustomerDetail={() => setDrawerCustomer(null)} customerData={drawerCustomer} />}
    </>
  );
};

export default SampleCatalogDetail;
