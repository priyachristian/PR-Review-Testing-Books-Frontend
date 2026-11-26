import { useEffect, useRef, useState } from 'react';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import BreakdownDrawer from '@/components/dataDisplay/drawer/BreakdownDrawer';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import DetailPageWithTableSkeleton from '@/components/ui/common/DetailPageSkeleton';
import Stepper from '@/components/ui/common/Stepper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { getPresetDateRange } from '@/utils/datePresets';
import { filterInputEnum } from '@/utils/constants';
import { Alert, App, Avatar, Badge, Collapse, Dropdown, Input, Layout, Menu, Popconfirm, Popover, Space, Tabs, Tag, Tooltip, Typography } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import logo from '@/assets/images/ABSS-LOGO.png';
import { colorPalette } from '@/utils/theme';

const { Title, Text, Paragraph } = Typography;

const selectOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
];

const tableColumns = [
  {
    title: 'Code#',
    dataIndex: 'id',
    key: 'id',
    render: id => <Tag className="font-semibold">{id}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'status',
    render: status => <StatusBadge status={status} value={status ? 'Active' : 'Inactive'} />,
  },
];

const allTableData = [
  { id: 'BR-001', name: 'Sample Item A', isActive: true },
  { id: 'BR-002', name: 'Sample Item B', isActive: false },
  { id: 'BR-003', name: 'Sample Item C', isActive: true },
  { id: 'BR-004', name: 'Sample Item D', isActive: true },
  { id: 'BR-005', name: 'Sample Item E', isActive: false },
  { id: 'BR-006', name: 'Sample Item F', isActive: true },
  { id: 'BR-007', name: 'Sample Item G', isActive: false },
  { id: 'BR-008', name: 'Sample Item H', isActive: true },
  { id: 'BR-009', name: 'Sample Item I', isActive: true },
  { id: 'BR-010', name: 'Sample Item J', isActive: false },
  { id: 'BR-011', name: 'Sample Item K', isActive: true },
  { id: 'BR-012', name: 'Sample Item L', isActive: false },
  { id: 'BR-013', name: 'Sample Item M', isActive: true },
  { id: 'BR-014', name: 'Sample Item N', isActive: true },
  { id: 'BR-015', name: 'Sample Item O', isActive: false },
  { id: 'BR-016', name: 'Sample Item P', isActive: true },
  { id: 'BR-017', name: 'Sample Item Q', isActive: false },
  { id: 'BR-018', name: 'Sample Item R', isActive: true },
];

const dropdownItems = [
  { key: '1', label: 'Edit', icon: <Icons.EditOutlined /> },
  { key: '2', label: 'Export', icon: <Icons.DownloadOutlined /> },
  { key: '3', label: 'Delete', icon: <Icons.DeleteOutlined />, danger: true },
];

const tabItems = [
  { key: '1', label: 'Overview', children: <p>Tab content</p> },
  { key: '2', label: 'Details', children: <p>Tab content</p> },
];

const stepItems = [{ title: 'Upload File' }, { title: 'Map Columns' }, { title: 'Review & Import' }];

const sidebarMenuItems = [
  { key: 'dashboard', icon: <Icons.HomeOutlined />, label: 'Dashboard' },
  {
    key: 'sales',
    icon: <Icons.ShoppingOutlined />,
    label: 'Sales',
    children: [
      { key: 'customer', label: 'Customer' },
      { key: 'invoice', label: 'Invoice' },
      { key: 'sales-order', label: 'Sales Order' },
    ],
  },
  {
    key: 'purchase',
    icon: <Icons.InboxOutlined />,
    label: 'Purchase',
    children: [
      { key: 'vendor', label: 'Vendor' },
      { key: 'bill', label: 'Bill' },
    ],
  },
  { key: 'inventory', icon: <Icons.AppstoreOutlined />, label: 'Inventory' },
];

