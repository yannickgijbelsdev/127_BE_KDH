import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem('admin_token')
  );

  const handleLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const ProtectedRoute = ({ children }) => {
    return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
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
      </BrowserRouter>
    </div>
  );
}

export default App;