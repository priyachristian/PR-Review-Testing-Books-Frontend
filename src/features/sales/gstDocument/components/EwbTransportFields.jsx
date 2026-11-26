import { useState } from 'react';
import CustomInput from '@/components/forms/formInput/CustomInput';
import { TRANSPORT_MODE_OPTIONS, VEHICLE_TYPE_OPTIONS } from '@/utils/dropdownEnums';

const TRANSPORTER_GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Document number and date pairs required by each non-road transport mode.
const TRANSPORT_DOCUMENT_FIELDS = {
  2: { noName: 'rrNo', noLabel: 'Railway Receipt (RR) No.', dateName: 'rrDate', dateLabel: 'RR Date' },
  3: { noName: 'awbNo', noLabel: 'Airway Bill (AWB) No.', dateName: 'awbDate', dateLabel: 'AWB Date' },
  4: { noName: 'blNo', noLabel: 'Bill of Lading (BL) No.', dateName: 'blDate', dateLabel: 'BL Date' },
};

/**
 * Transport section shared by every e-way bill form (linked to an IRN, standalone, or inside the e-invoice form).
 * Expects the Formik values described by EWB_TRANSPORT_INITIAL_VALUES.
 */
const EwbTransportFields = ({ values, errors, touched, setFieldValue, onFetchGstinDetails, fetchGstinLoading = false }) => {
  const [transporterError, setTransporterError] = useState('');
  const transportDocument = TRANSPORT_DOCUMENT_FIELDS[values.transMode];
  const isNotDecided = !values.transMode;

  const handleTransporterIdChange = async e => {
    const value = (e.target.value || '').toUpperCase().replace(/\s/g, '');
    setFieldValue('transporterId', value);
    setTransporterError('');
    setFieldValue('transporterName', '');

    if (!value || !TRANSPORTER_GSTIN_REGEX.test(value) || !onFetchGstinDetails) return;
    const result = await onFetchGstinDetails(value);
    if (result?.error) {
      setTransporterError(result.error);
    } else if (result?.name) {
      setFieldValue('transporterName', result.name);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <CustomInput
          type="select"
          errorMessage={errors.transMode}
          touched={touched.transMode}
          name="transMode"
          label="Mode of Transport"
          value={values.transMode || null}
          setFieldValue={setFieldValue}
          options={TRANSPORT_MODE_OPTIONS}
          placeholder="Not decided"
          allowClear
        />
        <CustomInput
          type="number"
          errorMessage={errors.distance}
          touched={touched.distance}
          name="distance"
          label="Distance (km)"
          placeholder="0 to auto-calculate"
          value={values.distance}
          setFieldValue={setFieldValue}
          min={0}
          max={4000}
          required
        />

        {values.transMode === '1' && (
          <>
            <CustomInput
              type="text"
              errorMessage={errors.vehNo}
              touched={touched.vehNo}
              name="vehNo"
              label="Vehicle Number"
              placeholder="e.g. MH12AB1234"
              value={values.vehNo}
              onChange={e => setFieldValue('vehNo', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={15}
              required
            />
            <CustomInput
              type="select"
              errorMessage={errors.vehType}
              touched={touched.vehType}
              name="vehType"
              label="Vehicle Type"
              value={values.vehType}
              setFieldValue={setFieldValue}
              options={VEHICLE_TYPE_OPTIONS}
              placeholder="Select vehicle type"
              required
            />
          </>
        )}

        {transportDocument && (
          <>
            <CustomInput
              type="text"
              errorMessage={errors[transportDocument.noName]}
              touched={touched[transportDocument.noName]}
              name={transportDocument.noName}
              label={transportDocument.noLabel}
              placeholder={`Enter ${transportDocument.noLabel}`}
              value={values[transportDocument.noName]}
              setFieldValue={setFieldValue}
              maxLength={20}
              required
            />
            <CustomInput
              type="date"
              errorMessage={errors[transportDocument.dateName]}
              touched={touched[transportDocument.dateName]}
              name={transportDocument.dateName}
              label={transportDocument.dateLabel}
              value={values[transportDocument.dateName] || null}
              setFieldValue={setFieldValue}
              format="DD/MM/YYYY"
              placeholder="Select date"
              className="rounded"
              required
            />
          </>
        )}

        <CustomInput
          type="text"
          errorMessage={transporterError || errors.transporterId}
          touched={touched.transporterId || Boolean(transporterError)}
          name="transporterId"
          label="Transporter ID (GSTIN)"
          placeholder={isNotDecided ? 'Required when mode is not decided' : 'Optional'}
          value={values.transporterId}
          setFieldValue={setFieldValue}
          required={isNotDecided}
          onChange={handleTransporterIdChange}
        />
        <CustomInput
          type="text"
          errorMessage={errors.transporterName}
          touched={touched.transporterName}
          name="transporterName"
          label="Transporter Name"
          placeholder="Filled from the GSTIN"
          value={values.transporterName}
          setFieldValue={setFieldValue}
          required={isNotDecided}
          disabled={!values.transporterId || fetchGstinLoading}
        />
      </div>
    </div>
  );
};

export default EwbTransportFields;
