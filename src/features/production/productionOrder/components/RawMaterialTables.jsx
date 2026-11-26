import CustomInput from '@/components/forms/formInput/CustomInput';
import { isRawMaterialBaseUnit, resolveRawMaterialTotalStock, resolveRawMaterialWarehouseStock } from '@/features/production/productionOrder/productionOrder.utils';

const RawMaterialTables = ({ productionItem, setFieldValue, values, itemUnitId, selectedUnitName }) => {
  return (
    <div className="space-y-6">
      {productionItem.map((item, index) => {
        const isBaseUnit = isRawMaterialBaseUnit(item, itemUnitId);
        const itemStock = resolveRawMaterialTotalStock(item, itemUnitId, selectedUnitName);
        const stockUnitName = isBaseUnit ? item?.itemUnitId?.name || selectedUnitName : selectedUnitName;
        const warehouses = item.inventoryData?.warehouses || [];

        return (
          <div key={index} className="">
            <div>
              <div className="flex items-end gap-4 mb-2">
                <div className="text-base pb-1.5">
                  <strong>RM Item Name:</strong> {item?.itemName}
                  {itemStock !== null && (
                    <span className="ml-3 inline-flex items-center gap-1 text-xs font-normal text-gray-600">
                      <span>Available Stock:</span>
                      <span className="font-semibold text-gray-800">{itemStock}</span>
                      {stockUnitName ? <span>{stockUnitName}</span> : null}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-[50%]">
                  <CustomInput
                    type="text"
                    label={'Per Item Required Unit'}
                    name={`productionItem[${index}].requireUnit`}
                    placeholder="Required Unit"
                    value={item.qtyPerItem}
                    setFieldValue={setFieldValue}
                  />
                  <CustomInput
                    type="text"
                    label={'Production Order Required Unit'}
                    name={`productionItem[${index}].actualRequireUnit`}
                    placeholder="Actual Required Unit"
                    value={values.quantity && item.qtyPerItem ? parseFloat((Number(values.quantity) * Number(item.qtyPerItem)).toFixed(3)) : ''}
                    setFieldValue={setFieldValue}
                  />
                </div>
              </div>

              <table className="border-collapse w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-3 bg-[#fafafa]">Division Name</th>
                    <th className="border px-2 py-3 bg-[#fafafa]">Branch Name</th>
                    <th className="border px-2 py-3 bg-[#fafafa]">W/H Name</th>
                    <th className="border px-2 py-3 bg-[#fafafa]">Available Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.length > 0 ? (
                    warehouses.map((warehouse, invIndex) => {
                      const warehouseStock = resolveRawMaterialWarehouseStock(item, warehouse, itemUnitId, selectedUnitName);
                      const stockLabel = warehouseStock == null ? '' : stockUnitName ? `${warehouseStock} ${stockUnitName}` : warehouseStock;
                      return (
                        <tr key={invIndex}>
                          <td className="border p-2 text-center">{warehouse?.division?.name || ''}</td>
                          <td className="border p-2 text-center">{warehouse?.branch?.name || ''}</td>
                          <td className="border p-2 text-center">{warehouse?.warehouse?.name || ''}</td>
                          <td className="border p-2 text-center">{stockLabel}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="border p-2 text-center text-gray-500">
                        No Data Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RawMaterialTables;
