import { toDecimalNumber } from '@/utils/currency';
import * as Yup from 'yup';

const netPriceSchema = () =>
  Yup.number()
    .required('Please enter the net price')
    .transform(value => (isNaN(value) ? undefined : toDecimalNumber(parseFloat(value))));

export const priceListValidateSchema = autoGenerate =>
  Yup.object({
    priceListCode: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the price list code'),
    priceListName: Yup.string().trim().required('Please enter the price list name'),
    remarks: Yup.string().required('Please enter the remarks'),
    currency: Yup.string().required('Please select a currency'),
    items: Yup.array().of(
      Yup.object().shape({
        itemGroup: Yup.string().required('Please select an item group'),
        itemId: Yup.string().required('Please select an item'),
        itemUnitId: Yup.string().nullable().required('Item unit is required'),
        netPrice: netPriceSchema(),
        conversions: Yup.array().of(
          Yup.object().shape({
            itemUnitId: Yup.string().nullable().required('Item unit is required'),
            netPrice: netPriceSchema(),
          })
        ),
      })
    ),
  });
