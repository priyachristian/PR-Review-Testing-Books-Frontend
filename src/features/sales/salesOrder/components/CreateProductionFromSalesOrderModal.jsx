import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';
import { Alert, Input, Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { useManPowerConfig } from '@/features/allMaster/manPower/useManPowerConfig';
import useModulePermissions from 'hooks/useModulePermissions';
import { buildDepartmentSelectOptions, filterWorkersByDepartment, getWorkerId } from '@/utils/manPowerDepartment';
import { createProductionFromSalesOrderSchema } from '@/features/production/productionOrder';
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';
import { buildWarehouseSelectOptions, warehouseSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

export default function CreateProductionFromSalesOrderModal({ open, onClose, onSuccess, record }) {
  const { warehouseDrop, getWarehouseDrop } = useModulePermissions();
  const { getWorkerDropdown, dropdownLoading, workerDropdown } = useManPowerConfig();
  const { convertToProductionOrder, convertToProductionLoading } = useSalesOrder();

  const departmentOptions = useMemo(() => buildDepartmentSelectOptions(workerDropdown), [workerDropdown]);

  const salesOrderId = record?.id || record?._id;
  const isValid = Boolean(salesOrderId);

  const hasAnyProductionData = useMemo(() => {
    return (record?.items || []).some(item => item?.hasProductionData);
  }, [record]);

  useEffect(() => {
    if (!open) return;
    const c = new AbortController();
    getWorkerDropdown({ signal: c.signal });
    getWarehouseDrop({ signal: c.signal });
    return () => c.abort();
  }, [open, getWorkerDropdown, getWarehouseDrop]);

  const handleSubmit = async form => {
    if (convertToProductionLoading || !isValid) return;
    try {
      const body = {
        salesOrderId: record.id || record._id,
        inStockWarehouseId: form.inStockWarehouseId,
        productionWarehouseId: form.productionWarehouseId,
        inventoryInwarehouseId: form.inventoryInwarehouseId,
        productionOwner: form.productionOwner || [],
        items: (form.items || []).map(({ itemId, quantity }) => ({
          itemId,
          quantity: Number(quantity) || 0,
        })),
      };
      await convertToProductionOrder(body);
      onSuccess?.();
      onClose?.();
    } catch {
      // Toast handled in salesOrder slice
    }
  };

  if (!open) return null;

  if (!isValid) {
    return (
      <CustomModal
        modalOpen={open}
        setModalOpen={v => {
          if (!v) onClose?.();
        }}
        title="Add Production"
        width={400}
        destroyOnClose
      >
        <Alert type="error" showIcon message="Missing sales order." className="mb-4" />
        <div className="flex justify-end">
          <CustomButton type="default" text="Close" onClick={onClose} />
        </div>
      </CustomModal>
    );
  }

  const formInitial = {
    inStockWarehouseId: null,
    productionWarehouseId: null,
    inventoryInwarehouseId: null,
    departmentFilter: null,
    productionOwner: [],
    items: record?.items?.map(item => ({
      ...item,
      quantity: item?.hasProductionData ? item.pendingProductionQty : 0,
    })),
  };

  const wh = buildWarehouseSelectOptions(warehouseDrop);

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={v => {
        if (!v) onClose?.();
      }}
      title="Add Production"
      width={800}
      destroyOnClose
    >
      <Formik initialValues={formInitial} enableReinitialize validationSchema={createProductionFromSalesOrderSchema} onSubmit={handleSubmit}>
        {({ values, setFieldValue, handleChange, handleBlur, handleSubmit, errors, touched }) => {
          const workersFiltered = filterWorkersByDepartment(workerDropdown, values.departmentFilter ?? '');
          const itemColumns = [
            {
              title: 'Item#',
              dataIndex: 'itemNo',
              key: 'itemNo',
              render: itemNo => <Tag className="font-semibold">{itemNo}</Tag>,
              visible: true,
              required: true,
              fixed: 'left',
            },
            {
              title: 'Item',
              dataIndex: 'itemName',
              key: 'itemName',
              render: (_, item) => {
                const nameNode = (
                  <div className="min-w-0 max-w-full whitespace-normal break-words break-all pr-2 text-sm leading-snug">
                    <span className={!item?.hasProductionData ? 'text-gray-400' : ''}>{item?.itemName || item?.itemNo || item?.itemId}</span>
                  </div>
                );

                if (!item?.hasProductionData) {
                  return <Tooltip title="No production data available for this item">{nameNode}</Tooltip>;
                }

                return nameNode;
              },
            },
            {
              title: 'Quantity Info',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 200,
              render: (_, item, index) => {
                const inputNode = (
                  <Input
                    type="text"
                    inputMode="decimal"
                    name={`items.${index}.quantity`}
                    value={item?.quantity ?? ''}
                    onChange={e => {
                      const newValue = e.target.value;
                      if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                        return;
                      }
                      setFieldValue(`items.${index}.quantity`, newValue);
                    }}
                    disabled={!item?.hasProductionData}
                    onFocus={() => {
                      if (Number(item?.quantity || 0) === 0) {
                        setFieldValue(`items.${index}.quantity`, '');
                      }
                    }}
                    onBlur={e => {
                      if (e?.target?.value === '') {
                        setFieldValue(`items.${index}.quantity`, 0);
                      }
                    }}
                  />
                );

                if (!item?.hasProductionData) {
                  return (
                    <Tooltip title="No production data available for this item">
                      <div className="inline-block w-full max-w-[160px] cursor-not-allowed">{inputNode}</div>
                    </Tooltip>
                  );
                }

                return <div className="inline-block w-full max-w-[160px]">{inputNode}</div>;
              },
            },
            {
              title: 'Production Data',
              dataIndex: 'hasProductionData',
              key: 'hasProductionData',
              align: 'center',
              width: 130,
              render: (_, item) => (
                <span
                  className={`production-data-dot ${item?.hasProductionData ? 'production-data-dot--added' : 'production-data-dot--missing'} inline-block`}
                  title={item?.hasProductionData ? 'Production data added' : 'Production data missing'}
                />
              ),
            },
          ];
          return (
            <CustomForm onFinish={handleSubmit} className="w-full max-w-full">
              <div className="space-y-5 w-full min-w-0">
                {!hasAnyProductionData && (
                  <Alert type="warning" showIcon message="None of the items in this sales order have production data. You cannot convert this to a production order." className="mb-4" />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4">
                  <CustomInput
                    type="select"
                    name="inStockWarehouseId"
                    label="Raw Material Warehouse"
                    placeholder="Select Warehouse"
                    value={values.inStockWarehouseId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.inStockWarehouseId}
                    touched={touched.inStockWarehouseId}
                    setFieldValue={setFieldValue}
                    required
                    selectVariant="twoColumn"
                    columnSelectHeader={warehouseSelectColumnHeader}
                    selectOptions={wh}
                  />
                  <CustomInput
                    type="select"
                    name="productionWarehouseId"
                    label="Production Warehouse"
                    placeholder="Select Warehouse"
                    value={values.productionWarehouseId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.productionWarehouseId}
                    touched={touched.productionWarehouseId}
                    setFieldValue={setFieldValue}
                    required
                    selectVariant="twoColumn"
                    columnSelectHeader={warehouseSelectColumnHeader}
                    selectOptions={wh}
                  />
                  <CustomInput
                    type="select"
                    name="inventoryInwarehouseId"
                    label="Finished Goods Warehouse"
                    placeholder="Select Warehouse"
                    value={values.inventoryInwarehouseId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.inventoryInwarehouseId}
                    touched={touched.inventoryInwarehouseId}
                    setFieldValue={setFieldValue}
                    required
                    selectVariant="twoColumn"
                    columnSelectHeader={warehouseSelectColumnHeader}
                    selectOptions={wh}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-7 gap-y-4">
                  <div className="lg:col-span-1 min-w-0">
                    <CustomInput
                      type="select"
                      name="departmentFilter"
                      label="Department (Production Owner)"
                      placeholder="Filter by department, then select owners"
                      value={values.departmentFilter}
                      onBlur={handleBlur}
                      errorMessage={errors.departmentFilter}
                      touched={touched.departmentFilter}
                      setFieldValue={setFieldValue}
                      allowClear
                      selectOptions={departmentOptions}
                      onChange={next => {
                        const key = next ?? '';
                        const allowed = new Set(filterWorkersByDepartment(workerDropdown, key).map(w => getWorkerId(w)));
                        setFieldValue(
                          'productionOwner',
                          (values.productionOwner || []).filter(id => allowed.has(id))
                        );
                      }}
                    />
                  </div>
                  <div className="min-w-0 lg:col-span-1">
                    <CustomInput
                      type="select"
                      name="productionOwner"
                      label="Production Owner"
                      placeholder="Select Owner"
                      value={values.productionOwner}
                      mode="multiple"
                      onBlur={handleBlur}
                      errorMessage={errors.productionOwner}
                      touched={touched.productionOwner}
                      setFieldValue={setFieldValue}
                      selectOptions={workersFiltered.map(w => ({
                        value: getWorkerId(w),
                        label: w?.workerName,
                      }))}
                      loading={dropdownLoading}
                    />
                  </div>
                </div>
                <CustomTable
                  columns={itemColumns}
                  data={values.items || []}
                  tableId={(row, index) => row?.itemId || index}
                  dynamicScrollY={false}
                  rowClassName={record => (!record?.hasProductionData ? 'opacity-60 bg-gray-50' : '')}
                  scroll={{ x: 'max-content' }}
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={onClose} disabled={convertToProductionLoading} />
                {hasAnyProductionData ? (
                  <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Create Production" loading={convertToProductionLoading} onClick={handleSubmit} />
                ) : (
                  <Tooltip title="None of the items in this sales order have production data.">
                    <span>
                      <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Create Production" loading={convertToProductionLoading} disabled />
                    </span>
                  </Tooltip>
                )}
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
}
