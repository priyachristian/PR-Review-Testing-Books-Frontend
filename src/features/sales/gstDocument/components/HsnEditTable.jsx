import { useMemo } from 'react';
import { Input } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomInput from '@/components/forms/formInput/CustomInput';

// Column widths fill the generate modal's content width; the item column takes what the others leave.
const TABLE_WIDTH = 670;
const HSN_COLUMN_WIDTH = 180;
// Rows scroll under a fixed header beyond this height.
const TABLE_SCROLL_Y = 256;

/**
 * Compact list of the document lines with an editable HSN/SAC per line. Rows come from toHsnRows; invalid codes
 * reported by the backend are highlighted.
 */
const HsnEditTable = ({ rows = [], onRowsChange, invalidHsnCodes = [], updateItemMaster = false, onUpdateItemMasterChange }) => {
  const columns = useMemo(() => {
    const updateRow = (rowKey, changes) => onRowsChange(rows.map(row => (row.rowKey === rowKey ? { ...row, ...changes } : row)));

    return [
      {
        title: 'Item',
        key: 'item',
        width: TABLE_WIDTH - HSN_COLUMN_WIDTH,
        ellipsis: false,
        render: (_, row) => (
          <div>
            <p className="text-gray-900">{row.itemName || '-'}</p>
            {row.itemNo && <p className="text-xs text-gray-500">{row.itemNo}</p>}
          </div>
        ),
      },
      {
        title: 'HSN / SAC',
        key: 'hsnCode',
        width: HSN_COLUMN_WIDTH,
        ellipsis: false,
        render: (_, row) => (
          <Input
            size="middle"
            value={row.hsnCode}
            // The backend reports an empty HSN as 'MISSING'.
            status={invalidHsnCodes.includes(row.hsnCode || 'MISSING') ? 'error' : undefined}
            placeholder="HSN / SAC"
            maxLength={8}
            aria-label={`HSN for ${row.itemName || 'item'}`}
            onChange={e => updateRow(row.rowKey, { hsnCode: e.target.value.replace(/\D/g, '') })}
          />
        ),
      },
    ];
  }, [rows, onRowsChange, invalidHsnCodes]);

  if (!rows.length) return null;

  const hasChangedHsn = rows.some(row => row.hsnCode.trim() !== row.originalHsnCode);

  return (
    <div className="space-y-2">
      {invalidHsnCodes.length > 0 && <p className="text-xs text-red-500">Correct the highlighted HSN codes and generate again.</p>}

      <CustomTable columns={columns} data={rows} tableId="rowKey" pagination={false} dynamicScrollY={false} isPaginationFixed={false} scroll={{ y: TABLE_SCROLL_Y }} className="rounded-md" />

      {hasChangedHsn && (
        <CustomInput
          type="checkbox"
          name="updateItemMaster"
          CheckboxName="Also save the changed HSN codes to the item master"
          value={Boolean(updateItemMaster)}
          setFieldValue={(_, checked) => onUpdateItemMasterChange(checked)}
        />
      )}
    </div>
  );
};

export default HsnEditTable;
