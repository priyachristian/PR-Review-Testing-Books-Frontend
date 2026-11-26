import { colorPalette } from '@/utils/theme';

export const WA = { bg: '#efeae2', text: '#111b21', time: '#8696a0' };

export const TONE_COLORS = {
  good: colorPalette.success[700],
  warn: colorPalette.warning[700],
  crit: colorPalette.error[600],
};

export const CATEGORY_STYLES = {
  Finance: { color: colorPalette.success[700], bg: colorPalette.success[50] },
  People: { color: '#be123c', bg: '#fce7ec' },
  Sales: { color: colorPalette.primary[500], bg: colorPalette.primary[50] },
  Inventory: { color: colorPalette.warning[700], bg: colorPalette.warning[50] },
  Production: { color: colorPalette.brand.purple, bg: '#efe7fd' },
  Operations: { color: colorPalette.secondary[600], bg: colorPalette.secondary[100] },
};

export const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const FIN = {
  salesAmount: 125000,
  invoiceCount: 18,
  purchaseAmount: 82000,
  billCount: 12,
  paymentReceived: 95000,
  paymentReceivedCount: 14,
  paymentMade: 61000,
  paymentMadeCount: 9,
  customerOutstanding: 425000,
  vendorOutstanding: 178000,
  netCashFlow: 34000,
};

const FINANCIAL_PERIODS = {
  daily: { title: 'Daily Business Summary', dateLabel: 'Date', date: '16 Jul 2026', netLabel: "Today's Net Cash Flow" },
  weekly: { title: 'Weekly Financial Summary', dateLabel: 'Period', date: '14 Jul 2026 to 20 Jul 2026', netLabel: 'Net Cash Flow' },
  monthly: { title: 'Monthly Financial Summary', dateLabel: 'Period', date: 'July 2026', netLabel: 'Net Cash Flow' },
};

// The existing summary, expressed as a template so it renders through the shared bubble.
export const buildFinancialSummaryTemplate = (period = 'daily') => {
  const p = FINANCIAL_PERIODS[period] || FINANCIAL_PERIODS.daily;
  return {
    key: 'financialSummary',
    name: 'Financial Summary',
    category: 'Finance',
    status: 'active',
    emoji: '💰',
    purpose: 'The core daily / weekly / monthly business snapshot.',
    title: p.title,
    dateLabel: p.dateLabel,
    date: p.date,
    blocks: [
      { emoji: '💰', title: 'Sales', items: [`Total Sales: ${money(FIN.salesAmount)}`, `No. of Invoices: ${FIN.invoiceCount}`] },
      { emoji: '🛒', title: 'Purchases', items: [`Total Purchases: ${money(FIN.purchaseAmount)}`, `No. of Bills: ${FIN.billCount}`] },
      { emoji: '💵', title: 'Payment Received', items: [`Amount Collected: ${money(FIN.paymentReceived)}`, `Transactions: ${FIN.paymentReceivedCount}`] },
      { emoji: '💸', title: 'Payment Made', items: [`Amount Paid: ${money(FIN.paymentMade)}`, `Transactions: ${FIN.paymentMadeCount}`] },
      { emoji: '📈', title: 'Customer Outstanding', items: [`Total Receivable: ${money(FIN.customerOutstanding)}`] },
      { emoji: '🧾', title: 'Vendor Outstanding', items: [`Total Payable: ${money(FIN.vendorOutstanding)}`] },
      { emoji: '📌', title: p.netLabel, items: [{ text: money(FIN.netCashFlow), tone: FIN.netCashFlow >= 0 ? 'good' : 'crit' }] },
    ],
  };
};

const sortTemplatesByStatus = templates =>
  [...templates].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  });

