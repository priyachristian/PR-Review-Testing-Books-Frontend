import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tag, theme } from 'antd';
import { Tree, TreeNode } from 'react-organizational-chart';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Extras
import Icons from 'assets/icons/icon';
import { DELIVERY_CHALLAN_STATUS, INVOICE_STATUS, PAYMENT_RECEIVED_STATUS, PRODUCTION_MODULE_STATUS, QUOTE_STATUS, SALES_ORDER_STATUS } from 'utils/constants';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi } from 'utils/services';

/**
 * Builds a flat tree structure from backend moduleTree for display.
 * Handles shapes from: quote, salesOrder, deliveryChallan, invoice, paymentReceived services.
 */
const getDocPath = (type, id) => {
  if (!id) return null;
  const paths = {
    quote: `/quotes/${id}`,
    salesOrder: `/sales-orders/${id}`,
    deliveryChallan: `/delivery-challans/${id}`,
    invoice: `/invoices/${id}`,
    paymentReceived: `/payments-received/${id}`,
    productionOrder: `/production-orders/${id}`,
  };
  return paths[type] || null;
};

const getDocLabel = type => {
  switch (type) {
    case 'quote':
      return 'Quote';
    case 'salesOrder':
      return 'Sales Order';
    case 'deliveryChallan':
      return 'Delivery Challan';
    case 'invoice':
      return 'Invoice';
    case 'paymentReceived':
      return 'Payment Received';
    case 'productionOrder':
      return 'Production Order';
    default:
      return type;
  }
};

/** Map production orders from a sales order into tree nodes (sibling branch to delivery challans). */
const mapProductionOrderNodes = (productionOrders = []) =>
  productionOrders.map(po => ({
    type: 'productionOrder',
    id: po.id ?? po._id,
    displayId: po.productionOrderCode,
    date: po.productionDate,
    status: po.status,
    quantity: po.quantity,
    itemNo: po.itemId?.itemNo,
  }));

/**
 * Card component for each document node
 */
