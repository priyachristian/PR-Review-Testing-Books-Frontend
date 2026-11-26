import dayjs from 'dayjs';

import { Tooltip } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomButton from '@/components/ui/button/CustomButton';
import Stepper from '@/components/ui/common/Stepper';
import Icons from '@/assets/icons/icon';
import { BUG_STAGES, FEATURE_STAGES, SUPPORT_CATEGORY_ENUM, SUPPORT_MODULE_NAME, SUPPORT_PRIORITY, SUPPORT_STATUS, SUPPORT_STATUS_ENUM } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

export const SUPPORT_LIFECYCLE_STAGES = FEATURE_STAGES;

const formatStepDays = days => `${days} day${days === 1 ? '' : 's'}`;

export const buildSupportStepMeta = (stages, support, currentStageIndex) => {
  const history = support?.statusHistory || [];
  const isClosed = support?.status === SUPPORT_STATUS_ENUM.CLOSED;

  if (!support || !history.length) {
    return stages.map(stage => ({ title: stage.title, key: stage.key }));
  }

  const dateMap = {};
  history.forEach(item => {
    if (item?.status && item?.changedAt) {
      dateMap[item.status] = dayjs(item.changedAt);
    }
  });

  const createdDate = support?.createdAt ? dayjs(support.createdAt) : dayjs();
  let prevDate = createdDate;

  return stages.map((stage, index) => {
    const base = { title: stage.title, key: stage.key };

    if (index > currentStageIndex) return base;

    const currDate = dateMap[stage.key] || prevDate;
    const diffDays = Math.max(1, currDate.diff(prevDate, 'day'));
    const isCurrentActive = index === currentStageIndex && !isClosed;

    prevDate = currDate;

    return {
      ...base,
      date: isCurrentActive ? `since ${currDate.format('DD MMM')}` : currDate.format('DD MMM'),
      days: index === 0 ? undefined : formatStepDays(diffDays),
      daysHighlight: index === 0 ? false : diffDays > 3,
    };
  });
};

export const SUPPORT_TICKET_TYPES = {
  [SUPPORT_CATEGORY_ENUM.BUG]: {
    label: 'Bug',
    desc: 'Something already built is not working the way it should.',
    icon: Icons.ToolOutlined,
    color: colorPalette.error[500],
    soft: colorPalette.error[50],
    route: ['Raised', 'Handover to Development', 'In Development', 'PM Review', 'User Training', 'Closed'],
  },
  [SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST]: {
    label: 'Change Request',
    desc: 'An existing module works, but it has to behave differently.',
    icon: Icons.DiffOutlined,
    color: colorPalette.warning[600],
    soft: colorPalette.warning[50],
    route: ['Raised', 'Requirement Gathering', 'Screen Design', 'Director Review', 'Handover to Development', 'Developer Review', 'In Development', 'PM Review', 'User Training', 'Closed'],
  },
  [SUPPORT_CATEGORY_ENUM.NEW_MODULE]: {
    label: 'New Module',
    desc: 'Something the ERP does not have at all today.',
    icon: Icons.FileAddOutlined,
    color: '#6D3FC4',
    soft: '#EFE8FB',
    route: ['Raised', 'Requirement Gathering', 'Screen Design', 'Director Review', 'Handover to Development', 'Developer Review', 'In Development', 'PM Review', 'User Training', 'Closed'],
  },
};

export const buildSupportSummary = record => {
  const raised = record?.createdAt ? dayjs(record.createdAt).format('DD MMM YYYY') : '—';
  const user = record?.userName || '—';
  const module = SUPPORT_MODULE_NAME[record?.moduleName] || record?.moduleName || '—';
  const status = SUPPORT_STATUS[record?.status] || record?.status || '—';
  const priority = SUPPORT_PRIORITY[record?.priority] || record?.priority || '—';
  const ageDays = record?.createdAt ? dayjs().diff(dayjs(record.createdAt), 'day') : null;
  const ageText = ageDays != null ? `${ageDays} day${ageDays === 1 ? '' : 's'} old` : '';

  return `Raised ${raised} by ${user}${ageText ? `. ${ageText}` : ''}. Currently ${status} in ${module} (${priority} priority).`;
};

const isFeatureTicket = record => record?.category === SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST || record?.category === SUPPORT_CATEGORY_ENUM.NEW_MODULE;

export const SupportLifecycleModal = ({ open, record, onClose, onOpenTicket }) => {
  if (!record) return null;

  const isFeature = isFeatureTicket(record);
  const stages = isFeature ? FEATURE_STAGES : BUG_STAGES;
  const currentStageIndex = Math.max(
    0,
    stages.findIndex(s => s.key === record?.status)
  );

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={isOpen => {
        if (!isOpen) onClose?.();
      }}
      title={record?.supportId ? `Lifecycle — ${record.supportId}` : 'Ticket lifecycle'}
      width={480}
      destroyOnClose
    >
      <p className="text-[13px] text-gray-600 leading-relaxed mb-4 m-0">{buildSupportSummary(record)}</p>
      <div className="rounded-lg border border-gray-200 bg-[#FBFCFE] px-4 py-4">
        <Stepper direction="vertical" current={currentStageIndex} steps={buildSupportStepMeta(stages, record, currentStageIndex)} />
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
        <CustomButton type="default" text="Close" onClick={onClose} />
        <CustomButton type="primary" text="Open ticket" icon={<Icons.RightOutlined />} onClick={() => onOpenTicket?.(record)} />
      </div>
    </CustomModal>
  );
};

export const SupportKpiCard = ({ label, value, loading, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full h-full border-0 border-r border-b border-gray-200 p-3 sm:p-4 select-none transition-all duration-150 relative text-left appearance-none cursor-pointer hover:bg-gray-50/90 ${
      active ? 'bg-[#EBF5FA] shadow-xs' : 'bg-white'
    }`}
    style={
      active
        ? {
            borderBottom: `3px solid ${colorPalette.primary[500]}`,
          }
        : undefined
    }
  >
    <div className="space-y-1">
      <Tooltip title={label}>
        <p className={`text-[11px] sm:text-[14px] font-medium uppercase tracking-wide line-clamp-1 m-0 transition-colors ${active ? 'text-primary font-bold' : 'text-gray-500'}`}>{label}</p>
      </Tooltip>

      {loading ? (
        <div className="h-7 w-24 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className={`text-sm sm:text-base font-bold leading-tight m-0 tabular-nums transition-colors ${active ? 'text-primary' : 'text-gray-900'}`}>{value ?? 0}</p>
      )}
    </div>
  </button>
);
