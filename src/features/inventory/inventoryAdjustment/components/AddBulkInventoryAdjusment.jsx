import { useCallback, useEffect, useMemo, useState } from 'react';

// Components
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomButton from '@/components/ui/button/CustomButton';
import { Checkbox, Empty, Input, Tag } from '@/components/AntDComponent';

// Extras
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

const AddBulkInventoryAdjusment = ({ allItemDrop, isModel, setIsModel, onAddItems }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return allItemDrop || [];
    const lower = debouncedSearch.toLowerCase();
    return allItemDrop.filter(item => item.itemName.toLowerCase().includes(lower) || item.itemNo.toLowerCase().includes(lower));
  }, [debouncedSearch, allItemDrop]);

  const [visibleCount, setVisibleCount] = useState(50);

  const visibleItems = filteredItems.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount(prev => prev + 50);
  };

  const handleCheckboxChange = useCallback((item, checked) => {
    setSelected(prev => (checked ? [...prev, item] : prev.filter(s => s._id !== item._id)));
  }, []);

  const handleRemove = useCallback(id => {
    setSelected(prev => prev.filter(item => item._id !== id));
  }, []);

  const handleAdd = () => {
    const ids = selected.map(item => item._id);
    onAddItems(ids);
    setSelected([]);
    setIsModel(false);
  };

  return (
    <CustomModal setModalOpen={setIsModel} modalOpen={isModel} title="Add Bulk Item" width={900}>
      <div className="flex gap-4">
        <div className="w-1/2 bg-white rounded-md border border-gray-200 p-3 h-[450px] flex flex-col overflow-auto">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            size="large"
            className="mb-3"
            prefix={<Icons.SearchOutlined className="text-gray-400" />}
          />
          {visibleItems.length === 0 ? (
            <Empty className="mt-16" description="No items found" />
          ) : (
            visibleItems.map(item => (
              <button
                key={item._id}
                type="button"
                className="flex items-center border border-gray-200 p-1.5 w-full rounded mb-1.5 hover:bg-gray-50 justify-between text-left"
                onClick={() => handleCheckboxChange(item, !selected.some(s => s._id === item._id))}
              >
                <div className="flex-1 flex gap-2 items-center min-w-0">
                  <Tag className="font-semibold m-0 shrink-0">{item.itemNo}</Tag>
                  <span className="text-sm text-gray-800 truncate">{item.itemName}</span>
                </div>
                <Checkbox
                  checked={selected.some(s => s._id === item._id)}
                  onClick={e => {
                    e.stopPropagation();
                    handleCheckboxChange(item, !selected.some(s => s._id === item._id));
                  }}
                />
              </button>
            ))
          )}
          {visibleItems.length < filteredItems.length && <CustomButton type="link" text="Load More..." onClick={loadMore} className="mt-2" />}
        </div>

        <div className="w-1/2 bg-white rounded-md border border-gray-200 p-3 h-[450px] flex flex-col overflow-auto">
          <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2 m-0">
            Selected Items <span style={{ color: colorPalette.primary[500] }}>({selected.length})</span>
          </h3>
          <div className="flex-1 overflow-auto mt-3">
            {selected.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-16 m-0">No items selected yet</p>
            ) : (
              selected.map(item => (
                <div key={item._id} className="flex justify-between items-center border border-gray-200 p-1 px-1.5 rounded mb-1.5 hover:bg-red-50">
                  <span className="flex items-center gap-2 min-w-0">
                    <Tag className="font-semibold m-0 shrink-0">{item.itemNo}</Tag>
                    <span className="text-sm text-gray-800 truncate">{item.itemName}</span>
                  </span>
                  <CustomButton type="text" size="small" danger icon={<Icons.DeleteOutlined />} onClick={() => handleRemove(item._id)} />
                </div>
              ))
            )}
          </div>
          {selected.length > 0 && <CustomButton type="primary" size="large" block text={`Add ${selected.length} Items`} onClick={handleAdd} />}
        </div>
      </div>
    </CustomModal>
  );
};

export default AddBulkInventoryAdjusment;
