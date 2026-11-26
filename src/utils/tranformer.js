import { toDecimalString } from './currency';
import { calculateSplitWise, isIGSTExists } from './services';
import { trimItemRows } from './util';

export const baseTransformer = (values, isSplitWise, discountConfig) => {
  let itemArr = trimItemRows(values?.items || []).map(item => ({ ...item }));
  let payload = null;

  if (isSplitWise) {
    let splitWiseObj = calculateSplitWise({ ...values, items: itemArr }, values?.splitWiseType);

    if (splitWiseObj?.updatedItems?.length > 0) {
      payload = {
        splitWiseType: splitWiseObj?.splitWiseType,
        items: splitWiseObj?.updatedItems,
        subTotal: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        total: splitWiseObj?.total,
        isRoundOff: values?.isRoundOff,
        roundOffAmount: splitWiseObj?.roundOffAmount ?? values?.roundOffAmount ?? 0,
      };
    }

    itemArr = itemArr?.map(item => {
      delete item?.splitPercentage;
      return {
        ...item,
      };
    });
  }

  if (discountConfig?.appliesTo === 'ITEM') {
    itemArr = itemArr?.map(item => {
      let discountConfig = {
        discountValue: item?.discountValue || 0,
        discountType: item?.discountType || 'PERCENTAGE',
      };

      delete item?.discountValue;
      delete item?.discountType;

      return {
        ...item,
        discountConfig,
      };
    });
  }

  const isIGST = values?.taxContext ? isIGSTExists(values.taxContext) : false;
  const totalTax = parseFloat(values.totalTax || 0);
  const tax = totalTax ? toDecimalString(totalTax) : '0.00';
  const half = totalTax ? toDecimalString(totalTax / 2) : '0.00';

  return {
    items: itemArr,
    subTotal: values.subTotal,
    sgst: isIGST ? '0.00' : half,
    cgst: isIGST ? '0.00' : half,
    igst: isIGST ? tax : '0.00',
    totalTax: values.totalTax,
    total: values.total,
    isRoundOff: values?.isRoundOff,
    roundOffAmount: values?.roundOffAmount,
    divisionId: values?.divisionId,
    branchId: values?.branchId,
    warehouseId: values?.warehouseId,
    additionalCharges: values?.additionalcharge?.filter(item => Number(item?.amount) !== 0),
    appliesTo: typeof values?.appliesTo === 'string' ? values?.appliesTo : values?.appliesTo?.appliesTo,
    ...(isSplitWise && payload && { split: payload }),
  };
};
