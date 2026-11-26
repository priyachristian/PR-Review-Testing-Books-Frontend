import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const getCompany = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.SETUP.GET);
  return response.data;
}, 'getCompany');

const createSetupCharge = withErrorHandling(async payload => {
  const { name = '', modules = [], isActive = false, isTaxable = false, taxRate = '' } = payload;

  const response = await axiosConfig.post(API_ROUTES.SETUP.CREATE_SETUP, {
    name,
    modules,
    isActive,
    isTaxable,
    ...(isTaxable && { taxRate }),
  });
  return response.data;
}, 'createSetupCharge');

const updateSetupCharge = withErrorHandling(async payload => {
  const { chargeName, chargeData } = payload;
  const response = await axiosConfig.put(API_ROUTES.SETUP.UPDATE_SETUP_CHARGE(chargeName), chargeData);
  return response.data;
}, 'updateSetupCharge');

const deleteSetupCharge = withErrorHandling(async payload => {
  const { chargeName } = payload;
  const response = await axiosConfig.delete(API_ROUTES.SETUP.DELETE_SETUP_CHARGE(chargeName));
  return response.data;
}, 'deleteSetupCharge');

export const setupChargeService = {
  getCompany,
  createSetupCharge,
  updateSetupCharge,
  deleteSetupCharge,
};
