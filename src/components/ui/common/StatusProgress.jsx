import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const primary = colorPalette.primary[500];
const track = '#e2e8f0';
const muted = '#94a3b8';
const danger = '#dc2626';

/**
 * Build progress steps from a flow definition and current key.
 * @param {{ key: string, label: string }[]} flow
 * @param {string} currentKey
 * @returns {{ key: string, label: string, state: 'done'|'current'|'upcoming', stepNumber: number }[]}
 */
export const buildStatusProgressSteps = (flow = [], currentKey) => {
  const normalizedKey = String(currentKey || '').toUpperCase();
  const statusIndex = flow.findIndex(step => String(step.key).toUpperCase() === normalizedKey);
  const isComplete = statusIndex === flow.length - 1;

  return flow.map((step, index) => {
    let state = 'upcoming';
    if (statusIndex >= 0) {
      if (isComplete || index < statusIndex) state = 'done';
      else if (index === statusIndex) state = 'current';
    }

    return {
      key: step.key,
      label: step.label,
      state,
      stepNumber: index + 1,
    };
  });
};

const StepCircle = ({ step }) => {
  if (step.state === 'done') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}>
        <Icons.CheckOutlined className="text-sm" />
      </span>
    );
  }

  if (step.state === 'rejected') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold" style={{ border: `2px solid ${danger}`, color: danger }}>
        {step.stepNumber}
      </span>
    );
  }

  if (step.state === 'current') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold" style={{ border: `2px solid ${primary}`, color: primary }}>
        {step.stepNumber}
      </span>
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold" style={{ border: `2px solid ${track}`, color: muted }}>
      {step.stepNumber}
    </span>
  );
};

const stepLabelClass = state => {
  if (state === 'current') return 'font-semibold';
  if (state === 'rejected') return 'font-semibold text-red-600';
  if (state === 'done') return 'font-medium text-slate-500';
  return 'font-medium text-slate-400';
};

const segmentColor = (steps, progressIndex, index) => {
  if (index >= progressIndex) return track;
  return steps[progressIndex]?.state === 'rejected' ? danger : primary;
};

/**
 * Shared status progress bar.
 * Pass steps with `state`: 'done' | 'current' | 'upcoming' | 'rejected'
 * Or use `buildStatusProgressSteps(flow, currentKey)` to create them.
 */
const StatusProgress = ({ steps = [], className = 'mt-3 px-6' }) => {
  if (!steps.length) return null;

  const currentIndex = steps.findIndex(step => step.state === 'current' || step.state === 'rejected');
  const isComplete = steps.every(step => step.state === 'done');
  const progressIndex = isComplete ? steps.length - 1 : Math.max(currentIndex, 0);

  return (
    <div className={className}>
      <div className="flex w-full items-center">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const key = step.key || step.label || index;

          return (
            <div key={key} className={`flex items-center ${isLast ? 'shrink-0' : 'min-w-0 flex-1'}`}>
              <StepCircle step={step} />
              {!isLast ? <span className="h-0.5 min-w-0 flex-1" style={{ backgroundColor: segmentColor(steps, progressIndex, index) }} /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex w-full">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const key = step.key || step.label || index;

          return (
            <div key={key} className={`flex ${isLast ? 'shrink-0' : 'min-w-0 flex-1'}`}>
              <span className="relative h-5 w-8 shrink-0">
                <span
                  className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[13px] ${stepLabelClass(step.state)}`}
                  style={step.state === 'current' ? { color: primary } : undefined}
                >
                  {step.label}
                </span>
              </span>
              {!isLast ? <span className="min-w-0 flex-1" aria-hidden /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusProgress;
