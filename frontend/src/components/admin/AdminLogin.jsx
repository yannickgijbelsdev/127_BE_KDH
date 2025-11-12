import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Shield } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      console.log('Backend URL:', backendUrl);
      console.log('Attempting login to:', `${backendUrl}/api/admin/login`);
      
      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          totp_code: totpCode || null
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const data = await response.json();
        if (data.detail === '2FA code required') {
          setNeeds2FA(true);
          setError('Voer je 2FA code in');
        } else {
          setError(data.detail || 'Login failed');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Store token and user data
      try {
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      } catch (storageErr) {
        console.error('LocalStorage error:', storageErr);
        setError('Kon inloggegevens niet opslaan');
        setLoading(false);
        return;
      }
      
      // Dispatch custom event for AdminNavBar
      try {
        window.dispatchEvent(new Event('auth-change'));
      } catch (eventErr) {
        console.error('Event dispatch error:', eventErr);
        // Continue anyway, this is not critical
      }
      
      // Call onLogin callback
      try {
        if (onLogin && typeof onLogin === 'function') {
          onLogin(data.user);
        }
      } catch (callbackErr) {
        console.error('onLogin callback error:', callbackErr);
        // Continue anyway, navigation is more important
      }
      
      // Navigate to dashboard
      setLoading(false);
      navigate('/localhost/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setError(`Netwerkfout: ${err.message}. Controleer je verbinding en probeer opnieuw.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-[#8ab4f8] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#e8eaed]">Admin Login</h1>
          <p className="text-[#9aa0a6] mt-2">Toegang tot het admin paneel</p>
        </div>

        <div className="bg-[#303134] rounded-lg p-8 border border-[#5f6368]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none"
                placeholder="admin@127.be"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {needs2FA && (
              <div>
                <label className="block text-sm font-medium text-[#9aa0a6] mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  2FA Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  maxLength="6"
                  className="w-full bg-[#202124] text-[#e8eaed] px-4 py-3 rounded-lg border border-[#5f6368] focus:border-[#8ab4f8] focus:outline-none"
                  placeholder="123456"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#8ab4f8] hover:bg-[#aac8f9] text-[#202124] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Inloggen...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
