import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FieldArray, Formik } from 'formik';
import dayjs from 'dayjs';

// Components
import AddIncentiveSchemeSkeleton from '../components/AddIncentiveSchemeSkeleton';
import { Button, Modal, Tag, Tooltip } from '@/components/AntDComponent';
import AccessFallback from '@/components/feedback/errorBoundary/AccessFallback';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput, { CustomLabel } from '@/components/forms/formInput/CustomInput';

// Hooks
import useScrollToError from 'hooks/useScrollToError';
import useModulePermissions from 'hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useItemMaster } from '@/features/allMaster/item';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';

// Extras
import { useIncentiveScheme, getIncentiveSchemeValidateSchema } from '@/features/setting/incentiveScheme';
import { CALC_METHOD_OPTIONS, DOC_TYPE_OPTIONS, DOC_TYPE_ROW_DEFAULTS } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { errorsToTouched } from '@/utils/util';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

const SectionDivider = ({ children }) => (
  <div className="flex items-center gap-3 my-6">
    <span className="text-xs text-black font-semibold shrink-0">{children}</span>
    <div className="flex-1 min-w-0 border-t border-gray-200" />
  </div>
);

const normalizeIdList = list => (list || []).map(entry => (typeof entry === 'object' && entry !== null ? entry._id || entry.id : entry)).filter(id => id !== undefined && id !== null && id !== '');

const toSelectOptions = (dropdown = [], saved = [], getValue, getLabel) => {
  const map = new Map();
  const add = entry => {
    const value = typeof entry === 'object' && entry !== null ? getValue(entry) : entry;
    if (!value) return;
    const key = String(value);
    if (!map.has(key)) {
      map.set(key, { label: (typeof entry === 'object' && entry !== null ? getLabel(entry) : null) || key, value });
    }
  };
  (dropdown ?? []).forEach(add);
  (saved ?? []).forEach(add);
  return [...map.values()];
};

const LockedMultiSelectDisplay = ({ label, required, values = [], options = [], hideLabel = false, lockedIds }) => {
  const getLabel = val => options.find(option => String(option.value) === String(val))?.label || val;
  const isLocked = val => lockedIds?.has?.(String(val));

  return (
    <div>
      {!hideLabel && label && <CustomLabel label={label} required={required} />}
      <div className="min-h-[34px] w-full rounded-md border border-[#d9d9d9] bg-[#f5f5f5] px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 cursor-not-allowed">
        {values.length === 0 ? (
          <span className="text-gray-400 text-[13px]">—</span>
        ) : (
          values.map(val => (
            <Tooltip key={String(val)} title={isLocked(val) ? 'Cannot remove — this user has existing incentive logs' : undefined}>
              <Tag className="m-0 bg-white border border-gray-200 text-[#030711] text-[13px] leading-5 inline-flex items-center gap-1 max-w-full">
                {isLocked(val) && <span aria-hidden>🔒</span>}
                <span className="truncate">{getLabel(val)}</span>
              </Tag>
            </Tooltip>
          ))
        )}
      </div>
    </div>
  );
};

const fmtShort = n => {
  n = Number(n || 0);
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 1)}L`;
  if (n >= 1000 && n % 1000 === 0) return `₹${n / 1000}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const listPath = `/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.root}`;
const toNumberOrNull = val => (val === '' || val == null ? null : Number(val));
const toNumberOr = (val, fallback) => (val === '' || val == null ? fallback : Number(val));

const getDocTypeOptionsForRow = (docTypes, rowIndex) => {
  const selectedElsewhere = new Set((docTypes || []).map((row, i) => (i !== rowIndex ? row.docType : null)).filter(Boolean));
  const currentValue = docTypes?.[rowIndex]?.docType;
  return DOC_TYPE_OPTIONS.filter(option => !selectedElsewhere.has(option.value) || option.value === currentValue);
};

