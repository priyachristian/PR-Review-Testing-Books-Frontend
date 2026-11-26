import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Spin } from 'antd';
import dayjs from 'dayjs';

// Components
import { Button } from '@/components/AntDComponent';

// Extras
import { useDevelopmentUpdate } from '@/features/homeTab/developmentUpdate';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

// Static timeline data
const RecentUpdates = () => {
  const navigate = useNavigate();
  const { developmentUpdate, loading, getDevelopmentUpdate } = useDevelopmentUpdate();

  useEffect(() => {
    getDevelopmentUpdate({});
  }, [getDevelopmentUpdate]);

  // Group timeline data by date
  const groupedData = useMemo(() => {
    if (!developmentUpdate || !Array.isArray(developmentUpdate)) return {};

    return developmentUpdate.reduce((acc, item) => {
      const formattedDate = item.date ? dayjs(item.date).format('DD MMMM YYYY') : 'Unknown Date';
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({
        id: item._id,
        date: formattedDate,
        title: item.title,
        description: item.description,
      });
      return acc;
    }, {});
  }, [developmentUpdate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 -mx-4 -mt-8 mb-4 sticky-page-header z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button type="text" icon={<Icons.ArrowLeftOutlined />} onClick={() => navigate(-1)} className="flex items-center" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 m-0">Recent Updates</h1>
              <p className="text-xs sm:text-sm text-gray-500 m-0 mt-1 hidden sm:block">Stay up to date with the latest features and improvements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Timeline Section */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 order-2 lg:order-1">
          {/* Tab indicator */}
          <div className="mb-6 border-b-2 inline-block pb-2" style={{ borderColor: colorPalette.primary[500] }}>
            <span className="text-sm font-semibold" style={{ color: colorPalette.primary[500] }}>
              What's New
            </span>
          </div>

          {/* Timeline */}
          <div className="relative">
            {loading ? (
              <div className="flex justify-center p-8">
                <Spin size="large" />
              </div>
            ) : Object.keys(groupedData).length === 0 ? (
              <Empty description="No recent updates found." />
            ) : (
              Object.entries(groupedData).map(([date, items], groupIndex) => (
                <div key={date} className="relative">
                  {items.map((item, itemIndex) => {
                    const isFirst = groupIndex === 0 && itemIndex === 0;
                    return (
                      <div key={item.id} className="relative pl-8 pb-10">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[7px] top-[14px] bottom-0 w-[2px]" style={{ backgroundColor: colorPalette.primary[100] }} />

                        {/* Timeline dot */}
                        <div
                          className="absolute left-0 top-[6px] w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center z-5"
                          style={{
                            borderColor: isFirst ? colorPalette.primary[500] : colorPalette.primary[200],
                            backgroundColor: isFirst ? colorPalette.primary[500] : '#ffffff',
                          }}
                        >
                          {isFirst && <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#ffffff' }} />}
                        </div>

                        {/* Content */}
                        <div>
                          {/* Show date only for first item in each group */}
                          {itemIndex === 0 && <p className="text-sm text-gray-400 mb-2 font-medium">{date}</p>}
                          <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed m-0 whitespace-pre-line">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}

            {/* End of timeline */}
            <div className="relative pl-8">
              <div
                className="absolute left-0 top-0 w-[16px] h-[16px] rounded-full border-2"
                style={{
                  borderColor: colorPalette.primary[100],
                  backgroundColor: colorPalette.primary[50],
                }}
              />
              <p className="text-sm text-gray-400 italic">You're all caught up!</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[320px] flex-shrink-0 order-1 lg:order-2 mt-6">
          <div className="lg:sticky lg:top-[160px] space-y-4 sm:space-y-5">
            {/* Help Resources Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Card image area */}
              <div className="h-40 flex items-center justify-center" style={{ backgroundColor: colorPalette.primary[50] }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: colorPalette.primary[100] }}>
                    <Icons.BookOutlined className="text-2xl" style={{ color: colorPalette.primary[500] }} />
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colorPalette.primary[100] }}>
                        <Icons.FileTextOutlined className="text-xs" style={{ color: colorPalette.primary[400] }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.BookOutlined style={{ color: colorPalette.primary[500] }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colorPalette.primary[500] }}>
                    Help Resources
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Want to understand how ABSS Books works?</h3>
                <p className="text-sm text-gray-500 mb-4">Read our help resources to understand ABSS Books in-depth and how you can make the most of the features.</p>
                <div className="flex items-center gap-3">
                  <Button
                    type="primary"
                    size="small"
                    icon={<Icons.ExportOutlined />}
                    style={{
                      backgroundColor: colorPalette.primary[500],
                      borderColor: colorPalette.primary[500],
                    }}
                  >
                    Visit Help Doc
                  </Button>
                  <Button type="link" size="small" style={{ color: colorPalette.primary[500] }}>
                    FAQ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentUpdates;
