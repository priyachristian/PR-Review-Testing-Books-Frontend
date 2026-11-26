import { useState } from 'react';

// Components
import { Button, Card, Popover } from '@/components/AntDComponent';
import AddAddressModal from './AddAddressModal';
import CustomButton from '@/components/ui/button/CustomButton';

// Extras
import Icons from '@/assets/icons/icon';
import { ADDRESS_TYPE } from '@/utils/constants';

const AdditionalAddressContainer = ({
  customerAddress,
  addressLoading = false,
  fetchCustomerAddress,
  selectedCustomer,
  setFieldValue,
  selectedAddress,
  setSelectedAddress,
  shippingAddressType,
  showAddButton = true,
  addressType = ADDRESS_TYPE.SHIPPING,
}) => {
  // If shippingAddressType is not provided, default to Customer mode for backwards compatibility
  const isCustomerAddress = !shippingAddressType || shippingAddressType === 'Customer';
  const addressList = customerAddress || [];
  const fetchFunction = fetchCustomerAddress;
  const selectedId = isCustomerAddress ? selectedCustomer : null;
  // A customer has only one billing address, so once it exists it can only be edited.
  const canAddAddress = showAddButton && !(addressType === ADDRESS_TYPE.BILLING && addressList.length > 0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressDetail, setAddressDetail] = useState(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const handleAddressEdit = address => {
    setShowAddressDropdown(false);
    setAddressDetail(address);
    setShowAddressModal(true);
  };

  const handleClose = () => {
    setAddressDetail(null);
    setShowAddressDropdown(false);
  };

  const handleAddressDropdownOpenChange = newOpen => {
    setShowAddressDropdown(newOpen);
  };

  const addressContent = (
    <>
      <div className="space-y-2 w-[400px] max-h-[400px] overflow-y-auto" onWheel={event => event.stopPropagation()}>
        {addressList?.map(address => {
          return (
            <Card
              key={address?._id}
              className={`cursor-pointer px-2 py-1 rounded-md border border-gray-200 ${selectedAddress?._id === address?._id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setFieldValue('addressId', address?._id);
                setShowAddressDropdown(false);
                setSelectedAddress(address);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="w-[90%]">
                  <p>{address?.address?.street1 || address?.street1}</p>
                  <p>{address?.address?.street2 || address?.street2}</p>
                  <p>
                    {address?.city}
                    {' - '}
                    {address?.pinCode}
                  </p>
                  <p>
                    {address?.state}
                    {', '}
                    {address?.country}
                  </p>
                </div>
                <div className="flex justify-end w-[10%]">
                  <Button
                    icon={<Icons.EditOutlined />}
                    onClick={e => {
                      e.stopPropagation();
                      handleAddressEdit(address);
                    }}
                    size="small"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {canAddAddress && (
        <CustomButton
          type="primary"
          className="w-full mt-2 py-1 md:py-2 px-4 md:px-5"
          onClick={() => {
            setAddressDetail(null);
            setShowAddressModal(true);
            setShowAddressDropdown(false);
          }}
          text={
            <div className="flex gap-1 md:gap-2 items-center justify-center">
              <Icons.PlusCircleOutlined />
              <span>Add Address</span>
            </div>
          }
        />
      )}
    </>
  );

  return (
    <div>
      <div className="py-2 ml-3">
        <Popover content={addressContent} title={`Select ${addressType} Address`} trigger="click" placement="bottom" open={showAddressDropdown} onOpenChange={handleAddressDropdownOpenChange}>
          <div className="flex items-center gap-3">
            <p className="font-bold">Selected {addressType} Address</p>
            <Button icon={<Icons.EditOutlined />} size="small" loading={addressLoading} disabled={addressLoading} />
          </div>
        </Popover>

        <p>
          {selectedAddress?.address?.street1 || selectedAddress?.street1}
          {(selectedAddress?.address?.street2 || selectedAddress?.street2) && `, ${selectedAddress?.address?.street2 || selectedAddress?.street2}`}
        </p>
        <p>
          {selectedAddress?.city}
          {selectedAddress?.pinCode && ` - ${selectedAddress?.pinCode}`}
        </p>
        <p>
          {selectedAddress?.state}
          {selectedAddress?.country && `, ${selectedAddress?.country}`}
        </p>
      </div>
      {showAddressModal && (
        <AddAddressModal
          modalOpen={showAddressModal}
          setModalOpen={setShowAddressModal}
          customerId={selectedId}
          addressDetail={addressDetail}
          getlist={() => {
            if (isCustomerAddress) {
              fetchFunction(selectedId);
            } else {
              fetchFunction();
            }
          }}
          handleClose={handleClose}
          isProfileAddress={!isCustomerAddress}
          addressType={addressType}
        />
      )}
    </div>
  );
};

export default AdditionalAddressContainer;
