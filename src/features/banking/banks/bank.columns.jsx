import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { PAYMENT_RECEIVED_STATUS, PAYMENT_TRANSACTION_TYPE, PERMISSION_MESSAGES } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';

export const bankColumns = (handleEditClick, handleBankTransferClick, handleRowClick, useModuleBank, isViewOnly) => {
  const canView = useModuleBank?.view;
  const canEdit = useModuleBank?.edit && !isViewOnly;
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleBank?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : null;

  return [
    {
      title: 'Type',
      dataIndex: 'accountType',
      key: 'accountType',
      visible: true,
      required: true,
      sorter: true,
      width: 150,
    },
    {
      title: 'Account Name',
      dataIndex: 'accountName',
      key: 'accountName',
      visible: true,
      required: true,
      sorter: true,
      width: 300,
    },
    {
      title: 'Account Code',
      dataIndex: 'accountCode',
      key: 'accountCode',
      render: accountCode => accountCode || '',
      visible: true,
      required: true,
      sorter: true,
      width: 140,
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      render: (_, record) => record.currency?.code || '',
      visible: false,
      sorter: true,
    },
    {
      title: 'Bank Name',
      dataIndex: 'bankName',
      key: 'bankName',
      sorter: true,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          {text || ''}
          {record.isPrimary && <Tag color="orange">Primary</Tag>}
        </div>
      ),
      visible: true,
      width: 295,
    },
    {
      title: 'Account Number',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      render: accountNumber => accountNumber || '',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Opening Balance',
      dataIndex: 'openingBalance',
      key: 'openingBalance',
      render: (amount, record) => formatAmount(amount, true, record?.currency),
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Avalible Balance',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      render: (amount, record) => formatAmount(amount, true, record?.currency),
      visible: true,
      required: false,
      sorter: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      visible: false,
      sorter: true,
    },
    {
      title: 'Bank Branch',
      dataIndex: 'branch',
      key: 'branch',
      visible: true,
      sorter: true,
    },
    {
      title: 'IFSC',
      dataIndex: 'ifsc',
      key: 'ifsc',
      visible: false,
      sorter: true,
    },
    {
      title: 'Action',
      key: 'edit',
      width: 120,
      render: record => (
        <div className="flex items-center gap-3">
          <Tooltip title={canView ? 'View Bank' : PERMISSION_MESSAGES.NO_PERMISSION}>
            <Icons.EyeOutlined
              className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: '#1E3A56' }}
              onClick={canView ? () => handleRowClick(record) : undefined}
            />
          </Tooltip>
          <Tooltip title={canEdit ? 'Edit Bank' : blockedTooltip}>
            <Icons.EditOutlined
              className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.primary[500] }}
              onClick={canEdit ? () => handleEditClick(record) : undefined}
            />
          </Tooltip>
          <Tooltip title={canEdit ? 'Transfer' : blockedTooltip} placement="left">
            <Icons.SwapOutlined
              className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17 }}
              onClick={canEdit ? () => handleBankTransferClick(record) : undefined}
            />
          </Tooltip>
        </div>
      ),
    },
  ];
};

