import { useRef } from 'react';

// Components
import { Drawer } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CloseIconButton from '@/components/ui/button/CloseIconButton';
import ProductionData from '@/features/allMaster/item/components/ProductionData';

// Hooks
import { useItemMaster } from '@/features/allMaster/item';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { errorsToTouched, shouldPreventNavigation } from '@/utils/util';

const AddProductionDataDrawer = ({ open, onClose, itemId, itemName, onSuccess }) => {
  const formikRef = useRef();
  const scrollToError = useScrollToError();
  const { addProductionDataToItem, productionDataSubmitLoading } = useItemMaster();

  const handleSave = async () => {
    const errors = await formikRef.current?.validateForm();
    if (errors && Object.keys(errors).length > 0) {
      formikRef.current?.setTouched(errorsToTouched(errors));
      const firstErrorField = Object.keys(errors)[0];
      scrollToError(firstErrorField, errors);
      return;
    }
    formikRef.current?.submitForm();
  };

  const handleSubmitProductionData = async productionData => {
    const result = await addProductionDataToItem({ itemId, productionData });
    if (shouldPreventNavigation(result)) {
      return;
    }
    onClose?.();
    onSuccess?.();
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full">
          <div>{itemName ? <div className="font-semibold text-gray-900">{itemName}</div> : null}</div>
          <CloseIconButton onClick={onClose} />
        </div>
      }
      placement="right"
      width={800}
      open={open}
      onClose={onClose}
      destroyOnClose
      closable={false}
      maskClosable={!productionDataSubmitLoading}
      styles={{
        body: { padding: '20px 24px', paddingBottom: 0, overflow: 'auto' },
        footer: { borderTop: '1px solid #e5e7eb', padding: '12px 24px' },
      }}
      footer={
        <div className="flex items-center justify-end gap-2 pb-2">
          <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={productionDataSubmitLoading} onClick={onClose} />
          <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" loading={productionDataSubmitLoading} onClick={handleSave} />
        </div>
      }
    >
      <ProductionData item={{ _id: itemId }} syncToStore={false} onSave={handleSubmitProductionData} innerRef={formikRef} inDrawer />
    </Drawer>
  );
};

export default AddProductionDataDrawer;
