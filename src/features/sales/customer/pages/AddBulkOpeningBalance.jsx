import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import Stepper from '@/components/ui/common/Stepper';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import Step1 from '../components/AddBulkOpeningBalance/Step1';
import Step2 from '../components/AddBulkOpeningBalance/Step2';
import Step3 from '../components/AddBulkOpeningBalance/Step3';
import { customerMasterSliceMethods } from '@/features/sales/customer';

const PREVIEW_STEP = 2;

const normalizeVerifyResponse = data => ({
  totalRecords: data?.totalRecords ?? 0,
  validRecordsCount: data?.validCount ?? 0,
  invalidRecordsCount: data?.invalidCount ?? 0,
  validRecords: data?.validRecords ?? [],
  invalidRecords: data?.invalidRecords ?? [],
});

const toVerifyPayload = customerOpeningBalance =>
  (customerOpeningBalance ?? []).map(item => ({
    customerNumber: item.customerNumber,
    branch: item.branch,
  }));

function AddBulkOpeningBalance() {
  const [current, setCurrent] = useState(0);
  const [file, setFile] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isVendorPage = location.pathname.includes('vendors');
  const listingPath = isVendorPage ? '/vendors' : '/customer-master';
  const entityLabel = isVendorPage ? 'Vendor' : 'Customer';

  const branchNames = file?.branchNames ?? [];

  const handleNext = async () => {
    if (current === 0) {
      if (!file?.customerOpeningBalance?.length) {
        Toast.error('Please select a valid opening balance file.');
        return;
      }

      setButtonLoading(true);
      try {
        const response = await dispatch(
          customerMasterSliceMethods.verifyBulkOpeningBalance({
            customerOpeningBalance: toVerifyPayload(file.customerOpeningBalance),
          })
        ).unwrap();
        setVerifyRecord(normalizeVerifyResponse(response?.data));
        setCurrent(1);
      } catch (error) {
        console.log(error);
        Toast.error(error?.message || error || 'Opening balance verification failed. Please try again.');
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
      const customerOpeningBalance = validRecords.map(item => ({
        customerNumber: item.customerNumber,
        branch: item.branch,
      }));

      await dispatch(
        customerMasterSliceMethods.createBulkOpeningBalance({
          customerOpeningBalance,
        })
      ).unwrap();
      navigate(listingPath);
    } catch (error) {
      console.log(error);
    } finally {
      setButtonLoading(false);
    }
  };

  const renderStepContent = useMemo(() => {
    const stepMapping = {
      0: <Step1 file={file} setFile={setFile} setButtonLoading={setButtonLoading} uploadedFileMeta={uploadedFileMeta} setUploadedFileMeta={setUploadedFileMeta} isVendorPage={isVendorPage} />,
      1: <Step2 verifyRecords={verifyRecord} branchNames={branchNames} />,
      2: <Step3 verifyRecords={verifyRecord} branchNames={branchNames} isVendorPage={isVendorPage} />,
    };

    return stepMapping[current];
  }, [current, file, uploadedFileMeta, verifyRecord, branchNames, isVendorPage]);

  const stepDescriptions = [
    'Upload your opening balance file or download a sample to get started.',
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
            {entityLabel} Opening Balance - Select File
          </h1>
          <p className="mt-1 text-sm text-gray-500">{stepDescriptions[current]}</p>
        </div>

        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4">
          <div>{renderStepContent}</div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <Button onClick={() => navigate(listingPath)}>Cancel</Button>
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

export default AddBulkOpeningBalance;
