import { useEffect } from 'react';

import { errorsToTouched } from '@/utils/util';

/**
 * Render inside a tab's own <Formik>. Each time the parent form's submitCount increases,
 * it validates this tab's form and marks the errored fields as touched, so their errors show.
 */
const ShowErrorsOnParentSubmit = ({ parentSubmitCount, validateForm, setTouched }) => {
  useEffect(() => {
    if (!parentSubmitCount) return;
    validateForm().then(errors => {
      if (errors && Object.keys(errors).length > 0) {
        setTouched(errorsToTouched(errors), false);
      }
    });
  }, [parentSubmitCount, validateForm, setTouched]);
  return null;
};

export default ShowErrorsOnParentSubmit;
