import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getReports = withErrorHandling(async payload => {
  const {
    reportPath = '',
    customerId,
    reportDate = null,
    startDate = null,
    endDate = null,
    warehouse = null,
    branch = null,
    division = null,
    includeLinkedData = null,
    signal,
    isSplit = false,
    splitOnly = false,
  } = payload;

  const queryParams = new URLSearchParams({
    customerId: customerId,
  });
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (warehouse) {
    queryParams.append('warehouseId', warehouse);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  // Include includeLinkedData in URL only if it's true
  if (includeLinkedData === true || includeLinkedData === 'true') {
    queryParams.append('includeLinkedData', 'true');
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET(reportPath), config);
  return response.data;
}, 'getReports');

const getBankLedger = withErrorHandling(async payload => {
  const {
    accountId,
    reportDate = null,
    startDate = null,
    endDate = null,
    pagination = true,
    signal,
    division = '',
    branch = '',
    isSplit = false,
    page = null,
    limit = null,
    sortOrder = null,
  } = payload;

  const queryParams = new URLSearchParams({
    accountId: accountId,
    pagination: pagination,
  });

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (page) {
    queryParams.append('page', page);
  }
  if (limit) {
    queryParams.append('limit', limit);
  }
  if (sortOrder) {
    queryParams.append('sortOrder', sortOrder);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_BANK_LEDGER, config);
  return response.data;
}, 'getBankLedger');

const getPurchaseLedger = withErrorHandling(async payload => {
  const { FY, division, branch, signal, isSplit = false } = payload;

  const queryParams = new URLSearchParams();

  if (FY) {
    queryParams.append('FY', FY);
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PURCHASE_LEDGER, config);
  return response.data;
}, 'getPurchaseLedger');

const getPurchaseLedgerDetail = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate, endDate, division, branch, signal, isSplit, sortField = 'billDate', sortOrder = 'asc', pagination = true } = payload;

  const params = {
    pagination,
    startDate,
    endDate,
    sortField,
    sortOrder,
    ...(pagination ? { page, limit } : {}),
    ...(isSplit !== undefined ? { isSplit: isSplit ? 'true' : 'false' } : {}),
    ...(division ? { divisionId: division } : {}),
    ...(branch ? { branchId: branch } : {}),
  };

  let config = { params, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PURCHASE_LEDGER_DETAILS, config);
  return response.data;
}, 'getPurchaseLedgerDetail');

const getPurchaseLedgerDetailExport = withErrorHandling(async payload => {
  const { startDate, endDate, division, branch, signal, isSplit, sortField = 'billDate', sortOrder = 'asc' } = payload;

  const params = {
    pagination: false,
    startDate,
    endDate,
    sortField,
    sortOrder,
    ...(isSplit !== undefined ? { isSplit: isSplit ? 'true' : 'false' } : {}),
    ...(division ? { divisionId: division } : {}),
    ...(branch ? { branchId: branch } : {}),
  };

  let config = { params, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PURCHASE_LEDGER_DETAILS, config);
  return response.data;
}, 'getPurchaseLedgerDetailExport');

const getSalesLedger = withErrorHandling(async payload => {
  const { FY, division, branch, signal, isSplit = false } = payload;

  const queryParams = new URLSearchParams();

  if (FY) {
    queryParams.append('FY', FY);
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_SALES_LEDGER, config);
  return response.data;
}, 'getSalesLedger');

const getSalesLedgerDetail = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate, endDate, division, branch, signal, isSplit, sortField = 'invoiceDate', sortOrder = 'asc', pagination = true } = payload;

  const params = {
    pagination,
    startDate,
    endDate,
    sortField,
    sortOrder,
    ...(pagination ? { page, limit } : {}),
    ...(isSplit !== undefined ? { isSplit: isSplit ? 'true' : 'false' } : {}),
    ...(division ? { divisionId: division } : {}),
    ...(branch ? { branchId: branch } : {}),
  };

  let config = { params, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_SALES_LEDGER_DETAILS, config);
  return response.data;
}, 'getSalesLedgerDetail');

const getSalesLedgerDetailExport = withErrorHandling(async payload => {
  const { startDate, endDate, division, branch, signal, isSplit, sortField = 'invoiceDate', sortOrder = 'asc' } = payload;

  const params = {
    pagination: false,
    startDate,
    endDate,
    sortField,
    sortOrder,
    ...(isSplit !== undefined ? { isSplit: isSplit ? 'true' : 'false' } : {}),
    ...(division ? { divisionId: division } : {}),
    ...(branch ? { branchId: branch } : {}),
  };

  let config = { params, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_SALES_LEDGER_DETAILS, config);
  return response.data;
}, 'getSalesLedgerDetailExport');

