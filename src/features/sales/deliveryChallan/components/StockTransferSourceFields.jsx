import { useEffect, useMemo, useState } from 'react';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { itemMasterService } from '@/features/allMaster/item/item.service';
import { normalizeDivisionBranchWarehouseId } from 'hooks/useDivisionBranchWarehouse';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const uniqueById = rows => [...new Map(rows.filter(row => row?.id).map(row => [row.id, row])).values()];

/**
 * From Division / Branch / Warehouse of an internal stock transfer challan. The challan's own division, branch and
 * warehouse are the destination. The lists come from the company's warehouses, so they do not disturb the destination
 * dropdowns of the form.
 */
const StockTransferSourceFields = ({ values, errors, touched, setFieldValue, setFieldTouched, handleBlur }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    itemMasterService
      .getWarehouseDrop({ signal: controller.signal })
      .then(response => setWarehouses(Array.isArray(response?.data) ? response.data : []))
      .catch(() => {})
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, []);

  const { divisionOptions, branchOptions, warehouseOptions } = useMemo(() => {
    const rows = warehouses.map(warehouse => ({
      warehouse: { ...warehouse, id: normalizeDivisionBranchWarehouseId(warehouse) },
      division: warehouse?.divisionId ? { ...warehouse.divisionId, id: normalizeDivisionBranchWarehouseId(warehouse.divisionId) } : null,
      branch: warehouse?.branchId ? { ...warehouse.branchId, id: normalizeDivisionBranchWarehouseId(warehouse.branchId) } : null,
    }));
    const inDivision = rows.filter(row => row.division?.id === values.fromDivisionId);
    const inBranch = inDivision.filter(row => row.branch?.id === values.fromBranchId);

    return {
      divisionOptions: buildDivisionSelectOptions(uniqueById(rows.map(row => row.division))),
      branchOptions: buildBranchSelectOptions(uniqueById(inDivision.map(row => row.branch))),
      // The destination warehouse cannot also be the source.
      warehouseOptions: buildWarehouseSelectOptions(inBranch.map(row => row.warehouse).filter(warehouse => warehouse.id !== values.warehouseId)),
    };
  }, [warehouses, values.fromDivisionId, values.fromBranchId, values.warehouseId]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
      <CustomInput
        type="select"
        name="fromDivisionId"
        label="From Division"
        placeholder="Select Division"
        value={values.fromDivisionId}
        onBlur={handleBlur}
        errorMessage={errors.fromDivisionId}
        touched={touched.fromDivisionId}
        setFieldValue={setFieldValue}
        required={true}
        selectVariant="twoColumn"
        columnSelectHeader={divisionSelectColumnHeader}
        selectOptions={divisionOptions}
        onChange={() => {
          setFieldTouched('fromDivisionId', false, false);
          setFieldValue('fromBranchId', null, false);
          setFieldValue('fromWarehouseId', null, false);
        }}
        loading={loading}
      />
      <CustomInput
        type="select"
        name="fromBranchId"
        label="From Branch"
        placeholder={values.fromDivisionId ? 'Select Branch' : 'Select division first'}
        value={values.fromBranchId}
        onBlur={handleBlur}
        errorMessage={errors.fromBranchId}
        touched={touched.fromBranchId}
        setFieldValue={setFieldValue}
        required={true}
        selectVariant="twoColumn"
        columnSelectHeader={branchSelectColumnHeader}
        selectOptions={branchOptions}
        onChange={() => {
          setFieldTouched('fromBranchId', false, false);
          setFieldValue('fromWarehouseId', null, false);
        }}
        disabled={!values.fromDivisionId}
        loading={loading}
      />
      <CustomInput
        type="select"
        name="fromWarehouseId"
        label="From Warehouse"
        placeholder={values.fromBranchId ? 'Select Warehouse' : 'Select branch first'}
        value={values.fromWarehouseId}
        onBlur={handleBlur}
        errorMessage={errors.fromWarehouseId}
        touched={touched.fromWarehouseId}
        setFieldValue={setFieldValue}
        required={true}
        selectVariant="twoColumn"
        columnSelectHeader={warehouseSelectColumnHeader}
        selectOptions={warehouseOptions}
        disabled={!values.fromBranchId}
        loading={loading}
      />
    </div>
  );
};

export default StockTransferSourceFields;
