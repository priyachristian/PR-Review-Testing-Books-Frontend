import { useEffect, useState } from 'react';
import { CheckOutlined, CopyOutlined, KeyOutlined } from '@ant-design/icons';

import { Card } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import Toast from '@/components/ui/common/Toast';

import { useProfile } from '@/features/setting/profile/useProfile';
import { ADDITIONAL_FEATURES } from '@/utils/constants';
import { colorPalette } from 'utils/theme';

const CompanyCodeSection = ({ className = '' }) => {
  const { companyCode, companyCodeLoading, companyCodeGenerating, getCompanyCode, generateCompanyCode, activeFeatures } = useProfile();
  const isCustomerOrderAppAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isCustomerOrderAppAvailable) {
      getCompanyCode();
    }
  }, [getCompanyCode, isCustomerOrderAppAvailable]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(companyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Toast.error('Failed to copy code');
    }
  };

  const handleGenerate = async () => {
    try {
      await generateCompanyCode();
    } catch {
      // Errors and success Toast are handled in profile.slice.js
    }
  };

  // Hard hidden (like Rejection Order) when the plan does not include the customer portal feature.
  if (!isCustomerOrderAppAvailable) return null;

  return (
    <Card className={`shadow-sm rounded-none border border-gray-200 ${className}`}>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#7c3bed1a] rounded-lg flex items-center justify-center shrink-0">
            <KeyOutlined className="text-[#7c3bed] text-lg" />
          </div>
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Company Code</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Share this code with customers so they can link their account to your company</p>
          </div>
        </div>

        {companyCodeLoading ? (
          <div className="h-[42px] w-[180px] bg-gray-100 rounded-lg animate-pulse" />
        ) : companyCode ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-[#fafafa]">
              <span className="text-[16px] font-bold tracking-wide text-[#030711]">{companyCode}</span>
              <button type="button" onClick={handleCopy} className="flex items-center text-gray-500 hover:text-gray-700">
                {copied ? <CheckOutlined style={{ color: colorPalette.success[500] }} /> : <CopyOutlined />}
              </button>
            </div>
          </div>
        ) : (
          <CustomButton text="Generate Code" type="primary" loading={companyCodeGenerating} onClick={handleGenerate} />
        )}
      </div>
    </Card>
  );
};

export default CompanyCodeSection;
