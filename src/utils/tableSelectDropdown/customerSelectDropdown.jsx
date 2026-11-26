import { Space } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { formatAmount } from '@/utils/currency';

export const customerSelectDropdownProps = {
  popupMatchSelectWidth: false,
  selectPopupClassName: 'item-select-dropdown-popup--customer',
  selectPopupClassNameWithBalance: 'item-select-dropdown-popup--customer-with-balance',
  selectPopupClassNameWithRole: 'item-select-dropdown-popup--customer-with-role',
};

export const customerSelectColumnHeader = { id: 'Customer ID', name: 'Customer Name' };
export const vendorSelectColumnHeader = { id: 'Vendor ID', name: 'Vendor Name' };

export const renderCustomerRoleContent = role => {
  if (!role?.isCustomer && !role?.isVendor) return null;

  return (
    <Space size={8}>
      {!!role?.isCustomer && <StatusBadge value="Customer" accentHex="#2563EB" />}
      {!!role?.isVendor && <StatusBadge value="Vendor" accentHex="#F59E0B" />}
    </Space>
  );
};

const resolveBranchId = branchRef => {
  if (branchRef == null || branchRef === '') return null;
  if (typeof branchRef === 'object') return branchRef?.id ?? branchRef?._id ?? null;
  return branchRef;
};

export const getBranchCurrentBalance = (option, branchId) => {
  const resolvedBranchId = resolveBranchId(branchId);
  if (!resolvedBranchId) return null;

  if (option?.branchCurrentBalance !== undefined && option?.branchCurrentBalance !== null) {
    return Number(option.branchCurrentBalance) || 0;
  }

  if (option?.currentBalance !== undefined && option?.currentBalance !== null) {
    return Number(option.currentBalance) || 0;
  }

  const branchData = (option?.branch || []).find(b => {
    const optionBranchId = resolveBranchId(b?.branchId);
    return optionBranchId != null && String(optionBranchId) === String(resolvedBranchId);
  });

  return branchData?.currentBalance ?? 0;
};

export const buildCustomerSelectOptions = (customerDropDownList, branchId) => {
  const resolvedBranchId = resolveBranchId(branchId);
  const showBalance = Boolean(resolvedBranchId);

  return (customerDropDownList || []).map(option => {
    const customerId = option?.customerNumber || '-';
    const customerName = option?.customerDisplayName || option?.name || option?.companyName || option?.personName || '-';
    const balance = showBalance ? getBranchCurrentBalance(option, resolvedBranchId) : null;

    return {
      value: option.id ?? option._id,
      label: customerName,
      columnId: customerId,
      columnName: customerName,
      ...(showBalance
        ? {
            hasBalanceColumn: true,
            columnBalance: formatAmount(balance ?? 0, true, option?.currency),
          }
        : {}),
      searchLabel: `${customerId} ${customerName}`.replace(/\s+/g, ' ').trim(),
    };
  });
};

// A plain Ledger party (e.g. "Salary") — same option shape as buildCustomerSelectOptions so the
// two lists can sit in one dropdown together.
export const buildLedgerSelectOptions = ledgerDropDownList =>
  (ledgerDropDownList || []).map(option => {
    const ledgerId = option?.businessAccountLedgerMasterId || '-';
    const ledgerName = option?.personName || '-';

    return {
      value: option.id ?? option._id,
      label: ledgerName,
      columnId: ledgerId,
      columnName: ledgerName,
      searchLabel: `${ledgerId} ${ledgerName}`.replace(/\s+/g, ' ').trim(),
    };
  });

export const buildCustomerSelectOptionsWithRole = (customerDropDownList, branchId) =>
  buildCustomerSelectOptions(customerDropDownList, branchId).map(opt => {
    const source = (customerDropDownList || []).find(c => c.id === opt.value);
    const columnRole = renderCustomerRoleContent(source?.Role);

    return {
      ...opt,
      hasRoleColumn: true,
      columnRole,
    };
  });
