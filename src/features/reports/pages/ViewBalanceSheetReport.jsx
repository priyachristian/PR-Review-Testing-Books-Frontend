import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Empty } from 'antd';
import dayjs from 'dayjs';

// Components
import { Alert, Button, Collapse, DatePicker, Dropdown, Space, Spin, Switch } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useReport } from '@/features/reports/useReport';

// Extras
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from 'utils/constants';
import { formatAmount } from '@/utils/currency';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewBalanceSheetReport = () => {
  const navigate = useNavigate();
  const { balanceSheetLoading, balanceSheet, balanceSheetError, getBalanceSheet, clearBalanceSheet } = useReport();
  const { divDrop, divisionLoading, getDivDropDown, allBranchDrop, branchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { profile, getProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    endDate: searchParams.get('endDate') || dayjs().format('YYYY-MM-DD'),
    startDate: searchParams.get('startDate') || dayjs().startOf('year').format('YYYY-MM-DD'),
    showZeroBalances: searchParams.get('showZeroBalances') === 'true',
  });

  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
  });

  // Collapsible state
  const [expandedAssets, setExpandedAssets] = useState(['fixedassets', 'currentassets']);
  const [expandedLiabilities, setExpandedLiabilities] = useState(['capitalequity', 'noncurrentliabilities', 'currentliabilities']);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const handleClear = () => {
    setFilter({
      division: '',
      branch: '',
      endDate: dayjs().format('YYYY-MM-DD'),
      startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
      showZeroBalances: false,
    });
    updateUrlParams({
      division: '',
      branch: '',
      endDate: dayjs().format('YYYY-MM-DD'),
      startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
      showZeroBalances: '',
    });
  };

  const handleFilter = async () => {
    updateUrlParams(filter);
  };

  const fetchBalanceSheet = signal => {
    const payload = {
      signal,
      startDate: filter.startDate || dayjs().startOf('year').format('YYYY-MM-DD'),
      endDate: filter.endDate || dayjs().format('YYYY-MM-DD'),
    };

    if (filter.division?.length) {
      payload.branch = Array.isArray(filter.branch) ? filter.branch.join(',') : filter.branch;
    }
    if (filter.branch?.length) {
      payload.branch = Array.isArray(filter.branch) ? filter.branch.join(',') : filter.branch;
    }

    getBalanceSheet(payload);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBalanceSheet(controller.signal);
    return () => {
      controller.abort();
      clearBalanceSheet();
    };
  }, [searchParams]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      obj.branchDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    if (searchParams.get('branch')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, [filter?.branch]);

  // Format currency with INR and brackets for negative
  const formatCurrency = (amount, showSymbol = true) => {
    const num = Number(amount) || 0;
    if (num < 0) {
      return `(${formatAmount(Math.abs(num), showSymbol)})`;
    }
    return formatAmount(num, showSymbol);
  };

  // Format number for PDF (Indian format)
  const formatPdfAmount = amount => {
    const num = Number(amount) || 0;
    if (num === 0) return '';
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return num < 0 ? `(-)${formatted}` : formatted;
  };

  // Render accounts for PDF with section totals
  const renderAccountsWithTotals = (accounts, sectionTotal, level = 0) => {
    if (!accounts?.length) return '';

    let rows = [];
    let isFirstAccount = true;

    accounts.forEach(account => {
      const balance = account.grandTotal || account.balance || 0;

      if (!filter.showZeroBalances && balance === 0 && !account.children?.length && !account.ledgers?.length) {
        return;
      }

      const indent = level * 12;

      // Show section total on first row
      const showSectionTotal = isFirstAccount && level === 0 && sectionTotal;

      rows.push(`
        <tr>
          <td class="name-cell" style="padding-left: ${indent}px;">${account.accountName}</td>
          <td class="amt-cell">${formatPdfAmount(balance)}</td>
          <td class="total-cell">${showSectionTotal ? formatPdfAmount(sectionTotal) : ''}</td>
        </tr>
      `);

      isFirstAccount = false;

      // Show ledgers
      if (account.ledgers?.length > 0) {
        account.ledgers.forEach(ledger => {
          const ledgerBalance = ledger.balance || ledger.netBalance || 0;
          if (!filter.showZeroBalances && ledgerBalance === 0) return;

          const name = ledger.personName || 'Unnamed';
          rows.push(`
            <tr>
              <td class="name-cell" style="padding-left: ${indent + 12}px; font-style: italic;">${name}</td>
              <td class="amt-cell">${formatPdfAmount(ledgerBalance)}</td>
              <td class="total-cell"></td>
            </tr>
          `);
        });
      }

      // Render children
      if (account.children?.length > 0) {
        rows.push(renderAccountsWithTotals(account.children, null, level + 1));
      }
    });

    return rows.join('');
  };

  // Render special items for PDF
  const renderSpecialItemsForPdf = specialItems => {
    if (!specialItems) return '';

    let rows = [];

    if (specialItems.inventory && specialItems.inventory.balance > 0) {
      rows.push(`
        <tr>
          <td class="name-cell" style="padding-left: 12px;">Closing Stock</td>
          <td class="amt-cell">${formatPdfAmount(specialItems.inventory.balance)}</td>
          <td class="total-cell"></td>
        </tr>
      `);
    }

    if (specialItems.accountsReceivable && specialItems.accountsReceivable.balance > 0) {
      rows.push(`
        <tr>
          <td class="name-cell" style="padding-left: 12px;">Sundry Debtors</td>
          <td class="amt-cell">${formatPdfAmount(specialItems.accountsReceivable.balance)}</td>
          <td class="total-cell"></td>
        </tr>
      `);
    }

    if (specialItems.accountsPayable && specialItems.accountsPayable.balance > 0) {
      rows.push(`
        <tr>
          <td class="name-cell" style="padding-left: 12px;">Sundry Creditors</td>
          <td class="amt-cell">${formatPdfAmount(specialItems.accountsPayable.balance)}</td>
          <td class="total-cell"></td>
        </tr>
      `);
    }

    return rows.join('');
  };

  // Generate Balance Sheet PDF - Tally Style
  const generatePdfHtml = async () => {
    const summary = balanceSheet?.summary || {};
    const categories = balanceSheet?.categories || {};
    const companyName = profile?.name || 'Company Name';
    const companyAddress = profile?.address ? `${profile.address.street1 || ''}, ${profile.address.city || ''}, ${profile.address.state || ''} - ${profile.address.pinCode || ''}` : '';
    const startDate = dayjs(filter.startDate).format('D-MMM-YY');
    const endDate = dayjs(filter.endDate).format('D-MMM-YY');
    const asAtDate = dayjs(filter.endDate).format('DD-MMM-YY');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 6mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 10px; 
      line-height: 1.2; 
      color: #000;
    }
    
    .header {
      text-align: center;
      margin-bottom: 8px;
    }
    .company-name {
      font-size: 13px;
      font-weight: bold;
    }
    .company-address {
      font-size: 8px;
      margin-top: 1px;
    }
    .report-title {
      font-size: 11px;
      font-weight: bold;
      margin-top: 6px;
    }
    .report-subtitle {
      font-size: 9px;
    }
    .report-period {
      font-size: 9px;
    }
    
    .main-table {
      width: 100%;
      border-collapse: collapse;
    }
    .main-table > tbody > tr > td {
      vertical-align: top;
      width: 50%;
    }
    .main-table > tbody > tr > td:first-child {
      border-right: 1px solid #000;
      padding-right: 8px;
    }
    .main-table > tbody > tr > td:last-child {
      padding-left: 8px;
    }
    
    .col-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #000;
      padding: 2px 0;
      margin-bottom: 5px;
    }
    .col-title {
      font-weight: bold;
      font-size: 11px;
      text-decoration: underline;
    }
    .col-date {
      font-size: 9px;
    }
    
    .section {
      margin-bottom: 6px;
    }
    .section-title {
      font-weight: bold;
      text-decoration: underline;
      font-size: 10px;
      margin-bottom: 2px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table td {
      padding: 1px 0;
      font-size: 10px;
      vertical-align: top;
    }
    .name-cell {
      width: auto;
    }
    .amt-cell {
      text-align: right;
      width: 70px;
      padding-left: 5px;
    }
    .total-cell {
      text-align: right;
      width: 80px;
      font-weight: bold;
      padding-left: 5px;
    }
    
    .total-row td {
      border-top: 1px solid #000;
      padding: 5px 0 !important;
      font-weight: bold;
      font-size: 11px;
    }
    .total-row .total-label {
      font-weight: bold;
    }
    .total-row .total-amount {
      text-align: right;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="company-name">${companyName.toUpperCase()}</div>
    ${companyAddress ? `<div class="company-address">${companyAddress}</div>` : ''}
    <div class="report-title">Balance Sheet</div>
    <div class="report-period">${startDate} to ${endDate}</div>
  </div>

  <!-- Main Table -->
  <table class="main-table">
    <tbody>
      <!-- Content Row -->
      <tr>
        <!-- LEFT: Liabilities -->
        <td>
          <div class="col-header">
            <span class="col-title">Liabilities</span>
            <span class="col-date">as at ${asAtDate}</span>
          </div>
          
          <!-- Capital Account -->
          <div class="section">
            <div class="section-title">Capital Account</div>
            <table class="data-table">
              ${renderAccountsWithTotals(categories?.capitalequity?.accounts, summary?.equity?.totalEquity)}
            </table>
          </div>
          
          <!-- Loans (Liability) -->
          <div class="section">
            <div class="section-title">Loans (Liability)</div>
            <table class="data-table">
              ${renderAccountsWithTotals(categories?.['non-currentliabilities']?.accounts || categories?.noncurrentliabilities?.accounts, summary?.liabilities?.nonCurrentLiabilities)}
            </table>
          </div>
          
          <!-- Current Liabilities -->
          <div class="section">
            <div class="section-title">Current Liabilities</div>
            <table class="data-table">
              ${renderAccountsWithTotals(categories?.currentliabilities?.accounts, summary?.liabilities?.currentLiabilities)}
              ${renderSpecialItemsForPdf(categories?.currentliabilities?.specialItems)}
            </table>
          </div>
          
          ${
            !summary?.isBalanced
              ? `
          <!-- Profit & Loss A/c -->
          <div class="section">
            <div class="section-title">Profit & Loss A/c</div>
            <table class="data-table">
              <tr>
                <td class="name-cell" style="padding-left: 10px;">Opening Balance</td>
                <td class="amt-cell"></td>
                <td class="total-cell"></td>
              </tr>
              <tr>
                <td class="name-cell" style="padding-left: 10px;">Current Period</td>
                <td class="amt-cell">${formatPdfAmount(Math.abs(summary?.difference || 0))}</td>
                <td class="total-cell">${formatPdfAmount(Math.abs(summary?.difference || 0))}</td>
              </tr>
            </table>
          </div>
          `
              : ''
          }
        </td>
        
        <!-- RIGHT: Assets -->
        <td>
          <div class="col-header">
            <span class="col-title">Assets</span>
            <span class="col-date">as at ${asAtDate}</span>
          </div>
          
          <!-- Fixed Assets -->
          <div class="section">
            <div class="section-title">Fixed Assets</div>
            <table class="data-table">
              ${renderAccountsWithTotals(categories?.fixedassets?.accounts, summary?.assets?.fixedAssets)}
            </table>
          </div>
          
          <!-- Current Assets -->
          <div class="section">
            <div class="section-title">Current Assets</div>
            <table class="data-table">
              ${renderAccountsWithTotals(categories?.currentassets?.accounts, summary?.assets?.currentAssets)}
              ${renderSpecialItemsForPdf(categories?.currentassets?.specialItems)}
            </table>
          </div>
        </td>
      </tr>
      
      <!-- Total Row - Both sides in same row -->
      <tr class="total-row">
        <td style="border-top: 1px solid #000; padding: 5px 8px 5px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span class="total-label">Total</span>
            <span class="total-amount">${formatPdfAmount(summary?.liabilitiesPlusEquity)}</span>
          </div>
        </td>
        <td style="border-top: 1px solid #000; padding: 5px 0 5px 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span class="total-label">Total</span>
            <span class="total-amount">${formatPdfAmount(summary?.assets?.totalAssets)}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

    return html;
  };

  const downloadPdf = async () => {
    await getProfile({});
    const html = await generatePdfHtml();

    const companyName = profile?.name || 'Company';
    const fileName = `Balance_Sheet_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${dayjs(filter.endDate).format('DD-MMM-YYYY')}.pdf`;

    const opt = {
      margin: 8,
      pagebreak: { mode: 'avoid-all' },
      filename: fileName,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        scrollY: 0,
        logging: false,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
    };

    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf().set(opt).from(html).save();
  };

  const handleMenuClick = e => {
    if (e.key === '1') {
      downloadPdf();
    }
  };

  const items = [
    {
      label: 'PDF',
      key: '1',
    },
  ];

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  // Render account tree recursively
  const renderAccountTree = (accounts, level = 0) => {
    if (!accounts?.length) return null;

    return accounts.map(account => {
      const balance = account.grandTotal || account.balance || 0;
      const isNegative = balance < 0;

      // Skip zero balances if filter is off
      if (!filter.showZeroBalances && balance === 0 && !account.children?.length) {
        return null;
      }

      return (
        <div key={account.accountId} style={{ paddingLeft: level * 16 }}>
          <div className="flex justify-between items-center py-1 hover:bg-gray-50 px-2 rounded">
            <span className={`text-sm ${level === 0 ? 'font-medium' : ''}`}>{account.accountName}</span>
            <span className={`text-sm font-medium ${isNegative ? 'text-red-600' : ''}`}>{formatCurrency(balance)}</span>
          </div>
          {account.children?.length > 0 && renderAccountTree(account.children, level + 1)}
        </div>
      );
    });
  };

  // Render special calculated items (Receivables, Inventory, Payables)
  const renderSpecialItems = specialItems => {
    if (!specialItems) return null;

    return (
      <div className="mt-2 border-t border-dashed pt-2">
        {specialItems.accountsReceivable && (
          <div className="flex justify-between items-center py-1 px-2">
            <span className="text-sm text-blue-600">Accounts Receivable ({specialItems.accountsReceivable.count} invoices)</span>
            <span className="text-sm font-medium">{formatCurrency(specialItems.accountsReceivable.balance)}</span>
          </div>
        )}
        {specialItems.inventory && (
          <div className="flex justify-between items-center py-1 px-2">
            <span className="text-sm text-blue-600">Inventory ({specialItems.inventory.itemCount} items)</span>
            <span className="text-sm font-medium">{formatCurrency(specialItems.inventory.balance)}</span>
          </div>
        )}
        {specialItems.accountsPayable && (
          <div className="flex justify-between items-center py-1 px-2">
            <span className="text-sm text-blue-600">Accounts Payable ({specialItems.accountsPayable.count} bills)</span>
            <span className="text-sm font-medium">{formatCurrency(specialItems.accountsPayable.balance)}</span>
          </div>
        )}
      </div>
    );
  };

  // Get category content for Collapse items
  const getCategoryContent = categoryKey => {
    // Handle both with and without hyphen for non-currentliabilities
    let category = balanceSheet?.categories?.[categoryKey];
    if (!category && categoryKey === 'noncurrentliabilities') {
      category = balanceSheet?.categories?.['non-currentliabilities'];
    }
    if (!category) return null;

    return (
      <div>
        {renderAccountTree(category.accounts)}
        {renderSpecialItems(category.specialItems)}
      </div>
    );
  };

  // Get collapse items for assets
  const getAssetsCollapseItems = () => {
    const categories = balanceSheet?.categories || {};
    const summary = balanceSheet?.summary || {};
    const collapseItems = [];

    if (categories.fixedassets) {
      collapseItems.push({
        key: 'fixedassets',
        label: (
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-sm underline">Fixed Assets</span>
            <span className="font-bold text-sm">{formatCurrency(summary?.assets?.fixedAssets || 0)}</span>
          </div>
        ),
        children: getCategoryContent('fixedassets'),
      });
    }

    if (categories.currentassets) {
      collapseItems.push({
        key: 'currentassets',
        label: (
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-sm underline">Current Assets</span>
            <span className="font-bold text-sm">{formatCurrency(summary?.assets?.currentAssets || 0)}</span>
          </div>
        ),
        children: getCategoryContent('currentassets'),
      });
    }

    return collapseItems;
  };

  // Get collapse items for liabilities
  const getLiabilitiesCollapseItems = () => {
    const categories = balanceSheet?.categories || {};
    const summary = balanceSheet?.summary || {};
    const collapseItems = [];

    if (categories.capitalequity) {
      collapseItems.push({
        key: 'capitalequity',
        label: (
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-sm underline">Capital Account</span>
            <span className="font-bold text-sm">{formatCurrency(summary?.equity?.totalEquity || 0)}</span>
          </div>
        ),
        children: getCategoryContent('capitalequity'),
      });
    }

    if (categories.noncurrentliabilities || categories['non-currentliabilities']) {
      collapseItems.push({
        key: 'noncurrentliabilities',
        label: (
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-sm underline">Loans (Liability)</span>
            <span className="font-bold text-sm">{formatCurrency(summary?.liabilities?.nonCurrentLiabilities || 0)}</span>
          </div>
        ),
        children: getCategoryContent('noncurrentliabilities'),
      });
    }

    if (categories.currentliabilities) {
      collapseItems.push({
        key: 'currentliabilities',
        label: (
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-sm underline">Current Liabilities</span>
            <span className="font-bold text-sm">{formatCurrency(summary?.liabilities?.currentLiabilities || 0)}</span>
          </div>
        ),
        children: getCategoryContent('currentliabilities'),
      });
    }

    return collapseItems;
  };

  const summary = balanceSheet?.summary || {};

  return (
    <div className="-m-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/reports')} />
          <p className="font-bold text-[1.125rem]">Balance Sheet</p>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton type="default" text={<Icons.SyncOutlined />} onClick={() => fetchBalanceSheet()} loading={balanceSheetLoading} />
          {balanceSheet && (
            <Dropdown menu={menuProps} trigger={['click']}>
              <Button>
                <Space>Export Report</Space>
              </Button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white">
        <div className="container-spacing">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-gray-700">Start Date</div>
              <DatePicker
                placeholder="Start Date"
                value={filter?.startDate ? dayjs(filter.startDate) : null}
                onChange={date => setFilter(prev => ({ ...prev, startDate: date ? date.format('YYYY-MM-DD') : '' }))}
                format="DD/MM/YYYY"
                className="w-full h-[35.5px]"
                allowClear={false}
              />
            </div>
            <div className="space-y-2">
              <div className="text-[13px] font-semibold text-gray-700">End Date</div>
              <DatePicker
                placeholder="End Date"
                value={filter?.endDate ? dayjs(filter.endDate) : null}
                onChange={date => setFilter(prev => ({ ...prev, endDate: date ? date.format('YYYY-MM-DD') : '' }))}
                format="DD/MM/YYYY"
                className="w-full h-[35.5px]"
                allowClear={false}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="division"
                label="Division"
                mode="multiple"
                placeHolder="Select Division"
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear={false}
                extraFilterValues={{ branch: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.divisionDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name="branch"
                label="Branch"
                placeHolder="Select Branch"
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions((allBranchDrop || []).filter(branch => filter?.division?.includes(branch?.divisionId?.id)))}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear={false}
                disabled={!filter?.division?.length}
                loading={branchLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.branchDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-x-2">
              <Switch checked={filter?.showZeroBalances} onChange={checked => setFilter(prev => ({ ...prev, showZeroBalances: checked }))} />
              <span className="text-sm">Show Zero Balances</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleClear}>Reset</Button>
              <Button type="primary" icon={<Icons.FilterOutlined />} onClick={handleFilter}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {balanceSheetError && (
        <div className="container-spacing">
          <Alert message="Error" description={balanceSheetError} type="error" showIcon closable />
        </div>
      )}

      {/* Loading State */}
      {balanceSheetLoading && (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )}

      {/* Empty State */}
      {!balanceSheetLoading && !balanceSheet && !balanceSheetError && (
        <div className="flex justify-center items-center py-20">
          <Empty description="No data available. Please apply filters to generate the Balance Sheet." />
        </div>
      )}

      {/* Balance Sheet Content */}
      {!balanceSheetLoading && balanceSheet && (
        <div className="container-spacing">
          {/* Header - Company Info */}
          <div className="text-center mb-4 py-3 bg-white border-b">
            <h1 className="text-lg font-bold">{profile?.name?.toUpperCase() || 'COMPANY NAME'}</h1>
            {profile?.address && (
              <p className="text-xs text-gray-600">
                {profile.address.street1}, {profile.address.city}, {profile.address.state} - {profile.address.pinCode}
              </p>
            )}
            <h2 className="text-base font-bold mt-2 underline">Balance Sheet</h2>
            <p className="text-sm">
              {dayjs(filter.startDate).format('DD-MMM-YYYY')} to {dayjs(filter.endDate).format('DD-MMM-YYYY')}
            </p>
            {/* Show applied filters */}
            {(filter?.division?.length > 0 || filter?.branch?.length > 0) && (
              <p className="text-xs text-gray-500 mt-1">
                {filter?.division?.length > 0 && (
                  <span>
                    Division:{' '}
                    {divDrop
                      ?.filter(d => filter.division.includes(d.id))
                      .map(d => d.name)
                      .join(', ')}
                  </span>
                )}
                {filter?.division?.length > 0 && filter?.branch?.length > 0 && <span> | </span>}
                {filter?.branch?.length > 0 && (
                  <span>
                    Branch:{' '}
                    {allBranchDrop
                      ?.filter(b => filter.branch.includes(b.id))
                      .map(b => b.name)
                      .join(', ')}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Validation Alert */}
          {!summary?.isBalanced && (
            <div className="mb-4">
              <Alert message="Balance Sheet is NOT Balanced" description={`Difference: ${formatCurrency(summary?.difference)}`} type="warning" showIcon />
            </div>
          )}

          {/* Two Column Layout - PDF Style */}
          <div className="bg-white border border-gray-300">
            <div className="grid grid-cols-2">
              {/* LEFT: Liabilities Header */}
              <div className="border-r border-gray-300 border-b px-3 py-2 flex justify-between items-center">
                <span className="font-bold text-sm underline">Liabilities</span>
                <span className="text-xs text-gray-600">as at {dayjs(filter.endDate).format('DD-MMM-YY')}</span>
              </div>
              {/* RIGHT: Assets Header */}
              <div className="border-b border-gray-300 px-3 py-2 flex justify-between items-center">
                <span className="font-bold text-sm underline">Assets</span>
                <span className="text-xs text-gray-600">as at {dayjs(filter.endDate).format('DD-MMM-YY')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2">
              {/* LEFT: Liabilities Content */}
              <div className="border-r border-gray-300 p-2">
                <Collapse
                  activeKey={expandedLiabilities}
                  onChange={setExpandedLiabilities}
                  bordered={false}
                  expandIconPosition="start"
                  className="bg-white balance-sheet-collapse"
                  items={getLiabilitiesCollapseItems()}
                />

                {/* Profit & Loss if not balanced */}
                {!summary?.isBalanced && (
                  <div className="mt-2 px-2">
                    <p className="font-bold text-sm underline mb-1">Profit & Loss A/c</p>
                    <div className="flex justify-between text-sm pl-3">
                      <span>Difference in Opening Balances</span>
                      <span className="font-semibold">{formatCurrency(Math.abs(summary?.difference || 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Assets Content */}
              <div className="p-2">
                <Collapse
                  activeKey={expandedAssets}
                  onChange={setExpandedAssets}
                  bordered={false}
                  expandIconPosition="start"
                  className="bg-white balance-sheet-collapse"
                  items={getAssetsCollapseItems()}
                />
              </div>
            </div>

            {/* Total Row - Both in same row */}
            <div className="grid grid-cols-2 border-t-2 border-gray-800">
              <div className="border-r border-gray-300 px-3 py-2 flex justify-between items-center bg-gray-50">
                <span className="font-bold text-sm">Total</span>
                <span className="font-bold text-sm">{formatCurrency(summary?.liabilitiesPlusEquity)}</span>
              </div>
              <div className="px-3 py-2 flex justify-between items-center bg-gray-50">
                <span className="font-bold text-sm">Total</span>
                <span className="font-bold text-sm">{formatCurrency(summary?.assets?.totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              Report generated on {dayjs().format('DD-MMM-YYYY')} | As at {dayjs(filter.endDate).format('DD-MMM-YYYY')} | Currency: {profile?.baseCurrency?.code || ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBalanceSheetReport;
