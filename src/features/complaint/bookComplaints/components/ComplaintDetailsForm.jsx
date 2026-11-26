import { useEffect, useMemo } from 'react';
import { Formik } from 'formik';

import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomButton from '@/components/ui/button/CustomButton';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useItemMaster } from '@/features/allMaster/item/useItem';
import { useInvoiceDropdown } from '@/features/sales/invoice/useInvoiceDropdown';
import { useBillDropdown } from '@/features/purchase/bills/useBillDropdown';
import { buildCustomerSelectOptions } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { mapUsersToSelectOptions } from '@/features/complaint/problemList/problemList.utils';
import { COMPLAINT_CHANNEL_OPTIONS, COMPLAINT_DEPARTMENT_OPTIONS, COMPLAINT_EVIDENCE_TYPE, COMPLAINT_FORM_TYPE } from '../complaint.constants';
import { buildCreateComplaintSchema } from '../complaint.schema';
import { getCreateComplaintInitialValues } from '../complaint.utils';
import ComplaintEvidenceFields from './ComplaintEvidenceFields';

const ComplaintDetailsForm = ({ routing, formType, onSave, onCancel, submitLoading = false, initialValues: initialValuesProp = null, evidenceSelectOptions = {}, updateFormValues }) => {
  const { signin } = useAuth();
  const currentUserId = signin?.user?._id || signin?.user?.id || null;

  const { usersDropdown, getUsersDropdown } = useUser();
  const { customerDropDownList, getCustomerDropList } = useCustomer();
  const { itemDrop, getItemDrop } = useItemMaster();
  const { fetchInvoicePage, invoiceDropLoading } = useInvoiceDropdown();
  const { fetchBillPage, billDropLoading } = useBillDropdown();

  const requiredAttachments = routing?.requiredAttachments || [];
  const photoRequired = requiredAttachments.includes(COMPLAINT_EVIDENCE_TYPE.PHOTO);
  const evidenceKeys = requiredAttachments.filter(key => key !== COMPLAINT_EVIDENCE_TYPE.PHOTO);
  const needsUsers = true;
  const needsCustomers = formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE;
  const needsItems = requiredAttachments.includes(COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY);

  useEffect(() => {
    const controller = new AbortController();
    if (needsUsers) getUsersDropdown({ signal: controller.signal });
    if (needsCustomers) getCustomerDropList({ signal: controller.signal });
    if (needsItems) getItemDrop({ signal: controller.signal });
    return () => controller.abort();
  }, [needsUsers, needsCustomers, needsItems, getUsersDropdown, getCustomerDropList, getItemDrop]);

  const userOptions = useMemo(() => mapUsersToSelectOptions(usersDropdown), [usersDropdown]);
  const customerOptions = useMemo(() => buildCustomerSelectOptions(customerDropDownList), [customerDropDownList]);
  const itemOptions = useMemo(
    () =>
      (itemDrop || []).map(item => ({
        value: item._id || item.id,
        label: item.itemName || item.itemNo || item.name || '',
      })),
    [itemDrop]
  );

  const initialValues = useMemo(() => {
    if (initialValuesProp) return initialValuesProp;
    return getCreateComplaintInitialValues({
      formType,
      requiredAttachments,
      currentUserId,
    });
  }, [initialValuesProp, formType, requiredAttachments, currentUserId]);

  const validationSchema = useMemo(() => buildCreateComplaintSchema(formType, requiredAttachments), [formType, requiredAttachments]);

  const isDept = formType === COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT;
  const isPerson = formType === COMPLAINT_FORM_TYPE.PERSON_TO_PERSON;
  const isCustomer = formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE;

  const raisedByLabel = isCustomer ? 'Who is logging it' : isPerson ? 'Complaint by' : 'Who is raising it';

  return (
    <Formik enableReinitialize initialValues={initialValues} validationSchema={validationSchema} onSubmit={values => onSave?.(values)}>
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
        updateFormValues?.(values);
        return (
          <CustomForm onFinish={handleSubmit} layout="vertical">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-5">
                {isCustomer && (
                  <CustomInput
                    name="customerId"
                    type="select"
                    label="Which customer"
                    required
                    value={values.customerId}
                    selectOptions={customerOptions}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Pick a customer"
                    touched={touched.customerId}
                    errorMessage={errors.customerId}
                  />
                )}

                {isCustomer && (
                  <CustomInput
                    name="contactChannel"
                    type="select"
                    label="How did they tell us"
                    required
                    value={values.contactChannel}
                    selectOptions={COMPLAINT_CHANNEL_OPTIONS}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touched={touched.contactChannel}
                    errorMessage={errors.contactChannel}
                  />
                )}

                {isDept && (
                  <CustomInput
                    name="fromDepartment"
                    type="select"
                    label="Complaint from which department"
                    required
                    value={values.fromDepartment}
                    selectOptions={COMPLAINT_DEPARTMENT_OPTIONS}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Pick one"
                    touched={touched.fromDepartment}
                    errorMessage={errors.fromDepartment}
                  />
                )}

                {isDept && (
                  <CustomInput
                    name="againstDepartment"
                    type="select"
                    label="Against which department"
                    required
                    value={values.againstDepartment}
                    selectOptions={COMPLAINT_DEPARTMENT_OPTIONS}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Pick one"
                    touched={touched.againstDepartment}
                    errorMessage={errors.againstDepartment}
                  />
                )}

                {isPerson && (
                  <CustomInput
                    name="raisedBy"
                    type="select"
                    label="Complaint by"
                    required
                    value={values.raisedBy}
                    selectOptions={userOptions}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touched={touched.raisedBy}
                    errorMessage={errors.raisedBy}
                  />
                )}

                {isPerson && (
                  <CustomInput
                    name="againstPersonId"
                    type="select"
                    label="Against"
                    required
                    value={values.againstPersonId}
                    selectOptions={userOptions}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Pick a person"
                    touched={touched.againstPersonId}
                    errorMessage={errors.againstPersonId}
                  />
                )}

                {!isPerson && (
                  <CustomInput
                    name="raisedBy"
                    type="select"
                    label={raisedByLabel}
                    required
                    value={values.raisedBy}
                    selectOptions={userOptions}
                    setFieldValue={setFieldValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    touched={touched.raisedBy}
                    errorMessage={errors.raisedBy}
                  />
                )}
              </div>

              <CustomInput
                name="title"
                type="text"
                label="What is the problem"
                required
                value={values.title}
                setFieldValue={setFieldValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="In one line — what went wrong?"
                touched={touched.title}
                errorMessage={errors.title}
              />

              <CustomInput
                name="notes"
                type="textarea"
                label="Anything else they said (optional)"
                value={values.notes}
                setFieldValue={setFieldValue}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                touched={touched.notes}
                errorMessage={errors.notes}
              />

              <div className="grid md:grid-cols-2 gap-x-7 gap-y-5">
                <CustomFileUpload
                  name="attachments"
                  label="Attachments (optional)"
                  value={values.attachments}
                  setFieldValue={setFieldValue}
                  onBlur={handleBlur}
                  errorMessage={errors.attachments}
                  touched={touched.attachments}
                  fileType="all"
                  multiple
                  maxSize={5}
                  maxFiles={3}
                  compact
                />
                {photoRequired ? (
                  <CustomFileUpload
                    name="photos"
                    label="Photos"
                    required
                    value={values.photos}
                    setFieldValue={setFieldValue}
                    onBlur={handleBlur}
                    errorMessage={errors.photos}
                    touched={touched.photos}
                    fileType="image"
                    multiple
                    maxSize={5}
                    maxFiles={3}
                    compact
                  />
                ) : null}
              </div>

              <ComplaintEvidenceFields
                attachmentKeys={evidenceKeys}
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                handleBlur={handleBlur}
                setFieldValue={setFieldValue}
                userOptions={userOptions}
                itemOptions={itemOptions}
                fetchInvoicePage={fetchInvoicePage}
                invoiceDropLoading={invoiceDropLoading}
                fetchBillPage={fetchBillPage}
                billDropLoading={billDropLoading}
                customerId={values.customerId}
                evidenceSelectOptions={evidenceSelectOptions}
              />
            </div>

            <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-5 flex-wrap">
                <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" htmlType="button" onClick={handleSubmit} loading={submitLoading} />
                <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={onCancel} disabled={submitLoading} />
              </div>
            </div>
          </CustomForm>
        );
      }}
    </Formik>
  );
};

export default ComplaintDetailsForm;