const getCreditorsReport = withErrorHandling(async payload => {
  const { startDate, endDate, signal, isSplit = false, splitOnly = false, withZeroBalance = false, includeLinkedData = null, division = '', branch = '', column = '' } = payload;

  const queryParams = new URLSearchParams({
    withZeroBalance: withZeroBalance,
  });

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (column) {
    queryParams.append('column', column);
  }
  if (includeLinkedData === true || includeLinkedData === 'true') {
    queryParams.append('includeLinkedData', 'true');
  }

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_CREDITORS_REPORTS, config);
  return response.data;
}, 'getCreditorsReport');

const getDebtorsReport = withErrorHandling(async payload => {
  const { startDate, endDate, signal, isSplit = false, splitOnly = false, withZeroBalance = false, includeLinkedData = null, division = '', branch = '', column = '' } = payload;

  const queryParams = new URLSearchParams({
    withZeroBalance: withZeroBalance,
  });

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (column) {
    queryParams.append('column', column);
  }
  if (includeLinkedData === true || includeLinkedData === 'true') {
    queryParams.append('includeLinkedData', 'true');
  }

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_DEBTORS_REPORTS, config);
  return response.data;
}, 'getDebtorsReport');

const getProfitAndLose = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, reportDate = null, startDate = null, endDate = null, branch = null, division = null, signal, search = '' } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (search) {
    queryParams.append('search', search);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS, config);
  return response.data;
}, 'getProfitAndLose');

const getCustomerProfitAndLose = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    reportDate = null,
    startDate = null,
    endDate = null,
    branch = null,
    customerId = null,
    // division = null,
    signal,
  } = payload;

  const queryParams = new URLSearchParams({
    customerId: customerId,
    page: page,
    limit: limit,
  });

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  // if (division) {
  //   queryParams.append("divisionId", division);
  // }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_CUSTOMER_PROFIT_LOSS, config);
  return response.data;
}, 'getCustomerProfitAndLose');

const getProfitAndLoseItemWise = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, reportDate = null, startDate = null, endDate = null, branch = null, itemGroup = null, itemType = null, division = null, signal, search = '' } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (itemGroup) {
    queryParams.append('itemGroup', itemGroup);
  }
  if (itemType) {
    queryParams.append('itemType', itemType);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_ITEM, config);
  return response.data;
}, 'getProfitAndLoseItemWise');

const getProfitAndLoseItemWiseDetails = withErrorHandling(async payload => {
  const {
    reportDate = null,
    startDate = null,
    endDate = null,
    branch = null,
    itemId = null,
    // division = null,
    signal,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
  } = payload;

  const queryParams = new URLSearchParams({
    itemId: itemId,
    page: page,
    limit: limit,
  });

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_ITEM_DETAILS, config);
  return response.data;
}, 'getProfitAndLoseItemWiseDetails');

const getProfitAndLoseCustomerMonthWise = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, reportDate = null, startDate = null, endDate = null, branch = null, division = null, signal, search = '' } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (reportDate) {
    queryParams.append('reportDate', reportDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_CUSTOMER_MONTHWISE, config);
  return response.data;
}, 'getProfitAndLoseCustomerMonthWise');

const getProfitAndLossBatchItemDetails = withErrorHandling(async payload => {
  const { itemId, documentId, signal } = payload;

  const queryParams = new URLSearchParams({
    itemId: itemId,
    documentId: documentId,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_BATCH_ITEM_DETAILS, config);
  return response.data;
}, 'getProfitAndLossBatchItemDetails');

const getProfitAndLossBatchCustomerDetails = withErrorHandling(async payload => {
  const { documentId, signal } = payload;

  const queryParams = new URLSearchParams({
    documentId: documentId,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_BATCH_CUSTOMER_DETAILS, config);
  return response.data;
}, 'getProfitAndLossBatchCustomerDetails');

const getProfitAndLossByProductionOrder = withErrorHandling(async payload => {
  const { productionOrderId, signal } = payload;

  const queryParams = new URLSearchParams({
    productionOrderId: productionOrderId,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_PRODUCTION_ORDER, config);
  return response.data;
}, 'getProfitAndLossByProductionOrder');

const getProfitAndLossByProductionOrderDetails = async productionOrderData => {
  const response = await axiosConfig.post(API_ROUTES.REPORT.GET_PROFIT_LOSS_PRODUCTION_DETAILS, productionOrderData);
  return response.data;
};

const getItemAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, item = null, startDate = null, endDate = null, branch = null, division = null, signal, search = '' } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (item) {
    queryParams.append('itemId', item);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_ITEM_ANALYTICS, config);
  return response.data;
}, 'getItemAnalytics');

