import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import dayjs from 'dayjs';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { accountModalValidateSchema } from '@/utils/validationsSchema';
import { BALANCE_TYPE_OPTIONS } from '@/utils/dropdownEnums';

const AddAccountModel = ({ showModal, setModalOpen, modalOpen1, setModalOpen1, getList, editAccount = null }) => {
  const navigate = useNavigate();
  const open = showModal ?? modalOpen1;
  const { categories, accountDrop, getAccountCategories, getAccounts, createAccount, updateAccount, submitLoading } = useChartOfAccounts();
  const isEdit = Boolean(editAccount);
  const isSystemEdit = isEdit && editAccount?.isSystemAccount;
  const accountId = editAccount?.id || editAccount?._id;

  const closeModal = () => {
    if (setModalOpen) setModalOpen(false);
    else if (setModalOpen1) setModalOpen1(false);
  };

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getAccountCategories({ signal: controller.signal });
    if (editAccount?.category) getAccounts({ signal: controller.signal, type: 'PARENT_ACCOUNT', category: editAccount.category, excludeAccountId: accountId });
    return () => controller.abort();
  }, [open, accountId, editAccount?.category, getAccountCategories, getAccounts]);

  const categoryOptions = useMemo(() => {
    const groups = {};
    for (const c of categories || []) {
      if (isEdit && c.managedIn === 'BANKING') continue;
      if (!groups[c.accountType]) groups[c.accountType] = [];
      groups[c.accountType].push({ label: c.displayName, title: c.displayName, value: c.code });
    }
    return Object.entries(groups).map(([label, options]) => ({ label, title: label, options }));
  }, [categories, isEdit]);

  const initialValues = useMemo(
    () => ({
      category: editAccount?.category || null,
      accountName: editAccount?.accountName || '',
      accountCode: editAccount?.accountCode || '',
      isActive: editAccount?.isActive !== false,
      isSubAccount: Boolean(editAccount?.parentAccountId),
      parentAccountId: editAccount?.parentAccountId || null,
      openingBalanceAmount: editAccount?.openingBalance?.amount ?? '',
      balanceType: editAccount?.openingBalance?.balanceType || BALANCE_TYPE_OPTIONS[0].value,
      openingBalanceDate: editAccount?.openingBalance?.openingBalanceDate ? dayjs(editAccount.openingBalance.openingBalanceDate) : null,
    }),
    [editAccount]
  );

  if (isEdit && editAccount?.managedIn === 'BANKING') return null;

  const onFinish = async values => {
    if (submitLoading) return;

    const category = categories.find(c => c.code === values.category);
    const parentAccountId = values.isSubAccount ? values.parentAccountId || null : null;
    const openingBalance =
      category?.openingBalanceIn === 'COA' && values.openingBalanceAmount
        ? { amount: Number(values.openingBalanceAmount), balanceType: values.balanceType, openingBalanceDate: values.openingBalanceDate ? dayjs(values.openingBalanceDate).format('YYYY-MM-DD') : null }
        : category?.openingBalanceIn === 'COA'
          ? null
          : undefined;

    try {
      if (isEdit) {
        await updateAccount({
          accountId,
          accountData: {
            ...(!isSystemEdit && { category: values.category, isActive: values.isActive, parentAccountId }),
            accountName: values.accountName,
            accountCode: values.accountCode || null,
            ...(openingBalance !== undefined && { openingBalance }),
          },
        });
      } else {
        await createAccount({
          category: values.category,
          accountName: values.accountName,
          accountCode: values.accountCode || null,
          ...(parentAccountId && { parentAccountId }),
          ...(openingBalance && { openingBalance }),
        });
      }
      closeModal();
      getList?.();
    } catch {
      // slice handles toast
    }
  };

  return (
    <CustomModal modalOpen={open} setModalOpen={open => !open && closeModal()} destroyOnClose width={500} title={isEdit ? 'Edit Account' : 'Add Account'}>
      <Formik key={accountId || 'new'} initialValues={initialValues} validationSchema={accountModalValidateSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => {
          const category = categories.find(c => c.code === values.category);
          const parentSelectOptions = accountDrop.PARENT_ACCOUNT || [];

          return (
            <CustomForm name="AddAccount" onFinish={handleSubmit}>
              <div className="space-y-2">
                <CustomInput
                  type="account"
                  name="category"
                  label="Category"
                  placeholder="Select Category"
                  value={values.category}
                  onChange={value => {
                    setFieldValue('category', value);
                    setFieldValue('isSubAccount', false);
                    setFieldValue('parentAccountId', null);
                    getAccounts({ type: 'PARENT_ACCOUNT', category: value, excludeAccountId: accountId });
                  }}
                  onBlur={handleBlur}
                  errorMessage={errors.category}
                  touched={touched.category}
                  setFieldValue={setFieldValue}
                  selectOptions={categoryOptions}
                  disabled={isSystemEdit}
                  required
                />

                {category?.managedIn === 'BANKING' && (
                  <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    {category.displayName} accounts are set up in Banking, where the account details and opening balance are entered together.
                  </div>
                )}

                {category?.managedIn !== 'BANKING' && (
                  <>
                    <CustomInput
                      type="text"
                      name="accountName"
                      label="Account Name"
                      placeholder="Enter account name"
                      value={values.accountName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.accountName}
                      touched={touched.accountName}
                      setFieldValue={setFieldValue}
                      required
                    />
                    <CustomInput
                      type="text"
                      name="accountCode"
                      label="Account Code"
                      placeholder="Enter account code"
                      value={values.accountCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.accountCode}
                      touched={touched.accountCode}
                      setFieldValue={setFieldValue}
                    />
                  </>
                )}

                {isEdit && !isSystemEdit && (
                  <CustomInput
                    type="checkbox"
                    name="isActive"
                    CheckboxName="Active"
                    value={values.isActive}
                    onChange={e => setFieldValue('isActive', e.target.checked)}
                    onBlur={handleBlur}
                    setFieldValue={setFieldValue}
                  />
                )}

                {values.category && !isSystemEdit && category?.managedIn !== 'BANKING' && category?.allowSubAccount !== false && !editAccount?.hasChildren && parentSelectOptions.length > 0 && (
                  <>
                    <CustomInput
                      type="checkbox"
                      name="isSubAccount"
                      CheckboxName="Make this a sub-account"
                      value={values.isSubAccount}
                      onChange={e => {
                        setFieldValue('isSubAccount', e.target.checked);
                        if (!e.target.checked) setFieldValue('parentAccountId', null);
                      }}
                      onBlur={handleBlur}
                      setFieldValue={setFieldValue}
                    />
                    {values.isSubAccount && (
                      <CustomInput
                        type="account"
                        name="parentAccountId"
                        label="Parent Account"
                        placeholder="Select parent account"
                        value={values.parentAccountId}
                        onChange={value => setFieldValue('parentAccountId', value || null)}
                        onBlur={handleBlur}
                        errorMessage={errors.parentAccountId}
                        touched={touched.parentAccountId}
                        setFieldValue={setFieldValue}
                        selectOptions={parentSelectOptions}
                        required
                      />
                    )}
                  </>
                )}

                {category?.openingBalanceIn === 'COA' && (
                  <>
                    <CustomInput
                      type="number"
                      name="openingBalanceAmount"
                      label="Opening Balance"
                      placeholder="Enter opening balance amount"
                      value={values.openingBalanceAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      errorMessage={errors.openingBalanceAmount}
                      touched={touched.openingBalanceAmount}
                      setFieldValue={setFieldValue}
                    />
                    <CustomInput
                      type="radio"
                      name="balanceType"
                      label="Balance Type"
                      value={values.balanceType}
                      onBlur={handleBlur}
                      errorMessage={errors.balanceType}
                      touched={touched.balanceType}
                      setFieldValue={setFieldValue}
                      radioOptions={BALANCE_TYPE_OPTIONS}
                    />
                    <CustomInput
                      type="date"
                      name="openingBalanceDate"
                      label="Opening Balance Date"
                      placeholder="Select opening balance date"
                      value={values.openingBalanceDate ? values.openingBalanceDate : null}
                      onBlur={handleBlur}
                      errorMessage={errors.openingBalanceDate}
                      touched={touched.openingBalanceDate}
                      setFieldValue={setFieldValue}
                    />
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 justify-end pt-4">
                <CustomButton
                  className="px-7 py-4"
                  text="Cancel"
                  type="default"
                  disabled={submitLoading}
                  onClick={() => {
                    resetForm();
                    closeModal();
                  }}
                />
                {category?.managedIn === 'BANKING' ? (
                  <CustomButton
                    className="px-7 py-4"
                    text="Continue to Banking"
                    type="primary"
                    onClick={() => {
                      closeModal();
                      navigate('/banks/new', { state: { accountType: category.bankAccountType } });
                    }}
                  />
                ) : (
                  <CustomButton className="px-7 py-4" text={isEdit ? 'Save' : 'Add Account'} type="primary" loading={submitLoading} onClick={handleSubmit} />
                )}
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default AddAccountModel;
