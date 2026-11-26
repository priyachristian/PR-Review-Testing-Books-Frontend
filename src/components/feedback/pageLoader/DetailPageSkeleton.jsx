import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const TC = ({ w = '100%', h = 14 }) => (
  <td className="border border-gray-300 py-2.5 px-1">
    <S w={w} h={h} />
  </td>
);

const TEmpty = () => <td className="border border-gray-300 py-2.5 px-1" />;

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

const DetailPageSkeleton = () => (
  <>
    <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4 min-w-0">
          <S w={36} h={36} className="rounded-md flex-shrink-0" />
          <div className="flex flex-col gap-2 min-w-0">
            <S w={180} h={18} />
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <S w={90} h={13} />
              <S w={4} h={4} className="rounded-full" />
              <S w={72} h={22} className="rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <S w={36} h={32} className="rounded-md" />
          <S w={120} h={32} className="rounded-md hidden sm:block" />
          <S w={100} h={32} className="rounded-md" />
          <S w={90} h={32} className="rounded-md" />
        </div>
      </div>
    </div>

    <div className="flex flex-col xl:flex-row xl:justify-between pt-3 gap-4">
      <div className="w-full xl:w-3/4 min-w-0">
        <div className="flex flex-wrap gap-4 sm:gap-6 border-b border-gray-200 pt-3 pb-2 mb-0 px-1">
          {[80, 100, 110, 110, 70].map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <S w={w} h={14} />
              {i === 0 && <div className="h-[2px] rounded-full mt-2" style={{ width: w, background: 'var(--primary-500)' }} />}
            </div>
          ))}
        </div>

        <div className="mb-4" />

        <div className="bg-white rounded-[6px] p-3" style={{ boxShadow: '0px 4px 10px rgba(46,38,61,0.2)' }}>
          <div className="border border-gray-400 p-2">
            <div className="flex flex-col lg:flex-row gap-2 items-start py-2 px-3">
              <div className="w-full lg:w-[45%]">
                <div className="mt-8 mb-2 pt-1 pb-1 border-t border-b border-dashed border-gray-500">
                  <S w={120} h={16} />
                </div>
                <div className="grid grid-cols-[40%_60%] gap-y-[8px] mt-1">
                  {[
                    [70, 90],
                    [80, 100],
                    [85, 130],
                    [90, 110],
                    [60, 80],
                    [65, 120],
                  ].map(([lw, vw], i) => (
                    <React.Fragment key={i}>
                      <S w={lw} h={12} />
                      <S w={vw} h={12} />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-[55%] flex justify-end">
                <div className="flex flex-col items-end gap-[10px]">
                  <S w={40} h={40} className="rounded-sm" />
                  <S w={170} h={16} />
                  <S w={220} h={12} />
                  <S w={190} h={12} />
                  <S w={160} h={12} />
                  <S w={140} h={12} />
                  <S w={170} h={12} />
                  <S w={155} h={12} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row mt-3 border-t border-gray-300">
              {[55, 55, 110].map((titleW, si) => (
                <div key={si} className={`flex-1 border-b border-l border-gray-300 ${si === 2 ? 'border-r border-gray-300' : ''}`}>
                  <div className="px-2 py-1 border-t border-b border-gray-300">
                    <S w={titleW} h={13} />
                  </div>
                  <div className="px-2 py-2 space-y-[8px]">
                    <S w="85%" h={12} />
                    <S w="75%" h={12} />
                    <S w="70%" h={12} />
                    <S w="60%" h={12} />
                    {si === 0 && <S w="50%" h={12} />}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto mt-5">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    {[14, 70, 130, 65, 35, 80, 65, 70].map((w, i) => (
                      <th key={i} className="border border-gray-300 py-2.5 px-1">
                        <S w={w} h={12} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, row) => (
                    <tr key={row}>
                      <TC w={14} />
                      <TC w={row % 2 === 0 ? 55 : 45} />
                      <TC w={row % 3 === 0 ? 140 : 110} />
                      <TC w={55} />
                      <TC w={28} />
                      <TC w={row % 2 === 0 ? 70 : 60} />
                      <TC w={50} />
                      <TC w={row % 2 === 0 ? 65 : 55} />
                    </tr>
                  ))}
                  <tr>
                    <TEmpty />
                    <TEmpty />
                    <TEmpty />
                    <TEmpty />
                    <TC w={28} />
                    <TEmpty />
                    <TEmpty />
                    <TEmpty />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col lg:flex-row lg:justify-between mt-5 gap-2">
              <div className="overflow-x-auto w-full lg:w-[65%]">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50">
                      {[60, 35, 80, 50, 55, 50, 55, 70].map((w, i) => (
                        <th key={i} className="border border-gray-300 px-1 py-2.5">
                          <S w={w} h={12} />
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-gray-50">
                      {[0, 0, 0, 35, 40, 35, 40, 0].map((w, i) => (
                        <th key={i} className="border border-gray-300 px-1 py-2.5">
                          {w > 0 && <S w={w} h={11} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, row) => (
                      <tr key={row}>
                        {[55, 30, 65, 40, 48, 40, 48, 55].map((w, i) => (
                          <td key={i} className="border border-gray-300 px-1 py-2.5">
                            <S w={w} h={12} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-gray-100">
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={40} h={12} />
                      </td>
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={30} h={12} />
                      </td>
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={60} h={12} />
                      </td>
                      <TEmpty />
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={42} h={12} />
                      </td>
                      <TEmpty />
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={42} h={12} />
                      </td>
                      <td className="border border-gray-300 px-1 py-2.5">
                        <S w={50} h={12} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="w-full lg:w-[30%]">
                <div className="border border-gray-300">
                  {[
                    [90, 55],
                    [70, 50],
                    [55, 50],
                    [55, 50],
                    [75, 55],
                    [65, 50],
                    [95, 65],
                  ].map(([lw, vw], i) => (
                    <div key={i} className={`flex justify-between items-center px-2 py-[7px] ${i < 6 ? 'border-b border-gray-300' : ''}`}>
                      <S w={lw} h={12} />
                      <S w={vw} h={i === 6 ? 14 : 12} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mt-5">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    {[90, 90, 70, 90, 90].map((w, i) => (
                      <th key={i} className="border border-gray-300 py-2.5 px-1">
                        <S w={w} h={12} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[80, 70, 65, 80, 80].map((w, i) => (
                      <TC key={i} w={w} />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between mt-5 pt-2">
              <div className="md:w-[60%] space-y-2">
                <S w={140} h={13} />
                <S w="80%" h={11} />
                <S w="72%" h={11} />
                <S w="60%" h={11} />
              </div>
              <div className="md:w-[30%] flex flex-col items-center gap-2 mt-4 md:mt-0">
                <S w={110} h={12} />
                <S w={130} h={40} className="rounded-sm" />
                <S w={120} h={13} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
        <SidebarCard titleWidth={50} rows={5} />
        <MetadataCard />
        <SidebarCard titleWidth={80} rows={2} />
        <SidebarCard titleWidth={100} rows={1} />
      </div>
    </div>
  </>
);

export default DetailPageSkeleton;
