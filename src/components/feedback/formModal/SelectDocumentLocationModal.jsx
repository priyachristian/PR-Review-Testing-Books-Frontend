// React
import { useEffect } from 'react';

// Third Party
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomModal from './CustomModal';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomButton from '@/components/ui/button/CustomButton';

// Redux
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Utils
import { resolveConversionLocationNames } from 'hooks/useConvert';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const INITIAL_VALUES = { divisionId: '', branchId: '', warehouseId: '' };

const validateLocation = values => {
  const errors = {};
  if (!values.divisionId) errors.divisionId = 'Division is required';
  if (!values.branchId) errors.branchId = 'Branch is required';
  if (!values.warehouseId) errors.warehouseId = 'Warehouse is required';
  return errors;
};

/**
 * Asks for division, branch and warehouse before converting a document into another one.
 * onSubmit receives { divisionId, branchId, warehouseId, divisionName, branchName, warehouseName }.
 * summary: [{ label, value }] shown in the header card (e.g. document no and customer name).
 */
const SelectDocumentLocationModal = ({ open, onClose, onSubmit, title, submitText, resource, summary = [], loading = false }) => {
  const dispatch = useDispatch();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, warehouseDrop, warehouseLoading, getWarehouseDrop } = useModulePermissions(resource);

  useEffect(() => {
    if (!open) {
      dispatch(resetBranch());
      return;
    }
    const controller = new AbortController();
    getDivDropDown({ signal: controller.signal });
    return () => controller.abort();
  }, [open, getDivDropDown, dispatch]);

  return (
    <CustomModal
      modalOpen={open}
      setModalOpen={isOpen => {
        if (!isOpen) onClose();
      }}
      title={title}
      width={600}
      destroyOnClose={true}
    >
      {summary.length > 0 && (
        <div className="bg-[#fafafa] mb-5 rounded-md p-4 border-b border-gray-100 shadow-sm">
          <div className="flex gap-10">
            {summary.map(({ label, value }) => (
              <div key={label}>
                <p>{label}</p>
                <p className="font-semibold max-w-[350px]">{value || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Formik
        initialValues={INITIAL_VALUES}
        validate={validateLocation}
        onSubmit={values => {
          const locationNames = resolveConversionLocationNames(values, { divDrop, branchDrop, warehouseDrop });
          onSubmit({ ...values, ...locationNames });
        }}
      >
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
          <CustomForm name="select-document-location" onFinish={handleSubmit}>
            <div className="space-y-2">
              <div>
                <CustomInput
                  type="select"
                  name="divisionId"
                  label="Division"
                  placeholder="Select Division"
                  value={values.divisionId}
                  onBlur={handleBlur}
                  errorMessage={errors.divisionId}
                  touched={touched.divisionId}
                  setFieldValue={setFieldValue}
                  loading={divisionLoading}
                  selectVariant="twoColumn"
                  columnSelectHeader={divisionSelectColumnHeader}
                  selectOptions={buildDivisionSelectOptions(divDrop)}
                  onChange={val => {
                    setFieldValue('divisionId', val);
                    setFieldValue('branchId', null);
                    setFieldValue('warehouseId', null);
                    if (val) {
                      getBranchDropDown({ divisionId: [val] });
                    } else {
                      dispatch(resetBranch());
                    }
                  }}
                  allowClear
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="select"
                  name="branchId"
                  label="Branch"
                  placeholder="Select Branch"
                  value={values.branchId}
                  onBlur={handleBlur}
                  errorMessage={errors.branchId}
                  touched={touched.branchId}
                  setFieldValue={setFieldValue}
                  loading={branchLoading}
                  selectVariant="twoColumn"
                  columnSelectHeader={branchSelectColumnHeader}
                  selectOptions={buildBranchSelectOptions(branchDrop)}
                  onChange={val => {
                    setFieldValue('branchId', val);
                    setFieldValue('warehouseId', null);
                    if (val) {
                      getWarehouseDrop({ branchId: val });
                    }
                  }}
                  disabled={!values.divisionId}
                  allowClear
                  required={true}
                />
              </div>

              <div>
                <CustomInput
                  type="select"
                  name="warehouseId"
                  label="Warehouse"
                  placeholder="Select Warehouse"
                  value={values.warehouseId}
                  onBlur={handleBlur}
                  errorMessage={errors.warehouseId}
                  touched={touched.warehouseId}
                  setFieldValue={setFieldValue}
                  selectVariant="twoColumn"
                  columnSelectHeader={warehouseSelectColumnHeader}
                  selectOptions={buildWarehouseSelectOptions((warehouseDrop || []).filter(warehouse => warehouse?.branchId?.id === values?.branchId))}
                  disabled={!values.branchId}
                  loading={warehouseLoading}
                  allowClear
                  required={true}
                />
              </div>
            </div>

            <div className="flex mt-5 gap-5 justify-end">
              <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={loading} onClick={onClose} />
              <CustomButton className="px-8 py-4" type="primary" text={submitText} loading={loading} onClick={handleSubmit} style={{ minWidth: 180 }} />
            </div>
          </CustomForm>
        )}
      </Formik>
    </CustomModal>
  );
};

export default SelectDocumentLocationModal;
