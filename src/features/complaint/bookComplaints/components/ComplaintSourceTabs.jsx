import { Tabs } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { COMPLAINT_SOURCE_TABS } from '../complaint.constants';

const ComplaintSourceTabs = ({ activeSource, counts, onChange }) => {
  const items = COMPLAINT_SOURCE_TABS.map(tab => {
    const Icon = Icons[tab.icon] || Icons.TeamOutlined;
    const count = counts?.[tab.key] ?? 0;

    return {
      key: tab.key,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Icon style={{ fontSize: 14 }} />
          {`${tab.label} (${count})`}
        </span>
      ),
    };
  });

  return <Tabs activeKey={activeSource} onChange={onChange} items={items} className="px-4 pt-1" />;
};

export default ComplaintSourceTabs;
