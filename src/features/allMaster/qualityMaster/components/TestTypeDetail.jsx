import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Extras
import { addCustomerTests, testTypeDetailValidateSchema } from '@/features/allMaster/qualityMaster';

const TestTypeDetail = ({ modalOpen, setModalOpen }) => {
  const dispatch = useDispatch();
  const [currentTest, setCurrentTest] = useState('');

  const getResponseType = testValue => {
    switch (testValue) {
      case 'Test 1':
      case 'Test 2':
      case 'Test 3':
      case 'Test 4':
        return 'possibleResponses';
      case 'Test 5':
        return 'single';
      case 'Test 6':
        return 'custom';
      default:
        return null;
    }
  };

  const responseType = getResponseType(currentTest?.value);

  const initialValues = {
    testName: currentTest?.testName || '',
    remark: currentTest?.remark || '',
    testType: currentTest?.testType || null,
    responseType: responseType || '',
    ...(responseType === 'custom' && {
      customInputFields: {
        weight: currentTest?.customInputFields?.weight || '',
        length: currentTest?.customInputFields?.length || '',
        width: currentTest?.customInputFields?.width || '',
        height: currentTest?.customInputFields?.height || '',
        volume: currentTest?.customInputFields?.volume || '',
      },
    }),
    possibleResponses: [],
  };

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

  const renderResponseButtons = (responses, handleClick) => {
    return (
      <div className="flex items-center gap-4">
        {responses.map(response => (
          <CustomButton
            key={response.value}
            className={`bg-[--${response.color}] px-5 py-1.5 ${response.color === 'white' ? 'text-black border border-gray-300' : 'text-white'}`}
            text={response.label}
            onClick={() => handleClick(response)}
          />
        ))}
      </div>
    );
  };

  const renderTestButtons = (testValue, { handleChange, values, setFieldValue }) => {
    let buttons = null;
    const handleNumericFieldChange = (fieldName, value) => {
      const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      setFieldValue(fieldName, sanitizedValue);
    };

    const handleClick = response => {
      if (!values.possibleResponses.some(r => r.value === response.value)) {
        setFieldValue('possibleResponses', [...values.possibleResponses, response]);
      }
    };

    switch (testValue) {
      case 'Test 1':
        buttons = renderResponseButtons(
          [
            { label: 'Yes', value: 'yes', color: 'green' },
            { label: 'No', value: 'no', color: 'red' },
            { label: 'N/A', value: 'n/a', color: 'white' },
          ],
          handleClick
        );
        break;
      case 'Test 2':
        buttons = renderResponseButtons(
          [
            { label: 'Pass', value: 'pass', color: 'green' },
            { label: 'Fail', value: 'fail', color: 'red' },
            { label: 'N/A', value: 'n/a', color: 'white' },
          ],
          handleClick
        );
        break;
      case 'Test 3':
        buttons = renderResponseButtons(
          [
            { label: 'Compliant', value: 'compliant', color: 'green' },
            { label: 'Non-Compliant', value: 'non-compliant', color: 'red' },
            { label: 'N/A', value: 'n/a', color: 'white' },
          ],
          handleClick
        );
        break;
      case 'Test 4':
        buttons = renderResponseButtons(
          [
            { label: 'Good', value: 'good', color: 'green' },
            { label: 'Fair', value: 'fair', color: 'yellow' },
            { label: 'Poor', value: 'poor', color: 'red' },
            { label: 'N/A', value: 'n/a', color: 'white' },
          ],
          handleClick
        );
        break;
      case 'Test 5':
        buttons = (
          <div className="w-full">
            <CustomInput type="text" name="selectedResponse" label="Our Standard" placeholder="Enter Standard" value={values.selectedResponse} onChange={handleChange} setFieldValue={setFieldValue} />
          </div>
        );
        break;
      case 'Test 6':
        buttons = (
          <div>
            {['length', 'width', 'height', 'volume', 'weight'].map(field => (
              <div className="flex items-end gap-x-3 pt-3" key={field}>
                <CustomInput className="pb-1" type="checkbox" name={`${field}Checked`} onChange={handleChange} setFieldValue={setFieldValue} checked={values[`${field}Checked`]} />
                <div className="pb-1.5 capitalize">{field}</div>
                <CustomInput
                  type="number"
                  name={`customInputFields.${field}`}
                  placeholder={`Enter ${field}`}
                  value={values.customInputFields?.[field]}
                  onChange={e => handleNumericFieldChange(`customInputFields.${field}`, e.target.value)}
                  setFieldValue={setFieldValue}
                  disabled={!values[`${field}Checked`]}
                />
              </div>
            ))}
          </div>
        );
        break;
      default:
        buttons = null;
    }

    return [buttons];
  };

  const onFinish = (values, { resetForm }) => {
    if (!currentTest) return;

    const responseType = getResponseType(currentTest.value);

    let customInputFields = {};
    if (responseType === 'custom') {
      customInputFields = {
        ...(values.lengthChecked && { length: values.customInputFields.length }),
        ...(values.widthChecked && { width: values.customInputFields.width }),
        ...(values.heightChecked && { height: values.customInputFields.height }),
        ...(values.volumeChecked && { volume: values.customInputFields.volume }),
        ...(values.weightChecked && { weight: values.customInputFields.weight }),
      };
    }

    const selectedTestOption = testOptions.find(test => test.value === currentTest.value);

    const possibleResponses = responseType === 'possibleResponses' ? values.possibleResponses || [] : [];

    const customTest = {
      testName: values.testName,
      remark: values.remark,
      responseType: responseType,
      possibleResponses,
      testOption: selectedTestOption,
      ...(responseType === 'custom' && Object.keys(customInputFields).length > 0 && { customInputFields }),
      ...(responseType === 'single' && { selectedResponse: values.selectedResponse }),
    };

    dispatch(addCustomerTests(customTest));

    resetForm();
    setModalOpen(false);
    setCurrentTest(null);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <CustomModal
        modalOpen={modalOpen}
        setModalOpen={open => {
          if (!open) setCurrentTest(null);
          setModalOpen(open);
        }}
        destroyOnClose={true}
        title="Add Test Details"
      >
        <div>
          <Formik initialValues={initialValues} validationSchema={testTypeDetailValidateSchema} onSubmit={onFinish}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => (
              <CustomForm name="AddTestType" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <CustomInput
                    type="text"
                    name="testName"
                    label="Title On QC Report"
                    placeholder="Enter Title"
                    value={values.testName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.testName}
                    touched={touched.testName}
                    setFieldValue={setFieldValue}
                    required={true}
                  />
                  <CustomInput
                    type="text"
                    name="remark"
                    label="Remark"
                    placeholder="Enter Remark"
                    value={values.remark}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    errorMessage={errors.remark}
                    touched={touched.remark}
                    setFieldValue={setFieldValue}
                    required={true}
                  />
                  <div className="">
                    <CustomInput
                      type="select"
                      name="testType"
                      label="Test Type"
                      placeholder="Select Test"
                      value={values.testType}
                      errorMessage={errors.testType}
                      touched={touched.testType}
                      setFieldValue={value => {
                        setFieldValue('testType', value);
                        setCurrentTest(testOptions.find(test => test.value === value));
                      }}
                      onChange={value => {
                        setFieldValue('testType', value);
                        setCurrentTest(testOptions.find(test => test.value === value));
                      }}
                      selectOptions={testOptions}
                      required={true}
                      showSearch={false}
                    />

                    {/* <PlusCircleOutlined
                  onClick={handleAddTest}
                  className="text-primary text-xl cursor-pointer w-max py-1"
                /> */}
                  </div>
                  {currentTest && !['Test 1', 'Test 2', 'Test 3', 'Test 4'].includes(currentTest.value) && renderTestButtons(currentTest.value, { handleChange, values, setFieldValue })}
                </div>
                <div className="flex gap-4 justify-end items-center pt-10">
                  <CustomButton
                    className="px-7 py-4"
                    text="Cancel"
                    type="default"
                    onClick={() => {
                      resetForm();
                      setCurrentTest(null);
                      setModalOpen(false);
                    }}
                  />
                  <CustomButton className="px-7 py-4" text="Add" type="primary" onClick={handleSubmit} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </CustomModal>
    </div>
  );
};

export default TestTypeDetail;
