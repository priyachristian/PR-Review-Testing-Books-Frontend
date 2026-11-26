import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { billsSliceMethods } from '@/features/purchase/bills/bill.slice';

/**
 * Paginated bill dropdown for PaginatedSelect (and similar consumers).
 *
 * Usage:
 *   const { fetchBillPage, billDropLoading } = useBillDropdown();
 *   <PaginatedSelect fetchPage={fetchBillPage} loading={billDropLoading} ... />
 *
 * Extra filters (e.g. vendorId) can be merged in a local adapter:
 *   const fetchPage = ({ page, limit, search, signal }) =>
 *     fetchBillPage({ page, limit, search, signal, vendorId });
 */
export const useBillDropdown = () => {
  const dispatch = useDispatch();
  const billDropLoading = useSelector(state => state.bills.billDropLoading);

  const fetchBillDropdownPage = useCallback(payload => dispatch(billsSliceMethods.getBillDropdown(payload)).unwrap(), [dispatch]);

  const fetchBillPage = useCallback(
    async ({ page, limit, search, signal, ...rest } = {}) => {
      const res = await fetchBillDropdownPage({ page, limit, search, signal, ...rest });
      const results = Array.isArray(res?.data) ? res.data : [];
      const options = results.map(bill => ({
        label: bill.billId || bill._id,
        value: bill._id,
        raw: bill,
      }));
      const currentPage = res?.extras?.page ?? page ?? 1;
      const totalPages = res?.extras?.totalPages ?? currentPage;
      return { options, hasMore: currentPage < totalPages };
    },
    [fetchBillDropdownPage]
  );

  return {
    fetchBillPage,
    fetchBillDropdownPage,
    billDropLoading,
  };
};
