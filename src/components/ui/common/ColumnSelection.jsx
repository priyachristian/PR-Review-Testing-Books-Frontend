import { useEffect, useState } from 'react';

// Components
import { Button, Checkbox, Input } from '../../AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CloseIconButton from '@/components/ui/button/CloseIconButton';

// Extras
import Icons from 'assets/icons/icon';
import { setInLocalStorage, stringifyTableColumns } from 'utils/services';
import { colorPalette } from 'utils/theme';

const ColumnSelector = ({ columns, handleOk, handleCancel }) => {
  const [filteredColumns, setFilteredColumns] = useState();
  const [searchText, setSearchText] = useState('');
  const [draggedItem, setDraggedItem] = useState();

  const handleDragStart = (e, id) => {
    setDraggedItem(id);

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = e => {
    e.preventDefault();
  };

  const handleDragEnter = (e, targetId) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === targetId) return;

    const draggedIndex = filteredColumns.findIndex(item => item.key === draggedItem);
    const targetIndex = filteredColumns.findIndex(item => item.key === targetId);

    if (draggedIndex === targetIndex) return;

    const newItems = [...filteredColumns];
    const draggedItemContent = newItems[draggedIndex];

    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemContent);

    setFilteredColumns(newItems);
  };

  const handleDrop = e => {
    e.preventDefault();
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  useEffect(() => {
    setFilteredColumns([...columns]);
  }, [columns]);

  const handleSelectAll = () => {
    setFilteredColumns(prev =>
      prev?.map(col => ({
        ...col,
        visible: true,
      }))
    );
  };

  const handleDeselectAll = () => {
    setFilteredColumns(prev =>
      prev?.map(col => ({
        ...col,
        visible: col?.required ? true : false,
      }))
    );
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
        <span className="text-base font-semibold text-gray-800">Customize Columns</span>
        <CloseIconButton onClick={handleCancel} />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Input
          placeholder="Search columns..."
          prefix={<Icons.SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={e => {
            setSearchText(e.target.value);
          }}
          allowClear
          size="middle"
          className="min-w-0 flex-1 w-full"
        />
        <div
          className="inline-flex shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm"
          style={{ borderColor: colorPalette.primary[100] }}
          role="group"
          aria-label="Column visibility shortcuts"
        >
          <button
            type="button"
            title="Show every column"
            className="border-0 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-300"
            style={{
              borderRight: `1px solid ${colorPalette.primary[100]}`,
              color: colorPalette.primary[600],
            }}
            onClick={handleSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            title="Hide optional columns (required columns stay visible)"
            className="border-0 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-300"
            style={{ color: colorPalette.primary[600] }}
            onClick={handleDeselectAll}
          >
            Deselect all
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
        <div className="min-h-[300px] max-h-[300px] overflow-y-auto p-2 rounded-lg">
          {filteredColumns?.map(item => {
            const titleStr = typeof item?.title === 'string' ? item.title : null;
            if (titleStr === null || titleStr.toLowerCase().includes(searchText.toLowerCase())) {
              return (
                <div
                  key={item?.key}
                  draggable
                  onDragStart={e => handleDragStart(e, item.key)}
                  onDragOver={handleDragOver}
                  onDragEnter={e => handleDragEnter(e, item.key)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`
                  flex items-center p-1 bg-white rounded-md border mb-1
                  cursor-move transition-all duration-200
                ${draggedItem === item.key ? 'opacity-50 bg-gray-100' : ''}`}
                >
                  <Icons.DragOutlined className="mr-2 text-gray-400" />
                  {item?.required ? (
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <span style={{ color: colorPalette.primary[500] }} className=" text-xs">
                        ★
                      </span>
                    </div>
                  ) : (
                    <Checkbox
                      checked={item.visible}
                      onChange={e => {
                        const updatedFilteredColumns = filteredColumns?.map(col => {
                          if (col?.key === item?.key) {
                            col.visible = e.target.checked;
                          }
                          return col;
                        });
                        setFilteredColumns(updatedFilteredColumns);
                      }}
                      className="mr-2"
                      onClick={e => e.stopPropagation()}
                    />
                  )}
                  <span className="flex-1 truncate">{item?.title}</span>
                  <div className="flex items-center gap-1.5 ml-2 mr-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Width:</span>
                    <Input
                      type="text"
                      size="small"
                      inputMode="numeric"
                      className="w-[85px] text-xs text-center"
                      placeholder="auto"
                      value={item.width ? Math.round(Number(item.width)) : ''}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        const val = digitsOnly ? parseInt(digitsOnly, 10) : undefined;
                        const updatedFilteredColumns = filteredColumns?.map(col => {
                          if (col?.key === item?.key) {
                            return { ...col, width: val };
                          }
                          return col;
                        });
                        setFilteredColumns(updatedFilteredColumns);
                      }}
                      onBlur={e => {
                        if (!e.target.value) return;
                        let val = parseInt(e.target.value, 10);
                        if (Number.isNaN(val) || val < 50) val = 50;
                        if (val > 500) val = 500;
                        if (val !== item.width) {
                          const updatedFilteredColumns = filteredColumns?.map(col => {
                            if (col?.key === item?.key) {
                              return { ...col, width: val };
                            }
                            return col;
                          });
                          setFilteredColumns(updatedFilteredColumns);
                        }
                      }}
                    />
                    <span className="text-[10px] text-gray-400">px</span>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
        <Button
          onClick={() => {
            handleCancel();
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() => {
            handleOk(filteredColumns);
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

const ColumnSelection = ({ columns, setColumnsList, setCutomizedColumns, configPage, modalOpen: controlledModalOpen, setModalOpen: setControlledModalOpen, hideTrigger = false }) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isControlled = controlledModalOpen !== undefined && setControlledModalOpen !== undefined;
  const showColumnModal = isControlled ? controlledModalOpen : internalModalOpen;
  const setShowColumnModal = isControlled ? setControlledModalOpen : setInternalModalOpen;
  const handleOk = updatedColumns => {
    let filteredData = updatedColumns?.filter(x => x?.visible);
    setInLocalStorage(configPage, {
      columnList: stringifyTableColumns(updatedColumns.map(col => ({ ...col }))),
      customizedColumns: stringifyTableColumns(filteredData.map(col => ({ ...col }))),
    });
    setCutomizedColumns(filteredData);
    setColumnsList(updatedColumns);
    setShowColumnModal(false);
  };

  const handleCancel = () => {
    setShowColumnModal(false);
  };
  return (
    <>
      {!hideTrigger && (
        <Button
          icon={<Icons.TableOutlined />}
          size="medium"
          className="flex items-center justify-center sm:w-auto"
          onClick={() => {
            setShowColumnModal(!showColumnModal);
          }}
        >
          Columns
        </Button>
      )}
      <CustomModal
        modalOpen={showColumnModal}
        setModalOpen={open => {
          if (!open) handleCancel();
        }}
        title={null}
        width={500}
        centered={true}
        showCloseIcon={false}
      >
        <ColumnSelector
          columns={columns.map(col => ({ ...col }))}
          handleCancel={() => {
            handleCancel();
          }}
          handleOk={handleOk}
        />
      </CustomModal>
    </>
  );
};

export default ColumnSelection;
