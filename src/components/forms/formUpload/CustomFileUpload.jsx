import { useCallback, useMemo, useRef } from 'react';

// Components
import { Form, Upload } from '@/components/AntDComponent';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';
import Toast from '@/components/ui/common/Toast';
import { CustomLabel } from '@/components/forms/formInput/CustomInput';
import { colorPalette } from '@/utils/theme';

// Extras
import Icons from '@/assets/icons/icon';

// Predefined file type configurations
const FILE_TYPE_PRESETS = {
  image: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    description: 'JPG, JPEG, PNG, and WEBP',
  },
  pdf: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    accept: 'application/pdf,.pdf',
    description: 'PDF',
  },
  all: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    accept: 'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf',
    description: 'JPEG,JPG, PNG, WEBP, and PDF',
  },
};

const DEFAULT_UPLOAD_TEXT = 'Choose a File or Drag & Drop it here';
const COMPACT_UPLOAD_TEXT = 'Choose a file or drop it here';

const getCompactFileName = file => {
  if (typeof file === 'string') {
    const last = file.split('/').pop() || '';
    let decoded = last;
    try {
      decoded = decodeURIComponent(last);
    } catch {
      decoded = last;
    }
    const underscoreIndex = decoded.indexOf('_');
    return underscoreIndex !== -1 ? decoded.slice(underscoreIndex + 1) : decoded;
  }
  return file?.name || 'Attachment';
};

const getCompactFileUrl = file => {
  if (typeof file === 'string') return file;
  if (file?.previewUrl) return file.previewUrl;
  if (file instanceof File) return URL.createObjectURL(file);
  return '';
};

const CompactFileList = ({ files, onRemove }) => (
  <div className="flex flex-wrap gap-1.5 mt-1.5">
    {files.map((file, index) => (
      <div key={index} className="inline-flex items-center gap-1.5 max-w-full rounded border border-[#d4d4d4] bg-gray-50 pl-2 pr-1 py-0.5">
        <Icons.PaperClipOutlined className="text-[11px] text-gray-400 flex-none" />
        <a href={getCompactFileUrl(file)} rel="noreferrer" target="_blank" className="text-[11px] text-gray-700 truncate max-w-[160px] hover:text-[var(--primary-500)]">
          {getCompactFileName(file)}
        </a>
        <Icons.CloseCircleFilled onClick={() => onRemove(file)} className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer flex-none" />
      </div>
    ))}
  </div>
);

