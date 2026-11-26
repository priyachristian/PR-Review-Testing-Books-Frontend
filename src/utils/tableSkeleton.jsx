/** Column-aware skeleton cells so list tables match real column shapes. */
export const renderTableSkeletonCell = col => {
  const key = String(col?.dataIndex || col?.key || '').toLowerCase();
  const title = typeof col?.title === 'string' ? col.title.toLowerCase() : key;

  if (title.includes('action') || key.includes('action')) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="skeleton-shimmer shrink-0" style={{ width: 16, height: 16, borderRadius: 4 }} />
        <div className="skeleton-shimmer shrink-0" style={{ width: 16, height: 16, borderRadius: 4 }} />
        <div className="skeleton-shimmer shrink-0" style={{ width: 16, height: 16, borderRadius: 4 }} />
      </div>
    );
  }

  if (title.includes('status') || key.includes('status') || key.includes('priority') || title.includes('priority')) {
    return <div className="skeleton-shimmer" style={{ width: 72, height: 22, borderRadius: 6 }} />;
  }

  if (title.includes('#') || key.endsWith('id') || key.includes('number') || title.includes(' no') || title.endsWith(' no') || title.includes('no.')) {
    return <div className="skeleton-shimmer" style={{ width: 88, height: 22, borderRadius: 4 }} />;
  }

  if (title.includes('amount') || key.includes('amount') || key.includes('total') || title.includes('total') || key.includes('price') || key.includes('balance')) {
    return <div className="skeleton-shimmer ml-auto" style={{ width: '55%', height: 14 }} />;
  }

  if (title.includes('date') || key.includes('date')) {
    return <div className="skeleton-shimmer" style={{ width: 88, height: 14 }} />;
  }

  return <div className="skeleton-shimmer" style={{ width: '78%', height: 14 }} />;
};
