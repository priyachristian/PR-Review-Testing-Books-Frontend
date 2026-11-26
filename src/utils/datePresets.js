import dayjs from 'dayjs';

export const getPresetDateRange = preset => {
  const today = dayjs();

  switch (preset) {
    case 'today':
      return [today.startOf('day'), today.endOf('day')];
    case 'last7Days':
      return [today.subtract(7, 'day').startOf('day'), today.endOf('day')];
    case 'last15Days':
      return [today.subtract(15, 'day').startOf('day'), today.endOf('day')];
    case 'lastMonth':
      return [today.subtract(1, 'month').startOf('day'), today.endOf('day')];
    case 'last3Months':
      return [today.subtract(3, 'month').startOf('day'), today.endOf('day')];
    case 'financialYear': {
      const startYear = today.month() < 3 ? today.year() - 1 : today.year();
      return [dayjs(`${startYear}-04-01`).startOf('day'), dayjs(`${startYear + 1}-03-31`).endOf('day')];
    }
    default:
      return null;
  }
};

export const getPresetDateRangeMonthWise = preset => {
  const today = dayjs();

  switch (preset) {
    case 'last3Months':
      return [today.subtract(2, 'month').startOf('month'), today.endOf('month')];
    case 'last6Months':
      return [today.subtract(5, 'month').startOf('month'), today.endOf('month')];
    case 'last9Months':
      return [today.subtract(8, 'month').startOf('month'), today.endOf('month')];
    case 'last12Months':
      return [today.subtract(11, 'month').startOf('month'), today.endOf('month')];
    default:
      return null;
  }
};

export const getCurrentFinancialYearRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const startYear = month < 4 ? year - 1 : year;

  const startDate = new Date(startYear, 3, 1);
  const endDate = today;

  return {
    startDate: dayjs(startDate).format('YYYY-MM-DD'),
    endDate: dayjs(endDate).format('YYYY-MM-DD'),
  };
};

export const getMonthStartAndEndDate = (year, monthNumber) => {
  const startDate = dayjs(`${year}-${monthNumber}-01`).startOf('month');
  const endDate = startDate.endOf('month');

  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
  };
};