const getBalanceSheet = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, branch = null, division = null, category = null, signal } = payload;

  const queryParams = new URLSearchParams({});

  if (startDate) {
    queryParams.append('startDate', startDate);
  }
  if (endDate) {
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (category) {
    queryParams.append('category', category);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(`reports/balance-sheet`, config);
  return response.data;
}, 'getBalanceSheet');

const getUpcomingPayments = withErrorHandling(async payload => {
  const { branchId = null, startDate, endDate, numberOfColumns, columnType, duration, customerIds = null, vendorIds = null, sortBy = null, signal } = payload;

  const queryParams = new URLSearchParams({
    startDate: startDate,
    endDate: endDate,
    numberOfColumns: numberOfColumns,
    columnType: columnType,
    duration: duration,
  });

  // Handle optional branchId (can be string or array - send as comma-separated string)
  // Only send if it has valid non-empty values - NEVER send empty strings
  if (branchId !== null && branchId !== undefined && branchId !== '') {
    if (Array.isArray(branchId)) {
      const validIds = branchId.filter(id => {
        if (!id) return false;
        const strId = String(id).trim();
        return strId.length > 0 && strId.match(/^[0-9a-fA-F]{24}$/);
      });
      if (validIds.length > 0) {
        queryParams.append('branchId', validIds.join(','));
      }
    } else if (typeof branchId === 'string') {
      const trimmed = branchId.trim();
      // Validate it's a valid ObjectId or comma-separated ObjectIds
      if (trimmed.length > 0) {
        const ids = trimmed
          .split(',')
          .map(id => id.trim())
          .filter(Boolean);
        const validIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
        if (validIds.length > 0) {
          queryParams.append('branchId', validIds.join(','));
        }
      }
    }
  }

  // Handle optional customerIds (can be string or array - send as comma-separated string)
  // Only send if it has valid non-empty values - NEVER send empty strings
  if (customerIds !== null && customerIds !== undefined && customerIds !== '') {
    if (Array.isArray(customerIds)) {
      const validIds = customerIds.filter(id => {
        if (!id) return false;
        const strId = String(id).trim();
        return strId.length > 0 && strId.match(/^[0-9a-fA-F]{24}$/);
      });
      if (validIds.length > 0) {
        queryParams.append('customerIds', validIds.join(','));
      }
    } else if (typeof customerIds === 'string') {
      const trimmed = customerIds.trim();
      if (trimmed.length > 0) {
        const ids = trimmed
          .split(',')
          .map(id => id.trim())
          .filter(Boolean);
        const validIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
        if (validIds.length > 0) {
          queryParams.append('customerIds', validIds.join(','));
        }
      }
    }
  }

  // Handle optional vendorIds (can be string or array - send as comma-separated string)
  // Only send if it has valid non-empty values - NEVER send empty strings
  if (vendorIds !== null && vendorIds !== undefined && vendorIds !== '') {
    if (Array.isArray(vendorIds)) {
      const validIds = vendorIds.filter(id => {
        if (!id) return false;
        const strId = String(id).trim();
        return strId.length > 0 && strId.match(/^[0-9a-fA-F]{24}$/);
      });
      if (validIds.length > 0) {
        queryParams.append('vendorIds', validIds.join(','));
      }
    } else if (typeof vendorIds === 'string') {
      const trimmed = vendorIds.trim();
      if (trimmed.length > 0) {
        const ids = trimmed
          .split(',')
          .map(id => id.trim())
          .filter(Boolean);
        const validIds = ids.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
        if (validIds.length > 0) {
          queryParams.append('vendorIds', validIds.join(','));
        }
      }
    }
  }

  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_UPCOMING_PAYMENTS, config);
  return response.data;
}, 'getUpcomingPayments');

