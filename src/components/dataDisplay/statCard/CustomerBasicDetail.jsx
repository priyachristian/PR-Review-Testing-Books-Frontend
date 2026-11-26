import { useState } from 'react';
import { Tooltip } from 'antd';

// Components
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';

// Extras
import Icons from 'assets/icons/icon';
import { Button } from '@/components/AntDComponent';
import { colorPalette } from 'utils/theme';

const CustomerBasicDetail = ({ customerData, isVendor, onBack, wrapperClassName = 'absolute right-0 top-[40px] transform -translate-y-1/2 md:w-[240px] lg:w-[280px] flex justify-end' }) => {
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);

  return (
    <>
      <div className={wrapperClassName}>
        <Tooltip title={customerData?.customerDisplayName}>
          <Button type="default" size="middle" icon={<Icons.ExportOutlined style={{ color: colorPalette.primary[500] }} />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
            {isVendor ? 'View Vendor' : 'View Customer'}
          </Button>
        </Tooltip>
      </div>
      {viewCustomerDetail && (
        <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={isVendor} onBack={onBack} />
      )}
    </>
  );
};

export default CustomerBasicDetail;
