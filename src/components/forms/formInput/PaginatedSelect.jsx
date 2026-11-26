import { useCallback, useEffect, useRef, useState } from 'react';
import { Form, Select, Spin } from '@/components/AntDComponent';

// Extras
import { CustomLabel } from './CustomInput';
import { PAGINATED_SELECT } from '@/utils/pagination';

const CONTROL_HEIGHT_PX = 34;
const CONTROL_HEIGHT_STYLE = { height: CONTROL_HEIGHT_PX };

const PaginatedSelect = ({
  label,
  name,
  placeholder,
  value,
  required = false,
  disabled = false,
  allowClear = false,
  showSearch = true,
  errorMessage,
  touched,
  onBlur,
  setFieldValue,
  onChange,
  className = '',
  labelClassName,
  fetchPage,
  resetDeps = [],
  pageSize = PAGINATED_SELECT.DEFAULT_PAGE_SIZE,
  debounceMs = PAGINATED_SELECT.DEFAULT_DEBOUNCE_MS,
  initialOptions = [],
  notFoundContent,
  loading = false,
  ...props
}) => {
  const [options, setOptions] = useState(() => (Array.isArray(initialOptions) ? initialOptions : []));
  const [search, setSearch] = useState('');

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadedOnceRef = useRef(false);
  const requestIdRef = useRef(0);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const openRef = useRef(false);

  const selectedOptionRef = useRef((Array.isArray(initialOptions) ? initialOptions : []).find(opt => opt.value === value) || null);

  const loadPage = useCallback(
    async (nextPage, searchTerm, append) => {
      if (!fetchPage || disabled) return;
      const requestId = ++requestIdRef.current;
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetchPage({ page: nextPage, limit: pageSize, search: searchTerm, signal: controller.signal });
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one
        const incoming = Array.isArray(res?.options) ? res.options : [];
        hasMoreRef.current = Boolean(res?.hasMore);
        pageRef.current = nextPage;
        setOptions(prev => {
          const merged = append ? [...prev, ...incoming] : incoming;
          const map = new Map(merged.map(opt => [opt.value, opt]));
          const next = Array.from(map.values());
          const selected = selectedOptionRef.current;
          if (selected && !map.has(selected.value)) next.unshift(selected);
          return next;
        });
      } catch (err) {
        if (requestId === requestIdRef.current && err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
          hasMoreRef.current = false;
        }
      }
    },
    [fetchPage, disabled, pageSize]
  );

  useEffect(() => {
    requestIdRef.current += 1; // invalidate in-flight responses
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    selectedOptionRef.current = null;
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadedOnceRef.current = false;
    setSearch('');
    setOptions([]);
    if (openRef.current && !disabled) {
      loadedOnceRef.current = true;
      loadPage(1, '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const handleDropdownVisibleChange = nextOpen => {
    openRef.current = nextOpen;
    if (nextOpen && !loadedOnceRef.current && !disabled) {
      loadedOnceRef.current = true;
      loadPage(1, search, false);
    }
  };

  const handleSearch = val => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadedOnceRef.current = true;
      loadPage(1, val, false);
    }, debounceMs);
  };

  const handlePopupScroll = e => {
    const target = e.target;
    if (!loading && hasMoreRef.current && target.scrollTop + target.offsetHeight >= target.scrollHeight - PAGINATED_SELECT.SCROLL_THRESHOLD_PX) {
      loadPage(pageRef.current + 1, search, true);
    }
  };

  const handleChange = (next, option) => {
    const resolved = next === undefined || next === null || next === '' ? null : next;
    const picked = Array.isArray(option) ? option[0] : option;
    selectedOptionRef.current = resolved == null ? null : picked || selectedOptionRef.current;
    if (setFieldValue) setFieldValue(name, resolved);
    if (onChange) onChange(resolved, picked || null);
  };

  return (
    <div className="w-full">
      <Form.Item
        label={label && <CustomLabel label={label} name={name} required={required} labelClassName={labelClassName} />}
        validateStatus={touched && errorMessage ? 'error' : ''}
        help={touched && errorMessage}
        rules={[{ required }]}
      >
        <Select
          id={name}
          showSearch={showSearch}
          filterOption={false}
          value={value === '' || value == null ? undefined : value}
          onBlur={onBlur}
          loading={loading}
          disabled={disabled}
          allowClear={allowClear}
          placeholder={placeholder}
          options={options}
          onChange={handleChange}
          onSearch={showSearch ? handleSearch : undefined}
          onPopupScroll={handlePopupScroll}
          onDropdownVisibleChange={handleDropdownVisibleChange}
          notFoundContent={
            loading ? (
              <div className="flex justify-center py-3">
                <Spin size="small" />
              </div>
            ) : (
              notFoundContent
            )
          }
          dropdownRender={menu => (
            <div>
              {menu}
              {loading && options.length > 0 && (
                <div className="flex justify-center py-2 border-t border-[#f0f0f0]">
                  <Spin size="small" />
                </div>
              )}
            </div>
          )}
          style={{ ...(props?.style || {}), ...CONTROL_HEIGHT_STYLE }}
          styles={{
            ...(props?.styles || {}),
            selector: { ...(props?.styles?.selector || {}), height: CONTROL_HEIGHT_PX, alignItems: 'center' },
          }}
          className={`custom-select font-normal ${className}`}
          {...props}
        />
      </Form.Item>
    </div>
  );
};

export default PaginatedSelect;
