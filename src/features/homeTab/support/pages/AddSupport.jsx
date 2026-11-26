import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';

import { Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import Toast from '@/components/ui/common/Toast';
import useScrollToError from '@/hooks/useScrollToError';
import { useSupport, supportValidationSchema } from '@/features/homeTab/support';
import { SUPPORT_TICKET_TYPES } from '@/features/homeTab/support/support.ui';
import Icons from '@/assets/icons/icon';
import { SUPPORT_CATEGORY_ENUM, SUPPORT_MODULE_NAME, SUPPORT_PRIORITY } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { errorsToTouched } from '@/utils/util';

const TYPE_KEYS = [SUPPORT_CATEGORY_ENUM.BUG, SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST, SUPPORT_CATEGORY_ENUM.NEW_MODULE];

const AddSupport = () => {
  const formikRef = useRef(null);
  const navigate = useNavigate();
  const { submitLoading, loading, createSupport } = useSupport();
  const scrollToError = useScrollToError();
  const [selectedType, setSelectedType] = useState(SUPPORT_CATEGORY_ENUM.BUG);

  const user = useSelector(state => state.auth?.signin?.user);
  const currentUserName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'User';

  const defaultSteps = [{ step: '' }, { step: '' }, { step: '' }];
  const activeCategory = selectedType;

  const initialValues = {
    bugTitle: '',
    priority: '',
    moduleName: '',
    stepsToReproduce: defaultSteps,
    expectedBehavior: '',
    actualBehavior: '',
    whyDoYouNeedIt: '',
    howDoYouManageToday: '',
    whatShouldChange: '',
    attachments: [],
  };

  const goBack = () => navigate(-1);

  const onFinish = async values => {
    let specificFields = {};

    if (activeCategory === SUPPORT_CATEGORY_ENUM.BUG) {
      const filteredSteps = values.stepsToReproduce.filter(item => item.step && item.step.trim() !== '').map(item => item.step);

      if (filteredSteps.length === 0) {
        Toast.warning('Please describe the steps to reproduce this issue.');
        return;
      }
      specificFields = {
        moduleName: values.moduleName,
        stepsToReproduce: filteredSteps,
        expectedBehavior: values.expectedBehavior,
        actualBehavior: values.actualBehavior,
      };
    } else {
      specificFields = {
        ...(activeCategory !== SUPPORT_CATEGORY_ENUM.NEW_MODULE && values.moduleName ? { moduleName: values.moduleName } : {}),
        whyDoYouNeedIt: values.whyDoYouNeedIt,
        howDoYouManageToday: values.howDoYouManageToday,
        whatShouldChange: values.whatShouldChange,
      };
    }

    const payload = {
      bugTitle: values.bugTitle,
      priority: values.priority,
      category: activeCategory,
      attachments: values.attachments,
      ...specificFields,
    };

    await createSupport(payload);
    navigate(-1);
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b z-20">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Raise Ticket</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white pt-[58.5px] -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={supportValidationSchema(activeCategory)} onSubmit={onFinish} enableReinitialize>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
              <CustomForm name="Add-Support" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                <div className="px-3 sm:px-6 flex flex-col gap-2 min-w-0">
                  <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Ticket Type</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {TYPE_KEYS.map(key => {
                        const type = SUPPORT_TICKET_TYPES[key];
                        const Icon = type.icon;
                        const active = selectedType === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedType(key);
                              if (key === SUPPORT_CATEGORY_ENUM.NEW_MODULE) {
                                setFieldValue('moduleName', '');
                              }
                            }}
                            className="w-full min-w-0 text-left rounded-lg border p-3 flex flex-col items-start transition-colors"
                            style={{
                              borderColor: active ? colorPalette.primary[500] : '#E5E7EB',
                              background: active ? colorPalette.primary[50] : '#fff',
                            }}
                          >
                            <div className="flex items-start gap-2 w-full min-w-0">
                              <span className="w-[26px] h-[26px] rounded-[7px] grid place-items-center shrink-0" style={{ background: type.soft, color: type.color }}>
                                <Icon />
                              </span>
                              <span className="text-[14px] font-semibold break-words min-w-0" style={{ color: active ? colorPalette.primary[600] : '#111827' }}>
                                {type.label}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-600 mt-2 mb-0 leading-relaxed w-full whitespace-normal break-words">{type.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeCategory === SUPPORT_CATEGORY_ENUM.BUG ? (
                    <>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Ticket Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 xl:gap-x-7 gap-y-2 items-start min-w-0">
                          <CustomInput
                            type="text"
                            name="bugTitle"
                            label="Bug Title"
                            value={values.bugTitle}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.bugTitle}
                            touched={touched.bugTitle}
                            setFieldValue={setFieldValue}
                            placeholder="Enter Bug Title"
                            required
                          />
                          <CustomInput
                            type="select"
                            name="priority"
                            label="Priority"
                            placeholder="Select Priority"
                            value={values?.priority || undefined}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.priority}
                            touched={touched.priority}
                            setFieldValue={setFieldValue}
                            selectOptions={Object.entries(SUPPORT_PRIORITY).map(([key, value]) => ({
                              value: key,
                              label: value,
                            }))}
                            required
                          />
                          <CustomInput
                            type="select"
                            name="moduleName"
                            label="Module Name"
                            placeholder="Select Module Name"
                            value={values?.moduleName || undefined}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.moduleName}
                            touched={touched.moduleName}
                            setFieldValue={setFieldValue}
                            selectOptions={Object.entries(SUPPORT_MODULE_NAME).map(([key, value]) => ({
                              value: key,
                              label: value,
                            }))}
                            required
                          />
                          <CustomInput type="text" name="raisedBy" label="Raised by" value={currentUserName} disabled readOnly />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 pb-2">
                          <h3 className="text-[15px] font-semibold text-gray-900 m-0 min-w-0 break-words">Steps to Reproduce</h3>
                          <div className="flex-grow" />
                          <CustomButton
                            type="primary"
                            size="small"
                            icon={<Icons.PlusOutlined />}
                            onClick={() => setFieldValue('stepsToReproduce', [...values.stepsToReproduce, { step: '' }])}
                            text="Add Step"
                            className="shrink-0"
                          />
                        </div>
                        <div className="grid gap-2 min-w-0">
                          {values.stepsToReproduce.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 min-w-0">
                              <span className="w-[22px] h-[22px] rounded-md bg-[#F6F7F9] border border-gray-200 grid place-items-center text-[11px] font-bold text-gray-500 shrink-0">{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <CustomInput
                                  type="text"
                                  name={`stepsToReproduce.${index}.step`}
                                  value={item.step}
                                  setFieldValue={(_, v) => {
                                    const next = [...values.stepsToReproduce];
                                    next[index] = { step: v };
                                    setFieldValue('stepsToReproduce', next);
                                  }}
                                  placeholder={`Enter step ${index + 1}`}
                                />
                              </div>
                              <Tooltip title={values.stepsToReproduce.length <= 1 ? 'At least one step is required' : 'Delete step'}>
                                <span className="shrink-0">
                                  <Icons.DeleteOutlined
                                    className={`${values.stepsToReproduce.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 cursor-pointer'}`}
                                    onClick={() => {
                                      if (values.stepsToReproduce.length <= 1) return;
                                      setFieldValue(
                                        'stepsToReproduce',
                                        values.stepsToReproduce.filter((_, i) => i !== index)
                                      );
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 xl:gap-x-7 gap-y-2 pt-2 min-w-0">
                          <CustomInput
                            type="textarea"
                            name="expectedBehavior"
                            label="Expected Behavior"
                            placeholder="Enter Expected Behavior"
                            value={values.expectedBehavior}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.expectedBehavior}
                            touched={touched.expectedBehavior}
                            setFieldValue={setFieldValue}
                          />
                          <CustomInput
                            type="textarea"
                            name="actualBehavior"
                            label="Actual Behavior"
                            placeholder="Enter Actual Behavior"
                            value={values.actualBehavior}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.actualBehavior}
                            touched={touched.actualBehavior}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Attachments</h3>
                        <CustomFileUpload
                          name="attachments"
                          label="Attach File(s)"
                          value={values.attachments}
                          setFieldValue={setFieldValue}
                          onBlur={handleBlur}
                          errorMessage={errors.attachments}
                          touched={touched.attachments}
                          fileType="all"
                          multiple
                          maxSize={5}
                          maxFiles={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Ticket Details</h3>
                        <div
                          className={`grid grid-cols-1 sm:grid-cols-2 ${activeCategory === SUPPORT_CATEGORY_ENUM.NEW_MODULE ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-x-4 xl:gap-x-7 gap-y-2 items-start min-w-0`}
                        >
                          <CustomInput
                            type="text"
                            name="bugTitle"
                            label="What do you need?"
                            value={values.bugTitle}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.bugTitle}
                            touched={touched.bugTitle}
                            setFieldValue={setFieldValue}
                            placeholder="One line is enough"
                            required
                          />
                          <CustomInput
                            type="select"
                            name="priority"
                            label="Priority"
                            placeholder="Select Priority"
                            value={values?.priority || undefined}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.priority}
                            touched={touched.priority}
                            setFieldValue={setFieldValue}
                            selectOptions={Object.entries(SUPPORT_PRIORITY).map(([key, value]) => ({
                              value: key,
                              label: value,
                            }))}
                            required
                          />
                          {activeCategory !== SUPPORT_CATEGORY_ENUM.NEW_MODULE && (
                            <CustomInput
                              type="select"
                              name="moduleName"
                              label="Module"
                              placeholder="Select module"
                              value={values?.moduleName || undefined}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              errorMessage={errors.moduleName}
                              touched={touched.moduleName}
                              setFieldValue={setFieldValue}
                              selectOptions={Object.entries(SUPPORT_MODULE_NAME).map(([key, value]) => ({
                                value: key,
                                label: value,
                              }))}
                              required
                            />
                          )}
                          <CustomInput type="text" name="raisedBy" label="Raised by" value={currentUserName} disabled readOnly />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Request Details</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 xl:gap-x-7 gap-y-2 items-start min-w-0">
                          <CustomInput
                            type="textarea"
                            name="whyDoYouNeedIt"
                            label="Why do you need it?"
                            placeholder="The problem in your work — not the screen you have in mind"
                            value={values.whyDoYouNeedIt}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.whyDoYouNeedIt}
                            touched={touched.whyDoYouNeedIt}
                            setFieldValue={setFieldValue}
                            rows={4}
                            required
                          />
                          <CustomInput
                            type="textarea"
                            name="howDoYouManageToday"
                            label="How do you manage today?"
                            placeholder="Describe how you currently handle this"
                            value={values.howDoYouManageToday}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.howDoYouManageToday}
                            touched={touched.howDoYouManageToday}
                            setFieldValue={setFieldValue}
                            rows={4}
                          />
                          <CustomInput
                            type="textarea"
                            name="whatShouldChange"
                            label="What should change?"
                            placeholder="Describe what should change"
                            value={values.whatShouldChange}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.whatShouldChange}
                            touched={touched.whatShouldChange}
                            setFieldValue={setFieldValue}
                            rows={4}
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-3 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 m-0 pb-2">Attachments</h3>
                        <CustomFileUpload
                          name="attachments"
                          label="Attach a screenshot or file"
                          value={values.attachments}
                          setFieldValue={setFieldValue}
                          onBlur={handleBlur}
                          errorMessage={errors.attachments}
                          touched={touched.attachments}
                          fileType="all"
                          multiple
                          maxSize={5}
                          maxFiles={3}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="fixed-footer flex items-center gap-3 sm:gap-5 py-[12.5px] px-4 sm:px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                  <CustomButton
                    htmlType="button"
                    type="primary"
                    loading={submitLoading || loading}
                    text="Save"
                    onClick={async () => {
                      const formErrors = await formikRef.current.validateForm();
                      if (Object.keys(formErrors).length > 0) {
                        formikRef.current.setTouched(errorsToTouched(formErrors));
                        const firstErrorField = Object.keys(formErrors)[0];
                        scrollToError(firstErrorField, formErrors);
                        return;
                      }
                      handleSubmit();
                    }}
                  />
                  <CustomButton type="default" text="Cancel" disabled={submitLoading || loading} onClick={goBack} />
                </div>
              </CustomForm>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default AddSupport;
