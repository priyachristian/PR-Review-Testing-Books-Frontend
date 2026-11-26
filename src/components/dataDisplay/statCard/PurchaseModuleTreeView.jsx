import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tag, theme } from 'antd';
import { Tree, TreeNode } from 'react-organizational-chart';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Extras
import Icons from 'assets/icons/icon';
import { BILL_STATUS, GRPO_STATUS, PAYMENT_MADE_STATUS, PURCHASE_ORDER_STATUS } from 'utils/constants';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi } from 'utils/services';

/**
 * Builds a flat tree structure from backend moduleTree for display.
 * Handles shapes from: purchaseOrder, grpoOrder, bill, paymentMade services.
 */
const getDocPath = (type, id) => {
  if (!id) return null;
  const paths = {
    purchaseOrder: `/purchase-orders/${id}`,
    grpo: `/grpo/${id}`,
    bill: `/bills/${id}`,
    paymentMade: `/payments-made/${id}`,
  };
  return paths[type] || null;
};

const getDocLabel = type => {
  switch (type) {
    case 'purchaseOrder':
      return 'Purchase Order';
    case 'grpo':
      return 'GRPO';
    case 'bill':
      return 'Bill';
    case 'paymentMade':
      return 'Payment Made';
    default:
      return type;
  }
};

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
      case 'purchaseOrder':
        return PURCHASE_ORDER_STATUS?.[status] || status;
      case 'grpo':
        return GRPO_STATUS?.[status] || status;
      case 'bill':
        return BILL_STATUS?.[status] || status;
      case 'paymentMade':
        return PAYMENT_MADE_STATUS?.[status] || status;
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
 * Normalize purchaseOrder.service buildModuleTree result (root is purchaseOrder).
 */
const normalizePurchaseOrderTree = tree => {
  const roots = [];
  const po = tree?.purchaseOrder;
  if (!po) return roots;

  const poNode = {
    type: 'purchaseOrder',
    id: po.id,
    displayId: po.purchaseOrderId,
    date: po.date,
    status: po.status,
    amount: po.total,
    children: [],
  };

  // GRPO Path
  if (po.grpo?.grpos?.length) {
    po.grpo.grpos.forEach(grpo => {
      const grpoNode = {
        type: 'grpo',
        id: grpo._id ?? grpo.id,
        displayId: grpo.grpoOrderId,
        date: grpo.date,
        status: grpo.status,
        amount: grpo.total,
        children: [],
      };

      // Bills from GRPO
      if (po.grpo.bill?.bills?.length) {
        po.grpo.bill.bills.forEach(bill => {
          const billNode = {
            type: 'bill',
            id: bill._id ?? bill.id,
            displayId: bill.billId,
            date: bill.billDate,
            status: bill.status,
            amount: bill.total,
            children: [],
          };

          // Payments from Bills
          if (po.grpo.bill.paymentMade?.paymentMades?.length) {
            billNode.children = po.grpo.bill.paymentMade.paymentMades.map(payment => ({
              type: 'paymentMade',
              id: payment._id ?? payment.id,
              displayId: payment.paymentMadeId,
              date: payment.paymentDate,
              status: payment.status,
              amount: payment.paymentMade,
            }));
          }

          grpoNode.children.push(billNode);
        });
      }

      poNode.children.push(grpoNode);
    });
  }

  // Direct Bill Path (PO → Bill)
  if (po.bill?.bills?.length) {
    po.bill.bills.forEach(bill => {
      const billNode = {
        type: 'bill',
        id: bill._id ?? bill.id,
        displayId: bill.billId,
        date: bill.billDate,
        status: bill.status,
        amount: bill.total,
        children: [],
      };

      // Payments from Direct Bills
      if (po.bill.paymentMade?.paymentMades?.length) {
        billNode.children = po.bill.paymentMade.paymentMades.map(payment => ({
          type: 'paymentMade',
          id: payment._id ?? payment.id,
          displayId: payment.paymentMadeId,
          date: payment.paymentDate,
          status: payment.status,
          amount: payment.paymentMade,
        }));
      }

      poNode.children.push(billNode);
    });
  }

  roots.push(poNode);
  return roots;
};

/**
 * Normalize grpoOrder.service buildModuleTree result.
 */
const normalizeGrpoTree = tree => {
  const roots = [];

  (tree?.purchaseOrders || []).forEach(po => {
    const poNode = {
      type: 'purchaseOrder',
      id: po.id,
      displayId: po.purchaseOrderId,
      date: po.date,
      status: po.status,
      amount: po.total,
      children: [],
    };

    (po.grpos || []).forEach(grpo => {
      const grpoNode = {
        type: 'grpo',
        id: grpo.id,
        displayId: grpo.grpoId,
        date: grpo.date,
        status: grpo.status,
        amount: grpo.total,
        children: [],
      };

      (grpo.bills || []).forEach(bill => {
        const billNode = {
          type: 'bill',
          id: bill.id,
          displayId: bill.billId,
          date: bill.billDate,
          status: bill.status,
          amount: bill.total,
          children: (bill.payments || []).map(payment => ({
            type: 'paymentMade',
            id: payment.id,
            displayId: payment.paymentMadeId,
            date: payment.paymentDate,
            status: payment.status,
            amount: payment.paymentMade,
          })),
        };

        grpoNode.children.push(billNode);
      });

      poNode.children.push(grpoNode);
    });

    roots.push(poNode);
  });

  return roots;
};

