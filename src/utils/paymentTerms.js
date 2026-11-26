/**
 * Company-level (branch-aware) default payment term, read from the credit-limit config.
 *
 * Used as the fallback tier on document forms: when the selected customer/vendor has no
 * payment term of its own, fall back to the company default before the hard 'Due On Receipt'.
 * Mirrors the backend company tier in utils/customerPaymentTerms.js.
 *
 * @param {Object} creditLimitConfig - { salesCreditLimit, purchaseCreditLimit } from useProfile()
 * @param {string} branchId - the document's selected branchId
 * @param {boolean} [isSalesModule=true] - true for sales documents, false for purchase documents
 * @returns {string|null} the resolved company payment term, or null when none is configured
 */
export const resolveCompanyBranchPaymentTerms = (creditLimitConfig, branchId, isSalesModule = true) => {
  const config = isSalesModule ? creditLimitConfig?.salesCreditLimit : creditLimitConfig?.purchaseCreditLimit;
  if (!config) return null;

  if (config.useBranchPaymentTerms) {
    if (!branchId) return null;
    const branchIdStr = String(branchId);
    const matched = (config.branch || []).find(b => String(b.branchId?._id ?? b.branchId) === branchIdStr);
    return matched?.paymentTerms || null;
  }

  return config.paymentTerms || null;
};

/**
 * Resolve the default payment term for a document: the party's own term, then the company
 * default (branch-aware), then the 'Due On Receipt' constant.
 *
 * @param {string} partyPaymentTerms - the selected customer/vendor's own paymentTerms (may be empty)
 * @param {Object} creditLimitConfig - { salesCreditLimit, purchaseCreditLimit } from useProfile()
 * @param {string} branchId - the document's selected branchId
 * @param {boolean} [isSalesModule=true]
 * @returns {string} the resolved payment term (never empty)
 */
export const resolveDefaultPaymentTerms = (partyPaymentTerms, creditLimitConfig, branchId, isSalesModule = true) =>
  partyPaymentTerms || resolveCompanyBranchPaymentTerms(creditLimitConfig, branchId, isSalesModule) || 'Due On Receipt';
