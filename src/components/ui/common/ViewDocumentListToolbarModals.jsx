import DocumentConfigSheet from '@/components/dataDisplay/statCard/DocumentConfigSheet';
import ExportDataModal from '@/components/ui/common/ExportDataModal';

const ViewDocumentListToolbarModals = ({ resource, documentConfig, exportModal }) => (
  <>
    {documentConfig ? <DocumentConfigSheet resource={resource} {...documentConfig} /> : null}
    {exportModal ? <ExportDataModal {...exportModal} /> : null}
  </>
);

export default ViewDocumentListToolbarModals;
