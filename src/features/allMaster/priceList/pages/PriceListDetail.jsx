import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Components
import { Tag, Tabs, Popconfirm } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { ActionButtons, DetailField } from '@/components/ui';
import PriceListDetailSkeleton from '../components/PriceListDetailSkeleton';
import Icons from 'assets/icons/icon';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { usePriceList, priceListConversionColumns, priceListDetailItemsColumn } from '@/features/allMaster/priceList';
import { conversionUnitPrices } from '@/features/allMaster/priceList/priceList.utils';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const PriceListDetail = () => {
  const { priceListId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { loading, deleteLoading, getPriceListById, priceList, deletePriceData } = usePriceList();
  const { isViewOnly, useModulePriceList } = useModulePermissions(RESOURCES.PRICE_LIST);

  useEffect(() => {
    const controller = new AbortController();
    getPriceListById({ priceListId, signal: controller.signal });
    return () => controller.abort();
  }, [priceListId]);

  useEffect(() => {
    setActiveKey('1');
  }, [priceListId]);

  useEffect(() => {
    const keys = (priceList?.items || []).filter(item => conversionUnitPrices(item).length > 0).map(item => item._id);
    setExpandedRowKeys(keys);
  }, [priceList]);

  const handleRefresh = async () => {
    await getPriceListById({ priceListId });
  };

  const handleEditClick = () => {
    navigate(`/price-list/${priceListId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = async () => {
    try {
      await deletePriceData({ priceListId });
      navigate('/price-list');
    } catch (error) {
      console.error('Failed to delete price list:', error);
    }
  };

  const BasicInfo = () => {
    const currencyDisplay = priceList?.currency?.code ? `${priceList.currency.symbol || ''} ${priceList.currency.code} - ${priceList.currency.name || ''}`.trim() : undefined;

    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Basic Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Price List" value={priceList?.priceListName} truncate={false} valueClassName="break-words" />
              <DetailField label="Total Items" value={priceList?.items?.length ?? 0} />
              <DetailField label="Price List Code">{priceList?.priceListCode ? <Tag className="font-semibold">{priceList.priceListCode}</Tag> : '-'}</DetailField>
              <DetailField label="Currency" value={currencyDisplay} />
              <DetailField label="Remarks" value={priceList?.remarks} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg pb-2">Associated Items ({priceList?.items?.length || 0})</p>
          <p className="text-[13px] font-medium text-[#64748b] mb-3">List of items linked to this price list</p>

          <CustomTable
            columns={priceListDetailItemsColumn(navigate, priceList?.currency)}
            data={priceList?.items || []}
            pagination={false}
            tableId="_id"
            scroll={{ x: 'max-content' }}
            dynamicScrollY={false}
            expandable={{
              expandedRowKeys,
              onExpand: (expanded, record) => {
                setExpandedRowKeys(keys => (expanded ? [...keys, record._id] : keys.filter(key => key !== record._id)));
              },
              rowExpandable: record => conversionUnitPrices(record).length > 0,
              expandedRowRender: record => (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="mb-2 text-[13px] font-medium text-gray-600">Conversion Units</div>
                  <CustomTable
                    columns={priceListConversionColumns(priceList?.currency)}
                    data={conversionUnitPrices(record)}
                    pagination={false}
                    tableId="_id"
                    scroll={{ x: 'max-content' }}
                    dynamicScrollY={false}
                    showHeader
                  />
                </div>
              ),
            }}
          />
        </div>
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <BasicInfo />,
    },
  ];

  if (loading) {
    return <PriceListDetailSkeleton />;
  }

  if (!priceList) {
    return <NoFoundPage docType={MODULE_NAMES?.PRICE_LIST} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Price List Details</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            <PermissionButton
              canAccess={!!useModulePriceList?.edit}
              isViewOnly={isViewOnly}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              block
              onClick={handleEditClick}
            >
              Edit
            </PermissionButton>
            <Popconfirm
              title="Delete Price List"
              description="Are you sure you want to delete this price list?"
              okText="Yes"
              cancelText="No"
              onConfirm={handleDeleteClick}
              disabled={!useModulePriceList?.delete || isViewOnly}
            >
              <PermissionButton
                canAccess={!!useModulePriceList?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteLoading}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                block
              >
                Delete
              </PermissionButton>
            </Popconfirm>
          </ActionButtons>
        </div>
      </div>
    </>
  );
};

export default PriceListDetail;
