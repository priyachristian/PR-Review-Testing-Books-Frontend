import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const NotificationItemSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-50">
    <S w={8} h={8} className="flex-shrink-0 mt-1.5 rounded-full" />
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <S w="55%" h={13} />
      <S w="80%" h={12} />
      <S w="30%" h={10} />
    </div>
  </div>
);

export const SkeletonList = ({ count }) => (
  <>
    <div className="divide-y divide-gray-50">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  </>
);

export default NotificationItemSkeleton;
