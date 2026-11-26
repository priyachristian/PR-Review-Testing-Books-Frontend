import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Popconfirm, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import useModulePermissions from '@/hooks/useModulePermissions';
import AddEditCurrencyModal from '../components/AddEditCurrencyModal';
import { currencyColumns } from '../currency.columns';
import Icons from '@/assets/icons/icon';
import { useCurrency } from '../useCurrency';
import { colorPalette } from '@/utils/theme';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { useProfile } from '@/features/setting/profile/useProfile';

const CurrenciesPage = () => {
  const { currencies, pagination, loading, saving, deletingId, getCurrencies, createCurrency, updateCurrency, deleteCurrency } = useCurrency();
  const { refreshCompanyProfile } = useProfile();
  const { isViewOnly } = useModulePermissions();
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin';
  const canChange = isAdmin && !isViewOnly;
  const blockedTitle = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !isAdmin ? PERMISSION_MESSAGES.NO_PERMISSION : null;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);

  const fetchCurrencies = ({ page = pagination?.page ?? 1, limit = pagination?.limit ?? DEFAULT_PAGE_SIZE } = {}) => {
    getCurrencies({ page, limit, pagination: true });
  };

  useEffect(() => {
    fetchCurrencies({ page: 1, limit: pagination?.limit ?? DEFAULT_PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAddNew = () => {
    setEditingCurrency(null);
    setModalOpen(true);
  };
  const onEdit = currency => {
    if (!canChange) return;
    setEditingCurrency(currency);
    setModalOpen(true);
  };

  const onDelete = async currency => {
    if (!canChange) return;
    try {
      await deleteCurrency({ currencyId: currency._id || currency.id });
      fetchCurrencies();
    } catch {
      // slice handles toast
    }
  };

  const onSubmitCurrency = async values => {
    const body = {
      code: String(values.code).trim().toUpperCase(),
      symbol: values.symbol,
      name: values.name,
      decimalPlaces: values.decimalPlaces,
      format: values.format || undefined,
      exchangeRate: values.exchangeRate !== '' ? values.exchangeRate : null,
    };
    try {
      const editId = editingCurrency?._id || editingCurrency?.id;
      if (editId) {
        await updateCurrency({ currencyId: editId, body });
        if (editingCurrency?.isBaseCurrency) {
          await refreshCompanyProfile();
        }
      } else {
        await createCurrency({ body });
      }
      setModalOpen(false);
      setEditingCurrency(null);
      fetchCurrencies();
    } catch {
      // slice handles error toasts
    }
  };

  const columns = useMemo(() => currencyColumns(), []);

  const data = (currencies || []).map(currency => ({ ...currency, key: currency._id || currency.id }));

  const handlePaginationChange = (page, pageSize) => {
    fetchCurrencies({ page, limit: pageSize });
  };

  return (
    <div>
      <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#7c3bed1a] justify-center items-center w-10 h-10 flex rounded-lg p-2">
              <Icons.DollarOutlined className="text-[#7c3bed] items-center text-xl" />
            </div>
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Currencies</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Manage company currencies and base currency details</p>
            </div>
          </div>
          <PermissionButton
            canAccess={isAdmin}
            isViewOnly={isViewOnly}
            type="primary"
            className="px-5 w-full md:w-auto"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={canChange ? onAddNew : undefined}
            icon={<Icons.PlusCircleOutlined />}
            text="New Currency"
          />
        </div>
      </div>

      <div>
        <CustomTable
          columns={columns}
          data={data}
          loading={loading}
          isPaginationFixed={true}
          paginationClassName="border-l-0"
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.limit || DEFAULT_PAGE_SIZE,
            total: pagination?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 100,
            visible: true,
            render: (_, record) => (
              <div className="flex items-center gap-3">
                <Tooltip title={blockedTitle || 'Edit currency'}>
                  <Icons.EditOutlined
                    className={canChange ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                    style={{ fontSize: 17, color: colorPalette.primary[500] }}
                    onClick={canChange ? () => onEdit(record) : undefined}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete Currency"
                  description={`Are you sure you want to delete "${record?.code}"?`}
                  okText="Yes"
                  cancelText="No"
                  onConfirm={() => onDelete(record)}
                  disabled={!canChange || record?.isBaseCurrency}
                >
                  <Tooltip title={blockedTitle || (record?.isBaseCurrency ? 'Base currency cannot be deleted' : 'Delete currency')}>
                    <span>
                      <Icons.DeleteOutlined
                        className={canChange && !record?.isBaseCurrency && deletingId !== (record?._id || record?.id) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500] }}
                      />
                    </span>
                  </Tooltip>
                </Popconfirm>
              </div>
            ),
          })}
        />
      </div>

      {modalOpen ? (
        <AddEditCurrencyModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          initialCurrency={editingCurrency}
          title={editingCurrency ? 'Edit currency' : 'Add new currency'}
          onSubmit={onSubmitCurrency}
          saving={saving}
          codeDisabled={!!editingCurrency}
        />
      ) : null}
    </div>
  );
};

export default CurrenciesPage;
