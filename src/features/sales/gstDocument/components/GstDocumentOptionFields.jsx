import { useEffect, useState } from 'react';
import CustomButton from '@/components/ui/button/CustomButton';
import { DetailField } from '@/components/ui';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { SUB_SUPPLY_TYPE_OPTIONS, SUPPLY_TYPE_OPTIONS } from '@/utils/dropdownEnums';

const TRANSPORT_MODE_ROAD = '1';
const SUB_SUPPLY_TYPE_OTHERS = '8';
// Fields edited here; an error on any of them opens the editor so it is never hidden.
const DETAIL_FIELDS = ['supplyType', 'subSupplyType', 'subSupplyDesc', 'sellerTradeName', 'ecommerceGstin', 'poNumber', 'remarks', 'transDocNo', 'chargeHsn'];

const labelOf = (options = [], value) => options.find(option => option.value === value)?.label;

/**
 * "Details" block of the generate modal: a read-only summary of what will be filed, with an Edit link that opens the
 * fields. Every field starts at the value sent when the user changes nothing.
 * - `variant`: 'eInvoice' or 'eWayBill' (standalone).
 * - `documentOptions`: from the module's options API; null when the module offers no options.
 * Addresses are shown, not chosen: they come from the document, whose address decided the place of supply and tax.
 * - `showSupplyFields`: supply and sub supply type (standalone e-way bill only).
 * - `contextItems`: [{ label, value }] shown first in the strip, e.g. the document number and party name.
 */
