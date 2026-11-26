const ActionButtons = ({ children, title = 'Actions' }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
};

export default ActionButtons;
