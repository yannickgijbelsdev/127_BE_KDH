import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Copy, Check } from 'lucide-react';

const TwoFASetup = () => {
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/2fa-setup-status`);
      const data = await response.json();
      
      if (data.is_configured) {
        // Already configured, redirect to login
        navigate('/admin/2fa-login');
      } else {
        // Generate setup
        generateSetup();
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      setLoading(false);
    }
  };

  const generateSetup = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/2fa-setup`, {
        method: 'POST'
      });
      const data = await response.json();
      setSetupData(data);
    } catch (error) {
      console.error('Error generating setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202124] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#303134] rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">2FA Setup</h1>
          <p className="text-gray-400">Stel twee-factor authenticatie in voor admin toegang</p>
        </div>

        {setupData && (
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-[#202124] rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Download Authenticator App</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Download één van deze apps op je smartphone:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-6 list-disc">
                    <li>Google Authenticator</li>
                    <li>Microsoft Authenticator</li>
                    <li>Authy</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#202124] rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-white mb-2">Scan QR Code</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Open de authenticator app en scan deze QR code:
                  </p>
                  <div className="flex justify-center bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={`data:image/svg+xml,${encodeURIComponent(setupData.qr_code_uri)}`}
                      alt="QR Code"
                      className="w-64 h-64"
                      onError={(e) => {
                        // Fallback: show QR from backend endpoint
                        e.target.src = `${process.env.REACT_APP_BACKEND_URL}/api/admin/2fa-qr-code`;
                      }}
                    />
                  </div>
                  <p className="text-gray-400 text-xs text-center mb-4">
                    Of voer handmatig deze secret key in:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={setupData.secret}
                      readOnly
                      className="flex-1 px-4 py-2 bg-[#303134] border border-gray-600 rounded text-white font-mono text-sm"
                    />
                    <button
                      onClick={copySecret}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Gekopieerd!' : 'Kopieer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#202124] rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Sla Secret Op</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    Voeg de secret key toe aan je <code className="bg-[#303134] px-2 py-1 rounded text-blue-400">.env</code> bestand:
                  </p>
                  <div className="bg-[#303134] rounded p-4 font-mono text-sm text-green-400">
                    TOTP_SECRET="{setupData.secret}"
                  </div>
                  <p className="text-yellow-500 text-xs mt-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Belangrijk: Herstart de backend na het opslaan!
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#202124] rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div className="w-full">
                  <h3 className="text-lg font-semibold text-white mb-2">Klaar!</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Na het opslaan en herstarten, gebruik je email + 6-cijferige code uit de app om in te loggen.
                  </p>
                  <button
                    onClick={() => navigate('/admin/2fa-login')}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-white transition-colors"
                  >
                    Ga naar Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFASetup;
