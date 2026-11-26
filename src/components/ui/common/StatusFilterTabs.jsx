const StatusFilterTabs = ({ statuses = [], value = [], onChange, allLabel = 'All' }) => {
  const selected = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

  const handleToggle = key => {
    if (!key) {
      onChange?.([]);
      return;
    }
    const next = selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key];
    onChange?.(next);
  };

  const tabs = [{ value: '', label: allLabel }, ...statuses];

  return (
    <div className="flex items-center gap-5 overflow-x-auto custom-scrollbar min-w-0">
      {tabs.map(tab => {
        const isAll = tab.value === '';
        const isActive = isAll ? selected.length === 0 : selected.includes(tab.value);
        return (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => handleToggle(tab.value)}
            className={`whitespace-nowrap py-1.5 text-[14px] font-medium border-b-2 transition-colors ${
              isActive ? 'text-[#1e293b] border-primary' : 'text-gray-500 border-transparent hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilterTabs;
