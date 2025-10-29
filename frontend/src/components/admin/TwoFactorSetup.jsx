import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Copy } from 'lucide-react';

const TwoFactorSetup = ({ userId, userEmail, onClose, onSuccess }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    enable2FA();
  }, []);

  const enable2FA = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/enable-2fa`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (response.ok) {
        setSecret(data.secret);
        // Set QR code from base64 data
        setQrCodeUrl(data.qr_code_data);
      } else {
        setError(data.detail || 'Failed to enable 2FA');
      }
    } catch (err) {
      console.error('2FA enable error:', err);
      setError('Failed to enable 2FA');
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Voer een geldige 6-cijferige code in');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${userId}/verify-2fa?totp_code=${verificationCode}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      
      if (data.valid) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Ongeldige code. Probeer opnieuw.');
      }
    } catch (err) {
      setError('Verificatie mislukt');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
      <div className="bg-[#303134] rounded-lg p-6 max-w-lg w-full border border-[#5f6368]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#8ab4f8]" />
            <h2 className="text-2xl font-bold text-[#e8eaed]">2FA Instellen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#5f6368] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#9aa0a6]" />
          </button>
        </div>

        {success ? (
          <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-green-500 font-medium">2FA succesvol ingesteld!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-[#9aa0a6] mb-4">
                Scan deze QR code met Google Authenticator, Authy, of een andere authenticator app.
              </p>
              
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="2FA QR Code"
                    className="w-64 h-64"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Manual Entry */}
              <div className="bg-[#202124] rounded-lg p-4 mb-4">
                <p className="text-sm text-[#9aa0a6] mb-2">Of voer handmatig in:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#303134] px-3 py-2 rounded text-[#8ab4f8] font-mono text-sm break-all">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="p-2 bg-[#5f6368] hover:bg-[#7a8086] rounded transition-colors"
                    title="Kopieer"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-[#e8eaed]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verification */}
              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                  Verificatie Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-[#9aa0a6] mt-2">
                  Voer de 6-cijferige code in uit je authenticator app
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-[#5f6368] hover:bg-[#7a8086] text-[#e8eaed] rounded-lg font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 px-4 py-2 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors"
              >
                Verifiëren & Activeren
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;
