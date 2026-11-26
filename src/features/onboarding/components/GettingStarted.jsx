import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Progress, Skeleton, Empty } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { useUser } from '@/features/setting/user';
import { useOnboarding } from '../useOnboarding';
import DataSetupPanel from './DataSetupPanel';

const StepIcon = ({ done }) =>
  done ? <Icons.CheckCircleOutlined style={{ color: '#16a34a' }} className="text-lg" /> : <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-gray-300" />;

const GettingStarted = () => {
  const navigate = useNavigate();
  const { status, loading, getOnboardingStatus } = useOnboarding();
  const { accessRoles } = useUser();
  const isAdminRole = accessRoles?.role?.toLowerCase() === 'admin';

  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getOnboardingStatus({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = useMemo(() => status?.steps || [], [status]);
  const progress = status?.progress ?? 0;
  const completedCount = status?.completedCount ?? 0;
  const total = status?.total ?? steps.length;
  const allDone = total > 0 && completedCount === total;

  // Default selection: first incomplete step, else first step.
  useEffect(() => {
    if (!steps.length) return;
    setSelectedKey(prev => {
      if (prev && steps.some(s => s.key === prev)) return prev;
      const firstIncomplete = steps.find(s => !s.done);
      return (firstIncomplete || steps[0]).key;
    });
  }, [steps]);

  const selectedStep = useMemo(() => steps.find(s => s.key === selectedKey) || null, [steps, selectedKey]);

  if (loading && !status) {
    return (
      <div className="bg-white border-x border-b border-gray-200 p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (!loading && !steps.length) {
    return (
      <div className="bg-white border-x border-b border-gray-200 p-10">
        <Empty description="Onboarding is unavailable right now." />
      </div>
    );
  }

  return (
    <div className="bg-white border-x border-b border-gray-200">
      {/* ── Header: title + progress + dismiss ── */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Let&apos;s get you up and running</h2>
            <p className="text-sm text-gray-500 mt-0.5">Finish these steps to set up your organisation in ABSS Books.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-[160px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                  {completedCount} of {total} completed
                </span>
                <span className="text-sm font-bold" style={{ color: colorPalette.primary[500] }}>
                  {progress}%
                </span>
              </div>
              <Progress percent={progress} showInfo={false} strokeColor={colorPalette.primary[500]} size="small" />
            </div>
          </div>
        </div>

        {allDone && (
          <div className="mt-3 rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2" style={{ backgroundColor: colorPalette.primary[50], color: colorPalette.primary[700] }}>
            <Icons.CheckCircleOutlined /> All set! Your organisation is fully configured.
          </div>
        )}
      </div>

      {/* ── Two-pane: step list (left) + detail (right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
        {/* Step list */}
        <div className="border-b md:border-b-0 md:border-r border-gray-100">
          {steps.map(step => {
            const active = step.key === selectedKey;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setSelectedKey(step.key)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${active ? 'bg-gray-50' : 'hover:bg-gray-50/60'}`}
                style={active ? { boxShadow: `inset 3px 0 0 ${colorPalette.primary[500]}` } : {}}
              >
                <StepIcon done={step.done} />
                <span className={`flex-1 text-sm ${step.done ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Detail pane */}
        <div className="p-5 sm:p-6">
          {selectedStep ? (
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <StepIcon done={selectedStep.done} />
                <h3 className="text-base font-bold text-gray-900">{selectedStep.label}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{selectedStep.description}</p>

              <div className="flex flex-wrap items-center gap-2">
                {selectedStep.cta?.path && !selectedStep.done && (
                  <CustomButton type="primary" onClick={() => navigate(selectedStep.cta.path)} icon={<Icons.RightOutlined />} iconPosition="end">
                    {selectedStep.cta.label || 'Go'}
                  </CustomButton>
                )}
              </div>
            </div>
          ) : (
            <Empty description="Select a step" />
          )}
        </div>
      </div>

      {/* Admin-only CRM->BOOKS backfills; self-hides when there are no data issues. */}
      {isAdminRole && <DataSetupPanel />}
    </div>
  );
};

export default GettingStarted;
