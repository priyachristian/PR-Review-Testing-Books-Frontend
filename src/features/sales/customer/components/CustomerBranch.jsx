import { useCallback, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Checkbox, Select, Tooltip } from 'antd';
import { FieldArray, Formik } from 'formik';

// Components
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import ShowErrorsOnParentSubmit from '@/components/forms/ShowErrorsOnParentSubmit';

// Extras
import { addBranches, customerBranchValidateSchema, useCustomer } from '@/features/sales/customer';
import { usePaymentTermsDropdown } from '@/features/setting/paymentTerm';
import { toDecimalString } from '@/utils/currency';
import { CREDIT_LIMIT_DOCUMENT_OPTIONS, PAYMENT_TERMS_DOCUMENT_OPTIONS } from '@/utils/constants';

const CustomerBranch = forwardRef(function CustomerBranch({ parentSubmitCount = 0 }, ref) {
  const isVendorPage = window.location.href.includes('vendors');
  const partyType = isVendorPage ? 'VENDOR' : 'CUSTOMER';
  const creditLimitDocumentOptions = CREDIT_LIMIT_DOCUMENT_OPTIONS[partyType];
  const paymentTermsDocumentOptions = PAYMENT_TERMS_DOCUMENT_OPTIONS[partyType];
  const dispatch = useDispatch();
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const { customerId } = useParams();
  const { branches } = useCustomer();
  const { paymentTermsOptions, paymentTermsDropLoading } = usePaymentTermsDropdown();
  const prevFormValuesRef = useRef(null);
  const formikRef = useRef();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFormValues: () => {
      return formikRef.current?.values || {};
    },
    validateForm: () => {
      return formikRef.current?.validateForm() || Promise.resolve({});
    },
  }));

  const initialValues = useMemo(
    () => ({
      branch:
        branches?.branch?.map((b, index) => {
          return {
            key: index,
            branchId: b?.branchId?.id || b?.branchId?._id || b?.branchId || b?.id || '',
            branchName: b?.branchId?.name || b?.name || b?.branchName || '',
            divisionId: b?.divisionId?._id || b?.divisionId?.id || b?.divisionId || '',
            divisionName: b?.divisionName || b?.divisionId?.name || '',
            branchCode: b?.branchCode || b?.code || '',
            openingBalance: b?.openingBalance || '',
            initialOpeningBalance: b?.openingBalance || 0,
            isSplitBalance: b?.isSplitBalance || false,
            currentBalance: b?.currentBalance || 0,
            creditLimit: b?.creditLimit || '',
            isActive: customerId ? b?.isActive || false : true,
            restrictedModule: b?.restrictedModule,
            paymentTermsId: b?.paymentTermsId?._id || b?.paymentTermsId?.id || b?.paymentTermsId || null,
            restrictedPaymentTermsModule: b?.restrictedPaymentTermsModule,
          };
        }) || [],
      useBranchCreditLimit: typeof branches?.useBranchCreditLimit === 'boolean' ? branches.useBranchCreditLimit : false,
      creditLimit: branches?.creditLimit || '',
      restrictedModule: branches?.restrictedModule || [],
      useBranchPaymentTerms: typeof branches?.useBranchPaymentTerms === 'boolean' ? branches.useBranchPaymentTerms : false,
      paymentTermsId: branches?.paymentTermsId?._id || branches?.paymentTermsId?.id || branches?.paymentTermsId || null,
      restrictedPaymentTermsModule: branches?.restrictedPaymentTermsModule || [],
    }),
    [branches, customerId]
  );

  const dispatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        const branch = values?.branch?.map(
          ({
            branchId,
            branchName,
            divisionId,
            divisionName,
            branchCode,
            openingBalance,
            isSplitBalance,
            currentBalance,
            creditLimit,
            isActive,
            restrictedModule,
            paymentTermsId,
            restrictedPaymentTermsModule,
          }) => ({
            branchId,
            branchName,
            divisionId,
            divisionName,
            branchCode,
            openingBalance,
            isSplitBalance,
            currentBalance,
            creditLimit,
            isActive,
            restrictedModule,
            paymentTermsId,
            restrictedPaymentTermsModule,
          })
        );

        let payload = {
          branch,
          useBranchCreditLimit: values?.useBranchCreditLimit,
          ...(!values?.useBranchCreditLimit && { creditLimit: values?.creditLimit }),
          ...(!values?.useBranchCreditLimit && { restrictedModule: values?.restrictedModule }),
          useBranchPaymentTerms: values?.useBranchPaymentTerms,
          ...(!values?.useBranchPaymentTerms && { paymentTermsId: values?.paymentTermsId }),
          ...(!values?.useBranchPaymentTerms && {
            restrictedPaymentTermsModule: values?.restrictedPaymentTermsModule,
          }),
        };
        dispatch(addBranches(payload));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch]
  );
  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, []);

  const handleTableTotal = (values, key) => {
    let total = 0;

    values?.branch?.forEach(item => {
      total = total + (item?.[key] && !isNaN(item?.[key]) ? parseFloat(item?.[key]) : 0);
    });

    return total;
  };

  return (
    <div className="relative pb-28">
      <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={customerBranchValidateSchema} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleChange, setFieldValue, validateForm, setTouched }) => {
          dispatchOnFormChanges(values);
          return (
            <CustomForm name="customerbranch">
              <ShowErrorsOnParentSubmit parentSubmitCount={parentSubmitCount} validateForm={validateForm} setTouched={setTouched} />
              <div>
                <div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                    <Tooltip title="Enable to maintain a separate credit limit for each branch. Disable to use a single credit limit across all branches.">
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
                      />
                    </Tooltip>
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
                      />
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                    <Tooltip title="Enable to assign different payment terms for each branch. Disable to use the same payment terms across all branches.">
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
                      />
                    </Tooltip>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                    {!values?.useBranchPaymentTerms && (
                      <CustomInput
                        type="select"
                        name="paymentTermsId"
                        label="Payment Terms"
                        value={values?.paymentTermsId || null}
                        placeholder="Select Payment Terms"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.paymentTermsId}
                        touched={touched.paymentTermsId}
                        setFieldValue={(field, value) => {
                          setFieldValue(field, value);
                          if (field === 'paymentTermsId' && !value) {
                            setFieldValue('restrictedPaymentTermsModule', []);
                          }
                        }}
                        selectOptions={paymentTermsOptions}
                        loading={paymentTermsDropLoading}
                        allowClear
                      />
                    )}
                    {!values?.useBranchPaymentTerms && (
                      <Tooltip title={!values?.paymentTermsId ? 'Select Payment Terms first to enable Restriction Payment Terms Document' : ''}>
                        <span className="block">
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
                            disabled={!values?.paymentTermsId}
                          />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  <div id="branch" className="overflow-x-auto mt-4">
                    <table className="border-collapse w-full table-fixed">
                      <thead>
                        <tr>
                          <th className="border px-2 py-3 bg-[#fafafa] text-center w-[90px]">
                            <div className="flex justify-between items-center gap-3">
                              <div>Active</div>
                              <Checkbox
                                checked={values?.branch?.length > 0 && values.branch.every(b => b?.isActive)}
                                onChange={e => {
                                  const next = e.target.checked;
                                  (values?.branch || []).forEach((_, idx) => {
                                    setFieldValue(`branch[${idx}].isActive`, next);
                                  });
                                }}
                              />
                            </div>
                          </th>
                          <th className="border px-2 py-3 bg-[#fafafa] text-start w-[170px]">Division</th>
                          <th className="border px-2 py-3 bg-[#fafafa] text-start w-[170px]">Branch</th>
                          <th className="border px-2 py-3 bg-[#fafafa] text-start w-[100px]">Code</th>
                          {customerId && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Current Balance</th>}
                          <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Opening Balance</th>
                          {isSplitSessionActive && <th className="border px-2 py-3 bg-[#fafafa] text-center w-[120px]">Split Balance</th>}
                          {values?.useBranchCreditLimit && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[160px]">Credit Limit</th>}
                          {values?.useBranchCreditLimit && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[220px]">Restriction Document</th>}
                          {values?.useBranchPaymentTerms && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[220px]">Payment Terms</th>}
                          {values?.useBranchPaymentTerms && <th className="border px-2 py-3 bg-[#fafafa] text-start w-[300px]">Restriction Payment Terms Document</th>}
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
                                        onChange={e => {
                                          setFieldValue(`branch[${index}].isActive`, e?.target?.checked);
                                        }}
                                        onBlur={handleBlur}
                                        errorMessage={errors.useBranchCreditLimit}
                                        touched={touched.useBranchCreditLimit}
                                        setFieldValue={setFieldValue}
                                      />
                                    </div>
                                  </td>
                                  <td className="w-[170px] border text-center relative h-[40px]">
                                    <input type="text" className="focus:outline-none p-1 w-[150px]" name={`branch[${index}].divisionName`} value={item.divisionName} readOnly />
                                  </td>
                                  <td className="w-[170px] border text-center relative h-[40px]">
                                    <input type="text" className="focus:outline-none p-1 w-[150px]" name={`branch[${index}].branchName`} value={item.branchName} readOnly />
                                  </td>
                                  <td className="w-[100px] border relative h-[40px]">
                                    <input type="text" className="focus:outline-none p-1 w-[80px]" name={`branch[${index}].branchCode`} value={item.branchCode} readOnly />
                                  </td>
                                  {customerId && (
                                    <td className="w-[140px] border text-center relative h-[40px]">
                                      <input type="text" className="focus:outline-none p-1 w-[140px]" name={`branch[${index}].currentBalance`} value={item.currentBalance} readOnly />
                                    </td>
                                  )}
                                  <td className="w-[160px] border relative h-[40px]">
                                    <input
                                      type="text"
                                      className="item-table-input p-1 w-[140px]"
                                      name={`branch[${index}].openingBalance`}
                                      placeholder="0"
                                      value={item.openingBalance}
                                      onChange={e => {
                                        const newValue = e.target.value;
                                        let prevOpening = values.branch[index].initialOpeningBalance || 0;
                                        let parsedNewValue = parseFloat(newValue || 0);
                                        if (isNaN(prevOpening)) {
                                          prevOpening = 0;
                                        }
                                        if (isNaN(parsedNewValue)) {
                                          parsedNewValue = 0;
                                        }
                                        const diff = parsedNewValue - prevOpening;

                                        setFieldValue(`branch[${index}].openingBalance`, newValue || '');

                                        setFieldValue(`branch[${index}].initialOpeningBalance`, newValue || '');

                                        let updatedCurrent = parseFloat(values.branch[index].currentBalance || 0) + diff;

                                        if (!isNaN(updatedCurrent)) {
                                          setFieldValue(`branch[${index}].currentBalance`, updatedCurrent > 0 ? toDecimalString(updatedCurrent) : updatedCurrent);
                                        }
                                      }}
                                      onBlur={handleBlur}
                                    />
                                    {errors.branch?.[index]?.openingBalance && touched.branch?.[index]?.openingBalance && (
                                      <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.branch[index].openingBalance}</div>
                                    )}
                                  </td>
                                  {isSplitSessionActive && (
                                    <td className="w-[120px] border relative h-[40px] text-center">
                                      <div className="flex justify-center items-center h-full">
                                        <CustomInput
                                          type="checkbox"
                                          name={`branch[${index}].isSplitBalance`}
                                          label=""
                                          CheckboxName=""
                                          value={item.isSplitBalance}
                                          onChange={e => {
                                            setFieldValue(`branch[${index}].isSplitBalance`, e?.target?.checked);
                                          }}
                                          onBlur={handleBlur}
                                          setFieldValue={setFieldValue}
                                        />
                                      </div>
                                    </td>
                                  )}
                                  {values?.useBranchCreditLimit && (
                                    <td className="w-[160px] border relative h-[40px]">
                                      <input
                                        type="text"
                                        className="item-table-input p-1 w-[140px]"
                                        name={`branch[${index}].creditLimit`}
                                        placeholder="0"
                                        value={item.creditLimit}
                                        onChange={e => {
                                          setFieldValue(`branch[${index}].creditLimit`, e?.target?.value);
                                        }}
                                        onBlur={handleBlur}
                                      />
                                    </td>
                                  )}
                                  {values?.useBranchCreditLimit && (
                                    <td className="w-[220px] border relative h-[40px] text-start">
                                      <div className="flex justify-center items-center h-full">
                                        <Select
                                          style={{ width: '200px' }}
                                          mode="multiple"
                                          showSearch
                                          placeholder="Search to Select"
                                          optionFilterProp="label"
                                          id=""
                                          className="focus:outline-none cursor-pointer border-none w-[200px]"
                                          name={`branch[${index}].restrictedModule`}
                                          value={item?.restrictedModule}
                                          onChange={value => {
                                            setFieldValue(`branch[${index}].restrictedModule`, value);
                                          }}
                                          onBlur={handleBlur}
                                          options={creditLimitDocumentOptions}
                                          maxTagCount={1}
                                        />
                                      </div>
                                    </td>
                                  )}

                                  {values?.useBranchPaymentTerms && (
                                    <td className="w-[210px] border relative h-[40px] text-start">
                                      <div className="flex justify-center items-center h-full">
                                        <Select
                                          style={{ width: '200px' }}
                                          showSearch
                                          placeholder="Search to Select"
                                          optionFilterProp="label"
                                          id=""
                                          className="focus:outline-none cursor-pointer border-none w-[200px]"
                                          name={`branch[${index}].paymentTermsId`}
                                          value={item?.paymentTermsId}
                                          onChange={value => {
                                            setFieldValue(`branch[${index}].paymentTermsId`, value);
                                            if (!value) {
                                              setFieldValue(`branch[${index}].restrictedPaymentTermsModule`, []);
                                            }
                                          }}
                                          onBlur={handleBlur}
                                          options={paymentTermsOptions}
                                          loading={paymentTermsDropLoading}
                                          allowClear
                                        />
                                      </div>
                                    </td>
                                  )}
                                  {values?.useBranchPaymentTerms && (
                                    <td className="w-[290px] border relative h-[40px] text-start">
                                      <div className="flex justify-center items-center h-full">
                                        <Tooltip title={!item?.paymentTermsId ? 'Select Payment Terms first to enable Restriction Payment Terms Document' : ''}>
                                          <span>
                                            <Select
                                              style={{ width: '250px' }}
                                              mode="multiple"
                                              showSearch
                                              placeholder="Search to Select"
                                              optionFilterProp="label"
                                              id=""
                                              className="focus:outline-none cursor-pointer border-none w-[250px]"
                                              name={`branch[${index}].restrictedPaymentTermsModule`}
                                              value={item?.restrictedPaymentTermsModule}
                                              onChange={value => {
                                                setFieldValue(`branch[${index}].restrictedPaymentTermsModule`, value);
                                              }}
                                              onBlur={handleBlur}
                                              options={paymentTermsDocumentOptions}
                                              maxTagCount={1}
                                              disabled={!item?.paymentTermsId}
                                            />
                                          </span>
                                        </Tooltip>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                              {values?.branch?.length > 0 && (
                                <tr>
                                  <td colSpan={4} className="border font-bold relative h-[40px]">
                                    <input type="text" className="focus:outline-none p-1" value={'Total'} readOnly />
                                  </td>
                                  {customerId && (
                                    <td className="w-[140px] border text-center font-bold relative h-[40px]">
                                      <input type="text" className="focus:outline-none p-1 w-[140px]" value={handleTableTotal(values, 'currentBalance')} readOnly />
                                    </td>
                                  )}
                                  <td className="w-[140px] border font-bold relative h-[40px]">
                                    <input type="text" className="focus:outline-none p-1 w-[140px]" value={handleTableTotal(values, 'openingBalance')} readOnly />
                                  </td>
                                  {values?.useBranchCreditLimit && (
                                    <td className="w-[140px] border text-center font-bold relative h-[40px]">
                                      <input type="text" className="focus:outline-none p-1 w-[140px]" value={handleTableTotal(values, 'creditLimit')} readOnly />
                                    </td>
                                  )}
                                  {values?.useBranchCreditLimit && <td className="w-[200px] border font-bold relative h-[40px]"></td>}
                                  {values?.useBranchPaymentTerms && <td className="w-[200px] border font-bold relative h-[40px]"></td>}
                                  {values?.useBranchPaymentTerms && <td className="w-[250px] border font-bold relative h-[40px]"></td>}
                                </tr>
                              )}
                            </>
                          )}
                        </FieldArray>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </div>
  );
});
export default CustomerBranch;
