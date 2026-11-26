import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';

// Extras
import { addPurchasing, purchasingDataValidateSchema } from '@/features/allMaster/item';

const PurchasingData = React.memo(({ item }) => {
  const dispatch = useDispatch();
  const purchasing = item?.purchasingData;
  const prevFormValuesRef = useRef(null);

  const initialValues = useMemo(
    () => ({
      TimeBatchPriceOnDocument: purchasing ? purchasing?.timeBatchNumberMandatory?.printOnDocument : false,
      TimeBatchActiveInactive: purchasing ? purchasing?.timeBatchNumberMandatory?.activeInactive : false,
      PunchingPriceOnDocument: purchasing ? purchasing?.punchingTimeBatchNumberMandatory?.printOnDocument : false,
      PunchingActiveInactive: purchasing ? purchasing?.punchingTimeBatchNumberMandatory?.activeInactive : false,
      vendorSideMFGAndQCDocument: purchasing?.vendorSideMFGAndQCDocument || [],
    }),
    [purchasing]
  );

  // Comprehensive hook that handles all dirty form logic
  const { updateFormValues } = useFormDirtyState(initialValues);

  const onFinish = async values => {
    const purchasingData = {
      timeBatchNumberMandatory: {
        printOnDocument: values.TimeBatchPriceOnDocument,
        activeInactive: values.TimeBatchActiveInactive,
      },
      punchingTimeBatchNumberMandatory: {
        printOnDocument: values.PunchingPriceOnDocument,
        activeInactive: values.PunchingActiveInactive,
      },
      vendorSideMFGAndQCDocument: values.vendorSideMFGAndQCDocument || [],
    };
    await dispatch(addPurchasing(purchasingData));
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const dipatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        const purchasingData = {
          timeBatchNumberMandatory: {
            printOnDocument: values.TimeBatchPriceOnDocument,
            activeInactive: values.TimeBatchActiveInactive,
          },
          punchingTimeBatchNumberMandatory: {
            printOnDocument: values.PunchingPriceOnDocument,
            activeInactive: values.PunchingActiveInactive,
          },
          vendorSideMFGAndQCDocument: values.vendorSideMFGAndQCDocument || [],
        };
        dispatch(addPurchasing(purchasingData));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, [initialValues]);

  return (
    <div className="pb-28 relative">
      <Formik initialValues={initialValues} validationSchema={purchasingDataValidateSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
          dipatchOnFormChanges(values);
          // Update form values for dirty checking
          updateFormValues(values);
          return (
            <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div>
                <div className="pt-2">
                  <div className="grid grid-cols-5">
                    <div className="col-span-3"></div>
                    <div className="text-center">Active / Inactive</div>
                    <div className="text-center">Print On Document</div>
                  </div>
                  <div className="grid grid-cols-5 items-center py-1">
                    <div className="col-span-3 flex items-center gap-x-3">
                      <ul className="list-disc list-inside">
                        <li>GRPO / AP Invoice Time Batch Number Mandatory Self & MFG</li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <CustomInput
                        type="checkbox"
                        name="TimeBatchActiveInactive"
                        value={values.TimeBatchActiveInactive}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.TimeBatchActiveInactive}
                        touched={touched.TimeBatchActiveInactive}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                    <div className="text-center">
                      <CustomInput
                        type="checkbox"
                        name="TimeBatchPriceOnDocument"
                        value={values.TimeBatchPriceOnDocument}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.TimeBatchPriceOnDocument}
                        touched={touched.TimeBatchPriceOnDocument}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 items-center py-1">
                    <div className="col-span-3 flex items-center gap-x-3">
                      <ul className="list-disc list-inside">
                        <li>GRPO / AP Invoice Punching Time Batch Expiry Mandatory Self & MFG</li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <CustomInput
                        type="checkbox"
                        name="PunchingActiveInactive"
                        value={values.PunchingActiveInactive}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.PunchingActiveInactive}
                        touched={touched.PunchingActiveInactive}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                    <div className="text-center">
                      <CustomInput
                        type="checkbox"
                        name="PunchingPriceOnDocument"
                        value={values.PunchingPriceOnDocument}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        errorMessage={errors.PunchingPriceOnDocument}
                        touched={touched.PunchingPriceOnDocument}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-1 lg:grid-cols-3 items-start lg:gap-x-7 pt-2">
                  <CustomFileUpload
                    name="vendorSideMFGAndQCDocument"
                    label="Vendor Side MFG & Document"
                    value={values.vendorSideMFGAndQCDocument}
                    setFieldValue={setFieldValue}
                    onBlur={handleBlur}
                    errorMessage={errors.vendorSideMFGAndQCDocument}
                    touched={touched.vendorSideMFGAndQCDocument}
                    fileType="all"
                    multiple={true}
                    maxSize={5}
                    maxFiles={3}
                  />
                </div>
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </div>
  );
});

PurchasingData.displayName = 'PurchasingData';

export default PurchasingData;
