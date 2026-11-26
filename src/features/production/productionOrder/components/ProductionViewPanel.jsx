import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { DetailField } from '@/components/ui';
import { Collapse, Empty, Popconfirm, Tooltip } from '@/components/AntDComponent';
import ProductionDrawer from './ProductionDrawer';
import ProcessStepper from './ProcessStepper';
import { ProcessSubmitPanel } from './ProductionSubmitPanel';
import { useProductionOrder } from '@/features/production/productionOrder';
import useModulePermissions from 'hooks/useModulePermissions';
import {
  bomSubmissionManpowerColumns,
  bomSubmissionMaterialColumns,
  fgBatchColumns,
  processAdditionalCostColumns,
  processItemQtyColumns,
  processManpowerColumns,
} from '@/features/production/productionOrder';
import Icons from 'assets/icons/icon';
import { PERMISSION_MESSAGES, PROCESS_STATUS, PRODUCTION_MODULE_BACKEND_STATUS, PRODUCTION_MODULE_STATUS } from '@/utils/constants';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi, roundQty } from '@/utils/services';
import { shouldPreventNavigation } from '@/utils/util';
import { RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from '@/utils/theme';

const compactTableProps = { pagination: false, dynamicScrollY: false };

const PANEL_TITLE = { view: 'View', submit: 'Submit', edit: 'Edit' };

const Section = ({ title, children }) => (
  <div className="my-container px-3 py-2">
    <p className="text-sm font-semibold text-gray-800 m-0 mb-2">{title}</p>
    {children}
  </div>
);

export const BomViewPanel = ({ data, submission, submissionIndex, fgUnit, onClose }) => {
  const scrapTotal = submission.scrapOut.reduce((sum, row) => sum + row.value, 0);
  const labourCost = submission.manpowerCost.reduce((sum, row) => sum + (row.workerCost || 0), 0);
  const extraCost = submission.additionalCost.reduce((sum, row) => sum + (row.amount || 0), 0);

  return (
    <ProductionDrawer
      title={`View Submission #${submissionIndex + 1}`}
      status={data.status}
      statusLabel={PRODUCTION_MODULE_STATUS[data.status] || data.status}
      onClose={onClose}
      meta={
        <>
          <DetailField label="Date" value={dateFormateForUi(submission.submissionDate, { withTime: true })} />
          <DetailField className="border-l border-gray-200 pl-4" label="Submitted by" value={submission.submittedBy?.name || '-'} />
          <DetailField className="border-l border-gray-200 pl-4" label="FG Submitted" value={`${submission.fgSubmittedQty} ${fgUnit}`} />
          <DetailField className="border-l border-gray-200 pl-4" label="FG Rejected" value={`${submission.fgRejectedQty} ${fgUnit}`} />
        </>
      }
      footer={<CustomButton text="Close" type="default" htmlType="button" onClick={onClose} />}
    >
      <div className="space-y-3">
        <Section title="Quantity">
          <div className="grid grid-cols-3 gap-x-3">
            <DetailField label="FG Submitted" value={`${submission.fgSubmittedQty} ${fgUnit}`} valueClassName={submission.fgSubmittedQty > 0 ? 'text-green-600' : ''} />
            <DetailField label="FG Rejected" value={`${submission.fgRejectedQty} ${fgUnit}`} valueClassName={submission.fgRejectedQty > 0 ? 'text-red-600' : ''} />
            <DetailField label="Scrap" value={`${scrapTotal} ${fgUnit}`} valueClassName={scrapTotal > 0 ? 'text-orange-600' : ''} />
          </div>
        </Section>
        {submission.batches.length > 0 && (
          <Section title="Finished Goods Batches">
            <CustomTable columns={fgBatchColumns(fgUnit)} data={submission.batches} tableId="itemBatchId" {...compactTableProps} />
          </Section>
        )}
        {submission.rawMaterialsConsumed.length > 0 && (
          <Section title="Raw Materials Consumed">
            <CustomTable columns={bomSubmissionMaterialColumns()} data={submission.rawMaterialsConsumed} tableId="_id" {...compactTableProps} scroll={{ x: 'max-content' }} />
          </Section>
        )}
        {submission.scrapOut.length > 0 && (
          <Section title="Scrap">
            <CustomTable columns={processItemQtyColumns()} data={submission.scrapOut} tableId="_id" {...compactTableProps} />
          </Section>
        )}
        {submission.manpowerCost.length > 0 && (
          <Section title="Manpower Cost">
            <CustomTable columns={bomSubmissionManpowerColumns()} data={submission.manpowerCost} tableId="_id" {...compactTableProps} scroll={{ x: 'max-content' }} />
          </Section>
        )}
        {submission.additionalCost.length > 0 && (
          <Section title="Additional Cost">
            <CustomTable columns={processAdditionalCostColumns()} data={submission.additionalCost} tableId="_id" {...compactTableProps} />
          </Section>
        )}
        <Section title="Cost summary">
          <div className="grid grid-cols-3 gap-x-3">
            <DetailField label="Labour cost" value={formatAmount(labourCost)} />
            <DetailField label="Additional cost" value={formatAmount(extraCost)} />
            <DetailField label="Total cost" value={formatAmount(labourCost + extraCost)} />
          </div>
        </Section>
      </div>
    </ProductionDrawer>
  );
};

export const ProcessViewPanel = ({ data, process, processIndex, previousProcess, fgUnit, canSubmit, panelMode, editSubmission, onClose, onEdit, onCancelEdit, onSubmit, onSubmitted, onReload }) => {
  const processId = process.id || process._id;
  const { startProductionProcess, startLoading, deleteProcessSubmission, deleteSubmissionLoading, submitProcessLoading, editSubmissionLoading } = useProductionOrder();
  const { useAddProduction, isViewOnly } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const isStarted = Boolean(process.startDatetime);
  const isCompleted = Boolean(process.endDatetime);
  const hasInput = !previousProcess || Number(process.processIN) > 0;
  const scrapTotal = process.scrapOutProcess.reduce((sum, row) => sum + row.value, 0);
  const totalOutput = roundQty(process.processOUT + process.processRejection);
  const labourCost = process.manPower.reduce((sum, row) => sum + (row.workerCost || 0), 0);
  const additionalCost = process.additionalCost.reduce((sum, row) => sum + (row.amount || 0), 0);
  const isSubmissionLocked = [PRODUCTION_MODULE_BACKEND_STATUS.CLOSED, PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD].includes(data.status) || !!data.isManuallyCompleted;
  const submissionLockedTooltip = data.isManuallyCompleted
    ? 'Not available on a manually completed production order.'
    : `Not available on a ${PRODUCTION_MODULE_STATUS[data.status] || data.status} production order.`;
  const canEditSubmission = useAddProduction?.edit && !isViewOnly && !isSubmissionLocked;
  const canDeleteSubmission = useAddProduction?.delete && !isViewOnly && !isSubmissionLocked;
  const editSubmissionTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAddProduction?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : isSubmissionLocked ? submissionLockedTooltip : undefined;
  const deleteSubmissionTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAddProduction?.delete ? PERMISSION_MESSAGES.NO_PERMISSION : isSubmissionLocked ? submissionLockedTooltip : undefined;

  const handleStartProcess = async () => {
    const result = await startProductionProcess({ productionOrderId: data?.id, processId });
    if (shouldPreventNavigation(result)) return;
    await onReload();
  };

  const handleDeleteSubmission = async submission => {
    const result = await deleteProcessSubmission({ productionOrderId: data?.id, processId, submissionId: submission._id });
    if (shouldPreventNavigation(result)) return;
    await onReload();
  };

  return (
    <ProductionDrawer
      title={`${PANEL_TITLE[panelMode]} ${process.processName}`}
      status={process.status}
      statusLabel={PROCESS_STATUS[process.status]}
      maskClosable={!startLoading && !deleteSubmissionLoading && !submitProcessLoading && !editSubmissionLoading}
      onClose={onClose}
      meta={
        <>
          <DetailField label="Process" value={`${processIndex + 1} of ${data.processBased.processes.length}`} />
          <DetailField className="border-l border-gray-200 pl-4" label="Sequence" value={process.processNo} />
          {isStarted ? <DetailField className="border-l border-gray-200 pl-4" label="Started" value={dateFormateForUi(process.startDatetime, { withTime: true })} /> : null}
          {process.startedBy?.name ? <DetailField className="border-l border-gray-200 pl-4" label="Started by" value={process.startedBy.name} /> : null}
          {isCompleted ? <DetailField className="border-l border-gray-200 pl-4" label="Completed" value={dateFormateForUi(process.endDatetime, { withTime: true })} /> : null}
          {isCompleted ? (
            <DetailField className="border-l border-gray-200 pl-4" label="Completed by" value={process.submissionHistory[process.submissionHistory.length - 1]?.submittedBy?.name || '-'} />
          ) : null}
        </>
      }
      footer={
        panelMode !== 'view' ? undefined : (
          <>
            <CustomButton text="Close" type="default" htmlType="button" onClick={onClose} />
            {!isStarted && !hasInput && <CustomButton text="Waiting" type="default" htmlType="button" disabled />}
            {!isStarted && hasInput && (
              <PermissionButton
                canAccess={!!useAddProduction?.edit}
                isViewOnly={isViewOnly}
                tooltipTitle={useAddProduction?.edit && !isViewOnly && !canSubmit ? 'Cannot start in the current production order status.' : undefined}
                type="primary"
                loading={startLoading}
                disabled={!canSubmit}
                onClick={handleStartProcess}
              >
                Start Process
              </PermissionButton>
            )}
            {isStarted && !isCompleted && (
              <PermissionButton
                canAccess={!!useAddProduction?.create}
                isViewOnly={isViewOnly}
                tooltipTitle={useAddProduction?.create && !isViewOnly && !canSubmit ? 'Cannot submit in the current production order status.' : undefined}
                type="primary"
                disabled={!canSubmit}
                onClick={onSubmit}
              >
                Submit Process
              </PermissionButton>
            )}
          </>
        )
      }
    >
      <ProcessStepper processes={data.processBased.processes} activeIndex={processIndex} />
      {panelMode !== 'view' ? (
        <ProcessSubmitPanel
          withDrawer={false}
          data={data}
          process={process}
          processIndex={processIndex}
          fgUnit={fgUnit}
          submission={panelMode === 'edit' ? editSubmission : null}
          onClose={onCancelEdit}
          onSubmitted={onSubmitted}
        />
      ) : !isStarted ? (
        <div className="space-y-3">
          <Section title="Planned">
            <div className="grid grid-cols-3 gap-x-3">
              <DetailField label="Planned" value={`${data.summary.planned} ${fgUnit}`} />
              <DetailField label={previousProcess ? 'Received from previous' : 'Previous process'} value={previousProcess ? `${process.processIN} ${fgUnit}` : 'First in route'} />
              <DetailField label="Recipe" value={data.processBased.recipeId?.name} />
            </div>
          </Section>
          <div className="my-container px-3 py-6">
            <Empty description="Not started. No production quantity has been recorded yet." />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Section title={isCompleted ? 'Final quantity' : 'Process Summary'}>
            <div className="grid grid-cols-6 gap-x-3">
              <DetailField label="Input" value={`${process.processIN} ${fgUnit}`} />
              <DetailField label="Remaining" value={`${process.pendingQty} ${fgUnit}`} />
              <DetailField label="Processed" value={`${totalOutput} ${fgUnit}`} />
              <DetailField label="Good output" value={`${process.processOUT} ${fgUnit}`} valueClassName={process.processOUT > 0 ? 'text-green-600' : ''} />
              <DetailField label="Rejected" value={`${process.processRejection} ${fgUnit}`} valueClassName={process.processRejection > 0 ? 'text-red-600' : ''} />
              <DetailField label="Scrap" value={`${scrapTotal} ${fgUnit}`} valueClassName={scrapTotal > 0 ? 'text-orange-600' : ''} />
            </div>
          </Section>
          <Section title="Submission History">
            {process.submissionHistory.length > 0 ? (
              <Collapse accordion>
                {process.submissionHistory.map((submission, index) => {
                  const scrapOut = submission.scrapOutProcess.reduce((sum, row) => sum + row.value, 0);
                  const submissionLabour = submission.manPower.reduce((sum, row) => sum + (row.workerCost || 0), 0);
                  const extraCosts = process.additionalCost.filter(cost => String(cost.submissionId) === String(submission._id));
                  const extraCost = extraCosts.reduce((sum, row) => sum + (row.amount || 0), 0);
                  const processedQty = roundQty(submission.processOUT + submission.processRejection);
                  return (
                    <Collapse.Panel
                      key={String(submission._id || index)}
                      header={
                        <span className="font-medium">
                          Submission #{index + 1} — {dateFormateForUi(submission.submissionDate, { withTime: true })}
                          {submission.submittedBy?.name ? ` — ${submission.submittedBy.name}` : ''}
                        </span>
                      }
                      extra={
                        <div className="flex items-center gap-3" role="presentation" onClick={e => e.stopPropagation()}>
                          <Tooltip title={editSubmissionTooltip}>
                            <Icons.EditOutlined
                              className={canEditSubmission ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                              style={{ fontSize: 16, color: colorPalette.primary[500] }}
                              onClick={canEditSubmission ? () => onEdit(submission) : undefined}
                            />
                          </Tooltip>
                          <Popconfirm
                            title="Delete Submission"
                            description="Delete this submission? Its quantities are reversed."
                            okText="Yes"
                            cancelText="No"
                            disabled={!canDeleteSubmission}
                            okButtonProps={{ loading: deleteSubmissionLoading }}
                            onConfirm={() => handleDeleteSubmission(submission)}
                          >
                            <Tooltip title={deleteSubmissionTooltip}>
                              <Icons.DeleteOutlined
                                className={canDeleteSubmission ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                                style={{ fontSize: 16, color: '#F14336' }}
                                onClick={e => e.stopPropagation()}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </div>
                      }
                    >
                      <div className="mt-1 space-y-3">
                        <div className="grid grid-cols-4 my-container">
                          <DetailField className="px-3 py-2" label="Processed" value={`${processedQty} ${fgUnit}`} />
                          <DetailField
                            className="px-3 py-2 border-l border-gray-200"
                            label="Good Output"
                            value={`${submission.processOUT} ${fgUnit}`}
                            valueClassName={submission.processOUT > 0 ? 'text-green-600' : ''}
                          />
                          <DetailField
                            className="px-3 py-2 border-l border-gray-200"
                            label="Rejected"
                            value={`${submission.processRejection} ${fgUnit}`}
                            valueClassName={submission.processRejection > 0 ? 'text-red-600' : ''}
                          />
                          <DetailField className="px-3 py-2 border-l border-gray-200" label="Scrap" value={`${scrapOut} ${fgUnit}`} valueClassName={scrapOut > 0 ? 'text-orange-600' : ''} />
                        </div>
                        {submission.processRawMaterialInput.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Raw Materials Consumed:</h4>
                            <CustomTable columns={processItemQtyColumns()} data={submission.processRawMaterialInput} tableId="_id" {...compactTableProps} />
                          </div>
                        )}
                        {submission.scrapOutProcess.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Scrap:</h4>
                            <CustomTable columns={processItemQtyColumns()} data={submission.scrapOutProcess} tableId="_id" {...compactTableProps} />
                          </div>
                        )}
                        {submission.manPower.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Manpower Cost:</h4>
                            <CustomTable columns={processManpowerColumns()} data={submission.manPower} tableId="_id" {...compactTableProps} />
                          </div>
                        )}
                        {extraCosts.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Additional Cost:</h4>
                            <CustomTable columns={processAdditionalCostColumns()} data={extraCosts} tableId="_id" {...compactTableProps} />
                          </div>
                        )}
                        {(submissionLabour > 0 || extraCost > 0) && (
                          <div className="grid grid-cols-3 gap-x-3">
                            {submissionLabour > 0 ? <DetailField label="Labour cost" value={formatAmount(submissionLabour)} /> : null}
                            {extraCost > 0 ? <DetailField label="Additional cost" value={formatAmount(extraCost)} /> : null}
                            <DetailField label="Total cost" value={formatAmount(submissionLabour + extraCost)} />
                          </div>
                        )}
                        {submission.remarks ? <DetailField label="Remarks" value={submission.remarks} truncate={false} /> : null}
                      </div>
                    </Collapse.Panel>
                  );
                })}
              </Collapse>
            ) : (
              <Empty description="No submissions yet." />
            )}
          </Section>
          <Section title="Cost summary">
            <div className="grid grid-cols-3 gap-x-3">
              <DetailField label="Labour cost" value={formatAmount(labourCost)} />
              <DetailField label="Additional cost" value={formatAmount(additionalCost)} />
              <DetailField label="Total cost" value={formatAmount(labourCost + additionalCost)} />
            </div>
          </Section>
        </div>
      )}
    </ProductionDrawer>
  );
};
