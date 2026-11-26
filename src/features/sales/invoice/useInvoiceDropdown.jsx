import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { invoiceSliceMethods } from '@/features/sales/invoice/invoice.slice';

/**
 * Paginated invoice dropdown for PaginatedSelect (and similar consumers).
 *
 * Usage:
 *   const { fetchInvoicePage, invoiceDropLoading } = useInvoiceDropdown();
 *   <PaginatedSelect fetchPage={fetchInvoicePage} loading={invoiceDropLoading} ... />
 *
 * Extra filters (e.g. customerId) can be merged in a local adapter:
 *   const fetchPage = ({ page, limit, search, signal }) =>
 *     fetchInvoicePage({ page, limit, search, signal, customerId });
 */
export const useInvoiceDropdown = () => {
  const dispatch = useDispatch();
  const invoiceDropLoading = useSelector(state => state.invoice.invoiceDropLoading);

  const fetchInvoiceDropdownPage = useCallback(payload => dispatch(invoiceSliceMethods.getInvoiceDropdown(payload)).unwrap(), [dispatch]);

  const fetchInvoicePage = useCallback(
    async ({ page, limit, search, signal, ...rest } = {}) => {
      const res = await fetchInvoiceDropdownPage({ page, limit, search, signal, ...rest });
      const results = Array.isArray(res?.data) ? res.data : [];
      const options = results.map(invoice => ({
        label: invoice.invoiceId || invoice._id,
        value: invoice._id,
        raw: invoice,
      }));
      const currentPage = res?.extras?.page ?? page ?? 1;
      const totalPages = res?.extras?.totalPages ?? currentPage;
      return { options, hasMore: currentPage < totalPages };
    },
    [fetchInvoiceDropdownPage]
  );

  return {
    fetchInvoicePage,
    fetchInvoiceDropdownPage,
    invoiceDropLoading,
  };
};
