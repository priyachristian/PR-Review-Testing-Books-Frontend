import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BankOutlined, DollarOutlined, EnvironmentOutlined, FileTextOutlined, IdcardOutlined, MailOutlined, NumberOutlined, PhoneOutlined, ProfileOutlined, PushpinOutlined } from '@ant-design/icons';

import { Card, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomInput from '@/components/forms/formInput/CustomInput';
import Toast from '@/components/ui/common/Toast';
import AddEditCurrencyModal from '@/features/setting/currency/components/AddEditCurrencyModal';
import CompanyCodeSection from '@/features/setting/user/components/CompanyCodeSection';

import { useProfile } from '@/features/setting/profile/useProfile';
import { useCurrency } from '@/features/setting/currency/useCurrency';
import { useLocationCascade } from '@/hooks/useLocationCascade';
import useScrollToError from '@/hooks/useScrollToError';

import Icons from '@/assets/icons/icon';
import { updateCompany } from 'features/auth/authSlice';
import { filterEmptyFields } from 'utils/services';
import { colorPalette } from 'utils/theme';
import { DATE_FORMAT_OPTIONS, FISCAL_YEAR_OPTIONS, ORGANIZATION_LANGUAGE_OPTIONS } from '@/utils/constants';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, getProfile, refreshCompanyProfile, updateProfile } = useProfile();
  const scrollToError = useScrollToError();
  const { updateCurrency, saving: currencySaving } = useCurrency();
  const [logo, setLogo] = useState('');
  const [sign, setSign] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [signFile, setSignFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [signPreviewUrl, setSignPreviewUrl] = useState(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isSignDragging, setIsSignDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [baseCurrencyModalOpen, setBaseCurrencyModalOpen] = useState(false);
  const logoInputRef = useRef(null);
  const signInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactPhone: '',
    street1: '',
    street2: '',
    city: '',
    state: null,
    country: null,
    pinCode: '',
    faxNumber: '',
    gstNumber: '',
    panNumber: '',
    iec: '',
    fiscalYear: '',
    organizationLanguage: '',
    timeZone: '',
    dateFormat: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    if (profile) {
      dispatch(updateCompany(profile));
      setLogo(profile?.companyLogo || '');
      setSign(profile?.authorizedSignature || '');
      setLogoFile(null);
      setSignFile(null);
      setLogoPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSignPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFormData({
        name: profile?.name || '',
        email: profile?.email || '',
        contactPhone: profile?.contactPhone || '',
        street1: profile?.address?.street1 || '',
        street2: profile?.address?.street2 || '',
        city: profile?.address?.city || '',
        state: profile?.address?.state || null,
        country: profile?.address?.country || null,
        pinCode: profile?.address?.pinCode || '',
        faxNumber: profile?.address?.faxNumber || '',
        gstNumber: profile?.gstNumber || '',
        iec: profile?.iec || '',
        panNumber: profile?.panNumber || '',
        fiscalYear: profile?.fiscalYear || '',
        organizationLanguage: profile?.organizationLanguage || '',
        timeZone: profile?.timeZone || '',
        dateFormat: profile?.dateFormat || '',
      });
    }
  }, [profile, dispatch]);

  const handleCancelClick = () => {
    setLogo(profile?.companyLogo || '');
    setSign(profile?.authorizedSignature || '');
    setLogoFile(null);
    setSignFile(null);
    setLogoPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSignPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (profile) {
      setFormData({
        name: profile?.name || '',
        email: profile?.email || '',
        contactPhone: profile?.contactPhone || '',
        street1: profile?.address?.street1 || '',
        street2: profile?.address?.street2 || '',
        city: profile?.address?.city || '',
        state: profile?.address?.state || null,
        country: profile?.address?.country || null,
        pinCode: profile?.address?.pinCode || '',
        faxNumber: profile?.address?.faxNumber || '',
        gstNumber: profile?.gstNumber || '',
        iec: profile?.iec || '',
        panNumber: profile?.panNumber || '',
        fiscalYear: profile?.fiscalYear || '',
        organizationLanguage: profile?.organizationLanguage || '',
        timeZone: profile?.timeZone || '',
        dateFormat: profile?.dateFormat || '',
      });
    }
    setErrors({});
    navigate('/setting');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Company name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.contactPhone?.trim()) newErrors.contactPhone = 'Phone number is required';
    if (!formData.gstNumber?.trim()) newErrors.gstNumber = 'GST number is required';
    if (!formData.panNumber?.trim()) newErrors.panNumber = 'PAN number is required';
    if (!formData.street1?.trim()) newErrors.street1 = 'Street address is required';
    if (!formData.country?.trim()) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city?.trim()) newErrors.city = 'City is required';
    if (!formData.pinCode?.trim()) newErrors.pinCode = 'PIN code is required';
    setErrors(newErrors);
    return newErrors;
  };

  const handleSaveClick = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      scrollToError(Object.keys(newErrors)[0], newErrors);
      return;
    }
    setIsSaving(true);
    try {
      const profileData = {
        name: formData.name,
        email: formData.email,
        contactPhone: formData.contactPhone,
        address: {
          street1: formData.street1,
          street2: formData.street2,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pinCode: formData.pinCode,
          faxNumber: formData.faxNumber,
        },
        gstNumber: formData.gstNumber,
        iec: formData?.iec,
        panNumber: formData.panNumber,
        fiscalYear: formData.fiscalYear || null,
        organizationLanguage: formData.organizationLanguage || null,
        dateFormat: formData.dateFormat || null,
      };
      if (logoFile) profileData.companyLogo = logoFile;
      else if (logo) profileData.companyLogo = logo;
      if (signFile) profileData.authorizedSignature = signFile;
      else if (sign) profileData.authorizedSignature = sign;
      const filteredProfileData = filterEmptyFields(profileData);
      await updateProfile({ profileData: filteredProfileData });
      await getProfile({});
      setLogoFile(null);
      setSignFile(null);
      setLogoPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSignPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (error) {
      console.error('Profile update error:', error);
      Toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleBaseCurrencySubmit = async values => {
    const currencyId = profile?.baseCurrency?._id || profile?.baseCurrency?.id;
    const body = {
      code: String(values.code).trim().toUpperCase(),
      symbol: values.symbol,
      name: values.name,
      decimalPlaces: values.decimalPlaces,
      format: values.format || undefined,
    };

    try {
      await updateCurrency({ currencyId, body });
      setBaseCurrencyModalOpen(false);
      await refreshCompanyProfile({});
    } catch {
      // Errors and success Toast are handled in currency.slice.js
    }
  };

  const locationFields = useLocationCascade({
    country: formData.country,
    state: formData.state,
    fieldPathPrefix: '',
    setFieldValue: handleInputChange,
  });

  const handleLogoSelect = file => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      Toast.error('Only PNG and JPG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('File size must be up to 5MB.');
      return;
    }
    setLogoPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setLogoFile(file);
  };

  const handleSignSelect = file => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      Toast.error('Only PNG and JPG files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('File size must be up to 5MB.');
      return;
    }
    setSignPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSignFile(file);
  };

  const logoDisplayUrl = logoPreviewUrl || logo;
  const signDisplayUrl = signPreviewUrl || sign;
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e, setDraggingState) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingState(false);
  };
  const handleDrop = (e, setDraggingState, onSelect) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingState(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="mx-auto">
        <div className="bg-white shadow-sm border border-t-0 border-gray-200 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-start py-[6px]">
            <div>
              <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Company Profile</h3>
              <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure your company information, tax details, and address</p>
            </div>
          </div>
        </div>

        <div>
          <CompanyCodeSection className="border-t-0" />

          <Card className="shadow-sm rounded-none border border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#7c3bed1a] rounded-lg flex items-center justify-center">
                  <ProfileOutlined className="text-[#7c3bed] text-lg" />
                </div>
                <div>
                  <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Basic Details</h3>
                  <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Essential company information and branding</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    errorMessage={errors.name}
                    touched={!!errors.name}
                    className="w-full custom-input"
                    prefix={<BankOutlined className="text-gray-500" />}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    id="email"
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    errorMessage={errors.email}
                    touched={!!errors.email}
                    className="w-full"
                    prefix={<MailOutlined className="text-gray-500" />}
                  />
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor="contactPhone" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <CustomInput
                  id="contactPhone"
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={e => handleInputChange('contactPhone', e.target.value)}
                  errorMessage={errors.contactPhone}
                  touched={!!errors.contactPhone}
                  className="w-full"
                  prefix={<PhoneOutlined className="text-gray-500" />}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="block text-sm font-medium leading-none text-[#030711] mb-2">Company Logo</div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isLogoDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setIsLogoDragging(true)}
                    onDragLeave={e => handleDragLeave(e, setIsLogoDragging)}
                    onDrop={e => handleDrop(e, setIsLogoDragging, handleLogoSelect)}
                  >
                    {logoDisplayUrl ? (
                      <div className="space-y-4 flex flex-col items-center">
                        <img className="h-20 w-20 object-contain" src={logoDisplayUrl} alt="logo" />
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            ref={logoInputRef}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoSelect(file);
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ color: colorPalette.primary[500] }} className="inline-block text-sm font-medium">
                            Change Logo
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <input
                            type="file"
                            ref={logoInputRef}
                            accept="image/png,image/jpeg"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoSelect(file);
                            }}
                            className="hidden"
                          />
                          <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => logoInputRef.current?.click()}>
                            Drop your logo here or click to browse
                          </button>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="block text-sm font-medium leading-none text-[#030711] mb-2">Digital Signature</div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isSignDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setIsSignDragging(true)}
                    onDragLeave={e => handleDragLeave(e, setIsSignDragging)}
                    onDrop={e => handleDrop(e, setIsSignDragging, handleSignSelect)}
                  >
                    {signDisplayUrl ? (
                      <div className="space-y-4 flex flex-col items-center">
                        <img className="h-20 w-20 object-contain" src={signDisplayUrl} alt="signature" />
                        <label className="relative cursor-pointer">
                          <input
                            type="file"
                            ref={signInputRef}
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleSignSelect(file);
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ color: colorPalette.primary[500] }} className="inline-block text-sm font-medium">
                            Change Signature
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div>
                          <input
                            type="file"
                            ref={signInputRef}
                            accept="image/png,image/jpeg"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleSignSelect(file);
                            }}
                            className="hidden"
                          />
                          <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => signInputRef.current?.click()}>
                            Drop signature here or click to browse
                          </button>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm rounded-none border border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#7c3bed1a] rounded-lg flex items-center justify-center">
                  <FileTextOutlined className="text-[#7c3bed] text-lg" />
                </div>
                <div>
                  <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Tax Information</h3>
                  <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">GST and PAN details for compliance</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                      GSTIN <span className="text-red-500">*</span>
                    </label>
                    <CustomInput
                      id="gstNumber"
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={e => handleInputChange('gstNumber', e.target.value)}
                      errorMessage={errors.gstNumber}
                      touched={!!errors.gstNumber}
                      className="w-full font-mono"
                      prefix={<NumberOutlined className="text-gray-500" />}
                    />
                    <p className="text-xs text-gray-500 mt-1">15-digit GST Identification Number</p>
                  </div>
                  <div>
                    <label htmlFor="panNumber" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                      PAN Number <span className="text-red-500">*</span>
                    </label>
                    <CustomInput
                      id="panNumber"
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={e => handleInputChange('panNumber', e.target.value)}
                      errorMessage={errors.panNumber}
                      touched={!!errors.panNumber}
                      className="w-full font-mono"
                      prefix={<IdcardOutlined className="text-gray-500" />}
                    />
                    <p className="text-xs text-gray-500 mt-1">10-character alphanumeric PAN</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="iec" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                      Import Export Code
                    </label>
                    <CustomInput
                      id="iec"
                      type="text"
                      name="iec"
                      value={formData.iec}
                      onChange={e => handleInputChange('iec', e.target.value)}
                      errorMessage={errors.iec}
                      touched={!!errors.iec}
                      className="w-full font-mono"
                      prefix={<NumberOutlined className="text-gray-500" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm rounded-none border border-gray-200">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#16a2491a] rounded-lg flex items-center justify-center">
                  <EnvironmentOutlined className="text-[#16a249] text-lg" />
                </div>
                <div>
                  <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Address Details</h3>
                  <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Company location and contact information</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="street1" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                      Street Address 1 <span className="text-red-500">*</span>
                    </label>
                    <CustomInput
                      id="street1"
                      type="text"
                      name="street1"
                      value={formData.street1}
                      onChange={e => handleInputChange('street1', e.target.value)}
                      errorMessage={errors.street1}
                      touched={!!errors.street1}
                      className="w-full"
                      prefix={<EnvironmentOutlined className="text-gray-500" />}
                    />
                  </div>
                  <div>
                    <label htmlFor="street2" className="block text-sm font-medium leading-none text-[#030711] mb-2">
                      Street Address 2
                    </label>
                    <CustomInput
                      id="street2"
                      type="text"
                      name="street2"
                      value={formData.street2}
                      onChange={e => handleInputChange('street2', e.target.value)}
                      errorMessage={errors.street2}
                      touched={!!errors.street2}
                      className="w-full"
                      prefix={<EnvironmentOutlined className="text-gray-500" />}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-row gap-3">
                    <div className="w-1/2">
                      <span className="block text-sm font-medium leading-none text-[#030711] mb-2">
                        Country <span className="text-red-500">*</span>
                      </span>
                      <CustomInput
                        type="select"
                        name="country"
                        placeholder="Select Country"
                        value={formData?.country}
                        onFocus={locationFields.handleCountryFocus}
                        onChange={value => locationFields.onCountryChange(value)}
                        onBlur={() => {}}
                        errorMessage={errors.country}
                        touched={!!errors.country}
                        setFieldValue={(name, value) => handleInputChange(name, value)}
                        selectOptions={locationFields.countryOptions}
                        loading={locationFields.countriesLoading}
                        required={true}
                      />
                    </div>
                    <div className="w-1/2">
                      <span className="block text-sm font-medium leading-none text-[#030711] mb-2">
                        State <span className="text-red-500">*</span>
                      </span>
                      <CustomInput
                        id="state"
                        type="select"
                        placeholder="Select State"
                        name="state"
                        value={formData.state}
                        onChange={value => locationFields.onStateChange(value)}
                        errorMessage={errors.state}
                        touched={!!errors.state}
                        setFieldValue={(name, value) => handleInputChange(name, value)}
                        selectOptions={locationFields.stateOptions}
                        loading={locationFields.statesLoading}
                        disabled={locationFields.stateDisabled}
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-3">
                    <div className="w-1/2">
                      <span className="block text-sm font-medium leading-none text-[#030711] mb-2">
                        City <span className="text-red-500">*</span>
                      </span>
                      <CustomInput
                        id="city"
                        type="select"
                        name="city"
                        placeholder="Select City"
                        value={formData.city}
                        onChange={value => locationFields.onCityChange(value)}
                        errorMessage={errors.city}
                        touched={!!errors.city}
                        setFieldValue={(name, value) => handleInputChange(name, value)}
                        selectOptions={locationFields.cityOptions}
                        loading={locationFields.citiesLoading}
                        disabled={locationFields.cityDisabled}
                      />
                    </div>
                    <div className="w-1/2">
                      <span className="block text-sm font-medium leading-none text-[#030711] mb-2">
                        PIN Code <span className="text-red-500">*</span>
                      </span>
                      <CustomInput
                        id="pinCode"
                        type="text"
                        placeholder="Enter PIN Code"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={e => handleInputChange('pinCode', e.target.value)}
                        errorMessage={errors.pinCode}
                        touched={!!errors.pinCode}
                        className="w-full"
                        prefix={<PushpinOutlined className="text-gray-500" />}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium leading-none text-[#030711] mb-2">Fax Number</span>
                  <CustomInput
                    id="faxNumber"
                    type="text"
                    name="faxNumber"
                    value={formData.faxNumber}
                    onChange={e => handleInputChange('faxNumber', e.target.value)}
                    errorMessage={errors.faxNumber}
                    touched={!!errors.faxNumber}
                    className="w-full"
                    prefix={<PhoneOutlined className="text-gray-500" />}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm rounded-none border border-gray-200 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#0284c71a] rounded-lg flex items-center justify-center shrink-0">
                  <DollarOutlined className="text-[#0284c7] text-lg" />
                </div>
                <div>
                  <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Organization Preferences</h3>
                  <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Configure key financial preferences used across your organization.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#030711] mb-2">
                    Base Currency
                    <Tooltip title="Your transactions and financial reports will be shown in the base currency.">
                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
                    </Tooltip>
                  </div>
                  <CustomInput
                    type="text"
                    name="baseCurrency"
                    value={profile?.baseCurrency?.code || ''}
                    placeholder="Not configured"
                    disabled
                    className="w-full"
                    suffix={
                      <Tooltip title="Edit base currency">
                        <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} className="cursor-pointer" onClick={() => setBaseCurrencyModalOpen(true)} />
                      </Tooltip>
                    }
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium leading-none text-[#030711] mb-2">Fiscal Year</span>
                  <CustomInput
                    type="select"
                    name="fiscalYear"
                    placeholder="Select fiscal year"
                    value={formData.fiscalYear}
                    onChange={value => handleInputChange('fiscalYear', value)}
                    setFieldValue={(name, value) => handleInputChange(name, value)}
                    selectOptions={FISCAL_YEAR_OPTIONS}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium leading-none text-[#030711] mb-2">Organization Language</span>
                  <CustomInput
                    type="select"
                    name="organizationLanguage"
                    placeholder="Select language"
                    value={formData.organizationLanguage}
                    onChange={value => handleInputChange('organizationLanguage', value)}
                    setFieldValue={(name, value) => handleInputChange(name, value)}
                    selectOptions={ORGANIZATION_LANGUAGE_OPTIONS}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium leading-none text-[#030711] mb-2">
                    Time Zone
                    <Tooltip title="Value comes from your company profile (country and city). It is read-only here.">
                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
                    </Tooltip>
                  </div>
                  <CustomInput type="text" name="timeZone" value={formData.timeZone || ''} placeholder="" disabled className="w-full" />
                </div>
                <div>
                  <span className="block text-sm font-medium leading-none text-[#030711] mb-2">Date Format</span>
                  <CustomInput
                    type="select"
                    name="dateFormat"
                    placeholder="Select date format"
                    value={formData.dateFormat}
                    onChange={value => handleInputChange('dateFormat', value)}
                    setFieldValue={(name, value) => handleInputChange(name, value)}
                    selectOptions={DATE_FORMAT_OPTIONS}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {baseCurrencyModalOpen && profile?.baseCurrency ? (
        <AddEditCurrencyModal
          modalOpen={baseCurrencyModalOpen}
          setModalOpen={setBaseCurrencyModalOpen}
          initialCurrency={profile?.baseCurrency}
          title="Edit base currency"
          onSubmit={handleBaseCurrencySubmit}
          saving={currencySaving}
          codeDisabled
        />
      ) : null}

      <div className="flex items-center gap-5 py-[12.5px] px-12 border-t bg-white fixed bottom-0 left-[220px] right-0 z-40">
        <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" onClick={handleSaveClick} loading={isSaving} />
        <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={handleCancelClick} disabled={isSaving} />
      </div>
    </div>
  );
};

export default ProfilePage;
