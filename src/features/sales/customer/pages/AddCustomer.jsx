import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';

// Components
import BackButton from '@/components/ui/button/BackButton';
import { Select, Tabs, Tooltip } from '@/components/AntDComponent';
import BusinessPartnerTeam from '../components/BusinessPartnerTeam';
import CustomerAddress from '../components/CustomerAddress';
import CustomerBranch from '../components/CustomerBranch';
import OtherDetails, { priceListToId } from '../components/OtherDetails';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import Icons from 'assets/icons/icon';
import CodeConfigModal from '@/components/feedback/formModal/CodeConfigModal';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomFileUpload from '@/components/forms/formUpload/CustomFileUpload';
import CustomForm from '@/components/forms/formInput/CustomForm';
import CustomInput from '@/components/forms/formInput/CustomInput';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import Toast from '@/components/ui/common/Toast';
import { buildCustomerSelectOptions, customerSelectColumnHeader, vendorSelectColumnHeader } from '@/utils/tableSelectDropdown/customerSelectDropdown';

// Hooks
import { useBranch } from '@/features/allMaster/branch/useBranch';
import useFormDirtyState from '@/hooks/useFormDirtyState';
import { useInvoice } from '@/features/sales/invoice/useInvoice';
import { useModuleConfig } from 'hooks/useModuleConfig';
import { useProfile } from '@/features/setting/profile/useProfile';
import useScrollToError from 'hooks/useScrollToError';
import { useLocation as useLocationMaster } from '@/features/common/location/useLocation';

// Extras
import {
  useCustomer,
  customerMasterValidateSchema,
  customerAddressValidateSchema,
  otherDetailsValidateSchema,
  addAddress,
  addBranches,
  addBusinessPartnerTeam,
  addOtherDetails,
  buildVendorCopyFromCustomer,
  buildCustomerCopyFromVendor,
  isCustomerLinkedToVendor,
  isVendorLinkedToCustomer,
} from '@/features/sales/customer';
import { ADDITIONAL_FEATURES, MODULE_NAMES, PARTY_ACCOUNT_TYPES, PARTY_ACCOUNT_TYPE_LABELS } from 'utils/constants';
import { findStateName, findStateNameByRegionCode } from '@/utils/locationHelpers';
import { errorsToTouched } from '@/utils/util';
import { transformPayload } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { ADD_CUSTOMER_TABS, DEFAULT_ADD_CUSTOMER_TAB } from '@/utils/tabs';

