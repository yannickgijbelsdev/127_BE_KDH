import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import PixelTest from './components/PixelTest';
import PrinterTest from './components/PrinterTest';
import ScreenTest from './components/ScreenTest';
import WebcamAudioTest from './components/WebcamAudioTest';
import PasswordGenerator from './components/PasswordGenerator';
import AdminLogin from './components/admin/AdminLogin';
import AdminSetup from './components/admin/AdminSetup';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ToolEditor from './components/admin/ToolEditor';
import Analytics from './components/admin/Analytics';
import AdminNavBar from './components/admin/AdminNavBar';

function AppContent() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem('admin_token')
  );
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const location = useLocation();

  // Check if setup is needed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/needs-setup`);
        const data = await response.json();
        setNeedsSetup(data.needs_setup);
      } catch (err) {
        console.error('Failed to check setup status:', err);
      } finally {
        setCheckingSetup(false);
      }
    };
    
    checkSetup();
  }, []);

  // Check session on location change
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAdminLoggedIn(!!token);
  }, [location]);

  // Disable right-click when not logged in
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!isAdminLoggedIn) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isAdminLoggedIn]);

  const handleLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    setIsAdminLoggedIn(true);
  };

  const ProtectedRoute = ({ children }) => {
    if (checkingSetup) {
      return <div className="min-h-screen bg-[#202124] flex items-center justify-center">
        <div className="text-[#e8eaed]">Loading...</div>
      </div>;
    }
    
    if (needsSetup) {
      return <AdminSetup onSetupComplete={handleSetupComplete} />;
    }
    
    return isAdminLoggedIn ? children : <Navigate to="/localhost" />;
  };

  // Don't show admin nav on login page
  const isLoginPage = location.pathname === '/localhost';

  if (checkingSetup) {
    return <div className="min-h-screen bg-[#202124] flex items-center justify-center">
      <div className="text-[#e8eaed]">Loading...</div>
    </div>;
  }

  return (
    <>
      {!isLoginPage && <AdminNavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dpd" element={<PixelTest />} />
        <Route path="/printer" element={<PrinterTest />} />
        <Route path="/sscreen" element={<ScreenTest />} />
        <Route path="/wea" element={<WebcamAudioTest />} />
        <Route path="/password" element={<PasswordGenerator />} />
        
        {/* Admin Routes on /localhost */}
        <Route 
          path="/localhost" 
          element={needsSetup ? <AdminSetup onSetupComplete={handleSetupComplete} /> : <AdminLogin onLogin={handleLogin} />} 
        />
        <Route 
          path="/localhost/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/localhost/users" 
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/localhost/tool/:toolId" 
          element={
            <ProtectedRoute>
              <ToolEditor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/localhost/analytics" 
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;