import dayjs from 'dayjs';

// Components
import { DatePicker, Select, Space } from '../../AntDComponent';

// Extras
import { getPresetDateRange, getPresetDateRangeMonthWise } from 'utils/datePresets';
import { getFinancialYearStartYear, getFYDateRangeFromStartYear } from 'utils/util';

const { RangePicker } = DatePicker;

const PRESET_RANGES = {
  today: 'Today',
  last7Days: 'Last 7 Days',
  last15Days: 'Last 15 Days',
  lastMonth: 'Last Month',
  last3Months: 'Last 3 Months',
  financialYear: 'Financial Year',
  custom: 'Custom Range',
  specific: 'Specific Date',
};

const PRESET_RANGES_WITH_MONTH = {
  last3Months: 'Last 3 Months',
  last6Months: 'Last 6 Months',
  last9Months: 'Last 9 Months',
  last12Months: 'Last 12 Months',
  custom: 'Custom Range',
};

const CustomDatePicker = ({
  selectedPreset,
  setSelectedPreset,
  dateRange,
  setDateRange,
  className = '',
  style = {},
  label = 'Date',
  isMonthRange = false,
  disabledDate,
  hidePresetSelect = false,
  enableFYYearPicker = false,
}) => {
  const handlePresetChange = value => {
    setSelectedPreset(value);

    if (value === 'financialYear' && enableFYYearPicker) {
      setDateRange(null);
      return;
    }

    const range = getPresetDateRange(value);
    const monthRange = getPresetDateRangeMonthWise(value);
    setDateRange(isMonthRange ? monthRange : range);
  };

  const handleFinancialYearSelect = date => {
    if (!date) {
      setDateRange(null);
      return;
    }

    const fyStartYear = String(date.year());
    const fyRange = getFYDateRangeFromStartYear(fyStartYear);
    setDateRange(fyRange ? [dayjs(fyRange.startDate), dayjs(fyRange.endDate)] : null);
  };

  const preset = hidePresetSelect ? 'custom' : selectedPreset;
  const pickerWidth = hidePresetSelect ? '100%' : 'calc(100% - 130px)';

  return (
    <div className={`space-y-2 ${className}`} style={style}>
      <div className="text-[13px] font-medium text-gray-700">{label}</div>
      <Space.Compact className="w-full">
        {!hidePresetSelect && (
          <Select
            showSearch
            optionFilterProp="label"
            className="!h-[35.5px]"
            value={selectedPreset}
            onChange={handlePresetChange}
            options={Object.entries(isMonthRange ? PRESET_RANGES_WITH_MONTH : PRESET_RANGES)
              .filter(([key]) => key !== 'financialYear' || enableFYYearPicker)
              .map(([key, label]) => ({
                value: key,
                label,
              }))}
            style={{ width: '140px' }}
          />
        )}
        {preset === 'specific' || preset === 'today' ? (
          <DatePicker
            style={{ width: pickerWidth }}
            placeholder="Select Date"
            value={dateRange ? dayjs(dateRange[0]) : null}
            onChange={date => {
              setDateRange(date ? [date, date] : null);
            }}
            format="DD/MM/YYYY"
            disabled={preset === 'today'}
            disabledDate={disabledDate}
            onClear={() => setDateRange(null)}
            className="h-[35.5px]"
          />
        ) : preset === 'financialYear' && enableFYYearPicker ? (
          <DatePicker
            picker="year"
            style={{ width: pickerWidth }}
            placeholder="Select Year"
            value={dateRange?.[0] ? dayjs(dateRange[0]) : null}
            format={date => {
              const fyStartYear = getFinancialYearStartYear(date);
              return fyStartYear ? `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}` : '';
            }}
            onChange={handleFinancialYearSelect}
            allowClear
            className="h-[35.5px]"
          />
        ) : preset === 'custom' ? (
          <RangePicker
            style={{ width: pickerWidth }}
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={dates => setDateRange(dates)}
            allowClear={true}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            className="h-[35.5px] "
          />
        ) : (
          <RangePicker
            style={{ width: pickerWidth }}
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={dates => setDateRange(dates)}
            allowClear={true}
            format="DD/MM/YYYY"
            disabledDate={disabledDate}
            className="h-[35.5px]"
            disabled
          />
        )}
      </Space.Compact>
    </div>
  );
};

export default CustomDatePicker;
