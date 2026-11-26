import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/AntDComponent';
import { MODULE_NAMES_LABELS } from '@/utils/constants';
import { getModuleListPath } from '@/routes/adminRoutePaths';

const NoFoundPage = ({ docType, title, description, action }) => {
  const navigate = useNavigate();
  const docLabel = MODULE_NAMES_LABELS?.[docType] || 'Document';
  const resolvedTitle = title ?? `${docLabel} not found`;
  const resolvedDescription = description ?? `This ${docLabel.toLowerCase()} may have been deleted or you may not have access to view it.`;

  const backPath = getModuleListPath(docType);
  const resolvedAction = action ?? (
    <Button type="primary" onClick={() => navigate(backPath)}>
      Back To {docLabel}
    </Button>
  );

  return (
    <div className={`flex items-center justify-center bg-gray-50 px-4 min-h-[85vh]`}>
      <div className="w-full max-w-md text-center">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400" aria-hidden="true">
              <path
                d="M4 6.5C4 5.12 5.12 4 6.5 4h7.3c.66 0 1.3.26 1.77.73l2.7 2.7c.47.47.73 1.11.73 1.77V17.5C19 18.88 17.88 20 16.5 20h-10C5.12 20 4 18.88 4 17.5v-11Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path d="M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <div className="text-xl font-semibold text-gray-900">{resolvedTitle}</div>
          {resolvedDescription ? <div className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">{resolvedDescription}</div> : null}

          {resolvedAction ? <div className="mt-7 w-full [&_.ant-btn]:w-full [&_button]:w-full">{resolvedAction}</div> : null}
        </div>
      </div>
    </div>
  );
};

export default NoFoundPage;