/**
 * Normalize bill.service buildModuleTree result.
 */
const normalizeBillTree = tree => {
  const roots = [];

  (tree?.purchaseOrders || []).forEach(po => {
    const poNode = {
      type: 'purchaseOrder',
      id: po.id,
      displayId: po.purchaseOrderId,
      date: po.date,
      status: po.status,
      amount: po.total,
      children: [],
    };

    // Bills from GRPO
    if (po.grpos?.length) {
      po.grpos.forEach(grpo => {
        const grpoNode = {
          type: 'grpo',
          id: grpo.id,
          displayId: grpo.grpoId,
          date: grpo.date,
          status: grpo.status,
          amount: grpo.total,
          children: [],
        };

        (grpo.bills || []).forEach(bill => {
          const billNode = {
            type: 'bill',
            id: bill.id,
            displayId: bill.billId,
            date: bill.billDate,
            status: bill.status,
            amount: bill.total,
            children: (bill.payments || []).map(payment => ({
              type: 'paymentMade',
              id: payment.id,
              displayId: payment.paymentMadeId,
              date: payment.paymentDate,
              status: payment.status,
              amount: payment.paymentMade,
            })),
          };

          grpoNode.children.push(billNode);
        });

        poNode.children.push(grpoNode);
      });
    }

    // Direct Bills (PO → Bill)
    if (po.bills?.length) {
      po.bills.forEach(bill => {
        const billNode = {
          type: 'bill',
          id: bill.id,
          displayId: bill.billId,
          date: bill.billDate,
          status: bill.status,
          amount: bill.total,
          children: (bill.payments || []).map(payment => ({
            type: 'paymentMade',
            id: payment.id,
            displayId: payment.paymentMadeId,
            date: payment.paymentDate,
            status: payment.status,
            amount: payment.paymentMade,
          })),
        };

        poNode.children.push(billNode);
      });
    }

    if (poNode.children.length) roots.push(poNode);
  });

  // Direct Bill (No PO) - handle both 'directBill' and 'bill' properties
  const directBill = tree?.directBill || tree?.bill;
  if (directBill) {
    roots.push({
      type: 'bill',
      id: directBill.id,
      displayId: directBill.billId,
      date: directBill.billDate,
      status: directBill.status,
      amount: directBill.total,
      children: (directBill.payments || []).map(payment => ({
        type: 'paymentMade',
        id: payment.id,
        displayId: payment.paymentMadeId,
        date: payment.paymentDate,
        status: payment.status,
        amount: payment.paymentMade,
      })),
    });
  }

  return roots;
};

/**
 * Normalize paymentMade.service buildModuleTree result.
 */
const normalizePaymentMadeTree = tree => {
  const roots = normalizeBillTree(tree);

  // Direct Payment (No Bill)
  if (tree?.payment && !roots.length) {
    roots.push({
      type: 'paymentMade',
      id: tree.payment.id,
      displayId: tree.payment.paymentMadeId,
      date: tree.payment.paymentDate,
      status: tree.payment.status,
      amount: tree.payment.paymentMade,
    });
  }

  return roots;
};

const hasTreeData = moduleTree => {
  if (!moduleTree || typeof moduleTree !== 'object') return false;
  if (moduleTree.purchaseOrder) return true;
  if (Array.isArray(moduleTree.purchaseOrders) && moduleTree.purchaseOrders.length) return true;
  if (moduleTree.directBill) return true;
  if (moduleTree.bill) return true; // Added this line
  if (moduleTree.payment) return true;
  return false;
};

/**
 * PurchaseModuleTreeView
 * @param {Object} props
 * @param {Object} props.moduleTree - moduleTree from getById API (purchaseOrder, grpoOrder, bill, paymentMade)
 * @param {string} props.sourceModule - 'purchaseOrder' | 'grpo' | 'bill' | 'paymentMade'
 * @param {Object} [props.currency] - document currency ({ symbol, code, format, decimalPlaces })
 */
const PurchaseModuleTreeView = ({ moduleTree, sourceModule = 'purchaseOrder', currency }) => {
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
    case 'purchaseOrder':
      roots = normalizePurchaseOrderTree(moduleTree);
      break;
    case 'grpo':
      roots = normalizeGrpoTree(moduleTree);
      break;
    case 'bill':
      roots = normalizeBillTree(moduleTree);
      break;
    case 'paymentMade':
      roots = normalizePaymentMadeTree(moduleTree);
      break;
    default:
      roots =
        normalizePurchaseOrderTree(moduleTree)?.length > 0
          ? normalizePurchaseOrderTree(moduleTree)
          : normalizeGrpoTree(moduleTree)?.length > 0
            ? normalizeGrpoTree(moduleTree)
            : normalizeBillTree(moduleTree)?.length > 0
              ? normalizeBillTree(moduleTree)
              : normalizePaymentMadeTree(moduleTree);
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
            <span className="bg-gray-100 px-2 py-1 rounded">PO → GRPO → Bill → Payment Made</span>
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
              <Tree lineWidth="2px" lineColor="#d1d5db" lineBorderRadius="4px" label={<DocumentCard node={rootNode} currentPath={currentPath} currency={currency} />}>
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

export default PurchaseModuleTreeView;
