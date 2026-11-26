import dayjs from 'dayjs';
import { pageTypes } from './constants';
import { getGstNumericRate } from './gstDisplay';
import { formatAmount, toDecimalString } from './currency';
import { getItemUnitName, priceListNetPriceForUnit, resolveLineUnitSelection } from './itemLineUnit';

export { getCurrentFinancialYearRange, getMonthStartAndEndDate, getPresetDateRange, getPresetDateRangeMonthWise } from './datePresets';
export { getAccessibleModulesList } from './moduleAccess';

const setInLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getFromLocalStorage = key => {
  let value = '';
  let isValueExists = localStorage.getItem(key);
  if (isValueExists) {
    value = JSON.parse(isValueExists);
  }
  return value;
};

const stringifyTableColumns = column => {
  let arr = [];
  if (Array.isArray(column)) {
    arr = column.map(col => ({
      ...col,
      render: col.render ? col.render.toString() : undefined,
    }));
  }
  return arr;
};

const mergeColumnWithPredefined = (col, renderExists) => {
  return {
    ...renderExists,
    visible: col.visible !== undefined ? col.visible : renderExists?.visible,
    ...(col.width != null && col.width !== '' ? { width: Number(col.width) } : {}),
  };
};

const parsedTableCoulmns = (column, preDefineColumns) => {
  let configData = {};
  if (Array.isArray(column?.columnList)) {
    configData.columnList = column?.columnList?.map(col => {
      let renderExists = preDefineColumns.find(c => c.key === col.key) || {};
      if (renderExists) {
        return mergeColumnWithPredefined(col, renderExists);
      }
      return col;
    });
  }

  let newColumns = preDefineColumns?.filter(x => {
    if (x.title === 'Action') return false;

    const exists = column?.columnList?.some(col => col.key === x.key);
    return !exists;
  });

  if (newColumns?.length > 0 && configData?.columnList) {
    configData.columnList = [...configData.columnList, ...newColumns];
  }

  if (Array.isArray(column?.customizedColumns)) {
    configData.customizedColumns = column?.customizedColumns?.map(col => {
      let renderExists = preDefineColumns.find(c => c.key === col.key) || {};
      if (renderExists) {
        return mergeColumnWithPredefined(col, renderExists);
      }
      return col;
    });
  }

  if (newColumns?.length > 0 && configData?.customizedColumns) {
    configData.customizedColumns = [...configData.customizedColumns, ...newColumns];
  }

  // Remove columns that are not present in predefined columns
  if (configData?.columnList) {
    configData.columnList = configData.columnList.filter(col => preDefineColumns.some(predefinedCol => predefinedCol.key === col.key));
  }

  if (configData?.customizedColumns) {
    configData.customizedColumns = configData.customizedColumns.filter(col => preDefineColumns.some(predefinedCol => predefinedCol.key === col.key));
  }

  // Check if last column is Action column
  const lastColumn = preDefineColumns[preDefineColumns.length - 1];
  const hasActionColumn = lastColumn?.title === 'Action';
  const columnsWithoutAction = hasActionColumn ? preDefineColumns.slice(0, -1) : preDefineColumns;

  let finalColumnList = configData?.columnList ? configData?.columnList : columnsWithoutAction;

  let finalDisplayedColumn = [...finalColumnList];
  // Add Action column at the end if it exists
  if (hasActionColumn) {
    finalDisplayedColumn.push(lastColumn);
  }

  let finalCustomizedColumns = configData?.customizedColumns;

  return {
    columnList: finalColumnList,
    displayColumn: finalDisplayedColumn,
    customizedColumn: finalCustomizedColumns,
  };
};

const getQueryParams = url => {
  const params = new URL(url).searchParams;
  const queryObject = {};

  for (const [key, value] of params.entries()) {
    queryObject[key] = value;
  }

  return queryObject;
};

const dateFormateForUi = (date, options) => {
  if (!date) return '';
  let formatedDate = '';
  if (dayjs(date).isValid()) {
    formatedDate = dayjs(date).format(options?.withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY');
  }
  return formatedDate;
};

const dateFormateForBackend = date => {
  if (!date) return '-';
  let formatedDate = '-';
  if (dayjs(date).isValid()) {
    formatedDate = dayjs(date).format('YYYY-MM-DD');
  }
  return formatedDate;
};

const calculateTotalAmountApplied = (items = []) =>
  items.reduce((total, item) => {
    const amount = parseFloat(item?.amountApplied);
    return !isNaN(amount) && amount > 0 ? total + amount : total;
  }, 0);

const transformPayload = obj => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const cleanedObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      const nested = transformPayload(value);
      if ((Array.isArray(nested) && nested.length > 0) || (typeof nested === 'object' && Object.keys(nested).length > 0)) {
        cleanedObj[key] = nested;
      }
    } else if (value !== '' && value !== null && value !== undefined) {
      cleanedObj[key] = value;
    }
  }

  return cleanedObj;
};

const filteredURLParams = (params, newParams) => {
  Object.entries(newParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });
  return params;
};

const normalizeStateForTaxComparison = state => {
  if (!state || typeof state !== 'string') return '';
  const trimmed = state.trim();
  const withoutLegacyCode = trimmed.replace(/^\[[A-Z]{2,5}\]\s*-\s*/i, '');
  return withoutLegacyCode.trim().toLowerCase();
};

const isIGSTExists = ({ myState = '', customerState = '', myGSTNo = '', customerGSTNo = '' }) => {
  let isIGST = false;

  if (myGSTNo && customerGSTNo) {
    if (myGSTNo?.substring(0, 2) !== customerGSTNo?.substring(0, 2)) {
      isIGST = true;
    } else {
      isIGST = false;
    }
  } else {
    if (myState && customerState) {
      const normalizedMyState = normalizeStateForTaxComparison(myState);
      const normalizedCustomerState = normalizeStateForTaxComparison(customerState);

      if (normalizedMyState && normalizedMyState === normalizedCustomerState) {
        isIGST = false;
      } else {
        isIGST = true;
      }
    } else {
      isIGST = false;
    }
  }

  return isIGST;
};

const buildTaxContext = (profile, party, addressState) => {
  const taxContext = {
    myState: profile?.address?.state || '',
    customerState: addressState || party?.address?.shipping?.state || party?.address?.billing?.state || party?.state || '',
    myGSTNo: profile?.gstNumber || '',
    customerGSTNo: party?.gstinUin || party?.otherDetails?.gstinUin || party?.otherDetails?.registeredBusinessValue || '',
  };
  return taxContext;
};

const calculationForChargesTaxTable = chargesArr => {
  let amount = 0;
  chargesArr?.forEach(item => {
    if (item?.isTaxable) {
      amount = amount + parseFloat(item?.amount || 0);
    }
  });
  let taxAmount = (amount * 18) / 100;

  return { hsnCode: '996511', amount, gst: 18, taxAmount };
};

const getGroupedHsnData = data => {
  const round2 = v => Math.round((Number(v) || 0) * 100) / 100;
  const txnDiscountValue = parseFloat(data?.discountConfig?.discountValue || 0);
  const isTxnAmountDiscount = data?.appliesTo === 'TRANSACTION' && txnDiscountValue > 0 && data?.discountConfig?.discountType === 'AMOUNT';

  const totalItemAmount = isTxnAmountDiscount ? data?.items?.reduce((sum, itm) => sum + round2(parseFloat(itm.quantity || 1) * parseFloat(itm.rate || 0)), 0) || 1 : 0;

  let allocatedDiscount = 0;

  const groupedData = data?.items?.reduce((acc, item, index) => {
    const hsnCode = item?.itemId?.hsnCode || item?.hsn || item?.hsnCode || 'N/A';

    if (!acc[hsnCode]) {
      acc[hsnCode] = {
        hsnCode,
        taxableValue: 0,
        gst: item.gst,
        taxAmount: 0,
        items: [],
      };
    }

    const quantity = parseFloat(item.quantity || 1);
    const rate = parseFloat(item.rate || 0);
    const gst = getGstNumericRate(item.gst);
    let amount = round2(quantity * rate);

    if (data?.appliesTo === 'ITEM' && !isNaN(item?.discountConfig?.discountValue) && item?.discountConfig?.discountValue > 0) {
      if (item?.discountConfig?.discountType === 'AMOUNT') {
        amount = round2(Math.max(0, amount - parseFloat(item?.discountConfig?.discountValue || 0)));
      } else {
        amount = round2(Math.max(0, amount - (amount * parseFloat(item?.discountConfig?.discountValue || 0)) / 100));
      }
    } else if (data?.appliesTo === 'TRANSACTION' && txnDiscountValue > 0) {
      if (data?.discountConfig?.discountType === 'AMOUNT') {
        let itemDiscount = 0;
        if (index === data.items.length - 1) {
          itemDiscount = round2(txnDiscountValue - allocatedDiscount);
        } else {
          itemDiscount = round2((amount / totalItemAmount) * txnDiscountValue);
          allocatedDiscount = round2(allocatedDiscount + itemDiscount);
        }
        amount = round2(Math.max(0, amount - itemDiscount));
      } else {
        const itemDiscount = round2((amount * txnDiscountValue) / 100);
        amount = round2(Math.max(0, amount - itemDiscount));
      }
    }

    const taxAmount = round2((gst / 100) * amount);

    acc[hsnCode].taxableValue += amount;
    acc[hsnCode].taxAmount += taxAmount;
    acc[hsnCode].items.push(item);

    return acc;
  }, {});

  return groupedData ? Object.values(groupedData) : [];
};

