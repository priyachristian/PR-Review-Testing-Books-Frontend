import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;
const SidebarCard = ({ titleWidth = 60, rows = 4 }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={titleWidth} h={12} />
    </div>
    <div className="p-3 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <S key={i} w="100%" h={32} className="rounded-md" />
      ))}
    </div>
  </div>
);

const MetadataCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <S w={130} h={12} />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <S w={65} h={12} />
          <S w={90} h={12} />
        </div>
      ))}
    </div>
  </div>
);
// actionRows / showExtraSidebarCards let other payment detail pages (e.g. Customer Payment) reuse
// this skeleton with their own side panel; defaults match Payment Received.
const PaymentReceivedDetailSkeleton = ({ actionRows = 5, showExtraSidebarCards = true }) => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <S w={32} h={32} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col">
            <S w={220} h={18} />
            <div className="flex items-center space-x-2 mt-2">
              <S w={110} h={12} />
              <S w={4} h={4} className="rounded-full" />
              <S w={72} h={22} className="rounded-full" />
              <S w={4} h={4} className="rounded-full" />
              <S w={88} h={12} />
              <S w={80} h={12} />
            </div>
          </div>
        </div>
        <S w={140} h={32} className="rounded-md" />
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-3 gap-4">
      <div className="w-full xl:w-3/4">
        <div className="flex gap-6 border-b border-gray-200 pt-3 pb-2 mb-4 px-1">
          {[90, 110, 110, 80].map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <S w={w} h={14} />
              {i === 0 && <div className="h-[2px] rounded-full mt-2" style={{ width: w, background: 'var(--primary-500, #1677ff)' }} />}
            </div>
          ))}
        </div>

        <div className="my-container p-6 space-y-5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <S w={140} h={14} />
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <S w={90} h={12} />
                    <S w="80%" h={14} />
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <S w={60} h={12} />
                <S w="95%" h={14} />
                <S w="75%" h={14} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <S w={120} h={14} />
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <S w={110} h={12} />
                    <S w="70%" h={14} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <S w={140} h={14} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <th key={i} className="text-left py-4 px-6">
                        <S w={i === 0 ? 80 : 70} h={12} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, r) => (
                    <tr key={r}>
                      {Array.from({ length: 6 }).map((_, c) => (
                        <td key={c} className="py-4 px-6">
                          <S w={c === 0 ? 90 : '70%'} h={12} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <SidebarCard titleWidth={50} rows={actionRows} />
        <MetadataCard />
        {showExtraSidebarCards && (
          <>
            <SidebarCard titleWidth={80} rows={2} />
            <SidebarCard titleWidth={100} rows={1} />
          </>
        )}
      </div>
    </div>
  </>
);

export default PaymentReceivedDetailSkeleton;
