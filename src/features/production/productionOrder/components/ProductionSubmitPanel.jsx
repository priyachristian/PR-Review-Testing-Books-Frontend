import { useEffect, useMemo, useRef, useState } from 'react';
import { FieldArray, Formik } from 'formik';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { DetailField, TABLE_CELL_CLASS, TABLE_HEAD_CLASS } from '@/components/ui';
import { Alert, Tabs, Tooltip } from '@/components/AntDComponent';
import ProductionDrawer, { ProductionDrawerFooter } from './ProductionDrawer';
import ProcessStepper from './ProcessStepper';
import { useManPowerConfig } from '@/features/allMaster/manPower/useManPowerConfig';
import { useProductionOrder } from '@/features/production/productionOrder';
import useScrollToError from 'hooks/useScrollToError';
import { bomSubmitValidateSchema, bomSubmitTransformer, processSubmitValidateSchema, processSubmitTransformer } from '@/features/production/productionOrder';
import Icons from 'assets/icons/icon';
import { PROCESS_STATUS, PRODUCTION_MODULE_STATUS } from '@/utils/constants';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { dateFormateForUi, roundQty } from '@/utils/services';
import { shouldPreventNavigation } from '@/utils/util';

import { buildDepartmentSelectOptions, filterWorkersByDepartment, getWorkerId } from '@/utils/manPowerDepartment';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import { resolveLineAvailableStock, resolveLineUnitSelection, resolveUnitRefId } from '@/utils/itemLineUnit';

const findDropItem = (items, itemId) => (items || []).find(item => String(item?._id || item?.id) === String(itemId || ''));

const defaultItemUnitId = (items, itemId) => resolveLineUnitSelection({}, findDropItem(items, itemId)).itemUnitId || null;

const lineAvailableStock = (master, itemUnitId, consumedQty = 0, consumedUnitId) => {
  if (!master) return null;
  const selection = resolveLineUnitSelection({ itemUnitId }, master);
  const stock = resolveLineAvailableStock(master, selection);
  if (stock == null) return null;
  const savedUnitId = resolveUnitRefId(consumedUnitId);
  const sameUnit = savedUnitId ? String(savedUnitId) === String(selection.itemUnitId) : Boolean(selection.option?.isBase);
  return roundQty(stock + (sameUnit ? Number(consumedQty) || 0 : 0));
};

const DefaultRowUnits = ({ rows, itemKey, items, name, setFieldValue }) => {
  useEffect(() => {
    (rows || []).forEach((row, index) => {
      if (!row?.[itemKey] || resolveUnitRefId(row.itemUnitId)) return;
      const unitId = defaultItemUnitId(items, row[itemKey]);
      if (unitId) setFieldValue(`${name}[${index}].itemUnitId`, unitId, false);
    });
  }, [rows, itemKey, items, name, setFieldValue]);
  return null;
};

const RowItemUnitSelect = ({ name, itemId, itemUnitId, items, errorMessage, touched, setFieldValue, handleBlur, disabled = false }) => {
  const unitSelection = resolveLineUnitSelection({ itemUnitId }, findDropItem(items, itemId));
  const selectOptions = unitSelection.options.map(option => ({ label: option.label, value: option.value }));

  return (
    <CustomInput
      type="select"
      name={name}
      placeholder="Unit"
      value={unitSelection.option?.value ?? null}
      selectOptions={selectOptions}
      setFieldValue={setFieldValue}
      onChange={selectedValue => {
        const option = unitSelection.options.find(unitOption => String(unitOption.value) === String(selectedValue));
        setFieldValue(name, option?.itemUnitId || null);
      }}
      onBlur={handleBlur}
      errorMessage={errorMessage}
      touched={touched}
      disabled={disabled || !itemId || selectOptions.length <= 1}
    />
  );
};

const HeaderWithTip = ({ label, tip }) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap">
    {label}
    <Tooltip title={tip} placement="right">
      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500], fontSize: 14 }} />
    </Tooltip>
  </span>
);

