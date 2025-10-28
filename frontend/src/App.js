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
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ToolEditor from './components/admin/ToolEditor';
import Analytics from './components/admin/Analytics';
import AdminNavBar from './components/admin/AdminNavBar';

function AppContent() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem('admin_token')
  );
  const location = useLocation();

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

  const ProtectedRoute = ({ children }) => {
    return isAdminLoggedIn ? children : <Navigate to="/localhost" />;
  };

  // Don't show admin nav on login page
  const isLoginPage = location.pathname === '/localhost';

  return (
    <>
      {!isLoginPage && <AdminNavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/dpd" element={<PixelTest />} />
        <Route path="/printer" element={<PrinterTest />} />
        <Route path="/sscreen" element={<ScreenTest />} />
        <Route path="/wea" element={<WebcamAudioTest />} />
        <Route path="/password" element={<PasswordGenerator />} />
        
        {/* Admin Routes on /localhost */}
        <Route path="/localhost" element={<AdminLogin onLogin={handleLogin} />} />
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