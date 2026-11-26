/** Mirrors THIRD_PARTY_PROVIDERS in the backend's utils/enum.js — keep in sync. */
export const THIRD_PARTY_PROVIDERS = {
  FYNAMICS: 'Fynamics',
};

export const PROVIDER_OPTIONS = [{ value: THIRD_PARTY_PROVIDERS.FYNAMICS, label: 'Fynamics' }];

export const getProviderOption = platformName => PROVIDER_OPTIONS.find(option => option.value === platformName);
