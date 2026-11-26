// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import Icons from 'assets/icons/icon';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';

const ConfirmRemoveModal = ({
  modalOpen,
  setModalOpen,
  title,
  description,
  itemToRemove,
  onConfirm,
  onCancel,
  loading = false,
  showItemDetails = true,
  customItemDetails = null,
  importantNoteText = null,
}) => {
  const renderItemDetails = () => {
    if (customItemDetails) {
      return customItemDetails;
    }

    if (!itemToRemove || !showItemDetails) {
      return null;
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {itemToRemove?.invoiceNo && (
            <div>
              <span className="font-medium text-gray-600">Invoice No:</span>
              <p className="text-gray-900">{itemToRemove?.invoiceNo}</p>
            </div>
          )}
          {itemToRemove?.openingBalanceTransactionId && (
            <div>
              <span className="font-medium text-gray-600">Opening Balance No:</span>
              <p className="text-gray-900">{itemToRemove?.transactionNo || itemToRemove?.openingBalanceTransaction?.transactionNo || '—'}</p>
            </div>
          )}
          {itemToRemove?.billNo && (
            <div>
              <span className="font-medium text-gray-600">Bill No:</span>
              <p className="text-gray-900">{itemToRemove?.billNo}</p>
            </div>
          )}
          {itemToRemove?.creditNoteNo && (
            <div>
              <span className="font-medium text-gray-600">Credit Note No:</span>
              <p className="text-gray-900">{itemToRemove?.creditNoteNo}</p>
            </div>
          )}
          {itemToRemove?.debitNoteNo && (
            <div>
              <span className="font-medium text-gray-600">Debit Note No:</span>
              <p className="text-gray-900">{itemToRemove?.debitNoteNo}</p>
            </div>
          )}
          {itemToRemove?.amountApplied && (
            <div>
              <span className="font-medium text-gray-600">Amount Applied:</span>
              <p className="text-green-600 font-semibold">{formatAmount(itemToRemove?.amountApplied)}</p>
            </div>
          )}
          {itemToRemove?.appliedDate && (
            <div>
              <span className="font-medium text-gray-600">Applied Date:</span>
              <p className="text-gray-900">{dateFormateForUi(itemToRemove?.appliedDate)}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={setModalOpen}
      width={500}
      title={
        <div className="flex items-center space-x-2">
          <Icons.ExclamationCircleOutlined className="text-red-500 text-lg" />
          <span className="text-lg font-semibold">{title}</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icons.WarningOutlined className="text-red-500 text-lg mr-3" />
            <div>
              <p className="text-red-800 font-medium">{title}</p>
              <p className="text-red-600 text-sm mt-1">{description}</p>
            </div>
          </div>
        </div>

        {renderItemDetails()}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icons.InfoCircleOutlined className="text-yellow-500 text-lg mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">Important Note:</p>
              <p className="text-yellow-700 text-sm mt-1">{importantNoteText}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <CustomButton className="px-4 py-2" type="default" text="Cancel" onClick={onCancel} />
          <CustomButton className="px-4 py-2" type="primary" text="Remove" loading={loading} onClick={onConfirm} style={{ minWidth: 90, backgroundColor: '#dc2626', borderColor: '#dc2626' }} />
        </div>
      </div>
    </CustomModal>
  );
};

export default ConfirmRemoveModal;
