import { Select, Input, Switch, Spin, Tag } from '@/components/AntDComponent';
import { filterInputEnum } from 'utils/constants';
import { customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const { Search } = Input;

const defaultColumnSelectHeader = { id: 'ID', name: 'Name' };

const renderTwoColumnSelectOption = (option, showCurrentBalance, showRoleColumn) => {
  const data = option?.data ?? option;
  const columnId = data?.columnId ?? '-';
  const columnName = data?.columnName ?? '-';
  const columnBalance = data?.columnBalance ?? '-';
  const columnRole = data?.columnRole;
  const rowModifier = showCurrentBalance ? 'stock' : showRoleColumn ? 'role' : '';

  return (
    <div className={`item-select-dropdown-row${rowModifier ? ` item-select-dropdown-row--with-${rowModifier}` : ''}`}>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">
        <Tag className="font-semibold max-w-full truncate" title={columnId}>
          {columnId}
        </Tag>
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name" title={columnName}>
        {columnName}
      </span>
      {showCurrentBalance ? <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">{columnBalance}</span> : null}
      {showRoleColumn ? <span className="item-select-dropdown-cell item-select-dropdown-cell--role">{columnRole}</span> : null}
    </div>
  );
};

const renderTwoColumnSelectDropdown = (menu, columnSelectHeader, showCurrentBalance, showRoleColumn) => {
  const headerModifier = showCurrentBalance ? 'stock' : showRoleColumn ? 'role' : '';

  return (
    <div className="item-select-dropdown-panel">
      <div className={`item-select-dropdown-header${headerModifier ? ` item-select-dropdown-header--with-${headerModifier}` : ''}`}>
        <span className="item-select-dropdown-cell item-select-dropdown-cell--id">{columnSelectHeader?.id ?? defaultColumnSelectHeader.id}</span>
        <span className="item-select-dropdown-cell item-select-dropdown-cell--name">{columnSelectHeader?.name ?? defaultColumnSelectHeader.name}</span>
        {showCurrentBalance ? <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">{columnSelectHeader?.balance ?? 'Current Balance'}</span> : null}
        {showRoleColumn ? <span className="item-select-dropdown-cell item-select-dropdown-cell--role">{columnSelectHeader?.role ?? 'Role'}</span> : null}
      </div>
      {menu}
    </div>
  );
};

const bankBalanceOptionRender = item => {
  const rc = item.data?.rightContent ?? item.rightContent;
  const label = item.label;
  const showRight = rc != null && rc !== '';
  return (
    <div className="flex justify-between items-center w-full min-w-0 gap-2">
      <span className="truncate">{label}</span>
      {showRight ? <span className="flex-shrink-0 pl-2">{rc}</span> : null}
    </div>
  );
};

const FilterInput = ({
  name,
  label,
  placeHolder = '',
  value,
  //   onChange = () => {},
  onSerch = () => {},
  onClear = () => {},
  type,
  popupMatchSelectWidth = true,
  dropdownStyle,
  selectionOptions = [],
  className = '',
  allowClear = false,
  setFilter,
  showSearch = true,
  mode = false,
  disabled = false,
  extraFilterValues = {},
  notFoundContent,
  required = false,
  loading = false,
  onFocus,
  getPopupContainer,
  selectVariant = 'default',
  columnSelectHeader,
  selectPopupClassName,
  searchFullWidth = false,
}) => {
  const isTwoColumnSelect = selectVariant === 'twoColumn';
  const showCurrentBalanceColumn = isTwoColumnSelect && (selectionOptions.some(opt => opt?.hasBalanceColumn) || Boolean(columnSelectHeader?.balance));
  const showRoleColumn = isTwoColumnSelect && (selectionOptions.some(opt => opt?.hasRoleColumn) || Boolean(columnSelectHeader?.role));
  const resolvedPopupMatchSelectWidth = isTwoColumnSelect ? customerSelectDropdownProps.popupMatchSelectWidth : popupMatchSelectWidth;
  const resolvedDropdownStyle = isTwoColumnSelect
    ? {
        ...(showCurrentBalanceColumn
          ? customerSelectDropdownProps.dropdownStyleWithBalance
          : showRoleColumn
            ? customerSelectDropdownProps.dropdownStyleWithRole
            : customerSelectDropdownProps.dropdownStyle),
        ...dropdownStyle,
      }
    : dropdownStyle;
  const columnSelectPopupClassName = isTwoColumnSelect
    ? [
        'item-select-dropdown-popup',
        selectPopupClassName || customerSelectDropdownProps.selectPopupClassName,
        showCurrentBalanceColumn && customerSelectDropdownProps.selectPopupClassNameWithBalance,
        showRoleColumn && !showCurrentBalanceColumn && customerSelectDropdownProps.selectPopupClassNameWithRole,
      ]
        .filter(Boolean)
        .join(' ')
    : undefined;
  const useBankBalanceOptionRender = !isTwoColumnSelect && selectionOptions.some(o => o && o.rightContent != null && o.rightContent !== '');

  const onChange = (event, name) => {
    if (event?.target) {
      const { value } = event.target;
      setFilter(prev => ({
        ...prev,
        [name]: value,
        ...(extraFilterValues || {}),
      }));
    } else {
      setFilter(prev => ({
        ...prev,
        [name]: event,
        ...(extraFilterValues || {}),
      }));
    }
  };

  return (
    <>
      {label && <div className={`text-[13px] font-semibold text-gray-700 ${required ? 'ant-form-item-required' : ''}`}>{label}</div>}
      {type === filterInputEnum?.SELECT ? (
        <Select
          showSearch={showSearch}
          mode={mode}
          filterOption={(input, option) => {
            if (isTwoColumnSelect) {
              const query = (input ?? '').toLowerCase();
              const text = String(option?.searchLabel ?? option?.label ?? '').toLowerCase();
              return text.includes(query);
            }
            const opt = selectionOptions.find(o => String(o?.value) === String(option?.value));
            const text = typeof opt?.searchLabel === 'string' ? opt.searchLabel : typeof opt?.label === 'string' ? opt.label : '';
            return String(text)
              .toLowerCase()
              .includes((input ?? '').toLowerCase());
          }}
          {...(useBankBalanceOptionRender ? { optionRender: bankBalanceOptionRender } : {})}
          {...(isTwoColumnSelect
            ? {
                optionLabelProp: 'label',
                popupClassName: columnSelectPopupClassName,
                optionRender: option => renderTwoColumnSelectOption(option, showCurrentBalanceColumn, showRoleColumn),
                dropdownRender: menu => renderTwoColumnSelectDropdown(menu, columnSelectHeader, showCurrentBalanceColumn, showRoleColumn),
              }
            : {})}
          placeholder={placeHolder}
          className={`w-full ${className} 
    [&_.ant-select-selector]:!h-[35px]
    [&_.ant-select-selector]:!flex
    [&_.ant-select-selector]:!items-center
    [&_.ant-select-selector]:!py-0
    [&_.ant-select-selection-placeholder]:!flex
    [&_.ant-select-selection-placeholder]:!items-center
    [&_.ant-select-selection-placeholder]:!text-[13px]
  `}
          options={selectionOptions}
          value={loading ? (mode ? [] : undefined) : value || (mode ? [] : undefined)}
          onChange={event => onChange(event, name)}
          maxTagCount="responsive"
          allowClear={allowClear}
          disabled={disabled}
          notFoundContent={
            loading ? (
              <div className="flex justify-center py-3">
                <Spin size="small" />
              </div>
            ) : notFoundContent !== undefined ? (
              notFoundContent
            ) : undefined
          }
          loading={loading}
          onFocus={onFocus}
          popupMatchSelectWidth={resolvedPopupMatchSelectWidth}
          dropdownStyle={resolvedDropdownStyle}
          getPopupContainer={getPopupContainer}
        />
      ) : type === filterInputEnum?.SEARCH ? (
        <div className={`flex items-center gap-4 w-full min-w-0 ${searchFullWidth ? 'max-w-full' : 'lg:max-w-96'}`}>
          <Search
            placeholder={placeHolder}
            allowClear
            value={value || undefined}
            onChange={event => {
              onChange(event, name);
            }}
            className="flex-grow"
            onSearch={onSerch}
            onClear={onClear}
          />
        </div>
      ) : type === filterInputEnum?.SWITCH ? (
        <Switch
          id={name}
          checked={value}
          onChange={event => {
            onChange(event, name);
          }}
          className={`custom-switch font-normal ${className}`}
        />
      ) : (
        ''
      )}
    </>
  );
};

export default FilterInput;
