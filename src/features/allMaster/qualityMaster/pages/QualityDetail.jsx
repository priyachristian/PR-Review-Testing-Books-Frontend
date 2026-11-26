import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { Tabs, Popconfirm } from '@/components/AntDComponent';
import { QualityDetailPageSkeleton } from '@/features/allMaster/qualityMaster/components/QualityDetailSkeleton';
import { ActionButtons, DetailField } from '@/components/ui';
import Icons from 'assets/icons/icon';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useQuality } from '@/features/allMaster/qualityMaster';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';

const getTestResponse = test => {
  if (test.responseType === 'custom') {
    return (
      Object.entries(test.customInputFields || {})
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)} - ${value}`)
        .join(' | ') || undefined
    );
  }
  if (test.responseType === 'single') return test.selectedResponse;
  if (test.responseType === 'possibleResponses') return (test.possibleResponses || []).map(r => r.label).join(', ') || undefined;
  return undefined;
};

const QualityDetail = () => {
  const { qltId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const { loading, singleQuality, getQualityById, resetQuality, deleteQuality, deleteLoading } = useQuality();
  const { isViewOnly, useModuleQuality } = useModulePermissions(RESOURCES.QUALITY_MASTER);

  useEffect(() => {
    const controller = new AbortController();
    if (qltId) {
      getQualityById({ qualityId: qltId, signal: controller.signal });
    } else {
      resetQuality();
    }
    return () => {
      resetQuality();
      controller.abort();
    };
  }, [qltId]);

  const handleRefresh = async () => {
    await getQualityById({ qualityId: qltId });
  };

  const handleEditClick = () => {
    navigate(`/quality-master/${qltId}/edit`);
  };

  const handleDeleteClick = async () => {
    try {
      await deleteQuality({ qualityId: qltId });
      navigate('/quality-master');
    } catch (error) {
      console.error('Failed to delete quality:', error);
    }
  };

  const TestsSection = () => {
    const tests = singleQuality?.tests || [];

    if (!tests.length) {
      return <p className="text-[13px] font-medium text-[#64748b]">No tests defined for this quality report.</p>;
    }

    return (
      <div className="space-y-4">
        {tests.map((test, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
            <p className="font-bold text-base mb-3">{`Test - ${index + 1}`}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Title On QC Report" value={test.testName} />
              <DetailField label="Response" value={getTestResponse(test)} />
              <DetailField label="Remarks" value={test.remark} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const BasicInfo = () => {
    return (
      <div className="space-y-10">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Report ID" value={singleQuality?.qcReportID} />
              <DetailField label="Report Name" value={singleQuality?.qcReportName} truncate={false} valueClassName="break-words" />
              <DetailField label="Product Name" value={singleQuality?.productName} truncate={false} valueClassName="break-words" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Report Type" value={singleQuality?.qcType} />
              <DetailField label="Report Responsible" value={singleQuality?.qcReportResponsible} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Tests</p>
          <div className="mt-2">
            <TestsSection />
          </div>
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
    return <QualityDetailPageSkeleton />;
  }

  if (!singleQuality && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.QUALITY_MASTER} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Quality Details</h1>
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
            <PermissionButton canAccess={!!useModuleQuality?.edit} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" icon={<Icons.EditOutlined />} block onClick={handleEditClick}>
              Edit
            </PermissionButton>
            <Popconfirm
              title="Delete Quality"
              description="Are you sure you want to delete this quality?"
              okText="Yes"
              cancelText="No"
              onConfirm={handleDeleteClick}
              disabled={!useModuleQuality?.delete || isViewOnly}
            >
              <PermissionButton
                canAccess={!!useModuleQuality?.delete}
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

export default QualityDetail;
