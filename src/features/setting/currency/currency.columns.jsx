import { Tag } from '@/components/AntDComponent';

export const currencyColumns = () => [
  {
    title: 'Name',
    key: 'name',
    render: (_, record) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{`${record.code} - ${record.name}`}</span>
        {record.isBaseCurrency ? (
          <Tag color="green" className="m-0 text-[11px] leading-4 px-1.5 py-[1px] rounded">
            Base Currency
          </Tag>
        ) : null}
      </div>
    ),
  },
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
  },
  {
    title: 'Exchange Rate',
    key: 'exchangeRate',
    render: (_, record) => (record.isBaseCurrency ? <span className="text-gray-400 text-xs">Base</span> : <span>{record.exchangeRate != null ? record.exchangeRate : ''}</span>),
  },
];