const ManpowerCostFields = ({ values, errors, touched, handleBlur, setFieldValue, workerDropdown, departmentOptions }) => {
  const hoursSum = roundQty(values.menpower.reduce((sum, row) => sum + (Number(row.workerHours) || 0), 0));
  const workerCostSum = values.menpower.reduce((sum, row) => sum + (Number(row.workerCost) || 0), 0);

  const setWorkerCost = (index, salaryPerHour, hours) => {
    setFieldValue(`menpower[${index}].salary`, salaryPerHour || 0);
    setFieldValue(`menpower[${index}].workerCost`, (salaryPerHour || 0) * hours);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 m-0 mb-2">Manpower</p>
      <div className="mb-2 w-64">
        <CustomInput
          type="select"
          name="manpowerDepartment"
          label="Department"
          placeholder="Filter workers by department"
          value={values.manpowerDepartment}
          onBlur={handleBlur}
          setFieldValue={setFieldValue}
          allowClear
          selectOptions={departmentOptions}
          onChange={next => {
            const allowed = new Set(filterWorkersByDepartment(workerDropdown, next).map(worker => getWorkerId(worker)));
            values.menpower.forEach((row, index) => {
              if (row.workerName && !allowed.has(row.workerName)) {
                setFieldValue(`menpower[${index}].workerName`, null);
                setFieldValue(`menpower[${index}].salary`, '');
                setFieldValue(`menpower[${index}].workerCost`, '');
              }
            });
          }}
        />
      </div>
      <FieldArray name="menpower">
        {({ push, remove, replace }) => (
          <>
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#f6f7fb]">
                  <th className={`${TABLE_HEAD_CLASS} w-10`}>#</th>
                  <th className={TABLE_HEAD_CLASS}>Worker</th>
                  <th className={`${TABLE_HEAD_CLASS} w-36`}>Per hour salary</th>
                  <th className={`${TABLE_HEAD_CLASS} w-32`}>Worker hours</th>
                  <th className={`${TABLE_HEAD_CLASS} w-32`}>
                    <HeaderWithTip label="Worker cost" tip="Per hour salary × Worker hours." />
                  </th>
                  <th className={`${TABLE_HEAD_CLASS} w-12`} />
                </tr>
              </thead>
              <tbody>
                {values.menpower.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className={TABLE_CELL_CLASS}>{index + 1}</td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="select"
                        name={`menpower[${index}].workerName`}
                        placeholder="Select Worker"
                        value={row.workerName}
                        onChange={value => setWorkerCost(index, workerDropdown?.find(worker => getWorkerId(worker) === value)?.perHourSalary, Number(row.workerHours) || 0)}
                        onBlur={handleBlur}
                        errorMessage={errors.menpower?.[index]?.workerName}
                        touched={touched.menpower?.[index]?.workerName}
                        setFieldValue={setFieldValue}
                        selectOptions={filterWorkersByDepartment(workerDropdown, values.manpowerDepartment).map(worker => ({
                          value: getWorkerId(worker),
                          label: worker?.workerName,
                        }))}
                      />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput type="text" name={`menpower[${index}].salary`} placeholder="Salary" value={row.salary} setFieldValue={setFieldValue} disabled />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="text"
                        name={`menpower[${index}].workerHours`}
                        placeholder="Hours"
                        value={row.workerHours}
                        onChange={e => {
                          const newValue = e.target.value;
                          if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                            return;
                          }
                          setFieldValue(`menpower[${index}].workerHours`, newValue);
                          setWorkerCost(index, workerDropdown?.find(worker => getWorkerId(worker) === row.workerName)?.perHourSalary, Number(newValue) || 0);
                        }}
                        onBlur={handleBlur}
                        errorMessage={errors.menpower?.[index]?.workerHours}
                        touched={touched.menpower?.[index]?.workerHours}
                      />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput type="text" name={`menpower[${index}].workerCost`} placeholder="Cost" value={row.workerCost} setFieldValue={setFieldValue} disabled />
                    </td>
                    <td className={`${TABLE_CELL_CLASS} text-center`}>
                      <Icons.DeleteOutlined
                        className="text-red-500 text-xl cursor-pointer"
                        onClick={() => (values.menpower.length === 1 ? replace(0, { workerName: null, salary: '', workerHours: '', workerCost: '' }) : remove(index))}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-gray-200">
                  <td className={TABLE_CELL_CLASS} colSpan={6}>
                    <CustomButton
                      type="primary"
                      size="small"
                      htmlType="button"
                      icon={<Icons.PlusOutlined />}
                      text="Add"
                      onClick={() => push({ workerName: null, salary: '', workerHours: '', workerCost: '' })}
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-[#f6f7fb]">
                  <td className={TABLE_CELL_CLASS} colSpan={3}>
                    Total Manpower
                  </td>
                  <td className={TABLE_CELL_CLASS}>{hoursSum}</td>
                  <td className={TABLE_CELL_CLASS}>{formatAmount(workerCostSum)}</td>
                  <td className={TABLE_CELL_CLASS} />
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </FieldArray>
    </div>
  );
};

const AdditionalCostFields = ({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
  const amountSum = values.additionalCosts.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 m-0 mb-2">Additional Cost</p>
      <FieldArray name="additionalCosts">
        {({ push, remove, replace }) => (
          <>
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#f6f7fb]">
                  <th className={`${TABLE_HEAD_CLASS} w-10`}>#</th>
                  <th className={TABLE_HEAD_CLASS}>Notes</th>
                  <th className={`${TABLE_HEAD_CLASS} w-36`}>Amount</th>
                  <th className={`${TABLE_HEAD_CLASS} w-12`} />
                </tr>
              </thead>
              <tbody>
                {values.additionalCosts.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className={TABLE_CELL_CLASS}>{index + 1}</td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="text"
                        name={`additionalCosts[${index}].notes`}
                        placeholder="Notes"
                        value={row.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.additionalCosts?.[index]?.notes}
                        touched={touched.additionalCosts?.[index]?.notes}
                        setFieldValue={setFieldValue}
                      />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="text"
                        name={`additionalCosts[${index}].amount`}
                        placeholder="Amount"
                        value={row.amount}
                        onChange={e => {
                          const newValue = e.target.value;
                          if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                            return;
                          }
                          setFieldValue(`additionalCosts[${index}].amount`, newValue);
                        }}
                        onBlur={handleBlur}
                        errorMessage={errors.additionalCosts?.[index]?.amount}
                        touched={touched.additionalCosts?.[index]?.amount}
                      />
                    </td>
                    <td className={`${TABLE_CELL_CLASS} text-center`}>
                      <Icons.DeleteOutlined
                        className="text-red-500 text-xl cursor-pointer"
                        onClick={() => (values.additionalCosts.length === 1 ? replace(0, { notes: '', amount: '' }) : remove(index))}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-gray-200">
                  <td className={TABLE_CELL_CLASS} colSpan={4}>
                    <CustomButton type="primary" size="small" htmlType="button" icon={<Icons.PlusOutlined />} text="Add" onClick={() => push({ notes: '', amount: '' })} />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-[#f6f7fb]">
                  <td className={TABLE_CELL_CLASS} colSpan={2}>
                    Total Additional Cost
                  </td>
                  <td className={TABLE_CELL_CLASS}>{formatAmount(amountSum)}</td>
                  <td className={TABLE_CELL_CLASS} />
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </FieldArray>
    </div>
  );
};

// BOM passes processedQty: qty is then entered per item and the quantity follows the units processed.
const ScrapOutFields = ({ values, errors, touched, handleBlur, setFieldValue, scrapItemSelectOptions, scrapItems, processedQty, disableItemUnit = false }) => {
  const isPerItem = processedQty !== undefined;
  const rowQty = row => roundQty((isPerItem ? processedQty : 1) * (Number(row.qty) || 0));
  const scrapSum = roundQty(values.scrapOutProcess.reduce((sum, row) => sum + rowQty(row), 0));

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 m-0 mb-2">Scrap</p>
      <DefaultRowUnits rows={values.scrapOutProcess} itemKey="scrapItem" items={scrapItems} name="scrapOutProcess" setFieldValue={setFieldValue} />
      <FieldArray name="scrapOutProcess">
        {({ push, remove, replace }) => (
          <>
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-[#f6f7fb]">
                  <th className={`${TABLE_HEAD_CLASS} w-10`}>#</th>
                  <th className={TABLE_HEAD_CLASS}>Scrap Item</th>
                  <th className={`${TABLE_HEAD_CLASS} w-36`}>Item Unit</th>
                  <th className={`${TABLE_HEAD_CLASS} w-52`}>{isPerItem ? 'Per item' : 'Quantity'}</th>
                  {isPerItem && (
                    <th className={`${TABLE_HEAD_CLASS} w-32`}>
                      <HeaderWithTip label="Quantity" tip="(FG submitted + FG rejected) × Per item." />
                    </th>
                  )}
                  <th className={`${TABLE_HEAD_CLASS} w-12`} />
                </tr>
              </thead>
              <tbody>
                {values.scrapOutProcess.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className={TABLE_CELL_CLASS}>{index + 1}</td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="select"
                        name={`scrapOutProcess[${index}].scrapItem`}
                        placeholder="Select item"
                        value={row.scrapItem ? String(row.scrapItem) : null}
                        onChange={selectedItemId => {
                          setFieldValue(`scrapOutProcess[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(scrapItems, selectedItemId) : null);
                        }}
                        onBlur={handleBlur}
                        allowClear
                        errorMessage={errors.scrapOutProcess?.[index]?.scrapItem}
                        touched={touched.scrapOutProcess?.[index]?.scrapItem}
                        setFieldValue={setFieldValue}
                        selectOptions={scrapItemSelectOptions.filter(option => !values.scrapOutProcess.some((item, i) => i !== index && String(item.scrapItem) === String(option.value)))}
                        selectVariant="twoColumn"
                        columnSelectHeader={itemSelectColumnHeader}
                        popupMatchSelectWidth={itemSelectDropdownProps.popupMatchSelectWidth}
                        dropdownStyle={itemSelectDropdownProps.dropdownStyle}
                        popupClassName={itemSelectDropdownProps.selectPopupClassName}
                      />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <RowItemUnitSelect
                        name={`scrapOutProcess[${index}].itemUnitId`}
                        itemId={row.scrapItem}
                        itemUnitId={row.itemUnitId}
                        items={scrapItems}
                        errorMessage={errors.scrapOutProcess?.[index]?.itemUnitId}
                        touched={touched.scrapOutProcess?.[index]?.itemUnitId}
                        setFieldValue={setFieldValue}
                        handleBlur={handleBlur}
                        disabled={disableItemUnit}
                      />
                    </td>
                    <td className={TABLE_CELL_CLASS}>
                      <CustomInput
                        type="text"
                        name={`scrapOutProcess[${index}].qty`}
                        placeholder="Qty"
                        value={row.qty}
                        onChange={e => {
                          const newValue = e.target.value;
                          if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                            return;
                          }
                          setFieldValue(`scrapOutProcess[${index}].qty`, newValue);
                        }}
                        onBlur={handleBlur}
                        errorMessage={errors.scrapOutProcess?.[index]?.qty}
                        touched={touched.scrapOutProcess?.[index]?.qty}
                      />
                    </td>
                    {isPerItem && <td className={TABLE_CELL_CLASS}>{rowQty(row)}</td>}
                    <td className={`${TABLE_CELL_CLASS} text-center`}>
                      <Icons.DeleteOutlined
                        className="text-red-500 text-xl cursor-pointer"
                        onClick={() => (values.scrapOutProcess.length === 1 ? replace(0, { scrapItem: null, itemUnitId: null, qty: '' }) : remove(index))}
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-gray-200">
                  <td className={TABLE_CELL_CLASS} colSpan={isPerItem ? 6 : 5}>
                    <CustomButton type="primary" size="small" htmlType="button" icon={<Icons.PlusOutlined />} text="Add" onClick={() => push({ scrapItem: null, itemUnitId: null, qty: '' })} />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-[#f6f7fb]">
                  <td className={TABLE_CELL_CLASS} colSpan={isPerItem ? 4 : 3}>
                    Total Scrap
                  </td>
                  <td className={TABLE_CELL_CLASS}>{scrapSum}</td>
                  <td className={TABLE_CELL_CLASS} />
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </FieldArray>
    </div>
  );
};

const BomSubmitPanel = ({ data, submission, onClose, onSubmitted }) => {
  const formikRef = useRef();
  const {
    updateLoading,
    updateSubmitProductionOrder,
    editBomSubmission,
    editSubmissionLoading,
    fetchItemProductionData,
    itemProductionData,
    productionItemDropRM,
    productionItemDropScrap,
    scrapItemDrop,
    RMItemDrop,
  } = useProductionOrder();
  const { getWorkerDropdown, workerDropdown } = useManPowerConfig();

  const departmentOptions = useMemo(() => buildDepartmentSelectOptions(workerDropdown), [workerDropdown]);
  const rmItemSelectOptions = useMemo(() => buildItemFilterSelectOptions(RMItemDrop, { showAvailableStock: true }), [RMItemDrop]);
  const scrapItemSelectOptions = useMemo(() => buildItemFilterSelectOptions(scrapItemDrop), [scrapItemDrop]);
  const fgUnit = data?.itemId?.itemUnit;
  const availableQty = roundQty(
    (data?.quantity || 0) - (data?.totalFgSubmittedQty || 0) - (data?.totalFgRejectedQty || 0) + (submission ? (submission.fgSubmittedQty || 0) + (submission.fgRejectedQty || 0) : 0)
  );
  const productionWarehouseId = data?.productionWarehouseId?._id || data?.productionWarehouseId?.id || data?.productionWarehouseId;

  useEffect(() => {
    if (!submission && data?.itemId && productionWarehouseId) {
      fetchItemProductionData({
        itemId: data?.itemId?._id,
        warehouseId: productionWarehouseId,
      });
    }
    productionItemDropRM({ isService: false, trackInventory: true, warehouseId: productionWarehouseId, includeZeroInventory: true, includeInactive: true });
    productionItemDropScrap({ isService: false, trackInventory: true });
    getWorkerDropdown({});
  }, [fetchItemProductionData, productionItemDropRM, productionItemDropScrap, getWorkerDropdown, data?.itemId, productionWarehouseId, submission]);

  const onFinish = async values => {
    const submitData = bomSubmitTransformer(values, data.quantity);
    const result = submission
      ? await editBomSubmission({ productionOrderId: data?.id, submissionId: submission._id, submitData })
      : await updateSubmitProductionOrder({ productionId: data?.id, productionModule: submitData });
    if (shouldPreventNavigation(result)) {
      return;
    }
    await onSubmitted();
  };

  const initialValues = useMemo(
    () => ({
      fgSubmittedQty: submission?.fgSubmittedQty ?? '',
      fgRejectedQty: submission?.fgRejectedQty ?? '',
      rawMaterials:
        submission?.rawMaterialsConsumed?.length > 0
          ? submission.rawMaterialsConsumed.map(item => ({
              rawMaterialId: item.rawMaterialId?._id || item.rawMaterialId,
              itemUnitId: resolveUnitRefId(item.itemUnitId),
              perItemRequiredUnit: submission.fgSubmittedQty ? item.productionOrderSubmittedUnit / submission.fgSubmittedQty : item.bomRRQty / submission.fgRejectedQty,
              rejectQty: item.rejectQty ?? '',
            }))
          : !submission && itemProductionData?.bomBased?.length
            ? itemProductionData.bomBased.map(row => ({
                rawMaterialId: row.item?._id || row.item?.id,
                itemUnitId: resolveUnitRefId(row.itemUnitId),
                perItemRequiredUnit: row.qtyPerItem,
                rejectQty: '',
              }))
            : [{ rawMaterialId: null, itemUnitId: null, perItemRequiredUnit: '', rejectQty: '' }],
      scrapOutProcess:
        submission?.scrapOut?.length > 0
          ? submission.scrapOut.map(row => ({
              scrapItem: row.item?._id || row.item?.id,
              itemUnitId: resolveUnitRefId(row.itemUnitId),
              qty: row.value / (submission.fgSubmittedQty + submission.fgRejectedQty),
            }))
          : !submission && itemProductionData?.productionScrapOutInventory?.length
            ? itemProductionData.productionScrapOutInventory.map(row => ({
                scrapItem: row.scrapItemName?._id || row.scrapItemName?.id,
                itemUnitId: resolveUnitRefId(row.itemUnitId),
                qty: row.qtyPerItem ?? '',
              }))
            : [{ scrapItem: null, itemUnitId: null, qty: '' }],
      menpower: submission?.manpowerCost?.length
        ? submission.manpowerCost.map(row => ({
            workerName: row.manpowerId?._id,
            salary: row.workerCost && row.workerHours ? row.workerCost / row.workerHours : '',
            workerHours: row.workerHours,
            workerCost: row.workerCost,
          }))
        : [{ workerName: null, salary: '', workerHours: '', workerCost: '' }],
      additionalCosts: submission?.additionalCost?.length ? submission.additionalCost.map(row => ({ notes: row.notes, amount: row.amount })) : [{ notes: '', amount: '' }],
      manpowerDepartment: '',
    }),
    [itemProductionData, submission]
  );

  return (
    <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={bomSubmitValidateSchema} onSubmit={onFinish} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
        const fgQty = Number(values.fgSubmittedQty) || 0;
        const rejectedQty = Number(values.fgRejectedQty) || 0;
        const materialRows = values.rawMaterials.map(row => {
          const stockItem = RMItemDrop?.find(item => (item.id || item._id) === row.rawMaterialId);
          const consumed = (submission?.rawMaterialsConsumed || []).find(item => String(item.rawMaterialId?._id || item.rawMaterialId) === String(row.rawMaterialId));
          const availableStock = lineAvailableStock(stockItem, row.itemUnitId, (consumed?.productionOrderSubmittedUnit || 0) + (consumed?.rejectQty || 0), consumed?.itemUnitId) ?? 0;
          const submittedUnit = roundQty(fgQty * Number(row.perItemRequiredUnit || 0));
          const bomRRQty = roundQty(rejectedQty * Number(row.perItemRequiredUnit || 0));
          return {
            ...row,
            itemName: stockItem?.itemName,
            availableStock,
            issuedUnit: roundQty((data?.quantity || 0) * Number(row.perItemRequiredUnit || 0)),
            submittedUnit,
            bomRRQty,
            returnQty: Math.max(roundQty(bomRRQty - (Number(row.rejectQty) || 0)), 0),
            shortBy: Math.max(roundQty(submittedUnit + (Number(row.rejectQty) || 0) - Number(availableStock || 0)), 0),
          };
        });
        const shortMaterials = materialRows.filter(row => row.shortBy > 0);
        const submitBlockedReason =
          fgQty + rejectedQty > availableQty
            ? `Only ${roundQty(availableQty)} ${fgUnit} are available on this order.`
            : shortMaterials.length > 0
              ? `Not enough stock for ${shortMaterials.map(row => row.itemName).join(', ')}.`
              : undefined;
        const labourCost = values.menpower.reduce((sum, row) => sum + (Number(row.workerCost) || 0), 0);
        const additionalCost = values.additionalCosts.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

        const tabItems = [
          {
            key: 'materials',
            label: 'Raw Materials & Scrap',
            children: (
              <div className="space-y-2">
                {shortMaterials.length > 0 && (
                  <Alert type="error" showIcon message={`Not enough stock for ${shortMaterials.map(row => row.itemName).join(', ')}. Reduce the submitted quantity or add stock.`} />
                )}
                <FieldArray name="rawMaterials">
                  {({ push, remove, replace }) => (
                    <>
                      <DefaultRowUnits rows={values.rawMaterials} itemKey="rawMaterialId" items={RMItemDrop} name="rawMaterials" setFieldValue={setFieldValue} />
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-[#f6f7fb]">
                            <th className={`${TABLE_HEAD_CLASS} w-10`}>#</th>
                            <th className={`${TABLE_HEAD_CLASS} w-60`}>Item</th>
                            <th className={`${TABLE_HEAD_CLASS} w-36`}>Item Unit</th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>In stock</th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>Per item</th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>
                              <HeaderWithTip label="Issued" tip="Order quantity × Per item." />
                            </th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>
                              <HeaderWithTip label="Submitted" tip="FG submitted × Per item: material used for the good units." />
                            </th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>
                              <HeaderWithTip label="BOM RR" tip="FG rejected × Per item: material that went into the rejected units." />
                            </th>
                            <th className={`${TABLE_HEAD_CLASS} w-20`}>
                              <HeaderWithTip label="Reject" tip="Part of BOM RR that is spoiled and written off. It is charged as rejection cost." />
                            </th>
                            <th className={`${TABLE_HEAD_CLASS} w-18`}>
                              <HeaderWithTip label="Return" tip="BOM RR − Reject: material from rejected units that goes back to stock, at no cost." />
                            </th>
                            <th className={`${TABLE_HEAD_CLASS} w-12`} />
                          </tr>
                        </thead>
                        <tbody>
                          {materialRows.map((row, index) => (
                            <tr key={row.rawMaterialId || index} className={`border-b border-gray-200 ${row.shortBy > 0 ? 'bg-red-50' : ''}`}>
                              <td className={TABLE_CELL_CLASS}>{index + 1}</td>
                              <td className={TABLE_CELL_CLASS}>
                                <CustomInput
                                  type="select"
                                  className="max-w-[220px]"
                                  name={`rawMaterials[${index}].rawMaterialId`}
                                  placeholder="Select item"
                                  value={row.rawMaterialId ? String(row.rawMaterialId) : null}
                                  onChange={selectedItemId => {
                                    setFieldValue(`rawMaterials[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(RMItemDrop, selectedItemId) : null);
                                  }}
                                  onBlur={handleBlur}
                                  allowClear
                                  errorMessage={errors.rawMaterials?.[index]?.rawMaterialId}
                                  touched={touched.rawMaterials?.[index]?.rawMaterialId}
                                  setFieldValue={setFieldValue}
                                  selectOptions={rmItemSelectOptions.filter(option => !values.rawMaterials.some((item, i) => i !== index && String(item.rawMaterialId) === String(option.value)))}
                                  selectVariant="twoColumn"
                                  columnSelectHeader={itemSelectColumnHeader}
                                  popupMatchSelectWidth={itemSelectDropdownProps.popupMatchSelectWidth}
                                  dropdownStyle={itemSelectDropdownProps.dropdownStyleWithStock}
                                  popupClassName={itemSelectDropdownProps.selectPopupClassName}
                                />
                              </td>
                              <td className={TABLE_CELL_CLASS}>
                                <RowItemUnitSelect
                                  name={`rawMaterials[${index}].itemUnitId`}
                                  itemId={row.rawMaterialId}
                                  itemUnitId={row.itemUnitId}
                                  items={RMItemDrop}
                                  errorMessage={errors.rawMaterials?.[index]?.itemUnitId}
                                  touched={touched.rawMaterials?.[index]?.itemUnitId}
                                  setFieldValue={setFieldValue}
                                  handleBlur={handleBlur}
                                />
                              </td>
                              <td className={TABLE_CELL_CLASS}>{row.availableStock ?? 0}</td>
                              <td className={TABLE_CELL_CLASS}>
                                <CustomInput
                                  type="text"
                                  name={`rawMaterials[${index}].perItemRequiredUnit`}
                                  placeholder="0"
                                  value={row.perItemRequiredUnit}
                                  onChange={e => {
                                    const newValue = e.target.value;
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`rawMaterials[${index}].perItemRequiredUnit`, newValue);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.rawMaterials?.[index]?.perItemRequiredUnit}
                                  touched={touched.rawMaterials?.[index]?.perItemRequiredUnit}
                                />
                              </td>
                              <td className={TABLE_CELL_CLASS}>{roundQty(row.issuedUnit)}</td>
                              <td className={TABLE_CELL_CLASS}>{roundQty(row.submittedUnit)}</td>
                              <td className={TABLE_CELL_CLASS}>{roundQty(row.bomRRQty)}</td>
                              <td className={`${TABLE_CELL_CLASS} align-top [&_.ant-form-item]:mb-0`}>
                                <CustomInput
                                  type="text"
                                  name={`rawMaterials[${index}].rejectQty`}
                                  placeholder="0"
                                  value={row.rejectQty}
                                  onChange={e => {
                                    const newValue = e.target.value;
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`rawMaterials[${index}].rejectQty`, newValue);
                                  }}
                                  onBlur={handleBlur}
                                  errorMessage={errors.rawMaterials?.[index]?.rejectQty}
                                  touched={touched.rawMaterials?.[index]?.rejectQty}
                                />
                              </td>
                              <td className={TABLE_CELL_CLASS}>{roundQty(row.returnQty)}</td>
                              <td className={`${TABLE_CELL_CLASS} text-center`}>
                                <Icons.DeleteOutlined
                                  className="text-red-500 text-xl cursor-pointer"
                                  onClick={() => (values.rawMaterials.length === 1 ? replace(0, { rawMaterialId: null, itemUnitId: null, perItemRequiredUnit: '', rejectQty: '' }) : remove(index))}
                                />
                              </td>
                            </tr>
                          ))}
                          <tr className="border-b border-gray-200">
                            <td className={TABLE_CELL_CLASS} colSpan={11}>
                              <CustomButton
                                type="primary"
                                size="small"
                                htmlType="button"
                                icon={<Icons.PlusOutlined />}
                                text="Add"
                                onClick={() => push({ rawMaterialId: null, itemUnitId: null, perItemRequiredUnit: '', rejectQty: '' })}
                              />
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200 bg-[#f6f7fb]">
                            <td className={TABLE_CELL_CLASS} colSpan={5}>
                              Total
                            </td>
                            <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.issuedUnit) || 0), 0))}</td>
                            <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.submittedUnit) || 0), 0))}</td>
                            <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.bomRRQty) || 0), 0))}</td>
                            <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.rejectQty) || 0), 0))}</td>
                            <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.returnQty) || 0), 0))}</td>
                            <td className={TABLE_CELL_CLASS} />
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                </FieldArray>
                <ScrapOutFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  scrapItemSelectOptions={scrapItemSelectOptions}
                  scrapItems={scrapItemDrop}
                  processedQty={fgQty + rejectedQty}
                />
              </div>
            ),
          },
          {
            key: 'manpower',
            label: 'Manpower & Cost',
            children: (
              <div className="space-y-3">
                <ManpowerCostFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  workerDropdown={workerDropdown}
                  departmentOptions={departmentOptions}
                />
                <AdditionalCostFields values={values} errors={errors} touched={touched} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />
                <div className="grid grid-cols-3 gap-x-3">
                  <DetailField label="Labour cost" value={formatAmount(labourCost)} />
                  <DetailField label="Additional cost" value={formatAmount(additionalCost)} />
                  <DetailField label="Total cost" value={formatAmount(labourCost + additionalCost)} />
                </div>
              </div>
            ),
          },
        ];

        return (
          <ProductionDrawer
            title={`${submission ? 'Edit' : 'Submit'} ${data?.productionOrderCode}`}
            status={data?.status}
            statusLabel={PRODUCTION_MODULE_STATUS[data?.status] || data?.status}
            maskClosable={!updateLoading && !editSubmissionLoading}
            onClose={onClose}
            meta={
              <>
                <DetailField label="Item" value={data?.itemId?.itemName} />
                <DetailField className="border-l border-gray-200 pl-4" label="Sales Order" value={data?.salesOrderId?.orderId} />
                <DetailField className="border-l border-gray-200 pl-4" label="Order Qty" value={`${data?.quantity ?? 0} ${fgUnit}`} />
              </>
            }
            footer={
              <>
                <CustomButton text="Cancel" type="default" htmlType="button" onClick={onClose} />
                <Tooltip title={submitBlockedReason}>
                  <CustomButton
                    text={submission ? 'Update Submission' : 'Submit Production Order'}
                    type="primary"
                    htmlType="button"
                    loading={updateLoading || editSubmissionLoading}
                    disabled={!!submitBlockedReason}
                    onClick={() => formikRef.current?.submitForm()}
                  />
                </Tooltip>
              </>
            }
          >
            <CustomForm name="bom-submit" onFinish={handleSubmit}>
              <div className="space-y-3">
                <div className="my-container px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800 m-0 mb-2">Production Summary</p>
                  <div className="grid grid-cols-6 gap-x-3">
                    <DetailField label="Planned" value={`${data.summary.planned} ${fgUnit}`} />
                    <DetailField label="Processed" value={`${roundQty(data.summary.produced + data.totalFgRejectedQty)} ${fgUnit}`} />
                    <DetailField label="Remaining" value={`${data.summary.pending} ${fgUnit}`} />
                    <DetailField label="Good output" value={`${data.summary.produced} ${fgUnit}`} valueClassName={data.summary.produced > 0 ? 'text-green-600' : ''} />
                    <DetailField label="Rejected" value={`${data.totalFgRejectedQty} ${fgUnit}`} valueClassName={data.totalFgRejectedQty > 0 ? 'text-red-600' : ''} />
                    <DetailField label="Scrap" value={`${data.summary.totalScrap} ${fgUnit}`} valueClassName={data.summary.totalScrap > 0 ? 'text-orange-600' : ''} />
                  </div>
                </div>
                <div className="my-container px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-800 m-0">Quantity</p>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3">
                    <CustomInput
                      type="text"
                      name="fgSubmittedQty"
                      label="FG submitted"
                      placeholder="Enter FG submitted"
                      value={values.fgSubmittedQty}
                      onChange={e => {
                        const newValue = e.target.value;
                        if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                          return;
                        }
                        setFieldValue('fgSubmittedQty', newValue);
                      }}
                      onBlur={handleBlur}
                      errorMessage={errors.fgSubmittedQty}
                      touched={touched.fgSubmittedQty}
                      required
                      addonAfter={fgUnit}
                    />
                    <CustomInput
                      type="text"
                      name="fgRejectedQty"
                      label="FG rejected (BOM RR)"
                      placeholder="Enter FG rejected"
                      value={values.fgRejectedQty}
                      onChange={e => {
                        const newValue = e.target.value;
                        if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                          return;
                        }
                        setFieldValue('fgRejectedQty', newValue);
                      }}
                      onBlur={handleBlur}
                      errorMessage={errors.fgRejectedQty}
                      touched={touched.fgRejectedQty}
                      addonAfter={fgUnit}
                    />
                  </div>
                  {fgQty + rejectedQty > availableQty ? (
                    <p className="text-sm text-red-600 m-0 mt-1">
                      Submitted and rejected total {roundQty(fgQty + rejectedQty)} {fgUnit}, but only {roundQty(availableQty)} {fgUnit} are available on this order.
                    </p>
                  ) : null}
                </div>

                <div className="my-container px-3 py-2">
                  <Tabs items={tabItems} />
                </div>
              </div>
            </CustomForm>
          </ProductionDrawer>
        );
      }}
    </Formik>
  );
};