export const TEMPLATE_LIBRARY = sortTemplatesByStatus([
  {
    key: 'receivablesAging',
    emoji: '📈',
    name: 'Receivables Aging',
    category: 'Finance',
    status: 'coming-soon',
    purpose: 'What customers owe, bucketed by how overdue it is.',
    title: 'Receivables Aging',
    date: 'As of 27 Jul 2026',
    blocks: [
      { emoji: '📈', title: 'Total Receivable', items: ['₹4,25,000'] },
      { emoji: '🟢', title: 'Current (not due)', items: [{ text: '₹1,80,000', tone: 'good' }] },
      { emoji: '🟡', title: '1–30 days', items: [{ text: '₹1,20,000', tone: 'warn' }] },
      { emoji: '🟠', title: '31–60 days', items: [{ text: '₹75,000', tone: 'warn' }] },
      { emoji: '🔴', title: '60+ days overdue', items: [{ text: '₹50,000', tone: 'crit' }] },
      { emoji: '👤', title: 'Top Overdue', items: ['Acme Traders ₹32,000 · Global Corp ₹18,000'] },
    ],
  },
  {
    key: 'payablesDues',
    emoji: '🧾',
    name: 'Payables & Upcoming Dues',
    category: 'Finance',
    status: 'coming-soon',
    purpose: 'What you owe and which bills fall due this week.',
    title: 'Payables & Upcoming Dues',
    date: 'As of 27 Jul 2026',
    blocks: [
      { emoji: '🧾', title: 'Total Payable', items: ['₹1,78,000'] },
      { emoji: '📅', title: 'Due in next 7 days', items: [{ text: '₹64,000 · 5 bills', tone: 'warn' }] },
      { emoji: '🔴', title: 'Overdue', items: [{ text: '₹22,000', tone: 'crit' }] },
      { emoji: '🏢', title: 'Top Vendor Payable', items: ['Metro Supplies ₹45,000'] },
    ],
  },
  {
    key: 'lowStockAlerts',
    emoji: '⚠️',
    name: 'Low Stock & Reorder Alerts',
    category: 'Inventory',
    status: 'coming-soon',
    purpose: 'What to reorder and what has run out.',
    title: 'Low Stock & Reorder Alerts',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '⚠️', title: 'Below Reorder Level', items: [{ text: '8 items', tone: 'warn' }] },
      { emoji: '🔴', title: 'Out of Stock', items: [{ text: '3 items', tone: 'crit' }, 'M8 Bolt · LED Driver 50W · Gasket Ring'] },
      { emoji: '🐌', title: 'Slow-moving (>90d)', items: ['12 items'] },
      { emoji: '🚩', title: 'Valuation Flags', items: [{ text: '2 items with negative value', tone: 'crit' }] },
    ],
  },
  {
    key: 'productionSummary',
    emoji: '🏭',
    name: 'Production Summary',
    category: 'Production',
    status: 'coming-soon',
    purpose: 'Shop-floor status: RM issued, FG made, rejections.',
    title: 'Production Summary',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '🏭', title: 'Orders in Progress', items: ['6 orders'] },
      { emoji: '🧱', title: 'Raw Material Issued', items: ['₹1,45,000'] },
      { emoji: '✅', title: 'Finished Goods Submitted', items: ['340 units · ₹2,80,000'] },
      { emoji: '❌', title: 'Rejected (BOM RR)', items: [{ text: '12 units', tone: 'warn' }] },
      { emoji: '⏳', title: 'Pending Approval', items: ['3 orders'] },
    ],
  },
  {
    key: 'topPerformers',
    emoji: '🏆',
    name: 'Top Performers',
    category: 'Sales',
    status: 'active',
    purpose: 'Best customers, best-selling items, top salesperson.',
    title: 'Top Performers',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '🥇', title: 'Top Customers', items: ['Acme ₹1,20,000 · Global ₹95,000 · Metro ₹60,000'] },
      { emoji: '📦', title: 'Top Items Sold', items: ['Freedom 50W (420) · QLUX Panel (310) · Flood Light (280)'] },
      { emoji: '🏆', title: 'Top Salesperson', items: [{ text: 'Priya Shah — ₹2,10,000', tone: 'good' }] },
    ],
  },
  {
    key: 'pendingDrafts',
    emoji: '⏳',
    name: 'Pending & Drafts',
    category: 'Operations',
    status: 'coming-soon',
    purpose: 'Unfinished work that needs someone to act.',
    title: 'Pending & Drafts',
    date: 'As of 27 Jul 2026',
    blocks: [
      { emoji: '🧾', title: 'Draft Invoices', items: ['7 drafts · ₹4,20,000'] },
      { emoji: '📄', title: 'Draft Bills', items: ['4 drafts'] },
      { emoji: '🔧', title: 'Pending Inventory Adjustments', items: ['3 awaiting approval'] },
      { emoji: '🔁', title: 'Unapproved Transfers', items: ['2 requests'] },
      { emoji: '⏳', title: 'Stale Drafts (>7 days)', items: [{ text: '5 documents', tone: 'warn' }] },
    ],
  },
  {
    key: 'dailyActivityByUser',
    emoji: '👥',
    name: 'Daily Activity by User',
    category: 'People',
    status: 'active',
    purpose: 'Who created what today — documents per team member.',
    title: 'Daily Activity by User',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '👤', title: 'Priya Shah', items: ['6 Quotations · 3 Sales Orders · 2 Invoices'] },
      { emoji: '👤', title: 'Rahul Mehta', items: ['4 Invoices · 5 Payments Received'] },
      { emoji: '👤', title: 'Anjali Kapoor', items: ['8 GRPO · 3 Bills · 2 Debit Notes'] },
      { emoji: '📊', title: 'Total', items: ['46 documents by 5 active users'] },
    ],
  },
  {
    key: 'salesPipeline',
    emoji: '🎯',
    name: 'Sales Pipeline & Conversion',
    category: 'Sales',
    status: 'active',
    purpose: 'The quote → order → invoice funnel and where value is stuck.',
    title: 'Sales Pipeline Snapshot',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '📝', title: 'New Quotations', items: ['12 quotes · ₹8,40,000'] },
      { emoji: '🔄', title: 'Converted to Sales Order', items: ['7 orders · 58% conversion'] },
      { emoji: '🧾', title: 'Invoiced', items: ['5 invoices · ₹3,90,000'] },
      { emoji: '📂', title: 'Open Quotations', items: ['23 pending · ₹14,20,000'] },
      { emoji: '⏰', title: 'Expiring in 3 days', items: [{ text: '4 quotes need follow-up', tone: 'warn' }] },
    ],
  },
  {
    key: 'quotationsSummary',
    emoji: '📝',
    name: 'Quotations Summary',
    category: 'Sales',
    status: 'active',
    purpose: 'How many quotes, by whom, and which are going cold.',
    title: 'Quotations Summary',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '📝', title: 'Added Today', items: ['12 quotes · ₹8,40,000'] },
      { emoji: '👥', title: 'By User', items: ['Priya 6 · Rahul 4 · Anjali 2'] },
      { emoji: '📌', title: 'Status', items: ['Accepted 3 · Rejected 1 · Pending 8'] },
      { emoji: '⏳', title: 'Expiring Soon (≤3d)', items: [{ text: '4 quotes · ₹2,10,000', tone: 'warn' }] },
    ],
  },
  {
    key: 'inventoryMovement',
    emoji: '📦',
    name: 'Inventory Movement',
    category: 'Inventory',
    status: 'active',
    purpose: 'Stock in vs out today, and the top movers.',
    title: 'Inventory Movement',
    date: '27 Jul 2026',
    blocks: [
      { emoji: '📥', title: 'Stock IN (GRPO)', items: ['1,240 units · ₹2,10,000'] },
      { emoji: '📤', title: 'Stock OUT (Sales)', items: ['890 units'] },
      { emoji: '🔁', title: 'Transfers / Adjustments', items: ['+320 transferred · −45 adjusted'] },
      { emoji: '📌', title: 'Net Change', items: [{ text: '+305 units', tone: 'good' }] },
      { emoji: '🔝', title: 'Top Mover', items: ['Freedom 50W Flood Light — 420 out'] },
    ],
  },
]);

