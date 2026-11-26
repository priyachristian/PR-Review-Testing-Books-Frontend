import { Steps, Tooltip } from '@/components/AntDComponent';

const Stepper = ({ current = 0, steps = [], className = '', direction = 'horizontal', scrollable = false, truncateTitles = false, titleMaxWidth = 120, stepWidth = 140 }) => {
  const renderTitle = title => {
    if (!truncateTitles || direction === 'vertical' || !title) return title;

    return (
      <Tooltip title={title} placement="top">
        <span className="block truncate mx-auto text-center text-[14px] font-medium" style={{ maxWidth: titleMaxWidth }}>
          {title}
        </span>
      </Tooltip>
    );
  };

  const renderDescription = step => {
    if (!step?.date && !step?.days) return null;

    return (
      <div className="support-step-meta">
        {step.date ? <div className="support-step-meta-date">{step.date}</div> : null}
        {step.days ? <div className={step.daysHighlight ? 'support-step-meta-days is-highlight' : 'support-step-meta-days'}>{step.days}</div> : null}
      </div>
    );
  };

  const stepsNode = (
    <Steps
      className={[scrollable && direction === 'horizontal' ? 'support-stepper-scroll' : '', className].filter(Boolean).join(' ')}
      style={scrollable && direction === 'horizontal' ? { '--support-step-width': `${stepWidth}px` } : undefined}
      direction={direction}
      current={current}
      size="small"
      labelPlacement={direction === 'horizontal' ? 'vertical' : undefined}
      items={steps.map((step, index) => ({
        title: renderTitle(step.title),
        description: renderDescription(step),
        key: step.key ?? step.title ?? index,
      }))}
    />
  );

  if (scrollable && direction === 'horizontal') {
    return (
      <div className="support-stepper-scroll-wrap">
        <div className="support-stepper-scroll-inner">{stepsNode}</div>
      </div>
    );
  }

  return stepsNode;
};

export default Stepper;
