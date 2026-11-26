import { useEffect, useState } from 'react';

import { Card, Form, Select } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';

import useModulePermissions from '@/hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { ADDITIONAL_FEATURES, MODULE_NAMES_LABELS, PERMISSION_MESSAGES, STOCK_ADD_SOURCE_MODULE, STOCK_CHECK_SOURCE_MODULE, STOCK_DEDUCT_SOURCE_MODULE } from 'utils/constants';

const { Option } = Select;

const InventoryConfigPage = () => {
  const { updateInventoryConfig, companyProfileSettings, getCompanyProfileSettings, inventoryConfigLoading, activeFeatures } = useProfile();
  const [form] = Form.useForm();
  const [selectedCheckSource, setSelectedCheckSource] = useState(null);
  const { useInventoryConfig, isViewOnly } = useModulePermissions(RESOURCES.INVENTORY_CONFIG);
  const canEdit = useInventoryConfig?.edit && !isViewOnly;
  const saveTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useInventoryConfig?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  let FINAL_STOCK_CHECK_SOURCE_MODULE = STOCK_CHECK_SOURCE_MODULE(activeFeatures?.[ADDITIONAL_FEATURES?.DELIVERY_CHALLAN]);
  let FINAL_STOCK_DEDUCT_SOURCE_MODULE = STOCK_DEDUCT_SOURCE_MODULE(activeFeatures?.[ADDITIONAL_FEATURES?.DELIVERY_CHALLAN]);
  let FINAL_STOCK_ADD_SOURCE_MODULE = STOCK_ADD_SOURCE_MODULE(activeFeatures?.[ADDITIONAL_FEATURES?.GRPO]);

  const moduleOrder = [FINAL_STOCK_CHECK_SOURCE_MODULE.INVOICE];
  moduleOrder.splice(2, 0, FINAL_STOCK_DEDUCT_SOURCE_MODULE.DELIVERY_CHALLAN);

  const getFilteredOptions = selectedValue => {
    if (!selectedValue) return Object.values(FINAL_STOCK_DEDUCT_SOURCE_MODULE);
    const selectedIndex = moduleOrder.indexOf(selectedValue);
    if (selectedIndex === -1) return Object.values(FINAL_STOCK_DEDUCT_SOURCE_MODULE);
    return moduleOrder.slice(selectedIndex);
  };

  useEffect(() => {
    const controller = new AbortController();
    getCompanyProfileSettings({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (companyProfileSettings?.inventoryConfig) {
      const checkSource = companyProfileSettings?.inventoryConfig?.salesFlowStockCheckSource;
      form.setFieldsValue({
        salesFlowStockCheckSource: checkSource,
        salesFlowStockDeductSource: companyProfileSettings?.inventoryConfig?.salesFlowStockDeductSource,
        purchaseFlowStockAddSource: companyProfileSettings?.inventoryConfig?.purchaseFlowStockAddSource,
      });
      setSelectedCheckSource(checkSource);
    }
  }, [companyProfileSettings, form]);

  const handleCheckSourceChange = value => {
    setSelectedCheckSource(value);
    form.setFieldsValue({ salesFlowStockDeductSource: undefined });
  };

  const handleSubmit = async values => {
    if (!canEdit) return;
    const { salesFlowStockCheckSource, salesFlowStockDeductSource, purchaseFlowStockAddSource } = values;
    try {
      await updateInventoryConfig({
        payload: {
          salesFlowStockCheckSource: Array.isArray(salesFlowStockCheckSource) ? salesFlowStockCheckSource : [salesFlowStockCheckSource].filter(Boolean),
          salesFlowStockDeductSource,
          purchaseFlowStockAddSource,
        },
      });
      await getCompanyProfileSettings({});
    } catch (error) {
      console.error('Error in updateInventoryConfig:', error);
    }
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex justify-between items-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="bg-[#f2e5ff] flex justify-center items-center w-10 h-10 rounded-lg p-2 shrink-0">
              <Icons.CodeSandboxOutlined className="text-[#6b26d9] text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Stock Source Configuration</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure stock management sources for different operations</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-none border border-gray-200 border-t-0 shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            salesFlowStockCheckSource: [FINAL_STOCK_CHECK_SOURCE_MODULE.INVOICE],
            salesFlowStockDeductSource: FINAL_STOCK_DEDUCT_SOURCE_MODULE.INVOICE,
            purchaseFlowStockAddSource: FINAL_STOCK_ADD_SOURCE_MODULE.BILL,
          }}
          disabled={!canEdit}
        >
          <div>
            <Form.Item
              name="salesFlowStockCheckSource"
              label={<span className="font-medium text-sm leading-none text-[#030711]">Stock Check Source</span>}
              rules={[{ required: true, message: 'Please select a stock check source' }]}
            >
              <Select placeholder="Select stock check source" className="rounded-md" onChange={handleCheckSourceChange} disabled={!canEdit}>
                {Object.values(FINAL_STOCK_CHECK_SOURCE_MODULE).map(module => (
                  <Option key={module} value={module}>
                    {MODULE_NAMES_LABELS[module]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <p className="text-xs text-[#6b7280] mt-1 mb-6">Primary source for checking stock availability</p>
          </div>
          <div>
            <Form.Item
              name="salesFlowStockDeductSource"
              label={<span className="font-medium text-sm leading-none text-[#030711]">Stock Deduct Source</span>}
              rules={[{ required: true, message: 'Please select a stock deduct source' }]}
            >
              <Select placeholder="Select stock deduct source" className="rounded-md" disabled={!canEdit || !selectedCheckSource}>
                {getFilteredOptions(selectedCheckSource).map(module => (
                  <Option key={module} value={module}>
                    {MODULE_NAMES_LABELS[module]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <p className="text-xs text-[#6b7280] mt-1 mb-6">Source for deducting stock on fulfillment</p>
          </div>
          <div>
            <Form.Item
              name="purchaseFlowStockAddSource"
              label={<span className="font-medium text-sm leading-none text-[#030711]">Stock Add Source</span>}
              rules={[{ required: true, message: 'Please select a stock add source' }]}
            >
              <Select placeholder="Select stock add source" className="rounded-md" disabled={!canEdit}>
                {Object.values(FINAL_STOCK_ADD_SOURCE_MODULE).map(module => (
                  <Option key={module} value={module}>
                    {MODULE_NAMES_LABELS[module]}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <p className="text-xs text-[#6b7280] mt-1">Source for adding stock</p>
          </div>
          <div className="flex justify-end">
            <PermissionButton
              canAccess={useInventoryConfig?.edit}
              isViewOnly={isViewOnly}
              tooltipTitle={saveTooltip}
              type="primary"
              text="Save Changes"
              onClick={canEdit ? () => form.submit() : undefined}
              loading={inventoryConfigLoading}
            />
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default InventoryConfigPage;
