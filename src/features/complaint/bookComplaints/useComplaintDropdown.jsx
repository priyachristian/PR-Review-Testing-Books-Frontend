import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { complaintSliceMethods } from '@/features/complaint/bookComplaints/complaint.slice';

/**
 * Paginated complaint dropdown for PaginatedSelect (and similar consumers).
 *
 * Usage:
 *   const { fetchComplaintPage, complaintDropLoading } = useComplaintDropdown();
 *   <PaginatedSelect fetchPage={fetchComplaintPage} loading={complaintDropLoading} ... />
 *
 * Extra filters can be merged in a local adapter:
 *   const fetchPage = ({ page, limit, search, signal }) =>
 *     fetchComplaintPage({ page, limit, search, signal, ...extraFilters });
 */
export const useComplaintDropdown = () => {
  const dispatch = useDispatch();
  const complaintDropLoading = useSelector(state => state.complaint.complaintDropLoading);

  const fetchComplaintDropdownPage = useCallback(payload => dispatch(complaintSliceMethods.getComplaintDropdown(payload)).unwrap(), [dispatch]);

  const fetchComplaintPage = useCallback(
    async ({ page, limit, search, signal, ...rest } = {}) => {
      const res = await fetchComplaintDropdownPage({ page, limit, search, signal, ...rest });
      const results = Array.isArray(res?.data) ? res.data : [];
      const options = results.map(complaint => {
        const no = complaint.complaintNo || complaint._id;
        const title = complaint.title || '';
        const truncated = title.length > 36 ? `${title.slice(0, 36).trimEnd()}…` : title;
        return {
          label: truncated ? `${no} — ${truncated}` : no,
          value: complaint._id,
          raw: complaint,
        };
      });
      const currentPage = res?.extras?.page ?? page ?? 1;
      const totalPages = res?.extras?.totalPages ?? currentPage;
      return { options, hasMore: currentPage < totalPages };
    },
    [fetchComplaintDropdownPage]
  );

  return {
    fetchComplaintPage,
    fetchComplaintDropdownPage,
    complaintDropLoading,
  };
};