export const allBankTransactionsColumn = (isViewOnly = false, isAccountant = true, handleCancelModalClick, handleApprovedModalClick, useBankTransferLogs) => {
  return [
    {
      title: 'Date',
      key: 'date',
      dataIndex: 'date',
      render: date => dateFormateForUi(date),
      visible: true,
      sorter: false,
    },
    {
      title: 'From Account',
      key: 'fromAccountName',
      dataIndex: 'fromAccountName',
      render: fromAccountName => fromAccountName || '',
      visible: true,
      sorter: false,
    },
    {
      title: 'To Account',
      key: 'toAccountName',
      dataIndex: 'toAccountName',
      render: toAccountName => toAccountName || '',
      visible: true,
      sorter: false,
    },
    {
      title: 'Amount',
      key: 'amount',
      dataIndex: 'amount',
      render: (amount, record) => {
        const fromAmount = record?.fromAmount ?? null;
        const fromCurrency = record?.fromCurrency || '';
        const toAmount = record?.toAmount ?? null;
        const toCurrency = record?.toCurrency || '';

        if (fromAmount === null && toAmount === null) {
          return formatAmount(amount, true, record?.currency);
        }

        if (fromCurrency?.code === toCurrency?.code && fromAmount !== null) {
          return formatAmount(fromAmount, true, fromCurrency);
        }

        return (
          <div className="flex flex-row gap-1">
            {fromAmount !== null && (
              <div className="text-sm">
                <span className="text-gray-600">From: </span>
                <span className="font-medium">{formatAmount(fromAmount, true, fromCurrency)}</span>
              </div>
            )}
            {fromAmount !== null && toAmount !== null && <span>-</span>}
            {toAmount !== null && (
              <div className="text-sm">
                <span className="text-gray-600">To: </span>
                <span className="font-medium">{formatAmount(toAmount, true, toCurrency)}</span>
              </div>
            )}
          </div>
        );
      },
      visible: true,
      sorter: false,
      width: 300,
    },
    {
      title: 'Transaction Type',
      key: 'transactionType',
      dataIndex: 'transactionType',
      render: transactionType => <StatusBadge status={transactionType} value={PAYMENT_TRANSACTION_TYPE?.[transactionType] || ''} />,
      visible: true,
      sorter: false,
    },
    {
      title: 'Transaction Status',
      key: 'transactionStatus',
      render: status => <StatusBadge status={status} value={PAYMENT_RECEIVED_STATUS?.[status] || ''} />,
      dataIndex: 'transactionStatus',
      visible: true,
      sorter: false,
    },
    {
      title: 'Notes',
      dataIndex: 'transactionDescription',
      key: 'transactionDescription',
      render: transactionDescription => transactionDescription || '',
      visible: true,
      required: true,
    },
    {
      title: 'Approval Notes',
      dataIndex: 'approvalNote',
      key: 'approvalNote',
      render: approvalNote => approvalNote || '',
      visible: true,
      required: true,
    },
    {
      title: 'Created At',
      key: 'createdAt',
      dataIndex: 'createdAt',
      render: createdAt => dateFormateForUi(createdAt),
      visible: true,
      sorter: false,
    },
    {
      title: 'Transferred By',
      key: 'transferredByFullName',
      dataIndex: 'transferredByFullName',
      visible: true,
      sorter: false,
    },
    {
      title: 'Action',
      key: 'edit',
      visible: true,
      width: 100,
      render: record => {
        const statusLabel = PAYMENT_RECEIVED_STATUS?.[record?.transactionStatus] || record?.transactionStatus || '-';
        const canEdit = useBankTransferLogs?.edit && !isViewOnly && isAccountant;
        const canApprove = canEdit && record?.transactionStatus === 'PENDING';
        const canCancel = canEdit && record?.transactionType === 'TRANSFER' && record?.transactionStatus === 'APPROVED';
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useBankTransferLogs?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : null;

        const approveTooltip = blockedTooltip || (canApprove ? 'Approve' : `This transaction cannot be approved in its current status - ${statusLabel}.`);
        const cancelTooltip =
          blockedTooltip ||
          (canCancel
            ? 'Cancel'
            : record?.transactionType !== 'TRANSFER'
              ? 'Only transfer transactions can be cancelled.'
              : `This transaction cannot be cancelled in its current status - ${statusLabel}.`);

        return (
          <div className="flex items-center gap-3">
            <Tooltip title={approveTooltip}>
              <Icons.CheckOutlined
                className={canApprove ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={
                  canApprove
                    ? e => {
                        e.stopPropagation();
                        handleApprovedModalClick(record?.id);
                      }
                    : undefined
                }
              />
            </Tooltip>
            <Tooltip title={cancelTooltip}>
              <Icons.CloseOutlined
                className={canCancel ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500] }}
                onClick={
                  canCancel
                    ? e => {
                        e.stopPropagation();
                        handleCancelModalClick(record?.id);
                      }
                    : undefined
                }
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};
