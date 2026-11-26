import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { getProviderOption } from './providerCredentials.constants';

const getProviderLabel = platformName => getProviderOption(platformName)?.label || platformName;

export const providerCredentialsColumns = ({ onEdit, onDelete, onReveal, revealing, revealedByPlatform }) => [
  {
    title: 'Platform',
    dataIndex: 'platformName',
    key: 'platformName',
    width: 180,
    render: platformName => <span className="font-semibold text-[#030711]">{getProviderLabel(platformName)}</span>,
  },
  {
    title: 'Portal username',
    dataIndex: 'username',
    key: 'username',
    render: username => username || '-',
  },
  {
    title: 'Password',
    key: 'password',
    width: 260,
    render: (_, record) => {
      if (!record.hasPassword) return <Tag color="red">Not set</Tag>;
      const revealed = revealedByPlatform[record.platformName];
      return (
        <div className="flex items-center gap-3">
          {revealed !== undefined ? <span className="font-mono text-[#030711] break-all">{revealed}</span> : <Tag color="green">Configured</Tag>}
          <button type="button" onClick={() => onReveal(record.platformName)} disabled={revealing} className="text-xs text-primary hover:underline disabled:opacity-50">
            {revealed !== undefined ? 'Hide' : 'Show password'}
          </button>
        </div>
      );
    },
  },
  {
    title: 'Action',
    key: 'action',
    width: 120,
    render: (_, record) => (
      <div className="flex items-center justify-start gap-3">
        <Tooltip title="Edit">
          <Icons.EditOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={() => onEdit(record.platformName)} />
        </Tooltip>
        <Popconfirm
          title="Delete credentials?"
          description={`E-invoice and e-way bill generation through ${getProviderLabel(record.platformName)} will stop working until new credentials are added.`}
          onConfirm={() => onDelete(record.platformName)}
          okText="Yes"
          cancelText="No"
        >
          <Tooltip title="Delete">
            <span>
              <Icons.DeleteOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} />
            </span>
          </Tooltip>
        </Popconfirm>
      </div>
    ),
  },
];
