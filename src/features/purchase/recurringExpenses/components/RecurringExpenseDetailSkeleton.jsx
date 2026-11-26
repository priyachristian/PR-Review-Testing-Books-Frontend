import React from 'react';

const S = ({ w, h = 14, className = '' }) => <div className={`ds-shimmer ${className}`} style={{ width: w, height: h }} />;

const RecurringExpenseDetailSkeleton = () => {
  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <S w={32} h={32} className="rounded-full flex-shrink-0 bg-gray-50" />
            <div className="flex flex-col gap-2">
              <S w={220} h={20} />
              <div className="flex items-center space-x-2 mt-1">
                <S w={60} h={14} />
                <S w={70} h={20} className="rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 hidden md:flex">
            <S w={100} h={32} className="rounded-md" />
            <S w={140} h={32} className="rounded-md" />
            <S w={110} h={32} className="rounded-md" />
            <S w={80} h={32} className="rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between mt-4">
        <div className="w-full xl:w-3/4 pt-3">
          {/* Mock Tabs */}
          <div className="flex space-x-8 border-b border-gray-200 mb-6">
            <div className="pb-3 border-b-2 border-blue-500">
              <S w={60} h={14} />
            </div>
            <div className="pb-3">
              <S w={80} h={14} />
            </div>
            <div className="pb-3">
              <S w={50} h={14} />
            </div>
            <div className="pb-3">
              <S w={120} h={14} />
            </div>
          </div>

          <div className="space-y-10">
            <div className="my-container container-spacing bg-white border border-gray-100 rounded-md">
              <div className="flex justify-between items-center mb-6">
                <S w={160} h={20} />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                {[
                  [120, 60], // Id
                  [80, 100], // Profile
                  [100, 120], // Customer
                  [70, 90], // Start Date
                  [60, 90], // End Date
                  [90, 60], // Repeat
                  [100, 110], // Payment
                  [130, 90], // Next execution
                ].map(([lw, vw], i) => (
                  <div key={i}>
                    <S w={lw} h={12} className="mb-2" />
                    <S w={vw} h={16} />
                  </div>
                ))}
              </div>
            </div>

            <div className="my-container container-spacing bg-white border border-gray-100 rounded-md">
              <S w={100} h={20} className="mb-4" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3 px-4 text-left">
                        <S w={100} h={12} />
                      </th>
                      <th className="py-3 px-4 text-left">
                        <S w={80} h={12} />
                      </th>
                      <th className="py-3 px-4 text-left">
                        <S w={40} h={12} />
                      </th>
                      <th className="py-3 px-4 text-left">
                        <S w={50} h={12} />
                      </th>
                      <th className="py-3 px-4 text-left">
                        <S w={70} h={12} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 2 }).map((_, row) => (
                      <tr key={row} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <S w={80} h={14} className="mb-1" />
                        </td>
                        <td className="py-4 px-4">
                          <S w={200} h={14} className="mb-1" />
                        </td>
                        <td className="py-4 px-4">
                          <S w={30} h={14} />
                        </td>
                        <td className="py-4 px-4">
                          <S w={50} h={14} />
                        </td>
                        <td className="py-4 px-4">
                          <S w={60} h={14} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <div className="w-full md:w-1/3 space-y-3">
                  {[
                    [80, 60],
                    [80, 50],
                    [80, 60],
                    [100, 70],
                  ].map(([lw, vw], i) => (
                    <div key={i} className={`flex justify-between ${i === 3 ? 'border-t pt-3' : ''}`}>
                      <S w={lw} h={i === 3 ? 16 : 14} />
                      <S w={vw} h={i === 3 ? 16 : 14} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="my-container container-spacing bg-white border border-gray-100 rounded-md">
              <S w={120} h={20} className="mb-4" />
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <S w={100} h={12} className="mb-2" />
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <S w="80%" h={14} className="mb-2" />
                    <S w="60%" h={14} />
                  </div>
                </div>
                <div>
                  <S w={130} h={12} className="mb-2" />
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <S w="90%" h={14} className="mb-2" />
                    <S w="70%" h={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-4 mt-4">
          {/* Mock Action Buttons */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <S w={60} h={14} />
            </div>
            <div className="p-4">
              <S w="100%" h={32} className="rounded-md border border-gray-200 bg-gray-50" />
            </div>
          </div>

          {/* Mock Document Metadata */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-2">
              <S w={14} h={14} className="rounded-full flex-shrink-0" />
              <S w={120} h={14} />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <S w={60} h={12} />
                <S w={80} h={12} />
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <S w={60} h={12} />
                <S w={70} h={12} />
              </div>
              <div className="flex justify-between items-center">
                <S w={60} h={12} />
                <S w={80} h={12} />
              </div>
              <div className="flex justify-between items-center">
                <S w={60} h={12} />
                <S w={70} h={12} />
              </div>
            </div>
          </div>

          {/* Mock Organization Info */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <S w={80} h={14} />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <S w={50} h={12} />
                <S w={70} h={12} />
              </div>
              <div className="flex justify-between items-center">
                <S w={50} h={12} />
                <S w={70} h={12} />
              </div>
              <div className="flex justify-between items-center">
                <S w={60} h={12} />
                <S w={80} h={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecurringExpenseDetailSkeleton;
