import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BackButton from '@/components/ui/button/BackButton';
import { Button } from '@/components/AntDComponent';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { useProblemList } from '@/features/complaint/problemList/useProblemList';
import { getProblemPath, isLeafProblem, resolveProblemRouting } from '@/features/complaint/problemList/problemList.utils';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useFormDirtyState from '@/hooks/useFormDirtyState';

import ProblemPathChips from '../components/ProblemPathChips';
import ProblemStepPicker from '../components/ProblemStepPicker';
import ProblemQuickSearch from '../components/ProblemQuickSearch';
import ComplaintDetailsForm from '../components/ComplaintDetailsForm';
import AddComplaintSkeleton from '../components/AddComplaintSkeleton';
import { useComplaint } from '../useComplaint';
import {
  buildCreateComplaintPayload,
  buildUpdateComplaintPayload,
  getCreateComplaintInitialValues,
  getEvidenceSelectOptions,
  getProblemListIdFromPath,
  mapComplaintToFormValues,
  resolveComplaintFormType,
} from '../complaint.utils';

const EMPTY_FORM_VALUES = {};

const AddComplaint = () => {
  const navigate = useNavigate();
  const { complaintId } = useParams();
  const isEdit = Boolean(complaintId);

  const { tree, loading: problemListLoading, getProblemList, resetProblemList } = useProblemList();
  const { complaint, loading: complaintLoading, createComplaint, updateComplaint, getComplaintById, submitLoading } = useComplaint();

  /** Selected ancestor path while drilling down (does not include “current options” parent when at root). */
  const [selectedPath, setSelectedPath] = useState([]);
  const [phase, setPhase] = useState(isEdit ? 'form' : 'wizard'); // wizard | form
  const [formPath, setFormPath] = useState([]);
  const [editReady, setEditReady] = useState(false);

  useResetOnUnmount(resetProblemList);

  useEffect(() => {
    const controller = new AbortController();
    getProblemList({ isActive: true, signal: controller.signal });
    return () => controller.abort();
  }, [getProblemList]);

  useEffect(() => {
    if (!isEdit || !complaintId) return undefined;
    const controller = new AbortController();
    getComplaintById({ complaintId, signal: controller.signal });
    return () => controller.abort();
  }, [isEdit, complaintId, getComplaintById]);

  useEffect(() => {
    if (!isEdit || !complaint || !tree?.length) return;

    const problemListId = complaint.problemListId?._id || complaint.problemListId?.id || complaint.problemListId;
    const path = problemListId ? getProblemPath(tree, problemListId) : null;
    if (path?.length) {
      setFormPath(path);
      setSelectedPath(path);
    } else if (Array.isArray(complaint.problemPath) && complaint.problemPath.length) {
      setFormPath(
        complaint.problemPath.map((name, index) => ({
          id: `path-${index}`,
          name: typeof name === 'string' ? name : name?.name || '-',
        }))
      );
    }
    setPhase('form');
    setEditReady(true);
  }, [isEdit, complaint, tree]);

  const currentParent = selectedPath[selectedPath.length - 1] || null;
  const options = currentParent ? currentParent.children || [] : tree;

  const stepTitle = currentParent ? `${currentParent.name} — what exactly happened?` : 'Who has the problem?';
  const stepDescription = currentParent ? currentParent.description || null : null;

  const routing = useMemo(() => resolveProblemRouting(formPath), [formPath]);
  const formType = useMemo(() => (isEdit && complaint?.formType ? complaint.formType : resolveComplaintFormType(formPath)), [isEdit, complaint?.formType, formPath]);
  const problemListId = useMemo(() => {
    if (isEdit) {
      return complaint?.problemListId?._id || complaint?.problemListId?.id || complaint?.problemListId || getProblemListIdFromPath(formPath);
    }
    return getProblemListIdFromPath(formPath);
  }, [isEdit, complaint, formPath]);

  const requiredAttachments = useMemo(() => {
    if (routing?.requiredAttachments?.length) return routing.requiredAttachments;
    if (Array.isArray(complaint?.requiredAttachments) && complaint.requiredAttachments.length) return complaint.requiredAttachments;
    if (isEdit && Array.isArray(complaint?.evidence)) {
      return [...new Set(complaint.evidence.map(entry => entry?.type).filter(Boolean))];
    }
    return [];
  }, [routing, complaint, isEdit]);

  const editRouting = useMemo(() => {
    if (routing) return routing;
    if (!isEdit || !complaint) return null;
    return {
      personLabel: complaint.assignedTo?.name || 'Unassigned',
      departmentLabel: complaint.department || 'Unassigned',
      urgencyLabel: complaint.urgency || 'Medium',
      sortOutWithinDays: complaint.sortOutWithinDays ?? complaint.resolveInDays ?? '-',
      requiredAttachments,
    };
  }, [routing, isEdit, complaint, requiredAttachments]);

  const editInitialValues = useMemo(() => {
    if (!isEdit || !complaint || !editReady) return null;
    return mapComplaintToFormValues(complaint, requiredAttachments);
  }, [isEdit, complaint, editReady, requiredAttachments]);

  const createInitialValues = useMemo(() => {
    if (isEdit || phase !== 'form' || !formType) return null;
    return getCreateComplaintInitialValues({
      formType,
      requiredAttachments,
    });
  }, [isEdit, phase, formType, requiredAttachments]);

  const formInitialValues = isEdit ? editInitialValues : createInitialValues;
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(formInitialValues || EMPTY_FORM_VALUES);

  const evidenceSelectOptions = useMemo(() => (isEdit && complaint ? getEvidenceSelectOptions(complaint) : {}), [isEdit, complaint]);

  const listPath = `/${ADMIN_ROUTE_PATHS.complaint.root}`;
  const detailPath = complaintId ? `/${ADMIN_ROUTE_PATHS.complaint.build.detail(complaintId)}` : listPath;

  const goToList = () => navigate(listPath);
  const handleCancel = () => handleNavigation(isEdit ? detailPath : listPath);

  const startAgain = () => {
    if (isEdit) return;
    setSelectedPath([]);
    setFormPath([]);
    setPhase('wizard');
  };

  const openFormForPath = path => {
    setFormPath(path);
    setSelectedPath(path);
    setPhase('form');
  };

  const handleSelectOption = node => {
    const nextPath = [...selectedPath, node];
    if (isLeafProblem(node)) {
      openFormForPath(nextPath);
      return;
    }
    setSelectedPath(nextPath);
  };

  const handleChipClick = index => {
    if (isEdit) return;
    const basePath = phase === 'form' ? formPath : selectedPath;
    const target = basePath[index];
    setPhase('wizard');
    setFormPath([]);
    if (isLeafProblem(target)) {
      setSelectedPath(basePath.slice(0, index));
    } else {
      setSelectedPath(basePath.slice(0, index + 1));
    }
  };

  const handleQuickSelect = row => {
    const path = row.path?.length ? row.path : getProblemPath(tree, row.id) || [];
    if (!path.length) return;
    if (row.isLeaf || isLeafProblem(path[path.length - 1])) {
      openFormForPath(path);
      return;
    }
    setPhase('wizard');
    setFormPath([]);
    setSelectedPath(path);
  };

  const handleSave = async values => {
    try {
      if (isEdit) {
        const payload = buildUpdateComplaintPayload({
          values,
          requiredAttachments,
        });
        await updateComplaint({ complaintId, data: payload });
        navigateAfterSave(detailPath);
        return;
      }

      if (!formType || !problemListId) return;

      const payload = buildCreateComplaintPayload({
        values,
        formType,
        problemListId,
        requiredAttachments,
      });
      await createComplaint(payload);
      navigateAfterSave(listPath);
    } catch {
      // Toast handled in slice
    }
  };

  const pageTitle = isEdit ? PAGE_HEADERS?.EDIT_COMPLAINT?.title || 'Edit Complaint' : PAGE_HEADERS?.ADD_COMPLAINT?.title;
  const pageLoading = isEdit ? problemListLoading || complaintLoading || (!editReady && Boolean(complaint)) : problemListLoading;

  if (pageLoading) {
    return <AddComplaintSkeleton isEdit={isEdit} />;
  }

  if (isEdit && !complaint) {
    return (
      <NoFoundPage
        title="Complaint not found"
        description="This complaint may have been deleted or you may not have access to edit it."
        action={
          <Button type="primary" onClick={goToList}>
            Back To Complaints
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <h1 className="text-[18px] font-semibold text-gray-900 m-0">{pageTitle}</h1>
          </div>
        </div>
      </div>

      <div className="relative pb-24 bg-white pt-16 -m-4">
        <div className="px-6 flex flex-col gap-4">
          {(selectedPath.length > 0 || phase === 'form') && (
            <ProblemPathChips path={phase === 'form' ? formPath : selectedPath} onChipClick={handleChipClick} onStartAgain={startAgain} readOnly={isEdit} />
          )}

          {phase === 'wizard' && !isEdit ? (
            <div className="flex flex-col gap-4">
              <ProblemStepPicker title={stepTitle} description={stepDescription} options={options} onSelect={handleSelectOption} />
              <ProblemQuickSearch tree={tree} onSelect={handleQuickSelect} />
            </div>
          ) : !isEdit || (editReady && editInitialValues) ? (
            <ComplaintDetailsForm
              routing={isEdit ? editRouting : routing}
              formType={formType}
              onSave={handleSave}
              onCancel={handleCancel}
              submitLoading={submitLoading}
              initialValues={isEdit ? editInitialValues : null}
              evidenceSelectOptions={evidenceSelectOptions}
              updateFormValues={updateFormValues}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default AddComplaint;