const calculateAmounts = (values, setFieldValue, discountConfig) => {
  const round2 = value => Math.round((Number(value) || 0) * 100) / 100;
  const isIGST = values?.taxContext ? isIGSTExists(values.taxContext) : false;
  const useCgstSgstSplit = !isIGST;

  const computeLineGst = (taxableAmount, gstRate) => {
    if (!gstRate || values.isSplit) return 0;

    if (useCgstSgstSplit) {
      const halfGst = gstRate / 2;
      const cgstAmount = round2((taxableAmount * halfGst) / 100);

      return round2(cgstAmount * 2);
    }

    return round2((taxableAmount * gstRate) / 100);
  };

  // Item-level calculation (Qty × Rate → Item Discount → GST)
  const updatedItems = values.items.map(item => {
    const quantity = parseFloat(item.quantity || 0);
    const rate = parseFloat(item.rate || 0);
    const gstRate = getGstNumericRate(item.gst);

    let amount = round2(quantity * rate);

    // Apply item-level discount before GST calculation
    if (discountConfig?.appliesTo === 'ITEM' && !isNaN(item?.discountValue) && item?.discountValue > 0) {
      if (item?.discountType === 'AMOUNT') {
        const discountAmount = parseFloat(item?.discountValue || 0);

        amount = round2(amount - discountAmount);
      } else {
        amount = round2(amount - (amount * parseFloat(item?.discountValue || 0)) / 100);
      }
    }

    // GST must be calculated on discounted amount
    const taxAmount = computeLineGst(amount, gstRate);

    return {
      ...item,
      taxAmount: taxAmount && !values.isSplit ? toDecimalString(taxAmount) : '0.00',
      amount: amount ? toDecimalString(amount) : '0.00',
    };
  });

  setFieldValue('items', updatedItems);

  // Subtotal = sum of item line amounts
  let subTotal = updatedItems.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

  // Initial GST from item-level tax amounts
  let gst = updatedItems.reduce((acc, item) => acc + parseFloat(item.taxAmount || 0), 0);

  let discountedSubTotal = subTotal;

  // Transaction-level discount calculation
  if (discountConfig?.appliesTo === 'TRANSACTION' && !isNaN(values?.discountValue) && values?.discountValue > 0) {
    const discountValue = parseFloat(values?.discountValue || 0);

    // GST must be recalculated because tax is applied after transaction discount
    let updatedGst = 0;
    discountedSubTotal = 0;

    const recalculatedItems = [...updatedItems];

    // Total item amount used to proportionally distribute fixed invoice discount
    const totalItemAmount = updatedItems.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

    let distributedDiscount = 0;

    recalculatedItems.forEach((item, index) => {
      const itemAmount = parseFloat(item.amount || 0);
      const gstRate = getGstNumericRate(item.gst);

      let taxableAmount = itemAmount;

      if (values?.discountType === 'AMOUNT') {
        // Fixed invoice discount is distributed proportionally across items.
        // Last item receives remaining discount to avoid rounding differences.
        let proportionalDiscount = 0;

        if (index === recalculatedItems.length - 1) {
          proportionalDiscount = round2(discountValue - distributedDiscount);
        } else {
          proportionalDiscount = totalItemAmount > 0 ? round2((itemAmount / totalItemAmount) * discountValue) : 0;

          distributedDiscount = round2(distributedDiscount + proportionalDiscount);
        }

        taxableAmount = itemAmount - proportionalDiscount;
      } else {
        const itemDiscount = round2((itemAmount * discountValue) / 100);

        taxableAmount = Math.max(0, itemAmount - itemDiscount);
      }

      discountedSubTotal += taxableAmount;

      const taxAmount = computeLineGst(taxableAmount, gstRate);

      updatedGst += taxAmount;

      // update taxAmount based on discounted value
      recalculatedItems[index] = {
        ...item,
        taxAmount: toDecimalString(taxAmount),
      };
    });

    gst = updatedGst;

    setFieldValue('items', recalculatedItems);
  }

  setFieldValue('subTotal', subTotal ? toDecimalString(parseFloat(subTotal)) : '0.00');

  let chargesTax = 0;
  let chargesTotal = 0;

  // Calculate GST for additional charges
  values?.additionalcharge?.forEach(item => {
    // Additional charge tax is independent from document-level discount
    if (item?.isTaxable && item?.amount) {
      const tax = (parseFloat(item?.amount || 0) * parseFloat(item?.taxRate || 0)) / 100;

      chargesTax += tax;
    }

    chargesTotal += parseFloat(item?.amount || 0);
  });

  // Total GST = Item GST + Additional Charge GST
  gst += chargesTax;
  gst = round2(gst);

  setFieldValue('totalTax', gst ? toDecimalString(gst) : '0.00');

  // TDS is on the amount before GST and is deducted; TCS is on the amount after GST and is added.
  let directTaxAmount = 0;
  const isTds = values?.tax?.type === 'TDS';
  if (values?.tax?.taxId && !values.isSplit) {
    const taxBase = isTds ? discountedSubTotal : discountedSubTotal + gst + chargesTotal;
    // The rate keeps the amount in step with the lines until the user types one; a saved document keeps its amount.
    if (values.tax.amount == null || values.isTaxAmountManual === false) {
      directTaxAmount = round2((taxBase * values.tax.rate) / 100);
      setFieldValue('tax', { ...values.tax, amount: directTaxAmount });
    } else {
      directTaxAmount = round2(Number(values.tax.amount) || 0);
    }
  }

  // Grand Total = discounted subtotal + GST + additional charges (per-line discount rounding matches backend)
  const totalAmount = discountedSubTotal + gst + chargesTotal + (isTds ? -directTaxAmount : directTaxAmount);

  const preciseTotal = round2(totalAmount);

  let roundOffAmount = 0;
  let totalRounded = preciseTotal;

  // Round off the total amount
  if (values?.isRoundOff) {
    const rounded = Math.round(preciseTotal);

    roundOffAmount = round2(rounded - preciseTotal);

    totalRounded = rounded;
  }

  setFieldValue('total', toDecimalString(totalRounded));
  setFieldValue('roundOffAmount', toDecimalString(roundOffAmount));
  setFieldValue('totalRounded', toDecimalString(totalRounded));

  return {
    items: updatedItems,
    subTotal,
    totalTax: gst,
    total: preciseTotal,
    roundOffAmount,
    totalRounded,
  };
};