const getAgingReport = withErrorHandling(async payload => {
  const { type, startDate, endDate, numberOfColumns, columnType, duration, entityIds = null, signal } = payload;

  const queryParams = new URLSearchParams({
    type: type,
    startDate: startDate,
    endDate: endDate,
    numberOfColumns: numberOfColumns,
    columnType: columnType,
    duration: duration,
  });

  if (entityIds) {
    if (Array.isArray(entityIds)) {
      // Only add non-empty arrays
      if (entityIds.length > 0) {
        entityIds.forEach(id => {
          // Convert to string and check if valid
          const idStr = String(id || '').trim();
          if (idStr) {
            queryParams.append('entityIds', idStr);
          }
        });
      }
    } else if (typeof entityIds === 'string' && entityIds.trim()) {
      queryParams.append('entityIds', entityIds.trim());
    } else {
      // Handle single value (non-array)
      const idStr = String(entityIds || '').trim();
      if (idStr) {
        queryParams.append('entityIds', idStr);
      }
    }
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_AGING_REPORT, config);
  return response.data;
}, 'getAgingReport');

const getCustomerAging = withErrorHandling(async payload => {
  const { startDate, endDate, numberOfColumns, columnType, duration, customerIds = null, divisionId = null, branchId = null, sortBy = null, isSplit = false, splitOnly = false, signal } = payload;

  const queryParams = new URLSearchParams({
    numberOfColumns: numberOfColumns,
    columnType: columnType,
    duration: duration,
  });
  if (startDate != null && startDate !== '') {
    queryParams.append('startDate', startDate);
  }
  if (endDate != null && endDate !== '') {
    queryParams.append('endDate', endDate);
  }

  // Send customerIds as comma-separated string
  if (customerIds) {
    if (Array.isArray(customerIds)) {
      if (customerIds.length > 0) {
        const validIds = customerIds.map(id => String(id || '').trim()).filter(id => id);
        if (validIds.length > 0) {
          queryParams.append('customerIds', validIds.join(','));
        }
      }
    } else if (typeof customerIds === 'string' && customerIds.trim()) {
      queryParams.append('customerIds', customerIds.trim());
    }
  }

  // Send divisionId as comma-separated string
  if (divisionId) {
    if (Array.isArray(divisionId)) {
      if (divisionId.length > 0) {
        const validIds = divisionId.map(id => String(id || '').trim()).filter(id => id);
        if (validIds.length > 0) {
          queryParams.append('divisionId', validIds.join(','));
        }
      }
    } else if (typeof divisionId === 'string' && divisionId.trim()) {
      queryParams.append('divisionId', divisionId.trim());
    }
  }

  // Send branchId as comma-separated string
  if (branchId) {
    if (Array.isArray(branchId)) {
      if (branchId.length > 0) {
        const validIds = branchId.map(id => String(id || '').trim()).filter(id => id);
        if (validIds.length > 0) {
          queryParams.append('branchId', validIds.join(','));
        }
      }
    } else if (typeof branchId === 'string' && branchId.trim()) {
      queryParams.append('branchId', branchId.trim());
    }
  }

  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_CUSTOMER_AGING, config);
  return response.data;
}, 'getCustomerAging');

const getVendorAging = withErrorHandling(async payload => {
  const { startDate, endDate, numberOfColumns, columnType, duration, vendorIds = null, divisionId = null, branchId = null, sortBy = null, isSplit = false, splitOnly = false, signal } = payload;

  const queryParams = new URLSearchParams({
    numberOfColumns: numberOfColumns,
    columnType: columnType,
    duration: duration,
  });
  if (startDate != null && startDate !== '') {
    queryParams.append('startDate', startDate);
  }
  if (endDate != null && endDate !== '') {
    queryParams.append('endDate', endDate);
  }

  if (vendorIds) {
    if (Array.isArray(vendorIds)) {
      if (vendorIds.length > 0) {
        queryParams.append('vendorIds', vendorIds.join(',')); // Join array into comma-separated string
      }
    } else if (typeof vendorIds === 'string' && vendorIds.trim()) {
      queryParams.append('vendorIds', vendorIds.trim());
    }
  }

  if (divisionId) {
    if (Array.isArray(divisionId)) {
      if (divisionId.length > 0) {
        queryParams.append('divisionId', divisionId.join(',')); // Join array into comma-separated string
      }
    } else if (typeof divisionId === 'string' && divisionId.trim()) {
      queryParams.append('divisionId', divisionId.trim());
    }
  }

  if (branchId) {
    if (Array.isArray(branchId)) {
      if (branchId.length > 0) {
        queryParams.append('branchId', branchId.join(',')); // Join array into comma-separated string
      }
    } else if (typeof branchId === 'string' && branchId.trim()) {
      queryParams.append('branchId', branchId.trim());
    }
  }

  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_VENDOR_AGING, config);
  return response.data;
}, 'getVendorAging');

