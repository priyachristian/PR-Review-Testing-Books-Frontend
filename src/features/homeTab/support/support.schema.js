import * as Yup from 'yup';
import { SUPPORT_CATEGORY_ENUM } from '@/utils/constants';

export const supportValidationSchema = (category = SUPPORT_CATEGORY_ENUM.BUG) => {
  const isBug = category === SUPPORT_CATEGORY_ENUM.BUG || !category;
  const isNewModule = category === SUPPORT_CATEGORY_ENUM.NEW_MODULE;

  return Yup.object().shape({
    bugTitle: Yup.string()
      .trim()
      .required(isBug ? 'Bug Title is required' : 'What do you need is required'),
    priority: Yup.string().required('Priority is required'),
    moduleName: isNewModule ? Yup.string().nullable().optional() : Yup.string().required('Module is required'),
    ...(isBug
      ? {
          stepsToReproduce: Yup.array().of(Yup.object().shape({ step: Yup.string().optional() })),
          expectedBehavior: Yup.string().optional(),
          actualBehavior: Yup.string().optional(),
        }
      : {
          whyDoYouNeedIt: Yup.string().trim().required('Why do you need it is required'),
          howDoYouManageToday: Yup.string().optional(),
          whatShouldChange: Yup.string().optional(),
        }),
  });
};