const calculateRoundUpDiff = total => {
  let roundValue = Math.round(total);
  let diff = roundValue - total;

  return diff ? toDecimalString(diff) : '';
};

/**
 * Filters out empty values from an object
 * @param {Object} formData - The object containing form data
 * @param {boolean} includeNestedObjects - Whether to process nested objects (defaults to true)
 * @returns {Object} - A new object with only non-empty values
 */
const filterEmptyFields = (formData, includeNestedObjects = true) => {
  // Return empty object if formData is not an object or is null
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return {};
  }

  const filteredData = {};

  // Iterate through each key in the form data
  Object.keys(formData).forEach(key => {
    const value = formData[key];

    // Check if the value is a non-empty object (and not an array or null)
    if (includeNestedObjects && value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      // Process nested object recursively
      const nestedFiltered = filterEmptyFields(value, includeNestedObjects);

      // Only add the nested object if it has at least one property
      if (Object.keys(nestedFiltered).length > 0) {
        filteredData[key] = nestedFiltered;
      }
    }
    // Check if the value is non-empty
    else if (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      // Handle arrays - only include non-empty arrays
      !(Array.isArray(value) && value.length === 0)
    ) {
      filteredData[key] = value;
    }
  });

  return filteredData;
};

const CURRENT_DATE_PAYMENT_TERMS = ['Advance', 'After Dispatch', 'Due On Receipt'];

const calculateDueDate = paymentTerm => {
  const today = dayjs().format('YYYY-MM-DD');
  if (!paymentTerm || typeof paymentTerm !== 'object') return today;

  const name = paymentTerm.name;
  const days = Number(paymentTerm.days) || 0;

  if (CURRENT_DATE_PAYMENT_TERMS.includes(name)) {
    return today;
  }
  if (name === 'Due end of the month') {
    return dayjs().endOf('month').format('YYYY-MM-DD');
  }
  if (name === 'Due end of next month') {
    return dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD');
  }
  if (days > 0) {
    return dayjs().add(days, 'day').format('YYYY-MM-DD');
  }

  return today;
};

/**
 * Resolves the itemId from a pricelist item regardless of whether itemId is a
 * plain ObjectId string, a populated object with `.id`, or a Mongoose doc with `._id`.
 */
const getPriceListItemId = item => item?.itemId?.id || item?.itemId?._id || item?.itemId;

const calculatePriceListChange = (values, priceList, e, allItemDrop) => {
  const updatedItems = values?.items?.map(itm => {
    let findPriceList = priceList?.find(x => x?.id === e);

    const itemExistsInPriceList = findPriceList?.items?.find(item => String(getPriceListItemId(item) || '') === String(itm?.itemId || '')) || {};

    const selectedItem = (allItemDrop || []).find(item => item._id === itm?.itemId);
    const unit = resolveLineUnitSelection(itm, selectedItem);
    const listPrice = priceListNetPriceForUnit(itemExistsInPriceList, {
      itemUnitId: unit.itemUnitId,
      isBase: unit.option?.isBase !== false,
    });

    let updatedItemData = {
      ...itm,
      rate: listPrice != null && listPrice !== '' ? toDecimalString(parseFloat(listPrice)) : itm?.rate,
      itemName: selectedItem?.itemName || '',
      itemNo: selectedItem?.itemNo || '',
      hsnCode: selectedItem?.hsnCode || '',
      itemUnit: unit.itemUnit || getItemUnitName(itm),
      itemUnitId: unit.itemUnitId || null,
      gst: selectedItem?.gst || '0',
    };
    return updatedItemData;
  });

  return updatedItems;
};

