import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
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
import FeedbackAdmin from './components/admin/FeedbackAdmin';
import ToolSuggestionsAdmin from './components/admin/ToolSuggestionsAdmin';
import AutosoftDashboard from './components/admin/AutosoftDashboard';
import AdminNavBar from './components/admin/AdminNavBar';
import ExitFeedback from './components/ExitFeedback';

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

    // Disable keyboard shortcuts for dev tools
    const handleKeyDown = (e) => {
      if (!isAdminLoggedIn) {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
        if (
          e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
          (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
          (e.ctrlKey && e.shiftKey && e.keyCode === 67) // Ctrl+Shift+C
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Disable text selection and copy
    const handleSelectStart = (e) => {
      if (!isAdminLoggedIn) {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e) => {
      if (!isAdminLoggedIn) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
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

  // Don't show admin nav on login page or when not logged in
  const isLoginPage = location.pathname === '/localhost';
  const showAdminNav = isAdminLoggedIn && !isLoginPage;

  if (checkingSetup) {
    return <div className="min-h-screen bg-[#202124] flex items-center justify-center">
      <div className="text-[#e8eaed]">Loading...</div>
    </div>;
  }

  return (
    <div className="App">
      {showAdminNav && <AdminNavBar />}
      <ExitFeedback />
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
        <Route 
          path="/localhost/feedback" 
          element={
            <ProtectedRoute>
              <FeedbackAdmin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/localhost/suggestions" 
          element={
            <ProtectedRoute>
              <ToolSuggestionsAdmin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/autosoft" 
          element={
            <ProtectedRoute>
              <AutosoftDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;