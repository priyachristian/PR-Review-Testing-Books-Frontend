import { useEffect, useState } from 'react';

import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';

import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import useModulePermissions from '@/hooks/useModulePermissions';

import { subItemGroupColumn } from '../subItemGroup.columns';
import AddSubItemGroupMasterModal from './AddSubItemGroupMasterModal';

import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from 'utils/constants';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const SubItemGroupTab = ({ showAddModal, setShowAddModal, selected, setSelected }) => {
  const { subItemGroup, subItemGroupPagination, loading, getSubItemGroup, deleteSubItemGroup, resetSubItemGroupList } = useSubItemGroup();
  const { useItemGroupMaster } = useModulePermissions(RESOURCES.ITEM_GROUP_MASTER);

  const [filter, setFilter] = useState({ search: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const fetchList = () => {
    getSubItemGroup({ page, limit, search });
  };

  useEffect(() => {
    fetchList();
    return () => resetSubItemGroupList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const handleSearch = () => {
    setSearch(filter?.search || '');
    setPage(1);
  };

  const handleClear = () => {
    setFilter({ search: '' });
    setSearch('');
    setPage(1);
  };

  const handleDelete = async id => {
    const result = await deleteSubItemGroup({ subItemGroupId: id });
    if (result?.payload) fetchList();
  };

  const handleEdit = record => {
    setSelected(record);
    setShowAddModal(true);
  };

  const columns = subItemGroupColumn(handleEdit, handleDelete, useItemGroupMaster);

  return (
    <div>
      <div className="bg-white border-t px-4 py-3.5">
        <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
      </div>
      <CustomTable
        columns={columns}
        data={subItemGroup || []}
        loading={loading}
        tableId="id"
        pagination={{
          current: page,
          pageSize: limit,
          total: subItemGroupPagination?.totalResults || 0,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setLimit(nextSize);
          },
        }}
      />
      {showAddModal && (
        <AddSubItemGroupMasterModal
          showModal={showAddModal}
          setModalOpen={open => {
            setShowAddModal(open);
            if (!open) setSelected?.(null);
          }}
          subItemGroup={selected}
          onSuccess={fetchList}
        />
      )}
    </div>
  );
};

export default SubItemGroupTab;
