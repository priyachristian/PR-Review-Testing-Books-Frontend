import CustomInput from '@/components/forms/formInput/CustomInput';
import PaginatedSelect from '@/components/forms/formInput/PaginatedSelect';
import { ATTACHMENT_FIELD_LABELS, ATTACHMENT_FIELD_PLACEHOLDERS, EVIDENCE_FIELD_CONFIG } from '../complaint.constants';

/**
 * Renders requiredAttachments evidence inputs (invoice, bill, item+qty, etc.).
 */
const ComplaintEvidenceFields = ({
  attachmentKeys = [],
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  userOptions = [],
  itemOptions = [],
  fetchInvoicePage,
  invoiceDropLoading,
  fetchBillPage,
  billDropLoading,
  customerId,
  evidenceSelectOptions = {},
}) => {
  if (!attachmentKeys.length) return null;

  const fetchInvoicePageForCustomer = ({ page, limit, search, signal }) => fetchInvoicePage({ page, limit, search, signal, ...(customerId ? { customerId } : {}) });

  return (
    <div>
      <h4 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Needed for this kind of problem</h4>
      <div className="grid md:grid-cols-2 gap-x-7 gap-y-5">
        {attachmentKeys.map(key => {
          const config = EVIDENCE_FIELD_CONFIG[key] || { kind: 'text' };
          const label = ATTACHMENT_FIELD_LABELS[key] || key;
          const fieldName = `evidence.${key}`;
          const fieldValue = values.evidence?.[key];
          const fieldTouched = touched.evidence?.[key];
          const fieldError = errors.evidence?.[key];

          if (config.kind === 'invoice') {
            return (
              <PaginatedSelect
                key={key}
                name={fieldName}
                label={label}
                required
                placeholder="Select invoice"
                value={fieldValue}
                allowClear
                loading={invoiceDropLoading}
                setFieldValue={setFieldValue}
                fetchPage={fetchInvoicePageForCustomer}
                resetDeps={[customerId]}
                initialOptions={evidenceSelectOptions[key] || []}
                onBlur={handleBlur}
                touched={fieldTouched}
                errorMessage={fieldError}
              />
            );
          }

          if (config.kind === 'bill') {
            return (
              <PaginatedSelect
                key={key}
                name={fieldName}
                label={label}
                required
                placeholder="Select bill"
                value={fieldValue}
                allowClear
                loading={billDropLoading}
                setFieldValue={setFieldValue}
                fetchPage={fetchBillPage}
                initialOptions={evidenceSelectOptions[key] || []}
                onBlur={handleBlur}
                touched={fieldTouched}
                errorMessage={fieldError}
              />
            );
          }

          if (config.kind === 'user') {
            return (
              <CustomInput
                key={key}
                name={fieldName}
                type="select"
                label={label}
                required
                value={fieldValue}
                selectOptions={userOptions}
                setFieldValue={setFieldValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Select sales person"
                touched={fieldTouched}
                errorMessage={fieldError}
              />
            );
          }

          if (config.kind === 'item_quantity') {
            return (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 md:col-span-2">
                <CustomInput
                  name={`evidence.${key}.itemId`}
                  type="select"
                  label="Item"
                  required
                  value={fieldValue?.itemId}
                  selectOptions={itemOptions}
                  setFieldValue={setFieldValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Select item"
                  touched={fieldTouched?.itemId}
                  errorMessage={fieldError?.itemId}
                />
                <CustomInput
                  name={`evidence.${key}.quantity`}
                  type="number"
                  label="Quantity"
                  required
                  value={fieldValue?.quantity}
                  setFieldValue={setFieldValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Qty"
                  touched={fieldTouched?.quantity}
                  errorMessage={fieldError?.quantity}
                />
              </div>
            );
          }

          if (config.kind === 'date') {
            return (
              <CustomInput
                key={key}
                name={fieldName}
                type="date"
                label={label}
                required
                value={fieldValue}
                setFieldValue={setFieldValue}
                onBlur={handleBlur}
                placeholder={ATTACHMENT_FIELD_PLACEHOLDERS.DATE}
                format="DD/MM/YYYY"
                touched={fieldTouched}
                errorMessage={fieldError}
              />
            );
          }

          if (config.kind === 'file') {
            return (
              <div key={key}>
                <CustomInput
                  name={fieldName}
                  type="file"
                  label={label}
                  required
                  value={fieldValue?.isExisting ? null : fieldValue}
                  setFieldValue={setFieldValue}
                  onBlur={handleBlur}
                  touched={fieldTouched}
                  errorMessage={fieldError}
                />
                {fieldValue?.isExisting ? <p className="text-xs text-gray-500 m-0 mt-1">Current photo: {fieldValue.fileName || 'Uploaded'} — upload a new file to replace it.</p> : null}
              </div>
            );
          }

          if (config.kind === 'number') {
            return (
              <CustomInput
                key={key}
                name={fieldName}
                type="number"
                label={label}
                required
                value={fieldValue}
                setFieldValue={setFieldValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={ATTACHMENT_FIELD_PLACEHOLDERS[key]}
                touched={fieldTouched}
                errorMessage={fieldError}
              />
            );
          }

          return (
            <CustomInput
              key={key}
              name={fieldName}
              type="text"
              label={label}
              required
              value={fieldValue ?? ''}
              setFieldValue={setFieldValue}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={ATTACHMENT_FIELD_PLACEHOLDERS[key]}
              touched={fieldTouched}
              errorMessage={fieldError}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintEvidenceFields;