const getCustomerAgingDetails = withErrorHandling(async payload => {
  const { customerId, startDate, endDate, signal } = payload;

  const queryParams = new URLSearchParams({
    startDate: startDate,
    endDate: endDate,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_CUSTOMER_AGING_DETAILS_BY_ID(customerId), config);
  return response.data;
}, 'getCustomerAgingDetails');

const getVendorAgingDetails = withErrorHandling(async payload => {
  const { vendorId, startDate, endDate, signal } = payload;

  const queryParams = new URLSearchParams({
    startDate: startDate,
    endDate: endDate,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_VENDOR_AGING_DETAILS_BY_ID(vendorId), config);
  return response.data;
}, 'getVendorAgingDetails');

const getCustomerAgingBucket = withErrorHandling(async payload => {
  const { startDate, endDate, minDays, maxDays, customerIds = null, branchId = null, isSplit = false, splitOnly = false, signal } = payload;

  const queryParams = new URLSearchParams({
    minDays: minDays,
  });
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  if (maxDays !== null && maxDays !== undefined) {
    queryParams.append('maxDays', maxDays);
  }

  if (customerIds) {
    if (Array.isArray(customerIds)) {
      if (customerIds.length > 0) {
        queryParams.append('customerIds', customerIds.join(',')); // Join array into comma-separated string
      }
    } else if (typeof customerIds === 'string' && customerIds.trim()) {
      queryParams.append('customerIds', customerIds.trim());
    }
  }

  if (branchId) {
    if (Array.isArray(branchId)) {
      if (branchId.length > 0) {
        queryParams.append('branchId', branchId.join(','));
      }
    } else if (typeof branchId === 'string' && branchId.trim()) {
      queryParams.append('branchId', branchId.trim());
    }
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_CUSTOMER_AGING_BUCKET, config);
  return response.data;
}, 'getCustomerAgingBucket');

const getVendorAgingBucket = withErrorHandling(async payload => {
  const { startDate, endDate, minDays, maxDays, vendorIds = null, branchId = null, isSplit = false, splitOnly = false, signal } = payload;

  const queryParams = new URLSearchParams({
    minDays: minDays,
  });
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);

  if (maxDays !== null && maxDays !== undefined) {
    queryParams.append('maxDays', maxDays);
  }

  if (vendorIds) {
    if (Array.isArray(vendorIds)) {
      if (vendorIds.length > 0) {
        queryParams.append('vendorIds', vendorIds.join(',')); // Join array into comma-separated string
      }
    } else if (typeof vendorIds === 'string' && vendorIds.trim()) {
      queryParams.append('vendorIds', vendorIds.trim());
    }
  }

  if (branchId) {
    if (Array.isArray(branchId)) {
      if (branchId.length > 0) {
        queryParams.append('branchId', branchId.join(','));
      }
    } else if (typeof branchId === 'string' && branchId.trim()) {
      queryParams.append('branchId', branchId.trim());
    }
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_VENDOR_AGING_BUCKET, config);
  return response.data;
}, 'getVendorAgingBucket');

const getProfitLossSheet = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, signal } = payload;

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REPORT.GET_PROFIT_LOSS_SHEET, config);
  return response.data;
}, 'getProfitLossSheet');

export const reportService = {
  getReports,
  getBankLedger,
  getPurchaseLedger,
  getPurchaseLedgerDetail,
  getPurchaseLedgerDetailExport,
  getSalesLedger,
  getSalesLedgerDetail,
  getSalesLedgerDetailExport,
  getCreditorsReport,
  getDebtorsReport,
  getProfitAndLose,
  getCustomerProfitAndLose,
  getProfitAndLoseItemWise,
  getProfitAndLoseItemWiseDetails,
  getProfitAndLoseCustomerMonthWise,
  getProfitAndLossBatchItemDetails,
  getProfitAndLossBatchCustomerDetails,
  getProfitAndLossByProductionOrder,
  getProfitAndLossByProductionOrderDetails,
  getItemAnalytics,
  getProfitLossSheet,
  getUpcomingPayments,
  getAgingReport,
  getCustomerAging,
  getVendorAging,
  getCustomerAgingDetails,
  getVendorAgingDetails,
  getCustomerAgingBucket,
  getVendorAgingBucket,
  getBalanceSheet,
};
