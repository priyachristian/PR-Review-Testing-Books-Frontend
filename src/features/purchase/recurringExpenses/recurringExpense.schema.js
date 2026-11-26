import * as Yup from 'yup';

export const recurringExpenseValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select the division'),
    branchId: Yup.string().required('Please select the branch'),
    warehouseId: Yup.string().required('Please select the warehouse'),
    customer: Yup.string().optional().nullable(),
    recurringExpenseId: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the recurring expense'),
    expenseAccount: Yup.string().required('Please select the expense account'),
    period: Yup.string().required('Please select how often this expense should repeat'),
    frequency: Yup.number().typeError('Please enter a valid frequency').integer('Frequency must be a whole number').min(1, 'Frequency must be at least 1').required('Please enter the frequency'),
    neverExpires: Yup.boolean(),
    startDate: Yup.string().required('Please select the start date'),
    endDate: Yup.string()
      .when('neverExpires', {
        is: false,
        then: schema => schema.required('Please select the end date'),
        otherwise: schema => schema.notRequired(),
      })
      .test('after-start-date', 'End date must be after the start date', function (value) {
        const { startDate } = this.parent;
        if (!value || !startDate) return true;
        return new Date(value) >= new Date(startDate);
      }),
    paidThroughAccountId: Yup.string().required('Please select how the payment was made'),
    amount: Yup.number().typeError('Please enter a valid amount').positive('Amount must be greater than zero').required('Please enter the amount'),
  });
};
