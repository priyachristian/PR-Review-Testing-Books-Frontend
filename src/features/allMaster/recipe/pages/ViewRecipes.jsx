import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { Button, Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import RecipeForm from '../components/RecipeForm';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { useRecipe, recipeColumn } from '@/features/allMaster/recipe';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { RESOURCES } from '@/utils/jsonFile';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum } from 'utils/constants';
import { PAGE_HEADERS } from 'utils/label';

const ViewRecipes = () => {
  const { recipes, pagination, loading, getRecipes, deleteRecipe, resetRecipe } = useRecipe();
  const { isViewOnly, useModuleRecipe } = useModulePermissions(RESOURCES.RECIPE);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewSequenceLocked, setViewSequenceLocked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
  });

  const fetchRecipes = (signal, pageOverride = null, limitOverride = null) => {
    const currentPage = pageOverride || parseInt(searchParams.get('page')) || 1;
    const currentLimit = limitOverride || parseInt(searchParams.get('limit')) || pagination.limit;
    const currentSortBy = searchParams.get('sortBy') || '';
    const currentSearch = searchParams.get('search') || filter.search || '';

    getRecipes({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      sortBy: currentSortBy,
      signal,
    });
  };

  const handleSerch = () => {
    if (filter.search) {
      updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: filter.search });
    }
  };

  const handleClear = () => {
    setFilter({
      search: '',
    });
    updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: '' });
  };

  const handleViewClick = record => {
    setSelectedItems(record.processes || []);
    setViewSequenceLocked(record.sequenceLocked === true);
    setVisible(true);
  };

  const handleModalClose1 = () => {
    setVisible(false);
    setViewSequenceLocked(false);
  };

  const handleEdit = recipe => {
    setIsEdit(true);
    setEditingRecipe(recipe);
    setModalOpen(true);
  };

  const handleDelete = async id => {
    try {
      await deleteRecipe({ recipeId: id });
      fetchRecipes();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  const handleModalClose = () => {
    setIsEdit(false);
    setEditingRecipe(null);
    setModalOpen(false);
  };

  const handleAddRecipe = () => {
    setIsEdit(false);
    setEditingRecipe(null);
    setModalOpen(true);
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortParam = '';
    if (sorter && sorter.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sortParam,
    });
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'search': {
        return searchParams?.get('search');
      }
      default:
        return value;
    }
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
    }).filter(([, value]) => value);

    if (activeFilters.length === 0) return null;

    return (
      <div className="mb-5  container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters?.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                if (key === 'search') {
                  handleClear();
                } else {
                  setFilter(prev => ({ ...prev, [key]: null }));
                  updateUrlParams({ [key]: null });
                }
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {getFilterLabel(key, value)}
            </Tag>
          ))}
          <Button size="small" className="border-none hover:underline shadow-none" onClick={handleClear}>
            Clear All
          </Button>
        </div>
      </div>
    );
  };

  const handleFormSubmit = () => {
    const controller = new AbortController();
    fetchRecipes(controller.signal, pagination.page, pagination.limit);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRecipes(controller.signal);

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  useResetOnUnmount(resetRecipe);

  const columns = recipeColumn(handleEdit, handleViewClick, handleDelete, useModuleRecipe, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.RECIPE_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.RECIPE_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.RECIPE_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => recipeColumn(handleEdit, handleViewClick, handleDelete, useModuleRecipe, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchRecipes(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.RECIPE?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleRecipe?.canCreate}
            isViewOnly={isViewOnly}
            type="primary"
            className="px-5"
            wrapperClassName="inline-block"
            onClick={handleAddRecipe}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSerch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.RECIPE_MASTER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
        </div>
        <FilterTags />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          data={recipes}
          loading={loading}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      {modalOpen && <RecipeForm modalOpen={modalOpen} isEdit={isEdit} handleModalClose={handleModalClose} editingRecipe={editingRecipe} onFormSubmit={handleFormSubmit} />}
      <CustomModal
        modalOpen={visible}
        setModalOpen={open => {
          if (!open) handleModalClose1();
        }}
        title={
          <span className="inline-flex items-center gap-2">
            Processes
            {viewSequenceLocked && <Icons.LockOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
          </span>
        }
        width={600}
      >
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-[#f6f7fb]">Sequence</th>
                <th className="border px-2 py-1 bg-[#f6f7fb]">Process Name</th>
                <th className="border px-2 py-1 bg-[#f6f7fb]">Process No</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.length > 0 ? (
                selectedItems.map((item, index) => (
                  <tr key={item?.id || item?.processId || index} className="hover:bg-blue-50 transition-all duration-200">
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1 text-center">{item.name}</td>
                    <td className="border px-2 py-1 text-center">{item.processId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border px-2 py-1 text-center text-gray-500">
                    No Process Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CustomModal>
    </div>
  );
};

export default ViewRecipes;
