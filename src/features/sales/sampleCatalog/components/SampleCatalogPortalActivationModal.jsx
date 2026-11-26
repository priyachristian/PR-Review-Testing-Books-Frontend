// Components
import DocumentActivationModal from '@/components/feedback/confirmModal/DocumentActivationModal';

// Utils
import { confirmModalEnum } from '@/utils/constants';

const COPY = confirmModalEnum.SAMPLE_CATALOG_PORTAL_ACTIVATION;

// `activation` is the backend 409 data: { visibility, items: [{ itemId, itemName }] }. Cancel keeps the catalog unsaved.
const SampleCatalogPortalActivationModal = ({ activation, okText = COPY.OK_TEXT, loading, onConfirm, onCancel }) => {
  const forAll = activation?.visibility === 'ALL_CUSTOMERS';
  return (
    <DocumentActivationModal
      open={Boolean(activation)}
      documentLabel={COPY.DOCUMENT_LABEL}
      itemNames={(activation?.items || []).map(item => item.itemName)}
      itemsHeading={forAll ? COPY.ITEMS_HEADING_ALL : COPY.ITEMS_HEADING_SELECTED}
      itemsNote={forAll ? COPY.ITEMS_NOTE_ALL : COPY.ITEMS_NOTE_SELECTED}
      okText={okText}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default SampleCatalogPortalActivationModal;
