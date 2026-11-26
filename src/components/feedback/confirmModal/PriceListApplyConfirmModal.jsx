// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { confirmModalEnum } from '@/utils/constants';

export const PRICE_LIST_CONFIRM_MODE = {
  APPLY: 'apply',
  REMOVE: 'remove',
};

const COPY_BY_MODE = {
  [PRICE_LIST_CONFIRM_MODE.APPLY]: confirmModalEnum.PRICE_LIST_APPLY_CONVERTED,
  [PRICE_LIST_CONFIRM_MODE.REMOVE]: confirmModalEnum.PRICE_LIST_REMOVE_CONVERTED,
};

// Confirms applying or removing a price list on a converted document; closing counts as "No".
const PriceListApplyConfirmModal = ({ open, mode = PRICE_LIST_CONFIRM_MODE.APPLY, priceList, onConfirm, onCancel }) => {
  if (!open) return null;

  const COPY = COPY_BY_MODE[mode] || COPY_BY_MODE[PRICE_LIST_CONFIRM_MODE.APPLY];
  const priceListName = priceList?.priceListName;
  const priceListCode = priceList?.priceListCode;

  return (
    <CustomModal modalOpen={open} setModalOpen={onCancel} width={480} title={COPY.TITLE}>
      <div>
        <p className="text-sm text-gray-700">{COPY.MESSAGE}</p>

        {priceListName && (
          <div className="py-3 px-4 bg-gray-50 rounded-md mt-4">
            <div className="flex justify-between gap-3 text-sm text-gray-600">
              <span className="shrink-0">{COPY.PRICE_LIST_LABEL}</span>
              <span className="font-medium text-gray-800 min-w-0 break-words text-right">{priceListCode ? `${priceListName} (${priceListCode})` : priceListName}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <CustomButton type="default" text={COPY.CANCEL_TEXT} onClick={onCancel} />
          <CustomButton type="primary" text={COPY.OK_TEXT} onClick={onConfirm} />
        </div>
      </div>
    </CustomModal>
  );
};

export default PriceListApplyConfirmModal;
