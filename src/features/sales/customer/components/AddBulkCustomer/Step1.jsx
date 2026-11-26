import { Upload, Button } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import Toast from '@/components/ui/common/Toast';
import { colorPalette } from '@/utils/theme';
import { formatFileSize, readExcelFile } from 'utils/util';
import { BULK_CUSTOMER_ACCEPTED_EXTENSIONS, BULK_CUSTOMER_ACCEPT_LABEL, BULK_CUSTOMER_MAX_FILE_SIZE, downloadBulkPartnerSampleFile } from './data';

const { Dragger } = Upload;

function Step1({ file, setFile, setButtonLoading, uploadedFileMeta, setUploadedFileMeta, isVendorPage = false }) {
  const beforeUpload = async selectedFile => {
    setButtonLoading(true);

    if (selectedFile.size > BULK_CUSTOMER_MAX_FILE_SIZE) {
      setButtonLoading(false);
      Toast.error('File size must be less than 2MB');
      return false;
    }

    const isExcel = /\.(csv|xlsx|xls)$/i.test(selectedFile.name);
    if (!isExcel) {
      setButtonLoading(false);
      Toast.error('Invalid file type. Please upload a CSV or Excel file.');
      return false;
    }

    try {
      const fileData = await readExcelFile(selectedFile);
      setFile(fileData);
      setUploadedFileMeta({ name: selectedFile.name, size: selectedFile.size });
      setButtonLoading(false);
      Toast.success(`${selectedFile.name} uploaded successfully`);
    } catch {
      setButtonLoading(false);
      Toast.error('Error processing the file.');
    }

    return false;
  };

  const removeFile = () => {
    setFile(null);
    setUploadedFileMeta(null);
    Toast.warning('File removed.');
  };

  const hasFile = Boolean(file && uploadedFileMeta?.name);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <Icons.DownloadOutlined className="mt-1 text-xl shrink-0" style={{ color: colorPalette.primary[500] }} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">Download a sample file</p>
          <p className="mt-1 text-sm text-gray-600">Compare it to your import file to ensure you have the file perfect for the import.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['csv', 'xlsx', 'xls'].map(format => (
              <Button
                key={format}
                icon={<Icons.DownloadOutlined />}
                onClick={() => downloadBulkPartnerSampleFile(format, isVendorPage)}
                style={{
                  borderColor: colorPalette.primary[500],
                  color: colorPalette.primary[500],
                }}
              >
                Download Sample {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-900">Upload Your File</h3>

        {hasFile ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-white px-6 py-10">
            <Icons.FileExcelOutlined className="text-4xl mb-3" style={{ color: colorPalette.primary[500] }} />
            <p className="font-medium text-gray-900">{uploadedFileMeta.name}</p>
            <p className="mt-1 text-sm text-gray-500">{formatFileSize(uploadedFileMeta.size)}</p>
            <button type="button" onClick={removeFile} className="mt-3 text-sm font-medium bg-transparent border-0 cursor-pointer p-0" style={{ color: colorPalette.primary[500] }}>
              Remove file
            </button>
          </div>
        ) : (
          <Dragger accept={BULK_CUSTOMER_ACCEPTED_EXTENSIONS.join(',')} beforeUpload={beforeUpload} showUploadList={false} multiple={false} className="!bg-white">
            <p className="ant-upload-drag-icon">
              <Icons.CloudUploadOutlined style={{ fontSize: '2rem', color: colorPalette.primary[500] }} />
            </p>
            <p className="ant-upload-text">Click or drag file here to upload</p>
            <p className="ant-upload-hint">Supports {BULK_CUSTOMER_ACCEPT_LABEL} formats. Maximum file size: 2MB</p>
          </Dragger>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icons.InfoCircleOutlined style={{ color: colorPalette.warning[500] }} />
          <span className="font-semibold text-gray-900">Page Tips</span>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 list-none m-0 p-0">
          <li className="flex items-start gap-2">
            <Icons.InfoCircleOutlined className="mt-0.5 shrink-0 text-gray-400" />
            <span>Use the sample file format with correct GST Treatment and Business Partner Type values.</span>
          </li>
          <li className="flex items-start gap-2">
            <Icons.InfoCircleOutlined className="mt-0.5 shrink-0 text-gray-400" />
            <span>If you have files in other formats, you can convert it to an accepted file format using any online/offline converter.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Step1;
