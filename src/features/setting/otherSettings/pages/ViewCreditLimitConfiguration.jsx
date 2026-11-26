import React, { useEffect } from 'react';

import { Card } from '@/components/AntDComponent';
import CreditLimitConfigSection from '@/features/setting/components/CreditLimitConfigSection';

import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useUser } from '@/features/setting/user/useUser';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';

import Icons from 'assets/icons/icon';

const ViewCreditLimitConfiguration = () => {
  const { creditLimitConfig, creditLimitConfigLoading, getCreditLimitConfig, updateCreditLimitConfig } = useProfile();
  const { divDrop, getDivDropDown, allBranchDrop, getAllBranchDropDown, isViewOnly } = useModulePermissions();
  const { accessRoles } = useUser();
  const { paymentTermsOptions, paymentTermsDropLoading } = usePaymentTermsDropdown();
  const isAdminRole = accessRoles?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal, isSplit: true };
    getDivDropDown(payload);
    return () => controller.abort();
  }, [getDivDropDown]);

  useEffect(() => {
    if (!isAdminRole) return;
    const controller = new AbortController();
    getCreditLimitConfig({ signal: controller.signal });
    getAllBranchDropDown({ signal: controller.signal });
    return () => controller.abort();
  }, [isAdminRole, getCreditLimitConfig, getAllBranchDropDown]);

  if (!isAdminRole) {
    return null;
  }

  return (
    <div>
      <div className="bg-white shadow-sm">
        <Card
          className="rounded-none border border-t-0 border-gray-200 shadow-sm"
          title={
            <div className="flex items-center gap-3 py-3">
              <div className="bg-[#0ea5e91a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
                <Icons.DollarOutlined className="text-[#0ea5e9] items-center text-xl" />
              </div>
              <div>
                <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Sales Credit Limit & Payment Terms Configuration</h3>
                <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium ">
                  Configure default credit limit, payment terms, and restriction documents for sales (Quote, Sales Order, Delivery Challan, Invoice)
                </p>
              </div>
            </div>
          }
        >
          <CreditLimitConfigSection
            type="sales"
            config={creditLimitConfig?.salesCreditLimit}
            fullCreditLimitConfig={creditLimitConfig}
            onSave={async payload => {
              await updateCreditLimitConfig(payload);
              await getCreditLimitConfig({});
            }}
            loading={creditLimitConfigLoading}
            divDrop={divDrop}
            allBranchDrop={allBranchDrop}
            paymentTermsOptions={paymentTermsOptions}
            paymentTermsDropLoading={paymentTermsDropLoading}
            canEdit={isAdminRole}
            isViewOnly={isViewOnly}
            title="Sales Credit Limit & Payment Terms Configuration"
            description="Configure default credit limit, payment terms, and restriction documents for sales"
            icon={Icons.CheckOutlined}
            iconBgClass="bg-[#0ea5e91a]"
            iconColorClass="text-[#0ea5e9]"
          />
        </Card>
      </div>

      <div className="bg-white shadow-sm mb-20">
        <Card
          className="rounded-none border border-t-0 border-gray-200 shadow-sm"
          title={
            <div className="flex items-center gap-3 py-3">
              <div className="bg-[#f59e0b1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
                <Icons.ShoppingOutlined className="text-[#f59e0b] items-center text-xl" />
              </div>
              <div>
                <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Purchase Credit Limit & Payment Terms Configuration</h3>
                <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium ">Configure default credit limit, payment terms, and restriction documents for purchase (Purchase Order, GRPO, Bill)</p>
              </div>
            </div>
          }
        >
          <CreditLimitConfigSection
            type="purchase"
            config={creditLimitConfig?.purchaseCreditLimit}
            fullCreditLimitConfig={creditLimitConfig}
            onSave={async payload => {
              await updateCreditLimitConfig(payload);
              await getCreditLimitConfig({});
            }}
            loading={creditLimitConfigLoading}
            divDrop={divDrop}
            allBranchDrop={allBranchDrop}
            paymentTermsOptions={paymentTermsOptions}
            paymentTermsDropLoading={paymentTermsDropLoading}
            canEdit={isAdminRole}
            isViewOnly={isViewOnly}
            title="Purchase Credit Limit & Payment Terms Configuration"
            description="Configure default credit limit, payment terms, and restriction documents for purchase"
            icon={Icons.CheckOutlined}
            iconBgClass="bg-[#f59e0b1a]"
            iconColorClass="text-[#f59e0b]"
          />
        </Card>
      </div>
    </div>
  );
};

export default ViewCreditLimitConfiguration;
