import { useMemo, useState } from 'react';

import { Input } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { searchProblems } from '@/features/complaint/problemList/problemList.utils';

const ProblemQuickSearch = ({ tree, onSelect }) => {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => searchProblems(tree, query).slice(0, 8), [tree, query]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <h3 className="text-[15px] font-semibold text-gray-900 m-0">Already know the problem?</h3>
      <p className="text-sm mt-1 mb-3 text-gray-500">Type it and jump straight there.</p>
      <Input
        allowClear
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="driver burnt, wrong rate, late delivery..."
        prefix={<Icons.SearchOutlined style={{ color: colorPalette.secondary[400] }} />}
      />
      {query.trim() && (
        <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No matching problems.</div>
          ) : (
            matches.map(row => (
              <button
                key={row.id}
                type="button"
                className="w-full text-left px-3 py-2 border-0 bg-white hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onSelect(row);
                  setQuery('');
                }}
              >
                <div className="text-sm font-medium text-gray-900">{row.name}</div>
                <div className="text-xs truncate text-gray-500">{row.pathLabel}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemQuickSearch;
