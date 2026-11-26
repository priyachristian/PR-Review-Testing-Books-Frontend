import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import BackButton from '@/components/ui/button/BackButton';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useModulePermissions from 'hooks/useModulePermissions';
import useScrollToError from 'hooks/useScrollToError';

// Extras
import { useWarehouse, resetBranch, warehouseValidateSchema } from '@/features/allMaster/warehouse';
import WarehouseAddressFields from '@/features/allMaster/warehouse/components/WarehouseAddressFields';
import { RESOURCES } from '@/utils/jsonFile';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { errorsToTouched } from '@/utils/util';

const AddWarehouse = () => {
  const location = useLocation();
  const { wrhId } = useParams();
  const dispatch = useDispatch();
  const { loading, submitLoading, singleWarehouse, createWarehouse, updateWarehouse, resetWarehouse, getWarehouseById } = useWarehouse();
  const { divDrop, getDivDropDown, divisionLoading, branchDrop, getBranchDropDown, branchLoading } = useModulePermissions(RESOURCES.WAREHOUSE_MASTER);
  const warehouseData = useMemo(() => singleWarehouse || {}, [singleWarehouse]);
  const [selectedDivisionId, setSelectedDivisionId] = useState(warehouseData?.divisionId?.id || '');
  const formikRef = useRef();
  const scrollToError = useScrollToError();

  const initialValues = useMemo(
    () => ({
      divisionName: warehouseData?.divisionId?.id || null,
      branchName: warehouseData?.branchId?.id || null,
      name: warehouseData?.name || '',
      street1: warehouseData?.address?.street1 || '',
      street2: warehouseData?.address?.street2 || '',
      country: warehouseData?.address?.country || '',
      state: warehouseData?.address?.state || null,
      city: warehouseData?.address?.city || '',
      pinCode: warehouseData?.address?.pinCode || '',
    }),
    [warehouseData]
  );

  // Comprehensive hook that handles all dirty form logic
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues);

  useEffect(() => {
    if (wrhId) return;
    const controller = new AbortController();
    getDivDropDown({ signal: controller.signal });
    return () => controller.abort();
  }, [wrhId]);

  useEffect(() => {
    if (wrhId) return;
    const controller = new AbortController();
    if (selectedDivisionId) {
      const payload = { divisionId: selectedDivisionId, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [selectedDivisionId, wrhId]);

  useEffect(() => {
    const controller = new AbortController();
    if (wrhId) {
      getWarehouseById({ warehouseId: wrhId, signal: controller.signal });
    } else {
      resetWarehouse();
    }
    return () => {
      resetWarehouse();
      controller.abort();
    };
  }, [wrhId]);

  useEffect(() => {
    if (warehouseData) {
      setSelectedDivisionId(warehouseData?.divisionId?.id || '');
    }
  }, [warehouseData]);

  const onFinish = async values => {
    if (submitLoading) return;
    const warehousePayload = {
      ...(!wrhId && { branchId: values.branchName }),
      ...(!wrhId && { divisionId: values.divisionName }),
      name: values.name,
      address: {
        street1: values.street1 || '',
        street2: values.street2 || '',
        country: values.country || '',
        state: values.state || '',
        city: values.city || '',
        pinCode: values.pinCode?.trim() || '',
      },
    };

    const result = wrhId ? await updateWarehouse({ warehouseId: wrhId, warehouseData: warehousePayload }) : await createWarehouse(warehousePayload);
    const targetId = wrhId || result?.data?.id || result?.data?._id;

    if (targetId) {
      navigateAfterSave(`/warehouse-master/${targetId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    handleNavigation(-1);
  };

  if (wrhId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold text-gray-900">{wrhId ? 'Edit Warehouse' : 'Add Warehouse'}</h1>
              {wrhId && warehouseData?.warehouseId ? (
                <span className="inline-flex items-center rounded-md bg-blue-50 text-primary border border-blue-200 px-2 py-1 text-xs font-medium">{warehouseData.warehouseId}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik innerRef={formikRef} enableReinitialize={true} initialValues={initialValues} validationSchema={warehouseValidateSchema} onSubmit={onFinish}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
              // Update form values for dirty checking
              updateFormValues(values);

              return (
                <CustomForm name="adddivision" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Warehouse details</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 md:gap-y-4">
                        {!wrhId ? (
                          <CustomInput
                            type="select"
                            name="divisionName"
                            label="Division Name"
                            placeholder="Select Division"
                            value={values.divisionName}
                            onBlur={handleBlur}
                            errorMessage={errors.divisionName}
                            touched={touched.divisionName}
                            setFieldValue={setFieldValue}
                            disabled={!!wrhId}
                            required={true}
                            selectVariant="twoColumn"
                            columnSelectHeader={divisionSelectColumnHeader}
                            selectOptions={buildDivisionSelectOptions(divDrop)}
                            onChange={e => {
                              setFieldValue('divisionName', e, false);
                              setSelectedDivisionId(e);
                              setFieldValue('branchName', '', false);
                              dispatch(resetBranch());
                            }}
                            loading={divisionLoading}
                          />
                        ) : (
                          <CustomInput type="text" name="divisionName" label="Division Name" value={warehouseData?.divisionId?.name} disabled />
                        )}
                        {!wrhId ? (
                          <CustomInput
                            type="select"
                            name="branchName"
                            label="Branch Name"
                            placeholder="Select Branch"
                            value={values.branchName}
                            onBlur={handleBlur}
                            errorMessage={errors.branchName}
                            touched={touched.branchName}
                            setFieldValue={setFieldValue}
                            required={true}
                            disabled={!!wrhId}
                            selectVariant="twoColumn"
                            columnSelectHeader={branchSelectColumnHeader}
                            selectOptions={buildBranchSelectOptions(branchDrop)}
                            onChange={e => {
                              setFieldValue('branchName', e, false);
                            }}
                            loading={branchLoading}
                          />
                        ) : (
                          <CustomInput type="text" name="branchName" label="Branch Name" value={warehouseData?.branchId?.name} disabled />
                        )}
                        <CustomInput
                          type="text"
                          name="name"
                          label="Warehouse Name"
                          placeholder="Enter warehouse name"
                          required={true}
                          value={values.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.name}
                          touched={touched.name}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>
                    <WarehouseAddressFields values={values} errors={errors} touched={touched} handleChange={handleChange} handleBlur={handleBlur} setFieldValue={setFieldValue} />
                  </div>
                  <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)] z-10">
                    <CustomButton
                      className="px-8 py-4 min-w-[50px]"
                      type="primary"
                      text="Save"
                      loading={submitLoading}
                      onClick={async () => {
                        let errors = await formikRef.current.validateForm();

                        if (Object.keys(errors).length > 0) {
                          setTouched(errorsToTouched(errors));
                          const firstErrorField = Object.keys(errors)[0];
                          scrollToError(firstErrorField, errors);
                          return;
                        }
                        handleSubmit();
                      }}
                    />
                    <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default AddWarehouse;
