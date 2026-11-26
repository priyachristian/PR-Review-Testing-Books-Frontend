import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Input, Popover, Select, Space, Tabs, Tooltip } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import Toast from '@/components/ui/common/Toast';
import ExportDataModal from '@/components/ui/common/ExportDataModal';

// Hooks
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import useModulePermissions from '@/hooks/useModulePermissions';

// Extras
import { useAnalytics, groupItemWiseItemAnalysisColumn } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { resolveExportFileName } from '@/utils/exportData';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const { Option } = Select;

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const GROUP_ITEM_TAB = 'group-item';
const SUB_ITEM_GROUP_TAB = 'sub-item-group';

const ViewGroupItemAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [groupBlocks, setGroupBlocks] = useState([]);
  const [showAddButton, setShowAddButton] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [originalBlockData, setOriginalBlockData] = useState({});
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [expandTypeMap, setExpandTypeMap] = useState({});
  const [detailByGroupId, setDetailByGroupId] = useState({});
  const [popoverOpenKey, setPopoverOpenKey] = useState(null);
  const [columns, setColumns] = useState([]);
  const [type, setType] = useState('order');
  const [searchParams, setSearchParams] = useSearchParams();
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const [showFilter, setShowFilter] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const activeTab = searchParams.get('tab') === SUB_ITEM_GROUP_TAB ? SUB_ITEM_GROUP_TAB : GROUP_ITEM_TAB;
  const isSubItemGroupTab = activeTab === SUB_ITEM_GROUP_TAB;
  const groupLabel = isSubItemGroupTab ? 'Sub Item Group' : 'Item Group';
  const {
    itemGroupAnalytics,
    subItemGroupAnalytics,
    addItemGroupAnalytics,
    updateItemGroupAnalytics,
    deleteItemGroupAnalytics,
    resetItemGroupAnalytics,
    getItemGroupAnalytics,
    getRowWiseItemGroupAnalyticsByItemGroup,
    addSubItemGroupAnalytics,
    updateSubItemGroupAnalytics,
    deleteSubItemGroupAnalytics,
    resetSubItemGroupAnalytics,
    getSubItemGroupAnalytics,
    getRowWiseSubItemGroupAnalytics,
    loading,
    deleteLoading,
    updateLoading,
    addLoading,
  } = useAnalytics();
  const { itemGroupDrop, getItemGroupDropdown } = useItemGroup();
  const { subItemGroupDrop, getSubItemGroupDropdown } = useSubItemGroup();
  const analyticsList = isSubItemGroupTab ? subItemGroupAnalytics : itemGroupAnalytics;
  const groupOptions = isSubItemGroupTab ? subItemGroupDrop : itemGroupDrop;
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.ANALYTICS);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
  });
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    if (searchParams?.get('quoteDate')) {
      return [searchParams?.get('quoteDate'), searchParams?.get('quoteDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
  });

  useEffect(() => {
    const controller = new AbortController();

    const payload = getQueryParams(window.location.href) || {};

    const fetchAnalytics = isSubItemGroupTab ? getSubItemGroupAnalytics : getItemGroupAnalytics;
    const resetAnalytics = isSubItemGroupTab ? resetSubItemGroupAnalytics : resetItemGroupAnalytics;
    fetchAnalytics({ ...payload, isSplit: isSplitSessionActive, signal: controller.signal });
    setDetailByGroupId({});
    setExpandedRowKeys([]);

    return () => {
      controller.abort();
      resetAnalytics();
    };
  }, [searchParams, isSplitSessionActive, isSubItemGroupTab]);

  useEffect(() => {
    const controller = new AbortController();
    if (isSubItemGroupTab) {
      getSubItemGroupDropdown({ signal: controller.signal });
    } else {
      getItemGroupDropdown({ signal: controller.signal });
    }
    return () => controller.abort();
  }, [isSubItemGroupTab]);

  useEffect(() => {
    if (!analyticsList) {
      setGroupBlocks([]);
      return;
    }

    const rowsKey = isSubItemGroupTab ? 'subItemGroups' : 'itemGroups';
    const idKey = isSubItemGroupTab ? 'subItemGroupId' : 'itemGroupId';
    const nameKey = isSubItemGroupTab ? 'subItemGroupName' : 'itemGroupName';

    if (analyticsList) {
      const transformedData = analyticsList?.map(group => ({
        id: group.configId,
        title: group.groupTitle || 'Untitled Group',
        rows: (group[rowsKey] || []).map(row => ({
          id: row[idKey],
          configId: group.configId,
          itemGroup: row[idKey] || null,
          itemGroupName: row[nameKey] || '',
          order: row.analytics?.totalQuantityOrders ?? 0,
          orderA: row.analytics?.totalOrders ?? 0,
          sales: row.analytics?.totalQuantitySold ?? 0,
          salesA: row.analytics?.totalSales ?? 0,
          splitByQtyQuantity: row.analytics?.splitByQty?.quantity ?? 0,
          splitByQtySales: row.analytics?.splitByQty?.sales ?? 0,
          splitByPriceQuantity: row.analytics?.splitByPrice?.quantity ?? 0,
          splitByPriceSales: row.analytics?.splitByPrice?.sales ?? 0,
          totalSalesQuantity: row.analytics?.totalSalesQuantity ?? 0,
          totalSalesAmount: row.analytics?.totalSalesAmount ?? 0,
        })),
        isEditing: false,
        isEditingTitle: false,
        itemsGroups: group[rowsKey],
      }));

      Array.isArray(transformedData) &&
        transformedData.map(group => {
          const totalOrder = group.rows.reduce((acc, row) => acc + row.order, 0);
          const totalSales = group.rows.reduce((acc, row) => acc + row.sales, 0);
          const totalOrderA = group.rows.reduce((acc, row) => acc + parseFloat(row.orderA || 0), 0);
          const totalSalesA = group.rows.reduce((acc, row) => acc + parseFloat(row.salesA || 0), 0);
          const totalSplitByQtyQuantity = group.rows.reduce((acc, row) => acc + (row.splitByQtyQuantity || 0), 0);
          const totalSplitByQtySales = group.rows.reduce((acc, row) => acc + parseFloat(row.splitByQtySales || 0), 0);
          const totalSplitByPriceQuantity = group.rows.reduce((acc, row) => acc + (row.splitByPriceQuantity || 0), 0);
          const totalSplitByPriceSales = group.rows.reduce((acc, row) => acc + parseFloat(row.splitByPriceSales || 0), 0);
          const totalTotalSalesQuantity = group.rows.reduce((acc, row) => acc + (row.totalSalesQuantity || 0), 0);
          const totalTotalSalesAmount = group.rows.reduce((acc, row) => acc + parseFloat(row.totalSalesAmount || 0), 0);
          Array.isArray(group.rows) &&
            group.rows.push({
              id: Date.now(),
              configId: Date.now(),
              itemGroup: 'Total',
              itemGroupName: 'Total',
              order: totalOrder,
              orderA: totalOrderA,
              sales: totalSales,
              salesA: totalSalesA,
              splitByQtyQuantity: totalSplitByQtyQuantity,
              splitByQtySales: totalSplitByQtySales,
              splitByPriceQuantity: totalSplitByPriceQuantity,
              splitByPriceSales: totalSplitByPriceSales,
              totalSalesQuantity: totalTotalSalesQuantity,
              totalSalesAmount: totalTotalSalesAmount,
            });
        });

      setGroupBlocks(transformedData);
    }
  }, [analyticsList, isSubItemGroupTab]);

  useEffect(() => {
    setColumns(groupItemWiseItemAnalysisColumn(type));
  }, [type]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    const controller = new AbortController();

    if (!filter?.division || filter?.division?.length <= 0) {
      dispatch(resetBranch());
    }

    if (filter?.division?.length > 0) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

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

    setSearchParams(params);
  };

  const addNewGroupBlock = () => {
    const newBlock = {
      id: Date.now(),
      title: 'New Group',
      isEditingTitle: true,
      rows: [
        {
          id: Date.now() + 1,
          itemGroup: null,
          itemGroupName: '',
          order: '',
          orderA: '',
          sales: '',
          salesA: '',
          splitByQtyQuantity: '',
          splitByQtySales: '',
          splitByPriceQuantity: '',
          splitByPriceSales: '',
        },
      ],
      isEditing: true,
      isNew: true,
    };

    setGroupBlocks([...groupBlocks, newBlock]);
    setShowAddButton(false);
  };

  const enableEditMode = blockId => {
    const block = groupBlocks.find(b => b.id === blockId);
    if (block) {
      setOriginalBlockData({
        ...originalBlockData,
        [blockId]: JSON.parse(JSON.stringify(block)),
      });
    }

    setGroupBlocks(groupBlocks.map(block => (block.id === blockId ? { ...block, isEditing: true } : block)));
    setShowAddButton(false);
  };

  const updateBlockTitle = (blockId, newTitle) => {
    setGroupBlocks(groupBlocks.map(block => (block.id === blockId ? { ...block, title: newTitle, isEditingTitle: false } : block)));
  };

  const toggleTitleEditing = blockId => {
    setGroupBlocks(groupBlocks.map(block => (block.id === blockId ? { ...block, isEditingTitle: !block.isEditingTitle } : block)));
  };

  const addRowToBlock = blockId => {
    const newRow = {
      id: Date.now(),
      itemGroup: null,
      itemGroupName: '',
      order: '',
      orderA: '',
      sales: '',
      salesA: '',
      splitByQtyQuantity: '',
      splitByQtySales: '',
      splitByPriceQuantity: '',
      splitByPriceSales: '',
    };

    setGroupBlocks(
      groupBlocks.map(block => {
        if (block.id !== blockId) return block;

        const rows = [...block.rows];
        const lastRow = rows[rows.length - 1];

        if (lastRow?.itemGroupName === 'Total') {
          rows.splice(rows.length - 1, 0, newRow);
        } else {
          rows.push(newRow);
        }

        return {
          ...block,
          rows,
        };
      })
    );
  };

  const updateRowData = async (blockId, rowId, field, value) => {
    setGroupBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              rows: block.rows.map(row => (row.id === rowId ? { ...row, [field]: value } : row)),
            }
          : block
      )
    );

    if (field === 'itemGroup' && value) {
      try {
        const result = isSubItemGroupTab
          ? await getRowWiseSubItemGroupAnalytics({
              subItemGroupId: value,
              dateRange,
              isSplit: isSplitSessionActive,
            })
          : await getRowWiseItemGroupAnalyticsByItemGroup({
              itemGroupId: value,
              dateRange,
              isSplit: isSplitSessionActive,
            });
        // dispatch returns the action; API response is in action.payload
        const analyticsData = result?.payload ?? result;
        const nameKey = isSubItemGroupTab ? 'subItemGroupName' : 'itemGroupName';

        const analytics = analyticsData?.data?.analytics || {
          totalSales: 0,
          totalPurchases: 0,
          totalQuantitySold: 0,
          totalQuantityPurchased: 0,
        };

        setGroupBlocks(prev =>
          prev.map(block =>
            block.id === blockId
              ? {
                  ...block,
                  rows: block.rows.map(row =>
                    row.id === rowId
                      ? {
                          ...row,
                          itemGroupName: analyticsData?.data?.[nameKey] || analyticsData?.[nameKey] || '',
                          order: analytics.totalQuantityOrders ?? 0,
                          orderA: analytics.totalOrders ?? 0,
                          sales: analytics.totalQuantitySold ?? 0,
                          salesA: analytics.totalSales ?? 0,
                          splitByQtyQuantity: analytics.splitByQty?.quantity ?? 0,
                          splitByQtySales: analytics.splitByQty?.sales ?? 0,
                          splitByPriceQuantity: analytics.splitByPrice?.quantity ?? 0,
                          splitByPriceSales: analytics.splitByPrice?.sales ?? 0,
                        }
                      : row
                  ),
                }
              : block
          )
        );
      } catch (err) {
        console.error('Error fetching row analytics:', err);
        Toast.error(`Failed to fetch analytics for selected ${groupLabel.toLowerCase()}`);
      }
    }
  };

  const deleteRow = (blockId, rowId) => {
    setGroupBlocks(
      groupBlocks.map(block =>
        block.id === blockId
          ? {
              ...block,
              rows: block.rows.filter(row => row.id !== rowId),
            }
          : block
      )
    );
  };

  const saveBlock = async blockId => {
    const block = groupBlocks.find(b => b.id === blockId);

    const validRows = block.rows.filter(row => row.itemGroup);

    if (validRows.length === 0) {
      Toast.error(`Please select at least one ${groupLabel.toLowerCase()} before saving`);
      return;
    }

    const selectedIds = validRows.filter(row => row.itemGroup !== 'Total').map(row => row.itemGroup);
    const payload = isSubItemGroupTab ? { subItemGroupIds: selectedIds, groupTitle: block.title } : { itemGroupIds: selectedIds, groupTitle: block.title };

    try {
      if (block.isNew) {
        if (isSubItemGroupTab) {
          await addSubItemGroupAnalytics(payload);
        } else {
          await addItemGroupAnalytics(payload);
        }
      } else if (isSubItemGroupTab) {
        await updateSubItemGroupAnalytics({ id: blockId, payload });
      } else {
        await updateItemGroupAnalytics({ id: blockId, payload });
      }

      setGroupBlocks(groupBlocks.map(b => (b.id === blockId ? { ...b, isEditing: false, isEditingTitle: false, isNew: false } : b)));

      const newOriginalData = { ...originalBlockData };
      delete newOriginalData[blockId];
      setOriginalBlockData(newOriginalData);

      setShowAddButton(true);
      const refreshAnalytics = isSubItemGroupTab ? getSubItemGroupAnalytics : getItemGroupAnalytics;
      await refreshAnalytics({ ...(getQueryParams(window.location.href) || {}), isSplit: isSplitSessionActive });
    } catch (error) {
      Toast.error(error.message || 'Failed to save Block. Please try again.');
      console.error('Save error:', error);
    }
  };

  const cancelBlock = blockId => {
    const block = groupBlocks.find(b => b.id === blockId);

    if (block?.isNew) {
      setGroupBlocks(groupBlocks.filter(block => block.id !== blockId));
    } else {
      const originalData = originalBlockData[blockId];
      if (originalData) {
        setGroupBlocks(groupBlocks.map(block => (block.id === blockId ? { ...originalData, isEditing: false, isEditingTitle: false } : block)));

        const newOriginalData = { ...originalBlockData };
        delete newOriginalData[blockId];
        setOriginalBlockData(newOriginalData);
      } else {
        setGroupBlocks(groupBlocks.map(block => (block.id === blockId ? { ...block, isEditing: false, isEditingTitle: false } : block)));
      }
    }

    setShowAddButton(true);
  };

  const handleExpand = (record, type) => {
    if (record.itemGroupName === 'Total') {
      return;
    }
    setType(type);
    setExpandedRowKeys([`${record.id}-${record.configId}`]);
    setExpandTypeMap(prev => ({
      ...prev,
      [`${record.id}-${record.configId}`]: type,
    }));

    if (!detailByGroupId[record.id]) {
      setDetailByGroupId(prev => ({ ...prev, [record.id]: { loading: true, items: [] } }));
      const fetchRowAnalytics = isSubItemGroupTab
        ? getRowWiseSubItemGroupAnalytics({ subItemGroupId: record.id, dateRange, isSplit: isSplitSessionActive })
        : getRowWiseItemGroupAnalyticsByItemGroup({ itemGroupId: record.id, dateRange, isSplit: isSplitSessionActive });
      fetchRowAnalytics
        .then(result => {
          const payload = result?.payload ?? result;
          const items = payload?.data?.items || [];
          setDetailByGroupId(prev => ({ ...prev, [record.id]: { loading: false, items } }));
        })
        .catch(() => {
          setDetailByGroupId(prev => ({ ...prev, [record.id]: { loading: false, items: [] } }));
        });
    }
  };

  const getTableColumns = blockId => {
    const block = groupBlocks.find(b => b.id === blockId);
    const isEditing = block?.isEditing;

    const expandedKey = expandedRowKeys[0];
    const expandedType = expandTypeMap[expandedKey];

    return [
      {
        title: groupLabel,
        dataIndex: 'itemGroup',
        key: 'itemGroup',
        width: '25%',
        render: (value, record) => {
          if (isEditing && record.itemGroupName.toLowerCase() !== 'total') {
            return (
              <Select
                placeholder={`Select ${groupLabel}`}
                value={value}
                onChange={val => updateRowData(blockId, record.id, 'itemGroup', val)}
                className="w-full mt-1"
                showSearch
                optionFilterProp="children"
              >
                {(groupOptions || [])
                  ?.filter(group => {
                    const optionId = group.id || group._id;
                    return !block.rows.some(row => row.itemGroup === optionId && row.id !== record.id);
                  })
                  .map(group => {
                    const optionId = group.id || group._id;
                    return (
                      <Option key={optionId} value={optionId}>
                        {group.name}
                      </Option>
                    );
                  })}
              </Select>
            );
          } else {
            return <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{record.itemGroupName || '-'}</span>;
          }
        },
      },
      {
        title: <span className="text-gray-900">Sales Order {expandedType === 'order' ? <Icons.MinusOutlined /> : expandedType === 'sales' ? <Icons.PlusOutlined /> : <Icons.PlusOutlined />}</span>,
        dataIndex: 'order',
        key: 'order',
        width: '15%',
        render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{value ? `${value} pc` : '0 pc'}</span>,
        onCell: record => ({
          onClick: () => handleExpand(record, 'order'),
        }),
      },
      {
        title: (
          <span className="text-gray-900">Sales Order Amount {expandedType === 'order' ? <Icons.MinusOutlined /> : expandedType === 'sales' ? <Icons.PlusOutlined /> : <Icons.PlusOutlined />}</span>
        ),
        dataIndex: 'orderA',
        key: 'orderA',
        width: '20%',
        render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{formatAmount(value || 0)}</span>,
        onCell: record => ({
          onClick: () => handleExpand(record, 'order'),
        }),
      },
      {
        title: <span className="text-gray-900">Sales {expandedType === 'sales' ? <Icons.MinusOutlined /> : expandedType === 'order' ? <Icons.PlusOutlined /> : <Icons.PlusOutlined />}</span>,
        dataIndex: 'sales',
        key: 'sales',
        width: '15%',
        render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{value ? `${value} pc` : '0 pc'}</span>,
        onCell: record => ({
          onClick: () => handleExpand(record, 'sales'),
        }),
      },
      {
        title: <span className="text-gray-900">Sales Amount {expandedType === 'sales' ? <Icons.MinusOutlined /> : expandedType === 'order' ? <Icons.PlusOutlined /> : <Icons.PlusOutlined />}</span>,
        dataIndex: 'salesA',
        key: 'salesA',
        width: '20%',
        render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{formatAmount(value || 0)}</span>,
        onCell: record => ({
          onClick: () => handleExpand(record, 'sales'),
        }),
      },
      ...(isSplitSessionActive
        ? [
            {
              title: (
                <span className="text-gray-900">Split Sales - Quantity {expandedType === 'splitByQty' || expandedType === 'splitByPrice' ? <Icons.MinusOutlined /> : <Icons.PlusOutlined />}</span>
              ),
              dataIndex: 'splitByQtyQuantity',
              key: 'splitSalesQuantity',
              width: 250,
              render: (value, record) => (
                <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>
                  {value ? `${value} pc` : '0 pc'} (by Qty) | {record.splitByPriceQuantity || 0} pc (by Price)
                </span>
              ),
              onCell: record => ({
                onClick: () => handleExpand(record, 'splitByQty'),
              }),
            },
            {
              title: <span className="text-gray-900">Split Sales - Amount {expandedType === 'splitByQty' || expandedType === 'splitByPrice' ? <Icons.MinusOutlined /> : <Icons.PlusOutlined />}</span>,
              dataIndex: 'splitByQtySales',
              key: 'splitSalesAmount',
              width: 280,
              render: (value, record) => (
                <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>
                  {formatAmount(value || 0)} (by Qty) | {formatAmount(record.splitByPriceSales || 0)} (by Price)
                </span>
              ),
              onCell: record => ({
                onClick: () => handleExpand(record, 'splitByQty'),
              }),
            },
            {
              title: <span className="text-gray-900">Total Sales</span>,
              dataIndex: 'totalSalesQuantity',
              key: 'totalSalesQuantity',
              width: 160,
              render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{value ? `${value} pc` : '0 pc'}</span>,
            },
            {
              title: <span className="text-gray-900">Total Sales Amount</span>,
              dataIndex: 'totalSalesAmount',
              key: 'totalSalesAmount',
              width: 180,
              render: (value, record) => <span className={`text-gray-900 ${record.itemGroupName === 'Total' ? 'font-bold' : ''}`}>{formatAmount(value || 0)}</span>,
            },
          ]
        : []),
      ...(isEditing
        ? [
            {
              title: 'Actions',
              key: 'actions',
              width: '10%',
              render: (_, record) => <Button type="text" danger size="small" icon={<Icons.DeleteOutlined />} onClick={() => deleteRow(blockId, record.id)} disabled={block?.rows.length === 1} />,
            },
          ]
        : []),
    ];
  };

  const showDeleteModal = blockId => {
    const block = groupBlocks.find(b => b.id === blockId);
    setBlockToDelete(block);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blockToDelete) return;

    try {
      const listQuery = { ...(getQueryParams(window.location.href) || {}), isSplit: isSplitSessionActive };
      if (isSubItemGroupTab) {
        await deleteSubItemGroupAnalytics({ itemGroupId: blockToDelete.id });
        await getSubItemGroupAnalytics(listQuery);
      } else {
        await deleteItemGroupAnalytics({ itemGroupId: blockToDelete.id });
        await getItemGroupAnalytics(listQuery);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteModalVisible(false);
      setBlockToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setBlockToDelete(null);
  };

  const expandedRowRender = record => {
    const type = expandTypeMap[`${record.id}-${record.configId}`];
    const detail = detailByGroupId[record.id];

    if (!detail || detail.loading) {
      return <div className="text-center py-6 text-gray-500">Loading…</div>;
    }

    const groupItems = detail.items || [];

    let filteredItems = [];

    if (type === 'order') {
      filteredItems = groupItems.filter(item => item.salesOrders && item.salesOrders.length > 0);
    } else if (type === 'splitByQty' || type === 'splitByPrice') {
      // For both split types, show the same split invoice data
      filteredItems = groupItems.filter(item => item.splitInvoices && item.splitInvoices.length > 0).map(item => ({ ...item, invoices: item.splitInvoices }));
    } else {
      filteredItems = groupItems.filter(item => item.invoices && item.invoices.length > 0);
    }

    if (!filteredItems.length) {
      return <div className="text-center py-6 text-gray-500">No data available for this group.</div>;
    }

    return <CustomTable columns={columns} data={filteredItems} pagination={false} size="small" scroll={{ x: 'max-content' }} />;
  };

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      ...filter,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    setFilter({
      division: null,
      branch: null,
    });
    updateUrlParams({
      division: '',
      branch: '',
      startDate: null,
      endDate: null,
      preset: '',
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('startDate') || searchParams.get('quoteDate'), searchParams.get('division'), searchParams.get('branch')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handleExportGroupItems = async ({ fileName }) => {
    if (!groupBlocks.length) {
      Toast.warning('No data available to export.');
      return;
    }

    setExportLoading(true);
    try {
      const headerRow = [
        groupLabel,
        'Sales Order',
        'Sales Order Amount',
        'Sales',
        'Sales Amount',
        ...(isSplitSessionActive ? ['Split Sales - Quantity', 'Split Sales - Amount', 'Total Sales', 'Total Sales Amount'] : []),
      ];
      const columnCount = headerRow.length;

      const buildRow = row => [
        row.itemGroupName || '-',
        `${row.order ?? 0} pc`,
        formatAmount(row.orderA || 0),
        `${row.sales ?? 0} pc`,
        formatAmount(row.salesA || 0),
        ...(isSplitSessionActive
          ? [
              `${row.splitByQtyQuantity ?? 0} pc (by Qty) | ${row.splitByPriceQuantity ?? 0} pc (by Price)`,
              `${formatAmount(row.splitByQtySales || 0)} (by Qty) | ${formatAmount(row.splitByPriceSales || 0)} (by Price)`,
              `${row.totalSalesQuantity ?? 0} pc`,
              formatAmount(row.totalSalesAmount || 0),
            ]
          : []),
      ];

      const sheetRows = [];
      const groupTitleMerges = [];

      groupBlocks.forEach((block, index) => {
        groupTitleMerges.push({ s: { r: sheetRows.length, c: 0 }, e: { r: sheetRows.length, c: columnCount - 1 } });
        sheetRows.push([block.title]);
        sheetRows.push(headerRow);
        block.rows.forEach(row => sheetRows.push(buildRow(row)));

        if (index < groupBlocks.length - 1) {
          sheetRows.push([]);
        }
      });

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
      worksheet['!merges'] = groupTitleMerges;
      const workbook = XLSX.utils.book_new();
      const sheetName = isSubItemGroupTab ? 'Sub Item Group Analytics' : 'Item Group Analytics';
      const fallbackFileName = isSubItemGroupTab ? 'Sub_Item_Group_Analytics_Export' : 'Item_Group_Analytics_Export';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, resolveExportFileName(fileName, fallbackFileName));
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Toast.error('Failed to export. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="-m-4">
      <div className="flex justify-between items-center border-b bg-white sticky-page-header container-spacing">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">Group Items</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title={ANALYTICS_TOOLTIPS.GROUP_ITEM} placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-center ">
          <div className="flex-grow" />
          <Space className="">
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
            <Button icon={<Icons.FileExcelOutlined />} onClick={() => setShowExportModal(true)} disabled={!groupBlocks.length}>
              Export
            </Button>
            {showAddButton && (
              <Button type="primary" icon={<Icons.PlusOutlined />} onClick={addNewGroupBlock}>
                Add Group
              </Button>
            )}
          </Space>
        </div>
      </div>
      <div className="bg-white border-b px-4">
        <Tabs
          activeKey={activeTab}
          onChange={key => {
            setGroupBlocks([]);
            setShowAddButton(true);
            setDetailByGroupId({});
            setExpandedRowKeys([]);
            setOriginalBlockData({});
            const params = new URLSearchParams(searchParams);
            params.set('tab', key);
            setSearchParams(params);
          }}
          items={[
            { key: GROUP_ITEM_TAB, label: 'Group Item' },
            { key: SUB_ITEM_GROUP_TAB, label: 'Sub Item Group' },
          ]}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      <FilterDrawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={() => {
          handleFilter();
          setShowFilter(false);
        }}
        onReset={handleClear}
      >
        <FilterSection title="When" columns={1}>
          <div>
            <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
          </div>
        </FilterSection>

        <FilterSection title="What">
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'division'}
              label={'Division'}
              mode="multiple"
              placeHolder={'Select Division'}
              selectVariant="twoColumn"
              columnSelectHeader={divisionSelectColumnHeader}
              selectionOptions={buildDivisionSelectOptions(divDrop)}
              value={filter?.division}
              setFilter={setFilter}
              allowClear={false}
              extraFilterValues={{ branch: '' }}
              loading={divisionLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.divisionDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                }
              }}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              mode="multiple"
              name={'branch'}
              label={'Branch'}
              placeHolder={'Select Branch'}
              selectVariant="twoColumn"
              columnSelectHeader={branchSelectColumnHeader}
              selectionOptions={buildBranchSelectOptions(branchDrop)}
              value={filter?.branch}
              setFilter={setFilter}
              allowClear={false}
              disabled={!filter?.division}
              loading={branchLoading}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
        </FilterSection>
      </FilterDrawer>

      <div className="bg-white">
        <CommonFilterTags
          filterClassName="!mb-0 border-b"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleClear}
          dateKeys={{
            startDateKey: 'startDate',
            endDateKey: 'endDate',
            singleDateKey: 'quoteDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, quoteDate: null, preset: null });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
        />
      </div>
      <div>
        <div className="">
          {loading ? (
            <div className="flex items-center justify-center h-[80vh]">
              <CustomLoader />
            </div>
          ) : groupBlocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {groupBlocks.map(block => (
                <Card key={block.id} className="" bodyStyle={{ padding: '16px' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      {block.isEditingTitle ? (
                        <Input
                          defaultValue={block.title}
                          onPressEnter={e => updateBlockTitle(block.id, e.target.value)}
                          onBlur={e => updateBlockTitle(block.id, e.target.value)}
                          className="text-lg font-semibold border-0 border-b border-gray-300 rounded-none px-0 focus:shadow-none focus:border-blue-500"
                          style={{ width: '180px' }}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
                          {block.isEditing && <Button type="text" size="small" icon={<Icons.EditOutlined />} onClick={() => toggleTitleEditing(block.id)} />}
                        </div>
                      )}
                    </div>

                    {block.isEditing ? (
                      <Space size="small">
                        <Button type="primary" size="small" icon={<Icons.SaveOutlined />} onClick={() => saveBlock(block.id)} loading={updateLoading}>
                          Save
                        </Button>
                        <Button type="default" size="small" icon={<Icons.CloseOutlined />} onClick={() => cancelBlock(block.id)}>
                          Cancel
                        </Button>
                      </Space>
                    ) : (
                      <Space size="small">
                        <Button type="primary" size="small" icon={<Icons.EditOutlined />} onClick={() => enableEditMode(block.id)} loading={updateLoading}>
                          Edit
                        </Button>
                        <Button danger size="small" icon={<Icons.DeleteOutlined />} onClick={() => showDeleteModal(block.id)} loading={deleteLoading}>
                          Delete
                        </Button>
                      </Space>
                    )}
                  </div>

                  <CustomTable
                    columns={getTableColumns(block.id)}
                    data={block.rows}
                    pagination={false}
                    size="small"
                    tableId={record => `${record.id}-${record.configId}`}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                    scroll={{ x: true }}
                    isPaginationFixed={false}
                    loading={loading}
                    dynamicScrollY={false}
                    rowClassName={record => (record.itemGroupName === 'Total' ? '!bg-gray-200 !font-semibold' : '')}
                    expandable={{
                      expandedRowKeys,
                      onExpand: expanded => {
                        if (!expanded) {
                          setExpandedRowKeys([]);
                        }
                      },
                      expandedRowRender,
                      expandRowByClick: true,
                      expandIcon: ({ expanded, record }) => {
                        if (record.itemGroupName === 'Total') {
                          return null;
                        }

                        if (expanded) {
                          return (
                            <Button
                              type="text"
                              shape="circle"
                              size="small"
                              icon={<Icons.MinusOutlined />}
                              onClick={() => {
                                setExpandedRowKeys([]);
                                setExpandTypeMap(prev => {
                                  const newMap = { ...prev };
                                  delete newMap[`${record.id}-${record.configId}`];
                                  return newMap;
                                });
                              }}
                            />
                          );
                        }

                        return (
                          <Popover
                            trigger="click"
                            placement="right"
                            open={popoverOpenKey === `${record.id}-${record.configId}`}
                            onOpenChange={open => setPopoverOpenKey(open ? `${record.id}-${record.configId}` : null)}
                            content={
                              <div>
                                <Button
                                  type="text"
                                  onClick={() => {
                                    handleExpand(record, 'order');
                                    setPopoverOpenKey(null);
                                  }}
                                >
                                  Expand Order
                                </Button>
                                <br />
                                <Button
                                  type="text"
                                  onClick={() => {
                                    handleExpand(record, 'sales');
                                    setPopoverOpenKey(null);
                                  }}
                                >
                                  Expand Sales
                                </Button>
                                {isSplitSessionActive && (
                                  <>
                                    <br />
                                    <Button
                                      type="text"
                                      onClick={() => {
                                        handleExpand(record, 'splitByQty');
                                        setPopoverOpenKey(null);
                                      }}
                                    >
                                      Expand Split Sales
                                    </Button>
                                  </>
                                )}
                              </div>
                            }
                          >
                            <Button type="text" shape="circle" size="small" icon={<Icons.PlusOutlined rotate={90} style={{ transition: 'transform 0.2s' }} />} />
                          </Popover>
                        );
                      },
                      rowExpandable: record => record.itemGroupName !== 'Total',
                    }}
                  />

                  {block.isEditing && (
                    <div className="mt-3 text-center">
                      <Button type="dashed" size="small" icon={<Icons.PlusOutlined />} onClick={() => addRowToBlock(block.id)} loading={addLoading}>
                        Add Row
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 bg-white border-2 border-dashed border-gray-300">
              <div className="space-y-4">
                <div className="text-6xl text-gray-300">📊</div>
                <h3 className="text-xl font-semibold text-gray-600">No Groups Created Yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">Start by creating your first group to organize and track your items effectively.</p>
                <Button type="primary" size="large" icon={<Icons.PlusOutlined />} onClick={addNewGroupBlock}>
                  Create Your First Group
                </Button>
              </div>
            </Card>
          )}
        </div>
        <CustomModal modalOpen={deleteModalVisible} setModalOpen={handleDeleteCancel} title="Delete Group" width={500}>
          <div className="py-2">
            <p className="text-gray-800 text-base mb-3">
              Are you sure you want to delete the group <span className="font-semibold text-gray-900">“{blockToDelete?.title}”</span>?
            </p>
            <p className="text-red-600 text-sm leading-relaxed">This action cannot be undone. All data associated with this group will be permanently removed.</p>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={handleDeleteCancel} style={{ minWidth: '100px', maxWidth: '100px' }} disabled={false} />
            <CustomButton className="px-8 py-4 delete-button" type="default" text="Delete" onClick={handleDeleteConfirm} loading={deleteLoading} style={{ minWidth: '100px', maxWidth: '100px' }} />
          </div>
        </CustomModal>
        <ExportDataModal
          modalOpen={showExportModal}
          setModalOpen={setShowExportModal}
          entityPlural={isSubItemGroupTab ? 'Sub Item Group Analytics' : 'Item Group Analytics'}
          defaultFileName={isSubItemGroupTab ? 'Sub_Item_Group_Analytics_Export' : 'Item_Group_Analytics_Export'}
          exportLoading={exportLoading}
          onExport={handleExportGroupItems}
          formName="export-item-group-analytics"
        />
      </div>
    </div>
  );
};

export default ViewGroupItemAnalytics;