const mapPlannedRawMaterial = row => ({
  item: row?.item?._id || row?.item?.id || null,
  itemName: row?.item?.itemName || '',
  itemUnitId: resolveUnitRefId(row?.itemUnitId) || resolveUnitRefId(row?.item?.itemUnitId),
  itemUnitName: row?.item?.itemUnit || '',
  qty: row?.qtyPerItem ?? '',
  stock: row?.stock ?? null,
});

const PrefillProcessMaterials = ({ rows, loading, submission, setFieldValue }) => {
  const appliedKey = useRef('');
  const rowKey = rows.map(row => row.item).join('|');

  useEffect(() => {
    if (submission || loading || !rowKey || appliedKey.current === rowKey) return;
    appliedKey.current = rowKey;
    setFieldValue('processRawMaterial', rows, false);
  }, [rowKey, rows, loading, submission, setFieldValue]);

  return null;
};

const ProcessSubmitPanel = ({ data, process, processIndex, fgUnit, submission, onClose, onSubmitted, onSelectProcess, withDrawer = true }) => {
  const processId = process._id || process.id;
  const [formTab, setFormTab] = useState('materials');
  const formikRef = useRef();
  const scrollToError = useScrollToError();
  const {
    submitProcess,
    submitProcessLoading,
    editProcessSubmission,
    editSubmissionLoading,
    fetchItemProductionData,
    itemProductionData,
    itemProductionDataLoading,
    productionItemDropRM,
    productionItemDropScrap,
    scrapItemDrop,
    RMItemDrop,
  } = useProductionOrder();
  const { getWorkerDropdown, workerDropdown } = useManPowerConfig();
  const queryProcessId = process.processId?._id || process.processId;

  const departmentOptions = useMemo(() => buildDepartmentSelectOptions(workerDropdown), [workerDropdown]);
  const rmItemSelectOptions = useMemo(() => buildItemFilterSelectOptions(RMItemDrop, { showAvailableStock: true }), [RMItemDrop]);
  const scrapItemSelectOptions = useMemo(() => buildItemFilterSelectOptions(scrapItemDrop), [scrapItemDrop]);

  const productionWarehouseId = data?.productionWarehouseId?._id || data?.productionWarehouseId?.id || data?.productionWarehouseId;
  const finishedItemId = data?.itemId?._id || data?.itemId?.id || data?.itemId;

  const plannedRawMaterials = useMemo(() => {
    const entries = itemProductionData?.processBased || [];
    const match = entries.find(entry => String(entry?.processId?._id || entry?.processId?.id || entry?.processId || '') === String(queryProcessId));
    return (match?.rawMaterials || []).map(mapPlannedRawMaterial).filter(row => row.item);
  }, [itemProductionData, queryProcessId]);

  useEffect(() => {
    productionItemDropRM({ isService: false, trackInventory: true, warehouseId: productionWarehouseId, includeZeroInventory: true, includeInactive: true });
    productionItemDropScrap({ isService: false, trackInventory: true });
    getWorkerDropdown({});
  }, [productionItemDropRM, productionItemDropScrap, getWorkerDropdown, productionWarehouseId]);

  useEffect(() => {
    if (submission || !finishedItemId || !productionWarehouseId || !queryProcessId) return;
    fetchItemProductionData({
      itemId: finishedItemId,
      warehouseId: productionWarehouseId,
      processId: queryProcessId,
    });
  }, [submission, finishedItemId, productionWarehouseId, queryProcessId, fetchItemProductionData]);

  const onFinish = async values => {
    const submitData = processSubmitTransformer(values);
    const result = submission
      ? await editProcessSubmission({ productionOrderId: data?.id, processId, submissionId: submission._id || submission.id, submitData })
      : await submitProcess({ productionOrderId: data?.id, processId, submitData });
    if (shouldPreventNavigation(result)) {
      return;
    }
    await onSubmitted();
  };

  const handleSave = async () => {
    const errors = await formikRef.current?.validateForm();
    if (errors && Object.keys(errors).length > 0) {
      if (errors.processRawMaterial || errors.scrapOutProcess || errors.processOutcome || errors.processRejection) {
        setFormTab('materials');
      } else if (errors.menpower || errors.additionalCosts || errors.remark) {
        setFormTab('manpower');
      }
      const firstErrorField = Object.keys(errors)[0];
      scrollToError(firstErrorField, errors);
      return;
    }
    formikRef.current?.submitForm();
  };

  const additionalCostRows = process.additionalCost.filter(cost => String(cost.submissionId) === String(submission?._id));
  const consumedByItem = new Map((submission?.processRawMaterialInput || []).map(row => [String(row.item?._id), row.value]));

  const initialValues = useMemo(
    () => ({
      processRawMaterial: submission?.processRawMaterialInput?.length
        ? submission.processRawMaterialInput.map(row => ({
            item: row.item?._id || row.item?.id,
            itemName: row.item?.itemName || '',
            itemUnitId: resolveUnitRefId(row.itemUnitId),
            itemUnitName: row.item?.itemUnit || row.itemUnitId?.name || '',
            qty: row.value,
            stock: null,
          }))
        : [],
      menpower: submission?.manPower?.length
        ? submission.manPower.map(row => ({ workerName: row.workerId?._id, salary: row.salaryPerHour, workerHours: row.workerHours, workerCost: row.workerCost }))
        : [{ workerName: null, salary: '', workerHours: '', workerCost: '' }],
      scrapOutProcess: submission?.scrapOutProcess?.length
        ? submission.scrapOutProcess.map(row => ({
            scrapItem: row.item?._id || row.item?.id,
            itemUnitId: resolveUnitRefId(row.itemUnitId),
            qty: row.value,
          }))
        : [{ scrapItem: null, itemUnitId: null, qty: '' }],
      processOutcome: submission?.processOUT ?? '',
      processRejection: submission?.processRejection ?? '',
      remark: submission?.remarks || '',
      manpowerDepartment: '',
      additionalCosts: additionalCostRows.length ? additionalCostRows.map(row => ({ notes: row.notes, amount: row.amount })) : [{ notes: '', amount: '' }],
    }),
    [submission, process.additionalCost]
  );

  return (
    <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={processSubmitValidateSchema} onSubmit={onFinish} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
        const reportedQty = roundQty(Number(values.processOutcome || 0) + Number(values.processRejection || 0));
        const remainingQty = roundQty(process.pendingQty + (submission ? submission.processOUT + submission.processRejection : 0));
        const scrapTotal = process.scrapOutProcess.reduce((sum, row) => sum + row.value, 0);
        const totalOutput = roundQty(process.processOUT + process.processRejection);

        // Every material figure on screen comes from here, so the table and the warning always agree.
        const unitItems = [...(RMItemDrop || [])];
        (values.processRawMaterial || []).forEach(row => {
          if (!row?.item || unitItems.some(item => String(item._id || item.id) === String(row.item))) return;
          unitItems.push({
            _id: row.item,
            itemName: row.itemName,
            itemUnit: row.itemUnitName,
            itemUnitId: row.itemUnitId,
          });
        });

        const materialRows = values.processRawMaterial.map(row => {
          const stockItem = RMItemDrop?.find(item => String(item.id || item._id) === String(row.item));
          const consumed = (submission?.processRawMaterialInput || []).find(item => String(item.item?._id || item.item?.id || item.item) === String(row.item));
          const plannedStock = row.stock != null && row.stock !== '' ? Number(row.stock) : null;
          const dropdownStock = lineAvailableStock(stockItem, row.itemUnitId, consumedByItem.get(String(row.item)) || 0, consumed?.itemUnitId);
          const availableStock = dropdownStock != null ? dropdownStock : plannedStock != null ? roundQty(plannedStock + (Number(consumedByItem.get(String(row.item))) || 0)) : null;
          const consumeQty = Number(row.qty);
          const orderRm = (data?.rawMaterials || []).find(rm => (rm.rawMaterialId?.id || rm.rawMaterialId?._id) === row.item);
          return {
            ...row,
            name: stockItem?.itemName || row.itemName,
            availableStock,
            requiredQty: orderRm?.perItemRequiredUnit != null ? roundQty(Number(orderRm.perItemRequiredUnit) * reportedQty) : undefined,
            shortBy: availableStock != null && consumeQty > availableStock ? roundQty(consumeQty - availableStock) : 0,
          };
        });

        // Warning before submit: raw material asked for is more than the stock in the production warehouse.
        const shortRmRows = materialRows.filter(row => row.item && row.shortBy > 0);
        const submitBlockedReason =
          reportedQty > remainingQty
            ? `Only ${remainingQty} ${fgUnit} are available at this process.`
            : shortRmRows.length > 0
              ? `Not enough stock for ${shortRmRows.map(row => row.name).join(', ')}.`
              : undefined;
        const tabItems = [
          {
            key: 'materials',
            label: 'Raw Materials & Scrap',
            children: (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 m-0">Raw materials</p>
                  <p className="text-sm text-gray-500 m-0 mb-2">Consumed from {data?.productionWarehouseId?.name}.</p>
                  <FieldArray name="processRawMaterial">
                    {({ push, remove, replace }) => (
                      <div>
                        <DefaultRowUnits rows={values.processRawMaterial} itemKey="item" items={unitItems} name="processRawMaterial" setFieldValue={setFieldValue} />
                        {itemProductionDataLoading && !values.processRawMaterial.length ? <p className="text-sm text-gray-500 m-0">Loading raw materials...</p> : null}
                        {!itemProductionDataLoading ? (
                          <table className="w-full border-collapse border border-gray-200">
                            <thead>
                              <tr className="bg-[#f6f7fb]">
                                <th className={`${TABLE_HEAD_CLASS} w-10`}>#</th>
                                <th className={TABLE_HEAD_CLASS}>Item</th>
                                <th className={`${TABLE_HEAD_CLASS} w-36`}>Item Unit</th>
                                <th className={`${TABLE_HEAD_CLASS} w-24`}>
                                  <HeaderWithTip label="In stock" tip="Stock in the production warehouse. When editing, includes what this submission already used." />
                                </th>
                                <th className={`${TABLE_HEAD_CLASS} w-52`}>Quantity</th>
                                <th className={`${TABLE_HEAD_CLASS} w-24`}>
                                  <HeaderWithTip label="Shortage" tip="Quantity − In stock, when you ask for more than is in stock." />
                                </th>
                                <th className={`${TABLE_HEAD_CLASS} w-12`} />
                              </tr>
                            </thead>
                            <tbody>
                              {materialRows.map((row, index) => {
                                const itemOptions = rmItemSelectOptions.filter(option => !values.processRawMaterial.some((item, i) => i !== index && String(item.item) === String(option.value)));
                                const selectOptions =
                                  row.item && !itemOptions.some(option => String(option.value) === String(row.item))
                                    ? [{ value: String(row.item), label: row.name || row.itemName || '' }, ...itemOptions]
                                    : itemOptions;
                                return (
                                  <tr key={index} className="border-b border-gray-200">
                                    <td className={TABLE_CELL_CLASS}>{index + 1}</td>
                                    <td className={TABLE_CELL_CLASS}>
                                      <CustomInput
                                        type="select"
                                        name={`processRawMaterial[${index}].item`}
                                        placeholder="Select item"
                                        value={row.item ? String(row.item) : null}
                                        onChange={selectedItemId => {
                                          setFieldValue(`processRawMaterial[${index}].itemUnitId`, selectedItemId ? defaultItemUnitId(RMItemDrop, selectedItemId) : null);
                                          setFieldValue(`processRawMaterial[${index}].stock`, null);
                                          setFieldValue(`processRawMaterial[${index}].itemName`, '');
                                        }}
                                        onBlur={handleBlur}
                                        allowClear
                                        errorMessage={errors.processRawMaterial?.[index]?.item}
                                        touched={touched.processRawMaterial?.[index]?.item}
                                        setFieldValue={setFieldValue}
                                        selectOptions={selectOptions}
                                        selectVariant="twoColumn"
                                        columnSelectHeader={itemSelectColumnHeader}
                                        popupMatchSelectWidth={itemSelectDropdownProps.popupMatchSelectWidth}
                                        dropdownStyle={itemSelectDropdownProps.dropdownStyleWithStock}
                                        popupClassName={itemSelectDropdownProps.selectPopupClassName}
                                      />
                                    </td>
                                    <td className={TABLE_CELL_CLASS}>
                                      <RowItemUnitSelect
                                        name={`processRawMaterial[${index}].itemUnitId`}
                                        itemId={row.item}
                                        itemUnitId={row.itemUnitId}
                                        items={unitItems}
                                        errorMessage={errors.processRawMaterial?.[index]?.itemUnitId}
                                        touched={touched.processRawMaterial?.[index]?.itemUnitId}
                                        setFieldValue={setFieldValue}
                                        handleBlur={handleBlur}
                                      />
                                    </td>
                                    <td className={TABLE_CELL_CLASS}>{row.availableStock != null ? row.availableStock : '-'}</td>
                                    <td className={TABLE_CELL_CLASS}>
                                      <CustomInput
                                        type="text"
                                        name={`processRawMaterial[${index}].qty`}
                                        placeholder="Qty"
                                        value={row.qty}
                                        onChange={e => {
                                          const newValue = e.target.value;
                                          if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                            return;
                                          }
                                          setFieldValue(`processRawMaterial[${index}].qty`, newValue);
                                        }}
                                        onBlur={handleBlur}
                                        errorMessage={errors.processRawMaterial?.[index]?.qty}
                                        touched={touched.processRawMaterial?.[index]?.qty}
                                      />
                                    </td>
                                    <td className={`${TABLE_CELL_CLASS} ${row.shortBy > 0 ? 'text-red-600' : ''}`}>{row.item && row.availableStock != null ? row.shortBy : '-'}</td>
                                    <td className={`${TABLE_CELL_CLASS} text-center`}>
                                      <Icons.DeleteOutlined
                                        className="text-red-500 text-xl cursor-pointer"
                                        onClick={() =>
                                          values.processRawMaterial.length === 1 ? replace(0, { item: null, itemName: '', itemUnitId: null, itemUnitName: '', qty: '', stock: null }) : remove(index)
                                        }
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="border-b border-gray-200">
                                <td className={TABLE_CELL_CLASS} colSpan={7}>
                                  <CustomButton
                                    type="primary"
                                    size="small"
                                    htmlType="button"
                                    icon={<Icons.PlusOutlined />}
                                    text="Add"
                                    onClick={() => push({ item: null, itemName: '', itemUnitId: null, itemUnitName: '', qty: '', stock: null })}
                                  />
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200 bg-[#f6f7fb]">
                                <td className={TABLE_CELL_CLASS} colSpan={4}>
                                  Total Raw Material
                                </td>
                                <td className={TABLE_CELL_CLASS}>{roundQty(materialRows.reduce((sum, row) => sum + (Number(row.qty) || 0), 0))}</td>
                                <td className={TABLE_CELL_CLASS} />
                                <td className={TABLE_CELL_CLASS} />
                              </tr>
                            </tfoot>
                          </table>
                        ) : null}
                      </div>
                    )}
                  </FieldArray>
                </div>

                {/* Warning before submit: raw material asked for is more than the stock in the production warehouse. */}
                {shortRmRows.length > 0 && <Alert type="warning" showIcon message={`Not enough stock for ${shortRmRows.map(row => row.name).join(', ')}. Reduce the quantity or add stock.`} />}

                <ScrapOutFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  scrapItemSelectOptions={scrapItemSelectOptions}
                  scrapItems={scrapItemDrop}
                />
              </div>
            ),
          },
          {
            key: 'manpower',
            label: 'Manpower & Cost',
            children: (
              <div className="space-y-3">
                <ManpowerCostFields
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  workerDropdown={workerDropdown}
                  departmentOptions={departmentOptions}
                />
                <AdditionalCostFields values={values} errors={errors} touched={touched} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />
                <CustomInput
                  type="textarea"
                  name="remark"
                  label="Remark"
                  placeholder="Enter Remark"
                  value={values.remark}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.remark}
                  touched={touched.remark}
                  setFieldValue={setFieldValue}
                  rows={2}
                />
              </div>
            ),
          },
        ];

        const body = (
          <CustomForm name="process-submit" onFinish={handleSubmit}>
            <PrefillProcessMaterials rows={plannedRawMaterials} loading={itemProductionDataLoading} submission={submission} setFieldValue={setFieldValue} />
            <div className="space-y-3">
              {withDrawer ? <ProcessStepper processes={data.processBased.processes} activeIndex={processIndex} onSelect={onSelectProcess} /> : null}
              <div className="my-container px-3 py-2">
                <p className="text-sm font-semibold text-gray-800 m-0 mb-2">Process Summary</p>
                <div className="grid grid-cols-6 gap-x-3">
                  <DetailField label="Input" value={`${process.processIN} ${fgUnit}`} />
                  <DetailField label="Processed" value={`${totalOutput} ${fgUnit}`} />
                  <DetailField label="Remaining" value={`${process.pendingQty} ${fgUnit}`} />
                  <DetailField label="Good output" value={`${process.processOUT} ${fgUnit}`} valueClassName={process.processOUT > 0 ? 'text-green-600' : ''} />
                  <DetailField label="Rejected" value={`${process.processRejection} ${fgUnit}`} valueClassName={process.processRejection > 0 ? 'text-red-600' : ''} />
                  <DetailField label="Scrap" value={`${scrapTotal} ${fgUnit}`} valueClassName={scrapTotal > 0 ? 'text-orange-600' : ''} />
                </div>
              </div>
              <div className="my-container px-3 py-2">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-gray-800 m-0">Quantity</p>
                </div>
                <div className="grid grid-cols-3 gap-x-3">
                  <CustomInput
                    type="text"
                    name="processOutcome"
                    label="Good output"
                    placeholder="Enter good output"
                    value={values.processOutcome}
                    onChange={e => {
                      const newValue = e.target.value;
                      if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                        return;
                      }
                      setFieldValue('processOutcome', newValue);
                    }}
                    onBlur={handleBlur}
                    errorMessage={errors.processOutcome}
                    touched={touched.processOutcome}
                    required
                    addonAfter={fgUnit}
                  />
                  <CustomInput
                    type="text"
                    name="processRejection"
                    label="Rejected"
                    placeholder="Enter rejected"
                    value={values.processRejection}
                    onChange={e => {
                      const newValue = e.target.value;
                      if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                        return;
                      }
                      setFieldValue('processRejection', newValue);
                    }}
                    onBlur={handleBlur}
                    errorMessage={errors.processRejection}
                    touched={touched.processRejection}
                    addonAfter={fgUnit}
                  />
                </div>
                {/* Warning before submit: more reported than the process has left, which is what the submit API refuses */}
                {reportedQty > remainingQty ? (
                  <p className="text-sm text-red-600 m-0 mt-1">
                    Good output and rejected total {reportedQty} {fgUnit}, but only {remainingQty} {fgUnit} are available at this process.
                  </p>
                ) : null}
              </div>

              <div className="my-container px-3 py-2">
                <Tabs activeKey={formTab} onChange={setFormTab} items={tabItems} />
              </div>
            </div>
          </CustomForm>
        );
        const footer = (
          <>
            <CustomButton text="Cancel" type="default" htmlType="button" onClick={onClose} />
            <Tooltip title={submitBlockedReason}>
              <CustomButton
                text={submission ? 'Update' : 'Submit Process'}
                type="primary"
                htmlType="button"
                loading={submitProcessLoading || editSubmissionLoading}
                disabled={!!submitBlockedReason}
                onClick={handleSave}
              />
            </Tooltip>
          </>
        );
        if (!withDrawer) {
          return (
            <>
              {body}
              <ProductionDrawerFooter>{footer}</ProductionDrawerFooter>
            </>
          );
        }
        return (
          <ProductionDrawer
            title={`${submission ? 'Edit' : 'Submit'} ${process.processName}`}
            status={process.status}
            statusLabel={PROCESS_STATUS[process.status]}
            maskClosable={!submitProcessLoading && !editSubmissionLoading}
            onClose={onClose}
            meta={
              <>
                <DetailField label="Process" value={`${processIndex + 1} of ${data.processBased.processes.length}`} />
                {process.startDatetime ? <DetailField className="border-l border-gray-200 pl-4" label="Started" value={dateFormateForUi(process.startDatetime, { withTime: true })} /> : null}
                {process.endDatetime ? <DetailField className="border-l border-gray-200 pl-4" label="Completed" value={dateFormateForUi(process.endDatetime, { withTime: true })} /> : null}
              </>
            }
            footer={footer}
          >
            {body}
          </ProductionDrawer>
        );
      }}
    </Formik>
  );
};

export { BomSubmitPanel, ProcessSubmitPanel };
