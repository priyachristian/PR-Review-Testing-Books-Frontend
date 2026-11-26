import { calculateItemRateForSplit } from '@/utils/services';
import { getGstNumericRate, formatGstForDisplay } from '@/utils/gstDisplay';
import { toDecimalString } from '@/utils/currency';
import { getItemUnitName } from '@/utils/itemLineUnit';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { salesOrderItemColumns, salesOrderRawMaterialColumns } from '@/features/sales/salesOrder';
import ItemDrawerDetails from '@/features/allMaster/item/components/ItemDrawerDetails';
import { useState } from 'react';

const SalesOrderItemDetails = ({ documentData }) => {
  const [viewItem, setViewItem] = useState(null);
  const handleItemClick = record => setViewItem({ id: String(record.itemId), itemNo: record.itemNo, itemName: record.itemName });

  const amountCalculation = (item, key) => {
    const qty = Number(item?.[key]) || 0;
    const rate = Number(item?.rate) || 0;
    const gst = getGstNumericRate(item?.gst) || 0;

    const baseAmount = qty * rate;
    let discountAmount = 0;
    const discountValue = Number(item?.discountConfig?.discountValue) || 0;
    const discountType = item?.discountConfig?.discountType;

    if (discountType === 'PERCENTAGE') {
      discountAmount = (baseAmount * discountValue) / 100;
    } else if (discountType === 'AMOUNT') {
      discountAmount = discountValue;
    }

    const discountedPrice = baseAmount - discountAmount;
    const taxAmount = (discountedPrice * gst) / 100;
    const finalAmount = discountedPrice + taxAmount;
    return finalAmount;
  };

  const itemRows = (documentData?.items || []).map((item, index) => {
    const itemRateForSplitDoc = documentData?.isSplit ? calculateItemRateForSplit(item) || 0 : 0;
    return {
      rowKey: index,
      itemId: item?.itemId?._id || item?.itemId,
      itemNo: item?.itemNo,
      itemName: item?.itemName,
      description: item?.description,
      hsnCode: item?.hsnCode,
      quantity: item?.quantity,
      unitName: getItemUnitName(item),
      remainingQty: item?.remainingQty,
      excessQty: item?.excessQty > 0 ? toDecimalString(item.excessQty) : 0,
      availableQty: item?.stocketDetails?.availableStock,
      unitPrice: documentData?.isSplit ? itemRateForSplitDoc : Number(item?.rate) || 0,
      discount: `${item?.discountConfig?.discountValue || 0}${item?.discountConfig?.discountType === 'PERCENTAGE' ? '%' : documentData?.currency?.symbol}`,
      taxRate: formatGstForDisplay(item?.gst),
      amount: documentData?.isSplit ? itemRateForSplitDoc * item?.quantity : amountCalculation(item, 'quantity'),
      remainingAmount: item?.remainingQty > 0 ? amountCalculation(item, 'remainingQty') : 0,
    };
  });

  return (
    <div className="my-container p-4 mx-auto">
      {documentData?.rawMaterials && <p className="font-bold text-lg mb-2">Finished Goods Overview</p>}
      <CustomTable columns={salesOrderItemColumns(documentData, handleItemClick)} data={itemRows} tableId="rowKey" pagination={false} dynamicScrollY={false} scroll={{ x: 'max-content' }} />
      {documentData?.rawMaterials?.length > 0 && (
        <div className="mt-6">
          <p className="font-bold text-lg mb-2">Raw Material Requirement</p>
          <CustomTable
            columns={salesOrderRawMaterialColumns(handleItemClick)}
            data={documentData.rawMaterials}
            tableId={record => `${record.itemId}-${record.usedInItemId}`}
            pagination={false}
            dynamicScrollY={false}
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}
      {viewItem && <ItemDrawerDetails viewItemDetail setViewItemDetail={() => setViewItem(null)} itemData={viewItem} />}
    </div>
  );
};

export default SalesOrderItemDetails;
