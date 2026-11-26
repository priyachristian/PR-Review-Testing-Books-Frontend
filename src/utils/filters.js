export const saveAllFiltersToLocalStorage = (filters, FILTER_KEY) => {
  try {
    if (filters && Object.keys(filters).length > 0) {
      localStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } else {
      localStorage.removeItem(FILTER_KEY);
    }
  } catch (error) {
    console.error('Error saving all filters to localStorage:', error);
  }
};

export const getAllFiltersFromLocalStorage = FILTER_KEY => {
  try {
    const savedFilters = localStorage.getItem(FILTER_KEY);
    return savedFilters ? JSON.parse(savedFilters) : null;
  } catch (error) {
    console.error('Error getting all filters from localStorage:', error);
    return null;
  }
};

export const clearAllFiltersFromLocalStorage = FILTER_KEY => {
  try {
    localStorage.removeItem(FILTER_KEY);
  } catch (error) {
    console.error('Error clearing all filters from localStorage:', error);
  }
};

export const saveLockedFiltersState = (isLocked, FILTER_KEY) => {
  try {
    localStorage.setItem(`${FILTER_KEY}_locked`, JSON.stringify(isLocked));
  } catch (error) {
    console.error('Error saving locked filters state to localStorage:', error);
  }
};

export const getLockedFiltersState = FILTER_KEY => {
  try {
    const savedState = localStorage.getItem(`${FILTER_KEY}_locked`);
    return savedState ? JSON.parse(savedState) : false;
  } catch (error) {
    console.error('Error getting locked filters state from localStorage:', error);
    return false;
  }
};
