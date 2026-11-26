export const divisionSelectColumnHeader = { id: 'Division Code', name: 'Division Name' };
export const branchSelectColumnHeader = { id: 'Branch Code', name: 'Branch Name' };
export const warehouseSelectColumnHeader = { id: 'Warehouse Code', name: 'Warehouse Name' };

export const buildDivisionSelectOptions = (divDrop = []) =>
  (divDrop || []).map(option => {
    const code = option?.divisionCode || '-';
    const name = option?.name;

    return {
      value: option.id ?? option._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });

export const buildBranchSelectOptions = (branchDrop = []) =>
  (branchDrop || []).map(option => {
    const code = option?.branchCode || '-';
    const name = option?.name;

    return {
      value: option.id ?? option._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });

export const buildWarehouseSelectOptions = (warehouseDrop = []) =>
  (warehouseDrop || []).map(option => {
    const code = option?.warehouseId || '-';
    const name = option?.name;

    return {
      value: option.id ?? option._id,
      label: name,
      columnId: code,
      columnName: name || '-',
      searchLabel: `${code} ${name || ''}`.replace(/\s+/g, ' ').trim(),
    };
  });
