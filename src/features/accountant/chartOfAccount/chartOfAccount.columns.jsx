import { Dropdown, Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';

import { formatAmount } from '@/utils/currency';
import { DOCUMENT_NUMBER_COLUMN_WIDTH, STANDARD_COLUMN_WIDTHS, TruncatedCell, getAmountCoulmn, getDateColumn } from '@/utils/tableColumns';

const INDENT = 28;

export const chartOfAccountColumns = ({ colorPalette, toggleExpand, useModuleAccountant, isViewOnly, openDropdownKey, setOpenDropdownKey, navigate, setAccountModal, handleDeleteAccount }) => [
  {
    title: 'Account Name',
    key: 'accountName',
    width: 380,
    visible: true,
    required: true,
    render: (_, record) => {
      const lineLeft = (record.indentLevel - 1) * INDENT + 10;

      return (
        <div className="relative flex items-center gap-2 min-h-[28px]" style={{ paddingLeft: record.indentLevel * INDENT }}>
          {record.indentLevel > 0 && (
            <>
              <span className="absolute pointer-events-none bg-slate-300" style={{ left: lineLeft, top: 0, width: 1, bottom: record.isLastChild ? '50%' : -1 }} />
              <span className="absolute pointer-events-none bg-slate-300" style={{ left: lineLeft, top: '50%', width: 16, height: 1 }} />
            </>
          )}

          {record.hasChildren ? (
            <button
              type="button"
              className="relative z-[1] flex items-center justify-center w-5 h-5 shrink-0 cursor-pointer bg-white border border-gray-200 rounded-sm text-gray-500"
              aria-label={record.isExpanded ? 'Collapse' : 'Expand'}
              onClick={e => {
                e.stopPropagation();
                toggleExpand(record.id);
              }}
            >
              {record.isExpanded ? <Icons.MinusOutlined style={{ fontSize: 10 }} /> : <Icons.PlusOutlined style={{ fontSize: 10 }} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <span className="font-semibold" style={record.hasChildren ? { color: colorPalette.primary[500] } : undefined}>
            {record.accountName}
          </span>

          {record.hasChildren && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colorPalette.primary[50], color: colorPalette.primary[500] }}>
              {record.childrenCount}
            </span>
          )}
        </div>
      );
    },
  },
  {
    title: 'Account Code',
    key: 'accountCode',
    width: 140,
    visible: true,
    render: (_, record) => <span className="text-gray-600">{record.accountCode}</span>,
  },
  {
    title: 'Closing Balance',
    key: 'currentBalance',
    width: 160,
    align: 'right',
    visible: true,
    render: (_, record) => {
      const balance = Number(record.currentBalance) || 0;
      return (
        <span className="text-gray-900 tabular-nums">
          {formatAmount(balance)}
          <span className="ml-1 text-xs text-gray-500">{record.isDebit ? 'Dr' : 'Cr'}</span>
        </span>
      );
    },
  },
  {
    title: 'Account Type',
    key: 'accountType',
    width: 180,
    visible: true,
    render: (_, record) => <span className="text-gray-600">{record.categoryDisplayName || record.category}</span>,
  },
  {
    title: 'Parent Account',
    key: 'parentAccount',
    width: 180,
    visible: true,
    render: (_, record) => <span className="text-gray-600">{record.parentAccountName}</span>,
  },
  {
    title: '',
    key: 'lock',
    width: 50,
    align: 'center',
    visible: true,
    required: true,
    render: (_, record) =>
      record.isSystemAccount ? (
        <Tooltip title="You cannot delete this account. However, you will be able to edit the account details.">
          <Icons.LockOutlined style={{ fontSize: 16, color: colorPalette.primary[500] }} />
        </Tooltip>
      ) : null,
  },
  ...(!isViewOnly
    ? [
        {
          title: 'Action',
          key: 'action',
          width: 90,
          align: 'center',
          visible: true,
          required: true,
          render: (_, record) => {
            const canEdit = !!useModuleAccountant?.edit;
            const canDelete = !!useModuleAccountant?.delete && !record.isSystemAccount && record.managedIn !== 'BANKING';
            if (!canEdit && !canDelete) return null;

            return (
              <span onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
                <Dropdown
                  placement="bottomRight"
                  trigger={['click']}
                  open={openDropdownKey === record.id}
                  onOpenChange={flag => setOpenDropdownKey(flag ? record.id : null)}
                  dropdownRender={() => (
                    <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                      <div className="px-2 py-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Actions :</div>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setOpenDropdownKey(null);
                            if (record.managedIn === 'BANKING') {
                              navigate(`/banks/${record.id}/edit`);
                              return;
                            }
                            setAccountModal({ open: true, account: record });
                          }}
                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer transition-colors duration-150"
                        >
                          <Icons.EditOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <Popconfirm
                          title="Delete Account"
                          description={`Are you sure you want to delete "${record.accountName}"? This action cannot be undone.`}
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => {
                            setOpenDropdownKey(null);
                            handleDeleteAccount(record.id);
                          }}
                        >
                          <button
                            type="button"
                            onClick={e => e.stopPropagation()}
                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer transition-colors duration-150"
                          >
                            <Icons.DeleteOutlined style={{ fontSize: 14, color: colorPalette.error[500] }} />
                            Delete
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  )}
                >
                  <Tooltip title="More Actions" placement="left">
                    <span>
                      <Icons.MoreOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} />
                    </span>
                  </Tooltip>
                </Dropdown>
              </span>
            );
          },
        },
      ]
    : []),
];

export const accountLedgerColumns = () => [
  { ...getDateColumn('Date', 'date', 'date'), sorter: false, visible: true, required: true },
  {
    title: 'Document No.',
    key: 'documentNo',
    width: DOCUMENT_NUMBER_COLUMN_WIDTH,
    visible: true,
    required: true,
    render: (_, record) => (record.documentNo ? <Tag className="font-semibold">{record.documentNo}</Tag> : ''),
  },
  {
    title: 'Transaction Details',
    key: 'transactionDetails',
    width: 260,
    visible: true,
    render: (_, record) => <TruncatedCell value={record.partyName || record.narration} />,
  },
  {
    title: 'Type',
    key: 'type',
    width: 180,
    visible: true,
    render: (_, record) => <TruncatedCell value={record.type} />,
  },
  {
    title: 'Branch',
    key: 'branchName',
    width: STANDARD_COLUMN_WIDTHS.branch,
    visible: true,
    render: (_, record) => <TruncatedCell value={record.branchName} />,
  },
  {
    ...getAmountCoulmn('Debit', 'debit', 'debit'),
    sorter: false,
    align: 'right',
    visible: true,
    render: (_, record) => (record.debit ? formatAmount(record.debit) : ''),
  },
  {
    ...getAmountCoulmn('Credit', 'credit', 'credit'),
    sorter: false,
    align: 'right',
    visible: true,
    render: (_, record) => (record.credit ? formatAmount(record.credit) : ''),
  },
];