const calculateSplitWise = (values, splitWiseType) => {
  let updatedItems = [];
  let finalItemArr = [];
  // Create deep copies of items to avoid mutating the original array
  let itemsArr = (values?.items || []).map(item => ({ ...item }));
  if (splitWiseType === 'Split By Qty') {
    itemsArr?.forEach(item => {
      if (item?.splitQty > 0) {
        const quantity = parseFloat(item?.splitQty);
        const rate = parseFloat(item.rate || 0);
        const amount = quantity * rate;

        // Split documents carry only the original item total amount — no tax is applied.
        const updatedItem = { ...item };
        delete updatedItem.discountValue;
        delete updatedItem.discountType;
        delete updatedItem.splitPercentage;

        updatedItems.push({
          ...updatedItem,
          taxAmount: 0,
          amount: amount ? toDecimalString(parseFloat(amount)) : 0,
          quantity,
        });
      }
    });

    finalItemArr = itemsArr?.map(item => {
      return {
        ...item,
      };
    });
  } else {
    itemsArr?.forEach(item => {
      if (item?.splitRate > 0) {
        const quantity = parseFloat(item?.quantity);
        const rate = parseFloat(item?.splitRate);
        const amount = quantity * rate;

        // Split documents carry only the original item total amount — no tax is applied.
        const updatedItem = { ...item };
        delete updatedItem.discountValue;
        delete updatedItem.discountType;
        delete updatedItem.splitPercentage;

        updatedItems.push({
          ...updatedItem,
          taxAmount: 0,
          amount: amount ? toDecimalString(parseFloat(amount)) : 0,
          rate,
        });
      }
    });

    finalItemArr = itemsArr?.map(item => {
      return {
        ...item,
      };
    });
  }

  const subTotal = updatedItems?.reduce((acc, item) => acc + parseFloat(item.amount || 0), 0);

  let gst = updatedItems?.reduce((acc, item) => acc + parseFloat(item.taxAmount || 0), 0);

  let chargesTax = 0,
    chargesTotal = 0;

  values?.additionalcharge?.forEach(item => {
    if (item?.isTaxable && item?.amount) {
      const tax = (parseFloat(item?.amount || 0) * parseFloat(item?.taxRate || 0)) / 100;
      chargesTax = chargesTax + tax;
    }
    chargesTotal = chargesTotal + parseFloat(item?.amount || 0);
  });

  gst = gst + chargesTax;

  // const totalAmount = subTotal + gst + chargesTotal;
  const totalAmount = subTotal;
  const round2 = value => Math.round((Number(value) || 0) * 100) / 100;
  const preciseTotal = round2(totalAmount);
  let roundOffAmount = 0;
  let total = preciseTotal;

  if (values?.isRoundOff) {
    const rounded = Math.round(preciseTotal);

    roundOffAmount = round2(rounded - preciseTotal);
    total = rounded;
  }

  return {
    splitWiseType: values?.splitWiseType,
    finalItemArr,
    updatedItems,
    subTotal,
    cgst: gst ? toDecimalString(parseFloat(gst) / 2) : 0,
    sgst: gst ? toDecimalString(parseFloat(gst) / 2) : 0,
    igst: gst ? toDecimalString(parseFloat(gst)) : 0,
    totalTax: gst ? toDecimalString(parseFloat(gst)) : 0,
    total: totalAmount ? total : 0,
    isRoundOff: !!values?.isRoundOff,
    roundOffAmount,
  };
};

const calculateSplitAmount = (item, splitWiseType) => {
  const quantity = parseFloat(splitWiseType === 'Split By Qty' ? item?.splitQty || 0 : item?.quantity);
  const rate = parseFloat(splitWiseType === 'Split By Qty' ? item.rate : item?.splitRate || 0);
  const amount = quantity * rate;

  return amount || 0;
};

const calculateItemRateForSplit = item => {
  const rate = Number(item?.rate || 0);

  return toDecimalString(rate ?? 0.0);
};

const calculateItemQty = items => {
  let qty = 0;

  items?.forEach(item => {
    qty = qty + parseFloat(item?.quantity || 0);
  });

  return toDecimalString(parseFloat(qty));
};

