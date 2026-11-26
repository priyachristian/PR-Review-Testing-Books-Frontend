import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { Alert, Button, Input, Progress } from '@/components/AntDComponent';
import { colorPalette } from 'utils/theme';

const FIELD_LABEL_CLASS = 'leading-none font-medium text-[13px] text-[#374151]';

const FORMAT_OPTIONS = {
  xlsx: { value: 'xlsx', label: 'XLSX (Microsoft Excel)', extension: 'xlsx' },
  pdf: { value: 'pdf', label: 'PDF (Portable Document Format)', extension: 'pdf' },
  eInvoice: { value: 'eInvoice', label: 'E-Invoice (PDF)', extension: 'pdf' },
  eWayBill: { value: 'eWayBill', label: 'E-Way Bill (PDF)', extension: 'pdf' },
  eInvoiceAndEWayBill: { value: 'eInvoiceAndEWayBill', label: 'E-Invoice + E-Way Bill (PDF)', extension: 'pdf' },
};

const FORMAT_FILE_SUFFIX = {
  eInvoice: '_E_Invoice',
  eWayBill: '_E_Way_Bill',
  eInvoiceAndEWayBill: '_E_Invoice_E_Way_Bill',
};

const FORMAT_NOTES = {
  eInvoice: 'Only records with an active e-invoice are included. Each page is that document with its e-invoice details.',
  eWayBill: 'Only records with an active e-way bill are included. The file contains the e-way bill for each matching record.',
  eInvoiceAndEWayBill: 'Only records with both an active e-invoice and an active e-way bill are included. Each record is printed with its e-invoice details and its e-way bill.',
};

const ExportDataModal = ({
  modalOpen,
  setModalOpen,
  entityPlural,
  defaultFileName,
  exportLoading = false,
  exportProgress = null,
  onExport,
  onRetryExport = null,
  formName = 'export-data',
  formats = ['xlsx'],
}) => {
  const filterExportNote = `Exported ${entityPlural} data will follow the currently applied filters in the list view. Only the filtered ${entityPlural} records will be included in the export file.`;
  const [exportFileName, setExportFileName] = useState('');
  const [exportFormat, setExportFormat] = useState(formats[0] || 'xlsx');
  const wasModalOpenRef = useRef(false);

  const formatsKey = Array.isArray(formats) ? formats.join('|') : 'xlsx';
  const availableFormats = useMemo(() => formatsKey.split('|').filter(format => FORMAT_OPTIONS[format]), [formatsKey]);
  const formatSupportsSelection = availableFormats.length > 1;
  const selectedFormat = FORMAT_OPTIONS[exportFormat] || FORMAT_OPTIONS.xlsx;
  const showProgress = !!exportProgress?.message && (exportLoading || exportProgress?.canRetry || exportProgress?.stage === 'failed' || exportProgress?.stage === 'completed_with_errors');
  const progressPercent = Math.max(0, Math.min(100, Number(exportProgress?.percent) || 0));

  const resolveDefaultFileName = useCallback(() => {
    if (defaultFileName) return defaultFileName;
    const entitySanitized = (entityPlural || 'Export').replace(/[^a-zA-Z0-9]+/g, '_');
    return `${entitySanitized}_Export`;
  }, [defaultFileName, entityPlural]);

  const fileNameForFormat = useCallback(
    format => {
      const base = resolveDefaultFileName();
      const suffix = FORMAT_FILE_SUFFIX[format];
      return suffix ? `${base}${suffix}` : base;
    },
    [resolveDefaultFileName]
  );

  useEffect(() => {
    if (modalOpen && !wasModalOpenRef.current) {
      const initialFormat = availableFormats.includes(formats[0]) ? formats[0] : availableFormats[0] || 'xlsx';
      setExportFormat(initialFormat);
      setExportFileName(fileNameForFormat(initialFormat));
    }
    wasModalOpenRef.current = modalOpen;
  }, [modalOpen, availableFormats, formats, fileNameForFormat]);

  const handleCancel = () => {
    if (exportLoading) return;
    setModalOpen(false);
  };

  const handleFormatChange = value => {
    setExportFormat(previousFormat => {
      setExportFileName(currentName => {
        const previousDefault = fileNameForFormat(previousFormat);
        return !currentName || currentName === previousDefault ? fileNameForFormat(value) : currentName;
      });
      return value;
    });
  };

  const handleExport = () => {
    const fileName = exportFileName?.trim() || fileNameForFormat(exportFormat);
    onExport({ fileName, format: exportFormat });
  };

  const radioOptions = availableFormats.map(format => FORMAT_OPTIONS[format]);

  return (
    <CustomModal modalOpen={modalOpen} setModalOpen={setModalOpen} title={`Export ${entityPlural}`} width={560} destroyOnClose>
      <CustomForm name={formName} layout="vertical" className="export-data-modal-form py-1">
        <Alert type="warning" showIcon message={FORMAT_NOTES[exportFormat] || filterExportNote} className="export-data-alert" />

        <div className="export-data-section">
          <CustomInput
            label="Export File Format"
            name="exportFileFormat"
            type="radio"
            value={exportFormat}
            required
            setFieldValue={(_, value) => handleFormatChange(value)}
            radioOptions={radioOptions}
            labelClassName={FIELD_LABEL_CLASS}
            className="custom-radio"
            disabled={!formatSupportsSelection || exportLoading}
          />
        </div>

        <div className="export-data-section">
          <label htmlFor="export-file-name" className={`block mb-2 ${FIELD_LABEL_CLASS}`}>
            Export File Name
          </label>
          <Input
            id="export-file-name"
            value={exportFileName}
            onChange={e => setExportFileName(e.target.value)}
            placeholder="Enter file name"
            suffix={`.${selectedFormat.extension}`}
            disabled={exportLoading}
          />
        </div>

        {showProgress ? (
          <div className="export-data-section export-data-progress">
            <div className="export-data-progress-label">{exportProgress.message}</div>
            <Progress
              percent={progressPercent}
              status={exportProgress?.stage === 'failed' ? 'exception' : progressPercent >= 100 ? 'success' : 'active'}
              strokeColor={colorPalette.primary[500]}
              showInfo
              size="small"
            />
            {exportProgress?.total > 0 ? (
              <div className="export-data-progress-meta">
                {Math.min(exportProgress.current ?? 0, exportProgress.total)} of {exportProgress.total} {(entityPlural || 'records').toLowerCase()}
              </div>
            ) : null}
            {exportProgress?.stage === 'completed_with_errors' && exportProgress?.skippedDocumentIds?.length ? (
              <Alert type="warning" showIcon className="mt-2" message={`${exportProgress.skippedDocumentIds.length} document(s) were skipped. You can retry the export.`} />
            ) : null}
            {exportProgress?.stage === 'failed' && exportProgress?.error ? <Alert type="error" showIcon className="mt-2" message={exportProgress.error} /> : null}
          </div>
        ) : null}

        <div className="export-data-modal-footer">
          <Button onClick={handleCancel} disabled={exportLoading}>
            Cancel
          </Button>
          {exportProgress?.canRetry && typeof onRetryExport === 'function' ? (
            <Button type="primary" onClick={() => onRetryExport({ fileName: exportFileName?.trim() || resolveDefaultFileName(), format: exportFormat })} loading={exportLoading}>
              Retry
            </Button>
          ) : (
            <Button type="primary" onClick={handleExport} loading={exportLoading}>
              Export
            </Button>
          )}
        </div>
      </CustomForm>
    </CustomModal>
  );
};

export default ExportDataModal;
