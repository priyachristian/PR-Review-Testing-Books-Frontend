import '@/utils/util';
import { PAYMENT_MODE_OPTIONS } from '@/utils/constants';
import * as Yup from 'yup';

export {
  itemMasterValidateSchema,
  salesDataValidateSchema,
  purchasingDataValidateSchema,
  addDropdownValidateSchema,
  addGroupDropdownValidateSchema,
  productionDataValidateSchema,
  itemAttechmentValidateSchema,
  inventoryDataValidateSchema,
} from '@/features/allMaster/item/item.schema';

export { qualityValidateSchema, testTypeDetailValidateSchema } from '@/features/allMaster/qualityMaster/quality.schema';

export const inviteUserValidateSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  roleId: Yup.string().required('Role is required'),
});

export const convertProductionValidateSchema = Yup.object({
  itemId: Yup.string().required('Please select an item'),
  fromDivisionId: Yup.string().required('Please select the source division'),
  fromBranchId: Yup.string().required('Please select the source branch'),
  fromWarehouseId: Yup.string().required('Please select the source warehouse'),
  itemUnitId: Yup.string().required('Please select an item unit'),
  date: Yup.string().required('Please select a date'),
  toDivisionId: Yup.string().required('Please select the destination division'),
  toBranchId: Yup.string().required('Please select the destination branch'),
  toWarehouseId: Yup.string().required('Please select the destination warehouse'),
  quantity: Yup.number()
    .typeError('Please enter a valid quantity')
    .required('Quantity is required')
    .positive('Quantity must be greater than 0')
    .max(Yup.ref('fromQuantity'), 'Quantity cannot be more than the available stock'),
});

export const accountModalValidateSchema = Yup.object().shape({
  category: Yup.string().required('Category is required'),
  accountName: Yup.string().trim().required('Account Name is required'),
  accountCode: Yup.string().trim().nullable(),
  isActive: Yup.boolean(),
  isSubAccount: Yup.boolean(),
  parentAccountId: Yup.string()
    .nullable()
    .when('isSubAccount', {
      is: true,
      then: s => s.required('Parent account is required'),
      otherwise: s => s.nullable(),
    }),
  openingBalanceAmount: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .typeError('Opening Balance must be a number')
    .positive('Opening Balance must be greater than zero'),
  balanceType: Yup.string()
    .nullable()
    .when('openingBalanceAmount', {
      is: value => value != null,
      then: s => s.required('Balance Type is required'),
    }),
  openingBalanceDate: Yup.string()
    .nullable()
    .when('openingBalanceAmount', {
      is: value => value != null,
      then: s => s.required('Opening Balance Date is required'),
    }),
});

export const creditApplySchema = Yup.object({
  invoiceItems: Yup.array().of(
    Yup.object({
      balanceAmount: Yup.number(),
      amountApplied: Yup.number()
        .transform((value, originalValue) => (originalValue === '' || originalValue == null ? 0 : value))
        .typeError('Amount must be a number')
        .min(0, 'Amount cannot be negative')
        .test('amount-not-greater-than-balance', 'Exceeds balance', function (value) {
          const { balanceAmount } = this.parent;
          if (value == null || value === 0) return true;
          if (balanceAmount == null || Number.isNaN(Number(balanceAmount))) return true;
          return value <= balanceAmount;
        }),
    })
  ),
});

export const refundPaymentSchema = Yup.object({
  refundedAt: Yup.string().required('Select refund date'),
  amountRefunded: Yup.number()
    .transform((v, orig) => (orig === '' || orig == null ? undefined : v))
    .typeError('Please enter a valid amount')
    .required('Enter refund amount')
    .moreThan(0, 'Amount must be greater than 0'),
  paymentMode: Yup.string()
    .required('Select payment mode')
    .oneOf(
      PAYMENT_MODE_OPTIONS.map(option => option.value),
      'Select a valid payment mode'
    ),
  accountId: Yup.string().required('Select account'),
  description: Yup.string().required('Reason is required'),
});

export const chargesValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  modules: Yup.array().min(1, 'Modules is required'),
});

export const convertToSelectionValidateSchema = Yup.object({
  items: Yup.array().of(
    Yup.object({
      quantity: Yup.number().typeError('Quantity must be a number').required('Quantity is required'),
      // .test("max-remaining-qty", "Qty not avialable", function (value) {
      //   const { remainingQuantity } = this.parent;
      //   if (value == null || remainingQuantity == null) return true;
      //   return value <= remainingQuantity;
      // }),
      // remainingQuantity: Yup.number().required("Remaining quantity is required"),
    })
  ),
});

export const branchConfigValidateSchema = Yup.object({
  splitConfig: Yup.boolean().required('Split Configuration is required'),
  divisionId: Yup.string().when('splitConfig', {
    is: true,
    then: schema => schema.required('Division is required'),
    otherwise: schema => schema.notRequired(),
  }),
  branchId: Yup.string().when('splitConfig', {
    is: true,
    then: schema => schema.required('Branch is required'),
    otherwise: schema => schema.notRequired(),
  }),
  warehouseId: Yup.string().when('splitConfig', {
    is: true,
    then: schema => schema.required('Warehouse is required'),
    otherwise: schema => schema.notRequired(),
  }),
});

export const sessionConfigValidateSchema = Yup.object({
  pinNo: Yup.string().required('Session PIN is required').length(4, 'PIN must be exactly 4 digits'),
});

export const warehouseConfigValidateSchema = Yup.object({
  divisionId: Yup.string().required('Division is required'),
  branchId: Yup.string().required('Branch is required'),
  warehouseId: Yup.string().required('Warehouse is required'),
});

export const discountValidationSchema = Yup.object({
  isEnabled: Yup.boolean(),
  appliesTo: Yup.string().when('isEnabled', {
    is: true,
    then: schema => schema.required('Discount Applies On is required'),
    otherwise: schema => schema.notRequired(),
  }),
});

export const addAddressValidateSchema = Yup.object({
  country: Yup.string().required('Please select the country'),
  address: Yup.object({
    street1: Yup.string().required('Please enter street address line 1'),
  }),
  city: Yup.string().required('Please enter the city'),
  state: Yup.string().required('Please select the state'),
  pinCode: Yup.string().matches(/^\d+$/, 'Only contain digits').required('Please enter the pin code'),
  faxNumber: Yup.string().matches(/^\d+$/, 'Only contain digits').nullable(),
  phone: Yup.string()
    .matches(/^\d+$/, 'Phone number can only contain digits')
    // .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .nullable(),
});

export const refundValidateSchema = Yup.object().shape({
  refundAmount: Yup.number()
    .required('Refund amount is required')
    .min(0.01, 'Refund amount must be greater than 0')
    .test('max-amount', 'Refund amount cannot exceed available balance', function (value) {
      const { parent } = this;
      return value <= (parent.availableBalance || 0);
    }),
  refundDate: Yup.date().required('Refund date is required'),
  accountId: Yup.string().required('Account is required'),
  reference: Yup.string(),
  notes: Yup.string(),
});

export const updateUserStatusAndRoleValidateSchema = Yup.object().shape({
  firstName: Yup.string().required('First Name is required'),
  lastName: Yup.string().required('Last Name is required'),
  status: Yup.string(),
  roleId: Yup.string(),
});
