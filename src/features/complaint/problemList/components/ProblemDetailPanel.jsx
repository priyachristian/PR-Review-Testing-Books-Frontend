import { Formik } from 'formik';

import Icons from 'assets/icons/icon';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { Button, Popconfirm } from '@/components/AntDComponent';
import { colorPalette } from '@/utils/theme';
import { URGENCY_OPTIONS, VISIBILITY } from '../problemList.constants';
import { problemDetailSchema } from '../problemList.schema';
import { ensureOptionForValue, getProblemPath, resolveInheritedAttachments } from '../problemList.utils';
import AttachmentRequirementChips from './AttachmentRequirementChips';

const ProblemDetailPanel = ({
  tree,
  selectedId,
  personOptions = [],
  departmentOptions = [],
  submitLoading = false,
  deleteLoading = false,
  canCreate = false,
  canEdit = false,
  canDelete: canDeletePermission = false,
  isViewOnly = false,
  onClose,
  onSave,
  onDelete,
  loading = false,
  onAddChild,
  onFocus,
}) => {
  const path = getProblemPath(tree, selectedId) || [];
  const problem = path[path.length - 1];

  if (!problem) return null;

  const hasChildren = Boolean(problem.children?.length);
  const isSystemGenerated = Boolean(problem.isSystemGenerated);
  const canDeleteByState = !hasChildren && !isSystemGenerated;
  const isFormReadOnly = !canEdit || isViewOnly;
  const deleteDisabledReason = isSystemGenerated ? 'System-generated problems cannot be deleted.' : hasChildren ? 'Remove child problems first before deleting this one.' : null;
  const breadcrumb = path.map(p => p.name).join(' > ');

  const resolvedDepartmentOptions = ensureOptionForValue(departmentOptions, problem.department, 'Current department');
  const resolvedPersonOptions = ensureOptionForValue(personOptions, problem.assignedTo, 'Current assignee');
  const requiredAttachments = resolveInheritedAttachments(path);

  const initialValues = {
    name: problem.name || '',
    department: problem.department ?? null,
    assignedTo: problem.assignedTo ?? null,
    urgency: problem.urgency ?? null,
    replyWithinHours: problem.replyWithinHours ?? '',
    sortOutWithinDays: problem.sortOutWithinDays ?? '',
    requiredAttachments,
    isActive: problem.isActive !== false,
    canAddChild: problem.canAddChild !== false,
  };

  const handleSave = values => {
    if (isFormReadOnly) return;

    const formData = {
      name: values.name.trim(),
      parentProblemId: problem.parentProblemId ?? null,
      department: values.department || null,
      assignedTo: values.assignedTo || null,
      urgency: values.urgency || null,
      replyWithinHours: values.replyWithinHours === '' ? null : Number(values.replyWithinHours),
      sortOutWithinDays: values.sortOutWithinDays === '' ? null : Number(values.sortOutWithinDays),
      requiredAttachments: values.requiredAttachments || [],
      visibility: VISIBILITY.EVERYONE,
      isActive: values.isActive,
      canAddChild: values.canAddChild,
    };

    onSave?.(problem.id, formData);
  };

  return (
    <Formik key={problem.id} enableReinitialize initialValues={initialValues} validationSchema={problemDetailSchema} onSubmit={handleSave}>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
        <div className="flex flex-col h-full min-h-0 min-w-0 w-full overflow-hidden">
          <div className="flex items-start justify-between gap-2 sm:gap-3 px-3 sm:px-5 pt-3 sm:pt-4 pb-3 border-b shrink-0" style={{ borderColor: colorPalette.secondary[200] }}>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold m-0 break-words" style={{ color: colorPalette.secondary[900] }}>
                {values.name || 'Untitled problem'}
              </h2>
              <p className="text-xs mt-1 mb-0 break-words sm:truncate" style={{ color: colorPalette.secondary[500] }} title={breadcrumb}>
                {breadcrumb}
                {typeof problem.childCount === 'number' ? ` — ${problem.childCount} children` : ''}
              </p>
            </div>
            <Button type="text" className="shrink-0" icon={<Icons.CloseOutlined />} onClick={onClose} aria-label="Close problem details" />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-5 py-3 sm:py-4">
            <CustomForm onFinish={handleSubmit} layout="vertical">
              <div className="space-y-4">
                <CustomInput
                  type="text"
                  name="name"
                  label="What the question option says"
                  placeholder="e.g. Damaged goods on arrival"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.name}
                  touched={touched.name}
                  setFieldValue={setFieldValue}
                  disabled={isFormReadOnly}
                  required
                />

                <CustomInput
                  type="select"
                  name="assignedTo"
                  label="Which person"
                  placeholder="Select person"
                  value={values.assignedTo}
                  selectOptions={resolvedPersonOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  loading={loading}
                  onFocus={onFocus}
                  errorMessage={errors.assignedTo}
                  touched={touched.assignedTo}
                  setFieldValue={setFieldValue}
                  disabled={isFormReadOnly}
                  allowClear
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <CustomInput
                    type="select"
                    name="department"
                    label="Goes to which department"
                    placeholder="Select department"
                    value={values.department}
                    selectOptions={resolvedDepartmentOptions}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.department}
                    touched={touched.department}
                    setFieldValue={setFieldValue}
                    disabled={isFormReadOnly}
                    allowClear
                  />
                  <CustomInput
                    type="select"
                    name="urgency"
                    label="Urgency"
                    placeholder="Select urgency"
                    value={values.urgency}
                    selectOptions={URGENCY_OPTIONS}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.urgency}
                    touched={touched.urgency}
                    setFieldValue={setFieldValue}
                    disabled={isFormReadOnly}
                    allowClear
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                  <CustomInput
                    type="number"
                    name="replyWithinHours"
                    label="Reply within (hours)"
                    placeholder="Enter number of hours"
                    value={values.replyWithinHours}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.replyWithinHours}
                    touched={touched.replyWithinHours}
                    setFieldValue={setFieldValue}
                    disabled={isFormReadOnly}
                    min={0}
                  />
                  <CustomInput
                    type="number"
                    name="sortOutWithinDays"
                    label="Sort out in (days)"
                    placeholder="Enter number of days"
                    value={values.sortOutWithinDays}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.sortOutWithinDays}
                    touched={touched.sortOutWithinDays}
                    setFieldValue={setFieldValue}
                    disabled={isFormReadOnly}
                    min={0}
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium" style={{ color: colorPalette.secondary[800] }}>
                    Must be attached before saving
                  </div>
                  <AttachmentRequirementChips value={values.requiredAttachments || []} onChange={next => setFieldValue('requiredAttachments', next)} disabled={isFormReadOnly} />
                </div>
              </div>
            </CustomForm>
          </div>

          <div
            className="flex flex-col-reverse sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 px-3 sm:px-5 py-3 border-t shrink-0"
            style={{ borderColor: colorPalette.secondary[200], backgroundColor: colorPalette.secondary[50] }}
          >
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <PermissionButton
                canAccess={canCreate}
                isViewOnly={isViewOnly}
                variant="outline"
                text="+ Add one under this"
                disabled={values.canAddChild === false}
                onClick={() => onAddChild(problem.id)}
              />
              <PermissionButton
                canAccess={canEdit}
                isViewOnly={isViewOnly}
                variant="outline"
                icon={<Icons.PoweroffOutlined />}
                text={values.isActive ? 'Turn off' : 'Turn on'}
                onClick={() => setFieldValue('isActive', !values.isActive)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
              {canDeleteByState ? (
                <Popconfirm
                  title="Delete this problem?"
                  description="This cannot be undone."
                  okText="Yes"
                  cancelText="No"
                  disabled={!canDeletePermission || isViewOnly}
                  onConfirm={() => onDelete?.(problem.id)}
                >
                  <span>
                    <PermissionButton
                      canAccess={canDeletePermission}
                      isViewOnly={isViewOnly}
                      type="danger"
                      icon={<Icons.DeleteOutlined />}
                      text="Delete"
                      loading={deleteLoading}
                      disabled={submitLoading}
                    />
                  </span>
                </Popconfirm>
              ) : (
                <PermissionButton
                  canAccess={canDeletePermission}
                  isViewOnly={isViewOnly}
                  type="danger"
                  icon={<Icons.DeleteOutlined />}
                  text="Delete"
                  disabled
                  tooltipTitle={canDeletePermission && !isViewOnly ? deleteDisabledReason : undefined}
                />
              )}
              <PermissionButton canAccess={canEdit} isViewOnly={isViewOnly} className="px-7 py-4" text="Save" type="primary" loading={submitLoading} disabled={deleteLoading} onClick={handleSubmit} />
            </div>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default ProblemDetailPanel;