const calculatediscountedValue = (arr, discountType, discountValue) => {
  const round2 = value => Math.round((Number(value) || 0) * 100) / 100;
  let discount = 0;

  if (discountType === 'AMOUNT') {
    discount = parseFloat(discountValue || 0);
  } else {
    const pct = parseFloat(discountValue || 0);

    discount = arr?.reduce((acc, item) => {
      const itemAmount = parseFloat(item.amount || 0);

      return acc + round2((itemAmount * pct) / 100);
    }, 0);
  }

  return discount ? toDecimalString(parseFloat(-discount)) : '0.00';
};

const checkIsPurchaseModule = targetModule => {
  const purchaseModules = [pageTypes.EXPENSES, pageTypes.PURCHASE_ORDER, pageTypes.GRPO, pageTypes.BILLS, pageTypes.DEBIT_NOTE];
  return purchaseModules.includes(targetModule);
};

const getFontSizeFromText = text => {
  const nameLength = text.length;
  let letterSpacing, fontSize;

  if (nameLength <= 20) {
    letterSpacing = 'normal';
    fontSize = '14px';
  } else if (nameLength <= 35) {
    letterSpacing = '-0.3px';
    fontSize = '13px';
  } else if (nameLength <= 50) {
    letterSpacing = '-0.5px';
    fontSize = '12px';
  } else {
    letterSpacing = '-0.8px';
    fontSize = '11px';
  }

  return { letterSpacing, fontSize };
};

const getcolorforShortageQty = item => {
  let color = '';

  let diffQty = (item?.requiredQty * 15) / 100;

  if (item?.requiredQty > item?.availableStock) {
    color = 'redRow rm-analytics-row';
  } else if (item?.availableStock < item?.requiredQty + diffQty) {
    color = 'yellowRow rm-analytics-row';
  } else if (item?.availableStock > item?.requiredQty + diffQty) {
    color = 'greenRow rm-analytics-row';
  }
  return color;
};

const formatAverageDaysToPayment = value => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n) || n < 0) {
    return '';
  }
  return n;
};

export const isSplitDocumentUnavailable = (document, isSplitSessionActive) => Boolean(document?.isSplit && !isSplitSessionActive);

export const getExportColumns = columns => {
  return (columns || []).filter(col => col?.title && col?.title !== 'Action');
};

/**
 * Formats discount config for display in the change modal
 * @param {Object} config - { appliesTo, discountConfig?: { discountType, discountValue } }
 * @returns {string} Human-readable config description
 */
const formatDiscountConfigForDisplay = config => {
  if (!config?.appliesTo) return 'Not configured';
  const appliesToLabel = config.appliesTo === 'ITEM' ? 'Item Level' : 'Transaction Level';
  if (config.appliesTo === 'TRANSACTION' && config?.discountConfig?.discountValue != null) {
    const { discountType, discountValue } = config.discountConfig;
    const value = parseFloat(discountValue);
    if (!isNaN(value) && value > 0) {
      const suffix = discountType === 'PERCENTAGE' ? `${value}%` : `${formatAmount(value)}`;
      return `${appliesToLabel} (${suffix})`;
    }
  }
  return appliesToLabel;
};

export const roundQty = value => Math.round((Number(value) || 0) * 1000) / 1000;

export {
  setInLocalStorage,
  getFromLocalStorage,
  getQueryParams,
  dateFormateForUi,
  calculateTotalAmountApplied,
  stringifyTableColumns,
  parsedTableCoulmns,
  dateFormateForBackend,
  transformPayload,
  filteredURLParams,
  normalizeStateForTaxComparison,
  isIGSTExists,
  buildTaxContext,
  calculationForChargesTaxTable,
  getGroupedHsnData,
  calculateAmounts,
  calculateRoundUpDiff,
  filterEmptyFields,
  calculateDueDate,
  calculatePriceListChange,
  getPriceListItemId,
  calculateSplitWise,
  calculateSplitAmount,
  calculateItemRateForSplit,
  calculateItemQty,
  calculatediscountedValue,
  checkIsPurchaseModule,
  getFontSizeFromText,
  getcolorforShortageQty,
  formatAverageDaysToPayment,
  formatDiscountConfigForDisplay,
};
