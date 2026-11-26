import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DOCS_LINKS } from '@/utils/docsLinks';

const DOCS_BASE_URL = import.meta.env.VITE_DOCS_URL || '';

/**
 * Returns the full documentation URL for the current route, or `null` when
 * the current page has no matching docs entry.
 *
 * Matching is done on the first URL segment so that list, detail, add and
 * edit pages all resolve to the same doc:
 *   /customer-master          → customer-master docs
 *   /customer-master/new      → customer-master docs
 *   /customer-master/:id/edit → customer-master docs
 */
export function useDocsLink() {
  const { pathname } = useLocation();

  return useMemo(() => {
    // Strip the leading "/" and take the first segment
    const firstSegment = pathname.replace(/^\//, '').split('/')[0];
    const docPath = DOCS_LINKS[firstSegment];
    if (!docPath) return null;
    return `${DOCS_BASE_URL}${docPath}`;
  }, [pathname]);
}
