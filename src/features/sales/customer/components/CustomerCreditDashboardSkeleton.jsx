import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const CreditCardSkeleton = () => (
  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 space-y-3">
    <S w="55%" h={12} />
    <S w="75%" h={24} />
    <S w="100%" h={12} />
    <S w="90%" h={12} />
    <S w="65%" h={12} />
  </div>
);

const CustomerCreditDashboardSkeleton = () => (
  <div className="pt-4">
    <S w={280} h={16} className="mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <CreditCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default CustomerCreditDashboardSkeleton;
