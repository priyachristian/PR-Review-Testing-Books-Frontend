import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PermissionButton from '@/components/ui/button/PermissionButton';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from '@/utils/label';
import { RESOURCES } from '@/utils/jsonFile';
import { useUser } from '@/features/setting/user/useUser';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';

const API_CALLED_ENUM = {
  USERS_DROPDOWN: 'usersDropdown',
};

import ProblemTreePanel from '../components/ProblemTreePanel';
import ProblemTreeSkeleton from '../components/ProblemTreeSkeleton';
import ProblemDetailPanel from '../components/ProblemDetailPanel';
import AddProblemModal from '../components/AddProblemModal';
import { useProblemList } from '../useProblemList';
import { DEPARTMENT_OPTIONS, VISIBILITY } from '../problemList.constants';
import {
  buildAddProblemInheritanceSummary,
  buildProblemPayload,
  countProblems,
  findProblemById,
  getDefaultExpandedIds,
  getProblemPath,
  isLeafProblem,
  mapUsersToSelectOptions,
  resolveInheritedAttachments,
  resolveInheritedField,
} from '../problemList.utils';

const ViewProblemList = () => {
  const { tree, loading, submitLoading, deleteLoading, getProblemList, createProblemList, updateProblemList, deleteProblemList, resetProblemList } = useProblemList();
  const { isViewOnly, useModuleProblemList } = useModulePermissions(RESOURCES.PROBLEM_LIST);
  const { usersDropdown, getUsersDropdown, usersDropdownLoading } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreate = Boolean(useModuleProblemList?.canCreate) && !isViewOnly;
  const canEdit = Boolean(useModuleProblemList?.canEdit) && !isViewOnly;
  const canDelete = Boolean(useModuleProblemList?.canDelete) && !isViewOnly;

  const [filter, setFilter] = useState({ search: searchParams.get('search') || '' });
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState(null);
  const [hasInitializedExpand, setHasInitializedExpand] = useState(false);
  const isApicalledRefFilter = useRef({
    usersDropdown: false,
  });

  useResetOnUnmount(resetProblemList);

  const activeSearch = searchParams.get('search') || '';
  const personOptions = useMemo(() => mapUsersToSelectOptions(usersDropdown), [usersDropdown]);
  const departmentOptions = DEPARTMENT_OPTIONS;

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown({});
      obj.usersDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  const totalCount = useMemo(() => countProblems(tree), [tree]);
  const selectedProblem = useMemo(() => (selectedId ? findProblemById(tree, selectedId) : null), [tree, selectedId]);
  const isDetailOpen = Boolean(selectedProblem && isLeafProblem(selectedProblem));

  const addParentPath = useMemo(() => (addParentId ? getProblemPath(tree, addParentId) : null), [tree, addParentId]);
  const addParent = addParentPath?.[addParentPath.length - 1] || null;
  const inheritanceSummary = useMemo(() => buildAddProblemInheritanceSummary(addParentPath), [addParentPath]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    setSearchParams(params);
  };

  const fetchTree = signal => {
    getProblemList({
      search: searchParams.get('search') || '',
      signal,
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTree(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    setFilter(prev => ({ ...prev, search: searchParams.get('search') || '' }));
  }, [searchParams]);

  useEffect(() => {
    if (!tree?.length) return;

    if (activeSearch.trim()) {
      // API returns a filtered tree — expand all ancestors so matches are visible
      const expandAllWithChildren = (nodes, collected = new Set()) => {
        nodes.forEach(node => {
          if (node.children?.length) {
            collected.add(node.id);
            expandAllWithChildren(node.children, collected);
          }
        });
        return collected;
      };
      setExpandedIds(expandAllWithChildren(tree));
      return;
    }

    if (!hasInitializedExpand) {
      setExpandedIds(getDefaultExpandedIds(tree));
      setHasInitializedExpand(true);
      if (!selectedId) {
        setSelectedId(tree[0]?.id || null);
      }
    }
  }, [tree, activeSearch, hasInitializedExpand, selectedId]);

  // When search is cleared, restore default expand (roots only)
  useEffect(() => {
    if (activeSearch.trim() || !tree?.length || !hasInitializedExpand) return;
    setExpandedIds(getDefaultExpandedIds(tree));
  }, [activeSearch]);

  useEffect(() => {
    if (!selectedId || !tree?.length) return;
    if (!findProblemById(tree, selectedId)) {
      setSelectedId(tree[0]?.id || null);
    }
  }, [tree, selectedId]);

  const handleSearch = () => updateUrlParams({ search: filter.search?.trim() || '' });

  const handleClear = () => {
    setFilter({ search: '' });
    updateUrlParams({ search: '' });
  };

  const handleToggleExpand = id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelect = id => {
    setSelectedId(id);
    const path = getProblemPath(tree, id) || [];
    if (path.length > 1) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        path.slice(0, -1).forEach(node => next.add(node.id));
        return next;
      });
    }
  };

  const openAddModal = parentId => {
    if (!canCreate) {
      Toast.error("You don't have permission for this operation. Please check with your system admin.");
      return;
    }
    if (!parentId) {
      Toast.error('Select a problem first, then add under it.');
      return;
    }
    const parent = findProblemById(tree, parentId);
    if (parent && parent.canAddChild === false) {
      Toast.error('Children cannot be added under this problem.');
      return;
    }
    setAddParentId(parentId);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddParentId(null);
  };

  const refetchTree = async () => {
    await getProblemList({ search: searchParams.get('search') || '' });
  };

  const handleAddProblem = async name => {
    if (!canCreate || !addParentId) return;

    const parentPath = getProblemPath(tree, addParentId) || [];
    const parent = parentPath[parentPath.length - 1];
    const replyWithinHours = parent?.replyWithinHours ?? resolveInheritedField(parentPath, 'replyWithinHours').value ?? null;
    const sortOutWithinDays = parent?.sortOutWithinDays ?? resolveInheritedField(parentPath, 'sortOutWithinDays').value ?? null;
    const requiredAttachments = resolveInheritedAttachments(parentPath);

    try {
      const payload = buildProblemPayload({
        name,
        parentProblemId: addParentId,
        department: null,
        assignedTo: null,
        replyWithinHours,
        sortOutWithinDays,
        requiredAttachments,
        visibility: VISIBILITY.EVERYONE,
        canAddChild: true,
        isActive: true,
        includeProblemType: false,
      });

      const result = await createProblemList(payload);
      const createdId = result?.data?.id || result?.data?._id;

      await refetchTree();
      setExpandedIds(prev => new Set([...prev, addParentId]));
      if (createdId) setSelectedId(createdId);
      closeAddModal();
    } catch {
      // Toast handled in slice
    }
  };

  const handleSaveProblem = async (id, formData) => {
    if (!canEdit) return;
    try {
      const payload = buildProblemPayload({
        name: formData.name,
        parentProblemId: formData.parentProblemId,
        department: formData.department,
        assignedTo: formData.assignedTo,
        urgency: formData.urgency,
        replyWithinHours: formData.replyWithinHours,
        sortOutWithinDays: formData.sortOutWithinDays,
        requiredAttachments: formData.requiredAttachments,
        visibility: formData.visibility,
        canAddChild: formData.canAddChild,
        isActive: formData.isActive,
        includeProblemType: false,
      });

      await updateProblemList({ id, data: payload });
      await refetchTree();
    } catch {
      // Toast handled in slice
    }
  };

  const handleDeleteProblem = async id => {
    if (!canDelete) return;
    const problem = findProblemById(tree, id);
    const parentId = problem?.parentProblemId || null;

    try {
      await deleteProblemList({ id });
      await refetchTree();
      setSelectedId(parentId || null);
    } catch {
      // Toast handled in slice
    }
  };

  const handleCloseDetail = () => setSelectedId(null);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 shrink-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.PROBLEM_LIST?.title} (${totalCount || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={Boolean(useModuleProblemList?.canCreate)}
            isViewOnly={isViewOnly}
            type="primary"
            className="px-5"
            wrapperClassName="inline-block"
            icon={<Icons.PlusCircleOutlined />}
            text="Add Problem"
            onClick={() => openAddModal(selectedId)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 border-t bg-white overflow-hidden w-full" style={{ borderColor: colorPalette.secondary[200] }}>
        <div
          className={`min-h-0 h-full overflow-hidden ${
            isDetailOpen ? 'hidden md:flex md:flex-col md:w-full md:max-w-[360px] md:min-w-[280px] md:shrink-0 md:border-r' : 'flex flex-col flex-1 w-full min-w-0'
          }`}
          style={{ borderColor: colorPalette.secondary[200] }}
        >
          {loading ? (
            <ProblemTreeSkeleton />
          ) : (
            <ProblemTreePanel
              tree={tree}
              filter={filter}
              setFilter={setFilter}
              onSearch={handleSearch}
              onClear={handleClear}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
            />
          )}
        </div>

        {isDetailOpen && (
          <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full w-full overflow-hidden">
            <ProblemDetailPanel
              tree={tree}
              selectedId={selectedId}
              loading={usersDropdownLoading}
              personOptions={personOptions}
              departmentOptions={departmentOptions}
              submitLoading={submitLoading}
              deleteLoading={deleteLoading}
              canCreate={Boolean(useModuleProblemList?.canCreate)}
              canEdit={Boolean(useModuleProblemList?.canEdit)}
              canDelete={Boolean(useModuleProblemList?.canDelete)}
              isViewOnly={isViewOnly}
              onClose={handleCloseDetail}
              onSave={handleSaveProblem}
              onDelete={handleDeleteProblem}
              onAddChild={() => openAddModal(selectedId)}
              onFocus={() => {
                if (!isApicalledRefFilter.current.usersDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
                }
              }}
            />
          </div>
        )}
      </div>

      <AddProblemModal open={addModalOpen} onClose={closeAddModal} parentName={addParent?.name} inheritanceSummary={inheritanceSummary} submitLoading={submitLoading} onSubmit={handleAddProblem} />
    </div>
  );
};

export default ViewProblemList;
