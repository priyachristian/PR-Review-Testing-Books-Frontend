import { useEffect, useState } from 'react';

import { Spin, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from '@/assets/icons/icon';
import { useOnboarding } from '../useOnboarding';
import DataSetupPreviewModal from './DataSetupPreviewModal';

const DataSetupPanel = () => {
  const { dataSetup, dataSetupLoading, dataSetupRunningKey, getDataSetupStatus } = useOnboarding();

  // The step pending confirmation — opens the preview-and-confirm modal.
  const [confirmStep, setConfirmStep] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getDataSetupStatus({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = (dataSetup?.rows || []).filter(r => r.remaining > 0);

  if (dataSetupLoading && !dataSetup) {
    return (
      <div className="border-t border-gray-100 p-6 flex justify-center">
        <Spin />
      </div>
    );
  }

  if (!rows.length) return null;

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Icons.WarningOutlined style={{ color: '#d97706' }} />
          <h3 className="text-base font-bold text-gray-900">Data Setup Required</h3>
          <Tag color="orange" className="ml-1">
            Action needed
          </Tag>
        </div>
        <p className="text-sm text-gray-500">
          We've found a few records that need a one-time setup after moving from CRM to Books. Review and complete the steps below to ensure everything works smoothly.
        </p>
      </div>

      <div className="divide-y divide-gray-100 border-t border-gray-100">
        {rows.map(row => {
          const running = dataSetupRunningKey === row.key;

          return (
            <div key={row.key} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{row.label}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{row.remaining} pending</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{row.description}</p>
                </div>

                <CustomButton type="primary" size="small" loading={running} icon={<Icons.RightOutlined />} iconPosition="end" className="shrink-0" onClick={() => setConfirmStep(row)}>
                  Complete Setup
                </CustomButton>
              </div>
            </div>
          );
        })}
      </div>

      <DataSetupPreviewModal open={!!confirmStep} step={confirmStep} onClose={() => setConfirmStep(null)} onDone={() => setConfirmStep(null)} />
    </div>
  );
};

export default DataSetupPanel;
