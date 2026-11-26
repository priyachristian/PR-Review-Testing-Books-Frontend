import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import { getItemUnitName } from '@/utils/itemLineUnit';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusBadge from '../badge/StatusBadge';

const RecurringExecutionHistory = ({
  history = [],
  typeLabel = 'Invoice',
  redirectPathPrefix = '/invoices',
  generatedNumberKey = 'generatedInvoiceNumber',
  generatedIdKey = 'generatedInvoiceId',
  loadingRowId = null,
  onCreateAction,
  currency,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  const showErrorDetails = record => {
    setSelectedError(record);
    setIsModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        title: 'Cycle No',
        dataIndex: 'cycleNumber',
        key: 'cycleNumber',
        fixed: 'left',
        render: cycleNumber => <span className="font-semibold text-gray-800">{cycleNumber}</span>,
      },
      {
        title: 'Scheduled Date',
        dataIndex: 'scheduledDate',
        key: 'scheduledDate',
        render: date => dateFormateForUi(date) || '-',
      },
      {
        title: 'Execution Date',
        dataIndex: 'executedDate',
        key: 'executedDate',
        render: date => dateFormateForUi(date) || '-',
      },
      {
        title: 'Next Execution Date',
        dataIndex: 'nextExecutionDate',
        key: 'nextExecutionDate',
        render: date => dateFormateForUi(date) || '-',
      },
      {
        title: `Generated ${typeLabel}`,
        dataIndex: generatedNumberKey,
        key: generatedNumberKey,
        render: (docNumber, record) => {
          const docId = record[generatedIdKey];
          // The generated document was created but later deleted: keep showing
          // its number (audit trail) as non-clickable, so it's clearly distinct
          // from a cycle that never produced a document ("-").
          if (record.isGeneratedDeleted && docNumber) {
            return (
              <Tooltip title={`This ${typeLabel.toLowerCase()} was deleted`}>
                <Tag className="font-semibold line-through text-gray-400 bg-gray-50">{docNumber}</Tag>
              </Tooltip>
            );
          }
          if (record.status === 'SUCCESS' && docId) {
            return (
              <Link to={`${redirectPathPrefix}/${docId}`} className="flex items-center gap-1 no-underline hover:!no-underline">
                <Tag className="font-semibold">{docNumber}</Tag>
              </Link>
            );
          }
          return <span className="text-gray-400">-</span>;
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => <StatusBadge status={status} value={status} />,
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => {
          if (record.status === 'FAILED') {
            const isCreating = loadingRowId === record._id;
            return (
              <div className="flex items-center gap-3">
                <Tooltip title="View Error">
                  <Icons.WarningOutlined className="cursor-pointer hover:scale-110 transition-transform" style={{ fontSize: 17, color: '#DC2626' }} onClick={() => showErrorDetails(record)} />
                </Tooltip>
                <Tooltip title={`Create ${typeLabel}`}>
                  <Icons.SyncOutlined
                    className={`cursor-pointer hover:scale-110 transition-transform ${isCreating ? 'pointer-events-none opacity-60' : ''}`}
                    style={{ fontSize: 17, color: '#1E3A56' }}
                    spin={isCreating}
                    onClick={() => !isCreating && onCreateAction(record)}
                  />
                </Tooltip>
              </div>
            );
          }
          return null;
        },
      },
    ],
    [loadingRowId, onCreateAction, typeLabel, generatedNumberKey, generatedIdKey, redirectPathPrefix]
  );

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 mt-2 shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Icons.ClockCircleOutlined className="text-gray-500" />
          Execution Log &amp; {typeLabel}s
        </h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Total Cycles: {history.length}</span>
      </div>

      <CustomTable columns={columns} data={history} pagination={{ pageSize: 5 }} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
      <CustomModal
        title={
          <div className="flex items-center gap-2 text-red-600 font-semibold border-b pb-2">
            <Icons.CloseCircleOutlined className="text-xl" />
            <span>Execution Failure Details (Cycle #{selectedError?.cycleNumber})</span>
          </div>
        }
        modalOpen={isModalOpen}
        setModalOpen={setIsModalOpen}
        width={800}
        destroyOnClose={true}
      >
        {selectedError && (
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <span className="text-xs text-gray-500 block">Scheduled Date</span>
                <span className="text-sm font-semibold text-gray-800">{dateFormateForUi(selectedError.scheduledDate)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Execution Date</span>
                <span className="text-sm font-semibold text-gray-800">{dateFormateForUi(selectedError.executedDate) || '-'}</span>
              </div>
            </div>

            {selectedError?.errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3.5 flex items-start gap-2.5">
                <Icons.CloseCircleOutlined className="text-red-500 text-base mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-red-800 block mb-0.5">Failure Reason</span>
                  <p className="text-sm text-red-700 font-medium m-0 leading-relaxed">{selectedError.errorMessage}</p>
                </div>
              </div>
            )}

            {(() => {
              const itemDetails = selectedError?.metadata || selectedError?.metaData;
              return Array.isArray(itemDetails) && itemDetails.length > 0 ? (
                <div className="border border-gray-100 rounded-lg overflow-hidden mt-3 shadow-xs">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-700">Item Details causing failure</span>
                  </div>

                  <CustomTable
                    data={itemDetails}
                    rowKey={(record, idx) => record.itemId || idx}
                    pagination={null}
                    dynamicScrollY={false}
                    compactOnDesktop={true}
                    scroll={{ x: 750 }}
                    columns={[
                      {
                        title: 'Item No / Name',
                        dataIndex: 'itemName',
                        key: 'itemName',
                        render: (name, record) => (
                          <div className="flex flex-col max-w-[200px]">
                            <span className="text-[11px] font-mono text-gray-400">{record?.itemNo || '-'}</span>
                            <span className="font-semibold text-gray-800 text-xs truncate">{name}</span>
                            {record?.description && <span className="text-[11px] text-gray-400 truncate">{record?.description}</span>}
                          </div>
                        ),
                      },
                      {
                        title: 'HSN',
                        dataIndex: 'hsnCode',
                        key: 'hsnCode',
                        width: 120,
                        render: hsn => <span className="text-xs font-medium text-gray-600">{hsn || '-'}</span>,
                      },
                      {
                        title: 'Qty / Unit',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 120,
                        render: (qty, record) => (
                          <span className="text-xs font-medium">
                            {qty} <span className="text-[10px] text-gray-400 font-normal">{getItemUnitName(record)}</span>
                          </span>
                        ),
                      },
                      {
                        title: 'Rate',
                        dataIndex: 'rate',
                        key: 'rate',
                        width: 120,
                        render: rate => <span className="text-xs text-gray-600">{formatAmount(rate, true, currency)}</span>,
                      },
                      {
                        title: 'GST',
                        dataIndex: 'gst',
                        key: 'gst',
                        width: 120,
                        render: gst => <span className="text-xs text-gray-600">{gst ? `${gst}%` : '0%'}</span>,
                      },
                      {
                        title: 'Tax',
                        dataIndex: 'taxAmount',
                        key: 'taxAmount',
                        width: 120,
                        render: tax => <span className="text-xs text-gray-500">{formatAmount(tax || 0, true, currency)}</span>,
                      },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        key: 'amount',
                        width: 120,
                        render: amount => <span className="text-xs font-bold text-gray-900">{formatAmount(amount, true, currency)}</span>,
                      },
                    ]}
                  />
                </div>
              ) : null;
            })()}
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default RecurringExecutionHistory;