const AddIncentiveScheme = () => {
  const { incentiveSchemeId } = useParams();
  const isEdit = Boolean(incentiveSchemeId);
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedUsers = !isEdit ? location.state?.preselectedUsers || [] : [];
  const { currencySymbol } = useCompanyCurrency();
  const { useIncentiveConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.incentive);
  const { accessRoles, signin } = useAuth();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || Boolean(signin?.user?.isAdmin);
  const canSubmit = isAdmin || Boolean(isEdit ? useIncentiveConfig?.update : useIncentiveConfig?.add);
  const { singleScheme, consumption, loading, submitLoading, getIncentiveSchemeById, getSchemeConsumption, createIncentiveScheme, updateIncentiveScheme, resetScheme } = useIncentiveScheme();

  const { usersDropdown, getUsersDropdown } = useUser();
  const { itemGroupDrop, getItemGroupDropdown } = useItemGroup();
  const { itemDrop, getItemDrop } = useItemMaster();
  const submitStatusRef = useRef('DRAFT');
  const formikRef = useRef(null);
  const scrollToError = useScrollToError();

  const initialValues = isEdit ? singleScheme : null;
  const lockedUserIds = isEdit ? (consumption?.byUser || []).map(u => u._id?.toString()).filter(Boolean) : [];
  const lockedUserSet = useMemo(() => new Set(lockedUserIds.map(id => id?.toString())), [lockedUserIds]);
  const validationSchema = useMemo(() => getIncentiveSchemeValidateSchema(isEdit), [isEdit]);
  const title = isEdit ? 'Edit Scheme' : 'New Incentive Scheme';

  useEffect(() => {
    if (isEdit) {
      getIncentiveSchemeById({ schemeId: incentiveSchemeId });
      getSchemeConsumption({ schemeId: incentiveSchemeId });
    }
    return () => resetScheme();
  }, [incentiveSchemeId, isEdit, getIncentiveSchemeById, getSchemeConsumption, resetScheme]);

  useEffect(() => {
    getUsersDropdown();
    getItemGroupDropdown({});
    getItemDrop({});
  }, [getUsersDropdown, getItemGroupDropdown, getItemDrop]);

  const formInitialValues = useMemo(
    () => ({
      name: initialValues?.name || '',
      totalBudget: initialValues?.totalBudget ?? '',
      dateRange: initialValues?.startDate && initialValues?.endDate ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)] : null,
      docTypes:
        initialValues?.docTypes?.map(docTypeRow => ({
          ...docTypeRow,
          items: normalizeIdList(docTypeRow.items),
          itemGroups: normalizeIdList(docTypeRow.itemGroups),
        })) || [],
      assignedUsers: initialValues?.assignedUsers?.map(u => u._id || u) || preselectedUsers,
      perUserBudgetCap: initialValues?.perUserBudgetCap ?? '',
      alertThreshold: initialValues?.alertThreshold ?? 80,
      status: initialValues?.status || 'DRAFT',
    }),
    [initialValues, preselectedUsers]
  );

  const userOptions = (usersDropdown || []).map(user => {
    const fullName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ');
    const email = user.email || '';
    const label = fullName ? (email ? `${fullName} (${email})` : fullName) : email;
    return {
      label,
      value: user.id || user._id,
    };
  });

  const itemGroupOptions = useMemo(() => {
    const base = toSelectOptions(
      itemGroupDrop,
      initialValues?.docTypes?.flatMap(row => row.itemGroups || []) || [],
      group => group.id || group._id,
      group => group.name
    );
    const byId = new Map((itemGroupDrop || []).map(group => [String(group.id || group._id), group]));
    return base.map(opt => {
      const source = byId.get(String(opt.value));
      const code = source?.itemGroupId || '-';
      return {
        ...opt,
        columnId: code,
        columnName: opt.label || '-',
        searchLabel: `${code} ${opt.label || ''}`.replace(/\s+/g, ' ').trim(),
      };
    });
  }, [itemGroupDrop, initialValues?.docTypes]);

  const itemOptions = useMemo(() => {
    const base = toSelectOptions(
      itemDrop,
      initialValues?.docTypes?.flatMap(row => row.items || []) || [],
      item => item._id || item.id,
      item => item.itemName || item.itemNo || item.name
    );
    const byId = new Map((itemDrop || []).map(item => [String(item._id || item.id), item]));
    return base.map(opt => {
      const source = byId.get(String(opt.value));
      const code = source?.itemNo || source?.itemCode || '-';
      const name = opt.label || '-';
      return {
        ...opt,
        columnId: code,
        columnName: name,
        searchLabel: `${code} ${name}`.replace(/\s+/g, ' ').trim(),
      };
    });
  }, [itemDrop, initialValues?.docTypes]);

  const incentiveTypeOptions = useMemo(
    () => [
      { label: '%', value: 'PERCENTAGE' },
      { label: currencySymbol, value: 'FIXED' },
    ],
    [currencySymbol]
  );

  const handleBack = () => navigate(listPath);

  const handleFormFinish = async values => {
    try {
      if (isEdit) {
        const totalConsumed = singleScheme?.totalConsumed ?? 0;
        if (totalConsumed > 0 && values.totalBudget < totalConsumed) {
          const confirmed = await new Promise(resolve => {
            Modal.confirm({
              title: 'Budget Below Consumed Amount',
              content: `The new budget (${fmtShort(values.totalBudget)}) is less than what has already been consumed (${fmtShort(totalConsumed)}). This will create a deficit. Are you sure you want to proceed?`,
              okText: 'Proceed Anyway',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          if (!confirmed) return;
        }
        const updateData = { ...values };
        delete updateData.status;
        await updateIncentiveScheme({ schemeId: incentiveSchemeId, data: updateData });
      } else {
        await createIncentiveScheme(values);
      }
      navigate(listPath);
    } catch (_) {
      /* errors surfaced by hook */
    }
  };

  const handleSubmit = values => {
    const { dateRange, totalBudget, perUserBudgetCap, alertThreshold, docTypes, ...rest } = values;
    handleFormFinish({
      ...rest,
      totalBudget: toNumberOr(totalBudget, 0),
      perUserBudgetCap: toNumberOrNull(perUserBudgetCap),
      alertThreshold: toNumberOr(alertThreshold, 80),
      docTypes: (docTypes || []).map(docTypeRow => {
        const cleanRow = {
          docType: docTypeRow.docType,
          calcMethod: docTypeRow.calcMethod,
          incentiveType: docTypeRow.incentiveType,
          incentiveValue: toNumberOr(docTypeRow.incentiveValue, 0),
          allocatedBudget: toNumberOr(docTypeRow.allocatedBudget, 0),
        };
        if (docTypeRow.calcMethod === 'PER_ITEM_GROUP') cleanRow.itemGroups = docTypeRow.itemGroups || [];
        if (docTypeRow.calcMethod === 'PER_ITEM') cleanRow.items = docTypeRow.items || [];
        return cleanRow;
      }),
      status: submitStatusRef.current,
      startDate: dateRange?.[0]?.toISOString?.() || dateRange?.[0],
      endDate: dateRange?.[1]?.toISOString?.() || dateRange?.[1],
    });
  };

  const isLoadingEdit = isEdit && loading && !singleScheme;

  if (!isAdmin && !useIncentiveConfig?.view) {
    return <AccessFallback description="You don't have permission to access the Incentive Schemes module" />;
  }

  if (isLoadingEdit) {
    return <AddIncentiveSchemeSkeleton />;
  }

  return (
    <>
      <div className="bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <Button className="flex items-center justify-center hover:bg-gray-100 bg-gray-50 transition-colors" type="text" onClick={handleBack}>
            <Icons.ArrowLeftOutlined />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
      </div>
      <div className="p-5">
        <Formik key={incentiveSchemeId || 'create'} innerRef={formikRef} initialValues={formInitialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, errors, touched, submitCount, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
            const showError = fieldTouched => Boolean(fieldTouched || submitCount > 0);

            const handleFormSubmit = async status => {
              if (submitLoading || !formikRef.current) return;

              submitStatusRef.current = status;

              const validationErrors = await formikRef.current.validateForm();
              if (Object.keys(validationErrors).length > 0) {
                setTouched(errorsToTouched(validationErrors));
                const firstErrorField = Object.keys(validationErrors)[0];
                scrollToError(firstErrorField, validationErrors);
                return;
              }

              handleSubmit();
            };

            const disableSchemeDates = current => {
              if (!current || isEdit) return false;
              return current.isBefore(dayjs().startOf('day'), 'day');
            };

            return (
              <CustomForm name="incentive-scheme-form" onFinish={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <CustomInput
                    name="name"
                    label="Scheme Name"
                    placeholder="e.g. Q2 Invoice Push 2025"
                    value={values.name}
                    onBlur={handleBlur}
                    errorMessage={errors.name}
                    touched={touched.name}
                    setFieldValue={setFieldValue}
                    required
                  />
                  <CustomInput
                    name="totalBudget"
                    label="Total Budget (₹)"
                    type="number"
                    placeholder="200000"
                    value={values.totalBudget}
                    onBlur={handleBlur}
                    errorMessage={errors.totalBudget}
                    touched={touched.totalBudget}
                    setFieldValue={setFieldValue}
                    required
                  />
                  <div id="dateRange" className="min-w-0 md:col-span-2 lg:col-span-1">
                    <CustomDatePicker label="Scheme Period" hidePresetSelect dateRange={values.dateRange} setDateRange={range => setFieldValue('dateRange', range)} disabledDate={disableSchemeDates} />
                    {showError(touched.dateRange) && errors.dateRange && <div className="text-red-500 text-xs mt-1">{errors.dateRange}</div>}
                  </div>
                </div>

                <SectionDivider>Document Type Incentives</SectionDivider>

                <div id="docTypes">
                  {typeof errors.docTypes === 'string' && showError(touched.docTypes) && <div className="text-red-500 text-xs mb-2">{errors.docTypes}</div>}

                  <FieldArray name="docTypes">
                    {({ push, remove }) => (
                      <>
                        {values.docTypes?.map((_, index) => {
                          const hasLogs = (initialValues?.docTypes?.[index]?.consumed || 0) > 0;
                          return (
                            <div key={index} className="bg-[#fafaf9] border border-gray-200 rounded-lg px-3.5 py-3 mb-2.5">
                              {hasLogs && (
                                <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2 flex items-center gap-1">
                                  <span>🔒</span> Calc method and document type are locked — activity logs exist for this entry.
                                </div>
                              )}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '2fr 1.6fr 0.8fr 0.8fr 1.4fr auto',
                                  gap: 12,
                                  alignItems: 'start',
                                }}
                              >
                                <CustomInput
                                  type="select"
                                  name={`docTypes.${index}.docType`}
                                  label="Document Type"
                                  placeholder="Select"
                                  selectOptions={getDocTypeOptionsForRow(values.docTypes, index)}
                                  value={values.docTypes?.[index]?.docType}
                                  onBlur={handleBlur}
                                  errorMessage={errors.docTypes?.[index]?.docType}
                                  touched={showError(touched.docTypes?.[index]?.docType)}
                                  setFieldValue={setFieldValue}
                                  disabled={hasLogs}
                                  required
                                />

                                <CustomInput
                                  type="select"
                                  name={`docTypes.${index}.calcMethod`}
                                  label="Calc Method"
                                  selectOptions={CALC_METHOD_OPTIONS}
                                  value={values.docTypes?.[index]?.calcMethod}
                                  onBlur={handleBlur}
                                  errorMessage={errors.docTypes?.[index]?.calcMethod}
                                  touched={touched.docTypes?.[index]?.calcMethod}
                                  setFieldValue={setFieldValue}
                                  disabled={hasLogs}
                                />

                                <CustomInput
                                  type="select"
                                  name={`docTypes.${index}.incentiveType`}
                                  label="Type"
                                  selectOptions={incentiveTypeOptions}
                                  value={values.docTypes?.[index]?.incentiveType}
                                  onBlur={handleBlur}
                                  errorMessage={errors.docTypes?.[index]?.incentiveType}
                                  touched={touched.docTypes?.[index]?.incentiveType}
                                  setFieldValue={setFieldValue}
                                />

                                <CustomInput
                                  type="number"
                                  name={`docTypes.${index}.incentiveValue`}
                                  label="Value"
                                  placeholder="5"
                                  value={values.docTypes?.[index]?.incentiveValue}
                                  onBlur={handleBlur}
                                  errorMessage={errors.docTypes?.[index]?.incentiveValue}
                                  touched={showError(touched.docTypes?.[index]?.incentiveValue)}
                                  setFieldValue={setFieldValue}
                                  required
                                />

                                <CustomInput
                                  type="number"
                                  name={`docTypes.${index}.allocatedBudget`}
                                  label="Alloc. Budget"
                                  placeholder="50000"
                                  value={values.docTypes?.[index]?.allocatedBudget}
                                  onBlur={handleBlur}
                                  errorMessage={errors.docTypes?.[index]?.allocatedBudget}
                                  touched={touched.docTypes?.[index]?.allocatedBudget}
                                  setFieldValue={setFieldValue}
                                />

                                <div className="flex items-end h-full pb-1">
                                  <Button type="text" onClick={() => remove(index)} disabled={hasLogs}>
                                    <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                                  </Button>
                                </div>
                              </div>

                              {values.docTypes?.[index]?.calcMethod === 'PER_ITEM_GROUP' && (
                                <div className="mt-2">
                                  {hasLogs ? (
                                    <LockedMultiSelectDisplay label="Item Groups" required values={values.docTypes?.[index]?.itemGroups} options={itemGroupOptions} />
                                  ) : (
                                    <CustomInput
                                      type="select"
                                      name={`docTypes.${index}.itemGroups`}
                                      label="Item Groups"
                                      mode="multiple"
                                      selectVariant="twoColumn"
                                      columnSelectHeader={itemGroupSelectColumnHeader}
                                      selectOptions={itemGroupOptions}
                                      placeholder="Select item groups"
                                      allowClear
                                      value={values.docTypes?.[index]?.itemGroups}
                                      onBlur={handleBlur}
                                      errorMessage={errors.docTypes?.[index]?.itemGroups}
                                      touched={showError(touched.docTypes?.[index]?.itemGroups)}
                                      setFieldValue={setFieldValue}
                                      required
                                    />
                                  )}
                                </div>
                              )}

                              {values.docTypes?.[index]?.calcMethod === 'PER_ITEM' && (
                                <div className="mt-2">
                                  {hasLogs ? (
                                    <LockedMultiSelectDisplay label="Items" required values={values.docTypes?.[index]?.items} options={itemOptions} />
                                  ) : (
                                    <CustomInput
                                      type="select"
                                      name={`docTypes.${index}.items`}
                                      label="Items"
                                      mode="multiple"
                                      selectVariant="twoColumn"
                                      columnSelectHeader={itemSelectColumnHeader}
                                      selectOptions={itemOptions}
                                      placeholder="Select items"
                                      allowClear
                                      showSearch
                                      value={values.docTypes?.[index]?.items}
                                      onBlur={handleBlur}
                                      errorMessage={errors.docTypes?.[index]?.items}
                                      touched={showError(touched.docTypes?.[index]?.items)}
                                      setFieldValue={setFieldValue}
                                      required
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <Button type="dashed" onClick={() => push({ ...DOC_TYPE_ROW_DEFAULTS })} block className="mb-3" disabled={(values.docTypes?.length || 0) >= DOC_TYPE_OPTIONS.length}>
                          + Add Document Type
                        </Button>
                      </>
                    )}
                  </FieldArray>
                </div>

                <SectionDivider>Assign Users</SectionDivider>

                <div className="mb-2">
                  {lockedUserSet.size > 0 ? (
                    <div className="space-y-2">
                      <CustomLabel label="Team Members" />
                      <LockedMultiSelectDisplay hideLabel values={(values.assignedUsers || []).filter(userId => lockedUserSet.has(String(userId)))} options={userOptions} lockedIds={lockedUserSet} />
                      <CustomInput
                        name="assignedUsers"
                        type="select"
                        mode="multiple"
                        selectOptions={userOptions}
                        placeholder="Select team members"
                        allowClear
                        showSearch
                        value={(values.assignedUsers || []).filter(userId => !lockedUserSet.has(String(userId)))}
                        onBlur={handleBlur}
                        errorMessage={errors.assignedUsers}
                        touched={touched.assignedUsers}
                        setFieldValue={setFieldValue}
                        onChange={next => {
                          const unlocked = next || [];
                          setFieldValue('assignedUsers', [...new Set([...lockedUserSet, ...unlocked])]);
                        }}
                      />
                    </div>
                  ) : (
                    <CustomInput
                      name="assignedUsers"
                      label="Team Members"
                      type="select"
                      mode="multiple"
                      selectOptions={userOptions}
                      placeholder="Select team members"
                      allowClear
                      showSearch
                      value={values.assignedUsers}
                      onBlur={handleBlur}
                      errorMessage={errors.assignedUsers}
                      touched={touched.assignedUsers}
                      setFieldValue={setFieldValue}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
                  <CustomInput
                    name="perUserBudgetCap"
                    label="Per-User Budget Cap (₹) — optional"
                    type="number"
                    placeholder="15000"
                    value={values.perUserBudgetCap}
                    onBlur={handleBlur}
                    errorMessage={errors.perUserBudgetCap}
                    touched={touched.perUserBudgetCap}
                    setFieldValue={setFieldValue}
                  />
                  <CustomInput
                    name="alertThreshold"
                    label="Alert Threshold (%)"
                    type="number"
                    placeholder="80"
                    value={values.alertThreshold}
                    onBlur={handleBlur}
                    errorMessage={errors.alertThreshold}
                    touched={touched.alertThreshold}
                    setFieldValue={setFieldValue}
                  />
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
                  <div className="flex justify-end gap-4 px-6 py-[12.5px]">
                    <PermissionButton type="default" text="Save as Draft" onClick={() => handleFormSubmit('DRAFT')} disabled={submitLoading} canAccess={canSubmit} />
                    <PermissionButton type="primary" text="Save & Publish" onClick={() => handleFormSubmit('ACTIVE')} loading={submitLoading} canAccess={canSubmit} />
                  </div>
                </div>
              </CustomForm>
            );
          }}
        </Formik>
      </div>
    </>
  );
};

export default AddIncentiveScheme;