const DocumentCard = ({ node, currentPath, currency }) => {
  const { token } = theme.useToken();
  const path = getDocPath(node.type, node.id);
  const label = node.displayId || node.id || '-';
  const docLabel = getDocLabel(node.type);
  const isCurrentDoc = currentPath === path;

  // Get status label based on module type
  const getStatusLabel = (type, status) => {
    if (!status) return null;
    switch (type) {
      case 'quote':
        return QUOTE_STATUS?.[status] || status;
      case 'salesOrder':
        return SALES_ORDER_STATUS?.[status] || status;
      case 'deliveryChallan':
        return DELIVERY_CHALLAN_STATUS?.[status] || status;
      case 'invoice':
        return INVOICE_STATUS?.[status] || status;
      case 'paymentReceived':
        return PAYMENT_RECEIVED_STATUS?.[status] || status;
      case 'productionOrder':
        return PRODUCTION_MODULE_STATUS?.[status] || status;
      default:
        return status;
    }
  };

  const cardContent = (
    <div
      className={`bg-white rounded-lg border transition-all shadow-sm hover:shadow-md ${
        isCurrentDoc ? 'border-2 shadow-md' : 'border border-gray-200 hover:border-gray-300'
      } ${path ? 'cursor-pointer' : ''}`}
      style={{
        borderColor: isCurrentDoc ? token.colorPrimary : undefined,
        width: '220px',
        display: 'inline-block',
      }}
    >
      {/* Header Section */}
      <div className="bg-gray-50 px-3 py-1 rounded-t-lg border-b border-gray-100">
        <div className="text-xs text-gray-600 font-medium text-center">{docLabel}</div>
      </div>

      {/* Content Section */}
      <div className="px-3 py-2">
        {/* Module ID */}
        <div className="flex justify-center mb-1.5">
          <Tag className="font-semibold">{label}</Tag>
        </div>

        {node.type === 'productionOrder' && node.itemNo && <div className="text-center text-xs text-gray-600 mb-1.5 break-words">Item Number: {node.itemNo}</div>}

        {/* Date */}
        {node.date && (
          <div className="flex items-center justify-center gap-1 mb-1.5">
            <Icons.CalendarOutlined className="text-gray-400" style={{ fontSize: '11px' }} />
            <span className="text-xs text-gray-600">{dateFormateForUi(node.date)}</span>
          </div>
        )}

        {/* Status */}
        {node.status && (
          <div className="flex justify-center mb-1.5">
            <StatusBadge status={node.status} value={getStatusLabel(node.type, node.status)} />
          </div>
        )}

        {/* Amount */}
        {node.amount != null && (
          <div className="mt-2 pt-1.5 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Amount</div>
              <div className="text-sm font-bold text-gray-900">{formatAmount(node.amount, true, currency)}</div>
            </div>
          </div>
        )}

        {/* Quantity (production orders) */}
        {node.quantity != null && node.amount == null && (
          <div className="mt-2 pt-1.5 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Quantity</div>
              <div className="text-sm font-bold text-gray-900">{node.quantity}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return path ? (
    <Link to={path} className="hover:no-underline" style={{ display: 'inline-block' }}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};

/**
 * Recursively render tree nodes using react-organizational-chart
 */
const renderOrgTreeNode = (node, currentPath, currency) => {
  if (!node) return null;

  const hasChildren = node.children?.length > 0;

  if (!hasChildren) {
    return <TreeNode label={<DocumentCard node={node} currentPath={currentPath} currency={currency} />} />;
  }

  return (
    <TreeNode label={<DocumentCard node={node} currentPath={currentPath} currency={currency} />}>
      {node.children.map((child, idx) => (
        <React.Fragment key={`${child.type}-${child.id}-${idx}`}>{renderOrgTreeNode(child, currentPath, currency)}</React.Fragment>
      ))}
    </TreeNode>
  );
};

/**
 * Normalize quote.service buildModuleTree result (root is quote).
 */
const normalizeQuoteTree = tree => {
  const roots = [];
  const q = tree?.quote;
  if (!q) {
    // Array-shaped moduleTree (quotes[], salesOrders[] with deliveryChallans + productionOrders)
    if (tree?.quotes?.length || tree?.salesOrders?.length) {
      return normalizeDeliveryChallanTree(tree);
    }
    return roots;
  }

  const quoteNode = {
    type: 'quote',
    id: q.id,
    displayId: q.quoteId,
    date: q.quoteDate,
    status: q.status,
    amount: q.total,
    children: [],
  };

  if (q.salesOrder) {
    const so = q.salesOrder;
    const soNode = {
      type: 'salesOrder',
      id: so.id,
      displayId: so.orderId,
      date: so.orderDate,
      status: so.status,
      amount: so.total,
      children: [],
    };
    if (so.deliveryChallan?.deliveryChallans?.length) {
      so.deliveryChallan.deliveryChallans.forEach(dc => {
        const dcNode = {
          type: 'deliveryChallan',
          id: dc._id ?? dc.id,
          displayId: dc.challanId,
          date: dc.challanDate,
          status: dc.status,
          amount: dc.total,
          children: [],
        };
        if (dc.invoices?.length) {
          dc.invoices.forEach(inv => {
            const invNode = {
              type: 'invoice',
              id: inv._id ?? inv.id,
              displayId: inv.invoiceId,
              date: inv.invoiceDate,
              status: inv.status,
              amount: inv.total,
              children: [],
            };
            if (inv.payments?.length) {
              invNode.children = inv.payments.map(p => ({
                type: 'paymentReceived',
                id: p._id ?? p.id,
                displayId: p.paymentReceivedId,
                date: p.paymentDate,
                amount: p.amountReceived,
                status: p.status,
              }));
            }
            dcNode.children.push(invNode);
          });
        }
        soNode.children.push(dcNode);
      });
    }
    if (so.productionOrders?.length) {
      soNode.children.push(...mapProductionOrderNodes(so.productionOrders));
    }
    if (so.invoice?.invoices?.length) {
      so.invoice.invoices.forEach(inv => {
        const invNode = {
          type: 'invoice',
          id: inv._id ?? inv.id,
          displayId: inv.invoiceId,
          date: inv.invoiceDate,
          status: inv.status,
          amount: inv.total,
          children: [],
        };
        if (so.invoice.paymentReceive?.paymentReceives?.length) {
          invNode.children = so.invoice.paymentReceive.paymentReceives.map(p => ({
            type: 'paymentReceived',
            id: p._id ?? p.id,
            displayId: p.paymentReceivedId,
            date: p.paymentDate,
            status: p.status,
            amount: p.amountReceived,
          }));
        }
        soNode.children.push(invNode);
      });
    }
    quoteNode.children.push(soNode);
  }

  if (q.invoice?.invoices?.length) {
    q.invoice.invoices.forEach(inv => {
      const invNode = {
        type: 'invoice',
        id: inv._id ?? inv.id,
        displayId: inv.invoiceId,
        date: inv.invoiceDate,
        status: inv.status,
        amount: inv.total,
        children: [],
      };
      if (q.invoice.paymentReceive?.paymentReceives?.length) {
        invNode.children = q.invoice.paymentReceive.paymentReceives.map(p => ({
          type: 'paymentReceived',
          id: p._id ?? p.id,
          displayId: p.paymentReceivedId,
          date: p.paymentDate,
          status: p.status,
          amount: p.amountReceived,
        }));
      }
      quoteNode.children.push(invNode);
    });
  }

  roots.push(quoteNode);
  return roots;
};

/**
 * Normalize salesOrder.service buildModuleTree (root is quote or salesOrder).
 */
const normalizeSalesOrderTree = tree => {
  const roots = [];
  if (tree?.quote?.salesOrder) {
    const q = tree.quote;
    const so = q.salesOrder;
    const soNode = {
      type: 'salesOrder',
      id: so.id ?? so._id,
      displayId: so.orderId,
      date: so.orderDate,
      status: so.status,
      amount: so.total,
      children: [],
    };
    if (so.deliveryChallan?.deliveryChallans?.length) {
      so.deliveryChallan.deliveryChallans.forEach(dc => {
        const dcNode = {
          type: 'deliveryChallan',
          id: dc._id ?? dc.id,
          displayId: dc.challanId,
          date: dc.challanDate,
          status: dc.status,
          amount: dc.total,
          children: [],
        };
        const invList = dc.invoices;
        if (invList?.length) {
          invList.forEach(inv => {
            dcNode.children.push({
              type: 'invoice',
              id: inv._id ?? inv.id,
              displayId: inv.invoiceId,
              date: inv.invoiceDate,
              status: inv.status,
              amount: inv.total,
              children: (inv.payments || []).map(p => ({
                type: 'paymentReceived',
                id: p._id ?? p.id,
                displayId: p.paymentReceivedId,
                date: p.paymentDate,
                status: p.status,
                amount: p.amountReceived,
              })),
            });
          });
        }
        soNode.children.push(dcNode);
      });
    }
    if (so.productionOrders?.length) {
      soNode.children.push(...mapProductionOrderNodes(so.productionOrders));
    }
    if (so.invoice?.invoices?.length) {
      so.invoice.invoices.forEach(inv => {
        soNode.children.push({
          type: 'invoice',
          id: inv._id ?? inv.id,
          displayId: inv.invoiceId,
          date: inv.invoiceDate,
          status: inv.status,
          amount: inv.total,
          children: (so.invoice.paymentReceive?.paymentReceives || []).map(p => ({
            type: 'paymentReceived',
            id: p._id ?? p.id,
            displayId: p.paymentReceivedId,
            date: p.paymentDate,
            status: p.status,
            amount: p.amountReceived,
          })),
        });
      });
    }
    roots.push({
      type: 'quote',
      id: q.id,
      displayId: q.quoteId,
      date: q.quoteDate,
      status: q.status,
      amount: q.total,
      children: [soNode],
    });
  }
  if (tree?.salesOrder) {
    const so = tree.salesOrder;
    const soNode = {
      type: 'salesOrder',
      id: so.id ?? so._id,
      displayId: so.orderId,
      date: so.orderDate,
      status: so.status,
      amount: so.total,
      children: [],
    };
    if (so.deliveryChallan?.deliveryChallans?.length) {
      so.deliveryChallan.deliveryChallans.forEach(dc => {
        const dcNode = {
          type: 'deliveryChallan',
          id: dc._id ?? dc.id,
          displayId: dc.challanId,
          date: dc.challanDate,
          status: dc.status,
          amount: dc.total,
          children: [],
        };
        const invList = dc.invoices;
        if (invList?.length) {
          invList.forEach(inv => {
            dcNode.children.push({
              type: 'invoice',
              id: inv._id ?? inv.id,
              displayId: inv.invoiceId,
              date: inv.invoiceDate,
              status: inv.status,
              amount: inv.total,
              children: (inv.payments || []).map(p => ({
                type: 'paymentReceived',
                id: p._id ?? p.id,
                displayId: p.paymentReceivedId,
                date: p.paymentDate,
                status: p.status,
                amount: p.amountReceived,
              })),
            });
          });
        }
        soNode.children.push(dcNode);
      });
    }
    if (so.productionOrders?.length) {
      soNode.children.push(...mapProductionOrderNodes(so.productionOrders));
    }
    if (so.invoice?.invoices?.length) {
      so.invoice.invoices.forEach(inv => {
        soNode.children.push({
          type: 'invoice',
          id: inv._id ?? inv.id,
          displayId: inv.invoiceId,
          date: inv.invoiceDate,
          status: inv.status,
          amount: inv.total,
          children: (so.invoice.paymentReceive?.paymentReceives || []).map(p => ({
            type: 'paymentReceived',
            id: p._id ?? p.id,
            displayId: p.paymentReceivedId,
            date: p.paymentDate,
            status: p.status,
            amount: p.amountReceived,
          })),
        });
      });
    }
    roots.push(soNode);
  }
  // Array-shaped moduleTree (quotes[], salesOrders[] with deliveryChallans + productionOrders)
  if (!roots.length && (tree?.quotes?.length || tree?.salesOrders?.length)) {
    return normalizeDeliveryChallanTree(tree);
  }
  return roots;
};

/**
 * Normalize deliveryChallan.service buildModuleTree (quotes[], salesOrders[], deliveryChallan?).
 */
const normalizeDeliveryChallanTree = tree => {
  const roots = [];
  (tree?.quotes || []).forEach(q => {
    const quoteNode = {
      type: 'quote',
      id: q.id,
      displayId: q.quoteId,
      date: q.quoteDate,
      status: q.status,
      amount: q.total,
      children: (q.salesOrders || []).map(so => ({
        type: 'salesOrder',
        id: so.id,
        displayId: so.orderId,
        date: so.orderDate,
        status: so.status,
        amount: so.total,
        children: [
          ...(so.deliveryChallans || []).map(dc => ({
            type: 'deliveryChallan',
            id: dc.id,
            displayId: dc.challanId,
            date: dc.challanDate,
            status: dc.status,
            amount: dc.total,
            children: (dc.invoices || []).flatMap(inv => [
              {
                type: 'invoice',
                id: inv.id,
                displayId: inv.invoiceId,
                date: inv.invoiceDate,
                status: inv.status,
                amount: inv.total,
                children: (inv.payments || []).map(p => ({
                  type: 'paymentReceived',
                  id: p._id ?? p.id,
                  displayId: p.paymentReceivedId,
                  date: p.paymentDate,
                  status: p.status,
                  amount: p.amountReceived,
                })),
              },
            ]),
          })),
          ...mapProductionOrderNodes(so.productionOrders),
        ],
      })),
    };
    roots.push(quoteNode);
  });
  (tree?.salesOrders || []).forEach(so => {
    roots.push({
      type: 'salesOrder',
      id: so.id,
      displayId: so.orderId,
      date: so.orderDate,
      status: so.status,
      amount: so.total,
      children: [
        ...(so.deliveryChallans || []).map(dc => ({
          type: 'deliveryChallan',
          id: dc.id,
          displayId: dc.challanId,
          date: dc.challanDate,
          status: dc.status,
          amount: dc.total,
          children: (dc.invoices || []).flatMap(inv => [
            {
              type: 'invoice',
              id: inv.id,
              displayId: inv.invoiceId,
              date: inv.invoiceDate,
              status: inv.status,
              amount: inv.total,
              children: (inv.payments || []).map(p => ({
                type: 'paymentReceived',
                id: p._id ?? p.id,
                displayId: p.paymentReceivedId,
                date: p.paymentDate,
                status: p.status,
                amount: p.amountReceived,
              })),
            },
          ]),
        })),
        ...mapProductionOrderNodes(so.productionOrders),
      ],
    });
  });
  if (tree?.deliveryChallan) {
    const dc = tree.deliveryChallan;
    roots.push({
      type: 'deliveryChallan',
      id: dc.id,
      displayId: dc.challanId,
      date: dc.challanDate,
      status: dc.status,
      amount: dc.total,
      children: (dc.invoices || []).flatMap(inv => [
        {
          type: 'invoice',
          id: inv.id,
          displayId: inv.invoiceId,
          date: inv.invoiceDate,
          status: inv.status,
          amount: inv.total,
          children: (inv.payments || []).map(p => ({
            type: 'paymentReceived',
            id: p._id ?? p.id,
            displayId: p.paymentReceivedId,
            date: p.paymentDate,
            status: p.status,
            amount: p.amountReceived,
          })),
        },
      ]),
    });
  }
  return roots;
};

/**
 * Normalize invoice.service buildModuleTree (quotes[], salesOrders[], invoice?).
 */
const normalizeInvoiceTree = tree => {
  const roots = [];
  const addInvoiceNode = inv => ({
    type: 'invoice',
    id: inv.id ?? inv._id,
    displayId: inv.invoiceId,
    date: inv.invoiceDate,
    status: inv.status,
    amount: inv.total,
    children: (inv.payments || []).map(p => ({
      type: 'paymentReceived',
      id: p._id ?? p.id,
      displayId: p.paymentReceivedId,
      date: p.paymentDate,
      status: p.status,
      amount: p.amountReceived,
    })),
  });

  (tree?.quotes || []).forEach(q => {
    const quoteNode = {
      type: 'quote',
      id: q.id,
      displayId: q.quoteId,
      date: q.quoteDate,
      status: q.status,
      amount: q.total,
      children: [],
    };
    if (q.salesOrders?.length) {
      q.salesOrders.forEach(so => {
        const soNode = {
          type: 'salesOrder',
          id: so.id,
          displayId: so.orderId,
          date: so.orderDate,
          status: so.status,
          amount: so.total,
          children: [],
        };
        // Add delivery challans with their invoices
        so.deliveryChallans?.forEach(dc => {
          const dcNode = {
            type: 'deliveryChallan',
            id: dc.id ?? dc._id,
            displayId: dc.challanId,
            date: dc.challanDate,
            status: dc.status,
            amount: dc.total,
            children: [],
          };
          dc.invoices?.forEach(inv => dcNode.children.push(addInvoiceNode(inv)));
          soNode.children.push(dcNode);
        });
        // Add production orders as a sibling branch under sales order
        if (so.productionOrders?.length) {
          soNode.children.push(...mapProductionOrderNodes(so.productionOrders));
        }
        // Add direct invoices from sales order
        so.invoices?.forEach(inv => soNode.children.push(addInvoiceNode(inv)));
        quoteNode.children.push(soNode);
      });
    }
    if (q.invoices?.length) {
      q.invoices.forEach(inv => quoteNode.children.push(addInvoiceNode(inv)));
    }
    if (quoteNode.children.length) roots.push(quoteNode);
  });

  (tree?.salesOrders || []).forEach(so => {
    const soNode = {
      type: 'salesOrder',
      id: so.id,
      displayId: so.orderId,
      date: so.orderDate,
      status: so.status,
      amount: so.total,
      children: [],
    };
    // Add delivery challans with their invoices
    so.deliveryChallans?.forEach(dc => {
      const dcNode = {
        type: 'deliveryChallan',
        id: dc.id ?? dc._id,
        displayId: dc.challanId,
        date: dc.challanDate,
        status: dc.status,
        amount: dc.total,
        children: [],
      };
      dc.invoices?.forEach(inv => {
        dcNode.children.push(addInvoiceNode(inv));
      });
      soNode.children.push(dcNode);
    });
    // Add production orders as a sibling branch under sales order
    if (so.productionOrders?.length) {
      soNode.children.push(...mapProductionOrderNodes(so.productionOrders));
    }
    // Add direct invoices from sales order
    so.invoices?.forEach(inv => soNode.children.push(addInvoiceNode(inv)));
    if (soNode.children.length) roots.push(soNode);
  });

  if (tree?.invoice) {
    roots.push(addInvoiceNode(tree.invoice));
  }
  return roots;
};

/**
 * Normalize paymentReceived.service buildModuleTree (quotes[], salesOrders[], invoice?, payment?).
 */
const normalizePaymentReceivedTree = tree => {
  const roots = normalizeInvoiceTree(tree);
  if (tree?.payment && !roots.length) {
    roots.push({
      type: 'paymentReceived',
      id: tree.payment.id,
      displayId: tree.payment.paymentReceivedId,
      date: tree.payment.paymentDate,
      status: tree.payment.status,
      amount: tree.payment.amountReceived,
    });
  }
  return roots;
};

const hasTreeData = moduleTree => {
  if (!moduleTree || typeof moduleTree !== 'object') return false;
  if (moduleTree.quote && (moduleTree.quote.salesOrder || moduleTree.quote.invoice)) return true;
  if (moduleTree.salesOrder) return true;
  if (Array.isArray(moduleTree.quotes) && moduleTree.quotes.length) return true;
  if (Array.isArray(moduleTree.salesOrders) && moduleTree.salesOrders.length) return true;
  if (moduleTree.deliveryChallan) return true;
  if (moduleTree.invoice) return true;
  if (moduleTree.payment) return true;
  return false;
};

/**
 * SalesModuleTreeView
 * @param {Object} props
 * @param {Object} props.moduleTree - moduleTree from getById API (quote, salesOrder, deliveryChallan, invoice, paymentReceived)
 * @param {string} props.sourceModule - 'quote' | 'salesOrder' | 'deliveryChallan' | 'invoice' | 'paymentReceived'
 * @param {Object} [props.currency] - document currency ({ symbol, code, format, decimalPlaces })
 */
const SalesModuleTreeView = ({ moduleTree, sourceModule = 'quote', currency }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (!hasTreeData(moduleTree)) {
    return (
      <div className="my-container p-8 text-center">
        <div className="inline-flex flex-col items-center gap-3 text-gray-400">
          <Icons.ApartmentOutlined style={{ fontSize: '48px' }} />
          <p className="text-sm font-medium">No linked documents in this flow</p>
          <p className="text-xs text-gray-400">This document hasn't been linked to other documents yet</p>
        </div>
      </div>
    );
  }

  let roots = [];
  switch (sourceModule) {
    case 'quote':
      roots = normalizeQuoteTree(moduleTree);
      break;
    case 'salesOrder':
      roots = normalizeSalesOrderTree(moduleTree);
      break;
    case 'deliveryChallan':
      roots = normalizeDeliveryChallanTree(moduleTree);
      break;
    case 'invoice':
      roots = normalizeInvoiceTree(moduleTree);
      break;
    case 'paymentReceived':
      roots = normalizePaymentReceivedTree(moduleTree);
      break;
    default:
      roots =
        normalizeQuoteTree(moduleTree)?.length > 0
          ? normalizeQuoteTree(moduleTree)
          : normalizeSalesOrderTree(moduleTree)?.length > 0
            ? normalizeSalesOrderTree(moduleTree)
            : normalizeDeliveryChallanTree(moduleTree)?.length > 0
              ? normalizeDeliveryChallanTree(moduleTree)
              : normalizeInvoiceTree(moduleTree)?.length > 0
                ? normalizeInvoiceTree(moduleTree)
                : normalizePaymentReceivedTree(moduleTree);
  }

  if (!roots.length) {
    return (
      <div className="my-container p-8 text-center">
        <div className="inline-flex flex-col items-center gap-3 text-gray-400">
          <Icons.ApartmentOutlined style={{ fontSize: '48px' }} />
          <p className="text-sm font-medium">No linked documents in this flow</p>
          <p className="text-xs text-gray-400">This document hasn't been linked to other documents yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-container p-4 bg-white">
      {/* Compact Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Related Documents</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">Quote → SO → DC / Production → Invoice → Payment</span>
          </div>
        </div>
      </div>

      {/* Tree Content using React Organizational Chart */}
      <div className="overflow-x-auto pb-4">
        <style>
          {`
            .react-organizational-chart {
              display: flex;
              justify-content: center;
              padding: 0 20px;
            }
            .org-tree-node {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .org-tree-node-label {
              display: flex;
              justify-content: center;
            }
            .org-tree-node-children {
              display: flex;
              justify-content: center;
              padding-top: 20px;
            }
          `}
        </style>
        <div className="flex justify-center gap-8 px-4 min-w-max">
          {roots.map((rootNode, idx) => (
            <div key={`root-${rootNode.type}-${rootNode.id}-${idx}`}>
              <Tree lineWidth="2px" lineColor="#d1d5db" lineBorderRadius="4px" nodePadding="40px" label={<DocumentCard node={rootNode} currentPath={currentPath} currency={currency} />}>
                {rootNode.children?.map((child, childIdx) => (
                  <React.Fragment key={`${child.type}-${child.id}-${childIdx}`}>{renderOrgTreeNode(child, currentPath, currency)}</React.Fragment>
                ))}
              </Tree>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesModuleTreeView;
