import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Tabs } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { DocumentMetadata } from '@/components/ui';
import BatchDetailContent from '@/components/dataDisplay/BatchDetailContent';
import BatchDetailSkeleton from '../components/BatchDetailSkeleton';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';

import { useBatches } from '@/features/inventory/batches';
import { MODULE_NAMES } from '@/utils/constants';

const BatchDetail = () => {
  const { batchId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [bootstrapping, setBootstrapping] = useState(true);
  const { batchById: batch, batchLoading, getItemBatchById, resetBatchById } = useBatches();

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;

    const load = async () => {
      setBootstrapping(true);
      if (!batchId) {
        setBootstrapping(false);
        return;
      }
      try {
        await getItemBatchById({ batchId, signal: controller.signal });
      } finally {
        if (!controller.signal.aborted && !settled) {
          settled = true;
          setBootstrapping(false);
        }
      }
    };

    load();
    return () => {
      settled = true;
      controller.abort();
    };
  }, [batchId, getItemBatchById]);

  useEffect(() => {
    setActiveKey('1');
  }, [batchId]);

  useResetOnUnmount(resetBatchById);

  const handleRefresh = async () => {
    await getItemBatchById({ batchId });
  };

  const itemName = batch?.itemId?.itemName || batch?.itemName;
  const itemNo = batch?.itemId?.itemNo || batch?.itemNo;

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <BatchDetailContent batch={batch} variant="page" />,
    },
  ];

  if ((bootstrapping || batchLoading) && !batch) {
    return <BatchDetailSkeleton />;
  }

  if (!batch) {
    return <NoFoundPage docType={MODULE_NAMES.ITEM_BATCH} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col min-w-0">
              <h1 className="text-[18px] font-semibold text-gray-900">Batch Details</h1>
              <div className="flex items-center gap-2 mt-1 min-w-0">
                {batch?.batchNo != null && renderBatchNumber(batch.batchNo, batchId, 'Batch ')}
                {itemName && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm font-medium text-gray-600 truncate">{itemName}</span>
                  </>
                )}
                {itemNo && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{itemNo}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>

      <div className="w-full pt-3">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="min-w-0 flex-1">
            <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
          </div>
          <div className="xl:mt-[62px] h-fit xl:w-[250px] shrink-0 space-y-3">
            <DocumentMetadata
              data={{
                addedBy: batch?.addedBy,
                createdAt: batch?.createdAt,
                updatedBy: batch?.updatedBy,
                updatedAt: batch?.updatedAt,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default BatchDetail;
