import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import { Tabs, Tag, Input, Button } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import DetailField from '@/components/ui/common/DetailField';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import Stepper from '@/components/ui/common/Stepper';
import ViewSupportDetailSkeleton from '@/features/homeTab/support/components/ViewSupportDetailSkeleton';

import useModulePermissions from '@/hooks/useModulePermissions';
import { useSupport } from '@/features/homeTab/support';
import { buildSupportStepMeta } from '@/features/homeTab/support/support.ui';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { BUG_STAGES, FEATURE_STAGES, SUPPORT_CATEGORY, SUPPORT_CATEGORY_ENUM, SUPPORT_MODULE_NAME, SUPPORT_PRIORITY, SUPPORT_STATUS, STATUS_CONFIG, PRIORITY_CONFIG } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const { TextArea } = Input;

const renderStatusBadge = status => {
  const statusLabel = SUPPORT_STATUS[status] || status || '-';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CLOSED;
  return <StatusBadge status={status} value={statusLabel} accentHex={config?.color} />;
};

const renderPriorityBadge = priority => {
  const priorityLabel = SUPPORT_PRIORITY[priority] || priority || '-';
  const config = PRIORITY_CONFIG[priority] || {};
  if (!config.color) return priorityLabel;
  return (
    <Tag
      className="m-0"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        fontWeight: 500,
        borderRadius: '4px',
      }}
    >
      {priorityLabel}
    </Tag>
  );
};

