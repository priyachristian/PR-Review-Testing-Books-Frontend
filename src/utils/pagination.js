/**
 * Default rows per page for list tables, URL `limit`, and API `limit` parameters.
 * Single source of truth — change here only.
 */
export const DEFAULT_PAGE_SIZE = 15;

/** First page index (1-based), used with DEFAULT_PAGE_SIZE in URL/state defaults */
export const DEFAULT_PAGE = 1;

/** Options shown in CustomTable “per page” dropdown (numeric values) */
export const TABLE_PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export const PAGINATED_SELECT = {
  DEFAULT_PAGE_SIZE: 100,
  DEFAULT_DEBOUNCE_MS: 400,
  SCROLL_THRESHOLD_PX: 24,
};