const CustomFileUpload = ({
  // Basic props
  name,
  label,
  value,
  setFieldValue,
  onBlur,
  errorMessage,
  touched,
  required = false,
  className = '',
  labelClassName = '',

  // File configuration
  fileType = 'image', // 'image' | 'pdf' | 'document' | 'all' | custom object
  multiple = false,
  maxSize = 5, // in MB
  maxFiles = 10, // max number of files for multiple upload

  // Custom file types (overrides fileType preset)
  customMimeTypes,
  customExtensions,
  customAccept,
  customDescription,

  // Display options
  showUploadedFiles = true,
  compact = false, // single-row dropzone + chip list, sized to sit inside a field grid
  uploadText = DEFAULT_UPLOAD_TEXT,
  supportedTypesText, // Override the default supported types text

  // Callbacks
  onFileChange,
  onFileRemove,

  // Additional upload props
  uploadProps = {},
}) => {
  // Get file type configuration
  const fileTypeConfig = useMemo(() => {
    if (customMimeTypes || customExtensions) {
      return {
        mimeTypes: customMimeTypes || [],
        extensions: customExtensions || [],
        accept: customAccept || '',
        description: customDescription || 'Selected file types',
      };
    }
    return FILE_TYPE_PRESETS[fileType] || FILE_TYPE_PRESETS.image;
  }, [fileType, customMimeTypes, customExtensions, customAccept, customDescription]);

  // Validate file type
  const validateFileType = useCallback(
    file => {
      if (!file) return false;

      const fileMimeType = file.type?.toLowerCase();
      const fileName = file.name?.toLowerCase();
      const fileExtension = fileName ? `.${fileName.split('.').pop()}` : '';

      const isValidType = fileTypeConfig.mimeTypes.includes(fileMimeType);
      const isValidExtension = fileTypeConfig.extensions.includes(fileExtension);
      return isValidType || isValidExtension;
    },
    [fileTypeConfig]
  );

  // Validate file size
  const validateFileSize = useCallback(
    file => {
      if (!file) return false;
      const maxSizeBytes = maxSize * 1024 * 1024;
      return file.size <= maxSizeBytes;
    },
    [maxSize]
  );

  // Ref to track pending files for batch processing (multiple file drops)
  const pendingFilesRef = useRef([]);

  // Handle file upload - processes files from beforeUpload
  // For multiple file drops, we batch process when the last file arrives
  const handleFileUpload = useCallback(
    (file, fileList) => {
      if (!file) {
        Toast.error('No file selected for upload.');
        return false;
      }

      // For single file upload, just validate and set
      if (!multiple) {
        if (!validateFileType(file)) {
          Toast.error(`Invalid file type. Only ${fileTypeConfig.description} files are allowed.`);
          return false;
        }
        if (!validateFileSize(file)) {
          Toast.error(`File size exceeds ${maxSize}MB limit.`);
          return false;
        }
        setFieldValue(name, file);
        onFileChange?.(file);
        return true;
      }

      // For multiple files, batch process when last file in the list is reached
      const fileIndex = fileList.findIndex(f => f.uid === file.uid);
      const isLastFile = fileIndex === fileList.length - 1;

      // If first file in batch, reset pending files
      if (fileIndex === 0) {
        pendingFilesRef.current = [];
      }

      // Validate current file and add to pending if valid
      if (!validateFileType(file)) {
        Toast.error(`Invalid file type. Only ${fileTypeConfig.description} files are allowed: ${file.name}`);
      } else if (!validateFileSize(file)) {
        Toast.error(`File size exceeds ${maxSize}MB limit: ${file.name}`);
      } else {
        pendingFilesRef.current.push(file);
      }

      // If this is the last file, process all valid pending files
      if (isLastFile) {
        const currentFiles = Array.isArray(value) ? value : value ? [value] : [];
        const remainingSlots = maxFiles - currentFiles.length;

        if (remainingSlots <= 0) {
          Toast.error(`Maximum ${maxFiles} files allowed.`);
          pendingFilesRef.current = [];
          return false;
        }

        // Only add files up to the remaining slots
        const filesToAdd = pendingFilesRef.current.slice(0, remainingSlots);

        if (filesToAdd.length < pendingFilesRef.current.length) {
          Toast.error(`Only ${filesToAdd.length} file(s) added. Maximum ${maxFiles} files allowed.`);
        }

        if (filesToAdd.length > 0) {
          const updatedFiles = [...currentFiles, ...filesToAdd];
          setFieldValue(name, updatedFiles);
          onFileChange?.(updatedFiles);
        }

        pendingFilesRef.current = [];
      }

      return true;
    },
    [name, value, multiple, maxFiles, maxSize, setFieldValue, validateFileType, validateFileSize, fileTypeConfig, onFileChange]
  );

  // Handle file removal
  const handleFileRemove = useCallback(
    fileToRemove => {
      if (!multiple) {
        // Single file mode - set to null
        setFieldValue(name, null);
        onFileRemove?.(null);
      } else {
        // Multiple files mode - filter out the file
        const currentFiles = Array.isArray(value) ? value : [];
        const updatedFiles = currentFiles.filter(f => f !== fileToRemove);
        setFieldValue(name, updatedFiles.length > 0 ? updatedFiles : null);
        onFileRemove?.(updatedFiles);
      }
    },
    [name, value, multiple, setFieldValue, onFileRemove]
  );

  // Get files array for display
  const filesForDisplay = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }, [value]);

  // Default supported types text
  const displaySupportedTypes = supportedTypesText || `Supported File Types: ${fileTypeConfig.description}`;
  const compactUploadText = compact && uploadText === DEFAULT_UPLOAD_TEXT ? COMPACT_UPLOAD_TEXT : uploadText;

  return (
    <>
      <div className={`w-full ${className}`}>
        <Form.Item
          label={label && <CustomLabel label={label} name={name} required={required} labelClassName={labelClassName} />}
          validateStatus={touched && errorMessage ? 'error' : ''}
          help={touched && errorMessage}
        >
          <Upload.Dragger
            id={name}
            multiple={multiple}
            onBlur={onBlur}
            showUploadList={false}
            accept={fileTypeConfig.accept}
            beforeUpload={(file, fileList) => {
              handleFileUpload(file, fileList);
              return false; // Prevent auto upload
            }}
            className={`custom-upload font-normal ${compact ? 'custom-upload-compact' : ''}`}
            {...uploadProps}
          >
            {compact ? (
              <div className="w-full min-h-[90px] py-3 border border-dashed border-[#d4d4d4] rounded-lg flex flex-col items-center justify-center gap-1.5 px-4 hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Icons.CloudUploadOutlined className="text-base" style={{ color: colorPalette.primary[500] }} />
                  <span className="text-xs font-semibold text-gray-700 leading-none truncate">{compactUploadText}</span>
                </div>
                <div className="text-[11px] text-gray-400 leading-none truncate">{displaySupportedTypes}</div>
              </div>
            ) : (
              <div className="w-full h-20 sm:h-28 lg:h-32 border-2 border-dashed border-[#d4d4d4] rounded-lg flex flex-col items-center justify-center gap-1 sm:gap-1.5 hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] transition-colors cursor-pointer p-4">
                <Icons.CloudUploadOutlined className="text-lg sm:text-xl md:text-2xl" style={{ color: colorPalette.primary[500] }} />
                <div className="font-bold text-[10px] sm:text-xs leading-tight text-center">{uploadText}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs leading-tight opacity-80 text-center px-2">{displaySupportedTypes}</div>
              </div>
            )}
          </Upload.Dragger>
        </Form.Item>
        {compact && showUploadedFiles && filesForDisplay.length > 0 && <CompactFileList files={filesForDisplay} onRemove={handleFileRemove} />}
      </div>

      {!compact && showUploadedFiles && filesForDisplay.length > 0 && <DisplayUploadedDocuments fileArray={filesForDisplay} setFiles={handleFileRemove} />}
    </>
  );
};

export default CustomFileUpload;