const Overview = ({ support }) => {
  const isFeature = support?.category === SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST || support?.category === SUPPORT_CATEGORY_ENUM.NEW_MODULE;
  const stages = isFeature ? FEATURE_STAGES : BUG_STAGES;
  const currentStageIndex = Math.max(
    0,
    stages.findIndex(s => s.key === support?.status)
  );

  return (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Lifecycle</p>
        <div className="mt-3 rounded-lg border border-gray-200 bg-[#FBFCFE] p-3">
          <Stepper current={currentStageIndex} steps={buildSupportStepMeta(stages, support, currentStageIndex)} scrollable truncateTitles />
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Ticket Information</p>
        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Support ID" value={support?.supportId} />
            <DetailField label={isFeature ? 'What do you need?' : 'Bug Title'} value={support?.bugTitle} />
            <DetailField label="Email" value={support?.email} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Status">{support?.status ? renderStatusBadge(support.status) : '-'}</DetailField>
            <DetailField label="Priority">{support?.priority ? renderPriorityBadge(support.priority) : '-'}</DetailField>
            <DetailField label="Category" value={SUPPORT_CATEGORY[support?.category] || support?.category} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Module" value={SUPPORT_MODULE_NAME[support?.moduleName] || support?.moduleName} />
            <DetailField label="Raised By" value={support?.userName} />
            <DetailField label="Created At" value={support?.createdAt ? dayjs(support.createdAt).format('DD MMM YYYY, hh:mm A') : undefined} />
          </div>
        </div>
      </div>

      {isFeature ? (
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Request Details</p>
          <div className="mt-2 space-y-3">
            <DetailField label="Why do you need it?" value={support?.whyDoYouNeedIt} truncate={false} valueClassName="whitespace-pre-wrap" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="How do you manage today?" value={support?.howDoYouManageToday} truncate={false} valueClassName="whitespace-pre-wrap" />
              <DetailField label="What should change?" value={support?.whatShouldChange} truncate={false} valueClassName="whitespace-pre-wrap" />
            </div>
          </div>
        </div>
      ) : (
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Issue Details</p>
          <div className="mt-2 space-y-3">
            {support?.stepsToReproduce?.length > 0 && (
              <div>
                <span className="block font-semibold text-[#64748b] text-[11px] tracking-[0.06em] uppercase">Steps to Reproduce</span>
                <div className="mt-2 space-y-2">
                  {support.stepsToReproduce.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: colorPalette.primary[50], color: colorPalette.primary[600] }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-[13px] font-medium text-[#1e293b] leading-5">{typeof step === 'string' ? step : step?.step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
              <DetailField label="Expected Behavior" value={support?.expectedBehavior} truncate={false} valueClassName="whitespace-pre-wrap" />
              <DetailField label="Actual Behavior" value={support?.actualBehavior} truncate={false} valueClassName="whitespace-pre-wrap" />
            </div>
          </div>
        </div>
      )}

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Attachment</p>
        <div className="mt-2 space-y-3">
          <DetailField label="Documents">{support?.attachments?.length ? <DisplayUploadedDocuments fileArray={support.attachments} /> : '-'}</DetailField>
        </div>
      </div>
    </div>
  );
};

const SupportComments = ({ comments, newComment, setNewComment, onSend, submitLoading, canAddComment, isViewOnly }) => (
  <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
    <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
      <h4 className="m-0 text-base font-semibold text-gray-900">All Comments</h4>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{comments.length}</span>
    </div>

    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-end gap-3">
        <TextArea
          placeholder="Type your comment here..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
          className="flex-1"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={!canAddComment || isViewOnly}
        />
        <PermissionButton
          canAccess={canAddComment}
          isViewOnly={isViewOnly}
          disabled={!newComment.trim() || submitLoading}
          loading={submitLoading}
          type="primary"
          icon={<Icons.SendOutlined />}
          onClick={onSend}
          className="mb-0.5 shrink-0"
          text="Send"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
    </div>

    <div className="p-4 space-y-4">
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <Icons.MessageOutlined style={{ fontSize: 36 }} />
          <p className="mt-2 mb-0">No comments yet</p>
        </div>
      ) : (
        comments.map((comment, index) => {
          const isCurrentUser = comment?.userType === 'USER';
          return (
            <div key={index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className="text-xs text-gray-400 mb-1">{comment.commentTime ? dayjs(comment.commentTime).format('DD MMM YYYY, hh:mm A') : ''}</span>
                <div
                  className={`px-4 py-2 rounded-2xl ${isCurrentUser ? 'text-white rounded-tr-none' : 'text-gray-800 rounded-tl-none'}`}
                  style={{ backgroundColor: isCurrentUser ? colorPalette.primary[500] : colorPalette.secondary[100] }}
                >
                  <p className="text-sm whitespace-pre-wrap m-0">{comment?.description}</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

const SupportDetail = () => {
  const navigate = useNavigate();
  const { supportId } = useParams();
  const { support, loading, getSupportById, submitLoading, sendComment } = useSupport();
  const { useSupport: supportPermissions, isViewOnly } = useModulePermissions(RESOURCES.SUPPORT);
  const canEditSupport = supportPermissions?.canEdit ?? false;

  const [activeKey, setActiveKey] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    if (supportId) getSupportById({ supportId, signal: controller.signal });
    return () => controller.abort();
  }, [supportId]);

  useEffect(() => {
    setComments(support?.commentHistory || []);
  }, [support]);

  const handleRefresh = () => {
    if (!supportId) return;
    getSupportById({ supportId }).catch(() => {});
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isViewOnly || !canEditSupport) return;

    try {
      await sendComment({
        supportId,
        description: newComment,
      });
    } catch (err) {
      if (isCanceledRequestError(err)) return;
      return;
    }

    setComments(prev => [...prev, { description: newComment, commentTime: new Date().toISOString(), userType: 'USER' }]);
    setNewComment('');
  };

  if (loading) {
    return <ViewSupportDetailSkeleton />;
  }

  if (!support) {
    return (
      <NoFoundPage
        title="Support ticket not found"
        description="This support ticket may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/support')}>
            Back To Support
          </Button>
        }
      />
    );
  }

  const tabs = [
    {
      key: 'overview',
      label: 'Overview',
      children: <Overview support={support} />,
    },
    {
      key: 'comments',
      label: 'Comments',
      children: (
        <SupportComments
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onSend={handleAddComment}
          submitLoading={submitLoading}
          canAddComment={canEditSupport}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col min-w-0">
              <h1 className="text-[18px] font-semibold text-gray-900 truncate">{support?.bugTitle || 'Support Detail'}</h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{support?.supportId || '-'}</span>
                {support?.status ? (
                  <>
                    <span className="text-gray-400">•</span>
                    {renderStatusBadge(support.status)}
                  </>
                ) : null}
                {support?.priority ? (
                  <>
                    <span className="text-gray-400">•</span>
                    {renderPriorityBadge(support.priority)}
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <CustomButton icon={<Icons.ReloadOutlined />} text="Refresh" onClick={handleRefresh} />
          </div>
        </div>
      </div>

      <div className="pt-3">
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabs} />
      </div>
    </>
  );
};

export default SupportDetail;
