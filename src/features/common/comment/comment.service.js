import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const addComment = withErrorHandling(async payload => {
  const { moduleName, referenceId, message } = payload;
  const response = await axiosConfig.post(API_ROUTES.COMMENT.CREATE, {
    moduleName,
    referenceId,
    message,
  });
  return response.data;
}, 'addComment');

export const commentService = {
  addComment,
};
