import { formatAmount } from '@/utils/currency';

export const flattenAccountRows = (accountDrop, collapsedIds) => {
  const rows = [];

  const pushAccount = (account, indentLevel, isLastChild, group) => {
    const { children: rawChildren, ...rest } = account;
    const children = rawChildren || [];
    const hasChildren = children.length > 0;
    const isExpanded = hasChildren && !collapsedIds.has(account.id);

    rows.push({
      ...rest,
      category: group?.category ?? null,
      categoryDisplayName: group?.displayName ?? null,
      accountType: group?.accountType ?? null,
      indentLevel,
      isLastChild,
      hasChildren,
      isExpanded,
      childrenCount: children.length,
    });

    if (isExpanded) {
      children.forEach((child, index) => {
        pushAccount(child, indentLevel + 1, index === children.length - 1, group);
      });
    }
  };

  (accountDrop || []).forEach(group => {
    (group.accounts || []).forEach(account => pushAccount(account, 0, true, group));
  });

  return rows;
};

/** Fully expands the account tree for export (ignores UI collapse state). */
export const flattenAccountsForExport = accountDrop => {
  const rows = [];

  const walk = (accounts, indentLevel, group) => {
    for (const account of accounts || []) {
      const { children: rawChildren, ...rest } = account;
      const children = rawChildren || [];

      rows.push({
        ...rest,
        category: group?.category ?? null,
        categoryDisplayName: group?.displayName ?? null,
        accountType: group?.accountType ?? null,
        indentLevel,
        hasChildren: children.length > 0,
        childrenCount: children.length,
      });

      walk(children, indentLevel + 1, group);
    }
  };

  (accountDrop || []).forEach(group => walk(group.accounts, 0, group));
  return rows;
};

export const formatAccountBalanceLabel = (balance, isDebit) => {
  const amount = Number(balance) || 0;
  const side = isDebit ? 'Dr' : 'Cr';
  return `${formatAmount(amount)} ${side}`;
};

export const indentAccountName = (accountName, indentLevel = 0) => `${'  '.repeat(Math.max(0, indentLevel))}${accountName || ''}`;