const GstDocumentOptionFields = ({ variant, values, errors, touched, setFieldValue, documentOptions, showSupplyFields = false, contextItems = [] }) => {
  const isEInvoice = variant === 'eInvoice';
  const isEWayBill = variant === 'eWayBill';
  const hasOptions = Boolean(documentOptions);
  const charges = documentOptions?.additionalCharges || [];
  // A return shows no movement on its e-invoice, which always reads seller to buyer.
  const showMovement = hasOptions && Boolean(documentOptions.movement) && !(isEInvoice && documentOptions.eInvoiceShowsMovement === false);

  const [editing, setEditing] = useState(false);
  const isOpen = editing || DETAIL_FIELDS.some(field => Boolean(errors[field]));

  // NIC accepts only some document types per supply and sub supply type; offer just those.
  const allowedTypeValues = documentOptions?.documentTypeRules?.[values.supplyType]?.[values.subSupplyType];
  const documentTypeOptions = (documentOptions?.documentTypes || []).filter(type => !allowedTypeValues || allowedTypeValues.includes(type.value));

  // A supply change can make the chosen document type invalid; move to the first valid one.
  useEffect(() => {
    if (!isEWayBill || !allowedTypeValues?.length || allowedTypeValues.includes(values.documentType)) return;
    setFieldValue('documentType', allowedTypeValues[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check only when the supply choice changes
  }, [values.supplyType, values.subSupplyType]);

  const fieldProps = name => ({ name, value: values[name], errorMessage: errors[name], touched: touched[name], setFieldValue });

  const summary = [
    ...contextItems,
    showSupplyFields && {
      label: 'Supply',
      value: [
        labelOf(SUPPLY_TYPE_OPTIONS, values.supplyType),
        values.subSupplyType === SUB_SUPPLY_TYPE_OTHERS ? values.subSupplyDesc || 'Others' : labelOf(SUB_SUPPLY_TYPE_OPTIONS, values.subSupplyType),
      ]
        .filter(Boolean)
        .join(' · '),
    },
    isEWayBill &&
      hasOptions && {
        label: 'Document',
        value: labelOf(documentTypeOptions, values.documentType),
      },
    showMovement && { label: 'Dispatch from', value: documentOptions.movement.dispatchFrom },
    showMovement && { label: 'Ship to', value: documentOptions.movement.shipTo },
    isEInvoice && hasOptions && { label: 'PO reference', value: values.poNumber || 'None' },
    isEInvoice && hasOptions && { label: 'Trade name', value: values.sellerTradeName },
  ].filter(Boolean);

  if (!summary.length) return null;
  const canEdit = summary.length > contextItems.length;

  return (
    <section>
      <div className="mb-4 rounded-md border-b border-gray-100 bg-gray-50 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid flex-1 grid-cols-2 gap-x-10 gap-y-3 md:grid-cols-3">
            {summary.map(item => (
              <DetailField key={item.label} label={item.label} value={item.value} className="pr-0" />
            ))}
          </div>
          {canEdit && <CustomButton type="link" className="!h-auto !p-0" text={isOpen ? 'Done' : 'Edit details'} onClick={() => setEditing(open => !open)} />}
        </div>
      </div>

      {isOpen && (
        <div>
          {showSupplyFields && (
            <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
              <CustomInput type="select" label="Supply Type" placeholder="Select" options={SUPPLY_TYPE_OPTIONS} required {...fieldProps('supplyType')} />
              <CustomInput type="select" label="Sub Supply Type" placeholder="Select" options={SUB_SUPPLY_TYPE_OPTIONS} required {...fieldProps('subSupplyType')} />
              {values.subSupplyType === SUB_SUPPLY_TYPE_OTHERS && (
                <div className="md:col-span-2">
                  <CustomInput type="text" label="Sub Supply Description" placeholder="Enter description" maxLength={20} required {...fieldProps('subSupplyDesc')} />
                </div>
              )}
            </div>
          )}

          {isEWayBill && hasOptions && (
            <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
              <CustomInput type="select" label="Document Type" placeholder="Select" options={documentTypeOptions} {...fieldProps('documentType')} />
            </div>
          )}

          {isEWayBill && hasOptions && values.transMode === TRANSPORT_MODE_ROAD && (
            <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
              <CustomInput type="text" label="LR No." placeholder="Enter LR number" maxLength={15} {...fieldProps('transDocNo')} />
              <CustomInput type="date" label="LR Date" placeholder="Select date" format="DD/MM/YYYY" className="rounded" {...fieldProps('transDocDate')} value={values.transDocDate || null} />
            </div>
          )}

          {isEInvoice && hasOptions && (
            <>
              <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                <CustomInput type="text" label="PO Number" placeholder="Enter PO number" maxLength={16} {...fieldProps('poNumber')} />
                <CustomInput type="date" label="PO Date" placeholder="Select date" format="DD/MM/YYYY" className="rounded" {...fieldProps('poDate')} value={values.poDate || null} />
              </div>
              <CustomInput type="text" label="Remarks" placeholder="Shown on the e-invoice" maxLength={100} {...fieldProps('remarks')} />
              <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                <CustomInput type="text" label="Seller Trade Name" placeholder="Enter trade name" maxLength={100} {...fieldProps('sellerTradeName')} />
                <CustomInput
                  type="text"
                  label="E-Commerce Operator GSTIN"
                  placeholder="Only for e-commerce sales"
                  maxLength={15}
                  {...fieldProps('ecommerceGstin')}
                  onChange={e => setFieldValue('ecommerceGstin', e.target.value.toUpperCase())}
                />
              </div>
            </>
          )}

          {charges.length > 0 && (
            <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
              {charges.map(charge => (
                <CustomInput
                  key={charge.index}
                  type="text"
                  name={`chargeHsn.${charge.index}`}
                  label={`SAC for ${charge.name}`}
                  placeholder="HSN / SAC"
                  maxLength={8}
                  value={values.chargeHsn?.[charge.index] || ''}
                  errorMessage={errors.chargeHsn?.[charge.index]}
                  touched={touched.chargeHsn?.[charge.index] ?? true}
                  onChange={e => setFieldValue(`chargeHsn.${charge.index}`, e.target.value.replace(/\D/g, ''))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default GstDocumentOptionFields;
