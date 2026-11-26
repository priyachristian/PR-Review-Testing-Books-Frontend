// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Third Party
import { useLocation, useParams } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import SampleCatalogItemTable from '../components/SampleCatalogItemTable';
import SampleCatalogPortalActivationModal from '../components/SampleCatalogPortalActivationModal';
import { Tooltip } from '@/components/AntDComponent';

// Hooks
import useFormDirtyState from '@/hooks/useFormDirtyState';
import useScrollToError from 'hooks/useScrollToError';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useItemMaster } from '@/features/allMaster/item';
import { useCustomer } from '@/features/sales/customer';
import { useSampleCatalogs, sampleCatalogValidateSchema } from '@/features/sales/sampleCatalog';
import { buildCatalogFormValues, toCatalogPayload } from '@/features/sales/sampleCatalog/sampleCatalog.utils';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { errorsToTouched } from '@/utils/util';
import { colorPalette } from '@/utils/theme';
import { MODULE_NAMES, SAMPLE_CATALOG_VISIBILITY } from '@/utils/constants';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { buildCustomerSelectOptions, customerSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const VISIBILITY_OPTIONS = Object.entries(SAMPLE_CATALOG_VISIBILITY).map(([value, label]) => ({ value, label }));

const AddSampleCatalog = () => {
  const { sampleCatalogId } = useParams();
  const location = useLocation();
  const formikRef = useRef();
  const scrollToError = useScrollToError();

  const { sampleCatalog, loading, submitLoading, getSampleCatalogById, createSampleCatalog, updateSampleCatalog, resetSampleCatalog } = useSampleCatalogs();
  const { allItemDrop, allItemDropLoading, getAllItemDrop } = useItemMaster();
  // Only customers with portal access can see a catalog, so the picker lists portal customers.
  const { portalCustomers, loading: customerLoading, getPortalCustomers } = useCustomer();

  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig } = useModuleConfig();
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [codeConfig, setCodeConfig] = useState({ autoGenerate: true, prefix: '', nextNumber: '' });

  const findMaster = useCallback(itemId => (allItemDrop || []).find(item => item?._id === itemId || item?.id === itemId) || null, [allItemDrop]);

  const initialValues = useMemo(() => buildCatalogFormValues(sampleCatalogId ? sampleCatalog : null, findMaster), [sampleCatalogId, sampleCatalog, findMaster]);
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, []);

  useEffect(() => {
    const controller = new AbortController();
    getAllItemDrop({ signal: controller.signal, isSellable: true });
    getPortalCustomers({ signal: controller.signal });
    return () => controller.abort();
  }, [getAllItemDrop, getPortalCustomers]);

  useEffect(() => {
    const controller = new AbortController();
    getModuleConfig({ signal: controller.signal, moduleName: MODULE_NAMES.SAMPLE_CATALOG });
    return () => controller.abort();
  }, [getModuleConfig]);

  useEffect(() => {
    if (moduleConfig) {
      setCodeConfig({ autoGenerate: moduleConfig?.useCustomPrefix ?? true, prefix: moduleConfig?.prefix ?? '', nextNumber: moduleConfig?.nextSequence ?? '' });
    }
  }, [moduleConfig]);

  // Preview of the next code on create; the backend assigns the real one on save.
  useEffect(() => {
    if (!sampleCatalogId) formikRef.current?.setFieldValue('catalogCode', codeConfig.autoGenerate ? `${codeConfig.prefix}${codeConfig.nextNumber}` : '');
  }, [codeConfig, sampleCatalogId]);

  useEffect(() => {
    const controller = new AbortController();
    if (sampleCatalogId) getSampleCatalogById({ sampleCatalogId, signal: controller.signal });
    return () => {
      controller.abort();
      resetSampleCatalog();
    };
  }, [sampleCatalogId, getSampleCatalogById, resetSampleCatalog]);

  // { catalogData, activation } while waiting for the user to confirm turning items on in the portal.
  const [pendingPortalActivation, setPendingPortalActivation] = useState(null);

  const saveCatalog = async catalogData => {
    try {
      const result = sampleCatalogId ? await updateSampleCatalog({ sampleCatalogId, catalogData }) : await createSampleCatalog(catalogData);
      if (result?.activationRequired) {
        setPendingPortalActivation({ catalogData, activation: result.activationRequired });
        return;
      }
      setPendingPortalActivation(null);
      const targetId = sampleCatalogId || result?.data?.id;
      navigateAfterSave(targetId ? `/${ADMIN_ROUTE_PATHS.sampleCatalogs.build.detail(targetId)}` : -1, {
        state: { prevFrom: location.pathname, historyStack: [...(location.state?.historyStack || []), location.pathname] },
      });
    } catch {
      // The slice already shows the backend message.
    }
  };

  const onSubmit = async values => {
    if (submitLoading) return;
    await saveCatalog({ ...toCatalogPayload(values), ...(!sampleCatalogId && { catalogCode: values.catalogCode }) });
  };

  const handleSave = async setTouched => {
    const errors = await formikRef.current.validateForm();
    if (Object.keys(errors).length > 0) {
      setTouched(errorsToTouched(errors));
      scrollToError(Object.keys(errors)[0], errors);
      return;
    }
    formikRef.current.handleSubmit();
  };

  if (sampleCatalogId && loading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <BackButton />
          <h1 className="text-[18px] font-semibold text-gray-900">{sampleCatalogId ? 'Edit Sample Catalog' : 'Add Sample Catalog'}</h1>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik
            innerRef={formikRef}
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={sampleCatalogValidateSchema(codeConfig.autoGenerate || Boolean(sampleCatalogId))}
            onSubmit={onSubmit}
          >
            {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue, setTouched }) => {
              updateFormValues(values);
              return (
                <CustomForm name="sample-catalog" onFinish={handleSubmit}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Catalog details</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start">
                        <CustomInput
                          type="text"
                          name="catalogCode"
                          label="Catalog Code"
                          placeholder="Enter Catalog Code"
                          value={values.catalogCode}
                          onChange={e => setFieldValue('catalogCode', e.target.value)}
                          onBlur={handleBlur}
                          errorMessage={errors.catalogCode}
                          touched={touched.catalogCode}
                          setFieldValue={setFieldValue}
                          disabled={codeConfig.autoGenerate || Boolean(sampleCatalogId)}
                          suffix={
                            !sampleCatalogId && (
                              <Tooltip title="Configure Catalog Code">
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={() => setIsConfigModalVisible(true)} />
                              </Tooltip>
                            )
                          }
                          required
                        />
                        <CustomInput
                          type="text"
                          name="name"
                          label="Catalog Name"
                          placeholder="Enter Catalog Name"
                          value={values.name}
                          onChange={e => setFieldValue('name', e.target.value)}
                          onBlur={handleBlur}
                          errorMessage={errors.name}
                          touched={touched.name}
                          setFieldValue={setFieldValue}
                          required
                        />
                        <CustomInput
                          type="date"
                          name="startDate"
                          label="Start Date"
                          value={values.startDate}
                          errorMessage={errors.startDate}
                          touched={touched.startDate}
                          setFieldValue={setFieldValue}
                          format="DD/MM/YYYY"
                        />
                        <CustomInput
                          type="date"
                          name="endDate"
                          label="End Date"
                          value={values.endDate}
                          errorMessage={errors.endDate}
                          touched={touched.endDate}
                          setFieldValue={setFieldValue}
                          format="DD/MM/YYYY"
                        />
                        <CustomInput
                          type="textarea"
                          name="description"
                          label="Description"
                          placeholder="Enter Description"
                          value={values.description}
                          onBlur={handleBlur}
                          errorMessage={errors.description}
                          touched={touched.description}
                          setFieldValue={setFieldValue}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">Visibility</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-4 items-start">
                        <CustomInput
                          type="radio"
                          name="visibility"
                          label="Visible To"
                          value={values.visibility}
                          radioOptions={VISIBILITY_OPTIONS}
                          setFieldValue={setFieldValue}
                          onChange={e => {
                            if (e.target.value !== 'SELECTED_CUSTOMERS') setFieldValue('customerIds', []);
                          }}
                          required
                        />
                        {values.visibility === 'SELECTED_CUSTOMERS' && (
                          <CustomInput
                            type="select"
                            mode="multiple"
                            name="customerIds"
                            label="Selected Customers"
                            placeholder="Select Customers"
                            value={values.customerIds}
                            onChange={value => setFieldValue('customerIds', value)}
                            setFieldValue={setFieldValue}
                            errorMessage={errors.customerIds}
                            touched={touched.customerIds}
                            selectVariant="twoColumn"
                            columnSelectHeader={customerSelectColumnHeader}
                            selectOptions={buildCustomerSelectOptions(portalCustomers)}
                            notFoundContent={<div className="flex items-center justify-center w-full">No Customer With Portal Access Available</div>}
                            loading={customerLoading}
                            maxTagCount="responsive"
                            allowClear
                            required
                          />
                        )}
                      </div>
                    </div>

                    <SampleCatalogItemTable
                      values={values}
                      errors={errors}
                      touched={touched}
                      setFieldValue={setFieldValue}
                      handleBlur={handleBlur}
                      itemsDrop={allItemDrop}
                      itemsDropLoading={allItemDropLoading}
                      findMaster={findMaster}
                    />
                  </div>

                  <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-5 flex-wrap">
                      <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" loading={submitLoading} disabled={submitLoading} onClick={() => handleSave(setTouched)} />
                      <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={() => handleNavigation(-1)} />
                    </div>
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
          <CodeConfigModal
            isVisible={isConfigModalVisible}
            onCancel={() => setIsConfigModalVisible(false)}
            loading={moduleConfigLoading}
            initialConfig={codeConfig}
            title="Configure Sample Catalog Code Preferences"
            description="Auto-generating catalog codes can save your time. Would you like to change your current setting?"
            setConfigDetail={setCodeConfig}
            moduleName={MODULE_NAMES.SAMPLE_CATALOG}
          />
        </div>
      </div>
      <SampleCatalogPortalActivationModal
        activation={pendingPortalActivation?.activation}
        loading={submitLoading}
        onConfirm={() => saveCatalog({ ...pendingPortalActivation.catalogData, activateItemPortal: true })}
        onCancel={() => setPendingPortalActivation(null)}
      />
    </>
  );
};

export default AddSampleCatalog;
