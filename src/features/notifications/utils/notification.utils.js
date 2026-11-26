const objectIdToDate = id => {
  if (!id || id.length < 8) return null;
  const ts = parseInt(id.substring(0, 8), 16) * 1000;
  return isNaN(ts) ? null : new Date(ts);
};

export const formatTimeAgo = (isoString, objectId) => {
  const date = isoString ? new Date(isoString) : objectIdToDate(objectId);
  if (!date || isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return 'Just now';

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
