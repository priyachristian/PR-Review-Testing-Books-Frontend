import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import Stepper from '@/components/ui/common/Stepper';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import Step1 from '../components/AddBulkInventory/Step1';
import Step2 from '../components/AddBulkInventory/Step2';
import Step3 from '../components/AddBulkInventory/Step3';
import { itemMasterSliceMethods } from '@/features/allMaster/item';

const PREVIEW_STEP = 2;

const normalizeVerifyResponse = data => ({
  totalRecords: data?.totalRecords ?? 0,
  validRecordsCount: data?.validCount ?? 0,
  invalidRecordsCount: data?.invalidCount ?? 0,
  validRecords: data?.validRecords ?? [],
  invalidRecords: data?.invalidRecords ?? [],
});

const toVerifyPayload = itemInventory =>
  (itemInventory ?? []).map(item => ({
    itemNo: item.itemNo,
    warehouses: item.warehouses,
  }));

function AddBulkInventory() {
  const [current, setCurrent] = useState(0);
  const [file, setFile] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const warehouseNames = file?.warehouseNames ?? [];

  const handleNext = async () => {
    if (current === 0) {
      if (!file?.itemInventory?.length) {
        Toast.error('Please select a valid inventory file.');
        return;
      }

      setButtonLoading(true);
      try {
        const response = await dispatch(
          itemMasterSliceMethods.verifyBulkInventory({
            itemInventory: toVerifyPayload(file.itemInventory),
          })
        ).unwrap();
        setVerifyRecord(normalizeVerifyResponse(response?.data));
        setCurrent(1);
      } catch (error) {
        console.log(error);
        Toast.error(error?.message || error || 'Bulk inventory verification failed. Please try again.');
      } finally {
        setButtonLoading(false);
      }
      return;
    }

    setCurrent(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (current === 1) {
      setVerifyRecord(null);
    }
    setCurrent(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setButtonLoading(true);

    try {
      const validRecords = verifyRecord?.validRecords ?? [];
      const itemInventory = validRecords.map(item => ({
        itemNo: item.itemNo,
        warehouses: item.warehouses,
      }));

      await dispatch(
        itemMasterSliceMethods.createBulkInventory({
          itemInventory,
        })
      ).unwrap();
      navigate(-1);
    } catch (error) {
      console.log(error);
    } finally {
      setButtonLoading(false);
    }
  };

  const renderStepContent = useMemo(() => {
    const stepMapping = {
      0: <Step1 file={file} setFile={setFile} setButtonLoading={setButtonLoading} uploadedFileMeta={uploadedFileMeta} setUploadedFileMeta={setUploadedFileMeta} />,
      1: <Step2 verifyRecords={verifyRecord} warehouseNames={warehouseNames} />,
      2: <Step3 verifyRecords={verifyRecord} warehouseNames={warehouseNames} />,
    };

    return stepMapping[current];
  }, [current, file, uploadedFileMeta, verifyRecord, warehouseNames]);

  const stepDescriptions = [
    'Upload your inventory file or download a sample to get started.',
    'Review server-side verification results before proceeding.',
    'Review validated records before importing.',
  ];

  return (
    <div className="-m-4 bg-white h-screen">
      <div className="pt-4 pb-4 flex flex-col items-center gap-3 px-4">
        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white px-6 py-4">
          <Stepper current={current} steps={[{ title: 'Configure' }, { title: 'Verify' }, { title: 'Preview' }]} />
        </div>

        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white px-6 py-4">
          <h1 className="text-xl font-bold" style={{ color: colorPalette.primary[900] }}>
            Bulk Inventory - Select File
          </h1>
          <p className="mt-1 text-sm text-gray-500">{stepDescriptions[current]}</p>
        </div>

        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4">
          <div>{renderStepContent}</div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <Button onClick={() => navigate('/item-master')}>Cancel</Button>
            <div className="flex flex-wrap gap-2">
              {current > 0 && (
                <Button icon={<Icons.LeftOutlined className="text-xs" />} onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              <Button
                type="primary"
                icon={current === PREVIEW_STEP ? null : <Icons.RightOutlined className="text-xs" />}
                iconPosition="end"
                onClick={current === PREVIEW_STEP ? handleSubmit : handleNext}
                loading={buttonLoading}
                disabled={current === PREVIEW_STEP && !(verifyRecord?.validRecordsCount > 0)}
                style={{
                  backgroundColor: colorPalette.primary[500],
                  borderColor: colorPalette.primary[500],
                }}
              >
                {current === PREVIEW_STEP ? 'Import' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddBulkInventory;
