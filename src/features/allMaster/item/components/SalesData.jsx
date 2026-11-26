import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useItemMaster, addSalesData, salesDataValidateSchema } from '@/features/allMaster/item';
import { Spin } from '@/components/AntDComponent';
import { ADDITIONAL_FEATURES } from '@/utils/constants';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const mapToId = value => value?._id || value?.id || value;

const SalesData = ({ item }) => {
  const dispatch = useDispatch();
  const salesData = item?.salesData;
  const { IQCDrop } = useItemMaster();
  const { portalCustomers, getPortalCustomers, loading: portalCustomersLoading } = useCustomer();
  const { activeFeatures } = useProfile();
  const isCustomerOrderAppAvailable = !!activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const prevFormValuesRef = useRef(null);
  const initialValues = useMemo(
    () => ({
      beforeDispatchFromWarehouse: salesData ? salesData?.beforeDispatchFromWarehouse : false,
      customerPortalEnable: salesData ? salesData?.customerPortalEnable : false,
      specificCustomerEnable: salesData ? !!salesData?.specificCustomerEnable : false,
      specificCustomers: salesData?.specificCustomers?.length > 0 ? salesData.specificCustomers.map(mapToId) : [],
      fqlStander: salesData && salesData?.fqlStander?.length > 0 ? salesData.fqlStander.map(mapToId) : null,
      vendorSideMFGAndQCDocument: salesData?.vendorSideMFGAndQCDocument || [],
    }),
    [salesData]
  );

  const onFinish = async values => {
    const specificCustomerEnable = values.customerPortalEnable ? !!values.specificCustomerEnable : false;
    const specificCustomers = specificCustomerEnable ? values.specificCustomers || [] : [];

    const saleData = {
      beforeDispatchFromWarehouse: values.beforeDispatchFromWarehouse,
      customerPortalEnable: values.customerPortalEnable,
      specificCustomerEnable,
      specificCustomers,
      ...(values.beforeDispatchFromWarehouse && {
        fqlStander: values.beforeDispatchFromWarehouse ? values.fqlStander : [],
      }),
      vendorSideMFGAndQCDocument: values.vendorSideMFGAndQCDocument || [],
    };

    await dispatch(addSalesData(saleData));
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const dipatchOnFormChanges = useCallback(
    values => {
      if (JSON.stringify(values) !== JSON.stringify(prevFormValuesRef.current)) {
        const specificCustomerEnable = values.customerPortalEnable ? !!values.specificCustomerEnable : false;
        const specificCustomers = specificCustomerEnable ? values.specificCustomers || [] : [];

        const saleData = {
          beforeDispatchFromWarehouse: values.beforeDispatchFromWarehouse,
          customerPortalEnable: values.customerPortalEnable,
          specificCustomerEnable,
          specificCustomers,
          fqlStander: values.beforeDispatchFromWarehouse ? values.fqlStander : [],
          vendorSideMFGAndQCDocument: values.vendorSideMFGAndQCDocument || [],
        };
        dispatch(addSalesData(saleData));
        prevFormValuesRef.current = values;
      }
    },
    [dispatch]
  );

  useEffect(() => {
    prevFormValuesRef.current = initialValues;
  }, [initialValues]);

  useEffect(() => {
    if (!isCustomerOrderAppAvailable) return undefined;
    const controller = new AbortController();
    getPortalCustomers({ signal: controller.signal });
    return () => controller.abort();
  }, [getPortalCustomers, isCustomerOrderAppAvailable]);

  return (
    <div className="pb-28 relative ">
      <Formik initialValues={initialValues} validationSchema={salesDataValidateSchema} onSubmit={onFinish} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => {
          dipatchOnFormChanges(values);
          return (
            <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
              <div>
                <div className="flex items-center gap-x-4">
                  <div className="w-max">
                    <CustomInput
                      type="switch"
                      name="beforeDispatchFromWarehouse"
                      value={values.beforeDispatchFromWarehouse}
                      onChange={checked => {
                        setFieldValue('beforeDispatchFromWarehouse', checked);
                        if (!checked) {
                          setFieldValue('fqlStander', null);
                        }
                      }}
                      onBlur={handleBlur}
                      errorMessage={errors.beforeDispatchFromWarehouse}
                      touched={touched.beforeDispatchFromWarehouse}
                      setFieldValue={setFieldValue}
                    />
                  </div>
                  <div>Before Dispatch From Warehouse (FQC)</div>
                </div>

                {values.beforeDispatchFromWarehouse === true && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 pt-2">
                    <CustomInput
                      type="select"
                      name="fqlStander"
                      label="Select FQC Standard"
                      mode="multiple"
                      placeholder="Select FQC Standard"
                      value={values.fqlStander}
                      onBlur={handleBlur}
                      errorMessage={errors.fqlStander}
                      touched={touched.fqlStander}
                      setFieldValue={setFieldValue}
                      selectOptions={(IQCDrop || []).map(option => ({
                        label: option.qcReportName,
                        value: option._id,
                      }))}
                    />
                  </div>
                )}

                {isCustomerOrderAppAvailable && (
                  <div className="flex items-center gap-x-4 flex-wrap pt-2">
                    <div className="w-max">
                      <CustomInput
                        type="switch"
                        name="customerPortalEnable"
                        value={values.customerPortalEnable}
                        onChange={checked => {
                          setFieldValue('customerPortalEnable', checked);
                          if (!checked) {
                            setFieldValue('specificCustomers', []);
                          }
                        }}
                        onBlur={handleBlur}
                        errorMessage={errors.customerPortalEnable}
                        touched={touched.customerPortalEnable}
                        setFieldValue={setFieldValue}
                      />
                    </div>
                    <div>Enable Item For Customer Portal</div>
                    {values.customerPortalEnable === true && (
                      <div className="flex items-center gap-x-2 ml-4">
                        <div className="w-max">
                          <CustomInput
                            type="switch"
                            name="selectAllCustomers"
                            disabled={portalCustomersLoading}
                            value={!values.specificCustomerEnable}
                            onChange={checked => {
                              setFieldValue('specificCustomerEnable', !checked);
                              if (checked) {
                                setFieldValue('specificCustomers', []);
                              }
                            }}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                        <div>Select All Customers</div>
                      </div>
                    )}
                  </div>
                )}

                {isCustomerOrderAppAvailable && values.customerPortalEnable === true && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 items-end gap-x-7 pt-2">
                    <CustomInput
                      type="select"
                      name="specificCustomers"
                      label="Select Customers"
                      mode="multiple"
                      placeholder="Select Customers"
                      disabled={!values.specificCustomerEnable}
                      value={values.specificCustomers || []}
                      loading={portalCustomersLoading}
                      notFoundContent={
                        portalCustomersLoading ? (
                          <div className="flex justify-center py-2">
                            <Spin size="small" />
                          </div>
                        ) : null
                      }
                      onBlur={handleBlur}
                      setFieldValue={setFieldValue}
                      selectVariant="twoColumn"
                      columnSelectHeader={customerSelectColumnHeader}
                      selectOptions={buildCustomerSelectOptions(portalCustomers)}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-1 lg:grid-cols-3 lg:gap-x-7 items-start pt-2">
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
};

export default SalesData;