const AddCustomer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const [activeTab, setActiveTab] = useState(DEFAULT_ADD_CUSTOMER_TAB);
  // Bumped on each Save that fails validation, so the tab forms mark their errored fields as touched
  const [saveAttempt, setSaveAttempt] = useState(0);
  const {
    submitLoading,
    customerDetail,
    branches,
    businessPartner = [],
    address,
    otherDetails = {},
    vendorDropDownList,
    customerDropDownList,
    loading: customerMasterLoading,
    createCustomer,
    updateCustomerData,
    getCustomerById,
    resetCustomer,
    getVendorDropList,
    getCustomerDropList,
    resetVendorDropDownList,
    resetCustomerDropDownList,
  } = useCustomer();
  const { branch, getBranch } = useBranch();
  const { fetchGstinDetails, fetchGstinLoading: gstinFetchLoading } = useInvoice();
  const { fetchStatesByCountryIso } = useLocationMaster();
  const { activeFeatures } = useProfile();
  const { currencyId: baseCurrencyId } = useCompanyCurrency();
  const isEinvoicingAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.E_INVOICE_AND_E_WAY_BILL];
  const isOnlyEWayBillAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.ONLY_E_WAY_BILL];
  const isCustomerOrderAppAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const showGstinPrefillOption = isEinvoicingAvailable || isOnlyEWayBillAvailable;
  const customerData = customerDetail;
  const isVendorPage = window.location.href.includes('vendors');
  const copyFromCustomerId = !customerId && isVendorPage ? location.state?.copyFromCustomerId : null;
  const copyFromVendorId = !customerId && !isVendorPage ? location.state?.copyFromVendorId : null;
  const copySourceId = copyFromCustomerId || copyFromVendorId;

  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [customerConfig, setCustomerConfig] = useState({
    autoGenerate: true,
    prefix: '',
    nextNumber: '',
  });
  const [showGstinPrefillModal, setShowGstinPrefillModal] = useState(false);
  const [gstinPrefillInput, setGstinPrefillInput] = useState('');
  const [gstinPrefillError, setGstinPrefillError] = useState('');
  const { moduleConfig, loading: moduleConfigLoading, getModuleConfig, resetModuleConfig } = useModuleConfig();

  const formikRef = useRef();
  const customerBranchRef = useRef();
  const scrollToError = useScrollToError();
  // Store File objects separately (can't store in Redux)
  const attachmentsRef = useRef([]);

  // Callback to update attachments from OtherDetails
  const updateAttachments = useCallback(files => {
    attachmentsRef.current = Array.isArray(files) ? files : [];
  }, []);

  const handleConfigModalVisibility = () => {
    setIsConfigModalVisible(!isConfigModalVisible);
  };

  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  /** Normalize GST API response - supports two formats: camelCase and PascalCase */
  const normalizeGstResponse = useCallback(raw => {
    if (!raw) return null;
    const isPascal = raw.TradeName != null || raw.Gstin != null || raw.AddrLoc != null;
    if (isPascal) {
      const street1 = [raw.AddrBno, raw.AddrBnm].filter(Boolean).join(' ').trim();
      return {
        tradeName: raw.TradeName ?? raw.tradeName ?? '',
        legalName: raw.LegalName ?? raw.legalName ?? '',
        gstin: raw.Gstin ?? raw.gstin ?? '',
        address1: street1 || (raw.address1 ?? ''),
        address2: raw.AddrSt ?? raw.address2 ?? '',
        city: raw.AddrLoc ?? raw.city ?? '',
        pinCode: raw.AddrPncd != null ? String(raw.AddrPncd) : (raw.pinCode ?? ''),
        stateCode: raw.StateCode != null ? raw.StateCode : raw.stateCode,
        stateName: raw.pradr?.addr?.stcd ?? '',
      };
    }
    return {
      tradeName: raw.tradeName ?? '',
      legalName: raw.legalName ?? '',
      gstin: raw.gstin ?? '',
      address1: raw.address1 ?? '',
      address2: raw.address2 ?? '',
      city: raw.city ?? '',
      pinCode: raw.pinCode ?? '',
      stateCode: raw.stateCode,
    };
  }, []);

  const handleFetchGstinDetails = useCallback(async () => {
    const gstin = gstinPrefillInput?.trim?.();
    setGstinPrefillError('');
    if (!gstin) {
      setGstinPrefillError('Please enter GSTIN');
      return;
    }
    if (!GSTIN_REGEX.test(gstin.toUpperCase())) {
      setGstinPrefillError('Invalid GSTIN format');
      return;
    }
    try {
      const response = await fetchGstinDetails({ gstin: gstin.toUpperCase() });
      const rawData = response?.data?.data;
      const gstData = normalizeGstResponse(rawData);
      if (formikRef.current && gstData) {
        const tradeOrLegal = gstData.tradeName || gstData.legalName || '';
        formikRef.current.setFieldValue('companyName', tradeOrLegal);
        formikRef.current.setFieldValue('customerDisplayName', tradeOrLegal);
        dispatch(
          addOtherDetails({
            ...otherDetails,
            taxPreference: otherDetails?.taxPreference || 'Taxable',
            currency: priceListToId(otherDetails?.currency) || baseCurrencyId || null,
            gstTreatment: 'Registered Business Regular',
            gstinUin: gstData.gstin || gstin.toUpperCase(),
          })
        );
        const states = await fetchStatesByCountryIso('IN');
        const stateName = findStateNameByRegionCode(states, gstData.stateCode) ?? findStateName(states, gstData.stateName);
        const currentBilling = address?.billing ?? {};
        const currentShipping = address?.shipping ?? {};
        dispatch(
          addAddress({
            billing: {
              ...currentBilling,
              attention: currentBilling.attention ?? '',
              country: currentBilling.country ?? 'India',
              address: {
                street1: gstData.address1 || currentBilling.address?.street1 || '',
                street2: gstData.address2 || currentBilling.address?.street2 || '',
              },
              city: gstData.city || currentBilling.city || '',
              state: stateName ?? currentBilling.state,
              pinCode: gstData.pinCode || currentBilling.pinCode || '',
              faxNumber: currentBilling.faxNumber ?? '',
              phone: currentBilling.phone ?? '',
            },
            shipping: currentShipping,
          })
        );
      }
      setShowGstinPrefillModal(false);
      setGstinPrefillInput('');
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch details';
      setGstinPrefillError(message);
    }
  }, [gstinPrefillInput, otherDetails, address, dispatch, normalizeGstResponse, fetchGstinDetails, fetchStatesByCountryIso, baseCurrencyId]);

  const handleCloseGstinPrefillModal = useCallback(() => {
    setShowGstinPrefillModal(false);
    setGstinPrefillInput('');
    setGstinPrefillError('');
  }, []);

  const setGstinPrefillModalOpen = useCallback(open => {
    if (!open) {
      setGstinPrefillInput('');
      setGstinPrefillError('');
    }
    setShowGstinPrefillModal(open);
  }, []);

  const handleSaveClick = useCallback(async () => {
    if (submitLoading || !formikRef.current) return;

    const errors = await formikRef.current.validateForm();

    let otherDetailsErrors = {};
    try {
      await otherDetailsValidateSchema.validate(otherDetails ?? {}, { abortEarly: false });
    } catch (err) {
      otherDetailsErrors = (err.inner ?? [{ path: err.path, message: err.message }]).reduce((acc, { path, message }) => {
        if (path) acc[path] = message;
        return acc;
      }, {});
    }

    let addressErrors = {};
    try {
      await customerAddressValidateSchema.validate(address ?? {}, { abortEarly: false });
    } catch (err) {
      addressErrors = (err.inner ?? [{ path: err.path, message: err.message }]).reduce((acc, { path, message }) => {
        if (path) acc[path] = message;
        return acc;
      }, {});
    }

    let customerBranchErrors = {};
    if (customerBranchRef.current) {
      try {
        customerBranchErrors = await customerBranchRef.current.validateForm();
      } catch {
        customerBranchErrors = {};
      }
    }

    const allErrors = { ...errors, ...otherDetailsErrors, ...addressErrors, ...customerBranchErrors };

    if (Object.keys(allErrors).length > 0) {
      formikRef.current.setTouched(errorsToTouched(errors));
      setSaveAttempt(count => count + 1);
      // Main form errors scroll first, so only switch tab when the main form is valid
      if (Object.keys(errors).length === 0) {
        if (Object.keys(otherDetailsErrors).length > 0) {
          setActiveTab(ADD_CUSTOMER_TABS.OTHER_DETAILS);
        } else if (Object.keys(addressErrors).length > 0) {
          setActiveTab(ADD_CUSTOMER_TABS.ADDRESS);
        } else if (Object.keys(customerBranchErrors).length > 0) {
          setActiveTab(ADD_CUSTOMER_TABS.BRANCH);
        }
      }
      const firstErrorField = Object.keys(allErrors)[0];
      // Delay so a tab opened for the first time has rendered before scrolling
      setTimeout(() => scrollToError(firstErrorField, allErrors), 100);
      return;
    }

    formikRef.current.handleSubmit();
  }, [submitLoading, scrollToError, otherDetails, address]);

  const items = useMemo(
    () => [
      {
        key: ADD_CUSTOMER_TABS.OTHER_DETAILS,
        label: 'Other Details',
        children: (
          <OtherDetails
            updateAttachments={updateAttachments}
            isCustomerOrderAppAvailable={isCustomerOrderAppAvailable}
            isEdit={!!customerId}
            isVendorPage={isVendorPage}
            parentSubmitCount={saveAttempt}
          />
        ),
      },
      {
        key: ADD_CUSTOMER_TABS.ADDRESS,
        label: 'Address',
        children: <CustomerAddress parentSubmitCount={saveAttempt} />,
      },
      {
        key: ADD_CUSTOMER_TABS.BRANCH,
        label: 'Branch',
        children: <CustomerBranch ref={customerBranchRef} parentSubmitCount={saveAttempt} />,
      },
      {
        key: ADD_CUSTOMER_TABS.BUSINESS_PARTNER_TEAM,
        label: 'Business Partner Team',
        children: <BusinessPartnerTeam />,
      },
    ],
    [customerDetail, updateAttachments, isCustomerOrderAppAvailable, isVendorPage, customerId, saveAttempt]
  );

  const handleBranchInitialValues = () => {
    let finalBranch = [];

    if (branch?.length > 0 && (customerId || copySourceId)) {
      finalBranch = [...(customerData?.branch || [])];
      branch?.forEach(x => {
        let isExistsInResponse = finalBranch?.find(y => x?.id === y?.branchId?._id || x?.id === y?.branchId?.id || x?.id === y?.branchId);

        if (!isExistsInResponse) {
          finalBranch.push({
            branchId: {
              _id: x?.id,
              name: x?.name,
            },
            divisionId: {
              _id: x?.divisionId?._id || x?.divisionId?.id || x?.divisionId,
              name: x?.divisionId?.name,
            },
            divisionName: x?.divisionId?.name,
            branchName: x?.name,
            branchCode: x?.branchCode,
            openingBalance: '',
            currentBalance: 0,
            creditLimit: 0,
            isSplitBalance: false,
            isActive: false,
            restrictedModule: [],
            paymentTermsId: null,
            restrictedPaymentTermsModule: [],
          });
        }
      });
    } else {
      finalBranch = customerData?.branch?.length > 0 ? customerData?.branch : branch;
    }

    return finalBranch;
  };

  useEffect(() => {
    if (customerId) {
      const od = customerData?.otherDetails;
      dispatch(addOtherDetails(od ? { ...od, priceList: priceListToId(od.priceList), currency: priceListToId(od.currency) } : od));
      dispatch(addAddress(customerData?.address));
      dispatch(addBusinessPartnerTeam(customerData?.businessPartnerTeam ?? []));
      dispatch(
        addBranches({
          branch:
            handleBranchInitialValues()?.map((b, index) => {
              return {
                key: index,
                branchId: b?.branchId?.id || b?.branchId?._id || b?.branchId || b?.id || '',
                branchName: b?.branchId?.name || b?.name || b?.branchName || '',
                divisionId: b?.divisionId?._id || b?.divisionId?.id || b?.divisionId || '',
                divisionName: b?.divisionName || b?.divisionId?.name || '',
                branchCode: b?.branchCode || b?.code || '',
                openingBalance: b?.openingBalance || '',
                initialOpeningBalance: b?.openingBalance || 0,
                currentBalance: b?.currentBalance || 0,
                creditLimit: b?.creditLimit || 0,
                isSplitBalance: b?.isSplitBalance || false,
                isActive: b?.isActive || false,
                restrictedModule: b?.restrictedModule,
                paymentTermsId: b?.paymentTermsId?._id || b?.paymentTermsId?.id || b?.paymentTermsId || null,
                restrictedPaymentTermsModule: b?.restrictedPaymentTermsModule,
              };
            }) || [],
          useBranchCreditLimit: customerData?.useBranchCreditLimit,
          creditLimit: customerData?.creditLimit,
          restrictedModule: customerData?.restrictedModule,
          useBranchPaymentTerms: customerData?.useBranchPaymentTerms,
          paymentTermsId: customerData?.paymentTermsId?._id || customerData?.paymentTermsId?.id || customerData?.paymentTermsId || null,
          restrictedPaymentTermsModule: customerData?.restrictedPaymentTermsModule,
        })
      );
    } else if (copySourceId && customerData) {
      const copied = copyFromCustomerId ? buildVendorCopyFromCustomer(customerData, copyFromCustomerId) : buildCustomerCopyFromVendor(customerData, copyFromVendorId);
      if (!copied) return;

      dispatch(
        addOtherDetails({
          ...copied.otherDetails,
          currency: priceListToId(copied.otherDetails?.currency),
          priceList: null,
        })
      );
      dispatch(addAddress(copied.address));
      dispatch(addBusinessPartnerTeam(copied.businessPartnerTeam ?? []));
      dispatch(
        addBranches({
          branch: handleBranchInitialValues()?.map(copied.mapBranchRow) || [],
          ...copied.branchSettings,
        })
      );
    } else {
      let branchData = {
        branch: [],
        useBranchCreditLimit: false,
        creditLimit: 0,
        restrictedModule: [],
        useBranchPaymentTerms: false,
        paymentTermsId: null,
        restrictedPaymentTermsModule: [],
      };

      dispatch(
        addBranches({
          branch:
            handleBranchInitialValues()?.map((b, index) => {
              return {
                key: index,
                branchId: b?.branchId?.id || b?.branchId?._id || b?.branchId || b?.id || '',
                branchName: b?.branchId?.name || b?.name || b?.branchName || '',
                divisionId: b?.divisionId?._id || b?.divisionId?.id || b?.divisionId || '',
                divisionName: b?.divisionName || b?.divisionId?.name || '',
                branchCode: b?.branchCode || b?.code || '',
                openingBalance: b?.openingBalance || '',
                initialOpeningBalance: b?.openingBalance || 0,
                currentBalance: b?.currentBalance || 0,
                creditLimit: b?.creditLimit || 0,
                isSplitBalance: b?.isSplitBalance || false,
                isActive: b?.isActive || false,
                restrictedModule: b?.restrictedModule,
                paymentTermsId: b?.paymentTermsId?._id || b?.paymentTermsId?.id || b?.paymentTermsId || null,
                restrictedPaymentTermsModule: b?.restrictedPaymentTermsModule,
              };
            }) || [],
          useBranchCreditLimit: branchData?.useBranchCreditLimit,
          creditLimit: branchData?.creditLimit,
          restrictedModule: branchData?.restrictedModule,
          useBranchPaymentTerms: branchData?.useBranchPaymentTerms,
          paymentTermsId: branchData?.paymentTermsId,
          restrictedPaymentTermsModule: branchData?.restrictedPaymentTermsModule,
        })
      );
    }
  }, [dispatch, customerData, customerId, branch, copySourceId, copyFromCustomerId, copyFromVendorId]);

  useEffect(() => {
    const controller = new AbortController();
    const signalPayload = { signal: controller.signal };
    getBranch({ pagination: false, signal: controller.signal });

    if (isVendorPage) {
      if (!customerId) {
        getModuleConfig({
          ...signalPayload,
          moduleName: MODULE_NAMES.VENDOR,
        });
      }
      getCustomerDropList({ signal: controller.signal });
    } else {
      if (!customerId) {
        getModuleConfig({
          ...signalPayload,
          moduleName: MODULE_NAMES.CUSTOMER,
        });
      }
      getVendorDropList({ signal: controller.signal });
    }

    return () => {
      resetModuleConfig();
      resetCustomerDropDownList();
      resetVendorDropDownList();
      controller.abort();
    };
  }, [isVendorPage, customerId]);

  useEffect(() => {
    const controller = new AbortController();
    if (customerId) {
      getCustomerById({ customerId, signal: controller.signal });
    } else if (copySourceId) {
      getCustomerById({ customerId: copySourceId, signal: controller.signal });
    } else {
      resetCustomer();
    }
    return () => {
      resetCustomer();
      controller.abort();
    };
  }, [customerId, copySourceId]);

  useEffect(() => {
    if (!copySourceId || !customerData) return;
    if (copyFromCustomerId && isCustomerLinkedToVendor(customerData)) {
      Toast.error('This customer is already linked to a vendor.');
      navigate(-1);
      return;
    }
    if (copyFromVendorId && isVendorLinkedToCustomer(customerData)) {
      Toast.error('This vendor is already linked to a customer.');
      navigate(-1);
    }
  }, [copySourceId, copyFromCustomerId, copyFromVendorId, customerData, navigate]);

  useEffect(() => {
    if (moduleConfig) {
      setCustomerConfig({
        autoGenerate: moduleConfig?.useCustomPrefix ?? true,
        prefix: moduleConfig?.prefix ?? '',
        nextNumber: moduleConfig?.nextSequence ?? '',
      });
    }
  }, [moduleConfig]);

  useEffect(() => {
    if (formikRef.current && !customerId && customerConfig) {
      const newCustomerNumber = customerConfig.autoGenerate ? `${customerConfig.prefix}${customerConfig.nextNumber}` : '';
      formikRef.current.setFieldValue('customerNumber', newCustomerNumber);
    }
  }, [customerConfig, customerId]);

  const initialValues = useMemo(() => {
    const generatedNumber = customerConfig?.autoGenerate ? `${customerConfig?.prefix ?? ''}${customerConfig?.nextNumber ?? ''}` : '';

    if (copyFromCustomerId && customerData) {
      const copied = buildVendorCopyFromCustomer(customerData, copyFromCustomerId);
      return {
        ...copied.formValues,
        customerNumber: generatedNumber,
        accountType: PARTY_ACCOUNT_TYPES.ACCOUNTS_PAYABLE,
        isDirectTax: false,
      };
    }

    if (copyFromVendorId && customerData) {
      const copied = buildCustomerCopyFromVendor(customerData, copyFromVendorId);
      return {
        ...copied.formValues,
        customerNumber: generatedNumber,
        accountType: PARTY_ACCOUNT_TYPES.ACCOUNTS_RECEIVABLE,
        isDirectTax: false,
      };
    }

    return {
      firstname: customerData ? customerData?.bpPrimaryContactName?.firstName : '',
      lastname: customerData ? customerData?.bpPrimaryContactName?.lastName : '',
      businessPartnerType: customerData ? customerData?.businessPartnerType : 'Business',
      companyName: customerData ? customerData?.companyName : '',
      customerDisplayName: customerData ? customerData?.customerDisplayName : '',
      bpEmail: customerData ? customerData?.bpEmail : '',
      customerPhoneNumber: customerData ? customerData?.customerPhoneNumber : '',
      companyLogo: customerData ? customerData?.companyLogo : null,
      remarks: customerData?.remarks || '',
      customerNumber: customerData?.customerNumber ? customerData?.customerNumber : generatedNumber,
      isCustomer: customerData?.Role?.isCustomer ? customerData?.Role?.isCustomer : isVendorPage ? false : true,
      isVendor: customerData?.Role?.isVendor ? customerData?.Role?.isVendor : isVendorPage ? true : false,
      linked: customerData?.isLinkedToVendor || false,
      linkedId: customerData?.customerId || customerData?.vendorId || '',
      accountType: isVendorPage ? PARTY_ACCOUNT_TYPES.ACCOUNTS_PAYABLE : customerData?.accountType || PARTY_ACCOUNT_TYPES.ACCOUNTS_RECEIVABLE,
      isDirectTax: isVendorPage ? !!customerData?.isVendorDirectTax : !!customerData?.isCustomerDirectTax,
    };
  }, [customerData, customerConfig, isVendorPage, copyFromCustomerId, copyFromVendorId]);

  // Comprehensive hook that handles all dirty form logic
  const fieldsToIgnore = ['customerNumber'];
  const { handleNavigation, navigateAfterSave, updateFormValues } = useFormDirtyState(initialValues, fieldsToIgnore);

  const onFinish = async values => {
    if (submitLoading) return;

    let branchDetails = branches?.branch?.map(x => {
      return {
        branchId: x?.branchId?._id || x?.branchId?.id || x?.branchId,
        branchCode: x?.branchCode,
        divisionId: x?.divisionId?._id || x?.divisionId?.id || x?.divisionId,
        openingBalance: parseFloat(x?.openingBalance || 0),
        currentBalance: customerId ? parseFloat(x?.currentBalance || 0) : parseFloat(x?.openingBalance || 0),
        isSplitBalance: !!x?.isSplitBalance,
        isActive: x?.isActive || false,
        ...(branches?.useBranchCreditLimit && { creditLimit: parseFloat(x?.creditLimit || 0) }),
        ...(branches?.useBranchCreditLimit && { restrictedModule: x?.restrictedModule || [] }),
        ...(branches?.useBranchPaymentTerms && x?.paymentTermsId && { paymentTermsId: x.paymentTermsId }),
        ...(branches?.useBranchPaymentTerms && {
          restrictedPaymentTermsModule: x?.restrictedPaymentTermsModule || [],
        }),
      };
    });

    // Normalize attachments: only File instances or URL strings (never upload metadata objects)
    const toFileOrString = item => {
      if (item instanceof File) return item;
      if (typeof item === 'string') return item;
      if (item?.originFileObj instanceof File) return item.originFileObj;
      return null;
    };
    const fromRef = (attachmentsRef.current || []).map(toFileOrString).filter(Boolean);
    const fromForm = Array.isArray(values.attachments) ? values.attachments.map(toFileOrString).filter(Boolean) : [];
    const existingDocUrls = Array.isArray(otherDetails?.document) ? otherDetails.document.filter(doc => typeof doc === 'string') : [];
    const allNormalized = [...fromRef, ...fromForm, ...existingDocUrls];
    const newFiles = allNormalized.filter(x => x instanceof File);
    const urlStrings = [...new Set(allNormalized.filter(x => typeof x === 'string'))];

    // otherDetails without file fields (no document/attachments metadata in payload)
    const otherDetailsSource = otherDetails || {};
    const restOtherDetails = Object.keys(otherDetailsSource).reduce((acc, key) => {
      if (key !== 'document' && key !== 'attachments') acc[key] = otherDetailsSource[key];
      return acc;
    }, {});
    const otherDetailsPayload = {
      ...restOtherDetails,
      document: [],
    };

    let customerData = {
      bpPrimaryContactName: {
        firstName: values.firstname,
        lastName: values.lastname,
      },
      businessPartnerType: values.businessPartnerType,
      Role: {
        isCustomer: copyFromCustomerId ? false : copyFromVendorId ? true : values.isCustomer,
        isVendor: copyFromCustomerId ? true : copyFromVendorId ? false : values.isVendor,
      },
      ...(!isVendorPage && !copyFromCustomerId && { accountType: values.accountType }),
      [isVendorPage ? 'isVendorDirectTax' : 'isCustomerDirectTax']: values.isDirectTax,
      companyName: values.companyName,
      customerDisplayName: values.customerDisplayName,
      bpEmail: values.bpEmail,
      customerPhoneNumber: values.customerPhoneNumber,
      customerNumber: values.customerNumber,
      otherDetails: otherDetailsPayload,
      address: {
        billing: address?.billing,
        shipping: address?.shipping,
      },
      remarks: values.remarks,
      businessPartnerTeam: businessPartner ?? [],
      branch: branchDetails,
      useBranchCreditLimit: typeof branches?.useBranchCreditLimit === 'boolean' ? branches.useBranchCreditLimit : false,
      ...(!branches?.useBranchCreditLimit && {
        creditLimit: parseFloat(branches?.creditLimit || 0),
      }),
      useBranchPaymentTerms: typeof branches?.useBranchPaymentTerms === 'boolean' ? branches.useBranchPaymentTerms : false,
      ...(values.companyLogo != null &&
        values.companyLogo !== '' && {
          companyLogo: values.companyLogo,
        }),
    };

    // Transform only non-file fields (transformPayload would turn File into empty objects)
    const { companyLogo: logo, ...rest } = customerData;
    const isLinkedToVendor = copySourceId ? true : values?.linked || false;
    const restrictedModule = !branches?.useBranchCreditLimit ? branches?.restrictedModule || [] : [];
    const paymentTermsId = !branches?.useBranchPaymentTerms ? branches?.paymentTermsId || null : null;
    const restrictedPaymentTermsModule = !branches?.useBranchPaymentTerms ? branches?.restrictedPaymentTermsModule || [] : [];
    const linkedIdValue = copySourceId ? copySourceId : isLinkedToVendor && values?.linkedId ? values.linkedId : null;

    customerData = {
      ...transformPayload(rest),
      ...(logo != null && logo !== '' && { companyLogo: logo }),
      otherDetails: {
        ...customerData.otherDetails,
        document: [...newFiles, ...urlStrings],
      },
      isLinkedToVendor,
      restrictedModule,
      paymentTermsId,
      restrictedPaymentTermsModule,
      ...(isVendorPage ? { customerId: linkedIdValue } : { vendorId: linkedIdValue }),
    };

    const result = customerId ? await updateCustomerData({ customerId, customerData }) : await createCustomer(customerData);
    const saved = result?.data?.customer;
    const targetId = customerId || saved?.id || saved?._id;
    const detailsPath = isVendorPage ? `/vendors/${targetId}` : `/customer-master/${targetId}`;

    if (targetId) {
      navigateAfterSave(detailsPath, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    } else {
      navigateAfterSave(-1);
    }
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const goBack = () => {
    if (isVendorPage) {
      handleNavigation(-1);
    } else {
      handleNavigation(-1);
    }
  };

  if ((customerId || copySourceId) && customerMasterLoading) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  return (
    <>
      <div className="fixed-header fixed top-14 ml-[1px] bg-white py-2 border-b">
        <div className="flex items-center justify-between space-x-4 h-full px-4">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">
                {customerId
                  ? `Edit ${isVendorPage ? 'Vendor' : 'Customer'}`
                  : copyFromCustomerId
                    ? 'Add Vendor (Copied from Customer)'
                    : copyFromVendorId
                      ? 'Add Customer (Copied from Vendor)'
                      : `Add ${isVendorPage ? 'Vendor' : 'Customer'}`}
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white pt-16 -m-4">
        <div className="relative pb-24">
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={customerMasterValidateSchema(customerConfig?.autoGenerate, !isVendorPage && !!isCustomerOrderAppAvailable && !!otherDetails?.enablePortal)}
            onSubmit={onFinish}
            enableReinitialize
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
              // Update form values for dirty checking
              updateFormValues(values);
              let dropDownArr = isVendorPage ? customerDropDownList || [] : vendorDropDownList || [];
              let dropDownForLinked = dropDownArr?.filter(x => !x?.isLinked);
              let existingLinkedData = dropDownArr?.find(x => (x?._id || x?.id) === values?.linkedId);
              let finalDropdownForLinked = [...dropDownForLinked];
              if (existingLinkedData) {
                finalDropdownForLinked.push(existingLinkedData);
              } else if (copySourceId && customerData && values?.linkedId) {
                finalDropdownForLinked.push({
                  _id: values.linkedId,
                  id: values.linkedId,
                  customerDisplayName: customerData?.customerDisplayName,
                });
              }
              return (
                <CustomForm name="Add-customer" onFinish={handleSubmit} onFinishFailed={onFinishFailed}>
                  <div className="px-6 flex flex-col gap-2">
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <h3 className="text-[15px] font-semibold text-gray-900 m-0 mb-3">{isVendorPage ? 'Vendor details' : 'Customer details'}</h3>
                      {showGstinPrefillOption && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded border border-blue-200 bg-blue-50/80 text-gray-800 mb-4" role="region" aria-label="Prefill from GST">
                          <Icons.DownloadOutlined style={{ color: colorPalette.primary[500] }} className="text-lg shrink-0" />
                          <span className="text-sm flex-1">
                            Prefill {isVendorPage ? 'Vendor' : 'Customer'} details from the GST portal using the {isVendorPage ? 'Vendor' : 'Customer'}'s GSTIN.
                          </span>
                          <button
                            type="button"
                            style={{ color: colorPalette.primary[500] }}
                            className="font-medium text-sm hover:underline shrink-0 flex items-center gap-0.5"
                            onClick={() => setShowGstinPrefillModal(true)}
                          >
                            Prefill <span className="ml-0.5">&gt;</span>
                          </button>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7">
                        <CustomInput
                          type="text"
                          name="customerNumber"
                          label={isVendorPage ? 'Vendor ID' : 'Customer ID'}
                          placeholder={isVendorPage ? 'Enter Vendor ID' : 'Enter Customer ID'}
                          value={values.customerNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.customerNumber}
                          touched={touched.customerNumber}
                          setFieldValue={setFieldValue}
                          required={!customerConfig?.autoGenerate}
                          disabled={customerConfig?.autoGenerate || !!customerId}
                          suffix={
                            !customerId && (
                              <Tooltip title={isVendorPage ? 'Configure Vendor Number' : 'Configure Customer Number'}>
                                <Icons.SettingOutlined style={{ color: colorPalette.primary[500] }} onClick={handleConfigModalVisibility} />
                              </Tooltip>
                            )
                          }
                        />
                        <CustomInput
                          type="text"
                          name="firstname"
                          label="BP Primary Contact Name"
                          placeholder="Enter First Name"
                          value={values.firstname}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.firstname}
                          touched={touched.firstname}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          type="text"
                          name="lastname"
                          placeholder="Enter Last Name"
                          value={values.lastname}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.lastname}
                          touched={touched.lastname}
                          setFieldValue={setFieldValue}
                          className="mt-[25px]"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          name="businessPartnerType"
                          label="Business Partner Type"
                          type="radio"
                          // value={1}
                          value={values.businessPartnerType}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.businessPartnerType}
                          touched={touched.businessPartnerType}
                          setFieldValue={setFieldValue}
                          radioOptions={[
                            { value: 'Business', label: 'Business' },
                            { value: 'Individual', label: 'Individual' },
                          ]}
                          required={true}
                        />
                        <div>
                          <div>Direct Tax</div>
                          <CustomInput
                            type="checkbox"
                            name="isDirectTax"
                            CheckboxName="TDS / TCS applicable"
                            value={values.isDirectTax}
                            errorMessage={errors.isDirectTax}
                            touched={touched.isDirectTax}
                            setFieldValue={setFieldValue}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="text"
                          name="companyName"
                          label="Company Name"
                          placeholder="Enter Company Name"
                          value={values.companyName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.companyName}
                          touched={touched.companyName}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <CustomInput
                          type="text"
                          name="customerDisplayName"
                          label={isVendorPage ? 'Vendor Display Name' : 'Customer Display Name'}
                          placeholder={isVendorPage ? 'Enter Vendor Display Name' : 'Enter Customer Display Name'}
                          value={values.customerDisplayName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.customerDisplayName}
                          touched={touched.customerDisplayName}
                          setFieldValue={setFieldValue}
                          required={true}
                        />
                        <div className="flex flex-col">
                          <CustomInput
                            type="select"
                            name="accountType"
                            label="Account Type"
                            placeholder="Select Account Type"
                            value={values.accountType}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.accountType}
                            touched={touched.accountType}
                            setFieldValue={setFieldValue}
                            selectOptions={
                              isVendorPage
                                ? [PARTY_ACCOUNT_TYPES.ACCOUNTS_PAYABLE].map(value => ({ label: PARTY_ACCOUNT_TYPE_LABELS[value], value }))
                                : [PARTY_ACCOUNT_TYPES.ACCOUNTS_RECEIVABLE, PARTY_ACCOUNT_TYPES.BRANCH_DIVISIONS].map(value => ({
                                    label: PARTY_ACCOUNT_TYPE_LABELS[value],
                                    value,
                                  }))
                            }
                            required={true}
                            disabled={isVendorPage}
                          />
                          {values.accountType === PARTY_ACCOUNT_TYPES.BRANCH_DIVISIONS && (
                            <p className="m-0 mb-3 text-xs text-gray-500">One of your own branches or divisions, used on internal stock transfer delivery challans.</p>
                          )}
                        </div>
                      </div>
                      {!isVendorPage && !!customerId && !!customerData?.otherDetails?.isCustomerPortalActivated && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded border border-green-200 bg-green-50/80 text-gray-800 mb-2" role="status" aria-label="Portal invitation accepted">
                          <Icons.CheckCircleOutlined className="text-green-600 text-lg shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-green-800">Portal invitation accepted</span>
                            <p className="text-xs text-green-700 mt-0.5">This customer has activated their portal access. The email address is locked and cannot be changed.</p>
                          </div>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="email"
                          name="bpEmail"
                          label="Email"
                          placeholder="Enter Email"
                          value={values.bpEmail}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.bpEmail}
                          touched={touched.bpEmail}
                          setFieldValue={setFieldValue}
                          required={!!isCustomerOrderAppAvailable && !!otherDetails?.enablePortal}
                          disabled={!!customerId && !!customerData?.otherDetails?.isCustomerPortalActivated}
                        />
                        <CustomInput
                          type="number"
                          name="customerPhoneNumber"
                          label={isVendorPage ? 'Vendor Phone Number' : 'Customer Phone Number'}
                          placeholder={isVendorPage ? 'Enter Vendor Phone Number' : 'Enter Customer Phone Number'}
                          value={values.customerPhoneNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          errorMessage={errors.customerPhoneNumber}
                          touched={touched.customerPhoneNumber}
                          setFieldValue={setFieldValue}
                          addonBefore={
                            <div className="phone-selection">
                              <Select defaultValue="+91">
                                <Select.Option value="+91">+91</Select.Option>
                              </Select>
                            </div>
                          }
                        />
                      </div>
                      <div className="grid md:grid-cols-1 lg:grid-cols-3 items-end gap-x-7 pt-2">
                        <CustomFileUpload
                          name="companyLogo"
                          label="Company Logo"
                          value={values.companyLogo}
                          setFieldValue={setFieldValue}
                          onBlur={handleBlur}
                          errorMessage={errors.companyLogo}
                          touched={touched.companyLogo}
                          fileType="image"
                          multiple={false}
                          maxSize={5}
                          compact={true}
                        />
                        <div className="lg:col-span-1">
                          <CustomInput
                            type="textarea"
                            name="remarks"
                            label="Remarks"
                            placeholder="Enter Remarks"
                            value={values.remarks}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.remarks}
                            touched={touched.remarks}
                            setFieldValue={setFieldValue}
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-7 pt-2">
                        <CustomInput
                          type="checkbox"
                          name="linked"
                          label=" "
                          CheckboxName={`Linked to the ${isVendorPage ? 'Customer' : 'Vendor'}`}
                          value={values.linked}
                          onChange={e => {
                            if (copySourceId) return;
                            const checked = e.target.checked;
                            setFieldValue('linked', checked);
                            if (!checked) {
                              setFieldValue('linkedId', '');
                            }
                          }}
                          onBlur={handleBlur}
                          errorMessage={errors.linked}
                          touched={touched.linked}
                          setFieldValue={setFieldValue}
                          disabled={!!copySourceId}
                        />
                        {values?.linked && (
                          <CustomInput
                            type="select"
                            name="linkedId"
                            label={`${isVendorPage ? 'Customer' : 'Vendor'} Name`}
                            value={values.linkedId}
                            onChange={copySourceId ? undefined : handleChange}
                            onBlur={handleBlur}
                            errorMessage={errors.linkedId}
                            touched={touched.linkedId}
                            setFieldValue={copySourceId ? undefined : setFieldValue}
                            placeholder={`Select ${isVendorPage ? 'Customer' : 'Vendor'}`}
                            selectVariant="twoColumn"
                            columnSelectHeader={isVendorPage ? customerSelectColumnHeader : vendorSelectColumnHeader}
                            selectOptions={buildCustomerSelectOptions(finalDropdownForLinked).map(opt => {
                              const source = (finalDropdownForLinked || []).find(v => String(v.id ?? v._id) === String(opt.value));
                              return { ...opt, value: source?._id ?? opt.value };
                            })}
                            loading={customerMasterLoading}
                            required={true}
                            disabled={!!copySourceId}
                            notFoundContent={<div className="flex items-center justify-center w-full">{`No ${isVendorPage ? 'Customer' : 'Vendor'} Available`}</div>}
                          />
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                      <Tabs defaultActiveKey={DEFAULT_ADD_CUSTOMER_TAB} activeKey={activeTab} items={items} onChange={setActiveTab} />
                    </div>
                  </div>
                  <div className="fixed-footer flex items-center justify-between gap-5 py-[12.5px] px-12 border-t bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-5 flex-wrap">
                      <CustomButton className="px-8 py-4 min-w-[50px]" type="primary" text="Save" loading={submitLoading} onClick={handleSaveClick} />
                      <CustomButton className="px-8 py-4" type="default" text="Cancel" disabled={submitLoading} onClick={goBack} />
                    </div>
                  </div>
                </CustomForm>
              );
            }}
          </Formik>
        </div>
        <CodeConfigModal
          isVisible={isConfigModalVisible}
          onCancel={handleConfigModalVisibility}
          loading={moduleConfigLoading}
          initialConfig={customerConfig}
          title={isVendorPage ? 'Configure Vendor Number Preferences' : 'Configure Customer Number Preferences'}
          description={
            isVendorPage
              ? 'Auto-generating vendor numbers can save your time. Would you like to change your current setting?'
              : 'Auto-generating customer numbers can save your time. Would you like to change your current setting?'
          }
          setConfigDetail={setCustomerConfig}
          moduleName={isVendorPage ? MODULE_NAMES.VENDOR : MODULE_NAMES.CUSTOMER}
        />
        {showGstinPrefillOption && (
          <CustomModal modalOpen={showGstinPrefillModal} setModalOpen={setGstinPrefillModalOpen} title="Prefill from GSTIN" width={440} destroyOnClose>
            <div className="space-y-4">
              <CustomInput
                type="text"
                name="gstinPrefill"
                label="GSTIN"
                placeholder={`Enter ${isVendorPage ? 'Vendor' : 'Customer'} GSTIN`}
                value={gstinPrefillInput}
                onChange={e => {
                  setGstinPrefillInput(e.target.value);
                  if (gstinPrefillError) setGstinPrefillError('');
                }}
                onBlur={() => {}}
                errorMessage={gstinPrefillError}
                touched={!!gstinPrefillError}
                setFieldValue={(_, value) => setGstinPrefillInput(value ?? '')}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <CustomButton type="default" text="Cancel" onClick={handleCloseGstinPrefillModal} disabled={gstinFetchLoading} />
                <CustomButton type="primary" text={gstinFetchLoading ? 'Fetching...' : 'Fetch'} onClick={handleFetchGstinDetails} disabled={gstinFetchLoading} loading={gstinFetchLoading} />
              </div>
            </div>
          </CustomModal>
        )}
      </div>
    </>
  );
};

export default AddCustomer;
