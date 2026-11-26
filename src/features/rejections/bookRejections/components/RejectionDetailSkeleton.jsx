import React from 'react';

const S = ({ w, h = 14, round, style: inlineStyle }) => <div className="ds-shimmer" style={{ width: w, height: h, borderRadius: round ? 9999 : 4, ...inlineStyle }} />;

export default function RejectionDetailSkeleton() {
  return (
    <>
      {/* ── Fixed header - mirrors: fixed-header fixed top-14 ml-[1px] -mt-[16px] bg-white py-2 border-b z-10 ── */}
      <div className="fixed-header fixed top-14 ml-[1px] -mt-[16px] bg-white py-2 border-b z-10">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          {/* Left: back btn + order number + badge */}
          <div className="flex items-center space-x-4">
            {/* BackButton: text button 32×32 */}
            <S w={32} h={32} round />
            <div className="flex items-center gap-2">
              {/* h1 text-[18px] order number */}
              <S w={150} h={20} />
              {/* RejBadge pill */}
              <S w={80} h={22} round />
            </div>
          </div>
          {/* Right: optional convert badge (empty during load is fine) */}
          <S w={0} h={0} />
        </div>
      </div>

      {/* ── Body - mirrors: bg-white pt-16 -m-4 ── */}
      <div className="bg-white pt-16 -m-4">
        <div className="px-4">
          {/* ── Info + stepper card - mirrors Ant Design Card with p-6 (24px) ── */}
          <div className="border border-gray-200 rounded-lg mb-3.5" style={{ padding: 24 }}>
            {/* Customer line: text-[13.5px] */}
            <div className="flex items-center gap-2 flex-wrap">
              <S w={160} h={14} />
              <S w={6} h={6} round />
              <S w={16} h={14} />
              <S w={110} h={13} />
              <S w={6} h={6} round />
              <S w={80} h={13} />
            </div>

            {/* Stepper: flex mt-[18px] - 6 steps matching FLOW */}
            <div className="flex mt-[18px]">
              {[60, 72, 88, 50, 58, 62].map((labelW, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center gap-[5px] flex-none">
                    {/* circle: w-[27px] h-[27px] rounded-[20px] */}
                    <S w={27} h={27} style={{ borderRadius: 20 }} />
                    {/* label: text-[10.5px] */}
                    <S w={labelW} h={10} />
                  </div>
                  {/* connector bar: h-[3px] mx-1 mb-[18px] - between steps only */}
                  {i < 5 && (
                    <div className="flex-1 mx-1 mb-[18px]">
                      <S w="100%" h={3} style={{ borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Step content card - mirrors ActionBlock (Card mb-3.5 with p-6) ── */}
          <div className="border border-gray-200 rounded-lg mb-3.5" style={{ padding: 24 }}>
            {/* Title: font-bold text-base */}
            <S w={200} h={16} style={{ marginBottom: 6 }} />
            {/* Desc: text-[13px] mb-4 */}
            <S w={340} h={13} style={{ marginBottom: 24 }} />

            {/* Table header row - Item (wide) + Watt + Booked Qty */}
            <div className="flex gap-4 mb-2 pb-2 border-b border-gray-100">
              <S w="50%" h={11} />
              <S w={80} h={11} />
              <S w={90} h={11} />
            </div>

            {/* Table rows */}
            {[0, 1, 2].map(r => (
              <div key={r} className="flex gap-4 py-3 border-b border-gray-50">
                <S w="50%" h={14} />
                <S w={80} h={14} />
                <S w={90} h={14} />
              </div>
            ))}

            {/* Action button: mt-3.5 */}
            <S w={160} h={34} style={{ marginTop: 14, borderRadius: 6 }} />
          </div>
        </div>
      </div>
    </>
  );
}
