import { FieldArray, Formik } from 'formik';
import { useMemo } from 'react';
import { Select } from 'antd';

// Components
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { PERMISSION_MESSAGES } from '@/utils/constants';

// Extras
import { CREDIT_LIMIT_DOCUMENT_OPTIONS, PAYMENT_TERMS_DOCUMENT_OPTIONS } from '@/utils/constants';

const resolvePaymentTermsId = value => value?._id || value?.id || value || null;

const CreditLimitConfigSection = ({
  type,
  config,
  fullCreditLimitConfig,
  onSave,
  loading,
  divDrop,
  allBranchDrop,
  paymentTermsOptions = [],
  paymentTermsDropLoading = false,
  canEdit,
  isViewOnly = false,
  icon: Icon,
}) => {
  const isPurchase = type === 'purchase';
  const partyType = isPurchase ? 'VENDOR' : 'CUSTOMER';
  const creditLimitDocumentOptions = CREDIT_LIMIT_DOCUMENT_OPTIONS[partyType];
  const paymentTermsDocumentOptions = PAYMENT_TERMS_DOCUMENT_OPTIONS[partyType];

  const branchIdToBranch = useMemo(() => {
    const map = {};
    (allBranchDrop || []).forEach(b => {
      const id = b?.id || b?._id;
      if (id) map[String(id)] = b;
    });
    return map;
  }, [allBranchDrop]);

  const divisionIdToName = useMemo(() => {
    const map = {};
    (divDrop || []).forEach(d => {
      const id = d?.id || d?._id;
      if (id) map[String(id)] = d?.name || '';
    });
    return map;
  }, [divDrop]);

  const branchListFromConfig = config?.branch?.length > 0 ? config.branch : null;
  const branchListFromDrop = allBranchDrop?.length > 0 ? allBranchDrop : [];
  const initialValues = useMemo(
    () => ({
      branch: branchListFromConfig
        ? branchListFromConfig.map((b, index) => ({
            key: index,
            branchId: b?.branchId || '',
            divisionId: b?.divisionId || '',
            divisionName: divisionIdToName[String(b?.divisionId)] || branchIdToBranch[String(b?.branchId)]?.divisionId?.name || branchIdToBranch[String(b?.branchId)]?.division?.name || '',
            branchName: branchIdToBranch[String(b?.branchId)]?.name || branchIdToBranch[String(b?.branchId)]?.branchName || '',
            branchCode: b?.branchCode || '',
            creditLimit: b?.creditLimit ?? '',
            isActive: isPurchase ? b?.isActive !== false : true,
            restrictedModule: b?.restrictedModule || [],
            restrictedPaymentTermsModule: b?.restrictedPaymentTermsModule || [],
            paymentTermsId: resolvePaymentTermsId(b?.paymentTermsId),
          }))
        : branchListFromDrop.map((b, index) => ({
            key: index,
            branchId: b?.id || b?._id || '',
            divisionId: b?.divisionId?._id || b?.divisionId?.id || b?.divisionId || '',
            divisionName: b?.divisionId?.name || b?.division?.name || divisionIdToName[String(b?.divisionId?._id || b?.divisionId?.id || b?.divisionId)] || '',
            branchName: b?.name || b?.branchName || '',
            branchCode: b?.branchCode || '',
            creditLimit: '',
            isActive: isPurchase ? true : true,
            restrictedModule: [],
            restrictedPaymentTermsModule: [],
            paymentTermsId: null,
          })),
      useBranchCreditLimit: typeof config?.useBranchCreditLimit === 'boolean' ? config.useBranchCreditLimit : true,
      creditLimit: config?.creditLimit ?? '',
      restrictedModule: config?.restrictedModule || [],
      useBranchPaymentTerms: typeof config?.useBranchPaymentTerms === 'boolean' ? config.useBranchPaymentTerms : true,
      paymentTermsId: resolvePaymentTermsId(config?.paymentTermsId),
      restrictedPaymentTermsModule: config?.restrictedPaymentTermsModule || [],
    }),
    [
      config?.branch,
      allBranchDrop,
      config?.useBranchCreditLimit,
      config?.creditLimit,
      config?.restrictedModule,
      config?.useBranchPaymentTerms,
      config?.paymentTermsId,
      config?.restrictedPaymentTermsModule,
      isPurchase,
      divisionIdToName,
      branchIdToBranch,
    ]
  );

  const onFinish = async values => {
    const branch = values.branch.map(({ branchId, divisionId, branchCode, creditLimit, isActive, restrictedModule, restrictedPaymentTermsModule, paymentTermsId }) => {
      const item = {
        divisionId,
        branchId,
        branchCode,
        creditLimit: parseFloat(creditLimit) || 0,
        restrictedModule: restrictedModule || [],
        restrictedPaymentTermsModule: restrictedPaymentTermsModule || [],
      };
      if (values.useBranchPaymentTerms) {
        item.paymentTermsId = paymentTermsId || undefined;
      }
      if (isPurchase) item.isActive = isActive;
      return item;
    });

    const sectionPayload = {
      branch,
      creditLimit: values.useBranchCreditLimit ? undefined : parseFloat(values.creditLimit) || 0,
      restrictedModule: values.useBranchCreditLimit ? undefined : values.restrictedModule,
      useBranchCreditLimit: values.useBranchCreditLimit,
      useBranchPaymentTerms: values.useBranchPaymentTerms,
      paymentTermsId: values.useBranchPaymentTerms ? undefined : values.paymentTermsId,
      restrictedPaymentTermsModule: values.useBranchPaymentTerms ? undefined : values.restrictedPaymentTermsModule,
    };

    const creditLimitConfig = {
      ...(fullCreditLimitConfig || {}),
      ...(isPurchase ? { purchaseCreditLimit: sectionPayload } : { salesCreditLimit: sectionPayload }),
    };

    await onSave({ creditLimitConfig });
  };

  const handleTableTotal = (values, key) => {
    let total = 0;
    values?.branch?.forEach(item => {
      total += item?.[key] && !isNaN(item?.[key]) ? parseFloat(item?.[key]) : 0;
    });
    return total;
  };

  return (
    <Formik initialValues={initialValues} onSubmit={onFinish} enableReinitialize>
      {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue }) => (
        <CustomForm name={`credit-limit-config-${type}`} onFinish={handleSubmit}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
            <CustomInput
              type="checkbox"
              name="useBranchCreditLimit"
              label=""
              CheckboxName="Branch Wise Credit Limit"
              value={values.useBranchCreditLimit}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.useBranchCreditLimit}
              touched={touched.useBranchCreditLimit}
              setFieldValue={setFieldValue}
              disabled={!canEdit || isViewOnly}
            />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
            {!values?.useBranchCreditLimit && (
              <CustomInput
                type="text"
                name="creditLimit"
                label="Credit Limit"
                placeholder="Enter Credit Limit"
                value={values.creditLimit}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.creditLimit}
                touched={touched.creditLimit}
                setFieldValue={setFieldValue}
                disabled={!canEdit || isViewOnly}
              />
            )}
            {!values?.useBranchCreditLimit && (
              <CustomInput
                type="select"
                mode="multiple"
                name="restrictedModule"
                label="Restriction Document"
                placeholder="Select Restriction Document"
                value={values.restrictedModule}
                onChange={handleChange}
                onBlur={handleBlur}
                selectOptions={creditLimitDocumentOptions}
                errorMessage={errors.restrictedModule}
                touched={touched.restrictedModule}
                setFieldValue={setFieldValue}
                disabled={!canEdit || isViewOnly}
              />
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
            <CustomInput
              type="checkbox"
              name="useBranchPaymentTerms"
              label=""
              CheckboxName="Branch Wise Payment Terms"
              value={values.useBranchPaymentTerms}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.useBranchPaymentTerms}
              touched={touched.useBranchPaymentTerms}
              setFieldValue={setFieldValue}
              disabled={!canEdit || isViewOnly}
            />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
            {!values?.useBranchPaymentTerms && (
              <CustomInput
                type="select"
                name="paymentTermsId"
                label="Payment Terms"
                value={values?.paymentTermsId ?? null}
                placeholder="Select Payment Terms"
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.paymentTermsId}
                touched={touched.paymentTermsId}
                setFieldValue={setFieldValue}
                selectOptions={paymentTermsOptions}
                loading={paymentTermsDropLoading}
                allowClear
                disabled={!canEdit || isViewOnly}
              />
            )}
            {!values?.useBranchPaymentTerms && (
              <CustomInput
                type="select"
                mode="multiple"
                name="restrictedPaymentTermsModule"
                label="Restriction Payment Terms Document"
                placeholder="Select Restriction Payment Terms Document"
                value={values.restrictedPaymentTermsModule}
                onChange={handleChange}
                onBlur={handleBlur}
                selectOptions={paymentTermsDocumentOptions}
                errorMessage={errors.restrictedPaymentTermsModule}
                touched={touched.restrictedPaymentTermsModule}
                setFieldValue={setFieldValue}
                disabled={!canEdit || isViewOnly}
              />
            )}
          </div>
          {(values?.useBranchCreditLimit || values?.useBranchPaymentTerms) && (
            <div className="overflow-x-auto mt-4">
              <table className="border-collapse w-full table-fixed">
                <thead>
                  <tr>
                    <th className="border px-2 py-3 bg-[#fafafa] text-center w-[80px]">Active</th>
                    <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Division</th>
                    <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Branch</th>
                    <th className="border px-2 py-3 bg-[#fafafa] text-start w-[100px]">Code</th>
                    {values?.useBranchCreditLimit && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Credit Limit</th>}
                    {values?.useBranchCreditLimit && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[270px]">Restriction Document</th>}
                    {values?.useBranchPaymentTerms && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[270px]">Payment Terms</th>}
                    {values?.useBranchPaymentTerms && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[270px]">Restriction Payment Terms Document</th>}
                  </tr>
                </thead>
                <tbody>
                  <FieldArray name="branch">
                    {() => (
                      <>
                        {values?.branch?.map((item, index) => (
                          <tr key={index}>
                            <td className="w-[80px] border relative h-[40px] text-center">
                              <div className="flex justify-center items-center h-full">
                                <CustomInput
                                  type="checkbox"
                                  name={`branch[${index}].isActive`}
                                  label=""
                                  CheckboxName=""
                                  value={item.isActive}
                                  onChange={e => setFieldValue(`branch[${index}].isActive`, e?.target?.checked)}
                                  onBlur={handleBlur}
                                  setFieldValue={setFieldValue}
                                  disabled={!canEdit || isViewOnly}
                                />
                              </div>
                            </td>
                            <td className="w-[150px] border text-center relative h-[40px]">
                              <input type="text" className="focus:outline-none p-1 w-[150px]" readOnly value={divisionIdToName[String(item.divisionId)] || item.divisionName || '-'} />
                            </td>
                            <td className="w-[150px] border text-center relative h-[40px]">
                              <input type="text" className="focus:outline-none p-1 w-[150px]" readOnly value={item.branchName || '-'} />
                            </td>
                            <td className="w-[80px] border relative h-[40px]">
                              <input type="text" className="focus:outline-none p-1 w-[80px]" readOnly value={item.branchCode || '-'} />
                            </td>
                            {values?.useBranchCreditLimit && (
                              <td className="w-[140px] border relative h-[40px]">
                                <input
                                  type="text"
                                  className="item-table-input p-1 w-[140px]"
                                  placeholder="0"
                                  value={item.creditLimit}
                                  onChange={e => setFieldValue(`branch[${index}].creditLimit`, e?.target?.value)}
                                  onBlur={handleBlur}
                                  disabled={!canEdit || isViewOnly}
                                />
                              </td>
                            )}
                            {values?.useBranchCreditLimit && (
                              <td className="w-[200px] border relative h-[40px] text-start">
                                <div className="flex justify-center items-center h-full">
                                  <Select
                                    style={{ width: '250px' }}
                                    mode="multiple"
                                    showSearch
                                    placeholder="Search to Select"
                                    optionFilterProp="label"
                                    className="focus:outline-none cursor-pointer border-none w-[200px]"
                                    value={item?.restrictedModule}
                                    onChange={value => setFieldValue(`branch[${index}].restrictedModule`, value)}
                                    onBlur={handleBlur}
                                    options={creditLimitDocumentOptions}
                                    maxTagCount={1}
                                    disabled={!canEdit || isViewOnly}
                                  />
                                </div>
                              </td>
                            )}
                            {values?.useBranchPaymentTerms && (
                              <td className="w-[200px] border relative h-[40px] text-start">
                                <div className="flex justify-center items-center h-full">
                                  <Select
                                    style={{ width: '250px' }}
                                    showSearch
                                    placeholder="Search to Select"
                                    optionFilterProp="label"
                                    className="focus:outline-none cursor-pointer border-none w-[200px]"
                                    value={item?.paymentTermsId}
                                    onChange={value => setFieldValue(`branch[${index}].paymentTermsId`, value)}
                                    onBlur={handleBlur}
                                    options={paymentTermsOptions}
                                    loading={paymentTermsDropLoading}
                                    allowClear
                                    disabled={!canEdit || isViewOnly}
                                  />
                                </div>
                              </td>
                            )}
                            {values?.useBranchPaymentTerms && (
                              <td className="w-[270px] border relative h-[40px] text-start">
                                <div className="flex justify-center items-center h-full">
                                  <Select
                                    style={{ width: '250px' }}
                                    mode="multiple"
                                    showSearch
                                    placeholder="Search to Select"
                                    optionFilterProp="label"
                                    className="focus:outline-none cursor-pointer border-none w-[250px]"
                                    value={item?.restrictedPaymentTermsModule}
                                    onChange={value => setFieldValue(`branch[${index}].restrictedPaymentTermsModule`, value)}
                                    onBlur={handleBlur}
                                    options={paymentTermsDocumentOptions}
                                    maxTagCount={1}
                                    disabled={!canEdit || isViewOnly}
                                  />
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                        {values?.branch?.length > 0 && (
                          <tr>
                            <td colSpan={4} className="border font-bold relative h-[40px]">
                              <input type="text" className="focus:outline-none p-1" value="Total" readOnly />
                            </td>
                            {values?.useBranchCreditLimit && (
                              <td className="w-[140px] border text-center font-bold relative h-[40px]">
                                <input type="text" className="focus:outline-none p-1 w-[140px]" value={handleTableTotal(values, 'creditLimit')} readOnly />
                              </td>
                            )}
                            {values?.useBranchCreditLimit && <td className="w-[200px] border font-bold relative h-[40px]" />}
                            {values?.useBranchPaymentTerms && <td className="w-[200px] border font-bold relative h-[40px]" />}
                            {values?.useBranchPaymentTerms && <td className="w-[250px] border font-bold relative h-[40px]" />}
                          </tr>
                        )}
                      </>
                    )}
                  </FieldArray>
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <PermissionButton
              canAccess={canEdit}
              isViewOnly={isViewOnly}
              tooltipTitle={isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !canEdit ? PERMISSION_MESSAGES.NO_PERMISSION : undefined}
              className="px-6 py-2"
              type="primary"
              text="Save Configuration"
              icon={Icon && <Icon className="h-4 w-4" />}
              onClick={canEdit && !isViewOnly ? handleSubmit : undefined}
              loading={loading}
            />
          </div>
        </CustomForm>
      )}
    </Formik>
  );
};

export default CreditLimitConfigSection;
