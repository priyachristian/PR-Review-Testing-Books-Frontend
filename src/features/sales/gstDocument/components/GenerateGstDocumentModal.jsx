import { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { Alert } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { GST_DOCUMENT_GENERATE_MODE } from '@/utils/constants';
import EwbTransportFields from './EwbTransportFields';
import HsnEditTable from './HsnEditTable';
import GstFormSection from './GstFormSection';
import GstDocumentOptionFields from './GstDocumentOptionFields';
import { eInvoiceOptionsSchema, eWayBillOptionsSchema, eWayBillSchema, generateEInvoiceSchema, onlyEwayBillSchema } from '../gstDocument.schema';
import { EWB_TRANSPORT_INITIAL_VALUES, buildEInvoiceOptions, buildEWayBillOptions, buildEwbTransportDetails, buildHsnUpdates, buildOptionInitialValues, toHsnRows } from '../gstDocument.transformer';

const SUB_SUPPLY_TYPE_OTHERS = '8';
const EMPTY_HSN_FORM = { rows: [], invalidHsnCodes: [], updateItemMaster: false };

const MODE_CONFIG = {
  [GST_DOCUMENT_GENERATE_MODE.E_INVOICE]: {
    title: 'Generate E-Invoice',
    formName: 'GenerateEInvoiceForm',
    documentName: 'E-Invoice',
    validationSchema: generateEInvoiceSchema,
    initialValues: { withEwb: false, ...EWB_TRANSPORT_INITIAL_VALUES },
    editHsn: true,
    optionVariant: 'eInvoice',
    optionsSchema: eInvoiceOptionsSchema,
    buildEwbDtls: values => (values.withEwb ? buildEwbTransportDetails(values) : undefined),
  },
  [GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL_BY_IRN]: {
    title: 'Generate E-Way Bill',
    formName: 'GenerateEWayBillForm',
    documentName: 'E-Way Bill',
    validationSchema: eWayBillSchema,
    initialValues: { ...EWB_TRANSPORT_INITIAL_VALUES },
    // Items come from the e-invoice, so HSN cannot be changed here.
    editHsn: false,
    buildEwbDtls: values => buildEwbTransportDetails(values),
  },
  [GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL]: {
    title: 'Generate E-Way Bill',
    formName: 'GenerateOnlyEWayBillForm',
    documentName: 'E-Way Bill',
    validationSchema: onlyEwayBillSchema,
    initialValues: { supplyType: 'O', subSupplyType: '1', subSupplyDesc: '', ...EWB_TRANSPORT_INITIAL_VALUES },
    editHsn: true,
    optionVariant: 'eWayBill',
    optionsSchema: eWayBillOptionsSchema,
    buildEwbDtls: values => ({
      supplyType: values.supplyType,
      subSupplyType: values.subSupplyType,
      ...(values.subSupplyType === SUB_SUPPLY_TYPE_OTHERS && { subSupplyDesc: values.subSupplyDesc }),
      ...buildEwbTransportDetails(values, { standalone: true }),
    }),
  },
};

/**
 * Generate modal for e-invoice and e-way bill, shared by every document module.
 *
 * `onSubmit({ EwbDtls, EInvDtls, items, updateItemMaster })` makes the module's API call and must reject on failure;
 * the modal stays open on rejection and highlights the rows named by an invalid HSN error.
 * The caller closes the modal (clears `mode`) after a successful call.
 *
 * `allowEWayBillWithEInvoice` hides "Also generate E-Way Bill" for documents whose e-way bill is generated separately.
 *
 * `loadOptions()` is optional: it resolves the addresses, charges and defaults for the document. Without it
 * (or if it fails) the modal offers no extra options and the request is the same as before they existed.
 */
const GenerateGstDocumentModal = ({
  mode,
  onClose,
  onSubmit,
  loading = false,
  items = [],
  documentLabel = 'document',
  hasActiveEWayBill = false,
  contextItems = [],
  allowEWayBillWithEInvoice = true,
  onInvalidHsn,
  loadOptions,
  onFetchGstinDetails,
  fetchGstinLoading = false,
}) => {
  const config = MODE_CONFIG[mode];
  const [hsnForm, setHsnForm] = useState(EMPTY_HSN_FORM);
  // Options are loaded per open; `mode` records which open they belong to.
  const [documentOptions, setDocumentOptions] = useState({ mode: null, data: null });

  // Rows are loaded once per open: reloading when `items` refreshes would discard the user's edits.
  useEffect(() => {
    if (!config?.editHsn) return;
    setHsnForm({ ...EMPTY_HSN_FORM, rows: toHsnRows(items) });
  }, [mode]);

  useEffect(() => {
    if (!config?.optionVariant || !loadOptions) return undefined;

    let active = true;
    loadOptions()
      .then(data => active && setDocumentOptions({ mode, data: data || null }))
      .catch(() => active && setDocumentOptions({ mode, data: null }));
    return () => {
      active = false;
    };
  }, [mode]);

  if (!config) return null;

  // The form waits for the options so its fields open on the right defaults.
  const offersOptions = Boolean(config.optionVariant && loadOptions);
  const optionsPending = offersOptions && documentOptions.mode !== mode;
  const showOptions = offersOptions && !optionsPending && Boolean(documentOptions.data);
  const optionInitialValues = showOptions ? buildOptionInitialValues(documentOptions.data, { standalone: mode === GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL }) : {};
  const initialValues = { ...config.initialValues, ...optionInitialValues };
  const validationSchema = showOptions ? config.validationSchema.concat(config.optionsSchema) : config.validationSchema;

  const isEInvoice = mode === GST_DOCUMENT_GENERATE_MODE.E_INVOICE;
  const isStandaloneEWayBill = mode === GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL;
  const busy = loading || fetchGstinLoading;

  const handleSubmit = async values => {
    const payload = { EwbDtls: config.buildEwbDtls(values) };
    if (showOptions && isEInvoice) {
      payload.EInvDtls = buildEInvoiceOptions(values, optionInitialValues);
    }
    if (showOptions && isStandaloneEWayBill) {
      payload.EwbDtls = { ...payload.EwbDtls, ...buildEWayBillOptions(values, optionInitialValues) };
    }
    if (config.editHsn) {
      payload.items = buildHsnUpdates(hsnForm.rows);
      payload.updateItemMaster = hsnForm.updateItemMaster;
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      const data = error?.data;
      if (!data?.isInvalidHsn) return;
      await onInvalidHsn?.();
      setHsnForm(prev => ({ ...prev, invalidHsnCodes: data.invalidHsnCodes || [] }));
    }
  };

  return (
    <CustomModal modalOpen={true} setModalOpen={onClose} title={config.title} width={720} destroyOnClose={true}>
      {optionsPending && <CustomLoader className="py-10" text="Loading details..." />}
      <Formik key={`${mode}-${optionsPending}`} initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ values, setFieldValue, handleSubmit: submitForm, errors, touched }) => {
          if (optionsPending) return null;
          const offerEWayBill = isEInvoice && allowEWayBillWithEInvoice;
          const showTransportFields = isEInvoice ? offerEWayBill && !hasActiveEWayBill && values.withEwb : true;

          return (
            <CustomForm name={config.formName} onFinish={submitForm} onFinishFailed={() => {}}>
              <div className="flex max-h-[72vh] flex-col">
                {/* Scrolling body; the footer below stays in view. */}
                <div className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1 pb-4">
                  <GstDocumentOptionFields
                    variant={config.optionVariant}
                    values={values}
                    errors={errors}
                    touched={touched}
                    setFieldValue={setFieldValue}
                    documentOptions={showOptions ? documentOptions.data : null}
                    initialValues={optionInitialValues}
                    showSupplyFields={isStandaloneEWayBill}
                    contextItems={contextItems}
                  />

                  {offerEWayBill &&
                    (hasActiveEWayBill ? (
                      <Alert type="info" showIcon message={`This ${documentLabel} already has an active e-way bill. Only the e-invoice (IRN) will be generated.`} />
                    ) : (
                      <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Also generate the e-way bill</p>
                          <p className="text-xs text-gray-500">Created from the same IRN using the transport details below.</p>
                        </div>
                        <div className="shrink-0">
                          <CustomInput type="switch" name="withEwb" value={Boolean(values.withEwb)} setFieldValue={setFieldValue} />
                        </div>
                      </div>
                    ))}

                  {showTransportFields && (
                    <GstFormSection title="Transport Details">
                      <EwbTransportFields
                        values={values}
                        errors={errors}
                        touched={touched}
                        setFieldValue={setFieldValue}
                        onFetchGstinDetails={onFetchGstinDetails}
                        fetchGstinLoading={fetchGstinLoading}
                      />
                    </GstFormSection>
                  )}

                  {config.editHsn && hsnForm.rows.length > 0 && (
                    <GstFormSection title="Items">
                      <HsnEditTable
                        rows={hsnForm.rows}
                        invalidHsnCodes={hsnForm.invalidHsnCodes}
                        updateItemMaster={hsnForm.updateItemMaster}
                        onRowsChange={rows => setHsnForm(prev => ({ ...prev, rows }))}
                        onUpdateItemMasterChange={updateItemMaster => setHsnForm(prev => ({ ...prev, updateItemMaster }))}
                      />
                    </GstFormSection>
                  )}
                </div>

                <div className="flex justify-end gap-5 border-t border-gray-100 pt-4">
                  <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={busy} onClick={onClose} />
                  <CustomButton className="px-8 py-4" type="primary" text={`Generate ${config.documentName}`} loading={loading} disabled={busy} onClick={submitForm} />
                </div>
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default GenerateGstDocumentModal;
