import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import { Button, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import useScrollToError from '@/hooks/useScrollToError';
import { getBranchSelectPlaceholder, getWarehouseSelectPlaceholder, useDivisionBranchWarehouseWithResource } from 'hooks/useDivisionBranchWarehouse';

// Extras
import { useManualJournal, manualJournalValidateSchema } from '@/features/accountant/manualJournal';
import Icons from '@/assets/icons/icon';
import { toApiDate, errorsToTouched } from '@/utils/util';
import { RESOURCES } from '@/utils/jsonFile';
import { ACCOUNT_CATEGORIES, CURRENCIES, MODULE_NAMES } from '@/utils/constants';
import { manualJournalInitialValues } from '@/utils/intialValueSetup';
import { colorPalette } from '@/utils/theme';
import { toDecimalString } from '@/utils/currency';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, vendorSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const noBorderStyle = {
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  background: 'transparent',
  padding: 0,
};

const AddManualJournal = () => {
  const { currencySymbol } = useCompanyCurrency();
  const formikRef = useRef(null);
  const { manualJournalId } = useParams();
  const location = useLocation();
  const {
    journal,
    contactDropdown,
    loading: manualJournalLoading,
    getManualJournalById,
    createManualJournal,
    updateManualJournal,
    submitLoading,
    resetManualJournal,
    getContactDropdown,
  } = useManualJournal();
  const manualJournalData = journal;
  const { accountDrop, getAccounts, droploading: accountDropLoading } = useChartOfAccounts();
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const {
    divDrop,
    divisionLoading,
    branchDrop,
    branchLoading,
    warehouseDrop,
    warehouseLoading,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    selectedBranchId,
    setFromEntity: setDivisionBranchWarehouseFromEntity,
    warehouseRequiresCascade,
    setWarehouseRequiresCascade,
    applyBranchSelection,
    applyWarehouseSelection,
  } = useDivisionBranchWarehouseWithResource(manualJournalData, RESOURCES.MANUAL_JOURNALS, {
    skipItemDropdown: true,
    skipAutoItemDrop: true,
    enableBranchFirst: !manualJournalId,
    enableWarehouseFirst: !manualJournalId,
    moduleConfig,
  });
  const scrollToError = useScrollToError();

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const [manualJournalConfig, setManualJournalConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  const initialValues = useMemo(() => {
    const rawValues = manualJournalInitialValues(manualJournalData);

    return {
      ...rawValues,
      date: rawValues.date ? dayjs(rawValues.date) : dayjs(),
    };
  }, [manualJournalData]);

  const fieldsToIgnore = ['manualJournalId'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  useEffect(() => {
    if (manualJournalId) {
      getManualJournalById({ manualJournalId });
    }

    return () => {
      resetManualJournal();
    };
  }, [manualJournalId]);

  useEffect(() => {
    if (moduleConfig) {
      setManualJournalConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  useEffect(() => {
    if (formikRef.current && !manualJournalId && manualJournalConfig && moduleConfig) {
      const currentValues = formikRef.current.values;
      const hasSelectedValues = currentValues?.divisionId && currentValues?.branchId && currentValues?.warehouseId;
      const newManualJournalId = manualJournalConfig.autoGenerate ? `${manualJournalConfig.prefix}${manualJournalConfig.nextNumber}` : '';
      formikRef.current.setFieldValue('manualJournalId', newManualJournalId);

      const defaultConfig = moduleConfig?.defaultConfiguration;
      if (!hasSelectedValues && defaultConfig) {
        formikRef.current.setFieldValue('divisionId', defaultConfig.divisionId);
        formikRef.current.setFieldValue('branchId', defaultConfig.branchId);
        formikRef.current.setFieldValue('warehouseId', defaultConfig.warehouseId);
        setDivisionBranchWarehouseFromEntity({
          divisionId: defaultConfig.divisionId,
          branchId: defaultConfig.branchId,
          warehouseId: defaultConfig.warehouseId,
        });
      }

      if (defaultConfig?.branchId) {
        setWarehouseRequiresCascade(true);
      }
    }
  }, [manualJournalConfig, manualJournalId, moduleConfig, setDivisionBranchWarehouseFromEntity, setWarehouseRequiresCascade]);

  useEffect(() => {
    const controller = new AbortController();
    getAccounts({ signal: controller.signal, type: 'MANUAL_JOURNAL' });
    return () => controller.abort();
  }, [getAccounts]);

  useEffect(() => {
    const controller = new AbortController();
    getModuleConfig({ signal: controller.signal, moduleName: MODULE_NAMES.MANUAL_JOURNAL });
    return () => controller.abort();
  }, [getModuleConfig]);

  useEffect(() => {
    if (manualJournalId && manualJournalData) {
      setDivisionBranchWarehouseFromEntity(manualJournalData);
    }
  }, [manualJournalId, manualJournalData, setDivisionBranchWarehouseFromEntity]);

  useEffect(() => {
    if (!selectedBranchId) return;
    getContactDropdown({ branchId: selectedBranchId });
  }, [selectedBranchId, getContactDropdown]);

  const accountCategoryById = useMemo(
    () => Object.fromEntries((accountDrop.MANUAL_JOURNAL || []).flatMap(group => group.options.map(option => [option.value, group.category]))),
    [accountDrop.MANUAL_JOURNAL]
  );
  const getAccountCategory = accountId => accountCategoryById[accountId];

  const contactsForAccount = accountId => {
    const category = getAccountCategory(accountId);
    if (category === ACCOUNT_CATEGORIES.ACCOUNTS_RECEIVABLE) return (contactDropdown || []).filter(contact => contact?.Role?.isCustomer);
    if (category === ACCOUNT_CATEGORIES.ACCOUNTS_PAYABLE) return (contactDropdown || []).filter(contact => contact?.Role?.isVendor);
    return contactDropdown || [];
  };

  const columns = (values, errors, touched, setFieldValue, handleChange, handleBlur) => [
    {
      title: 'Account',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (_, row, index) => (
        <CustomInput
          type="account"
          name={`journalEntries.${index}.accountId`}
          value={values.journalEntries[index]?.accountId}
          onChange={value => {
            setFieldValue(`journalEntries.${index}.accountId`, value || null);
            setFieldValue(`journalEntries.${index}.businessAccountLedgerMasterId`, null);
          }}
          onBlur={handleBlur}
          selectOptions={accountDrop.MANUAL_JOURNAL}
          bordered={false}
          setFieldValue={setFieldValue}
          placeholder="Select Account"
          className="!w-full"
          style={noBorderStyle}
          allowClear
          loading={accountDropLoading}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (_, row, index) => (
        <CustomInput
          type="textarea"
          name={`journalEntries.${index}.description`}
          value={values.journalEntries[index]?.description}
          onChange={handleChange}
          onBlur={handleBlur}
          bordered={false}
          rows={2}
          errorMessage={errors.journalEntries?.[index]?.description}
          touched={touched.journalEntries?.[index]?.description}
          setFieldValue={setFieldValue}
          placeholder="Description"
          style={noBorderStyle}
        />
      ),
    },
    {
      title: 'Contact (INR)',
      dataIndex: 'businessAccountLedgerMasterId',
      key: 'businessAccountLedgerMasterId',
      width: 250,
      render: (_, row, index) => (
        <CustomInput
          dropdownStyle={{ width: '50%', borderRadius: 0 }}
          dropdownMatchSelectWidth={false}
          type="select"
          name={`journalEntries.${index}.businessAccountLedgerMasterId`}
          value={values.journalEntries[index]?.businessAccountLedgerMasterId || values.journalEntries[index]?.businessAccountLedgerMasterId?._id}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={!values.journalEntries[index]?.accountId}
          setFieldValue={setFieldValue}
          selectVariant="twoColumn"
          columnSelectHeader={getAccountCategory(values.journalEntries[index]?.accountId) === ACCOUNT_CATEGORIES.ACCOUNTS_PAYABLE ? vendorSelectColumnHeader : customerSelectColumnHeader}
          selectOptions={buildCustomerSelectOptions(contactsForAccount(values.journalEntries[index]?.accountId))}
          bordered={false}
          placeholder={
            getAccountCategory(values.journalEntries[index]?.accountId) === ACCOUNT_CATEGORIES.ACCOUNTS_RECEIVABLE
              ? 'Select Customer'
              : getAccountCategory(values.journalEntries[index]?.accountId) === ACCOUNT_CATEGORIES.ACCOUNTS_PAYABLE
                ? 'Select Vendor'
                : 'Select Contact'
          }
          style={{ width: 220 }}
          allowClear
          loading={manualJournalLoading}
        />
      ),
    },
    {
      title: 'Debits',
      dataIndex: 'debits',
      key: 'debits',
      width: 150,
      render: (_, row, index) => (
        <CustomInput
          type="text"
          name={`journalEntries.${index}.debits`}
          value={values.journalEntries[index]?.debits}
          onChange={e => {
            handleChange(e);
            if (e.target.value) {
              setFieldValue(`journalEntries.${index}.credits`, '');
            }
          }}
          onBlur={handleBlur}
          setFieldValue={setFieldValue}
          bordered={false}
          style={noBorderStyle}
        />
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      width: 150,
      render: (_, row, index) => (
        <CustomInput
          type="text"
          name={`journalEntries.${index}.credits`}
          value={values.journalEntries[index]?.credits}
          onChange={e => {
            handleChange(e);
            if (e.target.value) {
              setFieldValue(`journalEntries.${index}.debits`, '');
            }
          }}
          onBlur={handleBlur}
          setFieldValue={setFieldValue}
          bordered={false}
          style={noBorderStyle}
        />
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      width: 50,
      render: (_, row, index) => (
        <Button
          type="default"
          icon={<Icons.DeleteOutlined />}
          disabled={values.journalEntries.length <= 2}
          onClick={() => {
            setFieldValue(
              'journalEntries',
              values.journalEntries.filter((_, i) => i !== index)
            );
          }}
          size="small"
        />
      ),
    },
  ];

  const onFinish = async values => {
    if (submitLoading) return;

    const journalData = {
      ...values,
      date: toApiDate(values.date),
      attachments: Array.isArray(values.attachments) ? values.attachments.filter(item => item !== null && item !== undefined) : values.attachments ? [values.attachments] : [],
      journalEntries: values.journalEntries.map(({ debits, credits, ...entry }) => {
        const normalizedEntry = { ...entry };
        const debitAmount = debits !== '' && debits !== null && debits !== undefined ? Number(debits) : null;
        const creditAmount = credits !== '' && credits !== null && credits !== undefined ? Number(credits) : null;

        if (debitAmount > 0) {
          normalizedEntry.debits = debitAmount;
        } else if (creditAmount > 0) {
          normalizedEntry.credits = creditAmount;
        }

        return normalizedEntry;
      }),
    };

    const result = manualJournalId ? await updateManualJournal({ manualJournalId, journalData }) : await createManualJournal(journalData);
    const targetId = manualJournalId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/manual-journal/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log(errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  const calculateTotals = accounts => {
    const totalDebits = accounts.reduce((sum, account) => {
      const debitValue = parseFloat(account.debits) || 0;
      return sum + debitValue;
    }, 0);

    const totalCredits = accounts.reduce((sum, account) => {
      const creditValue = parseFloat(account.credits) || 0;
      return sum + creditValue;
    }, 0);

    const difference = totalDebits - totalCredits;

    return {
      totalDebits: toDecimalString(totalDebits),
      totalCredits: toDecimalString(totalCredits),
      difference: toDecimalString(difference),
    };
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{manualJournalId ? `Edit Manual Journal / ${manualJournalData?.manualJournalId}` : 'Add Manual Journal'}</h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={manualJournalValidateSchema(manualJournalConfig?.autoGenerate)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setFieldTouched }) => {
              updateFormValues(values);
              const totals = calculateTotals(values.journalEntries);
              const isBalanced = parseFloat(totals.difference) === 0;

              return (
                <CustomForm name="Manual-Journal" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                        <CustomInput
                          type="select"
                          name="divisionId"
                          label="Division"
                          placeholder="Select Division"
                          value={values.divisionId}
                          onBlur={handleBlur}
                          errorMessage={errors.divisionId}
                          touched={touched.divisionId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={divisionSelectColumnHeader}
                          selectOptions={buildDivisionSelectOptions(divDrop)}
                          loading={divisionLoading}
                          onChange={e => {
                            setFieldTouched('divisionId', false, false);
                            setFieldTouched('branchId', false, false);
                            setFieldTouched('warehouseId', false, false);
                            setWarehouseRequiresCascade(true);
                            setSelectedDivisionId(e || '');
                            setSelectedBranchId('');
                            setFieldValue('branchId', null, false);
                            setFieldValue('warehouseId', null, false);
                            setSelectedWarehouseId('');
                          }}
                        />
                        <CustomInput
                          type="select"
                          name="branchId"
                          label="Branch"
                          placeholder={getBranchSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.branchId}
                          onBlur={handleBlur}
                          errorMessage={errors.branchId}
                          touched={touched.branchId}
                          setFieldValue={setFieldValue}
                          required={true}
                          selectVariant="twoColumn"
                          columnSelectHeader={branchSelectColumnHeader}
                          selectOptions={buildBranchSelectOptions(branchDrop)}
                          loading={branchLoading}
                          onChange={e =>
                            applyBranchSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              values,
                            })
                          }
                          disabled={warehouseRequiresCascade && !values?.divisionId}
                        />
                        <CustomInput
                          type="select"
                          name="warehouseId"
                          label="Warehouse"
                          placeholder={getWarehouseSelectPlaceholder(warehouseRequiresCascade, values)}
                          value={values.warehouseId}
                          onChange={e =>
                            applyWarehouseSelection(e, {
                              setFieldValue,
                              setFieldTouched,
                              currentBranchId: values.branchId,
                              values,
                            })
                          }
                          onBlur={handleBlur}
                          errorMessage={errors.warehouseId}
                          touched={touched.warehouseId}
                          setFieldValue={setFieldValue}
                          selectVariant="twoColumn"
                          columnSelectHeader={warehouseSelectColumnHeader}
                          selectOptions={buildWarehouseSelectOptions(warehouseDrop)}
                          loading={warehouseLoading}
                          disabled={warehouseRequiresCascade && !values?.branchId}
                        />
                      </div>
                    </div>
                    <div className={`${!values?.divisionId || !values?.branchId || !values?.warehouseId ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Document details</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                          <CustomInput
                            type="text"
                            name="manualJournalId"
                            label="Manual Journal#"
                            placeholder="Enter Journal"
                            value={values.manualJournalId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.manualJournalId}
                            touched={touched.manualJournalId}
                            setFieldValue={setFieldValue}
                            disabled={manualJournalConfig?.autoGenerate || manualJournalId}
                            suffix={
                              !manualJournalId && (
                                <Tooltip title="Configure Journal Number">
                                  <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                                </Tooltip>
                              )
                            }
                            required
                          />
                          <CustomInput
                            type="date"
                            name="date"
                            label="Date"
                            value={values.date ? values.date : null}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            onBlur={handleBlur}
                            errorMessage={errors.date}
                            touched={touched.date}
                            placeholder="Select Date"
                            format="YYYY-MM-DD"
                            required={true}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-3">
                          <CustomInput
                            type="text"
                            name="reference"
                            label="Reference#"
                            placeholder="Enter Reference"
                            value={values.reference}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.reference}
                            touched={touched.reference}
                            setFieldValue={setFieldValue}
                          />
                          <CustomInput
                            type="textarea"
                            name="notes"
                            label="Notes"
                            placeholder="Enter Notes"
                            value={values.notes}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.notes}
                            touched={touched.notes}
                            setFieldValue={setFieldValue}
                            required
                          />
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-3">
                          <CustomInput
                            type="select"
                            name="currency"
                            label="Currency"
                            placeholder="Select Currency"
                            value={values.currency}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.currency}
                            touched={touched.currency}
                            setFieldValue={setFieldValue}
                            selectOptions={Object.values(CURRENCIES).map(currency => ({
                              label: currency,
                              value: currency,
                            }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 mt-2">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Journal entries</h3>
                        <div className="pt-2">
                          <CustomTable
                            rowKey={(_, index) => index}
                            data={values.journalEntries}
                            columns={columns(values, errors, touched, setFieldValue, handleChange, handleBlur)}
                            pagination={false}
                          />
                          <div className="pt-5 grid grid-cols-5 gap-x-5">
                            <div className="col-span-2">
                              <Button
                                icon={<Icons.PlusCircleOutlined />}
                                type="primary"
                                onClick={() => {
                                  const newRow = {
                                    accountId: null,
                                    description: '',
                                    businessAccountLedgerMasterId: null,
                                    debits: '',
                                    credits: '',
                                  };
                                  const newAccounts = [...values.journalEntries, newRow];
                                  setFieldValue('journalEntries', newAccounts);
                                }}
                              >
                                Add Row
                              </Button>
                            </div>

                            <div className="col-span-3 bg-gray-50 shadow rounded-md p-5 grid grid-cols-6">
                              <div className="col-span-4 ">
                                <div className="pt-3 font-medium text-lg">Total ({currencySymbol})</div>
                                <div className={`pt-3 ${isBalanced ? '' : 'text-red-500'}`}>Difference</div>
                              </div>
                              <div className="">
                                <div className="text-end pt-3 font-medium text-lg">{totals.totalDebits}</div>
                                <div className="text-end pt-3"></div>
                              </div>
                              <div className="">
                                <div className="text-end pt-3 font-medium text-lg">{totals.totalCredits}</div>
                                <div className={`text-end pt-3 ${isBalanced ? '' : 'text-red-500 font-medium'}`}>{totals.difference}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-x-7 pt-4">
                          <CustomFileUpload
                            name="attachments"
                            label="Attach Files(s) to Manual Journal"
                            value={values.attachments}
                            setFieldValue={setFieldValue}
                            onBlur={handleBlur}
                            errorMessage={errors.attachments}
                            touched={touched.attachments}
                            fileType="all"
                            multiple={true}
                            maxSize={5}
                            maxFiles={3}
                            compact={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {values?.divisionId && values?.branchId && values?.warehouseId && (
                    <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                      <CustomButton
                        className="px-8 py-4 min-w-[50px]"
                        type="primary"
                        text="Save"
                        loading={submitLoading}
                        onClick={async () => {
                          let errors = await formikRef.current.validateForm();

                          if (Object.keys(errors).length > 0) {
                            formikRef.current.setTouched(errorsToTouched(errors));
                            const firstErrorField = Object.keys(errors)[0];
                            scrollToError(firstErrorField, errors);
                            return;
                          }
                          handleSubmit();
                        }}
                      />

                      <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                    </div>
                  )}
                </CustomForm>
              );
            }}
          </Formik>
        </div>
      </div>
      <CodeConfigModal
        isVisible={isConfigModalVisible}
        onCancel={handleConfigModalVisibility}
        loading={moduleConfigLoading}
        initialConfig={manualJournalConfig}
        title="Configure Manual Journal Number Preferences"
        description="Auto-generating manual journal numbers can save your time. Would you like to change your current setting?"
        setConfigDetail={setManualJournalConfig}
        moduleName={MODULE_NAMES.MANUAL_JOURNAL}
      />
    </>
  );
};

export default AddManualJournal;
