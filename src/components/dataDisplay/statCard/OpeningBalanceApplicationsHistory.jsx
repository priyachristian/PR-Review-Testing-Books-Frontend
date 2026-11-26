import { useNavigate } from 'react-router-dom';
import ConfirmRemoveModal from '@/components/feedback/confirmModal/ConfirmRemoveModal';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { Tag } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { getObApplicationKindLabel, getObApplicationPaymentNavPath, getObRelatedDocumentStatusLabel, isOpeningBalanceCreditType } from 'utils/openingBalanceUtils';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { colorPalette } from '@/utils/theme';

const sectionCard = (title, description, table) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description ? <p className="text-sm text-gray-600 mt-1">{description}</p> : null}
    </div>
    {table}
  </div>
);

const OpeningBalanceApplicationsHistory = ({
  applications = [],
  loading,
  creditSectionTitle,
  creditSectionDescription,
  balanceSectionTitle,
  balanceSectionDescription,
  showDelete,
  onRequestRemove,
  removeModalOpen,
  entryPendingRemove,
  onCloseRemoveModal,
  onConfirmRemove,
  removeLoading,
  currency,
}) => {
  const navigate = useNavigate();

  const creditApps = applications.filter(e => isOpeningBalanceCreditType(e?.type));
  const otherApps = applications.filter(e => !isOpeningBalanceCreditType(e?.type));

  const renderTable = (rows, { showAction, showSourcePaymentDocument }) => {
    const paymentColumnLabel = rows.some(r => r?.paymentNavKind === 'made') ? 'Payment Made #' : 'Payment Received #';

    return (
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center min-h-[75px]">
            <CustomLoader />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {showSourcePaymentDocument ? <th className="text-left py-4 px-6 font-semibold text-gray-700">{paymentColumnLabel}</th> : null}
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                {showSourcePaymentDocument ? <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th> : null}
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Type</th>
                {!showSourcePaymentDocument ? <th className="text-left py-4 px-6 font-semibold text-gray-700">Applied To</th> : null}
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Applied</th>
                {showAction ? <th className="text-right py-4 px-6 font-semibold text-gray-700">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(entry => {
                const rowType = entry?.type;
                const kindLabel = getObApplicationKindLabel(rowType);
                const isCredit = isOpeningBalanceCreditType(rowType);
                const navPath = showSourcePaymentDocument ? getObApplicationPaymentNavPath(entry) : null;
                const appliedTo = entry?.targetTransactionNo || entry?.billNo || entry?.invoiceNo || null;
                return (
                  <tr key={entry?._id} className={`hover:bg-gray-50 transition-colors ${navPath ? 'cursor-pointer' : ''}`} onClick={() => navPath && navigate(navPath)}>
                    {showSourcePaymentDocument ? (
                      <td className="py-4 px-6">
                        <Tag className="font-semibold">{entry?.paymentDocumentNo || '-'}</Tag>
                      </td>
                    ) : null}
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{dateFormateForUi(entry?.appliedDate)}</span>
                    </td>
                    {showSourcePaymentDocument && (
                      <td className="py-4 px-6">
                        <StatusBadge status={entry.relatedDocumentStatus} value={getObRelatedDocumentStatusLabel(entry.relatedDocumentStatus)} />
                      </td>
                    )}
                    <td className="py-4 px-6 text-gray-700">{kindLabel}</td>
                    {!showSourcePaymentDocument ? (
                      <td className="py-4 px-6">
                        <Tag className="font-semibold">{appliedTo || '-'}</Tag>
                      </td>
                    ) : null}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">{formatAmount(entry?.amountApplied || 0, true, currency)}</span>
                    </td>
                    {showAction ? (
                      <td className="py-4 px-6 text-right">
                        {showDelete && isCredit ? (
                          <Icons.DeleteOutlined
                            style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }}
                            onClick={e => {
                              e.stopPropagation();
                              onRequestRemove?.(entry);
                            }}
                          />
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };
  const showActionCredit = !!showDelete;

  const obRemoveCustomDetails =
    entryPendingRemove != null ? (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {entryPendingRemove.transactionNo ? (
            <div>
              <span className="font-medium text-gray-600">Opening Balance #:</span>
              <p className="text-gray-900">{entryPendingRemove.transactionNo}</p>
            </div>
          ) : null}
          {entryPendingRemove.targetTransactionNo || entryPendingRemove.billNo ? (
            <div>
              <span className="font-medium text-gray-600">Applied To:</span>
              <p className="text-gray-900">{entryPendingRemove.targetTransactionNo || entryPendingRemove.billNo}</p>
            </div>
          ) : null}
          {entryPendingRemove.amountApplied != null ? (
            <div>
              <span className="font-medium text-gray-600">Amount Applied:</span>
              <p className="text-green-600 font-semibold">{formatAmount(entryPendingRemove.amountApplied, true, currency)}</p>
            </div>
          ) : null}
          {entryPendingRemove.appliedDate ? (
            <div>
              <span className="font-medium text-gray-600">Applied Date:</span>
              <p className="text-gray-900">{dateFormateForUi(entryPendingRemove.appliedDate)}</p>
            </div>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="space-y-5">
        {creditApps.length > 0 &&
          sectionCard(
            creditSectionTitle,
            creditSectionDescription,
            renderTable(creditApps, {
              showAction: showActionCredit,
              showSourcePaymentDocument: false,
            })
          )}

        {otherApps.length > 0 && sectionCard(balanceSectionTitle, balanceSectionDescription, renderTable(otherApps, { showAction: false, showSourcePaymentDocument: true }))}
      </div>

      <ConfirmRemoveModal
        modalOpen={removeModalOpen}
        setModalOpen={open => {
          if (!open) onCloseRemoveModal?.();
        }}
        title="Remove Applied Opening Balance Credit"
        description="Are you sure you want to remove this opening balance credit from the applied list?"
        itemToRemove={null}
        customItemDetails={obRemoveCustomDetails}
        importantNoteText={`Removing this opening balance credit will restore the amount to the opening balance, This action cannot be undone.`}
        onConfirm={onConfirmRemove}
        onCancel={onCloseRemoveModal}
        loading={removeLoading}
        showItemDetails
      />
    </>
  );
};

export default OpeningBalanceApplicationsHistory;
