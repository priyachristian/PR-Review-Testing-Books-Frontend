import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import Stepper from '@/components/ui/common/Stepper';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import Step1 from '../components/AddBulkItems/Step1';
import Step2 from '../components/AddBulkItems/Step2';
import Step3 from '../components/AddBulkItems/Step3';
import Step4 from '../components/AddBulkItems/Step4';
import { itemMappingFields, validateBulkItemMapping } from '../components/AddBulkItems/data';
import {
  addBulkItemValidateSchema,
  applyAccountFix,
  applyItemGroupFix,
  applyItemUnitFix,
  applySubItemGroupFix,
  buildBulkItemImportPayload,
  getEffectiveVerifyRecords,
  itemMasterSliceMethods,
} from '@/features/allMaster/item';
import { buildDefaultFieldMapping, mapImportFileRows, validateImportRecords } from 'utils/util';

const PREVIEW_STEP = 3;
const VERIFY_STEP = 2;

const normalizeVerifyResponse = data => ({
  totalRecords: data?.totalRecords ?? 0,
  validRecordsCount: data?.validCount ?? 0,
  invalidRecordsCount: data?.invalidCount ?? 0,
  validRecords: data?.validRecords ?? [],
  invalidRecords: data?.invalidRecords ?? [],
});

function AddBulkItems() {
  const [current, setCurrent] = useState(0);
  const [file, setFile] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [mapping, setMapping] = useState({});
  const [errors, setErrors] = useState({});
  const [localRecord, setLocalRecord] = useState(null);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (file?.columns?.length) {
      setMapping(buildDefaultFieldMapping(file.columns, itemMappingFields));
      setErrors({});
    } else {
      setMapping({});
    }
  }, [file]);

  const validateSteps = step => {
    let isValid = true;

    if (step === 0) {
      if (!file) {
        isValid = false;
        Toast.error('Please select a file.');
      }
    }

    if (step === 1) {
      const newErrors = validateBulkItemMapping(mapping);
      isValid = Object.keys(newErrors).length === 0;
      setErrors(newErrors);

      if (!isValid) {
        Toast.error('Please fill all required fields before proceeding.');
      }
    }

    return isValid;
  };

  async function processRecords(step, fileData, fieldMapping) {
    if (step === 1) {
      const mappedRecords = mapImportFileRows(fileData, fieldMapping);
      return validateImportRecords(mappedRecords, addBulkItemValidateSchema, {
        getRecordLabel: data => data?.itemName || data?.itemModelNo || '-',
      });
    }

    return Promise.resolve(null);
  }

  const buildVerifyPayload = validationRecord => {
    const validRecords = validationRecord?.validRecords ?? [];

    return validRecords.map(item => {
      const recordData = { ...item };
      delete recordData.rowIndex;
      delete recordData.rowNumber;
      return buildBulkItemImportPayload(recordData);
    });
  };

  const verifyBulkRecords = async validationRecord => {
    const items = buildVerifyPayload(validationRecord);

    if (!items.length) {
      return normalizeVerifyResponse({
        totalRecords: 0,
        validCount: 0,
        invalidCount: 0,
        validRecords: [],
        invalidRecords: [],
      });
    }

    const payload = {
      items,
      increment: items.length,
    };

    const response = await dispatch(itemMasterSliceMethods.verifyBulkItem(payload)).unwrap();
    return normalizeVerifyResponse(response?.data);
  };

  const handleNext = async () => {
    setButtonLoading(true);
    if (!validateSteps(current)) {
      setButtonLoading(false);
      return;
    }

    if (current === 1) {
      try {
        const validationRecord = await processRecords(current, file, mapping);
        setLocalRecord(validationRecord);
        const apiVerifyResult = await verifyBulkRecords(validationRecord);
        setVerifyRecord(apiVerifyResult);
      } catch (error) {
        console.log(error);
        Toast.error(error?.message || error || 'Bulk verification failed. Please try again.');
        setButtonLoading(false);
        return;
      }
    }

    setCurrent(prev => prev + 1);
    setButtonLoading(false);
  };

  const handlePrevious = () => {
    if (current === VERIFY_STEP) {
      setVerifyRecord(null);
    }
    setCurrent(prev => Math.max(prev - 1, 0));
  };

  const updateInvalidRecord = (recordIndex, updater) => {
    setVerifyRecord(prev => {
      if (!prev) return prev;

      const invalidRecords = [...(prev.invalidRecords ?? [])];
      const record = invalidRecords[recordIndex];
      if (!record) return prev;

      invalidRecords[recordIndex] = updater(record);
      return { ...prev, invalidRecords };
    });
  };

  const handleItemGroupFix = (recordIndex, groupName) => {
    updateInvalidRecord(recordIndex, record => applyItemGroupFix(record, groupName));
  };

  const handleSubItemGroupFix = (recordIndex, groupName) => {
    updateInvalidRecord(recordIndex, record => applySubItemGroupFix(record, groupName));
  };

  const handleItemUnitFix = (recordIndex, unitName) => {
    updateInvalidRecord(recordIndex, record => applyItemUnitFix(record, unitName));
  };

  const handleAccountFix = (recordIndex, errorName, accountName) => {
    updateInvalidRecord(recordIndex, record => applyAccountFix(record, errorName, accountName));
  };

  const effectiveVerifyRecord = useMemo(() => getEffectiveVerifyRecords(verifyRecord), [verifyRecord]);

  const handleSubmit = async () => {
    setButtonLoading(true);

    try {
      const validRecords = effectiveVerifyRecord?.validRecords ?? [];
      const items = validRecords.map(item => {
        const recordData = { ...item };
        delete recordData.errors;
        delete recordData.resolvedErrorNames;
        return recordData;
      });

      const payload = {
        items,
        increment: validRecords.length,
      };

      await dispatch(itemMasterSliceMethods.createBulkItem(payload)).unwrap();
      navigate(-1);
      setButtonLoading(false);
    } catch (error) {
      console.log(error);
      setButtonLoading(false);
    }
  };

  const renderStepContent = useMemo(() => {
    const stepMapping = {
      0: <Step1 file={file} setFile={setFile} buttonLoading={buttonLoading} setButtonLoading={setButtonLoading} uploadedFileMeta={uploadedFileMeta} setUploadedFileMeta={setUploadedFileMeta} />,
      1: <Step2 file={file} mapping={mapping} setMapping={setMapping} errors={errors} setErrors={setErrors} />,
      2: (
        <Step3
          verifyRecords={verifyRecord}
          localRecords={localRecord}
          onItemGroupFix={handleItemGroupFix}
          onSubItemGroupFix={handleSubItemGroupFix}
          onItemUnitFix={handleItemUnitFix}
          onAccountFix={handleAccountFix}
        />
      ),
      3: <Step4 verifyRecords={effectiveVerifyRecord} />,
    };

    return stepMapping[current];
  }, [current, errors, localRecord, verifyRecord, effectiveVerifyRecord, file, mapping, buttonLoading, uploadedFileMeta]);

  const stepDescriptions = [
    'Upload your import file or download a sample to get started.',
    'Map your CSV columns to the appropriate item fields.',
    'Review server-side verification results before proceeding.',
    'Review validated records before importing.',
  ];

  return (
    <div className="-m-4 bg-white h-screen">
      <div className="pt-4 pb-4 flex flex-col items-center gap-3 px-4">
        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white px-6 py-4">
          <Stepper current={current} steps={[{ title: 'Configure' }, { title: 'Map Fields' }, { title: 'Verify' }, { title: 'Preview' }]} />
        </div>

        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white px-6 py-4">
          <h1 className="text-xl font-bold" style={{ color: colorPalette.primary[900] }}>
            Items - Select File
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
                disabled={current === PREVIEW_STEP && !(effectiveVerifyRecord?.validRecordsCount > 0)}
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

export default AddBulkItems;
