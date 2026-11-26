import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/AntDComponent';
import Toast from '@/components/ui/common/Toast';
import Stepper from '@/components/ui/common/Stepper';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import Step1 from '../components/AddBulkCustomer/Step1';
import Step2 from '../components/AddBulkCustomer/Step2';
import Step3 from '../components/AddBulkCustomer/Step3';
import Step4 from '../components/AddBulkCustomer/Step4';
import { getPartnerMappingFields } from '../components/AddBulkCustomer/data';
import {
  addBulkCustomerValidateSchema,
  applyCurrencyFix,
  applyLocationFix,
  applyPaymentTermsFix,
  buildBulkCustomerImportPayload,
  customerMasterSliceMethods,
  getEffectiveVerifyRecords,
  useCustomer,
} from '@/features/sales/customer';
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

function AddBulkCustomer() {
  const [current, setCurrent] = useState(0);
  const [file, setFile] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [mapping, setMapping] = useState({});
  const [errors, setErrors] = useState({});
  const [localRecord, setLocalRecord] = useState(null);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const location = useLocation();
  const isVendorPage = location.pathname.includes('vendors');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { createBulkCustomers } = useCustomer();
  const mappingFields = useMemo(() => getPartnerMappingFields(isVendorPage), [isVendorPage]);

  useEffect(() => {
    if (file?.columns?.length) {
      setMapping(buildDefaultFieldMapping(file.columns, mappingFields));
      setErrors({});
    } else {
      setMapping({});
    }
  }, [file, mappingFields]);

  const validateSteps = step => {
    let isValid = true;

    if (step === 0) {
      if (!file) {
        isValid = false;
        Toast.error('Please select a file.');
      }
    }

    if (step === 1) {
      const newErrors = {};
      mappingFields.forEach(field => {
        if (field.required && !mapping[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
          isValid = false;
        }
      });

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
      return validateImportRecords(mappedRecords, addBulkCustomerValidateSchema, {
        getRecordLabel: data => data?.customerDisplayName || data?.companyName || '-',
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
      return buildBulkCustomerImportPayload(recordData, { isVendor: isVendorPage });
    });
  };

  const verifyBulkRecords = async validationRecord => {
    const customers = buildVerifyPayload(validationRecord);

    if (!customers.length) {
      return normalizeVerifyResponse({
        totalRecords: 0,
        validCount: 0,
        invalidCount: 0,
        validRecords: [],
        invalidRecords: [],
      });
    }

    const payload = {
      customers,
      increment: customers.length,
    };

    if (isVendorPage) {
      payload.isVendor = true;
    } else {
      payload.isCustomer = true;
    }

    const response = await dispatch(customerMasterSliceMethods.verifyBulkCustomers(payload)).unwrap();
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

  const handleCurrencyFix = (recordIndex, currencyCode) => {
    updateInvalidRecord(recordIndex, record => applyCurrencyFix(record, currencyCode));
  };

  const handlePaymentTermsFix = (recordIndex, paymentTerms) => {
    updateInvalidRecord(recordIndex, record => applyPaymentTermsFix(record, paymentTerms));
  };

  const handleLocationFix = (recordIndex, addressType, fixLevel, locationValues) => {
    updateInvalidRecord(recordIndex, record => applyLocationFix(record, addressType, fixLevel, locationValues));
  };

  const effectiveVerifyRecord = useMemo(() => getEffectiveVerifyRecords(verifyRecord), [verifyRecord]);

  const handleSubmit = async () => {
    setButtonLoading(true);

    try {
      const validRecords = effectiveVerifyRecord?.validRecords ?? [];
      const customers = validRecords.map(customer => {
        const recordData = { ...customer };
        delete recordData.errors;
        delete recordData.resolvedErrorNames;
        return recordData;
      });

      const payload = {
        customers,
        increment: validRecords.length,
      };

      if (isVendorPage) {
        payload.isVendor = true;
      } else {
        payload.isCustomer = true;
      }

      await createBulkCustomers(payload);
      navigate(isVendorPage ? '/vendors' : '/customer-master');
      setButtonLoading(false);
    } catch (error) {
      console.log(error);
      setButtonLoading(false);
    }
  };

  const renderStepContent = useMemo(() => {
    const stepMapping = {
      0: (
        <Step1
          file={file}
          setFile={setFile}
          buttonLoading={buttonLoading}
          setButtonLoading={setButtonLoading}
          uploadedFileMeta={uploadedFileMeta}
          setUploadedFileMeta={setUploadedFileMeta}
          isVendorPage={isVendorPage}
        />
      ),
      1: <Step2 file={file} mapping={mapping} setMapping={setMapping} errors={errors} setErrors={setErrors} isVendorPage={isVendorPage} />,
      2: (
        <Step3
          verifyRecords={verifyRecord}
          localRecords={localRecord}
          isVendorPage={isVendorPage}
          onCurrencyFix={handleCurrencyFix}
          onPaymentTermsFix={handlePaymentTermsFix}
          onLocationFix={handleLocationFix}
        />
      ),
      3: <Step4 verifyRecords={effectiveVerifyRecord} isVendorPage={isVendorPage} />,
    };

    return stepMapping[current];
  }, [current, errors, localRecord, verifyRecord, effectiveVerifyRecord, file, mapping, buttonLoading, uploadedFileMeta, isVendorPage]);

  const pageTitle = `${isVendorPage ? 'Vendors' : 'Customers'} - Select File`;
  const stepDescriptions = [
    'Upload your import file or download a sample to get started.',
    `Map your CSV columns to the appropriate ${isVendorPage ? 'vendor' : 'customer'} fields.`,
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
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{stepDescriptions[current]}</p>
        </div>

        <div className="w-full max-w-4xl rounded-lg border border-gray-200 bg-white p-4">
          <div>{renderStepContent}</div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <Button onClick={() => navigate(isVendorPage ? '/vendors' : '/customer-master')}>Cancel</Button>
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

export default AddBulkCustomer;
