import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput, { CustomLabel } from '@/components/forms/formInput/CustomInput';
import { Tag, Checkbox } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import useModulePermissions from '@/hooks/useModulePermissions';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from '@/utils/services';
import { useOnboarding } from '../useOnboarding';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const LOCATION_KEY = 'quoteSoLocation';
const EMPTY_LOCATION = { divisionId: null, branchId: null, warehouseId: null };

const COLUMN_DEFS = {
  customerAccount: [
    { title: 'Number', dataIndex: 'code' },
    { title: 'Name', dataIndex: 'name' },
  ],
  customerBranch: [
    { title: 'Number', dataIndex: 'code' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Type', dataIndex: 'type' },
  ],
  itemInventory: [
    { title: 'Item No', dataIndex: 'itemNo' },
    { title: 'Item Name', dataIndex: 'name' },
    { title: 'HSN / SAC', dataIndex: 'code' },
  ],
  itemWarehouse: [
    { title: 'Item No', dataIndex: 'itemNo' },
    { title: 'Item Name', dataIndex: 'name' },
    { title: 'HSN / SAC', dataIndex: 'code' },
  ],
  quoteSoLocation: [
    { title: 'Number', dataIndex: 'code' },
    { title: 'Type', dataIndex: 'type' },
    { title: 'Date', dataIndex: 'date' },
  ],
};

const noop = () => {};

const renderColCell = (col, stepKey) => {
  if (col.dataIndex === 'date') return value => dateFormateForUi(value);
  if (col.title === 'Number' || col.title === 'Item No') {
    const LinkCell = (value, record) => (
      <Link to={recordLink(stepKey, record)} target="_blank" onClick={e => e.stopPropagation()}>
        <Tag>{value}</Tag>
      </Link>
    );
    return LinkCell;
  }
  return undefined;
};

const recordLink = (stepKey, rec) => {
  if (stepKey === 'customerAccount' || stepKey === 'customerBranch') {
    return rec.type === 'Vendor' ? `/vendors/${rec.id}` : `/customer-master/${rec.id}`;
  }
  if (stepKey === 'itemInventory' || stepKey === 'itemWarehouse') return `/item-master/${rec.id}`;
  return rec.type === 'Sales Order' ? `/sales-orders/${rec.id}` : `/quotes/${rec.id}`;
};

const DataSetupPreviewModal = ({ open, step, onClose, onDone }) => {
  const { dataSetupPreview, dataSetupPreviewLoading, dataSetupRunningKey, getDataSetupPreview, runDataSetup, resetDataSetupPreview } = useOnboarding();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, warehouseDrop, warehouseLoading, getWarehouseDrop } = useModulePermissions(RESOURCES.HOME);

  const isLocation = step?.key === LOCATION_KEY;
  const running = dataSetupRunningKey === step?.key;
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [selectedIds, setSelectedIds] = useState([]);

  const rows = dataSetupPreview?.rows || [];
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < rows.length;
  const locationReady = location.divisionId && location.branchId && location.warehouseId && selectedIds.length > 0;

  useEffect(() => {
    if (!open || !step?.key) return undefined;
    const controller = new AbortController();
    getDataSetupPreview({ key: step.key, signal: controller.signal });
    if (isLocation) getDivDropDown({});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.key]);

  useEffect(() => {
    if (!open) {
      resetDataSetupPreview();
      setLocation(EMPTY_LOCATION);
      setSelectedIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleDivisionChange = value => {
    setLocation({ divisionId: value, branchId: null, warehouseId: null });
    if (value) getBranchDropDown({ divisionId: value });
  };

  const handleBranchChange = value => {
    setLocation(prev => ({ ...prev, branchId: value, warehouseId: null }));
    if (value) getWarehouseDrop({ branchId: value });
  };

  const handleWarehouseChange = value => setLocation(prev => ({ ...prev, warehouseId: value }));

  const toggleId = useCallback(id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const current = rowsRef.current;
      return prev.length === current.length ? [] : current.map(r => String(r.id));
    });
  }, []);

  const columns = useMemo(() => {
    const indexCol = { title: '#', key: 'index', width: 56, render: (_, __, index) => index + 1 };

    const dataCols = (COLUMN_DEFS[step?.key] || []).map(col => ({
      title: col.title,
      dataIndex: col.dataIndex,
      key: col.dataIndex,
      render: renderColCell(col, step?.key),
    }));

    if (!isLocation) return [indexCol, ...dataCols];

    const checkCol = {
      title: <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={toggleAll} />,
      key: 'select',
      width: 44,
      render: (_, record) => <Checkbox checked={selectedIds.includes(String(record.id))} onChange={() => toggleId(String(record.id))} onClick={e => e.stopPropagation()} />,
    };

    return [checkCol, indexCol, ...dataCols];
  }, [step?.key, isLocation, selectedIds, allSelected, indeterminate, toggleAll, toggleId]);

  const handleConfirm = async () => {
    try {
      const params = isLocation
        ? {
            ...location,
            quoteIds: rows.filter(r => selectedIds.includes(String(r.id)) && r.type === 'Quote').map(r => String(r.id)),
            soIds: rows.filter(r => selectedIds.includes(String(r.id)) && r.type === 'Sales Order').map(r => String(r.id)),
          }
        : undefined;
      await runDataSetup({ key: step.key, params });
      onClose();
      onDone?.();
    } catch (e) {
      // error surfaced by interceptor/slice
    }
  };

  const total = dataSetupPreview?.total ?? step?.remaining ?? 0;
  const affectedCount = isLocation ? selectedIds.length : total;

  return (
    <CustomModal modalOpen={open} setModalOpen={onClose} title={step?.label ? `${step.label}` : 'Complete Setup'} width={992}>
      <div className="flex items-start gap-2 mb-3 rounded-md bg-amber-50 border border-amber-100 px-3 py-2">
        <Icons.WarningOutlined style={{ color: '#d97706' }} className="mt-0.5" />
        <p className="text-sm text-amber-800">
          This will update <span className="font-semibold">{affectedCount}</span> record(s). This cannot be undone. Review the affected records below before confirming.
        </p>
      </div>

      {isLocation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <CustomLabel label="Division" name="divisionId" required />
            <CustomInput
              type="select"
              name="divisionId"
              placeholder="Select division"
              value={location.divisionId}
              setFieldValue={noop}
              onChange={handleDivisionChange}
              selectVariant="twoColumn"
              columnSelectHeader={divisionSelectColumnHeader}
              selectOptions={buildDivisionSelectOptions(divDrop)}
              loading={divisionLoading}
              allowClear
            />
          </div>
          <div>
            <CustomLabel label="Branch" name="branchId" required />
            <CustomInput
              type="select"
              name="branchId"
              placeholder="Select branch"
              value={location.branchId}
              setFieldValue={noop}
              onChange={handleBranchChange}
              selectVariant="twoColumn"
              columnSelectHeader={branchSelectColumnHeader}
              selectOptions={buildBranchSelectOptions(branchDrop)}
              loading={branchLoading}
              disabled={!location.divisionId}
              allowClear
            />
          </div>
          <div>
            <CustomLabel label="Warehouse" name="warehouseId" required />
            <CustomInput
              type="select"
              name="warehouseId"
              placeholder="Select warehouse"
              value={location.warehouseId}
              setFieldValue={noop}
              onChange={handleWarehouseChange}
              selectVariant="twoColumn"
              columnSelectHeader={warehouseSelectColumnHeader}
              selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
              loading={warehouseLoading}
              disabled={!location.branchId}
              allowClear
            />
          </div>
        </div>
      )}

      <CustomTable columns={columns} data={dataSetupPreview?.rows || []} loading={dataSetupPreviewLoading} tableId="id" dynamicScrollY={false} scroll={{ y: 320 }} />

      <div className="flex justify-end gap-2 mt-4">
        <CustomButton type="default" onClick={() => onClose()} disabled={running}>
          Cancel
        </CustomButton>
        <CustomButton type="primary" loading={running} disabled={isLocation && !locationReady} onClick={handleConfirm} icon={<Icons.RightOutlined />} iconPosition="end">
          Proceed
        </CustomButton>
      </div>
    </CustomModal>
  );
};

export default DataSetupPreviewModal;