const SidebarPreview = ({ selectedKeys, openKeys, onOpenChange, onMenuClick }) => {
  const mainPrimaryColor = colorPalette.primary[500];

  return (
    <div className="ds-sidebar-preview inline-block border border-[#e9eaec] rounded-lg overflow-hidden bg-white shadow-sm" style={{ width: 220 }}>
      <div className="h-[56px] flex items-center px-4 border-b border-gray-200 bg-white">
        <img src={logo} alt="ABSS" className="object-contain" style={{ height: 60, width: '100%' }} />
      </div>

      <div className="pt-2 bg-white">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          onClick={onMenuClick}
          className="border-none custom-menu rounded-[8px] text-[#1e293b]"
          items={sidebarMenuItems}
          style={{ backgroundColor: '#ffffff', paddingBottom: 8 }}
        />
      </div>

      <div className="flex items-center gap-2.5 px-3 py-2.5 border-t border-[#f0f0f0] cursor-pointer hover:bg-[#eff6ff] transition-colors">
        <Icons.BookOutlined style={{ fontSize: 16, color: mainPrimaryColor, flexShrink: 0 }} />
        <span className="text-[12.5px] font-medium truncate text-gray-700">Help Documents</span>
        <Icons.LinkOutlined style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 'auto' }} />
      </div>

      <div className="flex items-center gap-2.5 px-3 py-2.5 border-t border-[#f0f0f0] cursor-pointer hover:bg-gray-50 transition-colors">
        <Avatar size={29} className="flex-shrink-0 text-sm uppercase" style={{ background: mainPrimaryColor, color: '#fff' }}>
          J
        </Avatar>
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-medium text-[12.5px] truncate max-w-[140px] text-gray-800">John Doe</span>
            <span className="text-[11px] truncate max-w-[140px] text-gray-500">Demo Company</span>
          </div>
          <Icons.CustomerServiceOutlined style={{ fontSize: 17, color: '#6b7280' }} />
        </div>
      </div>

      <style>{`
        .ds-sidebar-preview .ant-menu-light .ant-menu-item,
        .ds-sidebar-preview .ant-menu-light .ant-menu-submenu-title {
          height: 34px !important;
          line-height: 34px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          color: #1e293b !important;
          font-weight: 500 !important;
          font-size: 13px !important;
          border-radius: 5px !important;
          margin: 1px 4px !important;
          width: calc(100% - 8px) !important;
        }
        .ds-sidebar-preview .ant-menu-light .ant-menu-item-selected {
          background-color: ${mainPrimaryColor} !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .ds-sidebar-preview .ant-menu-light .ant-menu-item:not(.ant-menu-item-selected):hover,
        .ds-sidebar-preview .ant-menu-light .ant-menu-submenu-title:not(.ant-menu-submenu-selected > .ant-menu-submenu-title):hover {
          background-color: ${mainPrimaryColor}12 !important;
          color: ${mainPrimaryColor} !important;
        }
        .ds-sidebar-preview .ant-menu-light .ant-menu-item-selected:hover {
          background-color: ${mainPrimaryColor} !important;
          color: #ffffff !important;
        }
        .ds-sidebar-preview .ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: ${mainPrimaryColor} !important;
          background-color: ${mainPrimaryColor}12 !important;
          font-weight: 600 !important;
        }
        .ds-sidebar-preview .ant-menu-light .ant-menu-item-selected .anticon {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

const NAV_GROUPS = [
  { title: 'General', items: [{ key: 'typography', label: 'Typography' }] },
  { title: 'Actions', items: [{ key: 'button', label: 'CustomButton' }] },
  {
    title: 'Form',
    items: [
      { key: 'input', label: 'CustomInput' },
      { key: 'select', label: 'FilterInput' },
      { key: 'checkbox', label: 'Checkbox' },
      { key: 'radio', label: 'Radio' },
      { key: 'switch', label: 'Switch' },
      { key: 'upload', label: 'CustomFileUpload' },
      { key: 'form', label: 'CustomForm' },
    ],
  },
  {
    title: 'Data Display',
    items: [
      { key: 'tag', label: 'Tag & StatusBadge' },
      { key: 'badge', label: 'Badge' },
      { key: 'avatar', label: 'Avatar' },
      { key: 'tooltip', label: 'Tooltip' },
      { key: 'popover', label: 'Popover' },
      { key: 'table', label: 'CustomTable' },
      { key: 'collapse', label: 'Collapse' },
      { key: 'skeleton', label: 'DetailPageSkeleton' },
    ],
  },
  {
    title: 'Feedback',
    items: [
      { key: 'alert', label: 'Alert' },
      { key: 'app', label: 'App' },
      { key: 'modal', label: 'CustomModal' },
      { key: 'drawer', label: 'BreakdownDrawer' },
      { key: 'popconfirm', label: 'StatusConfirmPopover' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { key: 'tabs', label: 'Tabs' },
      { key: 'dropdown', label: 'Dropdown' },
      { key: 'menu', label: 'Sidebar' },
      { key: 'steps', label: 'Stepper' },
    ],
  },
];

const SECTION_IDS = NAV_GROUPS.flatMap(g => g.items.map(i => i.key));

const DsCategoryHeader = ({ title }) => (
  <div className="flex items-center gap-3 mb-6 mt-4 first:mt-0">
    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748b] whitespace-nowrap">{title}</h3>
    <div className="flex-1 h-px bg-[#e9eaec]" />
  </div>
);

const DsPreview = ({ children, className = '' }) => <div className={`rounded-md border border-[#eef2f6] bg-[#f8fafc] p-4 ${className}`}>{children}</div>;

const DsSection = ({ id, title, description, children, flush = false }) => (
  <section id={id} className="mb-8 scroll-mt-36">
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h2 className="text-[15px] font-semibold text-heading">{title}</h2>
        <code className="text-[10px] font-mono text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#e2e8f0]">{id}</code>
      </div>
      {description ? <p className="text-[13px] text-[#64748b] leading-relaxed">{description}</p> : null}
    </div>
    <div className={`bg-white rounded-lg border border-[#e9eaec] shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${flush ? 'overflow-hidden' : 'p-5'}`}>
      {flush ? children : <DsPreview>{children}</DsPreview>}
    </div>
  </section>
);

const DsLabel = ({ children }) => <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[0.08em] mb-3">{children}</p>;

const DsNav = ({ groups, activeSection, onNavigate, search, onSearchChange }) => (
  <nav className="rounded-lg border border-[#e9eaec] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
    <Input allowClear placeholder="Search components..." prefix={<Icons.SearchOutlined className="text-gray-400" />} value={search} onChange={e => onSearchChange(e.target.value)} className="mb-3" />
    <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
      {groups.map(group => (
        <div key={group.title}>
          <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.12em] mb-1.5 px-2">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map(item => {
              const isActive = activeSection === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.key)}
                    className="w-full text-left text-[13px] px-2.5 py-1.5 rounded-md transition-all border-l-2"
                    style={{
                      borderLeftColor: isActive ? colorPalette.primary[500] : 'transparent',
                      backgroundColor: isActive ? `${colorPalette.primary[500]}14` : 'transparent',
                      color: isActive ? colorPalette.primary[600] : '#475569',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  </nav>
);

const DesignSystem = () => {
  const tableContainerRef = useRef(null);
  const [activeSection, setActiveSection] = useState('typography');
  const [formDemo, setFormDemo] = useState({
    text: '',
    password: '',
    textarea: '',
    category: null,
    agree: true,
    radioOption: 'a',
    upload: null,
  });
  const [filterSearch, setFilterSearch] = useState({ search: '' });
  const [filterSelect, setFilterSelect] = useState({ status: undefined });
  const [filterSwitch, setFilterSwitch] = useState({ showInactive: true });
  const [selectedPreset, setSelectedPreset] = useState('last7Days');
  const [dateRange, setDateRange] = useState(() => getPresetDateRange('last7Days'));
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTabKey, setDrawerTabKey] = useState('1');
  const [sidebarSelectedKeys, setSidebarSelectedKeys] = useState(['dashboard']);
  const [sidebarOpenKeys, setSidebarOpenKeys] = useState(['sales']);
  const [navSearch, setNavSearch] = useState('');
  const { modal } = App.useApp();

  const setFormField = (name, value) => {
    setFormDemo(prev => ({ ...prev, [name]: value }));
  };

  const filteredNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.label.toLowerCase().includes(navSearch.trim().toLowerCase())),
  })).filter(group => group.items.length > 0);

  useEffect(() => {
    const observers = SECTION_IDS.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const handleNavigate = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const handleTablePaginationChange = (page, pageSize) => {
    setTablePage(page);
    setTablePageSize(pageSize);
  };

  const paginatedTableData = allTableData.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  return (
    <Layout className="min-h-screen bg-[#f4f5fa]">
      <header className="sticky top-0 z-30 bg-white border-b border-[#e9eaec] shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="h-[3px]" style={{ backgroundColor: colorPalette.primary[500] }} />
        <div className="max-w-7xl mx-auto w-full px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Title level={2} className="!mb-1 !text-heading !text-[22px]">
                ABSS BOOKS Design System
              </Title>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:hidden sticky top-[89px] z-20 bg-[#f4f5fa] border-b border-[#e9eaec] px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {SECTION_IDS.map(id => {
            const item = NAV_GROUPS.flatMap(g => g.items).find(i => i.key === id);
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavigate(id)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: isActive ? colorPalette.primary[500] : '#e2e8f0',
                  backgroundColor: isActive ? `${colorPalette.primary[500]}14` : '#ffffff',
                  color: isActive ? colorPalette.primary[600] : '#64748b',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item?.label || id}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28">
              <DsNav groups={filteredNavGroups} activeSection={activeSection} onNavigate={handleNavigate} search={navSearch} onSearchChange={setNavSearch} />
            </div>
          </aside>

          <main className="flex-1 min-w-0 pb-12">
            <DsCategoryHeader title="General" />
            <DsSection id="typography" title="Typography" description="Used in Header, Sidebar, and Usage pages.">
              <div className="space-y-6">
                <div>
                  <DsLabel>Headings</DsLabel>
                  <div className="space-y-3">
                    <Title level={2} className="!mb-0">
                      Heading 2
                    </Title>
                    <Title level={3} className="!mb-0">
                      Heading 3
                    </Title>
                    <Title level={4} className="!mb-0">
                      Heading 4
                    </Title>
                    <Title level={5} className="!mb-0">
                      Heading 5
                    </Title>
                  </div>
                </div>
                <div>
                  <DsLabel>Body Text</DsLabel>
                  <Paragraph className="!mb-2">Regular body text</Paragraph>
                  <Text type="secondary">Secondary text</Text>
                </div>
              </div>
            </DsSection>

            <DsCategoryHeader title="Actions" />
            <DsSection id="button" title="CustomButton" description="Project button wrapper used on list pages, forms, and modals — includes PermissionButton for access control.">
              <div className="space-y-6">
                <div>
                  <DsLabel>Types</DsLabel>
                  <Space wrap>
                    <CustomButton type="primary" text="Primary" />
                    <CustomButton type="default" text="Default" />
                    <CustomButton type="outline" text="Outline" />
                    <CustomButton type="ghost" text="Ghost" />
                    <CustomButton type="danger" text="Danger" />
                    <CustomButton type="success" text="Success" />
                  </Space>
                </div>
                <div>
                  <DsLabel>States</DsLabel>
                  <Space wrap>
                    <CustomButton type="primary" text="Loading" loading />
                    <CustomButton type="primary" text="Disabled" disabled />
                  </Space>
                </div>
                <div>
                  <DsLabel>With Icons</DsLabel>
                  <Space wrap>
                    <CustomButton type="primary" icon={<Icons.PlusCircleOutlined />} text="Add" />
                    <CustomButton type="primary" icon={<Icons.FilterOutlined />} text="Filter" className="p-[17px]" />
                    <CustomButton type="default" icon={<Icons.DownloadOutlined />} text="Export" />
                    <CustomButton type="danger" icon={<Icons.DeleteOutlined />} text="Delete" />
                    <CustomButton type="default" icon={<Icons.EditOutlined />} />
                    <CustomButton type="default" icon={<Icons.EyeOutlined />} />
                  </Space>
                </div>
                <div>
                  <DsLabel>PermissionButton</DsLabel>
                  <Space wrap>
                    <PermissionButton type="primary" text="Allowed" canAccess />
                    <PermissionButton type="primary" text="No Permission" canAccess={false} />
                    <PermissionButton type="primary" text="View Only" isViewOnly />
                  </Space>
                </div>
              </div>
            </DsSection>

            <DsCategoryHeader title="Form Controls" />
            <DsSection id="input" title="CustomInput & FilterInput" description="CustomInput for add/edit forms; FilterInput search and CustomDatePicker for list page filters.">
              <div className="space-y-5 max-w-xl">
                <div>
                  <DsLabel>Filter Search</DsLabel>
                  <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filterSearch?.search} setFilter={setFilterSearch} />
                </div>
                <div>
                  <CustomDatePicker label="Date Range" selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <div className="space-y-3">
                  <DsLabel>CustomInput Fields</DsLabel>
                  <CustomInput name="text" label="Text" placeholder="Enter text" value={formDemo.text} setFieldValue={setFormField} />
                  <CustomInput name="password" label="Password" type="password" placeholder="Password" value={formDemo.password} setFieldValue={setFormField} />
                  <CustomInput name="textarea" label="Text Area" type="textarea" placeholder="Text area" value={formDemo.textarea} setFieldValue={setFormField} rows={3} />
                </div>
              </div>
            </DsSection>

            <DsSection id="select" title="FilterInput (Select)" description="Filter dropdown used on list pages — same styling as form selects.">
              <div className="max-w-xs">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="status"
                  label="Status"
                  placeHolder="Select status"
                  selectionOptions={selectOptions}
                  value={filterSelect?.status}
                  setFilter={setFilterSelect}
                  allowClear
                />
              </div>
            </DsSection>

            <DsSection id="checkbox" title="CustomInput (Checkbox)" description="Used in settings, inventory data, and role forms.">
              <CustomInput name="agree" type="checkbox" CheckboxName="I agree to the terms" value={formDemo.agree} setFieldValue={setFormField} />
            </DsSection>

            <DsSection id="radio" title="CustomInput (Radio)" description="Used in code config modal and form inputs.">
              <CustomInput
                name="radioOption"
                type="radio"
                radioOptions={[
                  { value: 'a', label: 'Option A' },
                  { value: 'b', label: 'Option B' },
                ]}
                value={formDemo.radioOption}
                setFieldValue={setFormField}
              />
            </DsSection>

            <DsSection id="switch" title="FilterInput (Switch)" description="Used in filters and settings toggles.">
              <FilterInput type={filterInputEnum?.SWITCH} name="showInactive" label="Show Inactive" value={filterSwitch?.showInactive} setFilter={setFilterSwitch} />
            </DsSection>

            <DsSection id="upload" title="CustomFileUpload" description="Used in bulk imports, attachments, and payment proofs.">
              <div className="max-w-md">
                <CustomFileUpload name="upload" label="Attachment" fileType="all" value={formDemo.upload} setFieldValue={setFormField} compact />
              </div>
            </DsSection>

            <DsSection
              id="form"
              title="CustomForm"
              description={`Form wrapper used across add/edit pages — prevents Enter submit and wraps Ant Design Form. Submit via onClick={handleSubmit} on the button; don't combine it with htmlType="submit" (causes a double submit).`}
            >
              <CustomForm name="designSystemForm" layout="vertical" className="max-w-md" onFinish={() => {}}>
                <CustomInput className="mb-3" name="text" label="Name" placeholder="Enter name" required value={formDemo.text} setFieldValue={setFormField} />
                <CustomInput name="category" label="Category" type="select" placeholder="Select category" selectOptions={selectOptions} value={formDemo.category} setFieldValue={setFormField} />
                <CustomButton type="primary" text="Submit" onClick={() => {}} />
              </CustomForm>
            </DsSection>

            <DsCategoryHeader title="Data Display" />
            <DsSection id="tag" title="Tag & StatusBadge" description="Tag for Code# columns; StatusBadge for status columns in tables and detail views.">
              <div className="space-y-5">
                <div>
                  <DsLabel>Code Tag</DsLabel>
                  <Tag className="font-semibold">BR-001</Tag>
                </div>
                <div>
                  <DsLabel>StatusBadge</DsLabel>
                  <Space wrap>
                    <StatusBadge status={true} value="Active" />
                    <StatusBadge status={false} value="Inactive" />
                    <StatusBadge status="PENDING" value="Pending" />
                    <StatusBadge status="DRAFT" value="Draft" />
                    <StatusBadge status="APPROVED" value="Approved" />
                    <StatusBadge status="CANCELLED" value="Cancelled" />
                  </Space>
                </div>
              </div>
            </DsSection>

            <DsSection id="badge" title="Badge" description="Used in header, filters, and sidebar.">
              <Space size="large" wrap>
                <Badge count={5}>
                  <Avatar shape="square" icon={<Icons.BellOutlined />} />
                </Badge>
                <Badge count={0} showZero color={colorPalette.primary[500]}>
                  <CustomButton type="default" text="Filters" />
                </Badge>
                <Badge dot>
                  <Avatar icon={<Icons.UserOutlined />} />
                </Badge>
              </Space>
            </DsSection>

            <DsSection id="avatar" title="Avatar" description="Used in Header and Sidebar.">
              <Space size="large" wrap>
                <Avatar icon={<Icons.UserOutlined />} />
                <Avatar style={{ backgroundColor: colorPalette.primary[500] }}>AB</Avatar>
              </Space>
            </DsSection>

            <DsSection id="tooltip" title="Tooltip" description="Used on table icons, buttons, and form fields.">
              <Tooltip title="Tooltip text">
                <span>
                  <CustomButton type="default" text="Hover me" />
                </span>
              </Tooltip>
            </DsSection>

            <DsSection id="popover" title="Popover" description="Used in bill columns, analytics, and address cards.">
              <Popover content="Popover content" title="Popover Title">
                <span>
                  <CustomButton type="default" text="Click for Popover" />
                </span>
              </Popover>
            </DsSection>

            <DsSection id="table" title="CustomTable" description="Project table with pagination, Code# Tag, StatusBadge, and view/edit/delete actions — same as list pages." flush>
              <div ref={tableContainerRef} className="border-t border-[#e9eaec]">
                <CustomTable
                  columns={tableColumns}
                  data={paginatedTableData}
                  tableId="id"
                  dynamicScrollY={false}
                  isPaginationFixed={false}
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    current: tablePage,
                    pageSize: tablePageSize,
                    total: allTableData.length,
                    onChange: handleTablePaginationChange,
                  }}
                  columnActions={() => ({
                    title: 'Action',
                    key: 'action',
                    fixed: 'right',
                    width: 120,
                    render: () => (
                      <div className="flex items-center gap-3">
                        <Tooltip title="View" getPopupContainer={() => tableContainerRef.current || document.body}>
                          <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} />
                        </Tooltip>
                        <Tooltip title="Edit" getPopupContainer={() => tableContainerRef.current || document.body}>
                          <Icons.EditOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} />
                        </Tooltip>
                        <Popconfirm
                          title="Delete Item"
                          description="Are you sure you want to delete this item?"
                          okText="Yes"
                          cancelText="No"
                          getPopupContainer={() => tableContainerRef.current || document.body}
                        >
                          <Tooltip title="Delete" getPopupContainer={() => tableContainerRef.current || document.body}>
                            <Icons.DeleteOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} onClick={e => e.stopPropagation()} />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    ),
                  })}
                />
              </div>
            </DsSection>

            <DsSection id="collapse" title="Collapse" description="Used in reports, customer detail, and convert modals.">
              <Collapse
                items={[
                  { key: '1', label: 'Section 1', children: <p>Collapsible content</p> },
                  { key: '2', label: 'Section 2', children: <p>Collapsible content</p> },
                ]}
              />
            </DsSection>

            <DsSection id="skeleton" title="DetailPageSkeleton" description="Loading placeholder used on detail pages with field grid and table sections.">
              <DetailPageWithTableSkeleton fieldCount={3} tableCols={4} tableRows={3} />
            </DsSection>

            <DsCategoryHeader title="Feedback" />
            <DsSection id="alert" title="Alert" description="Used in export modals and apply-to-invoice flows.">
              <Alert message="Warning alert" type="warning" showIcon />
            </DsSection>

            <DsSection id="app" title="App" description="Used via App.useApp() for confirm modals in form dirty check.">
              <CustomButton
                type="default"
                text="App.useApp() Confirm"
                onClick={() =>
                  modal.confirm({
                    title: 'Confirm Action',
                    content: 'Are you sure you want to proceed?',
                    okButtonProps: { className: 'confirm-modal-ok-button' },
                    cancelButtonProps: { className: 'confirm-modal-cancel-button' },
                    className: 'confirm-modal-theme',
                  })
                }
              />
            </DsSection>

            <DsSection id="modal" title="CustomModal" description="Modal shell with CloseIconButton — used in add bill, purchase order, and settings.">
              <CustomButton type="primary" text="Open Modal" onClick={() => setModalOpen(true)} />
              <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title="Sample Modal">
                <p className="text-sm text-gray-600 mb-4">Modal content — same shell as add/edit modals.</p>
                <div className="flex justify-end gap-2">
                  <CustomButton type="default" text="Cancel" onClick={() => setModalOpen(false)} />
                  <CustomButton type="primary" text="Save" onClick={() => setModalOpen(false)} />
                </div>
              </CustomModal>
            </DsSection>

            <DsSection id="drawer" title="BreakdownDrawer" description="Drawer shell for drill-down views — item details, analytics breakdowns.">
              <CustomButton type="primary" text="Open Drawer" onClick={() => setDrawerOpen(true)} />
              <BreakdownDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                icon={<Icons.AppstoreOutlined style={{ fontSize: 20, color: colorPalette.primary[500] }} />}
                title="Sample Item A"
                basicDetails={[
                  { label: 'Code', value: 'BR-001' },
                  { label: 'Status', value: 'Active' },
                  { label: 'Category', value: 'Electronics' },
                ]}
                viewEntityLabel="View Details"
                onViewEntity={() => setDrawerOpen(false)}
                tabs={tabItems}
                activeTabKey={drawerTabKey}
                onTabChange={setDrawerTabKey}
                expandable
              />
            </DsSection>

            <DsSection id="popconfirm" title="StatusConfirmPopover" description="Status toggle confirmation in list page action dropdowns — warehouses, divisions, production.">
              <div className="inline-block bg-white shadow-lg rounded-lg border border-gray-200 w-56 py-1">
                <div className="px-2 py-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                </div>
                <StatusConfirmPopover
                  isActive
                  onConfirm={() => Promise.resolve()}
                  label="Mark as Inactive"
                  icon={<Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />}
                  confirmMessage="Are you sure you want to mark this item as inactive?"
                />
                <StatusConfirmPopover
                  isActive={false}
                  onConfirm={() => Promise.resolve()}
                  label="Mark as Active"
                  icon={<Icons.CheckCircleOutlined className="text-green-700" style={{ fontSize: 14 }} />}
                  confirmMessage="Are you sure you want to mark this item as active?"
                />
              </div>
            </DsSection>

            <DsCategoryHeader title="Navigation" />
            <DsSection id="tabs" title="Tabs" description="Used on detail pages, settings, and report views.">
              <Tabs items={tabItems} />
            </DsSection>

            <DsSection id="dropdown" title="Dropdown" description="Used in list page toolbars and row actions — with app-toolbar-dropdown class.">
              <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
                <CustomButton type="default" icon={<Icons.EllipsisOutlined />} text="Actions" />
              </Dropdown>
            </DsSection>

            <DsSection id="menu" title="Sidebar Menu" description="Same layout as AppSidebar — logo, menu, help strip, and user profile." flush>
              <div className="p-5 bg-[#f8fafc]">
                <SidebarPreview selectedKeys={sidebarSelectedKeys} openKeys={sidebarOpenKeys} onOpenChange={setSidebarOpenKeys} onMenuClick={({ key }) => setSidebarSelectedKeys([key])} />
              </div>
            </DsSection>

            <DsSection id="steps" title="Stepper" description="Project wrapper around Steps — used in bulk upload flows.">
              <Stepper current={1} steps={stepItems} />
            </DsSection>
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default DesignSystem;
