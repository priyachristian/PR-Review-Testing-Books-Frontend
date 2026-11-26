// Components
import { Collapse } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Extras
import { convertToColumn } from 'utils/tableColumns';

const TableView = ({ columns, data, currency }) => {
  return <CustomTable columns={columns} data={data?.map(row => ({ ...row, currency }))} className="my-2" />;
};

const ConvertToDetail = ({ convertToData, open, onClose, data = null }) => {
  const currency = data?.currency;
  let items = [];

  let obj = {};

  convertToData?.forEach(item => {
    if (obj?.[item?.type]) {
      obj[item?.type] = [...obj[item?.type], item];
    } else {
      obj[item?.type] = [item];
    }
  });

  Object?.entries(obj)?.forEach(([key, value]) => {
    let columns = [];

    if (key === 'GRPO') {
      columns = convertToColumn?.convertToGrpoColumn;
    } else if (key === 'BILL') {
      columns = convertToColumn?.convertToBillColumn;
    } else if (key === 'SalesOrder') {
      columns = convertToColumn?.convertToSalesOrderColumn;
    } else if (key === 'DeliveryChallan') {
      columns = convertToColumn?.convertToDeliveryChallanColumn;
    } else if (key === 'Invoice') {
      columns = convertToColumn?.convertToInvoiceColumn;
    }

    items.push({
      key: value?._id,
      label: key,
      children: <TableView data={value} columns={columns} currency={currency} />,
    });
  });

  return (
    <CustomModal modalOpen={open} setModalOpen={onClose} title="Convert To Detail" width={900}>
      <Collapse expandIconPosition="end" items={items} />
    </CustomModal>
  );
};

export default ConvertToDetail;
