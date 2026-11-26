import { useMemo } from 'react';

import { Button, Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn } from '@/utils/tableColumns';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';

const RefundHistoryTab = ({ refunds = [], loading = false, paymentDocNo = '', paymentStatus, statusValueMap, canManageRefunds, onEditRefund, onDeleteRefund, currency }) => {
  const columns = useMemo(
    () => [
      {
        title: 'Refund #',
        key: 'refundNo',
        render: (_, __, index) => <Tag className="font-semibold">{paymentDocNo ? `${paymentDocNo}-R${index + 1}` : `R-${String(index + 1).padStart(3, '0')}`}</Tag>,
      },
      getDateColumn('Date', 'refundedAt', 'refundedAt', true, false),
      {
        title: 'Status',
        key: 'status',
        render: () => <StatusBadge status={paymentStatus} value={statusValueMap?.[paymentStatus] || '-'} />,
      },
      {
        title: 'Amount refunded',
        dataIndex: 'amountRefunded',
        key: 'amountRefunded',
        render: amount => <span className="font-semibold text-green-600">{formatAmount(amount, true, currency)}</span>,
      },
    ],
    [paymentDocNo, paymentStatus, statusValueMap, currency]
  );

  return (
    <div className="my-container p-6 space-y-5">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Refund History</h3>
          <p className="text-sm text-gray-600 mt-1">This payment document has the following refund entries.</p>
        </div>

        <CustomTable
          showHeader={false}
          columns={columns}
          data={refunds}
          loading={loading}
          tableId="_id"
          pagination={false}
          dynamicScrollY={false}
          isPaginationFixed={false}
          className="border-0 shadow-none"
          customStyle="expanded-batch-table border-0"
          columnActions={
            canManageRefunds
              ? () => ({
                  title: 'Action',
                  key: 'action',
                  width: 100,
                  render: (_, record) => (
                    <div className="flex items-center">
                      <Tooltip title="Edit refund">
                        <Button
                          type="text"
                          aria-label="Edit refund"
                          icon={<Icons.EditOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} />}
                          onClick={e => {
                            e.stopPropagation();
                            onEditRefund?.(record);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Delete refund">
                        <Button
                          type="text"
                          aria-label="Delete refund"
                          icon={<Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500] }} />}
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteRefund?.(record);
                          }}
                        />
                      </Tooltip>
                    </div>
                  ),
                })
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default RefundHistoryTab;
