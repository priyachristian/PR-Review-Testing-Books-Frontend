import { useCallback, useEffect, useState } from 'react';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { Button, Input, Radio } from '../../AntDComponent';

const ExportReportModal = ({ modalOpen, setModalOpen, reportName = 'Report', entity = '', onExport, initialFormat = 'pdf', title = 'Export Report', formats = ['pdf', 'xlsx'] }) => {
  const [exportFormat, setExportFormat] = useState(initialFormat);
  const [exportFileName, setExportFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Generate default filename: ${reportName}_${entity}_${YYYYMMDD}.${format}
  // If entity is empty, format will be: ${reportName}_${YYYYMMDD}.${format}
  const generateDefaultFileName = useCallback(
    format => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // Sanitize report name
      const reportNameSanitized = reportName ? reportName.replace(/[^a-zA-Z0-9]/g, '_') : 'Report';

      // Sanitize entity name (optional)
      const entitySanitized = entity ? entity.replace(/[^a-zA-Z0-9]/g, '_') : '';

      // Build filename with or without entity
      if (entitySanitized) {
        return `${reportNameSanitized}_${entitySanitized}_${dateStr}.${format}`;
      } else {
        return `${reportNameSanitized}_${dateStr}.${format}`;
      }
    },
    [reportName, entity]
  );

  // Update format when modal opens with a new initialFormat
  // Ensure initialFormat is valid (exists in formats array)
  useEffect(() => {
    if (modalOpen) {
      const validFormat = formats.includes(initialFormat) ? initialFormat : formats[0];
      setExportFormat(validFormat);
      const defaultFileName = generateDefaultFileName(validFormat).replace(`.${validFormat}`, '');
      setExportFileName(defaultFileName);
    }
  }, [modalOpen, initialFormat, formats, generateDefaultFileName]);

  // Reset format and loading when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setExportFileName('');
      setIsExporting(false);
    }
  }, [modalOpen]);

  const handleFormatChange = e => {
    const newFormat = e.target.value;
    // Only allow formats that are in the formats array
    if (formats.includes(newFormat)) {
      setExportFormat(newFormat);
      // Regenerate default filename with new format
      const defaultFileName = generateDefaultFileName(newFormat).replace(`.${newFormat}`, '');
      setExportFileName(defaultFileName);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const filename = exportFileName || generateDefaultFileName(exportFormat).replace(`.${exportFormat}`, '');

    try {
      // Call onExport and handle both sync and async cases
      const result = onExport(exportFormat, filename);
      // If onExport returns a promise, wait for it
      if (result && typeof result.then === 'function') {
        await result;
      }
      setModalOpen(false);

      // Close modal after export completes
    } catch (error) {
      console.error('Export error:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    // Prevent closing while exporting
    if (isExporting) return;

    setModalOpen(false);
    setExportFileName('');
    setExportFormat(initialFormat);
  };

  return (
    <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title={title} width={520} destroyOnClose={true}>
      <div className="space-y-4 py-2">
        {/* Format Selection */}
        {formats.length > 1 && (
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">Export Format</div>
            <Radio.Group value={exportFormat} onChange={handleFormatChange} className="flex gap-4" disabled={isExporting}>
              {formats.includes('pdf') && <Radio value="pdf">PDF</Radio>}
              {formats.includes('xlsx') && <Radio value="xlsx">Excel</Radio>}
            </Radio.Group>
          </div>
        )}

        {/* File Name Input */}
        <div>
          <label htmlFor="export-file-name" className="block text-sm font-medium text-gray-700 mb-2">
            Export File Name
          </label>
          <Input id="export-file-name" value={exportFileName} onChange={e => setExportFileName(e.target.value)} placeholder="Enter file name" suffix={`.${exportFormat}`} disabled={isExporting} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={handleCancel} disabled={isExporting}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleExport} disabled={isExporting} loading={isExporting}>
            Export
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default ExportReportModal;
