import { useRef, useState } from 'react';
import { Button, Checkbox, DatePicker, Form, Input, Radio, Select, Switch, Upload, Tooltip, Spin, Tag } from '@/components/AntDComponent';

// Extras
import Icons from 'assets/icons/icon';
import Toast from '@/components/ui/common/Toast';
import { customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { ProductionDataDot, productionItemSelectDropdownProps } from '@/utils/tableSelectDropdown/productionItemSelectDropdown';

const { Option } = Select;

const sanitizeDecimalInput = (value, decimalPlaces) => {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  if (!decimalPlaces) return cleaned.replace(/\./g, '');

  const [whole = '', ...fractionParts] = cleaned.split('.');
  if (!fractionParts.length) return whole;
  return `${whole}.${fractionParts.join('').slice(0, decimalPlaces)}`;
};

const defaultColumnSelectHeader = { id: 'ID', name: 'Name' };
const CONTROL_HEIGHT_PX = 34;
const CONTROL_HEIGHT_STYLE = { height: CONTROL_HEIGHT_PX };

const renderProductionItemSelectOption = option => {
  const data = option?.data ?? option;
  const columnId = data?.columnId ?? '-';
  const columnName = data?.columnName ?? '-';
  const isProductionDataAdded = Boolean(data?.isProductionDataAdded);

  return (
    <div className="item-select-dropdown-row item-select-dropdown-row--with-production-data">
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">
        <Tag className="font-semibold max-w-full truncate" title={columnId}>
          {columnId}
        </Tag>
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name" title={columnName}>
        {columnName}
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--production-data">
        <ProductionDataDot isAdded={isProductionDataAdded} />
      </span>
    </div>
  );
};

const renderProductionItemSelectDropdown = (menu, columnSelectHeader) => (
  <div className="item-select-dropdown-panel">
    <div className="item-select-dropdown-header item-select-dropdown-header--with-production-data">
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">{columnSelectHeader?.id ?? 'Item#'}</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name">{columnSelectHeader?.name ?? 'Item Name'}</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--production-data">{columnSelectHeader?.productionData ?? 'Production Data'}</span>
    </div>
    {menu}
  </div>
);

const renderTwoColumnSelectOption = (option, showCurrentBalance) => {
  const data = option?.data ?? option;
  const columnId = data?.columnId ?? '-';
  const columnName = data?.columnName ?? '-';
  const columnBalance = data?.columnBalance ?? '-';
  const columnColor = data?.columnColor;

  return (
    <div className={`item-select-dropdown-row${showCurrentBalance ? ' item-select-dropdown-row--with-stock' : ''}`}>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">
        <Tag className="font-semibold max-w-full truncate" title={columnId}>
          {columnId}
        </Tag>
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name" title={columnName}>
        {columnColor ? (
          <span className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="inline-block h-3 w-3 rounded-full shrink-0 border border-black/15" style={{ backgroundColor: columnColor }} />
            <span className="truncate">{columnName}</span>
          </span>
        ) : (
          columnName
        )}
      </span>
      {showCurrentBalance ? <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">{columnBalance}</span> : null}
    </div>
  );
};

const renderTwoColumnSelectDropdown = (menu, columnSelectHeader, showCurrentBalance) => (
  <div className="item-select-dropdown-panel">
    <div className={`item-select-dropdown-header${showCurrentBalance ? ' item-select-dropdown-header--with-stock' : ''}`}>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">{columnSelectHeader?.id ?? defaultColumnSelectHeader.id}</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name">{columnSelectHeader?.name ?? defaultColumnSelectHeader.name}</span>
      {showCurrentBalance ? <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">{columnSelectHeader?.balance ?? 'Current Balance'}</span> : null}
    </div>
    {menu}
  </div>
);
const { TextArea } = Input;

export const CustomLabel = ({ label, name, required, labelClassName }) => (
  <div className="custom-form-item">
    <div className={`ant-form-item-label !p-0 flex ${labelClassName || ''}`}>
      {required && <span className="ant-form-item-required"></span>}
      <div htmlFor={name}>{label}</div>
    </div>
  </div>
);

const CustomInput = ({
  label,
  className,
  name,
  popupMatchSelectWidth = true,
  dropdownStyle,
  type = 'text',
  addonBefore,
  selectOptions = [],
  selectVariant = 'default',
  columnSelectHeader,
  radioOptions = [],
  errorMessage,
  touched,
  onBlur,
  rows = 3,
  mode = false,
  allowClear = false,
  onChange,
  multiple = false,
  setFieldValue,
  setFieldTouched,
  CheckboxName,
  value,
  required = false,
  editButton = false,
  showDropdownButton = false,
  dropdownButtonLabel = 'Button',
  notFoundContent,
  loading,
  onDropdownButtonClick,
  uploadProps,
  showSearch = true,
  suffix,
  labelClassName,
  checkboxClassName,
  maxTagCount,
  decimalPlaces,
  ...props
}) => {
  // Guard against callers passing null (default param only covers undefined)
  selectOptions = Array.isArray(selectOptions) ? selectOptions : [];
  const omittedTagValuesRef = useRef([]);
  const isTwoColumnSelect = selectVariant === 'twoColumn';

  // Hide the validation error while the field is actively focused/open so the
  // user sees clean UI the moment they re-engage with the field rather than only
  // after blur. Works for every input type without needing setFieldTouched to be
  // passed by the caller.
  const [isFocused, setIsFocused] = useState(false);

  const { onFocus: onFocusProp, ...restProps } = props;
  const { maxLength: maxLengthProp, ...phoneRestProps } = restProps;
  const phoneMaxLength = maxLengthProp ?? 10;

  const handleFocus = e => {
    setIsFocused(true);
    onFocusProp?.(e);
  };

  const handleBlur = e => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handlePhoneChange = e => {
    const nextValue = String(e.target.value ?? '')
      .replace(/\D/g, '')
      .slice(0, phoneMaxLength);
    setFieldValue(name, nextValue);
    if (onChange) {
      onChange({
        ...e,
        target: { ...e.target, name, value: nextValue },
      });
    }
  };
  const isProductionItemSelect = selectVariant === 'productionItem';
  const isColumnSelect = isTwoColumnSelect || isProductionItemSelect;
  const showCurrentBalanceColumn = isTwoColumnSelect && selectOptions.some(opt => opt.hasBalanceColumn);
  const resolvedPopupMatchSelectWidth =
    popupMatchSelectWidth !== undefined
      ? popupMatchSelectWidth
      : isProductionItemSelect
        ? productionItemSelectDropdownProps.popupMatchSelectWidth
        : isTwoColumnSelect
          ? customerSelectDropdownProps.popupMatchSelectWidth
          : true;
  const resolvedDropdownStyle = isProductionItemSelect
    ? { ...productionItemSelectDropdownProps.dropdownStyle, ...dropdownStyle }
    : isTwoColumnSelect
      ? {
          ...(showCurrentBalanceColumn ? customerSelectDropdownProps.dropdownStyleWithBalance : customerSelectDropdownProps.dropdownStyle),
          ...dropdownStyle,
        }
      : dropdownStyle;
  const columnSelectPopupClassName = isProductionItemSelect
    ? productionItemSelectDropdownProps.selectPopupClassName
    : ['item-select-dropdown-popup', customerSelectDropdownProps.selectPopupClassName, showCurrentBalanceColumn && customerSelectDropdownProps.selectPopupClassNameWithBalance]
        .filter(Boolean)
        .join(' ');

  return (
    <div className={`w-full${touched && errorMessage && !isFocused ? ' pb-3' : ''}`}>
      <Form.Item
        label={label && <CustomLabel label={label} name={name} required={required} labelClassName={labelClassName} />}
        validateStatus={touched && errorMessage && !isFocused ? 'error' : ''}
        help={touched && errorMessage && !isFocused ? errorMessage : ''}
        rules={[{ required: required }]}
      >
        {type === 'password' ? (
          <Input.Password
            id={name}
            value={value}
            onChange={e => {
              setFieldValue(name, e.target.value);
              if (onChange) onChange(e);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={CONTROL_HEIGHT_STYLE}
            className={`!h-[34px] rounded font-normal ${className}`}
            {...restProps}
          />
        ) : type === 'select' ? (
          <Select
            showSearch={showSearch}
            filterOption={
              isColumnSelect
                ? (input, option) => {
                    const query = (input ?? '').toLowerCase();
                    const text = String(option?.searchLabel ?? option?.label ?? '').toLowerCase();
                    return text.includes(query);
                  }
                : (input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            id={name}
            value={loading ? (mode ? [] : undefined) : Array.isArray(value) ? value : value === '' || value == null ? undefined : value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            loading={loading}
            notFoundContent={
              loading ? (
                <div className="flex justify-center py-3">
                  <Spin size="small" />
                </div>
              ) : notFoundContent !== undefined ? (
                notFoundContent
              ) : undefined
            }
            mode={mode}
            allowClear={allowClear}
            popupMatchSelectWidth={resolvedPopupMatchSelectWidth}
            dropdownStyle={resolvedDropdownStyle}
            style={{ ...(restProps?.style || {}), ...CONTROL_HEIGHT_STYLE }}
            styles={{
              ...(restProps?.styles || {}),
              selector: { ...(restProps?.styles?.selector || {}), height: CONTROL_HEIGHT_PX, alignItems: 'center' },
            }}
            {...(isColumnSelect
              ? {
                  options: selectOptions,
                  optionLabelProp: 'label',
                  popupClassName: columnSelectPopupClassName,
                  optionRender: option => (isProductionItemSelect ? renderProductionItemSelectOption(option) : renderTwoColumnSelectOption(option, showCurrentBalanceColumn)),
                }
              : {})}
            onChange={next => {
              const resolved = Array.isArray(next) ? next : next === undefined || next === null || next === '' ? null : next;
              setFieldValue(name, resolved);
              if (onChange) onChange(resolved);
            }}
            dropdownRender={menu =>
              isProductionItemSelect ? (
                <div>
                  {renderProductionItemSelectDropdown(menu, columnSelectHeader)}
                  {showDropdownButton && (
                    <div
                      style={{
                        borderTop: '1px solid #f0f0f0',
                        padding: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <Button type="primary" onClick={() => onDropdownButtonClick && onDropdownButtonClick()}>
                        {dropdownButtonLabel}
                      </Button>
                    </div>
                  )}
                </div>
              ) : selectVariant === 'twoColumn' ? (
                <div>
                  {renderTwoColumnSelectDropdown(menu, columnSelectHeader, showCurrentBalanceColumn)}
                  {showDropdownButton && (
                    <div
                      style={{
                        borderTop: '1px solid #f0f0f0',
                        padding: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <Button type="primary" onClick={() => onDropdownButtonClick && onDropdownButtonClick()}>
                        {dropdownButtonLabel}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div>{menu}</div>
                  {showDropdownButton && (
                    <div
                      style={{
                        borderTop: '1px solid #f0f0f0',
                        padding: '4px',
                        textAlign: 'center',
                      }}
                    >
                      <Button type="primary" onClick={() => onDropdownButtonClick && onDropdownButtonClick()}>
                        {dropdownButtonLabel}
                      </Button>
                    </div>
                  )}
                </div>
              )
            }
            tagRender={tagProps => {
              const { closable, onClose, label: tagLabel, value: tagValue } = tagProps;
              const option = selectOptions.find(opt => opt.value === tagValue);
              const isOverflowTag =
                !option &&
                String(tagLabel ?? '')
                  .trim()
                  .startsWith('+');

              if (isOverflowTag) {
                const countLabel = String(tagLabel)
                  .replace(/\s*\.\.\.\s*$/, '')
                  .trim();
                const omittedLabels = (omittedTagValuesRef.current || []).map(omitted => {
                  if (omitted?.label != null && omitted.label !== '') return omitted.label;
                  const opt = selectOptions.find(o => String(o.value) === String(omitted?.value ?? omitted));
                  return opt?.label ?? omitted?.value ?? omitted;
                });
                const tooltipTitle =
                  omittedLabels.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {omittedLabels.map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                  ) : undefined;

                return (
                  <Tooltip title={tooltipTitle} placement="top">
                    <span className="inline-flex items-center bg-[#f0f0f0] py-0.5 px-1.5 rounded-[3px] mr-1 text-sm leading-none cursor-default">{countLabel}</span>
                  </Tooltip>
                );
              }
              const displayLabel = option?.label ?? tagLabel;
              return (
                <Tooltip title={displayLabel} placement="top">
                  <div className="inline-flex items-center bg-[#f0f0f0] py-0.5 px-1.5 rounded-[3px] mr-1 w-[130px] min-w-0">
                    <span className="truncate flex-1 text-sm">{displayLabel}</span>

                    {editButton && (
                      <Button
                        type="link"
                        size="small"
                        onClick={e => {
                          e.stopPropagation();
                          if (option?.onEdit) option.onEdit(option);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {closable && (
                      <Icons.CloseOutlined
                        className="ml-1 text-xs cursor-pointer flex-shrink-0"
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => onClose()}
                      />
                    )}
                  </div>
                </Tooltip>
              );
            }}
            className={`custom-select font-normal ${isColumnSelect ? 'custom-select--two-column ' : ''}${mode ? '[&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!py-0 [&_.ant-select-selection-overflow]:!flex [&_.ant-select-selection-overflow]:!items-center [&_.ant-select-selection-placeholder]:!flex [&_.ant-select-selection-placeholder]:!items-center [&_.ant-select-selection-placeholder]:!text-[13px] ' : ''}${className}`}
            maxTagCount={maxTagCount !== undefined ? maxTagCount : mode ? 2 : undefined}
            maxTagPlaceholder={
              mode
                ? omittedValues => {
                    omittedTagValuesRef.current = omittedValues;
                    return `+${omittedValues.length}`;
                  }
                : undefined
            }
            {...restProps}
          >
            {!isColumnSelect &&
              selectOptions.map(option => (
                <Option key={option.value} value={option.value} label={option.label} disabled={option.disabled}>
                  {/* Click-through: this tooltip opens over the select's clear icon on a selected value. */}
                  <Tooltip title={option.tooltip || option.label} placement="right" overlayStyle={{ pointerEvents: 'none' }}>
                    <div className="flex justify-between items-center w-full">
                      <span className="truncate">{option.label}</span>
                      {option?.rightContent !== undefined && option?.rightContent !== null && <span className="flex-shrink-0 pl-3">{option.rightContent}</span>}
                      {editButton && (
                        <Button
                          type="link"
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            if (option.onEdit) option.onEdit(option);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </Tooltip>
                </Option>
              ))}
          </Select>
        ) : name === 'otp' ? (
          <Input.OTP id={name} name={name} onBlur={handleBlur} value={value} className={`custom-otp font-normal ${className}`} length={6} {...restProps} />
        ) : type === 'number' ? (
          <Input
            id={name}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={e => {
              const nextValue = decimalPlaces == null ? e.target.value : sanitizeDecimalInput(e.target.value, decimalPlaces);
              setFieldValue(name, nextValue);
              if (onChange) onChange(e);
            }}
            inputMode={decimalPlaces === 0 ? 'numeric' : decimalPlaces > 0 ? 'decimal' : undefined}
            addonBefore={addonBefore}
            style={CONTROL_HEIGHT_STYLE}
            className={`!h-[34px] rounded font-normal ${className}`}
            {...restProps}
          />
        ) : type === 'phone' ? (
          <Input
            id={name}
            name={name}
            value={value}
            defaultValue={value}
            onChange={handlePhoneChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            addonBefore={addonBefore}
            maxLength={phoneMaxLength}
            style={CONTROL_HEIGHT_STYLE}
            className={`!h-[34px] rounded font-normal ${className}`}
            {...phoneRestProps}
          />
        ) : type === 'checkbox' ? (
          <Checkbox
            id={name}
            checked={value}
            onBlur={handleBlur}
            onChange={e => {
              if (setFieldValue) {
                setFieldValue(name, e.target.checked);
              }
              if (onChange) onChange(e);
            }}
            className={`custom-checkbox font-normal ms-2 ${className} ${checkboxClassName || ''}`}
            {...restProps}
          >
            {CheckboxName}
          </Checkbox>
        ) : type === 'file' ? (
          <Upload
            {...uploadProps}
            id={name}
            multiple={multiple}
            listType="picture"
            onBlur={onBlur}
            beforeUpload={file => {
              const maxSize = 5 * 1024 * 1024;
              if (file.size > maxSize) {
                Toast.error('The file size must not exceed 5MB.');
                return false;
              }
              setFieldValue(name, file);
              return false;
            }}
            className={`custom-upload font-normal ${className}`}
          >
            <Button className="w-full !h-32 border-dashed flex flex-col">
              <div>
                <Icons.CloudUploadOutlined className="text-2xl" />
              </div>
              <div className="font-bold text-xs">Choose a File or Drag & Drop it here</div>
              <div className="text-xs">Supported File Types: JPEG, PNG, SVG and PDF</div>
            </Button>
          </Upload>
        ) : type === 'radio' ? (
          <Radio.Group
            id={name}
            name={name}
            value={value}
            onBlur={handleBlur}
            onChange={e => {
              const value = e.target.value;
              setFieldValue(name, value);
              if (onChange) {
                // Create a synthetic event with name attribute for Formik's handleChange
                const syntheticEvent = {
                  ...e,
                  target: {
                    ...e.target,
                    name: name,
                    value: value,
                  },
                };
                onChange(syntheticEvent);
              }
            }}
            className={`custom-radio font-normal ms-2 ${className}`}
            {...restProps}
          >
            {radioOptions.map(option => (
              <Radio key={option.value} value={option.value} name={name}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        ) : type === 'textarea' ? (
          <TextArea
            id={name}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={e => {
              if (setFieldValue) {
                setFieldValue(name, e.target.value);
              }
              if (onChange) onChange(e);
            }}
            rows={rows}
            className={`w-full py-1.5 rounded font-normal ${className}`}
            {...restProps}
          />
        ) : type === 'date' ? (
          <DatePicker
            id={name}
            value={value}
            onBlur={handleBlur}
            onChange={(date, dateString) => {
              setFieldValue(name, date);
              setFieldTouched?.(name, true, false);
              if (onChange) onChange(date, dateString);
            }}
            onOpenChange={open => {
              setIsFocused(open);
              if (!open) setFieldTouched?.(name, true, false);
              restProps.onOpenChange?.(open);
            }}
            style={CONTROL_HEIGHT_STYLE}
            className={`w-full !h-[34px] font-normal ${className}`}
            {...restProps}
          />
        ) : type === 'switch' ? (
          <Switch
            id={name}
            checked={value}
            onBlur={handleBlur}
            onChange={checked => {
              setFieldValue(name, checked);
              if (onChange) onChange(checked);
            }}
            className={`custom-switch font-normal ${className}`}
            {...restProps}
          />
        ) : type === 'account' ? (
          <Select
            showSearch
            id={name}
            value={loading ? undefined : value === '' || value == null ? undefined : value}
            optionLabelProp="title"
            filterOption={(input, option) => {
              if (!option) return false;
              const searchText = input.toLowerCase();
              const getLabelText = label => {
                if (typeof label === 'string') return label;
                if (typeof label === 'object' && label.props?.children) return label.props.children;
                return '';
              };

              const optionLabel = getLabelText(option.label).toLowerCase();
              const optionTitle = option.title?.toLowerCase() || '';

              return optionLabel.includes(searchText) || optionTitle.includes(searchText);
            }}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            options={selectOptions}
            optionRender={option => <span style={{ paddingInlineStart: (option.data.depth ?? 0) * 40 }}>{option.label}</span>}
            style={{ ...(restProps?.style || {}), ...CONTROL_HEIGHT_STYLE }}
            styles={{
              ...(restProps?.styles || {}),
              selector: { ...(restProps?.styles?.selector || {}), height: CONTROL_HEIGHT_PX, alignItems: 'center' },
            }}
            {...restProps}
            loading={loading}
          />
        ) : (
          <Input
            id={name}
            value={value}
            onChange={e => {
              if (setFieldValue) {
                setFieldValue(name, e.target.value);
              }
              if (onChange) onChange(e);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={CONTROL_HEIGHT_STYLE}
            className={`!h-[34px] rounded font-normal ${className}`}
            suffix={suffix}
            {...restProps}
          />
        )}
      </Form.Item>
    </div>
  );
};

export default CustomInput;
