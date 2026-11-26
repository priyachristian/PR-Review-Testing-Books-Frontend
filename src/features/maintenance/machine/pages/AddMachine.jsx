import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { FieldArray, FormikProvider, useFormik } from 'formik';

import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { Tooltip } from '@/components/AntDComponent';

import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useSparePart } from '@/features/maintenance/sparePart';
import {
  MACHINE_CRITICALITY,
  MACHINE_PM_TASK_TYPES,
  emptyPmTask,
  emptyWearPart,
  firstErrorFieldId,
  machineValidateSchema,
  numberValue,
  refId,
  sparePartLabel,
  toNumberOrNull,
  touchAll,
  unitName,
  useMachine,
} from '@/features/maintenance/machine';
import Icons from 'assets/icons/icon';
import { toApiDate } from '@/utils/util';
import { colorPalette } from '@/utils/theme';

const AddMachine = () => {
  const { machineId } = useParams();
  const { machine, detailLoading, submitLoading, getMachineById, createMachine, updateMachine, resetMachineDetail } = useMachine();
  const { sparePartDropdown, dropdownLoading: sparePartDropdownLoading, getSparePartDropdown } = useSparePart();
  const scrollToError = useScrollToError();

  const machineData = machine?.machineName || machine?.machineCode ? machine : machine?.machine || machine?.result || null;

  const initialValues = useMemo(
    () => ({
      machineName: machineData?.machineName || '',
      location: machineData?.location || '',
      process: typeof machineData?.process === 'string' ? machineData.process : machineData?.process?.name || '',
      criticality: machineData?.criticality || null,
      hasAMC: Boolean(machineData?.hasAMC),
      pmFrequencyDays: numberValue(machineData?.pmFrequencyDays),
      lastPMDate: machineData?.lastPMDate ? dayjs(machineData.lastPMDate) : null,
      nextPMDueDate: machineData?.nextPMDueDate ? dayjs(machineData.nextPMDueDate) : null,
      pmTasks: Array.isArray(machineData?.pmTasks)
        ? machineData.pmTasks.map(task => ({
            taskType: task?.taskType || null,
            description: task?.description || '',
            isRequired: task?.isRequired !== false,
          }))
        : [],
      wearParts: Array.isArray(machineData?.wearParts)
        ? machineData.wearParts.map(part => ({
            sparePartId: refId(part?.sparePartId),
            avgLifeHours: numberValue(part?.avgLifeHours),
            uom: unitName(part?.uom) || unitName(part?.sparePartId?.uom),
          }))
        : [],
    }),
    [machineData]
  );

  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const sparePartOptions = useMemo(() => {
    const options = (sparePartDropdown || []).map(part => ({
      value: part._id || part.id,
      label: sparePartLabel(part),
    }));

    if (Array.isArray(machineData?.wearParts)) {
      machineData.wearParts.forEach(part => {
        const sparePart = part?.sparePartId;
        const value = refId(sparePart);
        if (!value || options.some(option => option.value === value)) return;
        options.push({ value, label: typeof sparePart === 'string' ? sparePart : sparePartLabel(sparePart) || value });
      });
    }

    return options.filter(option => option.value);
  }, [sparePartDropdown, machineData]);

  const sparePartUomName = sparePartId => {
    if (!sparePartId) return null;
    const part = (sparePartDropdown || []).find(item => (item.id || item._id) === sparePartId);
    return unitName(part?.uom);
  };

  const onFinish = async values => {
    if (submitLoading) return;

    const payload = {
      machineName: values.machineName.trim(),
      location: values.location.trim(),
      process: values.process.trim(),
      criticality: values.criticality,
      hasAMC: Boolean(values.hasAMC),
      pmFrequencyDays: toNumberOrNull(values.pmFrequencyDays),
      lastPMDate: toApiDate(values.lastPMDate),
      nextPMDueDate: toApiDate(values.nextPMDueDate),
      pmTasks: (values.pmTasks || [])
        .filter(task => task?.taskType || String(task?.description || '').trim())
        .map(task => ({
          taskType: task.taskType,
          description: task.description?.trim() || '',
          isRequired: Boolean(task.isRequired),
        })),
      wearParts: (values.wearParts || [])
        .filter(part => part?.sparePartId || part?.uom || part?.avgLifeHours !== '')
        .map(part => ({
          sparePartId: part.sparePartId,
          avgLifeHours: toNumberOrNull(part.avgLifeHours),
          uom: part.uom,
        })),
    };

    try {
      if (machineId) {
        await updateMachine({ machineId, machineData: payload });
      } else {
        await createMachine(payload);
      }
      navigateAfterSave('/machine');
    } catch {
      // The slice already shows the error toast.
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: machineValidateSchema,
    onSubmit: onFinish,
  });

  useEffect(() => {
    const controller = new AbortController();
    getSparePartDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [getSparePartDropdown]);

  useEffect(() => {
    if (!sparePartDropdown?.length || !formik.values.wearParts?.length) return;

    formik.values.wearParts.forEach((part, index) => {
      const name = sparePartUomName(part?.sparePartId);
      if (name && part?.uom !== name) {
        formik.setFieldValue(`wearParts.${index}.uom`, name);
      }
    });
  }, [sparePartDropdown, machineData]);

  useEffect(() => {
    const controller = new AbortController();
    if (machineId) {
      getMachineById({ machineId, signal: controller.signal });
    } else {
      resetMachineDetail();
    }

    return () => {
      controller.abort();
      resetMachineDetail();
    };
  }, [machineId, getMachineById, resetMachineDetail]);

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  if (machineId && detailLoading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <FormikProvider value={formik}>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{machineId ? `Edit Machine / ${machineData?.machineCode || ''}` : 'Add Machine'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="addmachine" onFinish={formik.handleSubmit}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Basic details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="text"
                    name="machineName"
                    label="Machine Name"
                    placeholder="Enter machine name"
                    value={formik.values.machineName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.machineName}
                    touched={formik.touched.machineName}
                    setFieldValue={formik.setFieldValue}
                    required
                  />
                  <CustomInput
                    type="text"
                    name="location"
                    label="Location"
                    placeholder="Enter location"
                    value={formik.values.location}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.location}
                    touched={formik.touched.location}
                    setFieldValue={formik.setFieldValue}
                    required
                  />
                  <CustomInput
                    type="text"
                    name="process"
                    label="Process"
                    placeholder="Enter process"
                    value={formik.values.process}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.process}
                    touched={formik.touched.process}
                    setFieldValue={formik.setFieldValue}
                    required
                  />
                  <CustomInput
                    type="select"
                    name="criticality"
                    label="Criticality"
                    placeholder="Select criticality"
                    value={formik.values.criticality}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.criticality}
                    touched={formik.touched.criticality}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={MACHINE_CRITICALITY}
                    required
                    allowClear
                  />
                  <div className="pt-7">
                    <CustomInput type="checkbox" name="hasAMC" label="" CheckboxName="Has AMC" value={formik.values.hasAMC} onBlur={formik.handleBlur} setFieldValue={formik.setFieldValue} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Preventive maintenance</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="number"
                    name="pmFrequencyDays"
                    label="PM Frequency (Days)"
                    placeholder="Enter frequency in days"
                    decimalPlaces={0}
                    value={formik.values.pmFrequencyDays}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.pmFrequencyDays}
                    touched={formik.touched.pmFrequencyDays}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="date"
                    name="lastPMDate"
                    label="Last PM Date"
                    placeholder="Select date"
                    value={formik.values.lastPMDate}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.lastPMDate}
                    touched={formik.touched.lastPMDate}
                    setFieldValue={formik.setFieldValue}
                    setFieldTouched={formik.setFieldTouched}
                    format="DD/MM/YYYY"
                  />
                  <CustomInput
                    type="date"
                    name="nextPMDueDate"
                    label="Next PM Due Date"
                    placeholder="Select date"
                    value={formik.values.nextPMDueDate}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.nextPMDueDate}
                    touched={formik.touched.nextPMDueDate}
                    setFieldValue={formik.setFieldValue}
                    setFieldTouched={formik.setFieldTouched}
                    format="DD/MM/YYYY"
                  />
                </div>

                <div id="pmTasks" className="mt-5">
                  <h4 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">PM Tasks</h4>
                  <FieldArray name="pmTasks">
                    {({ push, remove }) => {
                      const pmTasks = formik.values.pmTasks || [];
                      const selectedTaskTypes = pmTasks.map(task => task?.taskType).filter(Boolean);
                      const addTaskDisabled = pmTasks.length >= MACHINE_PM_TASK_TYPES.length;
                      const addTaskTooltip = addTaskDisabled ? `You can add only ${MACHINE_PM_TASK_TYPES.length} tasks` : '';
                      const taskTypeOptions = index => MACHINE_PM_TASK_TYPES.filter(option => option.value === pmTasks[index]?.taskType || !selectedTaskTypes.includes(option.value));

                      return (
                        <div>
                          {pmTasks.length ? (
                            <div className="overflow-hidden rounded-md border border-gray-200">
                              <div className="pm-task-grid border-b border-gray-200 bg-gray-50 px-3 py-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                  <span className="ant-form-item-required" />
                                  Task Type
                                </div>
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Description</div>
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Required</div>
                                <div />
                              </div>
                              {pmTasks.map((_, index) => (
                                <div key={`pm-task-${index}`} className={index > 0 ? 'border-t border-gray-200' : ''}>
                                  <div className="pm-task-grid px-3 py-3">
                                    <CustomInput
                                      type="select"
                                      name={`pmTasks.${index}.taskType`}
                                      placeholder="Select task type"
                                      value={pmTasks[index]?.taskType}
                                      onBlur={formik.handleBlur}
                                      errorMessage={formik.errors.pmTasks?.[index]?.taskType}
                                      touched={formik.touched.pmTasks?.[index]?.taskType}
                                      setFieldValue={formik.setFieldValue}
                                      selectOptions={taskTypeOptions(index)}
                                      aria-label={`PM task ${index + 1} type`}
                                      allowClear
                                      required
                                    />
                                    <CustomInput
                                      type="text"
                                      name={`pmTasks.${index}.description`}
                                      placeholder="Enter task description"
                                      value={pmTasks[index]?.description}
                                      onChange={formik.handleChange}
                                      onBlur={formik.handleBlur}
                                      errorMessage={formik.errors.pmTasks?.[index]?.description}
                                      touched={formik.touched.pmTasks?.[index]?.description}
                                      setFieldValue={formik.setFieldValue}
                                      aria-label={`PM task ${index + 1} description`}
                                    />
                                    <div className="flex h-[34px] items-center">
                                      <CustomInput
                                        type="checkbox"
                                        name={`pmTasks.${index}.isRequired`}
                                        value={pmTasks[index]?.isRequired}
                                        onBlur={formik.handleBlur}
                                        setFieldValue={formik.setFieldValue}
                                        aria-label={`PM task ${index + 1} required`}
                                      />
                                    </div>
                                    <div className="flex h-[34px] items-center justify-center">
                                      <button type="button" className="flex h-[34px] items-center text-xl cursor-pointer" onClick={() => remove(index)} aria-label={`Remove PM task ${index + 1}`}>
                                        <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 m-0">No PM tasks added.</p>
                          )}
                          <Tooltip title={addTaskTooltip}>
                            <span className={`mt-3 inline-flex ${addTaskDisabled ? 'cursor-not-allowed' : ''}`}>
                              <CustomButton
                                type="primary"
                                htmlType="button"
                                disabled={addTaskDisabled}
                                onClick={() => {
                                  if (pmTasks.length >= MACHINE_PM_TASK_TYPES.length) return;
                                  push(emptyPmTask());
                                }}
                                text={
                                  <div className="flex gap-1 text-xs items-center">
                                    <Icons.PlusCircleOutlined className="text-xs" />
                                    <div>Add Task</div>
                                  </div>
                                }
                              />
                            </span>
                          </Tooltip>
                        </div>
                      );
                    }}
                  </FieldArray>
                </div>
              </div>

              <div id="wearParts" className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Wear parts</h3>
                <FieldArray name="wearParts">
                  {({ push, remove }) => {
                    const wearParts = formik.values.wearParts || [];
                    const selectedSparePartIds = wearParts.map(part => part?.sparePartId).filter(Boolean);
                    const addWearPartDisabled = !sparePartDropdownLoading && wearParts.length >= sparePartOptions.length;
                    const addWearPartTooltip = addWearPartDisabled && sparePartOptions.length ? `You can add only ${sparePartOptions.length} wear parts` : '';
                    const sparePartOptionsForRow = index => sparePartOptions.filter(option => option.value === wearParts[index]?.sparePartId || !selectedSparePartIds.includes(option.value));

                    return (
                      <div>
                        {wearParts.length ? (
                          <div className="overflow-hidden rounded-md border border-gray-200">
                            <div className="wear-part-grid border-b border-gray-200 bg-gray-50 px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <span className="ant-form-item-required" />
                                Spare Part
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                <span className="ant-form-item-required" />
                                Avg Life Hours
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">UOM</div>
                              <div />
                            </div>
                            {wearParts.map((_, index) => (
                              <div key={`wear-part-${index}`} className={index > 0 ? 'border-t border-gray-200' : ''}>
                                <div className="wear-part-grid px-3 py-3">
                                  <CustomInput
                                    type="select"
                                    name={`wearParts.${index}.sparePartId`}
                                    placeholder="Select spare part"
                                    value={wearParts[index]?.sparePartId}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.wearParts?.[index]?.sparePartId}
                                    touched={formik.touched.wearParts?.[index]?.sparePartId}
                                    setFieldValue={formik.setFieldValue}
                                    onChange={selectedId => {
                                      formik.setFieldValue(`wearParts.${index}.uom`, sparePartUomName(selectedId));
                                    }}
                                    selectOptions={sparePartOptionsForRow(index)}
                                    loading={sparePartDropdownLoading}
                                    aria-label={`Wear part ${index + 1} spare part`}
                                    allowClear
                                    required
                                  />
                                  <CustomInput
                                    type="number"
                                    name={`wearParts.${index}.avgLifeHours`}
                                    placeholder="Enter hours"
                                    decimalPlaces={0}
                                    value={wearParts[index]?.avgLifeHours}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.wearParts?.[index]?.avgLifeHours}
                                    touched={formik.touched.wearParts?.[index]?.avgLifeHours}
                                    setFieldValue={formik.setFieldValue}
                                    aria-label={`Wear part ${index + 1} average life hours`}
                                    required
                                  />
                                  <CustomInput
                                    type="select"
                                    name={`wearParts.${index}.uom`}
                                    placeholder="Select a spare part"
                                    value={wearParts[index]?.uom}
                                    onBlur={formik.handleBlur}
                                    errorMessage={formik.errors.wearParts?.[index]?.uom}
                                    touched={formik.touched.wearParts?.[index]?.uom}
                                    setFieldValue={formik.setFieldValue}
                                    selectOptions={wearParts[index]?.uom ? [{ value: wearParts[index].uom, label: wearParts[index].uom }] : []}
                                    aria-label={`Wear part ${index + 1} unit`}
                                    disabled
                                  />
                                  <div className="flex h-[34px] items-center justify-center">
                                    <button type="button" className="flex h-[34px] items-center text-xl cursor-pointer" onClick={() => remove(index)} aria-label={`Remove wear part ${index + 1}`}>
                                      <Icons.DeleteOutlined style={{ color: colorPalette.error[500] }} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 m-0">No wear parts added.</p>
                        )}
                        <Tooltip title={addWearPartTooltip}>
                          <span className={`mt-3 inline-flex ${addWearPartDisabled ? 'cursor-not-allowed' : ''}`}>
                            <CustomButton
                              type="primary"
                              htmlType="button"
                              disabled={addWearPartDisabled}
                              onClick={() => {
                                if (wearParts.length >= sparePartOptions.length) return;
                                push(emptyWearPart());
                              }}
                              text={
                                <div className="flex gap-1 text-xs items-center">
                                  <Icons.PlusCircleOutlined className="text-xs" />
                                  <div>Add Wear Part</div>
                                </div>
                              }
                            />
                          </span>
                        </Tooltip>
                      </div>
                    );
                  }}
                </FieldArray>
              </div>
            </div>
            <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
              <CustomButton
                className="px-8 py-4 min-w-[50px]"
                type="primary"
                htmlType="button"
                text="Save"
                loading={submitLoading}
                onClick={async () => {
                  await formik.setTouched(touchAll(formik.values), false);
                  const errors = await formik.validateForm();
                  if (Object.keys(errors).length > 0) {
                    scrollToError(firstErrorFieldId(errors), errors);
                    return;
                  }
                  formik.handleSubmit();
                }}
              />
              <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={() => handleNavigation(-1)} />
            </div>
          </CustomForm>
        </div>
      </div>
    </FormikProvider>
  );
};

export default AddMachine;
