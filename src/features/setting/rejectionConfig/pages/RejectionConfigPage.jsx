import { useEffect } from 'react';
import { Formik } from 'formik';
import { Card } from '@/components/AntDComponent';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { RESOURCES } from '@/utils/jsonFile';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { buildWarehouseSelectOptions, warehouseSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const WAREHOUSE_FIELDS = [
  { name: 'reuseWarehouseId', label: 'Reuse Warehouse', placeholder: 'Select warehouse for reusable components', help: 'Components marked as reusable will be stocked here' },
  { name: 'returnWarehouseId', label: 'Vendor Return Warehouse', placeholder: 'Select warehouse for vendor-returned items', help: 'Components sent back to vendor will be tracked here' },
  { name: 'scrapWarehouseId', label: 'Scrap Warehouse', placeholder: 'Select warehouse for scrapped components', help: 'Components marked as scrap will be moved here' },
];

const RejectionConfigPage = () => {
  const { updateRejectionWarehouseConfig, companyProfileSettings, getCompanyProfileSettings, rejectionWarehouseConfigLoading } = useProfile();
  const { isViewOnly, useModuleRejectionOrders, warehouseDrop, warehouseLoading, getWarehouseDrop } = useModulePermissions(RESOURCES.REJECTION_ORDERS);
  const canEdit = useModuleRejectionOrders?.edit && !isViewOnly;
  const saveTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleRejectionOrders?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  useEffect(() => {
    const controller = new AbortController();
    getCompanyProfileSettings({ signal: controller.signal });
    // This is the only screen that should see the reserved reuse/return/scrap warehouses.
    getWarehouseDrop({ includeRejectionWarehouses: true });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = companyProfileSettings?.rejectionWarehouseConfig;
  const initialValues = {
    reuseWarehouseId: cfg?.reuseWarehouseId || null,
    returnWarehouseId: cfg?.returnWarehouseId || null,
    scrapWarehouseId: cfg?.scrapWarehouseId || null,
  };

  const warehouseOptions = buildWarehouseSelectOptions(warehouseDrop);

  const handleSubmit = async values => {
    if (!canEdit) return;
    try {
      await updateRejectionWarehouseConfig({ payload: values });
    } catch (err) {
      console.error('Error in updateRejectionWarehouseConfig:', err);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-red-50 flex justify-center items-center w-10 h-10 rounded-lg p-2 shrink-0">
              <span className="text-red-600 text-lg font-bold">R</span>
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-gray-900 tracking-tight leading-none">Rejection Warehouse Configuration</h3>
              <p className="lg:text-xs md:text-xs text-gray-500 font-medium">Select default warehouses for recovered, returned, and scrapped goods</p>
              <p className="lg:text-xs md:text-xs text-gray-500 font-medium">
                <strong>Note:</strong> These are system-reserved warehouses for rejection orders and will not appear in any other inventory documents or warehouse selections.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 border-t-0 shadow-sm">
        <Formik enableReinitialize initialValues={initialValues} onSubmit={handleSubmit}>
          {({ values, setFieldValue, handleSubmit: submitForm }) => (
            <CustomForm name="rejection-config" onFinish={submitForm}>
              {WAREHOUSE_FIELDS.map(field => (
                <div key={field.name} className="mb-6">
                  <CustomInput
                    type="select"
                    name={field.name}
                    label={field.label}
                    placeholder={field.placeholder}
                    value={values[field.name]}
                    selectVariant="twoColumn"
                    columnSelectHeader={warehouseSelectColumnHeader}
                    selectOptions={warehouseOptions}
                    loading={warehouseLoading}
                    allowClear
                    disabled={!canEdit}
                    setFieldValue={setFieldValue}
                  />
                  <p className="text-xs text-gray-500 mt-1">{field.help}</p>
                </div>
              ))}

              <div className="flex justify-end">
                <PermissionButton
                  canAccess={useModuleRejectionOrders?.edit}
                  isViewOnly={isViewOnly}
                  tooltipTitle={saveTooltip}
                  type="primary"
                  text="Save Changes"
                  onClick={canEdit ? submitForm : undefined}
                  loading={rejectionWarehouseConfigLoading}
                />
              </div>
            </CustomForm>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default RejectionConfigPage;
