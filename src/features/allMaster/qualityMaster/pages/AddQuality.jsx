import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import BackButton from '@/components/ui/button/BackButton';
import TestTypeDetail from '../components/TestTypeDetail';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import { Tooltip } from '@/components/AntDComponent';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';
import { useModuleConfig } from '@/hooks/useModuleConfig';

// Extras
import { useQuality, deleteCustomerTests, setCustomeTests, qualityValidateSchema } from '@/features/allMaster/qualityMaster';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { MODULE_NAMES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { errorsToTouched } from '@/utils/util';

const AddQuality = () => {
  const noop = () => {};
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { qltId } = useParams();
  const { loading, singleQuality, submitLoading, customeTests, createQuality, updateQuality, resetQuality, getQualityById } = useQuality();
  const qualityData = singleQuality;
  const [modalOpen, setModalOpen] = useState(false);
  const { isViewOnly } = useModulePermissions(RESOURCES.QUALITY_MASTER);
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const [qualityMasterConfig, setQualityMasterConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  const formikRef = useRef();
  const scrollToError = useScrollToError();
  const filteredTests = customeTests.map(({ _id, possibleResponses, testOption, responseType, ...rest }) => {
    noop(_id);

    // If responseType is "possibleResponses", extract responses from testOption
    let updatedPossibleResponses = possibleResponses?.length
      ? possibleResponses.map(({ _id, ...responseRest }) => {
          noop(_id);
          return responseRest;
        })
      : [];

    if (responseType === 'possibleResponses' && testOption?.label?.props?.children) {
      updatedPossibleResponses = testOption.label.props.children.map(child => {
        const bgColorClass = child.props.className?.match(/bg-\[--(\w+)\]/)?.[1] || 'gray'; // Default color
        return {
          label: child.props.children,
          value: child.props.children.toLowerCase().replace(/\s+/g, '_'), // Convert label to a lowercase value
          color: bgColorClass,
        };
      });
    }

    return {
      ...rest,
      responseType: responseType || 'possibleResponses',
      possibleResponses: updatedPossibleResponses,
    };
  });

  if (isViewOnly) {
    navigate('/');
  }

  useEffect(() => {
    if (qltId && qualityData && qualityData.tests) {
      dispatch(setCustomeTests(qualityData.tests));
    }
  }, [dispatch, qualityData, qltId]);

  useEffect(() => {
    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getModuleConfig({
      ...payload,
      moduleName: MODULE_NAMES.QUALITY_MASTER,
    });

    if (qltId) {
      getQualityById({ qualityId: qltId, signal: controller.signal });
    } else {
      resetQuality();
    }

    return () => {
      resetQuality();
      controller.abort();
    };
  }, [qltId]);

  useEffect(() => {
    if (moduleConfig) {
      setQualityMasterConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (!qltId && qualityMasterConfig) {
      const newQualityMasterId = qualityMasterConfig.autoGenerate ? `${qualityMasterConfig.prefix}${qualityMasterConfig.nextNumber}` : '';
      formikRef.current?.setFieldValue('qcReportID', newQualityMasterId);
    }
  }, [qualityMasterConfig, qltId]);

  const initialValues = useMemo(
    () => ({
      qcType: qualityData ? qualityData?.qcType : null,
      qcReportName: qualityData ? qualityData?.qcReportName : '',
      qcReportResponsible: qualityData ? qualityData?.qcReportResponsible : '',
      productName: qualityData ? qualityData?.productName : '',
      qcReportID: qualityData ? qualityData?.qcReportID : '',
      tests: null,
    }),
    [qualityData]
  );

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['qcReportID'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const testOptions = [
    {
      label: (
        <div className="flex items-center gap-4 justify-center">
          <div className="border rounded bg-[--green] text-white px-4">Yes</div>
          <div className="border rounded bg-[--red] text-white px-4">No</div>
          <div className="border rounded bg-[--white] text-black px-4">N / A</div>
        </div>
      ),
      value: 'Test 1',
    },
    {
      label: (
        <div className="flex items-center gap-4 justify-center">
          <div className="border rounded bg-[--green] text-white px-4">Pass</div>
          <div className="border rounded bg-[--red] text-white px-4">Fail</div>
          <div className="border rounded bg-[--white] text-black px-4">N / A</div>
        </div>
      ),
      value: 'Test 2',
    },
    {
      label: (
        <div className="flex items-center gap-4 justify-center">
          <div className="border rounded bg-[--green] text-white px-4">Compliant</div>
          <div className="border rounded bg-[--red] text-white px-4">Non-Compliant</div>
          <div className="border rounded bg-[--white] text-black px-4">N / A</div>
        </div>
      ),
      value: 'Test 3',
    },
    {
      label: (
        <div className="flex items-center gap-4 justify-center">
          <div className="border rounded bg-[--green] text-white px-4">Good</div>
          <div className="border rounded bg-[--yellow] text-white px-4">Fair</div>
          <div className="border rounded bg-[--red] text-white px-4">Poor</div>
          <div className="border rounded bg-[--white] text-black px-4">N / A</div>
        </div>
      ),
      value: 'Test 4',
    },
    { label: 'Our Standard', value: 'Test 5' },
    { label: 'Size', value: 'Test 6' },
  ];

  const handleAddTest = () => {
    // if (currentTest) {
    //   const newTest = { ...currentTest, id: Date.now() };
    //   setSelectedTests([...selectedTests, newTest]);
    setModalOpen(true);
    // }
  };

  const handleDelete = index => {
    dispatch(deleteCustomerTests(index));
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const renderTestButtons = testData => {
    const { responseType, customInputFields, possibleResponses, selectedResponse, testOption } = testData;

    if (responseType === 'custom') {
      return (
        <div className="pt-4 mt-1">
          {Object.keys(customInputFields).map((field, index) => (
            <div key={index} className="flex items-end gap-x-3 pt-3">
              <CustomInput className="pb-1" type="checkbox" name={field} checked disabled />
              <div className="pb-1.5">{field.charAt(0).toUpperCase() + field.slice(1)}</div>
              <CustomInput type="text" name={field} placeholder={`Enter ${field.charAt(0).toUpperCase() + field.slice(1)}`} defaultValue={customInputFields[field]} readOnly />
            </div>
          ))}
        </div>
      );
    }

    if (responseType === 'single') {
      return (
        <div className="w-full">
          <CustomInput type="text" name="selectedResponse" label="Selected Response" placeholder="" value={selectedResponse} defaultValue={selectedResponse} readOnly />
        </div>
      );
    }

    if (responseType === 'possibleResponses') {
      if (possibleResponses.length > 0) {
        return (
          <div className="flex items-end w-full justify-between pb-0.5">
            {possibleResponses.map((response, index) => (
              <CustomButton
                key={index}
                name="selectedResponse"
                label="Selected Response"
                className={`px-4 py-4 bg-[--${response.color}] ${response.color === 'white' ? 'text-black border border-gray-300' : 'text-white'}`}
                type="primary"
                text={response.label}
              />
            ))}
          </div>
        );
      } else {
        const possibleResponses = testOptions.find(option => option.value === testOption?.value);

        if (possibleResponses?.label?.props?.children) {
          return (
            <div className="flex items-end w-full justify-between pb-0.5">
              {possibleResponses.label.props.children.map((child, index) => {
                const bgColorClass = child.props.className?.match(/bg-\[--(\w+)\]/)?.[1] || '';
                const isWhite = bgColorClass === 'white'; // Check if bg color is white

                return (
                  <CustomButton
                    key={index}
                    name="selectedResponse"
                    label="Selected Response"
                    className={`${child.props.className || ''} ${isWhite ? 'text-black border border-gray-300' : 'text-white'}`}
                    type="primary"
                    text={child.props.children}
                  />
                );
              })}
            </div>
          );
        } else {
          return (
            <div className="flex items-end w-full justify-between pb-0.5">
              <CustomButton name="selectedResponse" label="Selected Response" className="px-4 py-6" type="primary" text={possibleResponses ? possibleResponses.label : 'No matching option found'} />
            </div>
          );
        }
      }
    }

    return null;
  };

  const onFinish = async values => {
    if (submitLoading) return;

    const qualityData = {
      qcType: values.qcType,
      qcReportName: values.qcReportName,
      qcReportResponsible: values.qcReportResponsible,
      productName: values.productName,
      ...(!qltId && { qcReportID: values.qcReportID }),
      tests: filteredTests,
    };

    const result = qltId ? await updateQuality({ qualityId: qltId, qualityData }) : await createQuality(qualityData);
    const targetId = qltId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/quality-master/${targetId}`, {
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
    console.log('Failed:', errorInfo);
  };

  if (qltId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">{qltId ? 'Edit Quality' : 'Add Quality'} </h1>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} enableReinitialize={true} initialValues={initialValues} validationSchema={qualityValidateSchema(qualityMasterConfig?.autoGenerate)} onSubmit={onFinish}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);

              return (
                <CustomForm name="division/new" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Quality details</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                        <CustomInput
                          type="select"
                          name="qcType"
                          label="Type"
                          placeholder="Select QC"
                          selectOptions={[
                            { label: 'In Material QC', value: 'In Material QC' },
                            { label: 'On Production QC', value: 'On Production QC' },
                            { label: 'Batch QC', value: 'Batch QC' },
                            { label: 'R & D QC', value: 'R & D QC' },
                          ]}
                          value={values.qcType}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.qcType}
                          required={true}
                          touched={touched.qcType}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                        <CustomInput
                          type="text"
                          name="qcReportName"
                          label="QC Report Name"
                          placeholder="Enter QC Report Name"
                          value={values.qcReportName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.qcReportName}
                          touched={touched.qcReportName}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          type="text"
                          name="qcReportResponsible"
                          label="QC Report Responsible"
                          placeholder="Enter QC Responsible"
                          value={values.qcReportResponsible}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.qcReportResponsible}
                          touched={touched.qcReportResponsible}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5 pt-2">
                        <CustomInput
                          type="text"
                          name="qcReportID"
                          label="QC Report ID"
                          placeholder="Enter QC Report ID"
                          value={values.qcReportID}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.qcReportID}
                          touched={touched.qcReportID}
                          setFieldValue={setFieldValue}
                          disabled={qualityMasterConfig?.autoGenerate || qltId}
                          suffix={
                            !qltId && (
                              <Tooltip title="Configure QC Report ID">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            )
                          }
                          required
                        />
                        <CustomInput
                          type="text"
                          name="productName"
                          label="Product Name"
                          placeholder="Enter Product Name"
                          value={values.productName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.productName}
                          touched={touched.productName}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 items-end gap-y-5 pt-3">
                        <CustomButton
                          type="primary"
                          name="qcTypeSelect"
                          className="px-4 py-4"
                          label="Test Type"
                          text={
                            <div className="flex gap-2 items-center">
                              <div>Add Test Type</div>
                              <Icons.PlusCircleOutlined className="text-lg" />
                            </div>
                          }
                          onClick={handleAddTest}
                          placeholder="Select Test"
                        />
                      </div>
                    </div>
                    {customeTests.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Test types</h3>
                        <div className="border rounded p-5">
                          {customeTests.map((test, index) => (
                            <div key={index} className="grid grid-cols-12 gap-x-5 pb-5">
                              <div className="pb-1 text-base font-medium pt-9 md:col-span-3 lg:col-span-1">{`Test - ${index + 1} :`}</div>
                              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-2.5 gap-x-4 w-full lg:col-span-10 md:col-span-8">
                                <CustomInput
                                  type="text"
                                  name={`testName-${index}`}
                                  label="Title On QC Report"
                                  placeholder="Enter Title"
                                  value={test.testName}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  errorMessage={errors[`testName-${index}`]}
                                  touched={touched[`testName-${index}`]}
                                  setFieldValue={setFieldValue}
                                  readOnly
                                />
                                <div className="flex items-end justify-between">{renderTestButtons(test)}</div>
                                <CustomInput
                                  type="text"
                                  name={`remark-${index}`}
                                  label="Remark"
                                  placeholder="Enter Remark"
                                  value={test.remark}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  errorMessage={errors[`remark-${index}`]}
                                  touched={touched[`remark-${index}`]}
                                  setFieldValue={setFieldValue}
                                  readOnly
                                />
                              </div>
                              <div>
                                <Icons.MinusCircleOutlined className="text-primary text-xl cursor-pointer pt-8" onClick={() => handleDelete(index)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      loading={submitLoading}
                      onClick={async () => {
                        let errors = await formikRef.current.validateForm();

                        if (Object.keys(errors).length > 0) {
                          setTouched(errorsToTouched(errors));
                          const firstErrorField = Object.keys(errors)[0];
                          scrollToError(firstErrorField, errors);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
          <TestTypeDetail modalOpen={modalOpen} setModalOpen={setModalOpen} />
          <CodeConfigModal
            isVisible={isConfigModalVisible}
            onCancel={handleConfigModalVisibility}
            loading={moduleConfigLoading}
            initialConfig={qualityMasterConfig}
            title="Configure QC Report ID Preferences"
            description="Auto-generating QC report IDs can save your time. Would you like to change your current setting?"
            setConfigDetail={setQualityMasterConfig}
            moduleName={MODULE_NAMES.QUALITY_MASTER}
          />
        </div>
      </div>
    </>
  );
};

export default AddQuality;
