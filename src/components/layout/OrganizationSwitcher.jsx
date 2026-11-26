import { useEffect, useState } from 'react';
import { Button, Dropdown } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { authService } from '@/features/auth/authService';

const OrganizationList = ({ organizations, selected, onSelect, companyId }) => (
  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
    {organizations.map(org => {
      const isCurrent = String(org.companyId) === String(companyId);
      const inputId = `books-organization-${org.companyId}`;
      const showRole = org.roleLabel && String(org.roleLabel).toLowerCase() !== 'owner';

      return (
        <label
          key={org.companyId}
          htmlFor={inputId}
          className={`flex items-center gap-2 py-2 px-3 rounded-md border border-gray-200 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-[#E6F4FA] ${isCurrent ? ' opacity-50 cursor-not-allowed pointer-events-none bg-gray-50' : ''}`}
        >
          <input
            id={inputId}
            type="radio"
            name="books-organization"
            className="sr-only"
            aria-label={`${org.name}, ${org.roleLabel}`}
            checked={String(selected) === String(org.companyId)}
            disabled={isCurrent}
            onChange={() => onSelect(org.companyId)}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-gray-800 truncate leading-tight">{org.name}</div>
            <div className="text-[11px] text-gray-500 leading-tight">
              {' '}
              {showRole ? 'Role: ' : ''} {org.roleLabel}
            </div>
          </div>
        </label>
      );
    })}
  </div>
);

const OrganizationSwitcher = ({ companyId, companyName }) => {
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selected, setSelected] = useState(companyId || '');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setSelected(companyId || '');
  }, [companyId]);

  useEffect(() => {
    authService
      .getOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || organizations.length <= 1) {
    return null;
  }

  const currentName = organizations.find(org => String(org.companyId) === String(companyId))?.name || companyName;

  const handleSwitch = async () => {
    if (!selected || String(selected) === String(companyId)) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await authService.switchOrganization(selected);
      window.location.reload();
    } finally {
      setSwitching(false);
    }
  };

  const dropdownContent = (
    <div className="w-[260px] bg-white rounded-lg border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-2.5">
      <p className="text-[13px] font-medium text-gray-800 mb-1.5">Switch account</p>
      {loading ? <p className="text-xs text-gray-500 py-1">Loading...</p> : <OrganizationList organizations={organizations} selected={selected} onSelect={setSelected} companyId={companyId} />}
      <Button type="primary" block size="small" className="!mt-2" loading={switching} disabled={!selected || String(selected) === String(companyId)} onClick={handleSwitch}>
        Switch
      </Button>
    </div>
  );

  return (
    <Dropdown open={open} onOpenChange={setOpen} trigger={['click']} placement="bottomRight" dropdownRender={() => dropdownContent}>
      <Button size="small" className="!h-8 !px-2.5 flex items-center gap-1.5 max-w-[180px] sm:max-w-[220px] border border-gray-200">
        <Icons.SwapOutlined style={{ fontSize: 13, color: colorPalette.primary[500] }} />
        <span className="truncate font-medium text-[12px] sm:text-[13px]">{currentName || 'Organization'}</span>
        <Icons.DownOutlined style={{ fontSize: 10, color: colorPalette.neutral[400] }} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
    </Dropdown>
  );
};

export default OrganizationSwitcher;
