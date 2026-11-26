import { MailOutlined, PhoneOutlined } from '@ant-design/icons';
import Icons from 'assets/icons/icon';

const LABELS = [
  { key: 'username', label: 'Username', icon: <Icons.UserOutlined className="text-[13px]" /> },
  { key: 'email', label: 'Email', icon: <MailOutlined className="text-[13px]" /> },
  { key: 'phone', label: 'Phone', icon: <PhoneOutlined className="text-[13px]" /> },
];

const ProfileCard = ({ name, email, phone, role }) => {
  const values = { username: name, email, phone };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mx-2 sm:mx-4 my-2">
      <div className="flex flex-col items-center px-8 pt-10 pb-8">
        <div className="w-[72px] h-[72px] rounded-full bg-[#9ca3af] flex items-center justify-center mb-4">
          <Icons.UserOutlined className="text-white text-[32px]" />
        </div>
        <h2 className="text-[18px] font-bold text-[#030711] text-center">{name || '-'}</h2>
        {role && <p className="text-[13px] text-gray-500 mt-1">{role}</p>}
      </div>

      <div className="mx-4 mb-4 rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-y divide-gray-200">
          {LABELS.map(item => (
            <div key={`${item.key}-label`} className="flex items-center gap-2 px-5 py-4 text-[12px] text-gray-500 bg-[#fafafa]">
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}

          {LABELS.map(item => (
            <div key={`${item.key}-value`} className="px-5 py-4 text-[14px] font-medium text-[#030711] break-all bg-white">
              {values[item.key] || '-'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
