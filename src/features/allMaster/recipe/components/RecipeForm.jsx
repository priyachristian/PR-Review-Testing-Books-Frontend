import { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput, { CustomLabel } from '@/components/forms/formInput/CustomInput';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import { useProcess } from '@/features/allMaster/process';
import { useModuleConfig } from '@/hooks/useModuleConfig';

// Extras
import { useRecipe, recipeValidateSchema } from '@/features/allMaster/recipe';
import { MODULE_NAMES } from '@/utils/constants';
import Icons from 'assets/icons/icon';

const RecipeForm = ({ modalOpen, isEdit, handleModalClose, editingRecipe, onFormSubmit }) => {
  const { processDrop, getProcessDropdown, resetProcessDrop, loading: processDropLoading } = useProcess();
  const { moduleConfig, getModuleConfig } = useModuleConfig();
  const { loading, addRecipe, updateRecipe } = useRecipe();
  const [draggedItem, setDraggedItem] = useState();
  const [recipeConfig, setRecipeConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });

  useEffect(() => {
    getProcessDropdown();

    return () => {
      resetProcessDrop();
    };
  }, [getProcessDropdown, resetProcessDrop]);

  useEffect(() => {
    if (!modalOpen || isEdit) return;
    const controller = new AbortController();
    getModuleConfig({
      signal: controller.signal,
      moduleName: MODULE_NAMES.RECIPE,
    });
    return () => controller.abort();
  }, [modalOpen, isEdit, getModuleConfig]);

  useEffect(() => {
    if (!moduleConfig) return;
    setRecipeConfig({
      autoGenerate: moduleConfig?.useCustomPrefix ?? true,
      prefix: moduleConfig?.prefix ?? '',
      nextNumber: moduleConfig?.nextSequence ?? '',
    });
  }, [moduleConfig]);

  const initialValues = useMemo(
    () => ({
      recipeId: isEdit && editingRecipe ? editingRecipe.recipeId : recipeConfig.autoGenerate ? `${recipeConfig.prefix}${recipeConfig.nextNumber}` : '',
      name: isEdit && editingRecipe ? editingRecipe.name : '',
      processes: isEdit && editingRecipe ? editingRecipe.processes?.map(process => process.id) : [],
      remarks: isEdit && editingRecipe ? editingRecipe.remarks : '',
    }),
    [isEdit, editingRecipe, recipeConfig]
  );

  const onFinish = async values => {
    if (loading) return;
    const payload = {
      recipeId: values.recipeId,
      name: values.name,
      processes: values.processes,
      remarks: values.remarks,
    };
    const action = isEdit
      ? await updateRecipe({
          id: editingRecipe.id,
          name: values.name,
          processes: values.processes,
          remarks: values.remarks,
        })
      : await addRecipe(payload);
    if (action?.payload) {
      onFormSubmit();
      handleModalClose();
    }
  };

  return (
    <CustomModal
      modalOpen={modalOpen}
      setModalOpen={open => {
        if (!open) handleModalClose();
      }}
      destroyOnClose={true}
      width={700}
      title={isEdit ? 'Edit Recipe' : 'Add Recipe'}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} validationSchema={recipeValidateSchema} onSubmit={onFinish}>
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm }) => {
          const selectedProcesses = values.processes?.map(id => processDrop?.find(p => p.id === id))?.filter(Boolean);

          return (
            <CustomForm onFinish={handleSubmit} layout="vertical">
              <CustomInput
                type="text"
                name="recipeId"
                label="Recipe Id"
                className="mb-2"
                value={values.recipeId}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.recipeId}
                touched={touched.recipeId}
                setFieldValue={setFieldValue}
                disabled
              />
              <CustomInput
                type="text"
                className="mb-2"
                name="name"
                label="Recipe Name"
                placeholder="Enter Recipe Name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.name}
                touched={touched.name}
                setFieldValue={setFieldValue}
                required={true}
              />
              <div className="mb-2">
                <CustomLabel label="Processes" name="processes" required={true} />
                <CustomInput
                  type="select"
                  name="processes"
                  placeholder="Select Process"
                  value={values.processes}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  errorMessage={errors.processes}
                  touched={touched.processes}
                  setFieldValue={setFieldValue}
                  mode="multiple"
                  selectOptions={(processDrop || []).map(process => ({
                    label: process.name,
                    value: process.id,
                  }))}
                  loading={processDropLoading}
                  required={true}
                />
              </div>
              {selectedProcesses.length > 0 && (
                <div className="mb-2">
                  <div className="max-h-[300px] overflow-y-auto p-2 rounded-lg">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 bg-[#f6f7fb] w-[36px]" />
                          <th className="border px-2 py-1 bg-[#f6f7fb]">Sequence</th>
                          <th className="border px-2 py-1 bg-[#f6f7fb]">Process Name</th>
                          <th className="border px-2 py-1 bg-[#f6f7fb]">Process No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProcesses.map((process, index) => (
                          <tr
                            key={process.id}
                            draggable
                            onDragStart={e => {
                              setDraggedItem(process.id);
                              if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={e => e.preventDefault()}
                            onDragEnter={e => {
                              e.preventDefault();
                              if (!draggedItem || draggedItem === process.id) return;
                              const next = [...values.processes];
                              const from = next.indexOf(draggedItem);
                              const to = next.indexOf(process.id);
                              [next[from], next[to]] = [next[to], next[from]];
                              setFieldValue('processes', next);
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              setDraggedItem(undefined);
                            }}
                            onDragEnd={() => setDraggedItem(undefined)}
                            className={`hover:bg-blue-50 transition-all duration-200 cursor-move ${draggedItem === process.id ? 'opacity-50 bg-gray-100' : ''}`}
                          >
                            <td className="border text-center w-[36px] align-middle p-1">
                              <span className="cursor-move inline-flex p-1" title="Drag to reorder">
                                <Icons.DragOutlined className="text-gray-400" />
                              </span>
                            </td>
                            <td className="border px-2 py-1 text-center">{index + 1}</td>
                            <td className="border px-2 py-1 text-center">{process.name}</td>
                            <td className="border px-2 py-1 text-center">{process.processId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <CustomInput
                type="textarea"
                name="remarks"
                label="Remark"
                className="pt-4 pb-4"
                rows={3}
                placeholder="Enter Remarks"
                value={values.remarks}
                onChange={handleChange}
                onBlur={handleBlur}
                errorMessage={errors.remarks}
                touched={touched.remarks}
                setFieldValue={setFieldValue}
                required={true}
              />
              <div className="flex gap-4 justify-end items-center pt-7">
                <CustomButton
                  className="px-7 py-4"
                  text="Cancel"
                  type="default"
                  disabled={loading}
                  onClick={() => {
                    resetForm();
                    handleModalClose();
                  }}
                />
                <CustomButton className="px-7 py-4" text="Save" type="primary" loading={loading} onClick={handleSubmit} />
              </div>
            </CustomForm>
          );
        }}
      </Formik>
    </CustomModal>
  );
};

export default RecipeForm;
