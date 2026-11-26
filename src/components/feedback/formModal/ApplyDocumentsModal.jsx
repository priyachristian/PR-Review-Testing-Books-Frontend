import { useEffect, useState } from 'react';
import { FieldArray, Formik } from 'formik';
import { Alert, Switch, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import Icons from 'assets/icons/icon';
import { dateFormateForUi, calculateTotalAmountApplied } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { creditApplySchema } from '@/utils/validationsSchema';
import { colorPalette } from '@/utils/theme';

const ApplyDocumentsModal = ({
  modalOpen,
  onClose,
  title,
  branchLabel,
  summaryCards = [],
  alertMessage,
  currentBranchOnly,
  onCurrentBranchOnlyChange,
  loading = false,
  applyLoading = false,
  documentKind = 'invoice',
  items = [],
  initialAmountApplied,
  showDueDate = true,
  showTotalAmount = true,
  currency,
  sectionTitle,
  sectionSubtitle,
  emptyTitle,
  emptySubtitle,
  applyButtonText,
  submitDisabled = false,
  destroyOnClose = false,
  getDocumentNumber,
  getDocumentDate,
  getObSubtitle,
  formatAmountValue,
  clampToBalance = true,
  onSubmit,
  validationSchema = creditApplySchema,
  headerExtra = null,
}) => {
  const isInvoice = documentKind === 'invoice';
  const docLabel = isInvoice ? 'Invoice' : 'Bill';
  const docLabelPlural = isInvoice ? 'Invoices' : 'Bills';

  const resolveDocNumber = item => {
    if (getDocumentNumber) return getDocumentNumber(item);
    return isInvoice ? item?.invoiceId : item?.billId;
  };

  const resolveDocDate = item => {
    if (getDocumentDate) return getDocumentDate(item);
    return isInvoice ? item?.invoiceDate : item?.billDate;
  };

  const formatMoney = (value, item) => {
    if (formatAmountValue) return formatAmountValue(value, item);
    return formatAmount(value || 0, true, currency);
  };

  const initialValues = {
    invoiceItems: (items || []).map(item => ({
      ...item,
      amountApplied: typeof initialAmountApplied === 'function' ? initialAmountApplied(item) : (initialAmountApplied ?? 0),
    })),
  };

  return (
    <CustomModal modalOpen={modalOpen} setModalOpen={onClose} destroyOnClose={destroyOnClose} width={1000} title={title}>
      {headerExtra}

      {summaryCards?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
          {branchLabel != null && <p className="text-sm font-medium text-gray-700 mb-3">Branch: {branchLabel}</p>}
          <div
            className={`grid grid-cols-1 gap-4 ${
              summaryCards.length >= 4 ? 'md:grid-cols-4' : summaryCards.length === 3 ? 'md:grid-cols-3' : summaryCards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'
            }`}
          >
            {summaryCards.map((card, idx) => (
              <div key={card.label || idx} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center space-x-2 mb-1">
                  {card.icon}
                  <span className="text-sm font-medium text-gray-600">{card.label}</span>
                </div>
                <p className={`text-base font-bold break-all ${card.valueClassName || 'text-gray-900'}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertMessage && <Alert type="warning" showIcon message={alertMessage} className="mb-4" />}

      {typeof currentBranchOnly === 'boolean' && onCurrentBranchOnlyChange && (
        <div className="flex items-center gap-2 mb-4">
          <Switch checked={currentBranchOnly} onChange={onCurrentBranchOnlyChange} size="small" disabled={loading} />
          <span className="text-sm text-gray-700 whitespace-nowrap">Show current branch documents only</span>
        </div>
      )}

      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className={`bg-gray-50 px-4 py-3 border-b border-gray-200 ${showTotalAmount ? 'flex items-start justify-between gap-4' : ''}`}>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{sectionTitle || `Pending ${docLabelPlural}`}</h3>
                  <p className="text-sm text-gray-600 mt-1">{sectionSubtitle || `Select the ${docLabelPlural.toLowerCase()} to apply`}</p>
                </div>
                {showTotalAmount && (
                  <div className="text-right shrink-0">
                    <span className="text-sm font-medium text-gray-600">Total Amount</span>
                    <p style={{ color: colorPalette.primary[500] }} className="text-base font-bold">
                      {formatAmount(calculateTotalAmountApplied(values?.invoiceItems), true, currency)}
                    </p>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <CustomLoader size="medium" />
                    <p className="text-gray-600 mt-3">Loading pending {docLabelPlural.toLowerCase()}...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-h-[300px] overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">{docLabel} Number</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">{docLabel} Date</th>
                          {showDueDate && <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>}
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">{docLabel} Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">{docLabel} Balance</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Balance to Apply</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <FieldArray name="invoiceItems">
                          {() => (
                            <>
                              {values?.invoiceItems?.map((item, index) => {
                                const obSubtitle = getObSubtitle?.(item);
                                return (
                                  <tr key={item?._id || item?.id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4">
                                      <Tag className="font-semibold">{resolveDocNumber(item)}</Tag>
                                      {obSubtitle && <div className="text-xs text-gray-500 mt-1">{obSubtitle}</div>}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-700">{item?.branchName || item?.branchId?.name || '-'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-gray-700">{dateFormateForUi(resolveDocDate(item))}</span>
                                    </td>
                                    {showDueDate && (
                                      <td className="py-3 px-4">
                                        <span className="text-gray-700">{dateFormateForUi(item?.dueDate)}</span>
                                      </td>
                                    )}
                                    <td className="py-3 px-4">
                                      <span className="font-semibold text-gray-900">{formatMoney(item?.total, item)}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="font-semibold text-orange-600">{formatMoney(item?.balanceAmount, item)}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <CustomInput
                                        type="text"
                                        name={`invoiceItems[${index}].amountApplied`}
                                        value={item.amountApplied === 0 || item.amountApplied === '' || item.amountApplied == null ? '' : item.amountApplied}
                                        onChange={e => {
                                          const raw = e.target.value;
                                          if (raw === '' || raw == null) {
                                            setFieldValue(`invoiceItems[${index}].amountApplied`, 0);
                                            return;
                                          }
                                          if (!clampToBalance) {
                                            setFieldValue(`invoiceItems[${index}].amountApplied`, raw);
                                            return;
                                          }
                                          const val = parseFloat(raw);
                                          const max = parseFloat(item?.balanceAmount ?? 0);
                                          const clamped = !isNaN(val) && val > max ? max : raw;
                                          setFieldValue(`invoiceItems[${index}].amountApplied`, clamped);
                                        }}
                                        onBlur={handleBlur}
                                        placeholder="Enter amount"
                                        errorMessage={errors.invoiceItems?.[index]?.amountApplied}
                                        touched={touched.invoiceItems?.[index]?.amountApplied}
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          )}
                        </FieldArray>
                      </tbody>
                    </table>
                  </div>

                  {(!values?.invoiceItems || values?.invoiceItems?.length === 0) && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Icons.FileTextOutlined className="text-3xl mx-auto" />
                      </div>
                      <p className="text-gray-500 font-medium">{emptyTitle || `No pending ${docLabelPlural.toLowerCase()} found`}</p>
                      {emptySubtitle && <p className="text-gray-400 text-sm mt-1">{emptySubtitle}</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
              <CustomButton className="px-4 py-2" type="default" text="Cancel" disabled={applyLoading || loading} onClick={onClose} />
              <CustomButton
                className="px-4 py-2"
                type="primary"
                text={applyButtonText || `Apply To ${docLabelPlural}`}
                loading={applyLoading || loading}
                onClick={handleSubmit}
                disabled={submitDisabled}
                style={{ minWidth: 130 }}
              />
            </div>
          </>
        )}
      </Formik>
    </CustomModal>
  );
};

export const useCurrentBranchOnlyToggle = modalOpen => {
  const [currentBranchOnly, setCurrentBranchOnly] = useState(true);

  useEffect(() => {
    if (modalOpen) {
      setCurrentBranchOnly(true);
    }
  }, [modalOpen]);

  return [currentBranchOnly, setCurrentBranchOnly];
};

export default ApplyDocumentsModal;
