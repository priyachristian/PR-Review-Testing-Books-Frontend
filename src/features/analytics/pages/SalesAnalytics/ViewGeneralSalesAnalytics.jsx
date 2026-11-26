import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Formik } from 'formik';

// Components
import { Checkbox, Col, Row, Select, Tooltip } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import CustomButton from '@/components/ui/button/CustomButton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import { useItemMaster } from '@/features/allMaster/item';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useAnalytics, generalSalesAnalyticsValidateSchema } from '@/features/analytics';
import { colorPalette } from '@/utils/theme';
import { shouldPreventNavigation } from '@/utils/util';
import Icons from 'assets/icons/icon';
import {
  DELIVERY_CHALLAN_STATUS,
  DYNAMIC_REPORT_BASIS_OPTIONS,
  GENERAL_SALES_ANALYTICS_MODULE_OPTIONS,
  GENERAL_SALES_ANALYTICS_MODULES,
  INVOICE_STATUS,
  MODULE_NAMES,
  QUOTE_STATUS,
  SALES_ORDER_STATUS,
} from 'utils/constants';

const getGeneralSalesAnalyticsDocumentDetails = report =>
  report
    ? {
        reportName: report.reportName,
        reportBasis: report.reportBasis === 'ITEM_GROUP' ? 'Item Group' : report.reportBasis === 'ITEM' ? 'Item' : report.reportBasis,
      }
    : null;

// Derive Select options from existing status objects (value = key, label = display)
const statusToOptions = obj => Object.entries(obj || {}).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS_BY_MODULE = {
  [GENERAL_SALES_ANALYTICS_MODULES.QUOTE]: statusToOptions(QUOTE_STATUS),
  [GENERAL_SALES_ANALYTICS_MODULES.SALES_ORDER]: statusToOptions(SALES_ORDER_STATUS),
  [GENERAL_SALES_ANALYTICS_MODULES.DELIVERY_CHALLAN]: statusToOptions(DELIVERY_CHALLAN_STATUS),
  [GENERAL_SALES_ANALYTICS_MODULES.INVOICE]: statusToOptions(INVOICE_STATUS),
};

