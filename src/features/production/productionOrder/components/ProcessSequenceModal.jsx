import { useState } from 'react';

// Components
import { Button, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { CustomLabel } from '@/components/forms/formInput/CustomInput';

// Extras
import Icons from 'assets/icons/icon';

const processKey = process => process.id || process._id;

const ProcessSequenceModal = ({ processes, isLocked = false, showLock = true, loading, onCancel, onApply }) => {
  const [orderedProcesses, setOrderedProcesses] = useState(processes);
  const [sequenceLocked, setSequenceLocked] = useState(isLocked);
  const [draggedItem, setDraggedItem] = useState();

  return (
    <CustomModal modalOpen setModalOpen={open => !open && onCancel()} width={700} title="Rearrange Sequence">
      <div className="mb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <CustomLabel label="Processes" name="processes" />
          {showLock && (
            <Tooltip title={sequenceLocked ? 'Unlock to change process order' : 'Lock process sequence'} placement="top">
              <span className="inline-block">
                <Button type={sequenceLocked ? 'primary' : 'default'} icon={sequenceLocked ? <Icons.UnlockOutlined /> : <Icons.LockOutlined />} onClick={() => setSequenceLocked(!sequenceLocked)}>
                  {sequenceLocked ? 'Unlock' : 'Lock'}
                </Button>
              </span>
            </Tooltip>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 rounded-lg">
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                {!sequenceLocked && <th className="border px-2 py-1 bg-[#f6f7fb] w-[36px]" />}
                <th className="border px-2 py-1 bg-[#f6f7fb]">Sequence</th>
                <th className="border px-2 py-1 bg-[#f6f7fb]">Process Name</th>
                <th className="border px-2 py-1 bg-[#f6f7fb]">Process No</th>
              </tr>
            </thead>
            <tbody>
              {orderedProcesses.map((process, index) => (
                <tr
                  key={processKey(process)}
                  draggable={!sequenceLocked}
                  onDragStart={e => {
                    if (sequenceLocked) return;
                    setDraggedItem(processKey(process));
                    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDragEnter={e => {
                    e.preventDefault();
                    if (sequenceLocked || !draggedItem || draggedItem === processKey(process)) return;
                    const next = [...orderedProcesses];
                    const from = next.findIndex(row => processKey(row) === draggedItem);
                    const to = next.findIndex(row => processKey(row) === processKey(process));
                    [next[from], next[to]] = [next[to], next[from]];
                    setOrderedProcesses(next);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    setDraggedItem(undefined);
                  }}
                  onDragEnd={() => setDraggedItem(undefined)}
                  className={`hover:bg-blue-50 transition-all duration-200 ${sequenceLocked ? '' : 'cursor-move'} ${draggedItem === processKey(process) ? 'opacity-50 bg-gray-100' : ''}`}
                >
                  {!sequenceLocked && (
                    <td className="border text-center w-[36px] align-middle p-1">
                      <span className="cursor-move inline-flex p-1" title="Drag to reorder">
                        <Icons.DragOutlined className="text-gray-400" />
                      </span>
                    </td>
                  )}
                  <td className="border px-2 py-1 text-center">{index + 1}</td>
                  <td className="border px-2 py-1 text-center">{process.processName}</td>
                  <td className="border px-2 py-1 text-center">{process.processNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-4 justify-end items-center pt-7">
        <CustomButton className="px-7 py-4" text="Cancel" type="default" disabled={loading} onClick={onCancel} />
        <CustomButton className="px-7 py-4" text="Apply" type="primary" loading={loading} onClick={() => onApply(orderedProcesses, sequenceLocked)} />
      </div>
    </CustomModal>
  );
};

export default ProcessSequenceModal;
