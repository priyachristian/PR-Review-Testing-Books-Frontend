import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { DatePicker, Input, Select, Tooltip } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import { useUser } from '@/features/setting/user/useUser';
import { mapUsersToSelectOptions } from '@/features/complaint/problemList/problemList.utils';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';
import useModulePermissions from 'hooks/useModulePermissions';

import { useComplaint } from '../useComplaint';
import { COMPLAINT_STATUS } from '../complaint.constants';

const emptyTaskDraft = () => ({ title: '', assigneeId: undefined, dueDate: null });

const ComplaintTeamOnly = ({ complaint }) => {
  const complaintId = complaint?._id;
  const { isViewOnly } = useModulePermissions(RESOURCES.COMPLAINT);
  const isNotRealComplaint = Boolean(complaint?.isNotRealComplaint);
  const isClosed = complaint?.currentStep === COMPLAINT_STATUS.CLOSED.key || Boolean(complaint?.isClosed);
  const canAddTeamContent = !isNotRealComplaint && !isClosed;
  const { submitLoading, addTeamNote, addTeamTask, updateTeamTask } = useComplaint();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  const [showAddTask, setShowAddTask] = useState(true);
  const [taskDraft, setTaskDraft] = useState(emptyTaskDraft);
  const [noteDraft, setNoteDraft] = useState('');
  const [togglingTaskId, setTogglingTaskId] = useState(null);

  useEffect(() => {
    if (!canAddTeamContent) return undefined;
    const controller = new AbortController();
    getUsersDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [getUsersDropdown, canAddTeamContent]);

  const personOptions = useMemo(() => mapUsersToSelectOptions(usersDropdown), [usersDropdown]);

  const tasks = Array.isArray(complaint?.teamTasks) ? complaint.teamTasks : [];
  const notes = Array.isArray(complaint?.teamNotes) ? complaint.teamNotes : [];
  const openCount = tasks.filter(task => !task.isDone).length;

  const resetTaskDraft = () => setTaskDraft(emptyTaskDraft());

  const handleCancelAddTask = () => {
    resetTaskDraft();
    setShowAddTask(false);
  };

  const handleAddTask = async () => {
    if (!canAddTeamContent || isViewOnly) return;
    const title = taskDraft.title.trim();
    if (!title) {
      Toast.warning('Please say what needs doing.');
      return;
    }
    if (!taskDraft.assigneeId) {
      Toast.warning('Please pick who will do it.');
      return;
    }
    if (!taskDraft.dueDate) {
      Toast.warning('Please pick a due date.');
      return;
    }
    if (!complaintId) return;

    try {
      await addTeamTask({
        complaintId,
        data: {
          title,
          assignedTo: taskDraft.assigneeId,
          dueDate: dayjs(taskDraft.dueDate).format('YYYY-MM-DD'),
        },
      });
      resetTaskDraft();
    } catch {
      // Slice already toasts the error; keep the form open.
    }
  };

  const toggleTaskDone = async task => {
    if (isViewOnly || isNotRealComplaint || !complaintId || !task?._id || togglingTaskId) return;

    setTogglingTaskId(task._id);
    try {
      await updateTeamTask({
        complaintId,
        taskId: task._id,
        data: { isDone: !task.isDone },
      });
    } catch {
      // Slice already toasts the error.
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handlePostNote = async () => {
    if (!canAddTeamContent || isViewOnly) return;
    const text = noteDraft.trim();
    if (!text) {
      Toast.warning('Please write a note first.');
      return;
    }
    if (!complaintId) return;

    try {
      await addTeamNote({
        complaintId,
        data: { text },
      });
      setNoteDraft('');
    } catch {
      // Slice already toasts the error; keep the form open.
    }
  };

  return (
    <div className="my-container container-spacing">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5 min-w-0">
          <Icons.LockOutlined className="mt-0.5 text-base" style={{ color: colorPalette.primary[500] }} />
          <div className="min-w-0">
            <p className="font-bold text-lg m-0" style={{ color: colorPalette.secondary[900] }}>
              Team only
            </p>
            <p className="text-sm m-0 mt-0.5" style={{ color: colorPalette.secondary[500] }}>
              The customer never sees any of this.
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-0.5 rounded-md text-xs font-semibold" style={{ backgroundColor: colorPalette.primary[50], color: colorPalette.primary[600] }}>
          {openCount} to do
        </span>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-bold text-[15px] m-0" style={{ color: colorPalette.secondary[900] }}>
            Tasks
          </p>
          {!canAddTeamContent ? null : showAddTask ? (
            <CustomButton type="default" size="small" text="Cancel" onClick={handleCancelAddTask} />
          ) : (
            <CustomButton type="default" size="small" icon={<Icons.PlusOutlined />} text="Add" onClick={() => setShowAddTask(true)} />
          )}
        </div>

        <div className="space-y-3 mb-3">
          {tasks.length === 0 ? (
            <p className="text-sm m-0" style={{ color: colorPalette.secondary[400] }}>
              No tasks yet.
            </p>
          ) : (
            tasks.map(task => {
              const isToggling = togglingTaskId === task._id;

              return (
                <div key={task._id} className="flex items-start gap-2.5">
                  <Tooltip title={isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : undefined}>
                    <span className="inline-flex">
                      <button
                        type="button"
                        aria-label={task.isDone ? 'Mark task open' : 'Mark task done'}
                        disabled={isViewOnly || isNotRealComplaint || isToggling || submitLoading}
                        onClick={() => toggleTaskDone(task)}
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center disabled:opacity-60 ${
                          task.isDone ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {task.isDone ? <Icons.CheckOutlined className="text-white text-[10px]" /> : null}
                      </button>
                    </span>
                  </Tooltip>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold m-0 ${task.isDone ? 'line-through text-gray-400' : ''}`} style={task.isDone ? undefined : { color: colorPalette.secondary[900] }}>
                      {task.title}
                    </p>
                    <p className="text-xs m-0 mt-0.5" style={{ color: colorPalette.secondary[500] }}>
                      {task.assignedTo?.name} · due {dayjs(task.dueDate).format('DD-MM-YYYY')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!canAddTeamContent || !showAddTask ? null : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2.5">
            <Input placeholder="What needs doing" value={taskDraft.title} onChange={e => setTaskDraft(prev => ({ ...prev, title: e.target.value }))} allowClear />
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Select
                allowClear
                placeholder={usersDropdownLoading ? 'Loading people…' : 'Who will do it'}
                options={personOptions}
                value={taskDraft.assigneeId}
                onChange={value => setTaskDraft(prev => ({ ...prev, assigneeId: value }))}
                loading={usersDropdownLoading}
                className="w-full"
              />
              <DatePicker allowClear placeholder="By when" format="DD-MM-YYYY" value={taskDraft.dueDate} onChange={date => setTaskDraft(prev => ({ ...prev, dueDate: date }))} className="w-full" />
              <PermissionButton isViewOnly={isViewOnly} type="primary" icon={<Icons.PlusOutlined />} text="Add task" loading={submitLoading} onClick={handleAddTask} className="w-full sm:w-auto" />
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="font-bold text-[15px] m-0 mb-3" style={{ color: colorPalette.secondary[900] }}>
          Notes
        </p>

        <div className={`space-y-3 ${canAddTeamContent ? 'mb-3' : ''}`}>
          {notes.length === 0 ? (
            <p className="text-sm m-0" style={{ color: colorPalette.secondary[400] }}>
              No notes yet.
            </p>
          ) : (
            notes.map(note => (
              <div key={note._id}>
                <p className="text-xs m-0 mb-0.5" style={{ color: colorPalette.secondary[500] }}>
                  {note.addedBy?.name} · {dayjs(note.createdAt).format('DD/MM/YYYY')}
                </p>
                <p className="text-sm m-0" style={{ color: colorPalette.secondary[800] }}>
                  {note.text}
                </p>
              </div>
            ))
          )}
        </div>

        {!canAddTeamContent ? null : (
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
            <Input.TextArea placeholder="Write a note for the team" value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={3} className="flex-1" />
            <PermissionButton isViewOnly={isViewOnly} type="primary" icon={<Icons.SendOutlined />} text="Post" loading={submitLoading} onClick={handlePostNote} className="sm:self-end" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintTeamOnly;
