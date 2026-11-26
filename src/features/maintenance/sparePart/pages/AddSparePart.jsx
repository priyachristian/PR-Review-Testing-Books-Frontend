import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useFormik } from 'formik';

import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

import useScrollToError from 'hooks/useScrollToError';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useItemUnitsDropdown } from '@/features/setting/itemUnit';
import { useMachine } from '@/features/maintenance/machine/useMachine';
import { SPARE_PART_CATEGORIES, sparePartValidateSchema, useSparePart } from '@/features/maintenance/sparePart';

const refId = value => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id || value._id || null;
};

const numberValue = value => (value === 0 || value ? value : '');

const toNumberOrNull = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const machineLabel = machine => [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - ') || machine?.machineName || machine?.machineCode || '';

const AddSparePart = () => {
  const { sparePartId } = useParams();
  const { sparePart, detailLoading, submitLoading, getSparePartById, createSparePart, updateSparePart, resetSparePartDetail } = useSparePart();
  const { itemUnitsOptions, itemUnitsDropLoading } = useItemUnitsDropdown();
  const { machineDropdown, dropdownLoading: machineDropdownLoading, getMachineDropdown } = useMachine();
  const scrollToError = useScrollToError();

  const sparePartData = sparePart?.name || sparePart?.category ? sparePart : sparePart?.sparePart || sparePart?.result || null;

  const initialValues = useMemo(
    () => ({
      name: sparePartData?.name || '',
      category: sparePartData?.category || null,
      uom: refId(sparePartData?.uom),
      standardRate: numberValue(sparePartData?.standardRate),
      ...(sparePartId ? {} : { stock: '' }),
      minStockLevel: numberValue(sparePartData?.minStockLevel),
      maxStockLevel: numberValue(sparePartData?.maxStockLevel),
      preferredVendor: sparePartData?.preferredVendor || '',
      leadDays: numberValue(sparePartData?.leadDays),
      drawingReference: sparePartData?.drawingReference || '',
      fitsOnMachines: Array.isArray(sparePartData?.fitsOnMachines) ? sparePartData.fitsOnMachines.map(refId).filter(Boolean) : [],
    }),
    [sparePartData, sparePartId]
  );

  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  const uomOptions = useMemo(() => {
    const options = [...(itemUnitsOptions || [])];
    const currentId = refId(sparePartData?.uom);
    const currentName = sparePartData?.uom?.name;
    if (currentId && currentName && !options.some(option => option.value === currentId)) {
      options.unshift({ value: currentId, label: currentName });
    }
    return options;
  }, [itemUnitsOptions, sparePartData]);

  const machineOptions = useMemo(() => {
    const options = (machineDropdown || []).map(machine => ({
      value: machine.id || machine._id,
      label: machineLabel(machine),
    }));
    if (Array.isArray(sparePartData?.fitsOnMachines)) {
      sparePartData.fitsOnMachines.forEach(machine => {
        const value = refId(machine);
        if (!value || options.some(option => option.value === value)) return;
        options.push({ value, label: typeof machine === 'string' ? machine : machineLabel(machine) || value });
      });
    }
    return options;
  }, [machineDropdown, sparePartData]);

  const onFinish = async values => {
    if (submitLoading) return;

    const payload = {
      name: values.name.trim(),
      category: values.category,
      uom: values.uom,
      standardRate: toNumberOrNull(values.standardRate),
      ...(!sparePartId ? { stock: toNumberOrNull(values.stock) } : {}),
      minStockLevel: toNumberOrNull(values.minStockLevel),
      maxStockLevel: toNumberOrNull(values.maxStockLevel),
      preferredVendor: values.preferredVendor?.trim() || '',
      leadDays: toNumberOrNull(values.leadDays),
      drawingReference: values.drawingReference?.trim() || '',
      fitsOnMachines: values.fitsOnMachines || [],
    };

    try {
      if (sparePartId) {
        await updateSparePart({ sparePartId, sparePartData: payload });
      } else {
        await createSparePart(payload);
      }
      navigateAfterSave('/spare-part');
    } catch {
      // The slice already shows the error toast.
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: sparePartValidateSchema,
    onSubmit: onFinish,
  });

  useEffect(() => {
    const controller = new AbortController();
    getMachineDropdown({ signal: controller.signal });
    return () => controller.abort();
  }, [getMachineDropdown]);

  useEffect(() => {
    const controller = new AbortController();
    if (sparePartId) {
      getSparePartById({ sparePartId, signal: controller.signal });
    } else {
      resetSparePartDetail();
    }

    return () => {
      controller.abort();
      resetSparePartDetail();
    };
  }, [sparePartId, getSparePartById, resetSparePartDetail]);

  useEffect(() => {
    updateFormValues(formik.values);
  }, [formik.values, updateFormValues]);

  if (sparePartId && detailLoading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{sparePartId ? `Edit Spare Part / ${sparePartData?.code || ''}` : 'Add Spare Part'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <CustomForm name="addsparepart" onFinish={formik.handleSubmit}>
            <div className="px-6 flex flex-col gap-2">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Basic details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="text"
                    name="name"
                    label="Name"
                    placeholder="Enter spare part name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.name}
                    touched={formik.touched.name}
                    setFieldValue={formik.setFieldValue}
                    required
                  />
                  <CustomInput
                    type="select"
                    name="category"
                    label="Category"
                    placeholder="Select category"
                    value={formik.values.category}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.category}
                    touched={formik.touched.category}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={SPARE_PART_CATEGORIES}
                    required
                    allowClear
                  />
                  <CustomInput
                    type="select"
                    name="uom"
                    label="UOM"
                    placeholder="Select unit"
                    value={formik.values.uom}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.uom}
                    touched={formik.touched.uom}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={uomOptions}
                    loading={itemUnitsDropLoading}
                    required
                    allowClear
                  />
                  <CustomInput
                    type="text"
                    name="drawingReference"
                    label="Drawing Reference"
                    placeholder="Enter drawing reference"
                    value={formik.values.drawingReference}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.drawingReference}
                    touched={formik.touched.drawingReference}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="select"
                    mode="multiple"
                    name="fitsOnMachines"
                    label="Fits On Machines"
                    placeholder="Select machines"
                    value={formik.values.fitsOnMachines}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.fitsOnMachines}
                    touched={formik.touched.fitsOnMachines}
                    setFieldValue={formik.setFieldValue}
                    selectOptions={machineOptions}
                    loading={machineDropdownLoading}
                    allowClear
                  />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Stock and supply</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                  <CustomInput
                    type="number"
                    name="standardRate"
                    label="Standard Rate"
                    placeholder="Enter standard rate"
                    decimalPlaces={2}
                    value={formik.values.standardRate}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.standardRate}
                    touched={formik.touched.standardRate}
                    setFieldValue={formik.setFieldValue}
                  />
                  {!sparePartId ? (
                    <CustomInput
                      type="number"
                      name="stock"
                      label="Opening Stock"
                      placeholder="Enter opening stock"
                      decimalPlaces={4}
                      value={formik.values.stock}
                      onBlur={formik.handleBlur}
                      errorMessage={formik.errors.stock}
                      touched={formik.touched.stock}
                      setFieldValue={formik.setFieldValue}
                    />
                  ) : null}
                  <CustomInput
                    type="number"
                    name="minStockLevel"
                    label="Min Stock Level"
                    placeholder="Enter min stock level"
                    decimalPlaces={4}
                    value={formik.values.minStockLevel}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.minStockLevel}
                    touched={formik.touched.minStockLevel}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="number"
                    name="maxStockLevel"
                    label="Max Stock Level"
                    placeholder="Enter max stock level"
                    decimalPlaces={4}
                    value={formik.values.maxStockLevel}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.maxStockLevel}
                    touched={formik.touched.maxStockLevel}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="text"
                    name="preferredVendor"
                    label="Preferred Vendor"
                    placeholder="Enter preferred vendor"
                    value={formik.values.preferredVendor}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.preferredVendor}
                    touched={formik.touched.preferredVendor}
                    setFieldValue={formik.setFieldValue}
                  />
                  <CustomInput
                    type="number"
                    name="leadDays"
                    label="Lead Days"
                    placeholder="Enter lead days"
                    decimalPlaces={0}
                    value={formik.values.leadDays}
                    onBlur={formik.handleBlur}
                    errorMessage={formik.errors.leadDays}
                    touched={formik.touched.leadDays}
                    setFieldValue={formik.setFieldValue}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
              <CustomButton
                className="px-8 py-4 min-w-[50px]"
                type="primary"
                htmlType="submit"
                text="Save"
                loading={submitLoading}
                onClick={async () => {
                  const errors = await formik.validateForm();
                  if (Object.keys(errors).length > 0) {
                    const firstErrorField = Object.keys(errors)[0];
                    scrollToError(firstErrorField, errors);
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
    </>
  );
};

export default AddSparePart;
