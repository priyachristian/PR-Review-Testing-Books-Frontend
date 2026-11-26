import { Alert } from 'antd';

const NIC_REGISTRATION_URL = import.meta.env.VITE_NIC_REGISTRATION_URL;
const GSP_NAME = import.meta.env.VITE_FYNAMICS_GSP_NAME || 'Fynamics Techno Solutions';
const GSP_CLIENT_ID = import.meta.env.VITE_FYNAMICS_GSP_CLIENT_ID;

const GstRegistrationGuide = () => (
  <Alert
    type="info"
    showIcon
    className="mb-4"
    message="How to get these credentials"
    description={
      <div className="text-xs text-[#374151] leading-relaxed">
        <p className="mb-2">
          Complete the following on the NIC portal to allow API access for e-invoice generation. This must be done
          <strong> once per GSTIN</strong>, and repeated when migrating to the NIC production environment.
        </p>
        <ol className="list-decimal ml-4 space-y-1">
          <li>
            Visit{' '}
            {NIC_REGISTRATION_URL ? (
              <a href={NIC_REGISTRATION_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                the NIC e-invoice registration page
              </a>
            ) : (
              <span className="text-red-500">NIC registration URL is not configured</span>
            )}
          </li>
          <li>
            Choose user type as <strong>Tax Payer</strong> and enter the GSTIN
          </li>
          <li>
            On the next field a pop-up appears: “You can self-register by entering the Client Id of the GSP or ERP Service provider”. Click <strong>Continue</strong>
          </li>
          <li>Enter the registered mobile number and email id of the authorised person</li>
          <li>
            Enter the captcha and click <strong>Validate</strong>. On “Successfully Validated”, click <strong>Send OTP</strong>
          </li>
          <li>
            After OTP validation, choose <strong>GSP</strong> when asked “Choose GSP or ERP”
          </li>
          <li>
            Select <strong className="text-red-600">{GSP_NAME}</strong> and enter the client id{' '}
            {GSP_CLIENT_ID ? <strong className="text-red-600">{GSP_CLIENT_ID}</strong> : <span className="text-red-500">(client id not configured)</span>}
          </li>
          <li>
            Create a username and password — <strong>record these somewhere safe</strong>, then enter them below
          </li>
          <li>Click submit; you should see “Successfully registered”</li>
          <li>E-invoices can then be generated, returning the IRN, QR code and related details</li>
        </ol>
      </div>
    }
  />
);

export default GstRegistrationGuide;