const ViewGeneralSalesAnalytics = () => {
  const navigate = useNavigate();
  const formikRef = useRef(null);
  const {
    generalSalesAnalyticsList,
    generalSalesAnalyticsListLoading,
    getGeneralSalesAnalytics,
    createGeneralSalesAnalytics,
    createGeneralSalesAnalyticsLoading,
    deleteGeneralSalesAnalytics,
    deleteGeneralSalesAnalyticsLoading,
    getGeneralSalesAnalyticsById,
    generalSalesAnalyticsById,
    updateGeneralSalesAnalytics,
    updateGeneralSalesAnalyticsLoading,
    resetGeneralSalesAnalyticsById,
  } = useAnalytics();
  const { itemDrop, getItemDrop } = useItemMaster();
  const { itemGroupDrop, getItemGroupDropdown, droploading } = useItemGroup();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const deleteModal = useConfirmModal();

  const initialValues = {
    reportName: '',
    reportBasis: 'ITEM_GROUP',
    basisIds: [],
    selectedModules: [],
    documentStatuses: {
      [GENERAL_SALES_ANALYTICS_MODULES.QUOTE]: [],
      [GENERAL_SALES_ANALYTICS_MODULES.SALES_ORDER]: [],
      [GENERAL_SALES_ANALYTICS_MODULES.DELIVERY_CHALLAN]: [],
      [GENERAL_SALES_ANALYTICS_MODULES.INVOICE]: [],
    },
  };

  useEffect(() => {
    getGeneralSalesAnalytics({});
  }, [getGeneralSalesAnalytics]);

  useEffect(() => {
    getItemGroupDropdown({});
    getItemDrop({});
  }, [getItemGroupDropdown, getItemDrop]);

  useEffect(() => {
    if (isEditMode && generalSalesAnalyticsById && modalOpen && formikRef.current) {
      const report = generalSalesAnalyticsById;
      const docs = report.documents || [];
      const statuses = {
        [GENERAL_SALES_ANALYTICS_MODULES.QUOTE]: [],
        [GENERAL_SALES_ANALYTICS_MODULES.SALES_ORDER]: [],
        [GENERAL_SALES_ANALYTICS_MODULES.DELIVERY_CHALLAN]: [],
        [GENERAL_SALES_ANALYTICS_MODULES.INVOICE]: [],
      };
      docs.forEach(d => {
        if (d.module && Array.isArray(d.statuses)) statuses[d.module] = d.statuses;
      });

      formikRef.current.setValues({
        reportName: report.reportName || '',
        reportBasis: report.reportBasis || 'ITEM_GROUP',
        basisIds: (report.basisIds || []).map(b => (typeof b === 'string' ? b : b?.toString?.() || b)),
        selectedModules: docs
          .map(d => d.module)
          .filter(Boolean)
          .sort(),
        documentStatuses: statuses,
      });
    }
  }, [isEditMode, generalSalesAnalyticsById, modalOpen]);

  const resetModal = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setIsEditMode(false);
    setEditingReportId(null);
    resetGeneralSalesAnalyticsById();
  };

  const handleOpenModal = () => {
    resetModal();
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    resetModal();
  };

  const handleModuleChange = (module, checked, setFieldValue, values) => {
    const currentModules = values.selectedModules || [];
    let newModules;
    if (checked) {
      newModules = [...currentModules.filter(m => m !== module), module].sort();
    } else {
      newModules = currentModules.filter(m => m !== module);
      const newStatuses = { ...values.documentStatuses, [module]: [] };
      setFieldValue('documentStatuses', newStatuses);
    }
    setFieldValue('selectedModules', newModules);
  };

  const handleStatusChange = (module, statuses, setFieldValue, values) => {
    setFieldValue('documentStatuses', { ...values.documentStatuses, [module]: statuses });
  };

  const handleSaveReport = async values => {
    const documents = values.selectedModules.map(module => ({
      module,
      statuses: values.documentStatuses[module] || [],
    }));

    const result =
      isEditMode && editingReportId
        ? await updateGeneralSalesAnalytics({
            id: editingReportId,
            reportName: values.reportName.trim(),
            reportBasis: values.reportBasis,
            basisIds: values.basisIds,
            documents,
          })
        : await createGeneralSalesAnalytics({
            reportName: values.reportName.trim(),
            reportBasis: values.reportBasis,
            basisIds: values.basisIds,
            documents,
          });
    if (shouldPreventNavigation(result)) {
      return;
    }
    handleCloseModal();
    getGeneralSalesAnalytics({});
  };

  const handleRowClick = record => {
    if (record?._id) navigate(`/analytics/sales-orders/general-sales/${record._id}`);
  };

  const handleEdit = (e, record) => {
    e?.stopPropagation?.();
    if (!record?._id) return;
    setEditingReportId(record._id);
    setIsEditMode(true);
    getGeneralSalesAnalyticsById({ id: record._id });
    setModalOpen(true);
  };

  const handleDelete = (e, record) => {
    e?.stopPropagation?.();
    if (!record?._id) return;
    deleteModal.open(record);
  };

  const deleteReport = async () => {
    if (!deleteModal.payload?._id) return;
    const result = await deleteGeneralSalesAnalytics({ id: deleteModal.payload._id });
    if (shouldPreventNavigation(result)) {
      return;
    }
    deleteModal.close();
    getGeneralSalesAnalytics({});
  };

  const itemGroupOptions = buildItemGroupSelectOptions(itemGroupDrop);
  const itemOptions = buildItemFilterSelectOptions(itemDrop);

  const tableColumns = [
    { title: 'Report Name', dataIndex: 'reportName', key: 'reportName', width: 200 },
    {
      title: 'Basis',
      dataIndex: 'reportBasis',
      key: 'reportBasis',
      width: 120,
      render: val => (val === 'ITEM_GROUP' ? 'Item Group' : 'Item'),
    },
    { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy', width: 160 },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: val => (val ? dayjs(val).format('DD MMM YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {/* EDIT */}
          <Tooltip title="Edit Report">
            <Icons.EditOutlined className={`cursor-pointer`} style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={e => handleEdit(e, record)} />
          </Tooltip>

          {/* DELETE */}
          <Tooltip title="Delete Report">
            <Icons.DeleteOutlined className={`cursor-pointer`} style={{ fontSize: 17, color: colorPalette.error[500] }} onClick={e => handleDelete(e, record)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  const tableData = (generalSalesAnalyticsList || []).map((row, idx) => ({
    ...row,
    key: row._id || idx,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics')} />
          <h1 className="text-xl font-bold">General Sales Analytics</h1>
        </div>
        <CustomButton
          type="primary"
          text={
            <span className="flex items-center gap-1">
              <Icons.PlusOutlined />
              <span>Create General Sales Analytics</span>
            </span>
          }
          onClick={handleOpenModal}
        />
      </div>

      <div className="bg-white">
        {generalSalesAnalyticsListLoading ? <CustomLoader /> : <CustomTable columns={tableColumns} data={tableData} pagination={false} scroll={{ x: 'max-content' }} onRowClick={handleRowClick} />}
        {!generalSalesAnalyticsListLoading && (!generalSalesAnalyticsList || generalSalesAnalyticsList.length === 0) && (
          <div className="py-8 text-center text-gray-500">No general sales analytics yet. Create one to get started.</div>
        )}
      </div>

      <CustomModal
        modalOpen={modalOpen}
        setModalOpen={open => {
          if (!open) handleCloseModal();
        }}
        title={isEditMode ? 'Edit General Sales Analytics' : 'Create General Sales Analytics'}
        width={560}
        destroyOnClose
      >
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={generalSalesAnalyticsValidateSchema(generalSalesAnalyticsList, editingReportId)}
          onSubmit={handleSaveReport}
          enableReinitialize
        >
          {({ values, errors, touched, handleSubmit, setFieldValue }) => (
            <CustomForm onFinish={handleSubmit}>
              <div className="space-y-4 pt-2">
                <div>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <CustomInput
                        label="Report Name"
                        type="text"
                        name="reportName"
                        value={values.reportName}
                        onChange={e => setFieldValue('reportName', e.target.value)}
                        placeholder="Enter report name"
                        maxLength={200}
                        required={true}
                        errorMessage={errors.reportName}
                        touched={touched.reportName}
                        setFieldValue={setFieldValue}
                        onClear={() => setFieldValue('reportName', '')}
                      />
                    </Col>
                    <Col span={24}>
                      <CustomInput
                        label="Report Basis"
                        type="select"
                        name="reportBasis"
                        value={values.reportBasis}
                        selectOptions={DYNAMIC_REPORT_BASIS_OPTIONS}
                        onChange={v => {
                          setFieldValue('reportBasis', v);
                          setFieldValue('basisIds', []);
                        }}
                        placeholder="Select basis"
                        required={true}
                        errorMessage={errors.reportBasis}
                        touched={touched.reportBasis}
                        setFieldValue={setFieldValue}
                      />
                    </Col>
                  </Row>
                </div>

                <div>
                  {values.reportBasis === 'ITEM_GROUP' && (
                    <CustomInput
                      label="Item Groups"
                      type="select"
                      name="basisIds"
                      mode="multiple"
                      value={values.basisIds}
                      selectVariant="twoColumn"
                      columnSelectHeader={itemGroupSelectColumnHeader}
                      selectOptions={itemGroupOptions}
                      onChange={v => setFieldValue('basisIds', v)}
                      placeholder="Select item groups"
                      loading={droploading}
                      allowClear
                      showSearch
                      required={true}
                      errorMessage={errors.basisIds}
                      touched={touched.basisIds}
                      setFieldValue={setFieldValue}
                    />
                  )}
                  {values.reportBasis === 'ITEM' && (
                    <CustomInput
                      label="Items"
                      type="select"
                      name="basisIds"
                      mode="multiple"
                      value={values.basisIds}
                      selectVariant="twoColumn"
                      columnSelectHeader={itemSelectColumnHeader}
                      selectOptions={itemOptions}
                      onChange={v => setFieldValue('basisIds', v)}
                      placeholder="Select items"
                      loading={droploading}
                      allowClear
                      showSearch
                      required={true}
                      errorMessage={errors.basisIds}
                      touched={touched.basisIds}
                      setFieldValue={setFieldValue}
                    />
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Document Selection <span className="text-red-500">*</span>
                  </div>
                  {touched.selectedModules && errors.selectedModules && <div className="text-red-500 text-xs mb-2">{errors.selectedModules}</div>}
                  <div className="space-y-3">
                    {GENERAL_SALES_ANALYTICS_MODULE_OPTIONS.map(opt => (
                      <div key={opt.value}>
                        <Checkbox checked={values.selectedModules.includes(opt.value)} onChange={e => handleModuleChange(opt.value, e.target.checked, setFieldValue, values)}>
                          {opt.label}
                        </Checkbox>
                        {values.selectedModules.includes(opt.value) && (
                          <div className="ml-6 mt-1">
                            <label htmlFor={`general-sales-analytics-status-${opt.value}`} className="block text-xs text-gray-500 mb-1">
                              {opt.label} status
                            </label>
                            <Select
                              id={`general-sales-analytics-status-${opt.value}`}
                              mode="multiple"
                              value={values.documentStatuses[opt.value] || []}
                              onChange={vals => handleStatusChange(opt.value, vals, setFieldValue, values)}
                              options={STATUS_OPTIONS_BY_MODULE[opt.value] || []}
                              className="w-full"
                              placeholder={`Select ${opt.label} statuses`}
                              allowClear
                              showSearch
                              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <CustomButton type="default" text="Cancel" onClick={handleCloseModal} />
                  <CustomButton
                    type="primary"
                    text={isEditMode ? 'Update' : 'Save Report'}
                    loading={isEditMode ? updateGeneralSalesAnalyticsLoading : createGeneralSalesAnalyticsLoading}
                    onClick={handleSubmit}
                  />
                </div>
              </div>
            </CustomForm>
          )}
        </Formik>
      </CustomModal>

      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.GENERAL_SALES_ANALYTICS}
        onConfirm={deleteReport}
        loading={deleteGeneralSalesAnalyticsLoading}
        getDocumentDetails={getGeneralSalesAnalyticsDocumentDetails}
      />
    </div>
  );
};

export default ViewGeneralSalesAnalytics;
