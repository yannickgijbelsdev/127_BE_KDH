import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const SimpleAdminLogin = () => {
  const navigate = useNavigate();

  const handleDirectLogin = () => {
    // Direct login zonder form
    const token = btoa(JSON.stringify({
      email: 'yannick@radiogroep.be',
      role: 'admin',
      timestamp: Date.now()
    }));
    
    localStorage.setItem('admin_token', token);
    localStorage.setItem('adminUser', JSON.stringify({
      id: 'admin',
      email: 'yannick@radiogroep.be',
      username: 'Yannick',
      role: 'admin'
    }));
    
    // Force reload
    window.location.href = '/localhost/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#202124] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_tool-metrics/artifacts/w5126i9x_127_2025_Official_Logo.png"
            alt="127 Logo"
            className="w-24 h-24 mx-auto mb-4 filter brightness-110 hover:brightness-125 transition-all"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400">127 | Yannick Tools</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#303134] rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-xl text-white mb-6">Welkom terug, Yannick!</h2>
            
            <button
              onClick={handleDirectLogin}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors text-lg"
            >
              Inloggen als Admin
            </button>
            
            <p className="text-gray-500 text-sm mt-4">
              Klik om toegang te krijgen tot het admin dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminLogin;
