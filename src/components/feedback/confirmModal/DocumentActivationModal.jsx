// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { confirmModalEnum } from '@/utils/constants';

const COPY = confirmModalEnum.DOCUMENT_ACTIVATION;

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="shrink-0">{label}:</span>
    <span className="font-medium min-w-0 break-words text-right">{value}</span>
  </div>
);

const DetailCard = ({ heading, children }) => (
  <div className="py-3 px-4 bg-gray-50 rounded-md mb-4">
    <p className="text-sm font-medium text-gray-700 mb-2">{heading}</p>
    <div className="space-y-1 text-sm text-gray-600">{children}</div>
  </div>
);

// Confirms party/item activation before save; closing counts as Cancel.
// itemsHeading / itemsNote / okText override the warehouse copy for other activation kinds (e.g. customer portal).
const DocumentActivationModal = ({
  open,
  documentLabel,
  partyLabel = COPY.CUSTOMER_LABEL,
  partyName,
  branchName,
  warehouseName,
  itemNames = [],
  itemsHeading = COPY.ITEMS_HEADING,
  itemsNote = COPY.ITEMS_NOTE,
  okText = COPY.OK_TEXT,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const showParty = !!partyName;
  const showItems = itemNames.length > 0;

  return (
    <CustomModal modalOpen={open} setModalOpen={onCancel} width={500} title={COPY.TITLE(documentLabel)}>
      <div>
        {showParty && (
          <DetailCard heading={COPY.PARTY_HEADING(partyLabel)}>
            <DetailRow label={partyLabel} value={partyName} />
            {branchName && <DetailRow label={COPY.BRANCH_LABEL} value={branchName} />}
          </DetailCard>
        )}

        {showItems && (
          <DetailCard heading={itemsHeading}>
            <DetailRow label={COPY.ITEMS_LABEL} value={itemNames.join(', ')} />
            {warehouseName && <DetailRow label={COPY.WAREHOUSE_LABEL} value={warehouseName} />}
          </DetailCard>
        )}

        <div className="py-2 container-spacing rounded-md bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">{COPY.NOTE_TITLE}</p>
          {showParty && <p className="text-sm mt-1 text-yellow-700">{COPY.PARTY_NOTE(partyLabel)}</p>}
          {showItems && <p className="text-sm mt-1 text-yellow-700">{itemsNote}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <CustomButton className="px-8 py-4" type="default" text={COPY.CANCEL_TEXT} onClick={onCancel} disabled={loading} />
          <CustomButton className="px-8 py-4" type="primary" text={okText} onClick={onConfirm} loading={loading} />
        </div>
      </div>
    </CustomModal>
  );
};

export default DocumentActivationModal;
