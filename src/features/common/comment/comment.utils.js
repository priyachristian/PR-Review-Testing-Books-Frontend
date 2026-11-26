export const mapCommentResponseToHistoryItem = (comment, user) => {
  if (!comment) return null;

  return {
    _id: comment._id || comment.createdAt,
    message: comment.message,
    createdAt: comment.createdAt,
    addedBy:
      typeof comment.addedBy === 'object' && comment.addedBy !== null
        ? comment.addedBy
        : {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
          },
  };
};
