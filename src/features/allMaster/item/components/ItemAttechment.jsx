import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Formik } from 'formik';

// Components
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';

// Extras
import { addAttechmentFileData, itemAttechmentValidateSchema } from '@/features/allMaster/item';

const ItemAttechment = ({ item }) => {
  const dispatch = useDispatch();
  const attechData = item?.attachments;

  const initialValues = useMemo(
    () => ({
      attachments: attechData || [],
    }),
    [attechData]
  );

  // Dispatch initial attachments to redux on mount
  useEffect(() => {
    dispatch(addAttechmentFileData(attechData || []));
  }, [dispatch, attechData]);

  // Sync attachments changes to redux store
  const handleFileChange = useCallback(
    files => {
      dispatch(addAttechmentFileData(files || []));
    },
    [dispatch]
  );

  // Handle file removal - also sync to redux
  const handleFileRemove = useCallback(
    files => {
      dispatch(addAttechmentFileData(files || []));
    },
    [dispatch]
  );

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="pb-28 relative">
      <Formik initialValues={initialValues} validationSchema={itemAttechmentValidateSchema} enableReinitialize>
        {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
          <CustomForm name="customer-address" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
            <div>
              <div className="grid md:grid-cols-1 lg:grid-cols-3 lg:gap-x-7 items-start">
                <CustomFileUpload
                  name="attachments"
                  label="Product Document"
                  value={values.attachments}
                  setFieldValue={setFieldValue}
                  onBlur={handleBlur}
                  errorMessage={errors.attachments}
                  touched={touched.attachments}
                  fileType="all"
                  multiple={true}
                  maxSize={5}
                  maxFiles={3}
                  onFileChange={handleFileChange}
                  onFileRemove={handleFileRemove}
                />
              </div>
            </div>
          </CustomForm>
        )}
      </Formik>
    </div>
  );
};

export default ItemAttechment;