const orderedLibrary = sortTemplatesByStatus(TEMPLATE_LIBRARY);
const comingSoonTemplates = orderedLibrary.filter(t => t.status === 'coming-soon');
const activeTemplates = orderedLibrary.filter(t => t.status === 'active');

export const TEMPLATE_META = [
  { key: 'financialSummary', name: 'Financial Summary', category: 'Finance', emoji: '💰', purpose: 'The core daily / weekly / monthly business snapshot.', status: 'active' },
  ...activeTemplates.map(t => ({ key: t.key, name: t.name, category: t.category, emoji: t.emoji, purpose: t.purpose, status: t.status || 'coming-soon' })),
  ...comingSoonTemplates.map(t => ({ key: t.key, name: t.name, category: t.category, emoji: t.emoji, purpose: t.purpose, status: t.status || 'coming-soon' })),
];

const LIBRARY_BY_KEY = new Map(TEMPLATE_LIBRARY.map(t => [t.key, t]));

// Sample message a template will send — used for the inline preview on each config card.
export const getTemplatePreview = key => (key === 'financialSummary' ? buildFinancialSummaryTemplate('daily') : LIBRARY_BY_KEY.get(key) || null);

const MessageItem = ({ item }) => {
  const isObj = typeof item === 'object' && item !== null;
  const text = isObj ? item.text : item;
  const color = isObj && item.tone ? TONE_COLORS[item.tone] : WA.text;
  return (
    <p className="leading-snug" style={{ color }}>
      • {text}
    </p>
  );
};

const MessageBlock = ({ emoji, title, items }) => (
  <div className="mt-3">
    <p className="font-semibold leading-tight" style={{ color: WA.text }}>
      <span className="mr-1.5">{emoji}</span>
      {title}
    </p>
    {items.map((it, i) => (
      <MessageItem key={i} item={it} />
    ))}
  </div>
);

// The single WhatsApp-style bubble used by every template — the shared theme.
export const MessageBubble = ({ template, time = '07:30' }) => {
  if (!template) return null;
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: WA.bg }}>
      <div className="relative bg-white rounded-lg w-full px-3 py-2.5 text-[13px]" style={{ boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
        <span className="absolute -left-[7px] top-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

        <p className="font-bold text-[15px] mb-2" style={{ color: WA.text }}>
          {template.title}
        </p>
        <p style={{ color: WA.text }}>
          <span className="mr-1.5">🗓️</span>
          <span className="font-semibold">{template.dateLabel || 'Date'}:</span> {template.date}
        </p>

        {template.blocks.map((b, i) => (
          <MessageBlock key={i} emoji={b.emoji} title={b.title} items={b.items} />
        ))}

        <p className="mt-3 leading-snug" style={{ color: WA.text }}>
          Thank you,
          <br />
          ABSS Books
        </p>
        <p className="text-[11px] text-right mt-1" style={{ color: WA.time }}>
          {time}
        </p>
      </div>
    </div>
  );
};
