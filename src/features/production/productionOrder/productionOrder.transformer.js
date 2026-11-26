import { roundQty } from '@/utils/services';
import { resolveUnitRefId } from '@/utils/itemLineUnit';

export const processSubmitTransformer = values => {
  return {
    processOUT: Number(values.processOutcome),
    processRejection: Number(values.processRejection),
    remarks: values.remark,
    additionalCost: values.additionalCosts.map(row => ({ notes: row.notes, amount: Number(row.amount) || 0 })),
    manPower: values.menpower
      .filter(mp => Number(mp.salary) > 0)
      .map(mp => ({
        workerId: mp.workerName,
        salaryPerHour: Number(mp.salary),
        workerHours: Number(mp.workerHours) || 0,
        workerCost: Number(mp.workerCost) || 0,
      })),
    scrapOutProcess: values.scrapOutProcess
      .filter(scrap => scrap.scrapItem && Number(scrap.qty) > 0)
      .map(scrap => ({
        item: scrap.scrapItem,
        itemUnitId: resolveUnitRefId(scrap.itemUnitId),
        value: Number(scrap.qty),
      })),
    processRawMaterialInput: values.processRawMaterial
      .filter(item => item.item && Number(item.qty) > 0)
      .map(item => ({
        item: item.item,
        itemUnitId: resolveUnitRefId(item.itemUnitId),
        value: Number(item.qty),
      })),
  };
};

export const bomSubmitTransformer = (values, orderQuantity) => {
  const fgSubmittedQty = Number(values.fgSubmittedQty) || 0;
  const fgRejectedQty = Number(values.fgRejectedQty) || 0;

  return {
    fgSubmittedQty,
    fgRejectedQty,
    rawMaterials: values.rawMaterials
      .filter(row => row.rawMaterialId)
      .map(row => {
        const bomRRQty = fgRejectedQty * Number(row.perItemRequiredUnit || 0);
        const rejectQty = Number(row.rejectQty) || 0;
        return {
          rawMaterialId: row.rawMaterialId,
          itemUnitId: resolveUnitRefId(row.itemUnitId),
          perItemRequiredUnit: Number(row.perItemRequiredUnit || 0),
          productionOrderRequiredUnit: Number(orderQuantity) * Number(row.perItemRequiredUnit || 0),
          productionOrderSubmittedUnit: fgSubmittedQty * Number(row.perItemRequiredUnit || 0),
          bomRRQty,
          rejectQty,
          returnQty: Math.max(bomRRQty - rejectQty, 0),
        };
      }),
    scrapOut: values.scrapOutProcess
      .filter(row => row.scrapItem && Number(row.qty) > 0)
      .map(row => ({
        item: row.scrapItem,
        itemUnitId: resolveUnitRefId(row.itemUnitId),
        value: roundQty((fgSubmittedQty + fgRejectedQty) * Number(row.qty)),
      })),
    manpowerCost: values.menpower
      .filter(row => Number(row.salary) > 0)
      .map(row => ({
        manpowerId: row.workerName,
        workerHours: Number(row.workerHours) || 0,
        workerCost: Number(row.workerCost) || 0,
      })),
    additionalCost: values.additionalCosts.map(row => ({ notes: row.notes, amount: Number(row.amount) || 0 })),
  };
};
