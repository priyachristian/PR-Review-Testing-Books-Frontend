import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Alert, Button, DatePicker, Dropdown, Space, Spin, Table } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';

// Hooks
import { useProfile } from '@/features/setting/profile/useProfile';
import { useReport } from '@/features/reports/useReport';

// Extras
import Icons from '@/assets/icons/icon';
import { filteredURLParams } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { profitAndLossTableColumns } from '../../../utils/tableColumns';

const formatDateDisplay = dateStr => (dateStr ? dayjs(dateStr).format('DD/MM/YYYY') : '');
const getFinancialYearDates = () => {
  const today = dayjs();
  const year = today.year();
  const startYear = today.month() >= 3 ? year : year - 1;
  return {
    startDate: dayjs(`${startYear}-04-01`).format('YYYY-MM-DD'),
    endDate: dayjs(`${startYear + 1}-03-31`).format('YYYY-MM-DD'),
  };
};

const FINANCIAL_YEAR_DEFAULT = getFinancialYearDates();

const deriveSheetTotals = sheet => {
  if (!sheet) return null;

  const sum = arr => (arr || []).reduce((s, i) => s + (Number(i?.amount) || 0), 0);

  const purchaseTotal = sum(sheet.purchaseAccounts);
  const directExpTotal = sum(sheet.directExpenses);
  const salesTotal = sum(sheet.salesAccounts);
  const directIncTotal = sum(sheet.directIncomes);
  const indirectExpTotal = sum(sheet.indirectExpenses);
  const indirectIncTotal = sum(sheet.indirectIncomes);
  const openingStock = Number(sheet.summary?.totalOpeningStockAmount) || 0;
  const closingStock = Number(sheet.summary?.totalClosingStockAmount) || 0;
  const grossProfit = salesTotal + directIncTotal + closingStock - openingStock - purchaseTotal - directExpTotal;
  const totalTradingLeft = openingStock + purchaseTotal + directExpTotal + grossProfit;
  const netProfit = grossProfit - indirectExpTotal + indirectIncTotal;
  const totalRightFinal = grossProfit + indirectIncTotal;

  return {
    openingStock,
    closingStock,
    purchaseTotal,
    directExpTotal,
    salesTotal,
    directIncTotal,
    indirectExpTotal,
    indirectIncTotal,
    grossProfit,
    totalTradingLeft,
    netProfit,
    totalRightFinal,
  };
};

const buildSectionRows = (items, baseKeyPrefix, depth = 0) => {
  if (!items?.length) return [];
  return items.map((item, idx) => {
    const parentBaseKey = depth === 0 ? `${baseKeyPrefix}-${idx}` : baseKeyPrefix;
    const key = `${parentBaseKey}-${item.accountId ?? depth}-${item.accountName}`;
    const row = {
      key,
      accountName: item.accountName,
      amount: item.amount ?? 0,
      isDeduction: (item.accountName || '').toLowerCase().includes('less'),
      depth,
    };
    if (item.children?.length) {
      row.children = buildSectionRows(item.children, key, depth + 1);
    }
    return row;
  });
};

const ViewProfitAndLossReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [filter, setFilter] = useState({
    startDate: searchParams.get('startDate') || FINANCIAL_YEAR_DEFAULT.startDate,
    endDate: searchParams.get('endDate') || FINANCIAL_YEAR_DEFAULT.endDate,
  });
  const { profile, getProfile } = useProfile();
  const { profitLossSheet, profitLossSheetLoading, profitLossSheetError, getProfitLossSheet, clearProfitLossSheet } = useReport();
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    if (start && end) setFilter({ startDate: start, endDate: end });
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const startDate = searchParams.get('startDate') || FINANCIAL_YEAR_DEFAULT.startDate;
    const endDate = searchParams.get('endDate') || FINANCIAL_YEAR_DEFAULT.endDate;
    getProfitLossSheet({ startDate, endDate, signal: controller.signal });
    return () => {
      controller.abort();
      clearProfitLossSheet();
    };
  }, [searchParams, getProfitLossSheet, clearProfitLossSheet]);

  const updateUrlParams = useCallback(
    newParams => {
      setSearchParams(prev => filteredURLParams(new URLSearchParams(prev), newParams));
    },
    [setSearchParams]
  );

  const handleApplyFilter = useCallback(() => {
    setShowFilter(false);
    updateUrlParams({ startDate: filter.startDate, endDate: filter.endDate });
  }, [filter, updateUrlParams]);

  const handleResetFilters = useCallback(() => {
    setFilter(FINANCIAL_YEAR_DEFAULT);
    setShowFilter(true);
    updateUrlParams(FINANCIAL_YEAR_DEFAULT);
  }, [updateUrlParams]);

  const handleDateChange = useCallback(
    field => date => {
      setFilter(prev => ({
        ...prev,
        [field]: date ? date.format('YYYY-MM-DD') : FINANCIAL_YEAR_DEFAULT[field],
      }));
    },
    []
  );

  const allExpandableKeys = useMemo(() => {
    const sheet = profitLossSheet;
    if (!sheet) return [];
    const keys = [];
    const collectKeys = (items, baseKey, depth = 0) => {
      (items || []).forEach((item, idx) => {
        const parentBaseKey = depth === 0 ? `${baseKey}-${idx}` : baseKey;
        const itemKey = `${parentBaseKey}-${item.accountId ?? depth}-${item.accountName}`;
        if (item.children?.length > 0) {
          keys.push(itemKey);
          collectKeys(item.children, itemKey, depth + 1);
        }
      });
    };
    [
      ['purchase', sheet.purchaseAccounts],
      ['directExp', sheet.directExpenses],
      ['sales', sheet.salesAccounts],
      ['directInc', sheet.directIncomes],
      ['indirectExp', sheet.indirectExpenses],
      ['indirectInc', sheet.indirectIncomes],
    ].forEach(([sectionKey, items]) => collectKeys(items || [], sectionKey));
    return keys;
  }, [profitLossSheet]);

  const prevSheetRef = React.useRef(null);
  useEffect(() => {
    if (!profitLossSheet || allExpandableKeys.length === 0) return;
    if (prevSheetRef.current !== profitLossSheet) {
      prevSheetRef.current = profitLossSheet;
      setExpandedKeys([...allExpandableKeys]);
    }
  }, [profitLossSheet, allExpandableKeys]);

  const expandAll = useCallback(() => {
    setExpandedKeys([...allExpandableKeys]);
  }, [allExpandableKeys]);

  const collapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  const isAllExpanded = allExpandableKeys.length > 0 && expandedKeys.length >= allExpandableKeys.length;

  const toggleExpandCollapseAll = useCallback(() => {
    if (isAllExpanded) collapseAll();
    else expandAll();
  }, [isAllExpanded, expandAll, collapseAll]);

  const totals = useMemo(() => deriveSheetTotals(profitLossSheet), [profitLossSheet]);

  const leftTradingDataSource = useMemo(() => {
    if (!profitLossSheet || !totals) return [];
    const opening = {
      key: 'left-trading-opening',
      accountName: 'Opening Stock',
      amount: totals.openingStock,
      depth: 0,
      isDeduction: false,
    };
    const purchase = buildSectionRows(profitLossSheet.purchaseAccounts || [], 'purchase');
    const directExp = buildSectionRows(profitLossSheet.directExpenses || [], 'directExp');
    const gross = {
      key: 'left-trading-gross',
      accountName: 'Gross Profit',
      amount: totals.grossProfit,
      depth: 0,
      isDeduction: false,
    };
    return [opening, ...purchase, ...directExp, gross];
  }, [profitLossSheet, totals]);

  const rightTradingDataSource = useMemo(() => {
    if (!profitLossSheet || !totals) return [];
    const sales = buildSectionRows(profitLossSheet.salesAccounts || [], 'sales');
    const directInc = buildSectionRows(profitLossSheet.directIncomes || [], 'directInc');
    const closing = {
      key: 'right-trading-closing',
      accountName: 'Closing Stock',
      amount: totals.closingStock,
      depth: 0,
      isDeduction: false,
    };
    const empty = {
      key: 'right-trading-empty',
      accountName: '\u00A0',
      amount: 0,
      depth: 0,
      isDeduction: false,
    };
    return [...sales, ...directInc, closing, empty];
  }, [profitLossSheet, totals]);

  const leftPlDataSource = useMemo(() => {
    if (!profitLossSheet || !totals) return [];
    const indirectExp = buildSectionRows(profitLossSheet.indirectExpenses || [], 'indirectExp');
    const net = {
      key: 'left-pl-net',
      accountName: 'Net Profit',
      amount: totals.netProfit,
      depth: 0,
      isDeduction: false,
    };
    return [...indirectExp, net];
  }, [profitLossSheet, totals]);

  const rightPlDataSource = useMemo(() => {
    if (!profitLossSheet || !totals) return [];
    const grossBf = {
      key: 'right-pl-gross-bf',
      accountName: 'Gross Profit',
      amount: totals.grossProfit,
      depth: 0,
      isDeduction: false,
    };
    const indirectInc = buildSectionRows(profitLossSheet.indirectIncomes || [], 'indirectInc');
    return [grossBf, ...indirectInc];
  }, [profitLossSheet, totals]);

  const expandableConfig = useMemo(
    () => ({
      expandedRowKeys: expandedKeys,
      onExpandedRowsChange: setExpandedKeys,
    }),
    [expandedKeys]
  );

  const periodStr = useMemo(() => {
    if (!filter.startDate || !filter.endDate) return '';
    return `${dayjs(filter.startDate).format('D-MMM-YY')} to ${dayjs(filter.endDate).format('D-MMM-YY')}`;
  }, [filter.startDate, filter.endDate]);

  const dateRangeLabel = useMemo(
    () => (filter.startDate && filter.endDate ? `From ${formatDateDisplay(filter.startDate)} To ${formatDateDisplay(filter.endDate)}` : ''),
    [filter.startDate, filter.endDate]
  );

  const buildPdfAbss = useCallback(() => {
    if (!profitLossSheet || !totals) return null;
    const data = profitLossSheet;
    const toPdfAccount = item => ({
      name: item.accountName || '',
      total: item.amount ?? 0,
      amount: item.amount ?? 0,
      isDeduction: (item.accountName || '').toLowerCase().includes('less'),
      children: (item.children || []).map(toPdfAccount),
    });
    return {
      tradingAccount: {
        left: {
          openingStock: { name: 'Opening Stock', total: totals.openingStock, children: [] },
          purchaseAccounts: {
            name: 'Purchase Accounts',
            total: totals.purchaseTotal,
            children: (data.purchaseAccounts || []).map(toPdfAccount),
          },
          directExpenses: {
            name: 'Direct Expenses',
            total: totals.directExpTotal,
            children: (data.directExpenses || []).map(toPdfAccount),
          },
          grossProfitCO: totals.grossProfit > 0 ? totals.grossProfit : 0,
          grossLossCO: totals.grossProfit < 0 ? Math.abs(totals.grossProfit) : 0,
        },
        right: {
          salesAccounts: {
            name: 'Sales Accounts',
            total: totals.salesTotal,
            children: (data.salesAccounts || []).map(toPdfAccount),
          },
          directIncomes: {
            name: 'Direct Incomes',
            total: totals.directIncTotal,
            children: (data.directIncomes || []).map(toPdfAccount),
          },
          closingStock: { name: 'Closing Stock', total: totals.closingStock, children: [] },
          grossLossBF: totals.grossProfit < 0 ? Math.abs(totals.grossProfit) : 0,
        },
        total: totals.totalTradingLeft,
      },
      plAccount: {
        left: {
          indirectExpenses: {
            name: 'Indirect Expenses',
            total: totals.indirectExpTotal,
            children: (data.indirectExpenses || []).map(toPdfAccount),
          },
          netProfit: totals.netProfit > 0 ? totals.netProfit : 0,
          netLoss: totals.netProfit < 0 ? Math.abs(totals.netProfit) : 0,
        },
        right: {
          grossProfitBF: totals.grossProfit > 0 ? totals.grossProfit : 0,
          grossLossBF: totals.grossProfit < 0 ? Math.abs(totals.grossProfit) : 0,
          indirectIncomes: {
            name: 'Indirect Incomes',
            total: totals.indirectIncTotal,
            children: (data.indirectIncomes || []).map(toPdfAccount),
          },
          netLossBF: totals.netProfit < 0 ? Math.abs(totals.netProfit) : 0,
        },
        total: totals.totalRightFinal,
      },
    };
  }, [profitLossSheet, totals]);

  const generatePdfHtml = useCallback(
    profileForPdf => {
      if (!profitLossSheet || !totals) return '';
      const abss = buildPdfAbss();
      if (!abss) return '';

      const p = profileForPdf ?? profile;
      const companyName = p?.name || 'Company Name';
      const address = p?.address ? `${p.address.street1 || ''}, ${p.address.city || ''}, ${p.address.state || ''} - ${p.address.pinCode || ''}` : '';
      const period = periodStr || `${dayjs(filter.startDate).format('D-MMM-YY')} to ${dayjs(filter.endDate).format('D-MMM-YY')}`;

      const showZeroValues = true;
      const renderOnePdfRow = (account, level) => {
        const indent = level * 12;
        const isLeaf = !account.children || account.children.length === 0;
        const showAmount = level === 0 || isLeaf;
        const fontSize = level === 0 ? '9px' : level === 1 ? '8px' : '7px';
        const isSectionHeader = level === 0;
        const color = isSectionHeader ? '#000' : account.isDeduction || (account.amount !== undefined && account.amount < 0) ? '#dc2626' : level >= 2 ? '#666' : '#333';
        return `
        <tr>
          <td class="particulars" style="padding-left: ${indent}px; font-weight: ${isSectionHeader ? 'bold' : 'normal'}; font-size: ${fontSize}; color: ${color};">
            ${(account.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </td>
          <td class="amount" style="font-size: ${fontSize}; font-weight: ${isSectionHeader ? 'bold' : 'normal'}; color: ${color};">
            ${showAmount ? formatAmount(account.total ?? account.amount ?? 0) : ''}
          </td>
        </tr>
      `;
      };

      const renderPdfAccountHierarchy = (account, level = 0, skipChildren = false, skipParent = false, skipFirstChildLevel = false) => {
        if (!account) return '';
        if (skipParent) {
          if (account.children && account.children.length > 0) {
            return account.children
              .filter(child => showZeroValues || (child.amount !== 0 && child.amount !== undefined))
              .map(child => renderPdfAccountHierarchy(child, 0, false, false, false))
              .join('');
          }
          return '';
        }
        if (!showZeroValues && account.total === 0 && (!account.children || account.children.length === 0)) return '';

        let html = '';
        html += renderOnePdfRow(account, level);

        if (!skipChildren && account.children && account.children.length > 0) {
          if (skipFirstChildLevel) {
            account.children
              .filter(child => showZeroValues || (child.amount !== 0 && child.amount !== undefined))
              .forEach(child => {
                const grandchildren = (child.children || []).filter(gc => showZeroValues || (gc.amount !== 0 && gc.amount !== undefined));
                if (grandchildren.length > 0) {
                  grandchildren.forEach(grandchild => {
                    html += renderPdfAccountHierarchy(grandchild, level + 1, false, false, false);
                  });
                } else {
                  html += renderPdfAccountHierarchy(child, level + 1, false, false, false);
                }
              });
          } else {
            account.children
              .filter(child => showZeroValues || (child.amount !== 0 && child.amount !== undefined))
              .forEach(child => {
                html += renderPdfAccountHierarchy(child, level + 1, false, false, false);
              });
          }
        }

        return html;
      };

      const html = `
      <div class="pdf-container" style="width: 100%; font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 15px;">
        <style>
          .pdf-container * { box-sizing: border-box; margin: 0; padding: 0; }
          .pdf-container table { width: 100%; border-collapse: collapse; }
          .pdf-container th, .pdf-container td { padding: 3px 5px; vertical-align: top; }
          .header-section { text-align: center; margin-bottom: 15px; }
          .company-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
          .company-address { font-size: 9px; color: #333; margin-bottom: 8px; }
          .report-title { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
          .report-subtitle { font-size: 10px; margin-bottom: 2px; }
          .report-period { font-size: 10px; margin-bottom: 10px; }
          .main-table { border: 1px solid #000; }
          .main-table th { border-bottom: 1px solid #000; background: transparent; font-weight: bold; font-size: 9px; }
          .col-header { border-bottom: 1px solid #000; border-right: 1px solid #000; }
          .col-header:last-child { border-right: none; }
          .left-col { border-right: 1px solid #000; width: 50%; }
          .right-col { width: 50%; }
          .inner-table { width: 100%; }
          .inner-table td { padding: 2px 5px; font-size: 9px; }
          .particulars { text-align: left; }
          .amount { text-align: right; font-family: 'Courier New', monospace; white-space: nowrap; }
          .section-total { font-weight: bold; border-top: 1px solid #000; background: #f9f9f9; }
          .grand-total { font-weight: bold; border-top: 2px solid #000; background: #e5e5e5; font-size: 10px; }
          .separator-row td { border-top: 1px solid #000; height: 5px; }
          .bold { font-weight: bold; }
        </style>

        <div class="header-section">
          <div class="company-name">${(companyName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${address ? `<div class="company-address">${address.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
          <div class="report-title">Profit &amp; Loss A/c</div>
          <div class="report-subtitle">Provisional Profit and Loss</div>
          <div class="report-period">${period}</div>
        </div>

        <table class="main-table">
          <thead>
            <tr>
              <th class="col-header" style="width: 35%;">Particulars</th>
              <th class="col-header" style="width: 15%;">${period}</th>
              <th class="col-header" style="width: 35%;">Particulars</th>
              <th class="col-header" style="width: 15%; border-right: none;">${period}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2" class="left-col" style="vertical-align: top;">
                <table class="inner-table">
                  <tbody>
                    ${renderPdfAccountHierarchy(abss.tradingAccount.left.openingStock, 0, true)}
                    ${renderPdfAccountHierarchy(abss.tradingAccount.left.purchaseAccounts, 0, false, false, true)}
                    ${renderPdfAccountHierarchy(abss.tradingAccount.left.directExpenses, 0, false, false, true)}
                    ${
                      abss.tradingAccount.left.grossProfitCO > 0
                        ? `
                    <tr>
                      <td class="particulars bold">Gross Profit c/o</td>
                      <td class="amount bold">${formatAmount(abss.tradingAccount.left.grossProfitCO)}</td>
                    </tr>`
                        : ''
                    }
                    ${
                      abss.tradingAccount.left.grossLossCO > 0
                        ? `
                    <tr>
                      <td class="particulars bold" style="color: #dc2626;">Gross Loss c/o</td>
                      <td class="amount bold" style="color: #dc2626;">${formatAmount(abss.tradingAccount.left.grossLossCO)}</td>
                    </tr>`
                        : ''
                    }
                  </tbody>
                </table>
              </td>
              <td colspan="2" class="right-col" style="vertical-align: top;">
                <table class="inner-table">
                  <tbody>
                    ${renderPdfAccountHierarchy(abss.tradingAccount.right.salesAccounts, 0, false, false, true)}
                    ${renderPdfAccountHierarchy(abss.tradingAccount.right.directIncomes, 0, false, false, true)}
                    ${renderPdfAccountHierarchy(abss.tradingAccount.right.closingStock, 0, true)}
                    ${
                      abss.tradingAccount.right.grossLossBF > 0
                        ? `
                    <tr>
                      <td class="particulars bold" style="color: #dc2626;">Gross Loss b/f</td>
                      <td class="amount bold" style="color: #dc2626;">${formatAmount(abss.tradingAccount.right.grossLossBF)}</td>
                    </tr>`
                        : ''
                    }
                  </tbody>
                </table>
              </td>
            </tr>

            <tr class="section-total">
              <td class="particulars" style="border-right: 1px solid #000;"></td>
              <td class="amount" style="border-right: 1px solid #000;">${formatAmount(abss.tradingAccount.total)}</td>
              <td class="particulars"></td>
              <td class="amount">${formatAmount(abss.tradingAccount.total)}</td>
            </tr>

            <tr class="separator-row">
              <td colspan="4" style="height: 10px; border-top: 2px solid #000;"></td>
            </tr>

            <tr>
              <td colspan="2" class="left-col" style="vertical-align: top;">
                <table class="inner-table">
                  <tbody>
                    ${renderPdfAccountHierarchy(abss.plAccount.left.indirectExpenses, 0, false, false, true)}
                    ${
                      abss.plAccount.left.netProfit > 0
                        ? `
                    <tr style="margin-top: 10px;">
                      <td class="particulars bold" style="padding-top: 10px; color: #166534;">Nett Profit</td>
                      <td class="amount bold" style="padding-top: 10px; color: #166534;">${formatAmount(abss.plAccount.left.netProfit)}</td>
                    </tr>`
                        : ''
                    }
                    ${
                      abss.plAccount.left.netLoss > 0
                        ? `
                    <tr style="margin-top: 10px;">
                      <td class="particulars bold" style="padding-top: 10px; color: #dc2626;">Nett Loss</td>
                      <td class="amount bold" style="padding-top: 10px; color: #dc2626;">${formatAmount(abss.plAccount.left.netLoss)}</td>
                    </tr>`
                        : ''
                    }
                  </tbody>
                </table>
              </td>
              <td colspan="2" class="right-col" style="vertical-align: top;">
                <table class="inner-table">
                  <tbody>
                    ${
                      abss.plAccount.right.grossProfitBF > 0
                        ? `
                    <tr>
                      <td class="particulars bold">Gross Profit b/f</td>
                      <td class="amount bold">${formatAmount(abss.plAccount.right.grossProfitBF)}</td>
                    </tr>`
                        : ''
                    }
                    ${
                      abss.plAccount.right.grossLossBF > 0
                        ? `
                    <tr>
                      <td class="particulars bold" style="color: #dc2626;">Gross Loss b/f</td>
                      <td class="amount bold" style="color: #dc2626;">${formatAmount(abss.plAccount.right.grossLossBF)}</td>
                    </tr>`
                        : ''
                    }
                    ${renderPdfAccountHierarchy(abss.plAccount.right.indirectIncomes, 0, false, false, true)}
                    ${
                      abss.plAccount.right.netLossBF > 0
                        ? `
                    <tr style="margin-top: 10px;">
                      <td class="particulars bold" style="padding-top: 10px; color: #dc2626;">Nett Loss b/f</td>
                      <td class="amount bold" style="padding-top: 10px; color: #dc2626;">${formatAmount(abss.plAccount.right.netLossBF)}</td>
                    </tr>`
                        : ''
                    }
                  </tbody>
                </table>
              </td>
            </tr>

            <tr class="grand-total">
              <td class="particulars bold" style="border-right: 1px solid #000;">Total</td>
              <td class="amount" style="border-right: 1px solid #000;">${formatAmount(abss.plAccount.total)}</td>
              <td class="particulars bold">Total</td>
              <td class="amount">${formatAmount(abss.plAccount.total)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 8px; color: #666; text-align: center;">
          Report Generated: ${dayjs().format('DD-MMM-YYYY HH:mm')} | Generated by: ABSS Books
        </div>
      </div>
    `;

      return html;
    },
    [profitLossSheet, totals, profile, periodStr, filter.startDate, filter.endDate, buildPdfAbss]
  );

  const downloadPdf = useCallback(async () => {
    if (!profitLossSheet || !totals) return;
    setPdfLoading(true);
    try {
      const res = await getProfile({});
      const profileForPdf = res?.payload?.data ?? profile;
      const html = generatePdfHtml(profileForPdf);
      if (!html) return;
      const opt = {
        margin: [10, 10, 10, 10],
        pagebreak: { mode: ['css', 'legacy'] },
        filename: `profit-and-loss-${dayjs().format('YYYY-MM-DD')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0, logging: false, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(html).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  }, [profitLossSheet, totals, profile, getProfile, generatePdfHtml]);

  const handleMenuClick = useCallback(
    e => {
      if (e.key === '1') downloadPdf();
    },
    [downloadPdf]
  );

  const exportMenuProps = useMemo(
    () => ({
      items: [{ label: 'PDF', key: '1' }],
      onClick: handleMenuClick,
    }),
    [handleMenuClick]
  );

  const plReportTableClassName =
    'pl-report-inner-table [&_.ant-table]:!mb-0 [&_.ant-table]:!border-0 [&_.ant-table-container]:before:!hidden [&_.ant-table]:rounded-none [&_.ant-table-thead>tr>th]:!py-0 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-tbody>tr>td]:!border-b [&_.ant-table-tbody>tr>td]:!border-gray-200 [&_.ant-table-tbody>tr:hover>td]:!bg-transparent [&_.ant-table-tbody>tr.ant-table-row-level-1:hover>td]:!bg-blue-50 [&_.ant-table-tbody>tr>td]:text-xs';

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3 flex-wrap">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/reports')} />
          <p className="font-bold text-[1.125rem] text-gray-900">Profit and Loss</p>
          <span className="md:hidden lg:block text-gray-300">|</span>
          {dateRangeLabel && <span className="text-gray-600 text-sm font-medium">{dateRangeLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          {profitLossSheet && (
            <Dropdown menu={exportMenuProps} trigger={['click']} disabled={pdfLoading}>
              <Button loading={pdfLoading}>
                <Space>{pdfLoading ? 'Generating...' : 'Export Report'}</Space>
              </Button>
            </Dropdown>
          )}
          <Button onClick={() => setShowFilter(v => !v)}>{showFilter ? 'Hide Filters' : 'View Filters'}</Button>
        </div>
      </div>

      {showFilter && (
        <div className="bg-white filters-open">
          <div className="container-spacing">
            <div className="flex flex-row gap-4 items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Start Date</p>
                <DatePicker
                  value={filter.startDate ? dayjs(filter.startDate) : null}
                  onChange={handleDateChange('startDate')}
                  format="DD/MM/YYYY"
                  className="w-full min-w-[180px]"
                  allowClear={false}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">End Date</p>
                <DatePicker value={filter.endDate ? dayjs(filter.endDate) : null} onChange={handleDateChange('endDate')} format="DD/MM/YYYY" className="w-full min-w-[180px]" allowClear={false} />
              </div>
              <div className="flex-grow" />
              <Space className="mt-6">
                <Button className="p-[17px]" onClick={handleResetFilters}>
                  Reset All
                </Button>
                <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleApplyFilter}>
                  Apply Filters
                </Button>
              </Space>
            </div>
          </div>
        </div>
      )}

      <div className="container-spacing py-4">
        {profitLossSheetError && <Alert type="error" showIcon message="Error" description={profitLossSheetError} className="mb-4" />}

        {profitLossSheetLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spin size="large" />
          </div>
        ) : profitLossSheet && totals ? (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  {allExpandableKeys.length > 0 && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th colSpan={4} className="py-1.5 px-2 text-right text-xs text-gray-600">
                        <button type="button" onClick={toggleExpandCollapseAll} className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none">
                          {isAllExpanded ? 'Collapse All' : 'Expand All'}
                        </button>
                      </th>
                    </tr>
                  )}
                  <tr className="bg-gray-100 border-b border-gray-400">
                    <th className="py-2 px-2 text-left text-xs font-semibold text-gray-800 border-r border-gray-300 w-[35%]">Particulars</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-800 border-r border-gray-400 w-[15%]">{periodStr}</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-gray-800 border-r border-gray-300 w-[35%]">Particulars</th>
                    <th className="py-2 px-2 text-right text-xs font-semibold text-gray-800 w-[15%]">{periodStr}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="2" className="border-r border-gray-400 align-top p-0">
                      <Table
                        className={plReportTableClassName}
                        size="small"
                        showHeader={false}
                        columns={profitAndLossTableColumns}
                        dataSource={leftTradingDataSource}
                        expandable={expandableConfig}
                        pagination={false}
                        rowClassName={row => (row.children?.length ? 'cursor-pointer hover:!bg-blue-50' : '')}
                      />
                    </td>
                    <td colSpan="2" className="align-top p-0">
                      <Table
                        className={plReportTableClassName}
                        size="small"
                        showHeader={false}
                        columns={profitAndLossTableColumns}
                        dataSource={rightTradingDataSource}
                        expandable={expandableConfig}
                        pagination={false}
                        rowClassName={row => (row.children?.length ? 'cursor-pointer hover:!bg-blue-50' : '')}
                      />
                    </td>
                  </tr>

                  <tr className="bg-gray-100 border-t border-gray-400">
                    <td className="py-2 px-2 text-xs border-r border-gray-300" />
                    <td className="py-2 px-2 text-right font-mono text-xs font-semibold border-r border-gray-400">{formatAmount(totals.totalTradingLeft)}</td>
                    <td className="py-2 px-2 text-xs border-r border-gray-300" />
                    <td className="py-2 px-2 text-right font-mono text-xs font-semibold">{formatAmount(totals.totalTradingLeft)}</td>
                  </tr>

                  <tr>
                    <td colSpan="4" className="h-3 border-t-2 border-gray-500 bg-gray-50" />
                  </tr>

                  <tr>
                    <td colSpan="2" className="border-r border-gray-400 align-top p-0">
                      <Table
                        className={plReportTableClassName}
                        size="small"
                        showHeader={false}
                        columns={profitAndLossTableColumns}
                        dataSource={leftPlDataSource}
                        expandable={expandableConfig}
                        pagination={false}
                        rowClassName={row => (row.children?.length ? 'cursor-pointer hover:!bg-blue-50' : '')}
                      />
                    </td>
                    <td colSpan="2" className="align-top p-0">
                      <Table
                        className={plReportTableClassName}
                        size="small"
                        showHeader={false}
                        columns={profitAndLossTableColumns}
                        dataSource={rightPlDataSource}
                        expandable={expandableConfig}
                        pagination={false}
                        rowClassName={row => (row.children?.length ? 'cursor-pointer hover:!bg-blue-50' : '')}
                      />
                    </td>
                  </tr>

                  <tr className="bg-gray-200 border-t-2 border-gray-500">
                    <td className="py-2 px-2 text-xs font-bold border-r border-gray-300">Total</td>
                    <td className="py-2 px-2 text-right font-mono text-xs font-bold border-r border-gray-400">{formatAmount(totals.totalRightFinal)}</td>
                    <td className="py-2 px-2 text-xs font-bold border-r border-gray-300">Total</td>
                    <td className="py-2 px-2 text-right font-mono text-xs font-bold">{formatAmount(totals.totalRightFinal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ViewProfitAndLossReport;
