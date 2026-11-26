import { setInLocalStorage, stringifyTableColumns } from 'utils/services';

/**
 * Shared handler for resizing table columns and persisting widths to localStorage.
 * @param {Function} setColumnsList - setter for the full column list (incl. hidden)
 * @param {Function} setCustomizedColumns - setter for visible/customized columns
 * @param {string} configKey - localStorage key (e.g. configEnum.QUALITY_MASTER_CONFIG)
 */
const useColumnResize = (setColumnsList, setCustomizedColumns, configKey) => {
  const handleColumnResize =
    key =>
    (e, { size }) => {
      const nextWidth = Math.round(size.width);
      let updatedColumnsList;
      setColumnsList(prev => {
        const nextCols = [...prev];
        const colIndex = nextCols.findIndex(c => (c.dataIndex || c.key) === key);
        if (colIndex > -1) {
          nextCols[colIndex] = { ...nextCols[colIndex], width: nextWidth };
        }
        updatedColumnsList = nextCols;
        return nextCols;
      });

      setCustomizedColumns(prev => {
        const nextCols = [...prev];
        const colIndex = nextCols.findIndex(c => (c.dataIndex || c.key) === key);
        if (colIndex > -1) {
          nextCols[colIndex] = { ...nextCols[colIndex], width: nextWidth };
          setInLocalStorage(configKey, {
            columnList: stringifyTableColumns(updatedColumnsList.map(col => ({ ...col }))),
            customizedColumns: stringifyTableColumns(nextCols.map(col => ({ ...col }))),
          });
        }
        return nextCols;
      });
    };

  return handleColumnResize;
};

export default useColumnResize;
