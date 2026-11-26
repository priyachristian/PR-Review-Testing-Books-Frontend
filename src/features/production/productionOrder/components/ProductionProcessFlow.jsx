import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import { Button, Tag, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import ProcessSequenceModal from './ProcessSequenceModal';

// Hooks
import { useProductionOrder } from '@/features/production/productionOrder';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { productionProcessColumns } from '@/features/production/productionOrder';
import Icons from 'assets/icons/icon';
import { PROCESS_STATUS } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from '@/utils/services';
import { colorPalette } from '@/utils/theme';

const processKey = process => process.id || process._id;

const PROCESS_ACCENT = {
  COMPLETED: { border: 'border-emerald-600', hover: 'hover:border-emerald-600', bar: 'bg-emerald-600', head: 'bg-emerald-50' },
  IN_PROGRESS: { border: 'border-sky-500', hover: 'hover:border-sky-500', bar: 'bg-sky-500', head: 'bg-sky-50' },
  PARTIALLY_COMPLETED: { border: 'border-blue-500', hover: 'hover:border-blue-500', bar: 'bg-blue-500', head: 'bg-blue-50' },
  PENDING: { border: 'border-amber-600', hover: 'hover:border-amber-600', bar: 'bg-amber-600', head: 'bg-amber-50' },
};

const ProductionProcessFlow = ({ processes, isLocked, plannedQty, currentProcessId, canSubmit, onSubmit, onReload }) => {
  const { productionOrderId } = useParams();
  const { reorderProcesses, updateLoading, startProductionProcess, startLoading, endProductionProcess, endLoading } = useProductionOrder();
  const { useAddProduction, isViewOnly } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const [view, setView] = useState('full');
  const [rearrangeModalOpen, setRearrangeModalOpen] = useState(false);
  const [startingProcessId, setStartingProcessId] = useState(null);
  const [stopCompleteRow, setStopCompleteRow] = useState(null);

  const rows = processes.map((process, index) => {
    const scrapTotal = process.scrapOutProcess ? process.scrapOutProcess.reduce((sum, row) => sum + row.value, 0) : 0;
    const isCurrent = processKey(process) === currentProcessId;

    return {
      key: processKey(process) || index,
      seq: index + 1,
      processName: process.processName,
      processNo: process.processNo,
      processStatus: process.status,
      accent: PROCESS_ACCENT[process.status] || PROCESS_ACCENT.PENDING,
      plannedQty,
      processIN: process.processIN,
      processOUT: process.processOUT,
      scrapTotal,
      processRejection: process.processRejection,
      pendingQty: process.pendingQty,
      startedBy: process.startedBy?.name,
      startDatetime: process.startDatetime,
      endDatetime: process.endDatetime,
      completedBy: process.submissionHistory?.[process.submissionHistory.length - 1]?.submittedBy?.name,
      isCurrent,
      isComplete: Boolean(process.endDatetime),
      prevName: index > 0 ? processes[index - 1].processName : undefined,
      hasInput: index === 0 || Number(process.processIN) > 0,
      canStopComplete: index === 0 || Boolean(processes[index - 1].endDatetime),
      materialsLabel: process.processRawMaterialInput?.length > 0 ? `${process.processRawMaterialInput.length} materials` : 'No materials',
    };
  });

  const handleRearrangeClick = () => setRearrangeModalOpen(true);

  const handleSaveSequence = async (orderedProcesses, sequenceLocked) => {
    try {
      await reorderProcesses({
        productionOrderId,
        processes: orderedProcesses.map(processKey),
        isLocked: sequenceLocked,
      });
      setRearrangeModalOpen(false);
      await onReload();
    } catch {
      return;
    }
  };

  const handleStartProcess = async row => {
    setStartingProcessId(row.key);
    await startProductionProcess({ productionOrderId, processId: row.key });
    await onReload();
    setStartingProcessId(null);
  };

  const handleStopAndComplete = async values => {
    await endProductionProcess({
      productionOrderId,
      processId: stopCompleteRow.key,
      endData: { remarks: values.remarks },
    });
    setStopCompleteRow(null);
    await onReload();
  };

  const rowActions = row => {
    const startBlocked = !useAddProduction?.edit || isViewOnly || !canSubmit;
    const submitBlocked = !useAddProduction?.create || isViewOnly || !canSubmit;
    const statusTooltip = blocked => (isViewOnly || !useAddProduction?.edit ? undefined : blocked ? 'Cannot act in the current production order status.' : undefined);

    return [
      {
        key: 'waiting',
        label: 'Waiting',
        icon: Icons.ClockCircleOutlined,
        show: !row.startDatetime && !row.hasInput,
        disabled: true,
        tooltip: row.prevName ? `Waiting for ${row.prevName}` : 'Waiting',
      },
      {
        key: 'start',
        label: 'Start',
        icon: Icons.PlayCircleOutlined,
        show: !row.startDatetime && row.hasInput,
        disabled: startBlocked,
        loading: startLoading && startingProcessId === row.key,
        tooltip: statusTooltip(startBlocked),
        onClick: () => handleStartProcess(row),
      },
      {
        key: 'submit',
        label: 'Submit',
        icon: Icons.CheckCircleOutlined,
        show: Boolean(row.startDatetime),
        disabled: submitBlocked,
        tooltip: statusTooltip(submitBlocked),
        onClick: () => onSubmit(row, 'edit'),
      },
      {
        key: 'stopComplete',
        label: 'Stop & Complete',
        icon: Icons.StopOutlined,
        show: row.canStopComplete,
        disabled: submitBlocked,
        tooltip: statusTooltip(submitBlocked),
        onClick: () => setStopCompleteRow(row),
      },
    ].filter(action => action.show);
  };

  const actionButton = (row, compact = false) => {
    if (row.isComplete && !compact) return null;
    const actions = rowActions(row);

    if (compact) {
      return (
        <div className="flex space-x-2" role="presentation" onClick={event => event.stopPropagation()}>
          {actions.map(({ key, icon: Icon, label, tooltip, disabled, loading, onClick }) => (
            <Tooltip key={key} title={tooltip || label}>
              <Icon
                className={`cursor-pointer ${disabled || loading ? 'opacity-40 cursor-no-drop' : ''}`}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={disabled || loading ? undefined : onClick}
              />
            </Tooltip>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2" role="presentation" onClick={event => event.stopPropagation()}>
        {actions.map(action => (
          <PermissionButton
            key={action.key}
            canAccess={action.key === 'start' ? !!useAddProduction?.edit : !!useAddProduction?.create}
            isViewOnly={isViewOnly}
            tooltipTitle={action.tooltip}
            type={action.key === 'stopComplete' || action.key === 'waiting' ? 'default' : 'primary'}
            size="small"
            loading={action.loading}
            disabled={action.disabled}
            onClick={action.onClick}
            block
            className="w-full"
            wrapperClassName="block w-full"
          >
            {action.label}
          </PermissionButton>
        ))}
      </div>
    );
  };

  return (
    <div className="my-container px-3 py-2 space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type={view === 'full' ? 'primary' : 'default'} size="small" onClick={() => setView('full')}>
          Full
        </Button>
        <Button type={view === 'compact' ? 'primary' : 'default'} size="small" onClick={() => setView('compact')}>
          Compact
        </Button>
        <PermissionButton
          canAccess={!!useAddProduction?.edit}
          isViewOnly={isViewOnly}
          disabled={processes.some(process => process.startDatetime)}
          tooltipTitle={useAddProduction?.edit && processes.some(process => process.startDatetime) ? 'The sequence cannot be changed after a process has started.' : undefined}
          type="default"
          size="small"
          icon={isLocked ? <Icons.LockOutlined /> : <Icons.SwapOutlined />}
          onClick={handleRearrangeClick}
        >
          Rearrange sequence
        </PermissionButton>
      </div>

      {view === 'full' && (
        <div className="min-w-0 overflow-x-auto">
          <div className="flex items-stretch gap-6 w-full mt-2">
            {rows.map((row, index) => (
              <div key={row.key} className="relative min-w-[252px] w-[calc((100%-4.5rem)/4)] shrink-0">
                {index > 0 && (
                  <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 z-10 text-[#94a3b8] leading-none pointer-events-none" aria-hidden>
                    →
                  </span>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSubmit(row, 'view')}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') onSubmit(row, 'view');
                  }}
                  className={`h-full overflow-hidden rounded-[6px] bg-white flex flex-col shadow-[0px_1px_4px_rgba(46,38,61,0.1)] cursor-pointer border ${
                    row.isCurrent ? row.accent.border : 'border-gray-200'
                  } ${row.accent.hover}`}
                >
                  <div className={`h-[3px] shrink-0 ${row.accent.bar}`} />
                  <div className={`px-3 py-2.5 border-b border-gray-100 ${row.accent.head}`}>
                    <div className="flex items-center justify-between gap-2">
                      {row.processNo ? <Tag className="m-0 font-semibold">{row.processNo}</Tag> : <span className="text-sm font-semibold text-gray-500">-</span>}
                      <StatusBadge status={row.processStatus} value={PROCESS_STATUS[row.processStatus]} />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <p className="text-sm font-semibold text-gray-800 m-0 truncate min-w-0">{row.processName}</p>
                    </div>
                  </div>
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Planned</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{row.plannedQty}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Input</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{row.processIN}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Good output</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{row.processOUT}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Rejected</span>
                      <span className={`text-[13px] font-medium leading-5 shrink-0 ${row.processRejection > 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>{row.processRejection}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Scrap</span>
                      <span className={`text-[13px] font-medium leading-5 shrink-0 ${row.scrapTotal > 0 ? 'text-orange-600' : 'text-[#1e293b]'}`}>{row.scrapTotal}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Remaining</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{row.pendingQty}</span>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-gray-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Started by</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 truncate min-w-0 text-right">{row.startedBy || '-'}</span>
                    </div>
                    {row.startDatetime ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[#64748b]">Started</span>
                        <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{dateFormateForUi(row.startDatetime, { withTime: true }) || '-'}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Completed by</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 truncate min-w-0 text-right">{row.completedBy || '-'}</span>
                    </div>
                    {row.endDatetime ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[#64748b]">Completed</span>
                        <span className="text-[13px] font-medium text-[#1e293b] leading-5 shrink-0">{dateFormateForUi(row.endDatetime, { withTime: true }) || '-'}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-[#64748b]">Materials</span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5 truncate min-w-0 text-right">{row.materialsLabel}</span>
                    </div>
                  </div>
                  {!row.isComplete && (
                    <div className="px-3 py-2.5 border-t border-gray-100 bg-[#f6f7fb] mt-auto" role="presentation" onClick={e => e.stopPropagation()}>
                      {actionButton(row)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'compact' && (
        <CustomTable
          columns={productionProcessColumns(actionButton)}
          data={rows}
          pagination={false}
          dynamicScrollY={false}
          scroll={{ x: 'max-content' }}
          onRowClick={record => onSubmit(record, 'view')}
        />
      )}

      {rearrangeModalOpen && (
        <ProcessSequenceModal processes={processes} isLocked={isLocked === true} loading={updateLoading} onCancel={() => setRearrangeModalOpen(false)} onApply={handleSaveSequence} />
      )}
      <CustomModal
        modalOpen={Boolean(stopCompleteRow)}
        setModalOpen={open => {
          if (!open) setStopCompleteRow(null);
        }}
        title="Stop & Complete"
        width={520}
        destroyOnClose
      >
        <Formik initialValues={{ remarks: 'Manually completed' }} onSubmit={handleStopAndComplete}>
          {({ values, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <CustomForm name="stop-complete-process" onFinish={handleSubmit}>
              <p className="text-sm text-gray-700 m-0 mb-4">
                Are you sure you want to mark <span className="font-semibold">{stopCompleteRow?.processName}</span> as completed?
              </p>
              <CustomInput
                type="textarea"
                name="remarks"
                label="Remarks"
                placeholder="Enter Remarks"
                value={values.remarks}
                onChange={handleChange}
                onBlur={handleBlur}
                setFieldValue={setFieldValue}
              />
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                <CustomButton text="Cancel" type="default" htmlType="button" onClick={() => setStopCompleteRow(null)} />
                <CustomButton text="Confirm" type="primary" loading={endLoading} onClick={handleSubmit} />
              </div>
            </CustomForm>
          )}
        </Formik>
      </CustomModal>
    </div>
  );
};

export default ProductionProcessFlow;
