import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'antd';

// Extras
import Icons from '@/assets/icons/icon';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = location.state?.historyStack || [];

  const handleBack = () => {
    const last = historyStack[historyStack.length - 1];
    const historyIndex = window.history.state?.idx;

    // New tabs have no browser history. Walk the stack passed in from the page that opened this one.
    if ((historyIndex == null || historyIndex <= 0) && last && last !== location.pathname) {
      navigate(last, {
        replace: true,
        state: {
          prevFrom: location.pathname,
          historyStack: historyStack.slice(0, -1),
        },
      });
      return;
    }

    // Cross-navigation rules first

    // Quote Detail → Sales Order Detail
    if (last?.startsWith('/quotes/') && location.pathname.startsWith('/sales-orders/')) {
      navigate(-1);
      return;
    }
    // Sales Order Detail → Quote Detail
    if (last?.startsWith('/sales-orders/') && location.pathname.startsWith('/quotes/')) {
      navigate(-1);
      return;
    }

    // Quote Detail → Add Sales Order → Sales Order Detail (should go back to Quote Detail)
    if (last === '/sales-orders/new' && location.pathname.startsWith('/sales-orders/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/quotes/')) {
        navigate(-2);
        return;
      }
      // Default: Quote View → Add Sales Order → Sales Order Detail
      navigate(-2);
      return;
    }

    // Quote → Add Invoice → Invoice Detail
    if (last === '/invoices/new' && location.pathname.startsWith('/invoices/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/quotes/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Sales Order → Add Delivery Challan → Delivery Challan Detail
    if (last === '/delivery-challans/new' && location.pathname.startsWith('/delivery-challans/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/sales-orders/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Sales Order → Add Invoice → Invoice Detail
    if (last === '/invoices/new' && location.pathname.startsWith('/invoices/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/sales-orders/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Delivery Challan → Add Invoice → Invoice Detail
    if (last === '/invoices/new' && location.pathname.startsWith('/invoices/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/delivery-challans/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Rejection Order → Add Invoice → (Invoice New Form back button)
    if (last?.startsWith('/rejection-orders/') && location.pathname === '/invoices/new') {
      navigate(last);
      return;
    }

    // Rejection Order → Add Credit Note → (Credit Note New Form back button)
    if (last?.startsWith('/rejection-orders/') && location.pathname === '/credit-notes/new') {
      navigate(last);
      return;
    }

    // Rejection Order Detail → always back to list
    if (location.pathname.startsWith('/rejection-orders/')) {
      navigate('/rejection-orders');
      return;
    }

    // Purchase Order  → Add GRPO → GRPO Detail
    if (last === '/grpo/new' && location.pathname.startsWith('/grpo/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/purchase-orders/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Purchase Order  → Add Bill → Bill Detail
    if (last === '/bills/new' && location.pathname.startsWith('/bills/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/purchase-orders/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // GRPO → Add Bill → Bill Detail
    if (last === '/bills/new' && location.pathname.startsWith('/bills/')) {
      const beforeAdd = historyStack[historyStack.length - 2];
      if (beforeAdd?.startsWith('/grpo/')) {
        navigate(-2);
        return;
      }
      navigate(-2);
      return;
    }

    // Quality master rules
    if (location.pathname.startsWith('/quality-master/')) {
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }
    // Item master rules
    if (location.pathname.startsWith('/item-master/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/item-master' && beforeEdit?.startsWith('/item-master/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Division master rules
    if (location.pathname.startsWith('/division/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/division' && beforeEdit?.startsWith('/division/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Branch master rules
    if (location.pathname.startsWith('/branch/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/branch' && beforeEdit?.startsWith('/branch/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Warehouse master rules
    if (location.pathname.startsWith('/warehouse-master/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/warehouse-master' && beforeEdit?.startsWith('/warehouse-master/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Price list master rules
    if (location.pathname.startsWith('/price-list/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/price-list' && beforeEdit?.startsWith('/price-list/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Inventory adjustment rules
    if (location.pathname.startsWith('/inventory-adjustment/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/inventory-adjustment' && beforeEdit?.startsWith('/inventory-adjustment/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Manual journal rules
    if (location.pathname.startsWith('/manual-journal/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/manual-journal' && beforeEdit?.startsWith('/manual-journal/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Recurring bills rules
    if (location.pathname.startsWith('/recurring-bills/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/recurring-bills' && beforeEdit?.startsWith('/recurring-bills/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Recurring expenses rules
    if (location.pathname.startsWith('/recurring-expenses/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/recurring-expenses' && beforeEdit?.startsWith('/recurring-expenses/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Expenses rules
    if (location.pathname.startsWith('/expenses/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/expenses' && beforeEdit?.startsWith('/expenses/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Recurring invoices rules
    if (location.pathname.startsWith('/recurring-invoices/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/recurring-invoices' && beforeEdit?.startsWith('/recurring-invoices/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Item group master rules
    if (location.pathname.startsWith('/item-group-master/')) {
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/item-group-master' && beforeEdit?.startsWith('/item-group-master/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Customer master rules
    if (location.pathname.startsWith('/customer-master/') || location.pathname.startsWith('/vendors/')) {
      const listPath = location.pathname.startsWith('/vendors/') ? '/vendors' : '/customer-master';
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === listPath && beforeEdit?.startsWith(`${listPath}/`)) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
    }

    // Quote Detail → Sales Order Detail
    if (last?.startsWith('/quotes/') && location.pathname.startsWith('/sales-orders/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/quotes/') && location.pathname.startsWith('/invoices/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/sales-orders/') && location.pathname.startsWith('/quotes/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/sales-orders/') && location.pathname.startsWith('/delivery-challans/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/sales-orders/') && location.pathname.startsWith('/invoices/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/delivery-challans/') && location.pathname.startsWith('/sales-orders/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/delivery-challans/') && location.pathname.startsWith('/invoices/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/invoices/') && location.pathname.startsWith('/quotes/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/invoices/') && location.pathname.startsWith('/delivery-challans/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/purchase-orders/') && location.pathname.startsWith('/grpo/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/purchase-orders/') && location.pathname.startsWith('/bills/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/grpo/') && location.pathname.startsWith('/bills/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/grpo/') && location.pathname.startsWith('/purchase-orders/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/bills/') && location.pathname.startsWith('/grpo/')) {
      navigate(-1);
      return;
    }

    if (last?.startsWith('/bills/') && location.pathname.startsWith('/purchase-orders/')) {
      navigate(-1);
      return;
    }

    // Quotes rules
    if (location.pathname.startsWith('/quotes/')) {
      if (last === '/quotes/new') {
        navigate('/quotes');
        return;
      }
      // Check for View → Detail → Edit → Detail scenario first (navigate -3)
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/quotes' && beforeEdit?.startsWith('/quotes/')) {
          // View → Detail → Edit → Detail: go back to View
          navigate(-3);
          return;
        }
      }
      // Standard Edit → Detail scenario (navigate -2)
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      // Multiple edit cycles
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/quotes') {
        navigate(-1);
        return;
      }
    }

    // Sales Orders rules
    if (location.pathname.startsWith('/sales-orders/')) {
      if (last === '/sales-orders/new') {
        navigate('/sales-orders');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/sales-orders' && beforeEdit?.startsWith('/sales-orders/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/sales-orders') {
        navigate(-1);
        return;
      }
    }

    // Delivery Challan rules
    if (location.pathname.startsWith('/delivery-challans/')) {
      if (last === '/delivery-challans/new') {
        navigate('/delivery-challans');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/delivery-challans' && beforeEdit?.startsWith('/delivery-challans/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/delivery-challans') {
        navigate(-1);
        return;
      }
    }

    // Invoice rules
    if (location.pathname.startsWith('/invoices/')) {
      if (last === '/invoices/new') {
        navigate('/invoices');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/invoices' && beforeEdit?.startsWith('/invoices/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/invoices') {
        navigate(-1);
        return;
      }
    }

    // Payment Received rules
    if (location.pathname.startsWith('/payments-received/')) {
      if (last === '/payments-received/new') {
        navigate('/payments-received');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/payments-received' && beforeEdit?.startsWith('/payments-received/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/payments-received') {
        navigate(-1);
        return;
      }
    }

    // Credit Note rules
    if (location.pathname.startsWith('/credit-notes/')) {
      if (last === '/credit-notes/new') {
        navigate('/credit-notes');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/credit-notes' && beforeEdit?.startsWith('/credit-notes/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/credit-notes') {
        navigate(-1);
        return;
      }
    }

    // Purchase Order rules
    if (location.pathname.startsWith('/purchase-orders/')) {
      if (last === '/purchase-orders/new') {
        navigate('/purchase-orders');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/purchase-orders' && beforeEdit?.startsWith('/purchase-orders/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/purchase-orders') {
        navigate(-1);
        return;
      }
    }

    // GRPO rules
    if (location.pathname.startsWith('/grpo/')) {
      if (last === '/grpo/new') {
        navigate('/grpo');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/grpo' && beforeEdit?.startsWith('/grpo/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/grpo') {
        navigate(-1);
        return;
      }
    }

    // Bills rules
    if (location.pathname.startsWith('/bills/')) {
      if (last === '/bills/new') {
        navigate('/bills');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/bills' && beforeEdit?.startsWith('/bills/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/bills') {
        navigate(-1);
        return;
      }
    }

    // Payment Made rules
    if (location.pathname.startsWith('/payments-made/')) {
      if (last === '/payments-made/new') {
        navigate('/payments-made');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/payments-made' && beforeEdit?.startsWith('/payments-made/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/payments-made') {
        navigate(-1);
        return;
      }
    }

    // Debit Note routes
    if (location.pathname.startsWith('/debit-notes/')) {
      if (last === '/debit-notes/new') {
        navigate('/debit-notes');
        return;
      }
      if (last?.endsWith('/edit') && historyStack.length >= 3) {
        const beforeEdit = historyStack[historyStack.length - 2];
        const beforeDetail = historyStack[historyStack.length - 3];
        if (beforeDetail === '/debit-notes' && beforeEdit?.startsWith('/debit-notes/')) {
          navigate(-3);
          return;
        }
      }
      if (last?.endsWith('/edit')) {
        navigate(-2);
        return;
      }
      if (historyStack.filter(h => h.endsWith('/edit')).length > 1) {
        navigate(-3);
        return;
      }
      if (last === '/debit-notes') {
        navigate(-1);
        return;
      }
    }

    navigate(-1);
  };

  return <Button onClick={handleBack} icon={<Icons.ArrowLeftOutlined />} type="default" size="middle" className="flex items-center justify-center" />;
}
