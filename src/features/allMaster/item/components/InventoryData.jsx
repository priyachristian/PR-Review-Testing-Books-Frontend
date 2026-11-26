import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FieldArray, Formik } from 'formik';

// Components
import { Checkbox } from '@/components/AntDComponent';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import Toast from '@/components/ui/common/Toast';
import ShowErrorsOnParentSubmit from '@/components/forms/ShowErrorsOnParentSubmit';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { formatAmount } from '@/utils/currency';
import { RESOURCES } from '@/utils/jsonFile';
import { addInventryData, inventoryDataValidateSchema } from '@/features/allMaster/item';

const DECIMAL_UP_TO_3_REGEX = /^\d*\.?\d{0,3}$/;
const OPENING_STOCK_ERROR = 'Opening stock must be a number';
const OPENING_STOCK_RATE_ERROR = 'Rate must be greater than 0 when opening stock is entered.';

const isInvalidOpeningStock = openingStock => {
  if (openingStock === '' || openingStock === null || openingStock === undefined) return false;
  return Number.isNaN(Number(openingStock));
};

const isInvalidOpeningStockRate = (openingStock, openingStockRate) => {
  const stock = Number(openingStock);
  const rate = Number(openingStockRate);
  return stock > 0 && !(rate > 0);
};

const InventoryData = ({ item, parentSubmitCount = 0 }) => {
  const dispatch = useDispatch();
  const inventryData = item?.inventoryData;
  const { itemId } = useParams();
  const { warehouseDrop, getWarehouseDrop } = useModulePermissions(RESOURCES.ITEM_MASTER);
  const prevFormValuesRef = useRef(null);
  const formikRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getWarehouseDrop({ signal: controller.signal });
    return () => controller.abort();
  }, [dispatch, getWarehouseDrop]);

  const initialValues = {
    totalOpeningStock: inventryData ? inventryData?.totalOpeningStock : 0,
    inventorySalesMethod: inventryData?.inventorySalesMethod ?? 'FIFO',
    minimumStockLevel: inventryData?.minimumStockLevel ?? '',
    maximumStockLevel: inventryData?.maximumStockLevel ?? '',
    warehouses:
      warehouseDrop && warehouseDrop.length > 0
        ? warehouseDrop.map(warehouse => {
            const existingBranch = inventryData?.warehouses?.find(b => b.warehouseId === warehouse.id);

            return existingBranch
              ? {
                  ...existingBranch,
                  divisionName: warehouse.divisionId.name,
                  dCode: warehouse.divisionId.divisionCode,
                  branchName: warehouse.branchId.name,
                  bcode: warehouse.branchId.branchCode,
                  whName: warehouse.name,
                  openingStock: existingBranch.openingStock || 0,
                  openingStockRate: existingBranch.openingStockRate || '',
                  availableStock: existingBranch.availableStock,
                  whCode: warehouse.warehouseId,
                  warehouseId: warehouse.id,
                  branchId: warehouse.branchId.id,
                  divisionId: warehouse.divisionId.id,
                }
              : {
                  divisionName: warehouse.divisionId.name,
                  dCode: warehouse.divisionId.divisionCode,
                  branchName: warehouse.branchId.name,
                  bcode: warehouse.branchId.branchCode,
                  branchId: warehouse.branchId.id,
                  whName: warehouse.name,
                  whCode: warehouse.warehouseId,
                  warehouseId: warehouse.id,
                  divisionId: warehouse.divisionId.id,
                  isActive: !itemId,
                  openingStock: 0,
                  openingStockRate: '',
                  availableStock: 0,
                };
          })
        : [],
  };

  useEffect(() => {
    if (!formikRef.current || !Array.isArray(formikRef.current.values.warehouses)) return;

    formikRef.current.values.warehouses.forEach((warehouse, index) => {
      const findWarehouse = inventryData?.warehouses?.find(x => x?.warehouseId === warehouse?.warehouseId);

      const originalOpening = findWarehouse?.openingStock || 0;
      const originalAvailable = findWarehouse?.availableStock || 0;

      const currentOpening = Number(warehouse.openingStock) || 0;

      const diff = currentOpening - originalOpening;
      const newAvailable = originalAvailable + diff;

      formikRef.current.setFieldValue(`warehouses.${index}.availableStock`, newAvailable, false);
    });

    const totalOpening = formikRef.current.values.warehouses.reduce((sum, w) => sum + (Number(w.openingStock) || 0), 0);

    formikRef.current.setFieldValue('totalOpeningStock', totalOpening, false);
  }, [inventryData, formikRef.current?.values.warehouses]);

  const onFinish = async values => {
    // const negativeStockBranches = values.branches?.filter(
    //   (branch) => (branch.availableStock ?? 0) < 0,
    // );

    // if (negativeStockBranches?.length > 0) {
    //   const warehouseNames = negativeStockBranches.map((branch) => branch.whName).join(", ");
    //   Toast.error(`Warehouse(s): ${warehouseNames} - Available Stock cannot be less than 0.`);
    //   return;
    // }

    const inventoryData = {
      totalOpeningStock: values.totalOpeningStock,
      inventorySalesMethod: values.inventorySalesMethod,
      minimumStockLevel: values.minimumStockLevel === '' || values.minimumStockLevel == null ? null : Number(values.minimumStockLevel),
      maximumStockLevel: values.maximumStockLevel === '' || values.maximumStockLevel == null ? null : Number(values.maximumStockLevel),
      warehouses: values.warehouses
        // .filter(branch => branch.isActive) // Only send active branches
        .map(warehouse => {
          // Only send necessary fields to backend
          return {
            divisionId: warehouse.divisionId,
            branchId: warehouse.branchId,
            warehouseId: warehouse.warehouseId,
            isActive: warehouse.isActive,
            openingStock: warehouse.openingStock,
            openingStockRate: warehouse.openingStockRate,
          };
        }),
    };

    await dispatch(addInventryData(inventoryData));
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const dispatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        const inventoryData = {
          totalOpeningStock: values.totalOpeningStock,
          inventorySalesMethod: values.inventorySalesMethod,
          minimumStockLevel: values.minimumStockLevel === '' || values.minimumStockLevel == null ? null : Number(values.minimumStockLevel),
          maximumStockLevel: values.maximumStockLevel === '' || values.maximumStockLevel == null ? null : Number(values.maximumStockLevel),
          warehouses: values.warehouses.map(warehouse => ({
            divisionId: warehouse.divisionId,
            branchId: warehouse.branchId,
            warehouseId: warehouse.warehouseId,
            isActive: warehouse.isActive,
            openingStock: warehouse.openingStock,
            openingStockRate: warehouse.openingStockRate,
          })),
        };
        dispatch(addInventryData(inventoryData));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, []);

  return (
    <div className="pb-28 relative">
      <Formik initialValues={initialValues} enableReinitialize={true} validationSchema={inventoryDataValidateSchema} onSubmit={onFinish} innerRef={formikRef}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, validateForm, setTouched }) => {
          dispatchOnFormChanges(values);
          return (
            <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <ShowErrorsOnParentSubmit parentSubmitCount={parentSubmitCount} validateForm={validateForm} setTouched={setTouched} />
              <div>
                <div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 pt-2">
                    <CustomInput
                      type="text"
                      name="totalOpeningStock"
                      label="Total Opening Stock"
                      placeholder="Enter Stock"
                      value={values.totalOpeningStock}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.totalOpeningStock}
                      touched={touched.totalOpeningStock}
                      setFieldValue={setFieldValue}
                      disabled={true}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 pt-2">
                    <CustomInput
                      type="select"
                      name="inventorySalesMethod"
                      label="Inventory Sales Method"
                      placeholder="Select Inventory Method"
                      value={values.inventorySalesMethod}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.inventorySalesMethod}
                      touched={touched.inventorySalesMethod}
                      setFieldValue={setFieldValue}
                      selectOptions={[
                        { value: 'FIFO', label: 'FIFO' },
                        { value: 'NEAREST_EXPIRY_DATE', label: 'Nearest Expiry Date (Coming soon)', disabled: true },
                        { value: 'SALES_TO_OPTION', label: 'Sales to Option (Coming soon)', disabled: true },
                        { value: 'LIFO', label: 'LIFO (Coming soon)', disabled: true },
                      ]}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 pt-2">
                    <CustomInput
                      type="text"
                      name="minimumStockLevel"
                      label="Minimum Stock Level"
                      placeholder="Enter Minimum Stock Level"
                      value={values.minimumStockLevel}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.minimumStockLevel}
                      touched={touched.minimumStockLevel}
                      setFieldValue={setFieldValue}
                    />
                    <CustomInput
                      type="text"
                      name="maximumStockLevel"
                      label="Maximum Stock Level"
                      placeholder="Enter Maximum Stock Level"
                      value={values.maximumStockLevel}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.maximumStockLevel}
                      touched={touched.maximumStockLevel}
                      setFieldValue={setFieldValue}
                    />
                  </div>
                  <div className="pt-5">
                    <div className="w-full overflow-x-auto">
                      <table className="border-collapse min-w-[1000px] w-full border">
                        <thead>
                          <tr className="">
                            <th className="border px-2 py-3 bg-[#fafafa]">Active</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">W/H Name</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">W/H Code</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Branch Name</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">B. Code</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Division Name</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Division Code</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Opening Stock</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Rate</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Value</th>
                            <th className="border px-2 py-3 bg-[#fafafa]">Current Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          <FieldArray name="warehouses">
                            {() =>
                              values.warehouses.map((warehouse, index) => (
                                <tr key={index}>
                                  <td className="border p-2 text-center">
                                    <Checkbox
                                      name={`warehouses[${index}].isActive`}
                                      checked={warehouse.isActive}
                                      onChange={e => setFieldValue(`warehouses[${index}].isActive`, e.target.checked)}
                                      onBlur={handleBlur}
                                    />
                                  </td>
                                  <td className="border p-2 text-center">{warehouse.whName}</td>
                                  <td className="border p-2 text-center">{warehouse.whCode}</td>
                                  <td className="border p-2 text-center">{warehouse.branchName}</td>
                                  <td className="border p-2 text-center">{warehouse.bcode}</td>
                                  <td className="border p-2 text-center">{warehouse.divisionName}</td>
                                  <td className="border p-2 text-center">{warehouse.dCode}</td>

                                  <td className="border p-2 text-center">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className={`focus:outline-none w-16 ${errors.warehouses?.[index]?.openingStock && touched.warehouses?.[index]?.openingStock ? 'border-b border-red-500' : ''}`}
                                      id={`warehouses[${index}].openingStock`}
                                      name={`warehouses[${index}].openingStock`}
                                      value={
                                        warehouse.openingStock === 0 || warehouse.openingStock === '0' || warehouse.openingStock === null || warehouse.openingStock === undefined
                                          ? ''
                                          : warehouse.openingStock
                                      }
                                      placeholder="0"
                                      onChange={e => {
                                        const newValue = e.target.value;
                                        if (newValue !== '' && !DECIMAL_UP_TO_3_REGEX.test(newValue)) return;
                                        setFieldValue(`warehouses[${index}].openingStock`, newValue);
                                      }}
                                      onBlur={e => {
                                        handleBlur(e);
                                        if (e.relatedTarget?.closest?.('button')) return;
                                        if (isInvalidOpeningStock(e.target.value)) {
                                          Toast.error(OPENING_STOCK_ERROR);
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="border p-2 text-center">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      className={`focus:outline-none w-16 ${errors.warehouses?.[index]?.openingStockRate && touched.warehouses?.[index]?.openingStockRate ? 'border-b border-red-500' : ''}`}
                                      id={`warehouses[${index}].openingStockRate`}
                                      name={`warehouses[${index}].openingStockRate`}
                                      value={warehouse.openingStockRate ?? ''}
                                      placeholder="0.00"
                                      onChange={e => {
                                        const newValue = e.target.value;
                                        if (newValue !== '' && !DECIMAL_UP_TO_3_REGEX.test(newValue)) return;
                                        setFieldValue(`warehouses[${index}].openingStockRate`, newValue);
                                      }}
                                      onBlur={e => {
                                        handleBlur(e);
                                        if (e.relatedTarget?.closest?.('button')) return;
                                        if (isInvalidOpeningStockRate(warehouse.openingStock, e.target.value)) {
                                          Toast.error(OPENING_STOCK_RATE_ERROR);
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="border p-2 text-center bg-gray-100">{formatAmount((Number(warehouse.openingStock) || 0) * (Number(warehouse.openingStockRate) || 0))}</td>
                                  <td className="border p-2 text-center bg-gray-100">
                                    <input
                                      type="text"
                                      className="focus:outline-none w-16"
                                      name={`warehouses[${index}].availableStock`}
                                      value={warehouse.availableStock || 0}
                                      disabled={true}
                                      readOnly
                                    />
                                  </td>
                                </tr>
                              ))
                            }
                          </FieldArray>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </div>
  );
};

export default InventoryData;
