import { useCallback, useEffect, useState } from 'react';

import { Input } from '@/components/AntDComponent';
import HistoryCommon from '@/components/dataDisplay/statCard/HistoryCommon';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { useAuth } from '@/hooks/useAuth';
import Icons from '@/assets/icons/icon';
import { useComment } from './useComment';
import { mapCommentResponseToHistoryItem } from './comment.utils';

const { TextArea } = Input;

const CommentHistory = ({ moduleName, referenceId, commentHistory = [], canAddComment = true, isViewOnly = false, onCommentAdded, className = '' }) => {
  const { signin } = useAuth();
  const { addComment, submitLoading } = useComment();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(commentHistory);

  useEffect(() => {
    setComments(commentHistory || []);
  }, [referenceId, commentHistory]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !canAddComment || isViewOnly || !moduleName || !referenceId) return;

    const response = await addComment({
      moduleName,
      referenceId,
      message: newComment.trim(),
    });

    const historyItem = mapCommentResponseToHistoryItem(response?.data?.comment, signin?.user);
    if (historyItem) {
      setComments(prev => [...prev, historyItem]);
      onCommentAdded?.(historyItem, response);
    }

    setNewComment('');
  }, [addComment, canAddComment, isViewOnly, moduleName, newComment, onCommentAdded, referenceId, signin?.user]);

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-100 bg-white ${className}`}>
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
                handleAddComment();
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
            onClick={handleAddComment}
            className="mb-0.5 shrink-0"
          >
            Send
          </PermissionButton>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
      </div>

      <div className="px-4 py-4">
        <HistoryCommon data={comments} embedded />
      </div>
    </div>
  );
};

export default CommentHistory;
