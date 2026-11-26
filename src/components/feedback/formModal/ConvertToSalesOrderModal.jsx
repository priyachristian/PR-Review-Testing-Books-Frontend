// Components
import SelectDocumentLocationModal from './SelectDocumentLocationModal';

// Hooks
import { useCustomerOrders } from '@/features/sales/customerOrder';

// Utils
import { RESOURCES } from '@/utils/jsonFile';

const ConvertToSalesOrderModal = ({ open, onClose, onSubmit, orderNo, customerName }) => {
  const { loading } = useCustomerOrders();

  return (
    <SelectDocumentLocationModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Convert to Sales Order"
      submitText="Convert to Sales Order"
      resource={RESOURCES.CUSTOMER_ORDER}
      loading={loading}
      summary={[
        { label: 'Order#', value: orderNo },
        { label: 'Customer Name', value: customerName },
      ]}
    />
  );
};

export default ConvertToSalesOrderModal;
