import { useState } from 'react';
import dayjs from 'dayjs';

import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';

import { COMPLAINT_STATUS } from '../complaint.constants';

const ComplaintFullHistory = ({ complaint }) => {
  const [expanded, setExpanded] = useState(true);
  const history = Array.isArray(complaint?.history) ? complaint.history : [];
  const entryCount = history.length;
  const latestEntryId = entryCount > 0 ? history[entryCount - 1]?._id : null;

  return (
    <div className="my-container container-spacing">
      <button type="button" className="w-full flex items-start justify-between gap-3 text-left bg-transparent border-0 p-0 cursor-pointer" onClick={() => setExpanded(open => !open)}>
        <div className="flex items-center gap-2 min-w-0">
          <Icons.ClockCircleOutlined className="text-base" style={{ color: colorPalette.secondary[500] }} />
          <p className="font-bold text-lg m-0" style={{ color: colorPalette.secondary[900] }}>
            Full history
          </p>
        </div>
        <span className="inline-flex items-center gap-1 shrink-0 text-sm" style={{ color: colorPalette.secondary[500] }}>
          {entryCount} entries
          <Icons.DownOutlined className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {expanded ? (
        <>
          {entryCount > 0 ? (
            <div className="mt-4 divide-y divide-gray-100">
              {history.map(entry => {
                const statusMeta = COMPLAINT_STATUS[entry.step];
                const isLatest = entry._id === latestEntryId;

                return (
                  <div key={entry._id} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 sm:gap-6 py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-[15px] font-bold m-0" style={{ color: isLatest ? statusMeta?.color || colorPalette.primary[500] : colorPalette.secondary[900] }}>
                        {statusMeta?.label || entry.step}
                      </p>
                      <p className="text-sm m-0 mt-0.5" style={{ color: colorPalette.secondary[500] }}>
                        {dayjs(entry.createdAt).format('DD/MM/YYYY')}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm m-0" style={{ color: colorPalette.secondary[500] }}>
                        {entry.action} · {entry.addedBy?.name}
                      </p>
                      <p className="text-sm m-0 mt-0.5" style={{ color: colorPalette.secondary[500] }}>
                        {entry.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm m-0 mt-4" style={{ color: colorPalette.secondary[400] }}>
              No history yet.
            </p>
          )}

          {entryCount > 0 ? (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold m-0 mb-2" style={{ color: colorPalette.secondary[500] }}>
                Every entry
              </p>
              <div className="space-y-2">
                {history.map(entry => (
                  <p key={entry._id} className="text-sm m-0 leading-5" style={{ color: colorPalette.secondary[500] }}>
                    <span className="font-semibold" style={{ color: colorPalette.secondary[700] }}>
                      {dayjs(entry.createdAt).format('DD/MM/YYYY')} · {entry.action}
                    </span>
                    {' — '}
                    {entry.description} ({entry.addedBy?.name})
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default ComplaintFullHistory;
